@echo off
setlocal EnableDelayedExpansion

:: HeartMuLa Studio — Start Script (Windows)
:: Starts both backend (FastAPI) and frontend (Next.js) servers

title HeartMuLa Studio

set BACKEND_PORT=8000
set FRONTEND_PORT=3000
set SCRIPT_DIR=%~dp0

echo.
echo   ========================================
echo        HeartMuLa Studio v0.1.0
echo       AI Music Generation Studio
echo   ========================================
echo.

:: Check dependencies
echo   Checking dependencies...

where uv >nul 2>&1
if %errorlevel% neq 0 (
    echo   [ERROR] uv is not installed. Install: https://docs.astral.sh/uv/
    pause
    exit /b 1
)
echo   [OK] uv found

where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo   [ERROR] pnpm is not installed. Install: npm install -g pnpm
    pause
    exit /b 1
)
echo   [OK] pnpm found
echo.

:: Check for existing processes
if exist "%SCRIPT_DIR%.backend.pid" (
    set /p BACKEND_PID=<"%SCRIPT_DIR%.backend.pid"
    tasklist /FI "PID eq !BACKEND_PID!" 2>nul | find /I "!BACKEND_PID!" >nul
    if !errorlevel! equ 0 (
        echo   [WARN] Backend is already running ^(PID !BACKEND_PID!^)
        echo   Run stop.bat first to restart.
        pause
        exit /b 1
    )
)

:: Install dependencies
echo   Installing dependencies...
cd /d "%SCRIPT_DIR%backend"
uv sync --quiet 2>nul
echo   [OK] Backend dependencies
cd /d "%SCRIPT_DIR%frontend"
pnpm install --silent 2>nul
echo   [OK] Frontend dependencies
echo.

:: Create data directories
if not exist "%SCRIPT_DIR%backend\data\outputs" mkdir "%SCRIPT_DIR%backend\data\outputs"
if not exist "%SCRIPT_DIR%backend\data\uploads" mkdir "%SCRIPT_DIR%backend\data\uploads"

:: Start backend
echo   Starting backend...
cd /d "%SCRIPT_DIR%backend"
start /B "HeartMuLa-Backend" cmd /c "uv run uvicorn app.main:app --host 0.0.0.0 --port %BACKEND_PORT% > "%SCRIPT_DIR%.backend.log" 2>&1"

:: Get backend PID (approximate — find uvicorn process)
timeout /t 3 /nobreak >nul
for /f "tokens=2" %%a in ('tasklist /FI "WINDOWTITLE eq HeartMuLa-Backend" /NH 2^>nul ^| find /I "cmd"') do (
    echo %%a> "%SCRIPT_DIR%.backend.pid"
)

:: Wait for backend health check
echo   Waiting for backend...
set READY=0
for /L %%i in (1,1,20) do (
    if !READY! equ 0 (
        curl -sf "http://127.0.0.1:%BACKEND_PORT%/api/health" >nul 2>&1
        if !errorlevel! equ 0 (
            set READY=1
            echo   [OK] Backend running on port %BACKEND_PORT%
        ) else (
            timeout /t 1 /nobreak >nul
        )
    )
)
if %READY% equ 0 (
    echo   [ERROR] Backend failed to start. Check .backend.log
    pause
    exit /b 1
)

:: Start frontend
echo   Starting frontend...
cd /d "%SCRIPT_DIR%frontend"
start /B "HeartMuLa-Frontend" cmd /c "pnpm dev --port %FRONTEND_PORT% > "%SCRIPT_DIR%.frontend.log" 2>&1"

timeout /t 5 /nobreak >nul

:: Get local IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| find /I "IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do set LOCAL_IP=%%b
)

echo.
echo   ========================================
echo        Studio is ready!
echo   ========================================
echo.
echo   Frontend:  http://localhost:%FRONTEND_PORT%
echo   Backend:   http://localhost:%BACKEND_PORT%
echo   API Docs:  http://localhost:%BACKEND_PORT%/docs
if defined LOCAL_IP (
    echo   Network:   http://%LOCAL_IP%:%FRONTEND_PORT%
)
echo.
echo   Logs:      .backend.log / .frontend.log
echo   Stop:      stop.bat
echo.
pause

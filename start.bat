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

:: Check for existing processes on our ports
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%BACKEND_PORT%.*LISTENING" 2^>nul') do (
    echo   [WARN] Port %BACKEND_PORT% is already in use ^(PID %%a^)
    echo   Run stop.bat first to restart.
    pause
    exit /b 1
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
set PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True
start "" /B cmd /c "uv run uvicorn app.main:app --host 0.0.0.0 --port %BACKEND_PORT% >..\.backend.log 2>&1"

:: Wait for backend health check
echo   Waiting for backend...
set READY=0
for /L %%i in (1,1,30) do (
    if !READY! equ 0 (
        curl -sf "http://127.0.0.1:%BACKEND_PORT%/api/health" >nul 2>&1
        if !errorlevel! equ 0 (
            set READY=1
            echo   [OK] Backend running on port %BACKEND_PORT%
        ) else (
            timeout /t 2 /nobreak >nul
        )
    )
)
if %READY% equ 0 (
    echo   [ERROR] Backend failed to start. Check .backend.log
    pause
    exit /b 1
)

:: Save backend PID
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%BACKEND_PORT%.*LISTENING" 2^>nul') do (
    echo %%a> "%SCRIPT_DIR%.backend.pid"
)

:: Start frontend
echo   Starting frontend...
cd /d "%SCRIPT_DIR%frontend"
start "" /B cmd /c "pnpm dev --port %FRONTEND_PORT% >..\.frontend.log 2>&1"

timeout /t 5 /nobreak >nul

:: Save frontend PID
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%FRONTEND_PORT%.*LISTENING" 2^>nul') do (
    echo %%a> "%SCRIPT_DIR%.frontend.pid"
)

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

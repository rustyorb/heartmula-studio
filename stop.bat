@echo off
setlocal EnableDelayedExpansion

:: HeartMuLa Studio — Stop Script (Windows)
:: Shuts down both backend and frontend servers

title HeartMuLa Studio - Stopping

set SCRIPT_DIR=%~dp0

echo.
echo   HeartMuLa Studio — Shutting down
echo.

set STOPPED=0

:: Stop backend (kill uvicorn on port 8000)
echo   Checking for backend on port 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000.*LISTENING" 2^>nul') do (
    echo   Stopping backend ^(PID %%a^)...
    taskkill /PID %%a /F >nul 2>&1
    set /a STOPPED+=1
)
if exist "%SCRIPT_DIR%.backend.pid" (
    set /p BPID=<"%SCRIPT_DIR%.backend.pid"
    taskkill /PID !BPID! /F >nul 2>&1
    taskkill /PID !BPID! /T /F >nul 2>&1
    del "%SCRIPT_DIR%.backend.pid" 2>nul
)

:: Stop frontend (kill next dev on port 3000)
echo   Checking for frontend on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING" 2^>nul') do (
    echo   Stopping frontend ^(PID %%a^)...
    taskkill /PID %%a /F >nul 2>&1
    set /a STOPPED+=1
)
if exist "%SCRIPT_DIR%.frontend.pid" (
    set /p FPID=<"%SCRIPT_DIR%.frontend.pid"
    taskkill /PID !FPID! /F >nul 2>&1
    taskkill /PID !FPID! /T /F >nul 2>&1
    del "%SCRIPT_DIR%.frontend.pid" 2>nul
)

:: Also kill any orphaned node/python processes with our window titles
taskkill /FI "WINDOWTITLE eq HeartMuLa-Backend" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq HeartMuLa-Frontend" /F >nul 2>&1

echo.
if %STOPPED% gtr 0 (
    echo   All services stopped.
) else (
    echo   Nothing was running.
)
echo.
pause

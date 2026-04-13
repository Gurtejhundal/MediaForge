@echo off
title MediaForge Launcher
echo ========================================================
echo                  MEDIAFORGE LAUNCHER
echo ========================================================
echo.

:: Ensure we are working in the directory where the batch file is located
cd /d "%~dp0"

:: Check if node_modules exists, if not, install dependencies
IF NOT EXIST "node_modules\" (
    echo [*] 'node_modules' not found. Installing dependencies for the first time...
    call npm install
    echo [*] Dependencies installed successfully.
    echo.
) ELSE (
    echo [*] Dependencies already installed.
)

echo [*] Launching your browser to http://localhost:3000 in a few seconds...
:: Launch browser in background asynchronously after a slight delay
start "" cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:3000"

echo [*] Starting Next.js Development Server...
echo ========================================================
echo.

:: Start the dev server
npm run dev

pause

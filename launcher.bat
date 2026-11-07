@echo off
setlocal
title MediaForge Launcher
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node 24.12 or newer in the 24.x line, then run this launcher again.
  pause
  exit /b 1
)
if not exist "node_modules\" (
  call npm ci
  if errorlevel 1 (
    echo Installation failed. Read the error above. No server was started.
    pause
    exit /b 1
  )
)
echo Open http://127.0.0.1:3000 after the server reports Ready.
echo Press Ctrl+C to stop MediaForge.
call npm run dev
if errorlevel 1 pause

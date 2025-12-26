package com.stoneage.light;

import android.util.Log;
import com.stoneage.light.Shell;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.concurrent.TimeoutException;

/* loaded from: classes.dex */
public class RootShell {
    public static boolean debugMode = false;
    public static int defaultCommandTimeout = 20000;
    public static boolean handlerEnabled = true;
    public static final String version = "RootShell v1.3";

    public enum LogLevel {
        VERBOSE,
        ERROR,
        DEBUG,
        WARN
    }

    public static void closeAllShells() throws IOException {
        Shell.closeAll();
    }

    public static void closeCustomShell() throws IOException {
        Shell.closeCustomShell();
    }

    public static void closeShell(boolean z) throws IOException {
        if (z) {
            Shell.closeRootShell();
        } else {
            Shell.closeShell();
        }
    }

    public static boolean exists(String str) {
        return exists(str, false);
    }

    /* JADX WARN: Multi-variable type inference failed */
    public static boolean exists(String str, boolean z) {
        final ArrayList arrayList = new ArrayList();
        Command command = new Command(0, 0 == true ? 1 : 0, new String[]{"ls ".concat(z ? "-d " : " ") + str}) { // from class: com.stoneage.light.RootShell.1
            @Override // com.stoneage.light.Command
            public void commandOutput(int i, String str2) {
                RootShell.log(str2);
                arrayList.add(str2);
                super.commandOutput(i, str2);
            }
        };
        try {
            getShell(false).add(command);
            commandWait(getShell(false), command);
            Iterator it = arrayList.iterator();
            while (it.hasNext()) {
                if (((String) it.next()).trim().equals(str)) {
                    return true;
                }
            }
            arrayList.clear();
            getShell(true).add(command);
            commandWait(getShell(true), command);
            ArrayList arrayList2 = new ArrayList();
            arrayList2.addAll(arrayList);
            Iterator it2 = arrayList2.iterator();
            while (it2.hasNext()) {
                if (((String) it2.next()).trim().equals(str)) {
                    return true;
                }
            }
        } catch (Exception unused) {
        }
        return false;
    }

    public static List<String> findBinary(String str) {
        return findBinary(str, null);
    }

    public static List<String> findBinary(final String str, List<String> list) {
        final ArrayList arrayList = new ArrayList();
        if (list == null) {
            list = getPath();
        }
        log("Checking for " + str);
        boolean z = false;
        try {
            for (String str2 : list) {
                if (!str2.endsWith("/")) {
                    str2 = str2 + "/";
                }
                final String str3 = str2;
                Command command = new Command(0, false, new String[]{"stat " + str3 + str}) { // from class: com.stoneage.light.RootShell.2
                    @Override // com.stoneage.light.Command
                    public void commandOutput(int i, String str4) {
                        if (str4.contains("File: ") && str4.contains(str)) {
                            arrayList.add(str3);
                            RootShell.log(str + " was found here: " + str3);
                        }
                        RootShell.log(str4);
                        super.commandOutput(i, str4);
                    }
                };
                getShell(false).add(command);
                commandWait(getShell(false), command);
            }
            z = !arrayList.isEmpty();
        } catch (Exception unused) {
            log(str + " was not found, more information MAY be available with Debugging on.");
        }
        if (!z) {
            log("Trying second method");
            for (String str4 : list) {
                if (!str4.endsWith("/")) {
                    str4 = str4 + "/";
                }
                if (exists(str4 + str)) {
                    log(str + " was found here: " + str4);
                    arrayList.add(str4);
                } else {
                    log(str + " was NOT found here: " + str4);
                }
            }
        }
        Collections.reverse(arrayList);
        return arrayList;
    }

    public static Shell getCustomShell(String str, int i) throws TimeoutException, IOException, RootDeniedException {
        return getCustomShell(str, i);
    }

    public static List<String> getPath() {
        return Arrays.asList(System.getenv("PATH").split(":"));
    }

    public static Shell getShell(boolean z, int i, Shell.ShellContext shellContext, int i2) throws TimeoutException, IOException, RootDeniedException {
        if (z) {
            return Shell.startRootShell(i, shellContext, i2);
        }
        return Shell.startShell(i);
    }

    public static Shell getShell(boolean z, int i, Shell.ShellContext shellContext) throws TimeoutException, IOException, RootDeniedException {
        return getShell(z, i, shellContext, 3);
    }

    public static Shell getShell(boolean z, Shell.ShellContext shellContext) throws TimeoutException, IOException, RootDeniedException {
        return getShell(z, 0, shellContext, 3);
    }

    public static Shell getShell(boolean z, int i) throws TimeoutException, IOException, RootDeniedException {
        return getShell(z, i, Shell.defaultContext, 3);
    }

    public static Shell getShell(boolean z) throws TimeoutException, IOException, RootDeniedException {
        return getShell(z, 0);
    }

    public static boolean isAccessGiven() {
        return isAccessGiven(0, 3);
    }

    public static boolean isAccessGiven(int i, int i2) {
        final HashSet<String> hashSet = new HashSet();
        boolean z = false;
        try {
            log("Checking for Root access");
            Command command = new Command(158, z, new String[]{"id"}) { // from class: com.stoneage.light.RootShell.3
                @Override // com.stoneage.light.Command
                public void commandOutput(int i3, String str) {
                    if (i3 == 158) {
                        hashSet.addAll(Arrays.asList(str.split(" ")));
                    }
                    super.commandOutput(i3, str);
                }
            };
            Shell.startRootShell().add(command);
            commandWait(Shell.startRootShell(), command);
            for (String str : hashSet) {
                log(str);
                if (str.toLowerCase().contains("uid=0")) {
                    log("Access Given");
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public static boolean isBusyboxAvailable() {
        return findBinary("busybox").size() > 0;
    }

    public static boolean isRootAvailable() {
        return findBinary("su").size() > 0;
    }

    public static void log(String str) {
        log(null, str, LogLevel.DEBUG, null);
    }

    public static void log(String str, String str2) {
        log(str, str2, LogLevel.DEBUG, null);
    }

    public static void log(String str, LogLevel logLevel, Exception exc) {
        log(null, str, logLevel, exc);
    }

    public static boolean islog() {
        return debugMode;
    }

    public static void log(String str, String str2, LogLevel logLevel, Exception exc) {
        if (str2 == null || str2.equals("") || !debugMode) {
            return;
        }
        if (str == null) {
            str = version;
        }
        int iOrdinal = logLevel.ordinal();
        if (iOrdinal == 0) {
            Log.v(str, str2);
            return;
        }
        if (iOrdinal == 1) {
            Log.e(str, str2, exc);
        } else if (iOrdinal == 2) {
            Log.d(str, str2);
        } else {
            if (iOrdinal != 3) {
                return;
            }
            Log.w(str, str2);
        }
    }

    private static void commandWait(Shell shell, Command command) throws Exception {
        while (!command.isFinished()) {
            log(version, shell.getCommandQueuePositionString(command));
            log(version, "Processed " + command.totalOutputProcessed + " of " + command.totalOutput + " output from command.");
            synchronized (command) {
                try {
                    if (!command.isFinished()) {
                        command.wait(2000L);
                    }
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
            if (!command.isExecuting() && !command.isFinished()) {
                if (!shell.isExecuting && !shell.isReading) {
                    log(version, "Waiting for a command to be executed in a shell that is not executing and not reading! \n\n Command: " + command.getCommand());
                    Exception exc = new Exception();
                    exc.setStackTrace(Thread.currentThread().getStackTrace());
                    exc.printStackTrace();
                } else if (shell.isExecuting && !shell.isReading) {
                    log(version, "Waiting for a command to be executed in a shell that is executing but not reading! \n\n Command: " + command.getCommand());
                    Exception exc2 = new Exception();
                    exc2.setStackTrace(Thread.currentThread().getStackTrace());
                    exc2.printStackTrace();
                } else {
                    log(version, "Waiting for a command to be executed in a shell that is not reading! \n\n Command: " + command.getCommand());
                    Exception exc3 = new Exception();
                    exc3.setStackTrace(Thread.currentThread().getStackTrace());
                    exc3.printStackTrace();
                }
            }
        }
    }
}

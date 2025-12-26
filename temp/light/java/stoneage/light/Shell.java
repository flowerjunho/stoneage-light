package com.stoneage.light;

import android.content.Context;
import com.stoneage.light.RootShell;
import java.io.BufferedReader;
import java.io.EOFException;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Reader;
import java.io.Writer;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeoutException;

/* loaded from: classes.dex */
public class Shell {
    private static Shell customShell = null;
    private static Shell rootShell = null;
    private static Shell shell = null;
    private static final String token = "F*D^W@#FGF";
    private final BufferedReader errorStream;
    private final BufferedReader inputStream;
    private final OutputStreamWriter outputStream;
    private final Process proc;
    private ShellContext shellContext;
    private int shellTimeout;
    private ShellType shellType;
    private static String[] suVersion = {null, null};
    public static ShellContext defaultContext = ShellContext.NORMAL;
    private String error = "";
    private final List<Command> commands = new ArrayList();
    private boolean close = false;
    private Boolean isSELinuxEnforcing = null;
    public boolean isExecuting = false;
    public boolean isReading = false;
    public boolean isClosed = false;
    private int maxCommands = 5000;
    private int read = 0;
    private int write = 0;
    private int totalExecuted = 0;
    private int totalRead = 0;
    private boolean isCleaning = false;
    private Runnable input = new Runnable() { // from class: com.stoneage.light.Shell.1
        @Override // java.lang.Runnable
        public void run() throws IOException {
            while (true) {
                try {
                    try {
                        synchronized (Shell.this.commands) {
                            while (!Shell.this.close && Shell.this.write >= Shell.this.commands.size()) {
                                Shell.this.isExecuting = false;
                                Shell.this.commands.wait();
                            }
                        }
                        if (Shell.this.write >= Shell.this.maxCommands) {
                            while (Shell.this.read != Shell.this.write) {
                                RootShell.log("Waiting for read and write to catch up before cleanup.");
                            }
                            Shell.this.cleanCommands();
                        }
                        if (Shell.this.write >= Shell.this.commands.size()) {
                            if (Shell.this.close) {
                                Shell.this.isExecuting = false;
                                Shell.this.outputStream.write("\nexit 0\n");
                                Shell.this.outputStream.flush();
                                RootShell.log("Closing shell");
                                return;
                            }
                        } else {
                            Shell.this.isExecuting = true;
                            Command command = (Command) Shell.this.commands.get(Shell.this.write);
                            command.startExecution();
                            RootShell.log("Executing: " + command.getCommand() + " with context: " + Shell.this.shellContext);
                            Shell.this.outputStream.write(command.getCommand());
                            Shell.this.outputStream.write("\necho F*D^W@#FGF " + Shell.this.totalExecuted + " $?\n");
                            Shell.this.outputStream.flush();
                            Shell.access$308(Shell.this);
                            Shell.access$908(Shell.this);
                        }
                    } catch (IOException e) {
                        RootShell.log(e.getMessage(), RootShell.LogLevel.ERROR, e);
                        return;
                    } catch (InterruptedException e2) {
                        RootShell.log(e2.getMessage(), RootShell.LogLevel.ERROR, e2);
                        return;
                    }
                } finally {
                    Shell.this.write = 0;
                    Shell shell2 = Shell.this;
                    shell2.closeQuietly(shell2.outputStream);
                }
            }
        }
    };
    private Runnable output = new Runnable() { // from class: com.stoneage.light.Shell.3
        /* JADX WARN: Code restructure failed: missing block: B:19:0x005b, code lost:
        
            r9.this$0.proc.waitFor();
            r9.this$0.proc.destroy();
         */
        /* JADX WARN: Code restructure failed: missing block: B:47:0x010b, code lost:
        
            r9.this$0.processErrors(r1);
            r4 = 0;
         */
        /* JADX WARN: Code restructure failed: missing block: B:49:0x0115, code lost:
        
            if (r1.totalOutput <= r1.totalOutputProcessed) goto L103;
         */
        /* JADX WARN: Code restructure failed: missing block: B:50:0x0117, code lost:
        
            if (r4 != 0) goto L81;
         */
        /* JADX WARN: Code restructure failed: missing block: B:51:0x0119, code lost:
        
            r4 = r4 + 1;
            com.stoneage.light.RootShell.log("Waiting for output to be processed. " + r1.totalOutputProcessed + " Of " + r1.totalOutput);
         */
        /* JADX WARN: Code restructure failed: missing block: B:52:0x013b, code lost:
        
            monitor-enter(r9);
         */
        /* JADX WARN: Code restructure failed: missing block: B:54:0x013e, code lost:
        
            wait(2000);
         */
        /* JADX WARN: Code restructure failed: missing block: B:55:0x0141, code lost:
        
            monitor-exit(r9);
         */
        /* JADX WARN: Code restructure failed: missing block: B:60:0x0146, code lost:
        
            r5 = move-exception;
         */
        /* JADX WARN: Code restructure failed: missing block: B:61:0x0147, code lost:
        
            com.stoneage.light.RootShell.log(r5.getMessage());
         */
        @Override // java.lang.Runnable
        /*
            Code decompiled incorrectly, please refer to instructions dump.
            To view partially-correct add '--show-bad-code' argument
        */
        public void run() throws java.io.IOException {
            /*
                Method dump skipped, instructions count: 452
                To view this dump add '--comments-level debug' option
            */
            throw new UnsupportedOperationException("Method not decompiled: com.stoneage.light.Shell.AnonymousClass3.run():void");
        }
    };

    public enum ShellType {
        NORMAL,
        ROOT,
        CUSTOM
    }

    static /* synthetic */ int access$1208(Shell shell2) {
        int i = shell2.totalRead;
        shell2.totalRead = i + 1;
        return i;
    }

    static /* synthetic */ int access$308(Shell shell2) {
        int i = shell2.write;
        shell2.write = i + 1;
        return i;
    }

    static /* synthetic */ int access$508(Shell shell2) {
        int i = shell2.read;
        shell2.read = i + 1;
        return i;
    }

    static /* synthetic */ int access$908(Shell shell2) {
        int i = shell2.totalExecuted;
        shell2.totalExecuted = i + 1;
        return i;
    }

    public enum ShellContext {
        NORMAL("normal"),
        SHELL("u:r:shell:s0"),
        SYSTEM_SERVER("u:r:system_server:s0"),
        SYSTEM_APP("u:r:system_app:s0"),
        PLATFORM_APP("u:r:platform_app:s0"),
        UNTRUSTED_APP("u:r:untrusted_app:s0"),
        RECOVERY("u:r:recovery:s0");

        private String value;

        ShellContext(String str) {
            this.value = str;
        }

        public String getValue() {
            return this.value;
        }
    }

    private Shell(String str, ShellType shellType, ShellContext shellContext, int i) throws TimeoutException, IOException, RootDeniedException {
        this.shellTimeout = 25000;
        this.shellType = null;
        this.shellContext = ShellContext.NORMAL;
        RootShell.log("Starting shell: " + str);
        RootShell.log("Context: " + shellContext.getValue());
        RootShell.log("Timeout: " + i);
        this.shellType = shellType;
        this.shellTimeout = i <= 0 ? this.shellTimeout : i;
        this.shellContext = shellContext;
        if (shellContext == ShellContext.NORMAL) {
            this.proc = Runtime.getRuntime().exec(str);
        } else {
            String suVersion2 = getSuVersion(false);
            String suVersion3 = getSuVersion(true);
            if (isSELinuxEnforcing() && suVersion2 != null && suVersion3 != null && suVersion2.endsWith("SUPERSU") && Integer.valueOf(suVersion3).intValue() >= 190) {
                str = str + " --context " + this.shellContext.getValue();
            } else {
                RootShell.log("Su binary --context switch not supported!");
                RootShell.log("Su binary display version: " + suVersion2);
                RootShell.log("Su binary internal version: " + suVersion3);
                RootShell.log("SELinuxEnforcing: " + isSELinuxEnforcing());
            }
            this.proc = Runtime.getRuntime().exec(str);
        }
        this.inputStream = new BufferedReader(new InputStreamReader(this.proc.getInputStream(), "UTF-8"));
        this.errorStream = new BufferedReader(new InputStreamReader(this.proc.getErrorStream(), "UTF-8"));
        this.outputStream = new OutputStreamWriter(this.proc.getOutputStream(), "UTF-8");
        Worker worker = new Worker();
        worker.start();
        try {
            worker.join(this.shellTimeout);
            if (worker.exit == -911) {
                try {
                    this.proc.destroy();
                } catch (Exception unused) {
                }
                closeQuietly(this.inputStream);
                closeQuietly(this.errorStream);
                closeQuietly(this.outputStream);
                throw new TimeoutException(this.error);
            }
            if (worker.exit == -42) {
                try {
                    this.proc.destroy();
                } catch (Exception unused2) {
                }
                closeQuietly(this.inputStream);
                closeQuietly(this.errorStream);
                closeQuietly(this.outputStream);
                throw new RootDeniedException("Root Access Denied");
            }
            Thread thread = new Thread(this.input, "Shell Input");
            thread.setPriority(5);
            thread.start();
            Thread thread2 = new Thread(this.output, "Shell Output");
            thread2.setPriority(5);
            thread2.start();
        } catch (InterruptedException unused3) {
            worker.interrupt();
            Thread.currentThread().interrupt();
            throw new TimeoutException();
        }
    }

    public Command add(Command command) throws IOException {
        if (this.close) {
            throw new IllegalStateException("Unable to add commands to a closed shell");
        }
        while (this.isCleaning) {
        }
        command.resetCommand();
        this.commands.add(command);
        notifyThreads();
        return command;
    }

    public final void useCWD(Context context) throws TimeoutException, IOException, RootDeniedException {
        add(new Command(-1, false, "cd " + context.getApplicationInfo().dataDir));
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void cleanCommands() {
        this.isCleaning = true;
        int i = this.maxCommands;
        int iAbs = Math.abs(i - (i / 4));
        RootShell.log("Cleaning up: " + iAbs);
        for (int i2 = 0; i2 < iAbs; i2++) {
            this.commands.remove(0);
        }
        this.read = this.commands.size() - 1;
        this.write = this.commands.size() - 1;
        this.isCleaning = false;
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void closeQuietly(Reader reader) throws IOException {
        if (reader != null) {
            try {
                reader.close();
            } catch (Exception unused) {
            }
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void closeQuietly(Writer writer) throws IOException {
        if (writer != null) {
            try {
                writer.close();
            } catch (Exception unused) {
            }
        }
    }

    public void close() throws IOException {
        RootShell.log("Request to close shell!");
        int i = 0;
        while (this.isExecuting) {
            RootShell.log("Waiting on shell to finish executing before closing...");
            i++;
            if (i > 10000) {
                break;
            }
        }
        synchronized (this.commands) {
            this.close = true;
            notifyThreads();
        }
        RootShell.log("Shell Closed!");
        if (this == rootShell) {
            rootShell = null;
        } else if (this == shell) {
            shell = null;
        } else if (this == customShell) {
            customShell = null;
        }
    }

    public static void closeCustomShell() throws IOException {
        RootShell.log("Request to close custom shell!");
        Shell shell2 = customShell;
        if (shell2 == null) {
            return;
        }
        shell2.close();
    }

    public static void closeRootShell() throws IOException {
        RootShell.log("Request to close root shell!");
        Shell shell2 = rootShell;
        if (shell2 == null) {
            return;
        }
        shell2.close();
    }

    public static void closeShell() throws IOException {
        RootShell.log("Request to close normal shell!");
        Shell shell2 = shell;
        if (shell2 == null) {
            return;
        }
        shell2.close();
    }

    public static void closeAll() throws IOException {
        RootShell.log("Request to close all shells!");
        closeShell();
        closeRootShell();
        closeCustomShell();
    }

    public int getCommandQueuePosition(Command command) {
        return this.commands.indexOf(command);
    }

    public String getCommandQueuePositionString(Command command) {
        return "Command is in position " + getCommandQueuePosition(command) + " currently executing command at position " + this.write + " and the number of commands is " + this.commands.size();
    }

    public static Shell getOpenShell() {
        Shell shell2 = customShell;
        if (shell2 != null) {
            return shell2;
        }
        Shell shell3 = rootShell;
        return shell3 != null ? shell3 : shell;
    }

    private synchronized String getSuVersion(boolean z) {
        int i;
        i = !z ? 1 : 0;
        if (suVersion[i] == null) {
            String str = null;
            try {
                Process processExec = Runtime.getRuntime().exec(z ? "su -V" : "su -v", (String[]) null);
                processExec.waitFor();
                ArrayList<String> arrayList = new ArrayList();
                BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(processExec.getInputStream()));
                while (true) {
                    try {
                        String line = bufferedReader.readLine();
                        if (line != null) {
                            arrayList.add(line);
                        }
                    } catch (IOException unused) {
                    }
                    try {
                        break;
                    } catch (IOException unused2) {
                    }
                }
                bufferedReader.close();
                processExec.destroy();
                for (String str2 : arrayList) {
                    if (!z) {
                        if (str2.contains(".")) {
                            str = str2;
                            break;
                        }
                    } else {
                        try {
                        } catch (NumberFormatException unused3) {
                            continue;
                        }
                        if (Integer.parseInt(str2) > 0) {
                            str = str2;
                            break;
                        }
                    }
                }
                suVersion[i] = str;
            } catch (IOException e) {
                e.printStackTrace();
                return null;
            } catch (InterruptedException e2) {
                e2.printStackTrace();
                return null;
            }
        }
        return suVersion[i];
    }

    public static boolean isShellOpen() {
        return shell == null;
    }

    public static boolean isCustomShellOpen() {
        return customShell == null;
    }

    public static boolean isRootShellOpen() {
        return rootShell == null;
    }

    public static boolean isAnyShellOpen() {
        return (shell == null && rootShell == null && customShell == null) ? false : true;
    }

    public synchronized boolean isSELinuxEnforcing() {
        if (this.isSELinuxEnforcing == null) {
            Boolean boolValueOf = null;
            if (new File("/sys/fs/selinux/enforce").exists()) {
                try {
                    FileInputStream fileInputStream = new FileInputStream("/sys/fs/selinux/enforce");
                    try {
                        boolValueOf = Boolean.valueOf(fileInputStream.read() == 49);
                        fileInputStream.close();
                    } catch (Throwable th) {
                        fileInputStream.close();
                        throw th;
                    }
                } catch (Exception unused) {
                }
            }
            if (boolValueOf == null) {
                boolValueOf = true;
            }
            if (boolValueOf == null) {
                boolValueOf = false;
            }
            this.isSELinuxEnforcing = boolValueOf;
        }
        return this.isSELinuxEnforcing.booleanValue();
    }

    protected void notifyThreads() {
        new Thread() { // from class: com.stoneage.light.Shell.2
            @Override // java.lang.Thread, java.lang.Runnable
            public void run() {
                synchronized (Shell.this.commands) {
                    Shell.this.commands.notifyAll();
                }
            }
        }.start();
    }

    public void processErrors(Command command) {
        String line;
        while (this.errorStream.ready() && command != null && (line = this.errorStream.readLine()) != null) {
            try {
                command.output(command.id, line);
            } catch (Exception e) {
                RootShell.log(e.getMessage(), RootShell.LogLevel.ERROR, e);
                return;
            }
        }
    }

    public static void runRootCommand(Command command) throws TimeoutException, IOException, RootDeniedException {
        startRootShell().add(command);
    }

    public static void runCommand(Command command) throws TimeoutException, IOException {
        startShell().add(command);
    }

    public static Shell startRootShell() throws TimeoutException, IOException, RootDeniedException {
        return startRootShell(0, 3);
    }

    public static Shell startRootShell(int i) throws TimeoutException, IOException, RootDeniedException {
        return startRootShell(i, 3);
    }

    public static Shell startRootShell(int i, int i2) throws TimeoutException, IOException, RootDeniedException {
        return startRootShell(i, defaultContext, i2);
    }

    public static Shell startRootShell(int i, ShellContext shellContext, int i2) throws TimeoutException, IOException, RootDeniedException {
        int i3;
        Shell shell2 = rootShell;
        if (shell2 == null) {
            RootShell.log("Starting Root Shell!");
            int i4 = 0;
            while (rootShell == null) {
                try {
                    RootShell.log("Trying to open Root Shell, attempt #" + i4);
                    rootShell = new Shell("su", ShellType.ROOT, shellContext, i);
                } catch (RootDeniedException e) {
                    i3 = i4 + 1;
                    if (i4 >= i2) {
                        RootShell.log("RootDeniedException, could not start shell");
                        throw e;
                    }
                    i4 = i3;
                } catch (IOException e2) {
                    i3 = i4 + 1;
                    if (i4 >= i2) {
                        RootShell.log("IOException, could not start shell");
                        throw e2;
                    }
                    i4 = i3;
                } catch (TimeoutException e3) {
                    i3 = i4 + 1;
                    if (i4 >= i2) {
                        RootShell.log("TimeoutException, could not start shell");
                        throw e3;
                    }
                    i4 = i3;
                }
            }
        } else if (shell2.shellContext != shellContext) {
            try {
                RootShell.log("Context is different than open shell, switching context... " + rootShell.shellContext + " VS " + shellContext);
                rootShell.switchRootShellContext(shellContext);
            } catch (RootDeniedException e4) {
                if (i2 <= 0) {
                    RootShell.log("RootDeniedException, could not switch context!");
                    throw e4;
                }
            } catch (IOException e5) {
                if (i2 <= 0) {
                    RootShell.log("IOException, could not switch context!");
                    throw e5;
                }
            } catch (TimeoutException e6) {
                if (i2 <= 0) {
                    RootShell.log("TimeoutException, could not switch context!");
                    throw e6;
                }
            }
        } else {
            RootShell.log("Using Existing Root Shell!");
        }
        return rootShell;
    }

    public static Shell startCustomShell(String str) throws TimeoutException, IOException, RootDeniedException {
        return startCustomShell(str, 0);
    }

    public static Shell startCustomShell(String str, int i) throws TimeoutException, IOException, RootDeniedException {
        if (customShell == null) {
            RootShell.log("Starting Custom Shell!");
            customShell = new Shell(str, ShellType.CUSTOM, ShellContext.NORMAL, i);
        } else {
            RootShell.log("Using Existing Custom Shell!");
        }
        return customShell;
    }

    public static Shell startShell() throws TimeoutException, IOException {
        return startShell(0);
    }

    public static Shell startShell(int i) throws TimeoutException, IOException {
        try {
            if (shell == null) {
                RootShell.log("Starting Shell!");
                shell = new Shell("/system/bin/sh", ShellType.NORMAL, ShellContext.NORMAL, i);
            } else {
                RootShell.log("Using Existing Shell!");
            }
            return shell;
        } catch (RootDeniedException unused) {
            throw new IOException();
        }
    }

    public Shell switchRootShellContext(ShellContext shellContext) throws TimeoutException, IOException, RootDeniedException {
        if (this.shellType == ShellType.ROOT) {
            try {
                closeRootShell();
            } catch (Exception unused) {
                RootShell.log("Problem closing shell while trying to switch context...");
            }
            return startRootShell(this.shellTimeout, shellContext, 3);
        }
        RootShell.log("Can only switch context on a root shell!");
        return this;
    }

    protected static class Worker extends Thread {
        public int exit;
        public Shell shell;

        private Worker(Shell shell) {
            this.exit = -911;
            this.shell = shell;
        }

        @Override // java.lang.Thread, java.lang.Runnable
        public void run() throws NoSuchFieldException, IOException {
            try {
                this.shell.outputStream.write("echo Started\n");
                this.shell.outputStream.flush();
                while (true) {
                    String line = this.shell.inputStream.readLine();
                    if (line == null) {
                        throw new EOFException();
                    }
                    if (!"".equals(line)) {
                        if (!"Started".equals(line)) {
                            this.shell.error = "unknown error occurred.";
                        } else {
                            this.exit = 1;
                            setShellOom();
                            return;
                        }
                    }
                }
            } catch (IOException e) {
                this.exit = -42;
                if (e.getMessage() == null) {
                    this.shell.error = "RootAccess denied?.";
                } else {
                    this.shell.error = e.getMessage();
                }
            }
        }

        private void setShellOom() throws NoSuchFieldException, IOException {
            Field declaredField;
            try {
                Class<?> cls = this.shell.proc.getClass();
                try {
                    declaredField = cls.getDeclaredField("pid");
                } catch (NoSuchFieldException unused) {
                    declaredField = cls.getDeclaredField("id");
                }
                declaredField.setAccessible(true);
                int iIntValue = ((Integer) declaredField.get(this.shell.proc)).intValue();
                this.shell.outputStream.write("(echo -17 > /proc/" + iIntValue + "/oom_adj) &> /dev/null\n");
                this.shell.outputStream.write("(echo -17 > /proc/$$/oom_adj) &> /dev/null\n");
                this.shell.outputStream.flush();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}

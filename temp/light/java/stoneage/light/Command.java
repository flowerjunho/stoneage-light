package com.stoneage.light;

import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import java.io.IOException;

/* loaded from: classes.dex */
public class Command {
    String[] command;
    protected Context context;
    boolean executing;
    ExecutionMonitor executionMonitor;
    int exitCode;
    boolean finished;
    boolean handlerEnabled;
    int id;
    protected boolean javaCommand;
    Handler mHandler;
    boolean terminated;
    int timeout;
    public int totalOutput;
    public int totalOutputProcessed;

    public void commandCompleted(int i, int i2) {
    }

    public void commandTerminated(int i, String str) {
    }

    public Command(int i, String... strArr) {
        this.javaCommand = false;
        this.context = null;
        this.totalOutput = 0;
        this.totalOutputProcessed = 0;
        this.executionMonitor = null;
        this.mHandler = null;
        this.executing = false;
        this.command = new String[0];
        this.finished = false;
        this.terminated = false;
        this.handlerEnabled = true;
        this.exitCode = -1;
        this.id = 0;
        this.timeout = RootShell.defaultCommandTimeout;
        this.command = strArr;
        this.id = i;
        createHandler(RootShell.handlerEnabled);
    }

    public Command(int i, boolean z, String... strArr) {
        this.javaCommand = false;
        this.context = null;
        this.totalOutput = 0;
        this.totalOutputProcessed = 0;
        this.executionMonitor = null;
        this.mHandler = null;
        this.executing = false;
        this.command = new String[0];
        this.finished = false;
        this.terminated = false;
        this.handlerEnabled = true;
        this.exitCode = -1;
        this.id = 0;
        this.timeout = RootShell.defaultCommandTimeout;
        this.command = strArr;
        this.id = i;
        createHandler(z);
    }

    public Command(int i, int i2, String... strArr) {
        this.javaCommand = false;
        this.context = null;
        this.totalOutput = 0;
        this.totalOutputProcessed = 0;
        this.executionMonitor = null;
        this.mHandler = null;
        this.executing = false;
        this.command = new String[0];
        this.finished = false;
        this.terminated = false;
        this.handlerEnabled = true;
        this.exitCode = -1;
        this.id = 0;
        int i3 = RootShell.defaultCommandTimeout;
        this.command = strArr;
        this.id = i;
        this.timeout = i2;
        createHandler(RootShell.handlerEnabled);
    }

    public void commandOutput(int i, String str) {
        RootShell.log("Command", "ID: " + i + ", " + str);
        this.totalOutputProcessed = this.totalOutputProcessed + 1;
    }

    protected final void commandFinished() {
        if (this.terminated) {
            return;
        }
        synchronized (this) {
            Handler handler = this.mHandler;
            if (handler != null && this.handlerEnabled) {
                Message messageObtainMessage = handler.obtainMessage();
                Bundle bundle = new Bundle();
                bundle.putInt(CommandHandler.ACTION, 2);
                messageObtainMessage.setData(bundle);
                this.mHandler.sendMessage(messageObtainMessage);
            } else {
                commandCompleted(this.id, this.exitCode);
            }
            RootShell.log("Command " + this.id + " finished.");
            finishCommand();
        }
    }

    private void createHandler(boolean z) {
        this.handlerEnabled = z;
        if (Looper.myLooper() != null && z) {
            RootShell.log("CommandHandler created");
            this.mHandler = new CommandHandler();
        } else {
            RootShell.log("CommandHandler not created");
        }
    }

    public final void finish() {
        RootShell.log("Command finished at users request!");
        commandFinished();
    }

    protected final void finishCommand() {
        this.executing = false;
        this.finished = true;
        notifyAll();
    }

    public final String getCommand() {
        StringBuilder sb = new StringBuilder();
        int i = 0;
        if (!this.javaCommand) {
            while (true) {
                String[] strArr = this.command;
                if (i >= strArr.length) {
                    break;
                }
                sb.append(strArr[i]);
                sb.append('\n');
                i++;
            }
        } else {
            String path = this.context.getFilesDir().getPath();
            while (i < this.command.length) {
                if (Build.VERSION.SDK_INT > 22) {
                    sb.append("export CLASSPATH=" + path + "/anbuild.dex; app_process /system/bin " + this.command[i]);
                } else {
                    sb.append("dalvikvm -cp " + path + "/anbuild.dex com.android.internal.util.WithFramework com.stericson.RootTools.containers.RootClass " + this.command[i]);
                }
                sb.append('\n');
                i++;
            }
        }
        return sb.toString();
    }

    public final boolean isExecuting() {
        return this.executing;
    }

    public final boolean isHandlerEnabled() {
        return this.handlerEnabled;
    }

    public final boolean isFinished() {
        return this.finished;
    }

    public final int getExitCode() {
        return this.exitCode;
    }

    protected final void setExitCode(int i) {
        synchronized (this) {
            this.exitCode = i;
        }
    }

    protected final void startExecution() {
        ExecutionMonitor executionMonitor = new ExecutionMonitor();
        this.executionMonitor = executionMonitor;
        executionMonitor.setPriority(1);
        this.executionMonitor.start();
        this.executing = true;
    }

    public final void terminate() {
        RootShell.log("Terminating command at users request!");
        terminated("Terminated at users request!");
    }

    protected final void terminate(String str) {
        try {
            Shell.closeAll();
            RootShell.log("Terminating all shells.");
            terminated(str);
        } catch (IOException unused) {
        }
    }

    protected final void terminated(String str) {
        synchronized (this) {
            Handler handler = this.mHandler;
            if (handler != null && this.handlerEnabled) {
                Message messageObtainMessage = handler.obtainMessage();
                Bundle bundle = new Bundle();
                bundle.putInt(CommandHandler.ACTION, 3);
                bundle.putString(CommandHandler.TEXT, str);
                messageObtainMessage.setData(bundle);
                this.mHandler.sendMessage(messageObtainMessage);
            } else {
                commandTerminated(this.id, str);
            }
            RootShell.log("Command " + this.id + " did not finish because it was terminated. Termination reason: " + str);
            setExitCode(-1);
            this.terminated = true;
            finishCommand();
        }
    }

    protected final void output(int i, String str) {
        this.totalOutput++;
        Handler handler = this.mHandler;
        if (handler != null && this.handlerEnabled) {
            Message messageObtainMessage = handler.obtainMessage();
            Bundle bundle = new Bundle();
            bundle.putInt(CommandHandler.ACTION, 1);
            bundle.putString(CommandHandler.TEXT, str);
            messageObtainMessage.setData(bundle);
            this.mHandler.sendMessage(messageObtainMessage);
            return;
        }
        commandOutput(i, str);
    }

    public final void resetCommand() {
        this.finished = false;
        this.totalOutput = 0;
        this.totalOutputProcessed = 0;
        this.executing = false;
        this.terminated = false;
        this.exitCode = -1;
    }

    private class ExecutionMonitor extends Thread {
        private ExecutionMonitor() {
        }

        @Override // java.lang.Thread, java.lang.Runnable
        public void run() {
            if (Command.this.timeout > 0) {
                while (!Command.this.finished) {
                    synchronized (Command.this) {
                        try {
                            Command.this.wait(r1.timeout);
                        } catch (InterruptedException unused) {
                        }
                    }
                    if (!Command.this.finished) {
                        RootShell.log("Timeout Exception has occurred.");
                        Command.this.terminate("Timeout Exception");
                    }
                }
            }
        }
    }

    private class CommandHandler extends Handler {
        public static final String ACTION = "action";
        public static final int COMMAND_COMPLETED = 2;
        public static final int COMMAND_OUTPUT = 1;
        public static final int COMMAND_TERMINATED = 3;
        public static final String TEXT = "text";

        private CommandHandler() {
        }

        @Override // android.os.Handler
        public final void handleMessage(Message message) {
            int i = message.getData().getInt(ACTION);
            String string = message.getData().getString(TEXT);
            if (i == 1) {
                Command command = Command.this;
                command.commandOutput(command.id, string);
            } else if (i == 2) {
                Command command2 = Command.this;
                command2.commandCompleted(command2.id, Command.this.exitCode);
            } else {
                if (i != 3) {
                    return;
                }
                Command command3 = Command.this;
                command3.commandTerminated(command3.id, string);
            }
        }
    }
}

package com.stoneage.light;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.Environment;
import android.text.TextUtils;
import androidx.core.content.FileProvider;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.LineNumberReader;
import java.io.Reader;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.util.Locale;
import java.util.UUID;

/* loaded from: classes.dex */
public class KoUtil {
    public static void autoLoginGame() {
    }

    public static void checkOrder(String str) {
    }

    public static void loginGame(int i) {
    }

    public static void logout() {
    }

    public static void startPayNative(String str, String str2, int i, String str3, String str4) {
    }

    public static String getChannel() {
        return StoneageApplication.getAppContext().getPackageName();
    }

    public static void OpenUrl(String str) {
        Intent intent = new Intent();
        intent.setAction("android.intent.action.VIEW");
        intent.setData(Uri.parse(str));
        StoneageApplication.getActivity().startActivity(intent);
    }

    public static String getAppVersion() {
        return StoneageApplication.getAppVersion();
    }

    public static String getUUID() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    private static boolean copyFileToDir(String str, String str2) throws IOException {
        File file = new File(str2);
        if (!file.exists()) {
            file.mkdir();
        }
        String str3 = str2 + "/" + new File(str).getName();
        try {
            FileInputStream fileInputStream = new FileInputStream(str);
            FileOutputStream fileOutputStream = new FileOutputStream(str3);
            byte[] bArr = new byte[1024];
            while (true) {
                int i = fileInputStream.read(bArr);
                if (i > 0) {
                    fileOutputStream.write(bArr, 0, i);
                } else {
                    fileInputStream.close();
                    fileOutputStream.close();
                    return true;
                }
            }
        } catch (Exception unused) {
            return false;
        }
    }

    public static void installApk(String str) throws IOException {
        File file = new File(str);
        if (file.exists()) {
            Intent intent = new Intent();
            intent.setAction("android.intent.action.VIEW");
            intent.addCategory("android.intent.category.DEFAULT");
            if (Build.VERSION.SDK_INT >= 24) {
                Context appContext = StoneageApplication.getAppContext();
                StoneageApplication.setIsApkUpgrade(true);
                StoneageApplication.setNewApkFile(file);
                intent.setDataAndType(FileProvider.getUriForFile(appContext, appContext.getPackageName() + ".provider", file), "application/vnd.android.package-archive");
                intent.addFlags(268435456);
                intent.addFlags(1);
                StoneageApplication.getAppContext().startActivity(intent);
                return;
            }
            if (Environment.getExternalStorageDirectory().canWrite()) {
                copyFileToDir(str, Environment.getExternalStorageDirectory().getAbsolutePath());
                File file2 = new File(Environment.getExternalStorageDirectory().getAbsolutePath() + "/" + file.getName());
                file.delete();
                StoneageApplication.setIsApkUpgrade(true);
                StoneageApplication.setNewApkFile(file2);
                intent.setDataAndType(Uri.fromFile(file2), "application/vnd.android.package-archive");
                intent.addFlags(268435456);
                StoneageApplication.getAppContext().startActivity(intent);
            }
        }
    }

    public static String getMac() throws IOException {
        String strSubstring;
        String str = "";
        if (Build.VERSION.SDK_INT >= 23) {
            try {
                LineNumberReader lineNumberReader = new LineNumberReader(new InputStreamReader(Runtime.getRuntime().exec("cat /sys/class/net/wlan0/address").getInputStream()));
                String line = "";
                while (line != null) {
                    line = lineNumberReader.readLine();
                    if (line != null) {
                        strSubstring = line.trim();
                        break;
                    }
                }
            } catch (Exception unused) {
            }
            strSubstring = "";
            if (TextUtils.isEmpty(strSubstring)) {
                try {
                    try {
                        strSubstring = loadFileAsString("/sys/class/net/eth0/address").toUpperCase(Locale.getDefault()).substring(0, 17);
                    } catch (Exception unused2) {
                        NetworkInterface byName = NetworkInterface.getByName("wlan0");
                        if (byName != null) {
                            for (byte b2 : byName.getHardwareAddress()) {
                                str = str + String.format("%02X", Byte.valueOf(b2));
                            }
                        }
                        strSubstring = str;
                    }
                } catch (SocketException unused3) {
                }
            }
        } else {
            strSubstring = ((WifiManager) StoneageApplication.getActivity().getApplicationContext().getSystemService("wifi")).getConnectionInfo().getMacAddress();
        }
        return TextUtils.isEmpty(strSubstring) ? "NotFound" : strSubstring;
    }

    public static boolean isInMultiWindowModeStatic() {
        Activity activity = StoneageApplication.getActivity();
        return Build.VERSION.SDK_INT >= 24 && activity != null && activity.isInMultiWindowMode();
    }

    private static String loadFileAsString(String str) throws Exception {
        FileReader fileReader = new FileReader(str);
        String strLoadReaderAsString = loadReaderAsString(fileReader);
        fileReader.close();
        return strLoadReaderAsString;
    }

    private static String loadReaderAsString(Reader reader) throws Exception {
        StringBuilder sb = new StringBuilder();
        char[] cArr = new char[4096];
        int i = reader.read(cArr);
        while (i >= 0) {
            sb.append(cArr, 0, i);
            i = reader.read(cArr);
        }
        return sb.toString();
    }
}

package com.stoneage.light;

/* loaded from: classes.dex */
public class JNILibrary {
    public static native void callbackKeyboardChange(int i, int i2);

    public static native void callbackKoLoginFailed();

    public static native void callbackKoLoginSuccess(String str, String str2);

    public static native void callbackOrderCheck(String str, int i);

    public static native void callbackZipProgress(long j, long j2);

    public static native void refreshBatteryInfo(int i, int i2);
}

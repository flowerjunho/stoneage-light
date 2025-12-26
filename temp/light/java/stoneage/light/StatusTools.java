package com.stoneage.light;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.telephony.PhoneStateListener;
import android.telephony.SignalStrength;
import android.telephony.TelephonyManager;
import androidx.core.app.NotificationCompat;

/* loaded from: classes.dex */
public class StatusTools {
    private static final int Network_Data = 1;
    private static final int Network_None = 0;
    private static final int Network_WIFI = 2;
    private static int currentBattery;
    private static int isRecharging;
    private static MyPhoneStateListener myPhoneStateListener;
    private static int networkType;
    private static TelephonyManager phoneManager;
    private static PowerConnectionReceiver powerReceiver;
    private static int signalStrengths;

    public static class PowerConnectionReceiver extends BroadcastReceiver {
        @Override // android.content.BroadcastReceiver
        public void onReceive(Context context, Intent intent) {
            int unused = StatusTools.isRecharging = intent.getIntExtra(NotificationCompat.CATEGORY_STATUS, -1) == 2 ? 1 : 0;
            int unused2 = StatusTools.currentBattery = (int) ((intent.getIntExtra("level", -1) / intent.getIntExtra("scale", -1)) + 0.5d);
            JNILibrary.refreshBatteryInfo(StatusTools.isRecharging, StatusTools.currentBattery);
        }
    }

    public static class MyPhoneStateListener extends PhoneStateListener {
        @Override // android.telephony.PhoneStateListener
        public void onSignalStrengthsChanged(SignalStrength signalStrength) {
            super.onSignalStrengthsChanged(signalStrength);
        }
    }

    public static void readStatus() {
        MyPhoneStateListener myPhoneStateListener2;
        Context appContext = StoneageApplication.getAppContext();
        IntentFilter intentFilter = new IntentFilter("android.intent.action.BATTERY_CHANGED");
        if (powerReceiver == null) {
            powerReceiver = new PowerConnectionReceiver();
        }
        isRecharging = appContext.registerReceiver(powerReceiver, intentFilter).getIntExtra(NotificationCompat.CATEGORY_STATUS, -1) == 2 ? 1 : 0;
        currentBattery = (int) (((r1.getIntExtra("level", -1) / r1.getIntExtra("scale", -1)) * 100.0f) + 0.5d);
        networkType = __getNetworkType();
        if (myPhoneStateListener == null) {
            myPhoneStateListener = new MyPhoneStateListener();
        }
        if (phoneManager == null) {
            phoneManager = (TelephonyManager) appContext.getSystemService("phone");
        }
        TelephonyManager telephonyManager = phoneManager;
        if (telephonyManager != null && (myPhoneStateListener2 = myPhoneStateListener) != null) {
            telephonyManager.listen(myPhoneStateListener2, 256);
        }
        JNILibrary.refreshBatteryInfo(isRecharging, currentBattery);
    }

    public static void endReadStatus() {
        MyPhoneStateListener myPhoneStateListener2;
        Context appContext = StoneageApplication.getAppContext();
        PowerConnectionReceiver powerConnectionReceiver = powerReceiver;
        if (powerConnectionReceiver != null) {
            appContext.unregisterReceiver(powerConnectionReceiver);
        }
        TelephonyManager telephonyManager = phoneManager;
        if (telephonyManager == null || (myPhoneStateListener2 = myPhoneStateListener) == null) {
            return;
        }
        telephonyManager.listen(myPhoneStateListener2, 0);
    }

    private static int __getNetworkType() {
        NetworkInfo activeNetworkInfo = ((ConnectivityManager) StoneageApplication.getAppContext().getSystemService("connectivity")).getActiveNetworkInfo();
        if (activeNetworkInfo != null && activeNetworkInfo.isConnected()) {
            if (activeNetworkInfo.getType() == 1) {
                return 2;
            }
            if (activeNetworkInfo.getType() == 0) {
                return 1;
            }
        }
        return 0;
    }

    public static int checkIsReCharging() {
        return isRecharging;
    }

    public static int getCurrentBattery() {
        return currentBattery;
    }

    public static int getNetworkType() {
        return networkType;
    }

    public static int getSignalStrengths() {
        return signalStrengths;
    }
}

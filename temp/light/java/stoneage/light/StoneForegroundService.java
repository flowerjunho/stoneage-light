package com.stoneage.light;

import android.R;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;
import androidx.core.app.NotificationCompat;

/* loaded from: classes.dex */
public class StoneForegroundService extends Service {
    private static final String CHANNEL_ID = "sckt_keep_42d9a7f1";

    @Override // android.app.Service
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override // android.app.Service
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override // android.app.Service
    public int onStartCommand(Intent intent, int i, int i2) {
        safeStartForeground(1, new NotificationCompat.Builder(this, CHANNEL_ID).setContentTitle("StoneageLight").setContentText("keeplive").setSmallIcon(R.drawable.stat_notify_sync).build());
        return 1;
    }

    @Override // android.app.Service
    public void onDestroy() {
        super.onDestroy();
    }

    private void safeStartForeground(int i, Notification notification) {
        try {
            if (Build.VERSION.SDK_INT >= 28 && checkSelfPermission("android.permission.FOREGROUND_SERVICE") != 0) {
                Log.e("StoneForegroundService", "缺少 FOREGROUND_SERVICE 权限，无法启动前台服务");
            } else {
                startForeground(i, notification);
            }
        } catch (Exception e) {
            Log.e("StoneForegroundService", "startForeground 失败: " + e.getMessage());
            stopSelf();
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel notificationChannelM = KoUtil$$ExternalSyntheticApiModelOutline0.m(CHANNEL_ID, "后台保活通道", 2);
            NotificationManager notificationManager = (NotificationManager) getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(notificationChannelM);
            }
        }
    }
}

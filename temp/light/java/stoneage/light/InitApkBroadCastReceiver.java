package com.stoneage.light;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.text.TextUtils;

/* loaded from: classes.dex */
public class InitApkBroadCastReceiver extends BroadcastReceiver {
    @Override // android.content.BroadcastReceiver
    public void onReceive(Context context, Intent intent) {
        "android.intent.action.PACKAGE_ADDED".equals(intent.getAction());
        "android.intent.action.PACKAGE_REMOVED".equals(intent.getAction());
        if ("android.intent.action.PACKAGE_REPLACED".equals(intent.getAction()) && TextUtils.equals(intent.getData().getSchemeSpecificPart(), KoUtil.getChannel())) {
            StoneageApplication.deleteApkFile();
        }
    }
}

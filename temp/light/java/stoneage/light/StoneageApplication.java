package com.stoneage.light;

import android.app.Activity;
import android.app.Application;
import android.content.Context;
import android.content.pm.PackageManager;
import android.text.TextUtils;
import java.io.File;

/* loaded from: classes.dex */
public class StoneageApplication extends Application {
    private static String __app_version = "";
    private static File _apkFile = null;
    private static boolean _isIsApkUpgrade = false;
    private static Activity activeActivity;
    private static Context appContext;
    private static StoneageApplication single;

    public StoneageApplication() {
        single = this;
    }

    @Override // android.app.Application
    public void onCreate() {
        super.onCreate();
        Context applicationContext = getApplicationContext();
        appContext = applicationContext;
        __app_version = __getAppVersion(applicationContext);
    }

    public static void setIsApkUpgrade(boolean z) {
        _isIsApkUpgrade = z;
    }

    public static void setNewApkFile(File file) {
        _apkFile = file;
    }

    public static void deleteApkFile() {
        File file;
        if (!_isIsApkUpgrade || (file = _apkFile) == null) {
            return;
        }
        _isIsApkUpgrade = false;
        file.delete();
        _apkFile = null;
    }

    public static Context getAppContext() {
        return appContext;
    }

    public static Activity getActivity() {
        return activeActivity;
    }

    public void SetActivity(Activity activity) {
        activeActivity = activity;
        Context applicationContext = activity.getApplicationContext();
        appContext = applicationContext;
        __app_version = __getAppVersion(applicationContext);
    }

    public static String getAppVersion() {
        return __app_version;
    }

    public static StoneageApplication getInstance() {
        return single;
    }

    private String __getAppVersion(Context context) {
        try {
            String str = context.getPackageManager().getPackageInfo(context.getPackageName(), 0).versionName;
            return TextUtils.isEmpty(str) ? "" : str;
        } catch (PackageManager.NameNotFoundException unused) {
            return "";
        }
    }
}

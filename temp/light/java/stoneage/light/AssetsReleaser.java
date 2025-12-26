package com.stoneage.light;

import android.content.SharedPreferences;
import android.content.res.AssetManager;
import android.os.Environment;
import android.os.StatFs;
import android.text.TextUtils;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;

/* loaded from: classes.dex */
public class AssetsReleaser {
    private static String workingPath = "0";

    public static boolean ReleasePathFile(String str) throws IOException {
        String storagePathPrivate = getStoragePathPrivate();
        workingPath = storagePathPrivate;
        if (storagePathPrivate.equals("0") || workingPath.equals("1")) {
            RenderActivity.showErrorMSG("没有找到可读写的存储空间！", 3000);
            return false;
        }
        File file = new File(workingPath + "/data");
        if (!file.exists() && !file.mkdirs()) {
            RenderActivity.showErrorMSG("释放文件失败！", 2001);
            return false;
        }
        File file2 = new File(workingPath + "/data/" + str);
        if (!file2.exists() && !file2.mkdirs()) {
            RenderActivity.showErrorMSG("释放文件失败！", 2001);
            return false;
        }
        AssetManager assets = StoneageApplication.getAppContext().getAssets();
        try {
            for (String str2 : assets.list("data/" + str)) {
                File file3 = new File(workingPath + "/data/" + str + "/" + str2);
                if (!file3.exists()) {
                    file3.createNewFile();
                    InputStream inputStreamOpen = assets.open("data/" + str + "/" + str2);
                    FileOutputStream fileOutputStream = new FileOutputStream(workingPath + "/data/" + str + "/" + str2);
                    byte[] bArr = new byte[1024];
                    while (true) {
                        int i = inputStreamOpen.read(bArr);
                        if (i == -1) {
                            break;
                        }
                        fileOutputStream.write(bArr, 0, i);
                    }
                    fileOutputStream.close();
                    inputStreamOpen.close();
                }
            }
            return true;
        } catch (IOException unused) {
            RenderActivity.showErrorMSG("释放文件失败！", 2001);
            return false;
        }
    }

    public static boolean ReleaseFontFile() {
        return ReleasePathFile("font");
    }

    public static boolean ReleaseSkinFile() {
        return ReleasePathFile("skin");
    }

    private static long getDiskSize(String str) {
        try {
            StatFs statFs = new StatFs(str);
            return statFs.getBlockSizeLong() * statFs.getFreeBlocksLong();
        } catch (Exception unused) {
            RenderActivity.showErrorMSG("无法正确获取存储空间大小,可能无法正确解压资源,请确保有1.5G以上剩余空间", 8008);
            return 2147483648L;
        }
    }

    private static String getStoragePathPrivate() {
        File externalFilesDir;
        String strGetConfig = GetConfig("STONEAGE_BASE_PATH");
        if (TextUtils.isEmpty(strGetConfig)) {
            File filesDir = StoneageApplication.getAppContext().getFilesDir();
            if (filesDir != null) {
                String absolutePath = filesDir.getAbsolutePath();
                if (getDiskSize(absolutePath) < 1610612736) {
                    if ("mounted".equals(Environment.getExternalStorageState()) && (externalFilesDir = StoneageApplication.getAppContext().getExternalFilesDir(null)) != null) {
                        String absolutePath2 = externalFilesDir.getAbsolutePath();
                        if (getDiskSize(absolutePath2) >= 1610612736) {
                            SetConfig("STONEAGE_BASE_PATH", absolutePath2);
                            return absolutePath2;
                        }
                        return "1";
                    }
                    return "1";
                }
                SetConfig("STONEAGE_BASE_PATH", absolutePath);
                return absolutePath;
            }
            return "0";
        }
        workingPath = strGetConfig;
        return strGetConfig;
    }

    public static String getStoragePath() {
        return workingPath;
    }

    public static void SetConfig(String str, String str2) {
        SharedPreferences.Editor editorEdit = StoneageApplication.getActivity().getSharedPreferences("", 0).edit();
        editorEdit.putString(str, str2);
        editorEdit.commit();
    }

    public static String GetConfig(String str) {
        return StoneageApplication.getActivity().getSharedPreferences("", 0).getString(str, "");
    }
}

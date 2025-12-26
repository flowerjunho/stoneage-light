package com.stoneage.light;

import android.util.Log;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Date;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/* loaded from: classes.dex */
public class Decompress {
    private String _location;
    private String _zipFile;

    public Decompress(String str, String str2) {
        this._zipFile = str;
        this._location = str2;
        _dirChecker("");
    }

    public static boolean UnZipAssets(String str, String str2, boolean z) throws IOException {
        int i;
        File file = new File(str2);
        if (!file.exists()) {
            file.mkdirs();
        }
        try {
            ZipInputStream zipInputStream = new ZipInputStream(StoneageApplication.getAppContext().getAssets().open(str));
            byte[] bArr = new byte[1048576];
            for (ZipEntry nextEntry = zipInputStream.getNextEntry(); nextEntry != null; nextEntry = zipInputStream.getNextEntry()) {
                long size = nextEntry.getSize();
                if (nextEntry.isDirectory()) {
                    File file2 = new File(str2 + File.separator + nextEntry.getName());
                    if (!file2.exists()) {
                        file2.mkdir();
                    }
                } else {
                    File file3 = new File(str2 + File.separator + nextEntry.getName());
                    if (z || !file3.exists()) {
                        file3.createNewFile();
                        FileOutputStream fileOutputStream = new FileOutputStream(file3);
                        i = 0;
                        while (true) {
                            int i2 = zipInputStream.read(bArr);
                            if (i2 <= 0) {
                                break;
                            }
                            fileOutputStream.write(bArr, 0, i2);
                            i += i2;
                        }
                        fileOutputStream.close();
                    }
                    JNILibrary.callbackZipProgress(i, size);
                }
                i = 0;
                JNILibrary.callbackZipProgress(i, size);
            }
            zipInputStream.close();
            return true;
        } catch (Exception e) {
            Log.e("Decompress", "UnZipAssets", e);
            return false;
        }
    }

    public boolean unzip() throws IOException {
        int i;
        try {
            ZipInputStream zipInputStream = new ZipInputStream(new FileInputStream(this._zipFile));
            File file = new File(this._location + File.separator);
            if (!file.exists()) {
                file.mkdirs();
            }
            long time = 0;
            while (true) {
                ZipEntry nextEntry = zipInputStream.getNextEntry();
                if (nextEntry != null) {
                    long size = nextEntry.getSize();
                    if (nextEntry.isDirectory()) {
                        Log.v("Decompress", "Unzipping " + nextEntry.getName());
                        _dirChecker(nextEntry.getName());
                        i = 0;
                    } else {
                        FileOutputStream fileOutputStream = new FileOutputStream(this._location + File.separator + nextEntry.getName());
                        byte[] bArr = new byte[1048576];
                        i = 0;
                        while (true) {
                            int i2 = zipInputStream.read(bArr);
                            if (i2 <= 0) {
                                break;
                            }
                            fileOutputStream.write(bArr, 0, i2);
                            i += i2;
                            long time2 = new Date().getTime();
                            if (time2 - time >= 1000) {
                                JNILibrary.callbackZipProgress(i, size);
                                time = time2;
                            }
                        }
                        zipInputStream.closeEntry();
                        fileOutputStream.close();
                    }
                    JNILibrary.callbackZipProgress(i, size);
                    time = new Date().getTime();
                } else {
                    zipInputStream.close();
                    return true;
                }
            }
        } catch (Exception e) {
            Log.e("Decompress", "unzip", e);
            return false;
        }
    }

    private void _dirChecker(String str) {
        File file = new File(this._location + File.separator + str);
        if (file.isDirectory()) {
            return;
        }
        file.mkdirs();
    }

    public static boolean ProcessZip(int i, String str) {
        String str2 = AssetsReleaser.getStoragePath() + str;
        int i2 = 0;
        for (int i3 = 0; i3 < i; i3++) {
            if (!UnZipAssets("patch_" + Integer.toString(i3) + ".zip", str2, true)) {
                break;
            }
            i2++;
        }
        return i2 > 0;
    }

    public static boolean UnZipFile(String str, String str2) {
        return new Decompress(AssetsReleaser.getStoragePath() + "/" + str, AssetsReleaser.getStoragePath() + str2).unzip();
    }
}

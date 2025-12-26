package com.stoneage.light;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

/* loaded from: classes.dex */
public class DeviceIdManager {
    private static final String FILE_NAME = "app_device_id.txt";
    private static final String MIME_TYPE = "text/plain";
    private static final String TAG = "DeviceIdManager";

    public interface Callback {
        void onReady(String str);
    }

    public static void getDeviceId(Activity activity, Callback callback) throws IOException {
        if (Build.VERSION.SDK_INT >= 29) {
            queryOrCreateFile(activity, callback);
        } else {
            useExternalStorageDirect(activity, callback);
        }
    }

    private static void useExternalStorageDirect(Context context, Callback callback) {
        File file = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS), FILE_NAME);
        if (file.exists()) {
            callback.onReady(readFromFile(file));
            return;
        }
        String string = UUID.randomUUID().toString();
        writeToFile(file, string);
        callback.onReady(string);
    }

    private static String readFromFile(File file) {
        try {
            return new BufferedReader(new FileReader(file)).readLine();
        } catch (IOException unused) {
            return null;
        }
    }

    private static void writeToFile(File file, String str) {
        try {
            file.getParentFile().mkdirs();
            FileWriter fileWriter = new FileWriter(file);
            fileWriter.write(str);
            fileWriter.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private static void queryOrCreateFile(Activity activity, Callback callback) throws IOException {
        ContentResolver contentResolver = activity.getContentResolver();
        Uri contentUri = MediaStore.Files.getContentUri("external");
        Cursor cursorQuery = contentResolver.query(contentUri, null, "_display_name=?", new String[]{FILE_NAME}, null);
        if (cursorQuery != null) {
            try {
                if (cursorQuery.moveToFirst()) {
                    callback.onReady(readTextFromUri(contentResolver, ContentUris.withAppendedId(contentUri, cursorQuery.getLong(cursorQuery.getColumnIndexOrThrow("_id")))));
                    if (cursorQuery != null) {
                        cursorQuery.close();
                        return;
                    }
                    return;
                }
            } catch (Throwable th) {
                if (cursorQuery != null) {
                    try {
                        cursorQuery.close();
                    } catch (Throwable th2) {
                        th.addSuppressed(th2);
                    }
                }
                throw th;
            }
        }
        if (cursorQuery != null) {
            cursorQuery.close();
        }
        String string = UUID.randomUUID().toString();
        ContentValues contentValues = new ContentValues();
        contentValues.put("_display_name", FILE_NAME);
        contentValues.put("mime_type", MIME_TYPE);
        contentValues.put("relative_path", Environment.DIRECTORY_DOCUMENTS);
        Uri uriInsert = contentResolver.insert(contentUri, contentValues);
        if (uriInsert != null) {
            try {
                OutputStream outputStreamOpenOutputStream = contentResolver.openOutputStream(uriInsert);
                try {
                    outputStreamOpenOutputStream.write(string.getBytes(StandardCharsets.UTF_8));
                    if (outputStreamOpenOutputStream != null) {
                        outputStreamOpenOutputStream.close();
                    }
                    callback.onReady(string);
                } finally {
                }
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
    }

    private static String readTextFromUri(ContentResolver contentResolver, Uri uri) throws IOException {
        try {
            InputStream inputStreamOpenInputStream = contentResolver.openInputStream(uri);
            try {
                String line = new BufferedReader(new InputStreamReader(inputStreamOpenInputStream)).readLine();
                if (inputStreamOpenInputStream != null) {
                    inputStreamOpenInputStream.close();
                }
                return line;
            } finally {
            }
        } catch (IOException unused) {
            return null;
        }
    }
}

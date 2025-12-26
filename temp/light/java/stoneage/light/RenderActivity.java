package com.stoneage.light;

import android.app.ActivityManager;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import com.beiguard.gameshield.GameshieldManager;
import com.scottyab.rootbeer.RootBeer;
import com.stoneage.kr.R;
import com.stoneage.light.SoftKeyBoardListener;
import org.libsdl.app.SDLActivity;

/* loaded from: classes.dex */
public class RenderActivity extends SDLActivity {
    @Override // org.libsdl.app.SDLActivity, android.app.Activity
    protected void onCreate(Bundle bundle) {
        ((StoneageApplication) getApplication()).SetActivity(this);
        if (checkMemory() && AssetsReleaser.ReleaseFontFile()) {
            AssetsReleaser.ReleaseSkinFile();
        }
        super.onCreate(bundle);
        Intent intent = new Intent(this, (Class<?>) StoneForegroundService.class);
        if (Build.VERSION.SDK_INT >= 26) {
            startForegroundService(intent);
        } else {
            startService(intent);
        }
        GameshieldManager.start(this, "z4ifjMOpdAByg9AI9W6ear1NSZMjErc5JtAfInigeRDJMAWf+q3Ifvocr/J2l7vb15fjzYqf+G1I9xCZV2Za11UHEhnw29QvZu06lyK/0gczSlW4aodOEh4hFW0hUdsbhZOJMGI/H4nSgBCyKqrSF8VsEt7eymCgnKUIndiwDfc9PoWusR08amZzZ9jMihcbMVex3YlHMpsOl+h3GF3jQ0fxyqO4BUkA0MNBv9L4NxSh/L+6b1V3y7cmfm25J2fLSv5CetgUuU4EZdxkr4k1IC7IvCHr4rWHFr7uP4euNIxgXcCV1HHtRvfMWxdkM8+7trWxeGfA55CshUswDWQPhp3ob3nJ4YUHSRKmuxfE4hkRtDNBdAL4kYgJoHw4dg6g9wWm7yi8ijYVT8utP/vp6YdQ94r4TX9F3ohMhOONi+yHbAs3/GAFRM4N36sW1H4FhSS9YIazTf8MpcBr7RoD0w==", "");
        if (isRootAvailable()) {
            showErrorMSG("请在非root的手机中运行《StoneAge》！", 0);
        } else {
            SoftKeyBoardListener.setListener(this, new SoftKeyBoardListener.OnSoftKeyBoardChangeListener() { // from class: com.stoneage.light.RenderActivity.1
                @Override // com.stoneage.light.SoftKeyBoardListener.OnSoftKeyBoardChangeListener
                public void keyBoardShow(int i) {
                    JNILibrary.callbackKeyboardChange(1, i);
                }

                @Override // com.stoneage.light.SoftKeyBoardListener.OnSoftKeyBoardChangeListener
                public void keyBoardHide(int i) {
                    JNILibrary.callbackKeyboardChange(0, 0);
                }
            });
        }
    }

    @Override // org.libsdl.app.SDLActivity, android.app.Activity
    protected void onPause() {
        super.onPause();
        StatusTools.readStatus();
    }

    @Override // org.libsdl.app.SDLActivity, android.app.Activity
    protected void onResume() {
        super.onResume();
        StatusTools.endReadStatus();
    }

    @Override // org.libsdl.app.SDLActivity, android.app.Activity
    protected void onDestroy() throws InterruptedException {
        stopService(new Intent(this, (Class<?>) StoneForegroundService.class));
        super.onDestroy();
    }

    @Override // org.libsdl.app.SDLActivity
    protected String[] getLibraries() {
        return new String[]{"SDL3", "SDL3_image", "SDL3_mixer", "SDL3_ttf", "Stoneage"};
    }

    private boolean isRootAvailable() {
        return new RootBeer(getContext()).isRooted();
    }

    private boolean checkMemory() {
        ActivityManager activityManager = (ActivityManager) getSystemService("activity");
        ActivityManager.MemoryInfo memoryInfo = new ActivityManager.MemoryInfo();
        activityManager.getMemoryInfo(memoryInfo);
        if (memoryInfo.availMem >= 1048576) {
            return true;
        }
        showErrorMSG("您的手机性能不给力，\n请更换手机后再来冒险吧！", 8000);
        return false;
    }

    private static void showErrorMSG(CharSequence charSequence, int i, final boolean z) {
        AlertDialog.Builder builder = new AlertDialog.Builder(StoneageApplication.getActivity());
        builder.setIcon(R.mipmap.ic_launcher);
        builder.setTitle("StoneAge");
        builder.setMessage(((Object) charSequence) + "[CODE:" + i + "]");
        builder.setPositiveButton("确定", new DialogInterface.OnClickListener() { // from class: com.stoneage.light.RenderActivity.2
            @Override // android.content.DialogInterface.OnClickListener
            public void onClick(DialogInterface dialogInterface, int i2) {
                if (z) {
                    System.exit(0);
                }
            }
        });
        builder.setCancelable(false);
        builder.show();
    }

    public static void showErrorMSG(CharSequence charSequence, int i) {
        showErrorMSG(charSequence, i, true);
    }
}

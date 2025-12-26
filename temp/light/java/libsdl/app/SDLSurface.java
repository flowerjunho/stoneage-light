package org.libsdl.app;

import android.app.Activity;
import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.Handler;
import android.util.Log;
import android.view.Display;
import android.view.DisplayCutout;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.Surface;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowManager;
import java.util.List;
import org.libsdl.app.SDLActivity;

/* loaded from: classes.dex */
public class SDLSurface extends SurfaceView implements SurfaceHolder.Callback, View.OnApplyWindowInsetsListener, View.OnKeyListener, View.OnTouchListener, SensorEventListener {
    protected Display mDisplay;
    protected float mHeight;
    public boolean mIsSurfaceReady;
    protected SensorManager mSensorManager;
    protected float mWidth;

    @Override // android.hardware.SensorEventListener
    public void onAccuracyChanged(Sensor sensor, int i) {
    }

    public SDLSurface(Context context) {
        super(context);
        getHolder().addCallback(this);
        setFocusable(true);
        setFocusableInTouchMode(true);
        requestFocus();
        setOnApplyWindowInsetsListener(this);
        setOnKeyListener(this);
        setOnTouchListener(this);
        this.mDisplay = ((WindowManager) context.getSystemService("window")).getDefaultDisplay();
        this.mSensorManager = (SensorManager) context.getSystemService("sensor");
        setOnGenericMotionListener(SDLActivity.getMotionListener());
        this.mWidth = 1.0f;
        this.mHeight = 1.0f;
        this.mIsSurfaceReady = false;
    }

    public void handlePause() {
        enableSensor(1, false);
    }

    public void handleResume() {
        setFocusable(true);
        setFocusableInTouchMode(true);
        requestFocus();
        setOnApplyWindowInsetsListener(this);
        setOnKeyListener(this);
        setOnTouchListener(this);
        enableSensor(1, true);
    }

    public Surface getNativeSurface() {
        return getHolder().getSurface();
    }

    @Override // android.view.SurfaceHolder.Callback
    public void surfaceCreated(SurfaceHolder surfaceHolder) {
        Log.v("SDL", "surfaceCreated()");
        SDLActivity.onNativeSurfaceCreated();
    }

    @Override // android.view.SurfaceHolder.Callback
    public void surfaceDestroyed(SurfaceHolder surfaceHolder) {
        Log.v("SDL", "surfaceDestroyed()");
        SDLActivity.mNextNativeState = SDLActivity.NativeState.PAUSED;
        SDLActivity.handleNativeState();
        this.mIsSurfaceReady = false;
        SDLActivity.onNativeSurfaceDestroyed();
    }

    /* JADX WARN: Removed duplicated region for block: B:50:0x0037 A[EXC_TOP_SPLITTER, SYNTHETIC] */
    @Override // android.view.SurfaceHolder.Callback
    /*
        Code decompiled incorrectly, please refer to instructions dump.
        To view partially-correct add '--show-bad-code' argument
    */
    public void surfaceChanged(android.view.SurfaceHolder r8, int r9, int r10, int r11) {
        /*
            Method dump skipped, instructions count: 245
            To view this dump add '--comments-level debug' option
        */
        throw new UnsupportedOperationException("Method not decompiled: org.libsdl.app.SDLSurface.surfaceChanged(android.view.SurfaceHolder, int, int, int):void");
    }

    public static int[] getSafeInsets() {
        DisplayCutout displayCutout;
        List boundingRects;
        int[] iArr = {0, 0, 0, 0};
        if (Build.VERSION.SDK_INT >= 28 && (displayCutout = ((Activity) SDL.getContext()).getWindow().getDecorView().getRootWindowInsets().getDisplayCutout()) != null && (boundingRects = displayCutout.getBoundingRects()) != null && boundingRects.size() != 0) {
            iArr[0] = displayCutout.getSafeInsetLeft();
            iArr[1] = displayCutout.getSafeInsetRight();
            iArr[2] = displayCutout.getSafeInsetTop();
            iArr[3] = displayCutout.getSafeInsetBottom();
        }
        return iArr;
    }

    @Override // android.view.View.OnApplyWindowInsetsListener
    public WindowInsets onApplyWindowInsets(View view, WindowInsets windowInsets) {
        int[] safeInsets = getSafeInsets();
        Log.i("Insets", "left:" + safeInsets[0] + ",right:" + safeInsets[1] + ",top:" + safeInsets[2] + ",bottom:" + safeInsets[3]);
        SDLActivity.onNativeInsetsChanged(safeInsets[0], safeInsets[1], safeInsets[2], safeInsets[3]);
        return windowInsets;
    }

    @Override // android.view.View.OnKeyListener
    public boolean onKey(View view, int i, KeyEvent keyEvent) {
        return SDLActivity.handleKeyEvent(view, i, keyEvent, null);
    }

    private float getNormalizedX(float f) {
        float f2 = this.mWidth;
        if (f2 <= 1.0f) {
            return 0.5f;
        }
        return f / (f2 - 1.0f);
    }

    private float getNormalizedY(float f) {
        float f2 = this.mHeight;
        if (f2 <= 1.0f) {
            return 0.5f;
        }
        return f / (f2 - 1.0f);
    }

    @Override // android.view.View.OnTouchListener
    public boolean onTouch(View view, MotionEvent motionEvent) {
        int deviceId = motionEvent.getDeviceId();
        int pointerCount = motionEvent.getPointerCount();
        int actionMasked = motionEvent.getActionMasked();
        int actionIndex = (actionMasked == 6 || actionMasked == 5) ? motionEvent.getActionIndex() : 0;
        do {
            int toolType = motionEvent.getToolType(actionIndex);
            if (toolType == 3) {
                int buttonState = motionEvent.getButtonState();
                SDLGenericMotionListener_API14 motionListener = SDLActivity.getMotionListener();
                SDLActivity.onNativeMouse(buttonState, actionMasked, motionListener.getEventX(motionEvent, actionIndex), motionListener.getEventY(motionEvent, actionIndex), motionListener.inRelativeMode());
            } else if (toolType == 2 || toolType == 4) {
                int pointerId = motionEvent.getPointerId(actionIndex);
                float x = motionEvent.getX(actionIndex);
                float y = motionEvent.getY(actionIndex);
                float pressure = motionEvent.getPressure(actionIndex);
                if (pressure > 1.0f) {
                    pressure = 1.0f;
                }
                SDLActivity.onNativePen(pointerId, (motionEvent.getButtonState() >> 4) | (1 << (toolType == 2 ? 0 : 30)), actionMasked, x, y, pressure);
            } else {
                int pointerId2 = motionEvent.getPointerId(actionIndex);
                float normalizedX = getNormalizedX(motionEvent.getX(actionIndex));
                float normalizedY = getNormalizedY(motionEvent.getY(actionIndex));
                float pressure2 = motionEvent.getPressure(actionIndex);
                SDLActivity.onNativeTouch(deviceId, pointerId2, actionMasked, normalizedX, normalizedY, pressure2 > 1.0f ? 1.0f : pressure2);
            }
            if (actionMasked == 6 || actionMasked == 5) {
                break;
            }
            actionIndex++;
        } while (actionIndex < pointerCount);
        return true;
    }

    public void enableSensor(int i, boolean z) {
        if (z) {
            SensorManager sensorManager = this.mSensorManager;
            sensorManager.registerListener(this, sensorManager.getDefaultSensor(i), 1, (Handler) null);
        } else {
            SensorManager sensorManager2 = this.mSensorManager;
            sensorManager2.unregisterListener(this, sensorManager2.getDefaultSensor(i));
        }
    }

    @Override // android.hardware.SensorEventListener
    public void onSensorChanged(SensorEvent sensorEvent) {
        float f;
        float f2;
        if (sensorEvent.sensor.getType() == 1) {
            int rotation = this.mDisplay.getRotation();
            int i = 0;
            if (rotation == 1) {
                f = -sensorEvent.values[1];
                f2 = sensorEvent.values[0];
                i = 90;
            } else if (rotation == 2) {
                f = -sensorEvent.values[0];
                f2 = -sensorEvent.values[1];
                i = 180;
            } else if (rotation != 3) {
                f = sensorEvent.values[0];
                f2 = sensorEvent.values[1];
            } else {
                f = sensorEvent.values[1];
                f2 = -sensorEvent.values[0];
                i = 270;
            }
            if (i != SDLActivity.mCurrentRotation) {
                SDLActivity.mCurrentRotation = i;
                SDLActivity.onNativeRotationChanged(i);
            }
            SDLActivity.onNativeAccel((-f) / 9.80665f, f2 / 9.80665f, sensorEvent.values[2] / 9.80665f);
        }
    }

    @Override // android.view.View
    public boolean onCapturedPointerEvent(MotionEvent motionEvent) {
        int actionMasked = motionEvent.getActionMasked();
        int pointerCount = motionEvent.getPointerCount();
        for (int i = 0; i < pointerCount; i++) {
            if (actionMasked == 2 || actionMasked == 7) {
                SDLActivity.onNativeMouse(0, actionMasked, motionEvent.getX(i), motionEvent.getY(i), true);
                return true;
            }
            if (actionMasked == 8) {
                SDLActivity.onNativeMouse(0, actionMasked, motionEvent.getAxisValue(10, i), motionEvent.getAxisValue(9, i), false);
                return true;
            }
            if (actionMasked == 11 || actionMasked == 12) {
                SDLActivity.onNativeMouse(motionEvent.getButtonState(), actionMasked != 11 ? 1 : 0, motionEvent.getX(i), motionEvent.getY(i), true);
                return true;
            }
        }
        return false;
    }
}

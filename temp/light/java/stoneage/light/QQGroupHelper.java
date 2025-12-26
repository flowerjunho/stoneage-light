package com.stoneage.light;

import android.content.Intent;
import android.net.Uri;

/* loaded from: classes.dex */
public class QQGroupHelper {
    public static int joinQQGroup(String str) {
        Intent intent = new Intent();
        intent.setData(Uri.parse("mqqopensdkapi://bizAgent/qm/qr?url=http%3A%2F%2Fqm.qq.com%2Fcgi-bin%2Fqm%2Fqr%3Ffrom%3Dapp%26p%3Dandroid%26k%3D" + str));
        try {
            StoneageApplication.getActivity().startActivity(intent);
            return 1;
        } catch (Exception unused) {
            return 0;
        }
    }
}

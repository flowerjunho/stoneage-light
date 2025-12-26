package com.beiguard.gameshield;

import a.e;
import a.f;
import a.g;
import a.h;
import a.i;
import a.k;
import a.l;
import a.m;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.os.Handler;
import android.os.Looper;
import androidx.core.app.NotificationCompat;
import androidx.core.view.InputDeviceCompat;
import androidx.core.view.PointerIconCompat;
import com.tencent.bugly.BuglyStrategy;
import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.Socket;
import java.net.SocketTimeoutException;
import java.net.URL;
import java.net.URLEncoder;
import java.net.UnknownHostException;
import java.nio.ByteBuffer;
import java.nio.channels.Selector;
import java.nio.channels.SocketChannel;
import java.nio.charset.Charset;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Random;
import java.util.Scanner;
import java.util.TimeZone;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.Executor;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java9.util.concurrent.CompletableFuture;
import java9.util.function.BiConsumer;
import java9.util.function.Function;
import java9.util.function.Supplier;
import javax.crypto.NoSuchPaddingException;
import kotlin.text.Typography;
import org.json.JSONException;
import org.json.JSONObject;

/* loaded from: classes.dex */
public class GameshieldManager {
    public static ScheduledFuture A = null;
    public static ScheduledFuture B = null;
    public static long B0 = 0;
    public static ScheduledFuture C = null;
    public static String D = null;
    public static String E = null;
    public static String F = null;
    public static String G = null;
    public static long H = 0;
    public static long I = 0;
    public static long K = 0;
    public static String L0 = null;
    public static String M0 = null;
    public static String N0 = null;
    public static Context O = null;
    public static String O0 = null;
    public static final AtomicBoolean Q0;
    public static final long[] R0;
    public static int S0 = 0;
    public static final String[] T0;
    public static final String[] U0;
    public static String V = null;
    public static final String[] V0;
    public static final int[] W0;
    public static final int[] X0;
    public static final int[] Y0;
    public static final String[] Z0;
    public static boolean a1 = false;
    public static final DialogInterface.OnClickListener b1;
    public static AlertDialog c1 = null;
    public static final Handler d1;
    public static Map<Integer, Integer> e = null;
    public static boolean f = false;
    public static Selector i;
    public static CompletableFuture<Void> m;
    public static CompletableFuture<Void> n;
    public static CompletableFuture<Void> o;
    public static CompletableFuture<String> s;
    public static String s0;
    public static ExecutorService t;
    public static String t0;
    public static ExecutorService u;
    public static ExecutorService v;
    public static ExecutorService w;
    public static ScheduledExecutorService x;
    public static ScheduledExecutorService y;
    public static ScheduledExecutorService z;

    /* renamed from: a, reason: collision with root package name */
    public static final int[] f24a = {445, 593, 707, 901, InputDeviceCompat.SOURCE_GAMEPAD, 1068, 1353, 1434, 1723, 2745, 3127, 3128, 3129, 3130, 3333, 4444, 4786, 539};

    /* renamed from: b, reason: collision with root package name */
    public static final int[] f25b = {4900, 4901, 4902, 4903, 4904, 4905, 4906, 4907, 4908, 4909, 4910, 4911, 4912, 4913, 4914, 4915, 4916, 4917};
    public static final int[] c = {5554, 5800, 5900, 6167, 6667, 8998, 9996, 8866};
    public static final int[] d = {7800, 7801, 7802, 7803, 7804, 7805, 7806, 7807};
    public static final ArrayList<HashMap<b, b>> g = new ArrayList<>();
    public static final ArrayList<HashMap<b, b>> h = new ArrayList<>();
    public static final ArrayList j = new ArrayList();
    public static final ArrayList k = new ArrayList();
    public static final AtomicBoolean l = new AtomicBoolean(false);
    public static final AtomicReference<CompletableFuture<Void>> p = new AtomicReference<>();
    public static final ArrayList q = new ArrayList();
    public static final ArrayList r = new ArrayList();
    public static long J = -1;
    public static final AtomicLong L = new AtomicLong(-1);
    public static final AtomicLong M = new AtomicLong(-1);
    public static final AtomicLong N = new AtomicLong(-1);
    public static final ConcurrentLinkedQueue<k> P = new ConcurrentLinkedQueue<>();
    public static boolean Q = false;
    public static boolean R = false;
    public static final String[] S = new String[4];
    public static final int[] T = new int[4];
    public static final String[] U = new String[4];
    public static final int[] W = new int[4];
    public static final int[] X = new int[4];
    public static final int[] Y = new int[4];
    public static final int[] Z = new int[4];
    public static final int[] a0 = new int[4];
    public static final String[] b0 = new String[3];
    public static final SocketChannel[] c0 = new SocketChannel[5];
    public static a d0 = new a();
    public static boolean e0 = false;
    public static int f0 = 1;
    public static int g0 = 0;
    public static boolean h0 = false;
    public static int i0 = 0;
    public static int j0 = 0;
    public static int k0 = 0;
    public static int l0 = 0;
    public static String m0 = "0";
    public static int n0 = 1;
    public static String o0 = "";
    public static String p0 = "0";
    public static String q0 = "0";
    public static int r0 = 0;
    public static String u0 = "0";
    public static boolean v0 = false;
    public static boolean w0 = false;
    public static boolean x0 = false;
    public static boolean y0 = false;
    public static boolean z0 = false;
    public static final Object A0 = new Object();
    public static String C0 = "";
    public static final int[] D0 = new int[4];
    public static int E0 = 200;
    public static String F0 = "";
    public static final int[] G0 = new int[4];
    public static String H0 = "";
    public static int I0 = 0;
    public static final StringBuilder J0 = new StringBuilder();
    public static final String[] K0 = {"https://searchplugin.csdn.net/api/v1/ip/get?ip=", "https://2024.ipchaxun.com", "https://cip.cc", "https://myip.ipip.net", "https://ifconfig.me", "https://ident.me", "https://api.ipify.org", "https://whois.pconline.com.cn/ipJson.jsp?ip=&json=true"};
    public static final AtomicLong P0 = new AtomicLong(0);

    public static class a {
        public String A;
        public String B;
        public String C;
        public int D;
        public int E;
        public int F;
        public int G;
        public String H;
        public String I;
        public String J;
        public int K;
        public int L;
        public String M;
        public String N;
        public String O;
        public String P;
        public int Q;
        public int R;
        public int S;
        public int T;
        public String U;

        /* renamed from: a, reason: collision with root package name */
        public int f26a;

        /* renamed from: b, reason: collision with root package name */
        public String f27b;
        public String c;
        public int d;
        public int e;
        public String f;
        public String g;
        public int h;
        public int i;
        public int j;
        public int k;
        public int l;
        public String m;
        public String n;
        public String o;
        public int p;
        public int q;
        public int r;
        public int s;
        public String t;
        public String u;
        public String v;
        public int w;
        public int x;
        public int y;
        public int z;
    }

    public static class b {

        /* renamed from: a, reason: collision with root package name */
        public final String f28a;

        /* renamed from: b, reason: collision with root package name */
        public final int f29b;
        public final int c;
        public final int d;
        public final int e;
        public final boolean f;
        public String g = "";

        public b(String str, int i, int i2, boolean z, int i3, int i4) {
            this.f28a = str;
            this.f29b = i;
            this.c = i4;
            this.d = i2;
            this.e = i3;
            this.f = z;
        }

        public final boolean equals(Object obj) {
            if (this == obj) {
                return true;
            }
            if (obj == null || b.class != obj.getClass()) {
                return false;
            }
            b bVar = (b) obj;
            return this.f29b == bVar.f29b && Objects.equals(this.f28a, bVar.f28a);
        }

        public final int hashCode() {
            return Objects.hash(this.f28a, Integer.valueOf(this.f29b));
        }
    }

    static {
        new AtomicLong(0L);
        Q0 = new AtomicBoolean(false);
        R0 = new long[12];
        S0 = -1;
        T0 = new String[]{"61.147.108.1", "111.173.106.1", "183.134.19.1", "203.135.98.1", "103.91.211.1", "43.248.140.1"};
        U0 = new String[]{"103.53.127.1", "111.180.189.1", "180.188.20.1", "203.135.99.1", "150.138.73.1", "103.107.188.1"};
        V0 = new String[]{"103.216.152.", "111.173.106.", "180.188.16.", "124.248.65.", "150.138.73.", "43.248.140."};
        W0 = new int[6];
        X0 = new int[6];
        Y0 = new int[6];
        Z0 = new String[6];
        a1 = false;
        b1 = new DialogInterface.OnClickListener() { // from class: com.beiguard.gameshield.GameshieldManager$$ExternalSyntheticLambda0
            @Override // android.content.DialogInterface.OnClickListener
            public final void onClick(DialogInterface dialogInterface, int i2) throws IOException {
                GameshieldManager.a(dialogInterface, i2);
            }
        };
        d1 = new Handler(Looper.getMainLooper());
    }

    public static void A() {
        AtomicReference<CompletableFuture<Void>> atomicReference = p;
        CompletableFuture<Void> andSet = atomicReference.getAndSet(null);
        if (andSet != null) {
            andSet.cancel(true);
        }
        ExecutorService executorService = t;
        if (executorService != null) {
            executorService.shutdownNow();
        }
        t = Executors.newFixedThreadPool(25);
        CompletableFuture<Void> completableFutureC = C();
        atomicReference.set(completableFutureC);
        completableFutureC.thenRunAsync(new Runnable() { // from class: com.beiguard.gameshield.GameshieldManager$$ExternalSyntheticLambda14
            @Override // java.lang.Runnable
            public final void run() {
                GameshieldManager.o();
            }
        }, (Executor) t);
    }

    /* JADX WARN: Removed duplicated region for block: B:15:0x005a  */
    /*
        Code decompiled incorrectly, please refer to instructions dump.
        To view partially-correct add '--show-bad-code' argument
    */
    public static void B() {
        /*
            Method dump skipped, instructions count: 266
            To view this dump add '--comments-level debug' option
        */
        throw new UnsupportedOperationException("Method not decompiled: com.beiguard.gameshield.GameshieldManager.B():void");
    }

    public static CompletableFuture<Void> C() {
        return CompletableFuture.runAsync(new Runnable() { // from class: com.beiguard.gameshield.GameshieldManager$$ExternalSyntheticLambda11
            @Override // java.lang.Runnable
            public final void run() throws InterruptedException, NoSuchPaddingException, NoSuchAlgorithmException, IOException, InvalidKeyException, NumberFormatException {
                GameshieldManager.p();
            }
        }, t);
    }

    public static int a(int i2, int i3, int i4) {
        int i5;
        if (i2 > 10000 && i2 < 30000) {
            return (((i3 * 100) + (i4 + 10000)) + i2) - 1;
        }
        if (i2 <= 5000) {
            i5 = (i3 * 2) + 10000;
        } else if (i2 <= 10000) {
            i5 = (i3 * 2) + 10001;
        } else {
            if (i2 <= 100000 || i2 > 105000) {
                if (i2 > 105001 && i2 <= 110000) {
                    return (i3 * 2) + i4 + 18000 + 1;
                }
                if (i2 < 1000000) {
                    return i3 + i4 + BuglyStrategy.a.MAX_USERDATA_VALUE_LENGTH;
                }
                return ((i3 - 1800) * 10) + i4 + 22000 + (i2 - 1000001);
            }
            i4 += 18000;
            i5 = i3 * 2;
        }
        return i5 + i4;
    }

    public static int a(int i2, int i3, String str) {
        try {
            if (!g(str)) {
                String[] strArrA = a(str, '.');
                int[] iArr = {i2, (((k(strArrA[2]) + k(strArrA[3])) * i) % 1000) + 33300, i + 8000, i + 8018};
                int i4 = iArr[0];
                int i5 = i4 % 455;
                i2 = i3 < 2 ? iArr[i3] + 155 : iArr[i3];
            }
        } catch (Exception unused) {
        }
        return i2;
    }

    /* JADX WARN: Removed duplicated region for block: B:33:0x0093  */
    /* JADX WARN: Removed duplicated region for block: B:38:? A[ADDED_TO_REGION, RETURN, SYNTHETIC] */
    /*
        Code decompiled incorrectly, please refer to instructions dump.
        To view partially-correct add '--show-bad-code' argument
    */
    public static int a(java.lang.String r7, int r8, int r9, int r10) {
        /*
            r0 = 30000(0x7530, float:4.2039E-41)
            r1 = 1
            r2 = 10000(0x2710, float:1.4013E-41)
            if (r8 <= r2) goto L11
            if (r8 >= r0) goto L11
            int r10 = r10 + r2
            int r9 = r9 * 100
            int r9 = r9 + r10
            int r9 = r9 + r8
            int r9 = r9 - r1
            goto La5
        L11:
            boolean r3 = g(r7)
            r4 = 2
            if (r3 != 0) goto L3c
            r3 = 46
            java.lang.String[] r7 = a(r7, r3)
            r3 = r7[r1]
            int r3 = k(r3)
            r5 = r7[r4]
            int r5 = k(r5)
            r6 = 3
            r7 = r7[r6]
            int r7 = k(r7)
            int r3 = r3 * r7
            int r3 = r3 % 66
            int r5 = r5 * r7
            int r5 = r5 + 25887
            int r5 = r5 % 49
            goto L3e
        L3c:
            r3 = 0
            r5 = 0
        L3e:
            r7 = 5000(0x1388, float:7.006E-42)
            if (r8 > r7) goto L49
            int r9 = r9 * 2
            int r9 = r9 + (-280)
        L46:
            int r9 = r9 + r3
        L47:
            int r9 = r9 + r10
            goto L87
        L49:
            if (r8 > r2) goto L50
            int r9 = r9 * 2
            int r9 = r9 + (-279)
            goto L46
        L50:
            r7 = 100000(0x186a0, float:1.4013E-40)
            if (r8 <= r7) goto L5f
            r7 = 105000(0x19a28, float:1.47136E-40)
            if (r8 > r7) goto L5f
            int r10 = r10 + 18000
            int r9 = r9 * 2
            goto L47
        L5f:
            r7 = 105001(0x19a29, float:1.47138E-40)
            if (r8 <= r7) goto L70
            r7 = 110000(0x1adb0, float:1.54143E-40)
            if (r8 > r7) goto L70
            int r10 = r10 + 18000
            int r9 = r9 * 2
            int r9 = r9 + r10
            int r9 = r9 + r1
            goto L87
        L70:
            r7 = 1000000(0xf4240, float:1.401298E-39)
            if (r8 < r7) goto L84
            int r5 = r5 + 4520
            int r5 = r5 + r10
            int r9 = r9 + (-1800)
            int r9 = r9 * 10
            int r9 = r9 + r5
            r7 = 1000001(0xf4241, float:1.4013E-39)
            int r8 = r8 - r7
            int r8 = r8 + r9
            r9 = r8
            goto L87
        L84:
            int r10 = r10 + r0
            int r10 = r10 + r9
            r9 = r10
        L87:
            java.util.Map<java.lang.Integer, java.lang.Integer> r7 = com.beiguard.gameshield.GameshieldManager.e
            java.lang.Integer r8 = java.lang.Integer.valueOf(r9)
            boolean r7 = r7.containsKey(r8)
            if (r7 == 0) goto La5
            java.util.Map<java.lang.Integer, java.lang.Integer> r7 = com.beiguard.gameshield.GameshieldManager.e
            java.lang.Integer r8 = java.lang.Integer.valueOf(r9)
            java.lang.Object r7 = r7.get(r8)
            java.lang.Integer r7 = (java.lang.Integer) r7
            if (r7 == 0) goto La5
            int r9 = r7.intValue()
        La5:
            return r9
        */
        throw new UnsupportedOperationException("Method not decompiled: com.beiguard.gameshield.GameshieldManager.a(java.lang.String, int, int, int):int");
    }

    public static a a(String str) {
        a aVar = new a();
        try {
            JSONObject jSONObject = new JSONObject(str);
            if (!jSONObject.isNull("result")) {
                aVar.f26a = jSONObject.getInt("result");
            }
            if (!jSONObject.isNull("uid")) {
                aVar.f27b = jSONObject.getString("uid");
            }
            if (!jSONObject.isNull("start_ip")) {
                aVar.c = jSONObject.getString("start_ip");
            }
            if (!jSONObject.isNull("limit_mode")) {
                aVar.d = jSONObject.getInt("limit_mode");
            }
            if (!jSONObject.isNull("limit_num")) {
                aVar.e = jSONObject.getInt("limit_num");
            }
            if (!jSONObject.isNull("limit_num_str")) {
                aVar.f = jSONObject.getString("limit_num_str");
            }
            if (!jSONObject.isNull("anim_flg")) {
                aVar.g = jSONObject.getString("anim_flg");
            }
            if (!jSONObject.isNull("android_flg")) {
                aVar.h = jSONObject.getInt("android_flg");
            }
            if (!jSONObject.isNull("tls_open")) {
                aVar.i = jSONObject.getInt("tls_open");
            }
            if (!jSONObject.isNull("start_port")) {
                aVar.j = jSONObject.getInt("start_port");
            }
            if (!jSONObject.isNull("sysn_port")) {
                aVar.k = jSONObject.getInt("sysn_port");
            }
            if (!jSONObject.isNull("extra_port")) {
                aVar.l = jSONObject.getInt("extra_port");
            }
            if (!jSONObject.isNull("now_version")) {
                aVar.m = jSONObject.getString("now_version");
            }
            if (!jSONObject.isNull("to_ip")) {
                aVar.n = jSONObject.getString("to_ip");
            }
            if (!jSONObject.isNull(NotificationCompat.CATEGORY_MESSAGE)) {
                aVar.o = jSONObject.getString(NotificationCompat.CATEGORY_MESSAGE);
            }
            if (!jSONObject.isNull("tls_open2")) {
                aVar.p = jSONObject.getInt("tls_open2");
            }
            if (!jSONObject.isNull("start_port2")) {
                aVar.q = jSONObject.getInt("start_port2");
            }
            if (!jSONObject.isNull("sysn_port2")) {
                aVar.r = jSONObject.getInt("sysn_port2");
            }
            if (!jSONObject.isNull("extra_port2")) {
                aVar.s = jSONObject.getInt("extra_port2");
            }
            if (!jSONObject.isNull("now_version2")) {
                aVar.t = jSONObject.getString("now_version2");
            }
            if (!jSONObject.isNull("to_ip2")) {
                aVar.u = jSONObject.getString("to_ip2");
            }
            if (!jSONObject.isNull("msg2")) {
                aVar.v = jSONObject.getString("msg2");
            }
            if (!jSONObject.isNull("tls_open3")) {
                aVar.w = jSONObject.getInt("tls_open3");
            }
            if (!jSONObject.isNull("start_port3")) {
                aVar.x = jSONObject.getInt("start_port3");
            }
            if (!jSONObject.isNull("sysn_port3")) {
                aVar.y = jSONObject.getInt("sysn_port3");
            }
            if (!jSONObject.isNull("extra_port3")) {
                aVar.z = jSONObject.getInt("extra_port3");
            }
            if (!jSONObject.isNull("now_version3")) {
                aVar.A = jSONObject.getString("now_version3");
            }
            if (!jSONObject.isNull("to_ip3")) {
                aVar.B = jSONObject.getString("to_ip3");
            }
            if (!jSONObject.isNull("msg3")) {
                aVar.C = jSONObject.getString("msg3");
            }
            if (!jSONObject.isNull("tls_open4")) {
                aVar.D = jSONObject.getInt("tls_open4");
            }
            if (!jSONObject.isNull("start_port4")) {
                aVar.E = jSONObject.getInt("start_port4");
            }
            if (!jSONObject.isNull("sysn_port4")) {
                aVar.F = jSONObject.getInt("sysn_port4");
            }
            if (!jSONObject.isNull("extra_port4")) {
                aVar.G = jSONObject.getInt("extra_port4");
            }
            if (!jSONObject.isNull("now_version4")) {
                aVar.H = jSONObject.getString("now_version4");
            }
            if (!jSONObject.isNull("to_ip4")) {
                aVar.I = jSONObject.getString("to_ip4");
            }
            if (!jSONObject.isNull("msg4")) {
                aVar.J = jSONObject.getString("msg4");
            }
            if (!jSONObject.isNull("sp_flg")) {
                aVar.K = jSONObject.getInt("sp_flg");
            }
            if (!jSONObject.isNull("band_str")) {
                aVar.L = jSONObject.getInt("band_str");
            }
            if (!jSONObject.isNull("url")) {
                aVar.M = jSONObject.getString("url");
            }
            if (!jSONObject.isNull("dnsGroup")) {
                aVar.N = jSONObject.getString("dnsGroup");
            }
            if (!jSONObject.isNull("sniOpen")) {
                aVar.O = jSONObject.getString("sniOpen");
            }
            if (!jSONObject.isNull("shortConnection")) {
                aVar.P = jSONObject.getString("shortConnection");
            }
            if (!jSONObject.isNull("sql_id1")) {
                aVar.Q = jSONObject.getInt("sql_id1");
            }
            if (!jSONObject.isNull("sql_id2")) {
                aVar.R = jSONObject.getInt("sql_id2");
            }
            if (!jSONObject.isNull("sql_id3")) {
                aVar.S = jSONObject.getInt("sql_id3");
            }
            if (!jSONObject.isNull("sql_id4")) {
                aVar.T = jSONObject.getInt("sql_id4");
            }
            if (!jSONObject.isNull("useHighPort")) {
                aVar.U = jSONObject.getString("useHighPort");
            }
        } catch (Exception unused) {
        }
        return aVar;
    }

    public static String a(a aVar) throws JSONException {
        try {
            JSONObject jSONObject = new JSONObject();
            jSONObject.put("result", aVar.f26a);
            Object obj = aVar.f27b;
            if (obj == null) {
                obj = JSONObject.NULL;
            }
            jSONObject.put("uid", obj);
            Object obj2 = aVar.c;
            if (obj2 == null) {
                obj2 = JSONObject.NULL;
            }
            jSONObject.put("start_ip", obj2);
            jSONObject.put("limit_mode", aVar.d);
            jSONObject.put("limit_num", aVar.e);
            Object obj3 = aVar.f;
            if (obj3 == null) {
                obj3 = JSONObject.NULL;
            }
            jSONObject.put("limit_num_str", obj3);
            Object obj4 = aVar.g;
            if (obj4 == null) {
                obj4 = JSONObject.NULL;
            }
            jSONObject.put("anim_flg", obj4);
            jSONObject.put("android_flg", aVar.h);
            jSONObject.put("tls_open", aVar.i);
            jSONObject.put("start_port", aVar.j);
            jSONObject.put("sysn_port", aVar.k);
            jSONObject.put("extra_port", aVar.l);
            Object obj5 = aVar.m;
            if (obj5 == null) {
                obj5 = JSONObject.NULL;
            }
            jSONObject.put("now_version", obj5);
            Object obj6 = aVar.n;
            if (obj6 == null) {
                obj6 = JSONObject.NULL;
            }
            jSONObject.put("to_ip", obj6);
            Object obj7 = aVar.o;
            if (obj7 == null) {
                obj7 = JSONObject.NULL;
            }
            jSONObject.put(NotificationCompat.CATEGORY_MESSAGE, obj7);
            jSONObject.put("tls_open2", aVar.p);
            jSONObject.put("start_port2", aVar.q);
            jSONObject.put("sysn_port2", aVar.r);
            jSONObject.put("extra_port2", aVar.s);
            Object obj8 = aVar.t;
            if (obj8 == null) {
                obj8 = JSONObject.NULL;
            }
            jSONObject.put("now_version2", obj8);
            Object obj9 = aVar.u;
            if (obj9 == null) {
                obj9 = JSONObject.NULL;
            }
            jSONObject.put("to_ip2", obj9);
            Object obj10 = aVar.v;
            if (obj10 == null) {
                obj10 = JSONObject.NULL;
            }
            jSONObject.put("msg2", obj10);
            jSONObject.put("tls_open3", aVar.w);
            jSONObject.put("start_port3", aVar.x);
            jSONObject.put("sysn_port3", aVar.y);
            jSONObject.put("extra_port3", aVar.z);
            Object obj11 = aVar.A;
            if (obj11 == null) {
                obj11 = JSONObject.NULL;
            }
            jSONObject.put("now_version3", obj11);
            Object obj12 = aVar.B;
            if (obj12 == null) {
                obj12 = JSONObject.NULL;
            }
            jSONObject.put("to_ip3", obj12);
            Object obj13 = aVar.C;
            if (obj13 == null) {
                obj13 = JSONObject.NULL;
            }
            jSONObject.put("msg3", obj13);
            jSONObject.put("tls_open4", aVar.D);
            jSONObject.put("start_port4", aVar.E);
            jSONObject.put("sysn_port4", aVar.F);
            jSONObject.put("extra_port4", aVar.G);
            Object obj14 = aVar.H;
            if (obj14 == null) {
                obj14 = JSONObject.NULL;
            }
            jSONObject.put("now_version4", obj14);
            Object obj15 = aVar.I;
            if (obj15 == null) {
                obj15 = JSONObject.NULL;
            }
            jSONObject.put("to_ip4", obj15);
            Object obj16 = aVar.J;
            if (obj16 == null) {
                obj16 = JSONObject.NULL;
            }
            jSONObject.put("msg4", obj16);
            jSONObject.put("sp_flg", aVar.K);
            jSONObject.put("band_str", aVar.L);
            Object obj17 = aVar.M;
            if (obj17 == null) {
                obj17 = JSONObject.NULL;
            }
            jSONObject.put("url", obj17);
            Object obj18 = aVar.N;
            if (obj18 == null) {
                obj18 = JSONObject.NULL;
            }
            jSONObject.put("dnsGroup", obj18);
            Object obj19 = aVar.O;
            if (obj19 == null) {
                obj19 = JSONObject.NULL;
            }
            jSONObject.put("sniOpen", obj19);
            Object obj20 = aVar.P;
            if (obj20 == null) {
                obj20 = JSONObject.NULL;
            }
            jSONObject.put("shortConnection", obj20);
            jSONObject.put("sql_id1", aVar.Q);
            jSONObject.put("sql_id2", aVar.R);
            jSONObject.put("sql_id3", aVar.S);
            jSONObject.put("sql_id4", aVar.T);
            Object obj21 = aVar.U;
            if (obj21 == null) {
                obj21 = JSONObject.NULL;
            }
            jSONObject.put("useHighPort", obj21);
            return jSONObject.toString();
        } catch (Exception unused) {
            return "";
        }
    }

    public static void a(int i2) {
        String str;
        if (i2 == 1001) {
            int i3 = n0;
            str = i3 == 2 ? "啟動失敗，請校準本地時間後進行嘗試，錯誤碼 1001" : i3 == 3 ? "Startup failed, please calibrate the local time and try again, error code 1001" : "启动失败，请校准本地时间后进行尝试，错误码 1001";
        } else if (i2 == 1002) {
            int i4 = n0;
            str = i4 == 2 ? "啟動失敗，數據解密錯誤，錯誤碼 1002" : i4 == 3 ? "Startup failed, data decryption error, error code 1002" : "启动失败，数据解密错误，错误码 1002";
        } else if (i2 == 1003) {
            int i5 = n0;
            str = i5 == 2 ? "啟動失敗，實例ID不存在，請聯系管理員，錯誤碼 1003" : i5 == 3 ? "Startup failed, instance ID does not exist, please contact the administrator, error code 1003" : "启动失败，实例ID不存在，请联系管理员，错误码 1003";
        } else if (i2 == 1010) {
            int i6 = n0;
            str = i6 == 2 ? "啟動失敗，與服務器通訊失敗，請聯系管理員，錯誤碼 1010" : i6 == 3 ? "Failed to start, failed to communicate with the server, please contact the administrator, error code 1010" : "启动失败，与服务器通讯失败，请联系管理员，错误码 1010";
        } else {
            if (i2 != 1011) {
                return;
            }
            int i7 = n0;
            str = i7 == 2 ? "啟動失敗，數據解密錯誤，錯誤碼 1011" : i7 == 3 ? "Startup failed, data decryption error, error code 1011" : "启动失败，数据解密错误，错误码 1011";
        }
        showAlertDialog(e(), str, true);
    }

    public static void a(final int i2, final String str, final int i3, final String str2, final AtomicReference atomicReference, ExecutorService executorService, boolean z2) {
        final AtomicReference atomicReference2 = new AtomicReference(Boolean.FALSE);
        final ArrayList arrayList = new ArrayList();
        long j2 = z2 ? 5000L : 2000L;
        int i4 = 0;
        while (i4 < 3) {
            final boolean z3 = true;
            final int i5 = i4;
            final long j3 = j2;
            arrayList.add(CompletableFuture.runAsync(new Runnable() { // from class: com.beiguard.gameshield.GameshieldManager$$ExternalSyntheticLambda1
                @Override // java.lang.Runnable
                public final void run() {
                    GameshieldManager.a(i5, j3, atomicReference2, atomicReference, i2, str, i3, z3, str2, arrayList);
                }
            }, executorService));
            i4++;
            j2 = j2;
        }
        try {
            try {
                long jCurrentTimeMillis = System.currentTimeMillis();
                int i6 = z2 ? 12000 : 8000;
                while (System.currentTimeMillis() - jCurrentTimeMillis < i6 && atomicReference.get() == null) {
                    Thread.sleep(200L);
                    if (Thread.currentThread().isInterrupted()) {
                        throw new InterruptedException();
                    }
                }
                Iterator it = arrayList.iterator();
                while (it.hasNext()) {
                    ((CompletableFuture) it.next()).cancel(true);
                }
                atomicReference2.set(Boolean.TRUE);
                if (x0) {
                    return;
                }
            } catch (InterruptedException unused) {
                Thread.currentThread().interrupt();
                Iterator it2 = arrayList.iterator();
                while (it2.hasNext()) {
                    ((CompletableFuture) it2.next()).cancel(true);
                }
                atomicReference2.set(Boolean.TRUE);
                if (x0) {
                    return;
                }
            }
            t();
        } catch (Throwable th) {
            Iterator it3 = arrayList.iterator();
            while (it3.hasNext()) {
                ((CompletableFuture) it3.next()).cancel(true);
            }
            atomicReference2.set(Boolean.TRUE);
            if (!x0) {
                t();
            }
            throw th;
        }
    }

    public static void a(int i2, String str, SocketChannel socketChannel) throws InterruptedException, IOException {
        ByteBuffer byteBufferAllocate = ByteBuffer.allocate(16384);
        try {
            if (socketChannel.read(byteBufferAllocate) > 0) {
                byteBufferAllocate.flip();
                byte[] bArr = new byte[byteBufferAllocate.remaining()];
                byteBufferAllocate.get(bArr);
                Charset charset = h.f15a;
                byte[] bytes = str.getBytes(charset);
                String strReplace = new String(k.a(bytes, bArr), charset).replace("\u0000", "");
                int[] iArr = G0;
                if (i2 < iArr.length) {
                    iArr[i2] = iArr[i2] + 10;
                }
                x0 = true;
                int iNextInt = new Random().nextInt(10) + 11;
                StringBuilder sb = new StringBuilder("0|");
                sb.append(e("0" + strReplace + "-pZERyQYmz5mIYHWOxifKerOLYpR9tm0i"));
                sb.append("|");
                sb.append(e.a(iNextInt));
                ByteBuffer byteBufferWrap = ByteBuffer.wrap(k.a(bytes, sb.toString().getBytes(charset)));
                while (byteBufferWrap.hasRemaining()) {
                    socketChannel.write(byteBufferWrap);
                }
                byteBufferAllocate.compact();
                Thread.sleep(3L);
            }
        } catch (Exception unused) {
        }
    }

    public static /* synthetic */ void a(DialogInterface dialogInterface, int i2) throws IOException {
        stop();
        Context context = O;
        if (context instanceof Activity) {
            ((Activity) context).finishAffinity();
        }
    }

    /* JADX WARN: Removed duplicated region for block: B:65:0x0169 A[EXC_TOP_SPLITTER, SYNTHETIC] */
    /*
        Code decompiled incorrectly, please refer to instructions dump.
        To view partially-correct add '--show-bad-code' argument
    */
    public static void a(java.lang.String r26, int r27, java.lang.String r28) throws java.lang.NumberFormatException {
        /*
            Method dump skipped, instructions count: 389
            To view this dump add '--comments-level debug' option
        */
        throw new UnsupportedOperationException("Method not decompiled: com.beiguard.gameshield.GameshieldManager.a(java.lang.String, int, java.lang.String):void");
    }

    public static void a(final String str, final long j2) {
        int i2 = d0.f26a;
        if (i2 == 1088 || i2 == 1004 || i2 == 1005 || i2 == 1024) {
            return;
        }
        CompletableFuture.completedFuture(null).thenCompose(new Function() { // from class: com.beiguard.gameshield.GameshieldManager$$ExternalSyntheticLambda5
            @Override // java9.util.function.Function
            public /* synthetic */ Function andThen(Function function) {
                return Function.CC.$default$andThen(this, function);
            }

            @Override // java9.util.function.Function
            public final Object apply(Object obj) {
                return GameshieldManager.b(str, j2, GameshieldManager.F, GameshieldManager.E);
            }

            @Override // java9.util.function.Function
            public /* synthetic */ Function compose(Function function) {
                return Function.CC.$default$compose(this, function);
            }
        }).thenRun(new Runnable() { // from class: com.beiguard.gameshield.GameshieldManager$$ExternalSyntheticLambda6
            @Override // java.lang.Runnable
            public final void run() {
                GameshieldManager.n();
            }
        }).exceptionally(new Function() { // from class: com.beiguard.gameshield.GameshieldManager$$ExternalSyntheticLambda7
            @Override // java9.util.function.Function
            public /* synthetic */ Function andThen(Function function) {
                return Function.CC.$default$andThen(this, function);
            }

            @Override // java9.util.function.Function
            public final Object apply(Object obj) {
                return GameshieldManager.d((Throwable) obj);
            }

            @Override // java9.util.function.Function
            public /* synthetic */ Function compose(Function function) {
                return Function.CC.$default$compose(this, function);
            }
        });
    }

    public static /* synthetic */ void a(String str, String str2, boolean z2, Activity activity, int i2) {
        Handler handler = d1;
        handler.removeCallbacksAndMessages(null);
        AlertDialog alertDialog = c1;
        if (alertDialog == null || !alertDialog.isShowing()) {
            AlertDialog.Builder builder = new AlertDialog.Builder(activity);
            builder.setTitle(str).setMessage(str2).setPositiveButton(z2 ? "关闭" : "确认", z2 ? b1 : null);
            AlertDialog alertDialogCreate = builder.create();
            c1 = alertDialogCreate;
            alertDialogCreate.show();
        } else {
            c1.setTitle(str);
            c1.setMessage(str2);
            c1.setButton(-1, z2 ? "关闭" : "确认", z2 ? b1 : null);
        }
        if (i2 > 0) {
            handler.postDelayed(new Runnable() { // from class: com.beiguard.gameshield.GameshieldManager$$ExternalSyntheticLambda15
                @Override // java.lang.Runnable
                public final void run() {
                    GameshieldManager.h();
                }
            }, i2);
        }
    }

    public static /* synthetic */ void a(CompletableFuture completableFuture, String str, Throwable th) {
        if (g(str)) {
            return;
        }
        Iterator it = r.iterator();
        while (it.hasNext()) {
            CompletableFuture completableFuture2 = (CompletableFuture) it.next();
            if (completableFuture2 != completableFuture) {
                completableFuture2.cancel(true);
            }
        }
        n.complete(null);
    }

    public static boolean a(int i2, String str) {
        ArrayList arrayList;
        int iA;
        int i3 = k0;
        if (i3 == 1) {
            int iD = d();
            int i4 = l0;
            if (i4 != 0 && iD >= i4) {
                return false;
            }
        } else if (i3 == 2) {
            if (g(str)) {
                iA = 0;
            } else {
                ArrayList arrayList2 = j;
                synchronized (arrayList2) {
                    arrayList = new ArrayList(arrayList2);
                }
                Iterator it = arrayList.iterator();
                iA = 0;
                while (it.hasNext()) {
                    k kVar = (k) it.next();
                    if (str.equals(kVar.C)) {
                        iA += kVar.a();
                    }
                }
            }
            int i5 = l0;
            if (i5 != 0 && iA >= i5) {
                return false;
            }
        } else if (i3 == 3) {
            int i6 = l0;
            if (i6 != 0 && i2 >= i6) {
                return false;
            }
        } else if (i3 == 4) {
            int iB = b(str);
            int iD2 = d(str);
            if (iD2 != 0 && iB >= iD2) {
                return false;
            }
        }
        return true;
    }

    public static boolean a(String str, String str2) {
        a aVarA = a(str);
        if (aVarA.f26a != 200) {
            return true;
        }
        try {
            String strA = a.a.a(aVarA.n, str2);
            if (!g(strA) && !h(strA) && !i(strA)) {
                return false;
            }
            String strA2 = a.a.a(aVarA.u, str2);
            if (!g(strA2) && !h(strA2) && !i(strA2)) {
                return false;
            }
            String strA3 = a.a.a(aVarA.B, str2);
            if (!g(strA3) && !h(strA3) && !i(strA3)) {
                return false;
            }
            String strA4 = a.a.a(aVarA.I, str2);
            if (!g(strA4) && !h(strA4)) {
                if (!i(strA4)) {
                    return false;
                }
            }
            int i2 = aVarA.k;
            if (!g(strA) && (i2 < 1 || i2 > 65535)) {
                return false;
            }
            int i3 = aVarA.r;
            if (!g(strA2) && (i3 < 1 || i3 > 65535)) {
                return false;
            }
            int i4 = aVarA.y;
            if (!g(strA3) && (i4 < 1 || i4 > 65535)) {
                return false;
            }
            int i5 = aVarA.F;
            return g(strA4) || (i5 >= 1 && i5 <= 65535);
        } catch (Exception unused) {
            return false;
        }
    }

    public static String[] a(String str, char c2) {
        int i2 = 1;
        for (int i3 = 0; i3 < str.length(); i3++) {
            if (str.charAt(i3) == c2) {
                i2++;
            }
        }
        String[] strArr = new String[i2];
        int i4 = 0;
        int i5 = 0;
        for (int i6 = 0; i6 < str.length(); i6++) {
            if (str.charAt(i6) == c2) {
                strArr[i5] = str.substring(i4, i6);
                i4 = i6 + 1;
                i5++;
            }
        }
        strArr[i5] = str.substring(i4);
        return strArr;
    }

    public static int b(String str) {
        ArrayList arrayList;
        int iA = 0;
        if (g(str)) {
            return 0;
        }
        ArrayList arrayList2 = j;
        synchronized (arrayList2) {
            arrayList = new ArrayList(arrayList2);
        }
        Iterator it = arrayList.iterator();
        while (it.hasNext()) {
            k kVar = (k) it.next();
            if (str.equals(kVar.C)) {
                iA += kVar.a();
            }
        }
        return iA;
    }

    public static String b(int i2, String str) {
        String str2 = (i2 == 1 || i2 == 2) ? M0 : i2 == 3 ? O0 : L0;
        if (g(str2)) {
            return "";
        }
        String[] strArrA = a(str2, ',');
        if (strArrA.length < 5) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        sb.append(("0".equals(strArrA[4]) || "1".equals(strArrA[4])) ? "https://" : "http://");
        sb.append(strArrA[1]);
        String string = sb.toString();
        String str3 = strArrA[2];
        String str4 = strArrA[3];
        String str5 = "vercode=" + e.a(new Random().nextInt(32) + 1) + "&url_id=" + (i2 + 1);
        if ("1".equals(str3)) {
            StringBuilder sb2 = new StringBuilder();
            String string2 = Long.toString(l.a());
            sb2.append(string + str + "?auth_key=" + string2 + "-0-0-" + e(str + "-" + string2 + "-0-0-" + str4));
            sb2.append("&");
            sb2.append(str5);
            return sb2.toString();
        }
        if ("2".equals(str3)) {
            StringBuilder sb3 = new StringBuilder();
            SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyyMMddHHmm", Locale.CHINA);
            simpleDateFormat.setTimeZone(TimeZone.getTimeZone("Asia/Shanghai"));
            String str6 = simpleDateFormat.format(Long.valueOf(System.currentTimeMillis()));
            sb3.append(string + "/" + str6 + "/" + e(str4 + str6 + str) + str);
            sb3.append("?");
            sb3.append(str5);
            return sb3.toString();
        }
        if ("3".equals(str3) || "4".equals(str3)) {
            StringBuilder sb4 = new StringBuilder();
            String lowerCase = Long.toHexString(l.a()).toLowerCase();
            sb4.append(string + "/" + e(str4 + str + lowerCase) + "/" + lowerCase + str);
            sb4.append("?");
            sb4.append(str5);
            return sb4.toString();
        }
        if (!"5".equals(str3)) {
            return string + str + "?" + str5;
        }
        StringBuilder sb5 = new StringBuilder();
        String string3 = Long.toString(l.a());
        sb5.append(string + str + "?sign=" + string3 + "-0-0-" + e(str + "-" + string3 + "-0-0-" + str4));
        sb5.append("&");
        sb5.append(str5);
        return sb5.toString();
    }

    public static /* synthetic */ Void b(Throwable th) {
        if (th.getCause() instanceof InterruptedException) {
            Thread.currentThread().interrupt();
        }
        th.getMessage();
        int i2 = i.f17a;
        return null;
    }

    public static CompletableFuture b(final String str, final long j2, final String str2, final String str3) {
        return CompletableFuture.supplyAsync(new Supplier() { // from class: com.beiguard.gameshield.GameshieldManager$$ExternalSyntheticLambda13
            @Override // java9.util.function.Supplier
            public final Object get() {
                return GameshieldManager.a(str, j2, str3, str2);
            }
        });
    }

    public static void b() {
        File file = new File(D);
        if ((!file.exists() || file.isDirectory()) && !v0) {
            c(1, 0, "本地文件不存在，间隔10秒");
            y();
            return;
        }
        ScheduledFuture scheduledFuture = B;
        if (scheduledFuture != null) {
            scheduledFuture.cancel(true);
            y.shutdownNow();
        }
    }

    public static void b(int i2) throws IOException {
        SocketChannel socketChannel = c0[i2];
        if (socketChannel != null) {
            try {
                socketChannel.close();
            } catch (Exception unused) {
            }
            c0[i2] = null;
        }
    }

    public static /* synthetic */ void b(int i2, int i3, String str) {
        StringBuilder sb;
        String str2;
        if (w0) {
            return;
        }
        w0 = true;
        if (i2 <= 5 || i2 != i3) {
            String string = "本地端口监听失败（端口号：" + str + "）\n请注意避开热门端口，建议使用大一些的端口号";
            int i4 = n0;
            if (i4 != 2) {
                if (i4 == 3) {
                    sb = new StringBuilder("Local port listening failed (Port number: ");
                    sb.append(str);
                    str2 = ")\nPlease avoid popular ports and consider using higher port numbers.";
                }
                showAlertDialog(e(), string, false, 5000);
            }
            sb = new StringBuilder("本地端口監聽失敗（端口號：");
            sb.append(str);
            str2 = "）\n請注意避開熱門端口，建議使用大一些的端口號";
            sb.append(str2);
            string = sb.toString();
            showAlertDialog(e(), string, false, 5000);
        }
    }

    public static int c(String str) {
        int i2 = 0;
        while (true) {
            String[] strArr = S;
            if (i2 >= strArr.length) {
                return 0;
            }
            if (str.equals(strArr[i2])) {
                return T[i2];
            }
            i2++;
        }
    }

    public static k c(int i2, String str) {
        ArrayList arrayList;
        ArrayList arrayList2 = j;
        synchronized (arrayList2) {
            arrayList = new ArrayList(arrayList2);
        }
        Iterator it = arrayList.iterator();
        while (it.hasNext()) {
            k kVar = (k) it.next();
            if (kVar.f21b == i2 && str.equals(kVar.f20a)) {
                return kVar;
            }
        }
        return null;
    }

    public static /* synthetic */ Void c(Throwable th) {
        th.getMessage();
        int i2 = i.f17a;
        return null;
    }

    public static void c() {
        int i2;
        synchronized (g) {
            i2 = 0;
            int i3 = 0;
            while (true) {
                ArrayList<HashMap<b, b>> arrayList = g;
                if (i3 >= arrayList.size()) {
                    break;
                }
                arrayList.get(i3).clear();
                i3++;
            }
        }
        synchronized (h) {
            while (true) {
                ArrayList<HashMap<b, b>> arrayList2 = h;
                if (i2 < arrayList2.size()) {
                    arrayList2.get(i2).clear();
                    i2++;
                }
            }
        }
    }

    public static int d() {
        ArrayList arrayList;
        ArrayList arrayList2 = j;
        synchronized (arrayList2) {
            arrayList = new ArrayList(arrayList2);
        }
        Iterator it = arrayList.iterator();
        int iA = 0;
        while (it.hasNext()) {
            iA += ((k) it.next()).a();
        }
        return iA;
    }

    public static int d(String str) {
        if (g(str)) {
            return 0;
        }
        try {
            int i2 = Integer.parseInt(a(str, '.')[r6.length - 1]) % 10;
            String[] strArrA = a(m0, '|');
            ArrayList arrayList = new ArrayList();
            for (String str2 : strArrA) {
                try {
                    arrayList.add(Integer.valueOf(Integer.parseInt(str2)));
                } catch (NumberFormatException unused) {
                    return 0;
                }
            }
            if (i2 >= 0 && i2 < arrayList.size()) {
                return ((Integer) arrayList.get(i2)).intValue();
            }
        } catch (NumberFormatException unused2) {
        }
        return 0;
    }

    public static m d(int i2, String str) {
        ArrayList arrayList;
        ArrayList arrayList2 = k;
        synchronized (arrayList2) {
            arrayList = new ArrayList(arrayList2);
        }
        Iterator it = arrayList.iterator();
        while (it.hasNext()) {
            m mVar = (m) it.next();
            if (mVar.f23b.getLocalPort() == i2 && str.equals(mVar.f23b.getLocalAddress().getHostAddress())) {
                return mVar;
            }
        }
        return null;
    }

    public static /* synthetic */ Void d(Throwable th) {
        th.getMessage();
        int i2 = i.f17a;
        return null;
    }

    public static String e() {
        if ("1".equals(q0)) {
            int i2 = n0;
            return i2 == 2 ? "雲彩盾" : i2 == 3 ? "yuncaidun" : "云彩盾";
        }
        if ("99".equals(q0) || "2".equals(p0)) {
            int i3 = n0;
            return i3 == 2 ? "遊戲盾" : i3 == 3 ? "GameShield" : "游戏盾";
        }
        int i4 = n0;
        return i4 == 2 ? "千鳥盾" : i4 == 3 ? "QianNiaoDun" : "千鸟盾";
    }

    public static String e(String str) {
        if (str != null && !str.isEmpty()) {
            try {
                byte[] bArrDigest = MessageDigest.getInstance("MD5").digest(str.getBytes(h.f15a));
                StringBuilder sb = new StringBuilder();
                for (byte b2 : bArrDigest) {
                    sb.append(String.format("%02x", Byte.valueOf(b2)));
                }
                return sb.toString();
            } catch (Exception unused) {
            }
        }
        return "";
    }

    public static boolean f() {
        CompletableFuture<Void> completableFuture = p.get();
        return completableFuture == null || completableFuture.isCancelled();
    }

    /* JADX WARN: Removed duplicated region for block: B:27:0x0057  */
    /*
        Code decompiled incorrectly, please refer to instructions dump.
        To view partially-correct add '--show-bad-code' argument
    */
    public static boolean f(java.lang.String r6) {
        /*
            java.lang.String r0 = r6.trim()
            boolean r0 = r0.isEmpty()
            r1 = 0
            if (r0 == 0) goto Lc
            return r1
        Lc:
            java.lang.String r6 = r6.trim()
            java.util.Stack r0 = new java.util.Stack
            r0.<init>()
            r2 = 0
        L16:
            int r3 = r6.length()
            if (r2 >= r3) goto L61
            char r3 = r6.charAt(r2)
            r4 = 91
            if (r3 == r4) goto L57
            r5 = 93
            if (r3 == r5) goto L44
            r4 = 123(0x7b, float:1.72E-43)
            if (r3 == r4) goto L57
            r5 = 125(0x7d, float:1.75E-43)
            if (r3 == r5) goto L31
            goto L5e
        L31:
            boolean r3 = r0.isEmpty()
            if (r3 != 0) goto L43
            java.lang.Object r3 = r0.pop()
            java.lang.Character r3 = (java.lang.Character) r3
            char r3 = r3.charValue()
            if (r3 == r4) goto L5e
        L43:
            return r1
        L44:
            boolean r3 = r0.isEmpty()
            if (r3 != 0) goto L56
            java.lang.Object r3 = r0.pop()
            java.lang.Character r3 = (java.lang.Character) r3
            char r3 = r3.charValue()
            if (r3 == r4) goto L5e
        L56:
            return r1
        L57:
            java.lang.Character r3 = java.lang.Character.valueOf(r3)
            r0.push(r3)
        L5e:
            int r2 = r2 + 1
            goto L16
        L61:
            boolean r6 = r0.isEmpty()
            return r6
        */
        throw new UnsupportedOperationException("Method not decompiled: com.beiguard.gameshield.GameshieldManager.f(java.lang.String):boolean");
    }

    public static Void g() throws IOException {
        String strB;
        ScheduledFuture scheduledFuture;
        while (true) {
            strB = b(new Random().nextInt(4), "/log_error.php");
            if (!g(strB) && strB.contains("https://")) {
                break;
            }
        }
        String uniqueID = getUniqueID();
        HashMap map = new HashMap();
        map.put("device_uid", uniqueID);
        map.put("instance_id", F);
        map.put("err_data", I0 + "|Android|(1726)|Main:" + H0 + "|Local:" + g.b().a() + "|Debug:" + ((Object) J0));
        if (v0) {
            ScheduledFuture scheduledFuture2 = B;
            if (scheduledFuture2 != null) {
                scheduledFuture2.cancel(true);
                y.shutdownNow();
            }
            return null;
        }
        try {
            HttpURLConnection httpURLConnection = (HttpURLConnection) new URL(strB).openConnection();
            httpURLConnection.setConnectTimeout(5000);
            httpURLConnection.setReadTimeout(5000);
            httpURLConnection.setRequestMethod("POST");
            httpURLConnection.setDoOutput(true);
            StringBuilder sb = new StringBuilder();
            for (Map.Entry entry : map.entrySet()) {
                if (sb.length() != 0) {
                    sb.append(Typography.amp);
                }
                sb.append(URLEncoder.encode((String) entry.getKey(), "UTF-8"));
                sb.append('=');
                sb.append(URLEncoder.encode((String) entry.getValue(), "UTF-8"));
            }
            httpURLConnection.getOutputStream().write(sb.toString().getBytes(h.f15a));
            if (httpURLConnection.getResponseCode() == 200 && a(new Scanner(httpURLConnection.getInputStream()).useDelimiter("\\A").next()).f26a == 200 && (scheduledFuture = B) != null) {
                scheduledFuture.cancel(true);
                y.shutdownNow();
            }
            httpURLConnection.disconnect();
            return null;
        } catch (Exception e2) {
            throw new RuntimeException(e2);
        }
    }

    public static boolean g(String str) {
        return str == null || str.isEmpty();
    }

    public static String getUniqueID() {
        if (O == null) {
            return null;
        }
        return e(f.a());
    }

    public static String getUniqueID(Context context) {
        O = context;
        f.f12b = context.getApplicationContext();
        return getUniqueID();
    }

    public static String getUniqueID_OBSOLETE() {
        if (O == null) {
            return null;
        }
        String strC = e.c();
        if (g(strC) || strC.length() < 12) {
            strC = e.b();
        }
        String strE = e(strC);
        return "5d3ae5fd1fd252644a4aa0d6873e86ca".equals(strE) ? e(e.b()) : strE;
    }

    public static String getUniqueID_OBSOLETE(Context context) {
        O = context;
        e.f10b = context.getApplicationContext();
        return getUniqueID_OBSOLETE();
    }

    public static /* synthetic */ void h() {
        AlertDialog alertDialog = c1;
        if (alertDialog == null || !alertDialog.isShowing()) {
            return;
        }
        c1.dismiss();
    }

    public static boolean h(String str) throws NumberFormatException {
        String[] strArrA = a(str, '.');
        if (strArrA.length != 4) {
            return false;
        }
        try {
            for (String str2 : strArrA) {
                int i2 = Integer.parseInt(str2);
                if (i2 < 0 || i2 > 255) {
                    return false;
                }
            }
            return true;
        } catch (NumberFormatException unused) {
            return false;
        }
    }

    public static String i() throws JSONException, IOException {
        String string = "";
        try {
            HttpURLConnection httpURLConnection = (HttpURLConnection) new URL("https://acs.m.taobao.com/gw/mtop.common.getTimestamp/").openConnection();
            httpURLConnection.setRequestMethod("GET");
            if (httpURLConnection.getResponseCode() == 200) {
                BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(httpURLConnection.getInputStream()));
                StringBuilder sb = new StringBuilder();
                while (true) {
                    String line = bufferedReader.readLine();
                    if (line == null) {
                        break;
                    }
                    sb.append(line);
                }
                bufferedReader.close();
                try {
                    JSONObject jSONObject = new JSONObject(sb.toString());
                    if (!jSONObject.isNull("data")) {
                        JSONObject jSONObject2 = jSONObject.getJSONObject("data");
                        if (!jSONObject2.isNull("t")) {
                            string = jSONObject2.getString("t");
                            if (Math.abs(Long.parseLong(string) - System.currentTimeMillis()) > 7200000) {
                                String str = "请检查本地时间";
                                int i2 = n0;
                                if (i2 == 2) {
                                    str = "請檢查本地時間";
                                } else if (i2 == 3) {
                                    str = "Please check local time";
                                }
                                showAlertDialog(e(), str, false);
                            } else {
                                x0 = true;
                            }
                        }
                    }
                } catch (Exception unused) {
                }
            }
            httpURLConnection.disconnect();
        } catch (Exception unused2) {
        }
        return string;
    }

    public static boolean i(String str) {
        int i2;
        String[] strArrA = a(str, ':');
        if (strArrA.length >= 3 && strArrA.length <= 8) {
            try {
                for (String str2 : strArrA) {
                    if (!str2.isEmpty() && (str2.length() > 4 || (i2 = Integer.parseInt(str2, 16)) < 0 || i2 > 65535)) {
                        return false;
                    }
                }
                return true;
            } catch (NumberFormatException unused) {
            }
        }
        return false;
    }

    public static /* synthetic */ void j() {
    }

    public static /* synthetic */ void j(String str) {
        StringBuilder sb;
        String str2;
        if (w0) {
            return;
        }
        w0 = true;
        String string = "本地端口监听失败（端口号：" + str + "）\n请注意避开热门端口，建议使用大一些的端口号";
        int i2 = n0;
        if (i2 != 2) {
            if (i2 == 3) {
                sb = new StringBuilder("Local port listening failed (Port number: ");
                sb.append(str);
                str2 = ")\nPlease avoid popular ports and consider using higher port numbers.";
            }
            showAlertDialog(e(), string, false, 5000);
        }
        sb = new StringBuilder("本地端口監聽失敗（端口號：");
        sb.append(str);
        str2 = "）\n請注意避開熱門端口，建議使用大一些的端口號";
        sb.append(str2);
        string = sb.toString();
        showAlertDialog(e(), string, false, 5000);
    }

    public static int k(String str) {
        try {
            return Integer.parseInt(str);
        } catch (NumberFormatException unused) {
            return 0;
        }
    }

    public static /* synthetic */ void k() {
        Iterator it = r.iterator();
        while (it.hasNext()) {
            CompletableFuture completableFuture = (CompletableFuture) it.next();
            if (!completableFuture.isCancelled()) {
                String str = (String) completableFuture.join();
                if (!g(str)) {
                    G = str;
                }
            }
        }
    }

    public static int l(String str) throws UnknownHostException {
        try {
            InetAddress byName = InetAddress.getByName(str);
            long jCurrentTimeMillis = System.currentTimeMillis();
            while (System.currentTimeMillis() - jCurrentTimeMillis <= 1000) {
                if (byName.isReachable(1000)) {
                    return (int) (System.currentTimeMillis() - jCurrentTimeMillis);
                }
            }
            return -1;
        } catch (IOException e2) {
            e2.getMessage();
            int i2 = i.f17a;
            return -1;
        }
    }

    public static /* synthetic */ void l() throws IOException {
        l.set(true);
        Q = false;
        Selector selector = i;
        if (selector != null) {
            try {
                selector.close();
            } catch (Exception e2) {
                e2.getMessage();
                int i2 = i.f17a;
            }
        }
        ArrayList arrayList = j;
        synchronized (arrayList) {
            Iterator it = arrayList.iterator();
            while (it.hasNext()) {
                ((k) it.next()).d();
            }
        }
    }

    public static /* synthetic */ void m() {
    }

    public static void m(String str) {
        if (g(str) || str.length() < 20) {
            return;
        }
        for (String str2 : a(str, '|')) {
            if (!g(str2)) {
                if (str2.startsWith("1")) {
                    L0 = str2;
                } else if (str2.startsWith("2")) {
                    M0 = str2;
                } else if (str2.startsWith("3")) {
                    N0 = str2;
                } else if (str2.startsWith("4")) {
                    O0 = str2;
                }
            }
        }
    }

    public static /* synthetic */ void n() {
    }

    public static /* synthetic */ void o() {
    }

    /* JADX WARN: Code restructure failed: missing block: B:120:0x02df, code lost:
    
        r0.append(r1);
        r0.append(r10);
     */
    /* JADX WARN: Code restructure failed: missing block: B:98:0x023a, code lost:
    
        c(1, 0, r0.toString());
     */
    /* JADX WARN: Removed duplicated region for block: B:133:0x032d  */
    /* JADX WARN: Removed duplicated region for block: B:264:0x0590  */
    /*
        Code decompiled incorrectly, please refer to instructions dump.
        To view partially-correct add '--show-bad-code' argument
    */
    public static void p() throws java.lang.InterruptedException, javax.crypto.NoSuchPaddingException, java.security.NoSuchAlgorithmException, java.io.IOException, java.security.InvalidKeyException, java.lang.NumberFormatException {
        /*
            Method dump skipped, instructions count: 1660
            To view this dump add '--comments-level debug' option
        */
        throw new UnsupportedOperationException("Method not decompiled: com.beiguard.gameshield.GameshieldManager.p():void");
    }

    public static void q() throws InterruptedException, UnknownHostException {
        while (true) {
            int iNextInt = new Random().nextInt(6);
            for (int i2 = 0; i2 < 6; i2++) {
                int[] iArr = W0;
                int i3 = iArr[i2] + 1;
                iArr[i2] = i3;
                if (i3 >= 100) {
                    iArr[i2] = 0;
                    X0[i2] = 0;
                }
                String[] strArr = Z0;
                if (strArr[i2].isEmpty()) {
                    String[] strArr2 = T0;
                    int iL = l(strArr2[i2]);
                    if (iL > 0) {
                        Y0[i2] = iL;
                        strArr[i2] = strArr2[i2];
                    } else {
                        String[] strArr3 = U0;
                        int iL2 = l(strArr3[i2]);
                        if (iL2 > 0) {
                            Y0[i2] = iL2;
                            strArr[i2] = strArr3[i2];
                        } else {
                            int i4 = 0;
                            while (true) {
                                if (i4 >= 6) {
                                    break;
                                }
                                String str = V0[i2] + String.valueOf(new Random().nextInt(255));
                                iL2 = l(str);
                                if (iL2 > 0) {
                                    Y0[i2] = iL2;
                                    Z0[i2] = str;
                                    break;
                                }
                                i4++;
                            }
                            if (iL2 <= 0) {
                                int[] iArr2 = X0;
                                iArr2[i2] = iArr2[i2] + 1;
                            }
                        }
                    }
                } else if (i2 == iNextInt) {
                    int iL3 = l(strArr[i2]);
                    if (iL3 > 0) {
                        Y0[i2] = iL3;
                    } else {
                        int[] iArr3 = X0;
                        iArr3[i2] = iArr3[i2] + 1;
                    }
                }
            }
            try {
                Thread.sleep(3000L);
            } catch (InterruptedException e2) {
                throw new RuntimeException(e2);
            }
        }
    }

    public static CompletableFuture<Void> r() {
        return CompletableFuture.supplyAsync(new Supplier() { // from class: com.beiguard.gameshield.GameshieldManager$$ExternalSyntheticLambda21
            @Override // java9.util.function.Supplier
            public final Object get() {
                return GameshieldManager.g();
            }
        });
    }

    public static void s() {
        ScheduledFuture scheduledFuture = A;
        if (scheduledFuture != null) {
            scheduledFuture.cancel(true);
            x.shutdownNow();
        }
        ScheduledExecutorService scheduledExecutorServiceNewSingleThreadScheduledExecutor = Executors.newSingleThreadScheduledExecutor();
        x = scheduledExecutorServiceNewSingleThreadScheduledExecutor;
        A = scheduledExecutorServiceNewSingleThreadScheduledExecutor.scheduleWithFixedDelay(new Runnable() { // from class: com.beiguard.gameshield.GameshieldManager$$ExternalSyntheticLambda16
            @Override // java.lang.Runnable
            public final void run() {
                GameshieldManager.a();
            }
        }, 0L, 15L, TimeUnit.SECONDS);
    }

    public static void showAlertDialog(String str, String str2, boolean z2) {
        showAlertDialog(str, str2, z2, 0);
    }

    public static void showAlertDialog(final String str, final String str2, final boolean z2, final int i2) {
        Context context = O;
        if (context instanceof Activity) {
            final Activity activity = (Activity) context;
            activity.runOnUiThread(new Runnable() { // from class: com.beiguard.gameshield.GameshieldManager$$ExternalSyntheticLambda17
                @Override // java.lang.Runnable
                public final void run() {
                    GameshieldManager.a(str, str2, z2, activity, i2);
                }
            });
        }
    }

    public static int start(Context context, String str) {
        return start(context, str, "");
    }

    /* JADX WARN: Code restructure failed: missing block: B:208:0x0496, code lost:
    
        r0.delete();
        r0 = "本地文件取不到转发服务器IP或规则为空";
     */
    /* JADX WARN: Removed duplicated region for block: B:51:0x00ef  */
    /*
        Code decompiled incorrectly, please refer to instructions dump.
        To view partially-correct add '--show-bad-code' argument
    */
    public static int start(android.content.Context r16, java.lang.String r17, java.lang.String r18) {
        /*
            Method dump skipped, instructions count: 1317
            To view this dump add '--comments-level debug' option
        */
        throw new UnsupportedOperationException("Method not decompiled: com.beiguard.gameshield.GameshieldManager.start(android.content.Context, java.lang.String, java.lang.String):int");
    }

    public static void stop() throws IOException {
        P0.set(0L);
        AtomicLong atomicLong = N;
        atomicLong.set(-1L);
        L.set(-1L);
        M.set(-1L);
        a("close", atomicLong.get());
        for (int i2 = 0; i2 < 4; i2++) {
            b(i2);
        }
        l.set(true);
        Q = false;
        Selector selector = i;
        if (selector != null) {
            try {
                selector.close();
            } catch (Exception e2) {
                e2.getMessage();
                int i3 = i.f17a;
            }
        }
        Iterator it = j.iterator();
        while (it.hasNext()) {
            ((k) it.next()).d();
        }
        j.clear();
        Iterator it2 = k.iterator();
        while (it2.hasNext()) {
            ((m) it2.next()).d();
        }
        k.clear();
        c();
        int i4 = i.f17a;
        Iterator it3 = r.iterator();
        while (it3.hasNext()) {
            ((CompletableFuture) it3.next()).cancel(true);
        }
        r.clear();
        CompletableFuture<Void> completableFuture = n;
        if (completableFuture != null) {
            completableFuture.cancel(true);
            v.shutdownNow();
        }
        Iterator it4 = q.iterator();
        while (it4.hasNext()) {
            ((CompletableFuture) it4.next()).cancel(true);
        }
        q.clear();
        CompletableFuture<Void> completableFuture2 = m;
        if (completableFuture2 != null) {
            completableFuture2.cancel(true);
            u.shutdownNow();
        }
        CompletableFuture<Void> andSet = p.getAndSet(null);
        if (andSet != null) {
            andSet.cancel(true);
        }
        ExecutorService executorService = t;
        if (executorService != null) {
            executorService.shutdownNow();
        }
        ScheduledFuture scheduledFuture = C;
        if (scheduledFuture != null) {
            scheduledFuture.cancel(true);
            z.shutdownNow();
        }
        Arrays.fill(R0, -1L);
        S0 = -1;
        ScheduledFuture scheduledFuture2 = A;
        if (scheduledFuture2 != null) {
            scheduledFuture2.cancel(true);
            x.shutdownNow();
        }
        ScheduledFuture scheduledFuture3 = B;
        if (scheduledFuture3 != null) {
            scheduledFuture3.cancel(true);
            y.shutdownNow();
        }
        CompletableFuture<Void> completableFuture3 = o;
        if (completableFuture3 != null) {
            completableFuture3.cancel(true);
        }
        CompletableFuture<String> completableFuture4 = s;
        if (completableFuture4 != null) {
            completableFuture4.cancel(true);
            w.shutdownNow();
        }
    }

    public static void t() {
        CompletableFuture<String> completableFuture = s;
        if (completableFuture != null) {
            completableFuture.cancel(true);
            w.shutdownNow();
        }
        w = Executors.newCachedThreadPool();
        s = CompletableFuture.supplyAsync(new Supplier() { // from class: com.beiguard.gameshield.GameshieldManager$$ExternalSyntheticLambda18
            @Override // java9.util.function.Supplier
            public final Object get() {
                return GameshieldManager.i();
            }
        }, w);
    }

    public static void tryGetDynamicIP() {
        if (System.currentTimeMillis() - H > 10000) {
            H = System.currentTimeMillis();
            c(1, 0, "用户主动调用开放接口tryGetDynamicIP");
        }
    }

    public static String tryGetLocalIP() {
        if (!g(G)) {
            return G;
        }
        if (J == -1 || System.currentTimeMillis() - J > 10000) {
            J = System.currentTimeMillis();
            u();
        }
        return G;
    }

    public static void tryTestConnectivity() {
        A();
    }

    public static void u() {
        Iterator it = r.iterator();
        while (it.hasNext()) {
            ((CompletableFuture) it.next()).cancel(true);
        }
        r.clear();
        CompletableFuture<Void> completableFuture = n;
        if (completableFuture != null) {
            completableFuture.cancel(true);
            v.shutdownNow();
        }
        v = Executors.newCachedThreadPool();
        n = new CompletableFuture<>();
        final String[] strArr = K0;
        final int i2 = -1;
        for (final String str : strArr) {
            i2++;
            final CompletableFuture completableFutureSupplyAsync = CompletableFuture.supplyAsync(new Supplier() { // from class: com.beiguard.gameshield.GameshieldManager$$ExternalSyntheticLambda26
                @Override // java9.util.function.Supplier
                public final Object get() {
                    return GameshieldManager.a(str, i2, strArr);
                }
            }, v);
            r.add(completableFutureSupplyAsync);
            completableFutureSupplyAsync.whenComplete(new BiConsumer() { // from class: com.beiguard.gameshield.GameshieldManager$$ExternalSyntheticLambda27
                @Override // java9.util.function.BiConsumer
                public final void accept(Object obj, Object obj2) {
                    GameshieldManager.a(completableFutureSupplyAsync, (String) obj, (Throwable) obj2);
                }

                @Override // java9.util.function.BiConsumer
                public /* synthetic */ BiConsumer andThen(BiConsumer biConsumer) {
                    return BiConsumer.CC.$default$andThen(this, biConsumer);
                }
            });
        }
        n.thenRun(new Runnable() { // from class: com.beiguard.gameshield.GameshieldManager$$ExternalSyntheticLambda28
            @Override // java.lang.Runnable
            public final void run() {
                GameshieldManager.k();
            }
        }).exceptionally(new Function() { // from class: com.beiguard.gameshield.GameshieldManager$$ExternalSyntheticLambda29
            @Override // java9.util.function.Function
            public /* synthetic */ Function andThen(Function function) {
                return Function.CC.$default$andThen(this, function);
            }

            @Override // java9.util.function.Function
            public final Object apply(Object obj) {
                return GameshieldManager.b((Throwable) obj);
            }

            @Override // java9.util.function.Function
            public /* synthetic */ Function compose(Function function) {
                return Function.CC.$default$compose(this, function);
            }
        });
    }

    /* JADX WARN: Removed duplicated region for block: B:71:0x0157  */
    /*
        Code decompiled incorrectly, please refer to instructions dump.
        To view partially-correct add '--show-bad-code' argument
    */
    public static void v() {
        /*
            Method dump skipped, instructions count: 1002
            To view this dump add '--comments-level debug' option
        */
        throw new UnsupportedOperationException("Method not decompiled: com.beiguard.gameshield.GameshieldManager.v():void");
    }

    public static void w() {
        ScheduledFuture scheduledFuture = B;
        if (scheduledFuture != null) {
            scheduledFuture.cancel(true);
            y.shutdownNow();
        }
        ScheduledExecutorService scheduledExecutorServiceNewSingleThreadScheduledExecutor = Executors.newSingleThreadScheduledExecutor();
        y = scheduledExecutorServiceNewSingleThreadScheduledExecutor;
        B = scheduledExecutorServiceNewSingleThreadScheduledExecutor.scheduleWithFixedDelay(new Runnable() { // from class: com.beiguard.gameshield.GameshieldManager$$ExternalSyntheticLambda20
            @Override // java.lang.Runnable
            public final void run() {
                GameshieldManager.b();
            }
        }, 15L, 10L, TimeUnit.SECONDS);
    }

    public static void x() throws InterruptedException {
        if (a1) {
            return;
        }
        a1 = true;
        new Thread(new Runnable() { // from class: com.beiguard.gameshield.GameshieldManager$$ExternalSyntheticLambda19
            @Override // java.lang.Runnable
            public final void run() throws InterruptedException, UnknownHostException {
                GameshieldManager.q();
            }
        }).start();
        try {
            Thread.sleep(100L);
        } catch (InterruptedException e2) {
            throw new RuntimeException(e2);
        }
    }

    public static void y() {
        String str;
        if (g(H0) || v0) {
            return;
        }
        a aVar = d0;
        if (aVar.f26a != 200) {
            return;
        }
        if (I0 != 200) {
            aVar.f26a = 1004;
            String str2 = "本地监听启动失败（" + I0 + "）";
            int i2 = n0;
            if (i2 == 2) {
                str2 = "本地監聽啟動失敗（" + I0 + "）";
                str = "呼叫錯誤+";
            } else if (i2 == 3) {
                str2 = "Local listener failed to start (" + I0 + ")";
                str = "Call Error+";
            } else {
                str = "调用错误+";
            }
            showAlertDialog(str, str2, true);
        }
        CompletableFuture<Void> completableFuture = o;
        if (completableFuture != null) {
            completableFuture.cancel(true);
        }
        o = r().thenRun(new Runnable() { // from class: com.beiguard.gameshield.GameshieldManager$$ExternalSyntheticLambda8
            @Override // java.lang.Runnable
            public final void run() {
                GameshieldManager.m();
            }
        }).exceptionally(new Function() { // from class: com.beiguard.gameshield.GameshieldManager$$ExternalSyntheticLambda9
            @Override // java9.util.function.Function
            public /* synthetic */ Function andThen(Function function) {
                return Function.CC.$default$andThen(this, function);
            }

            @Override // java9.util.function.Function
            public final Object apply(Object obj) {
                return GameshieldManager.c((Throwable) obj);
            }

            @Override // java9.util.function.Function
            public /* synthetic */ Function compose(Function function) {
                return Function.CC.$default$compose(this, function);
            }
        });
    }

    public static void z() {
        ScheduledFuture scheduledFuture = C;
        if (scheduledFuture != null) {
            scheduledFuture.cancel(true);
            z.shutdownNow();
        }
        Arrays.fill(R0, -1L);
        S0 = -1;
        ScheduledExecutorService scheduledExecutorServiceNewSingleThreadScheduledExecutor = Executors.newSingleThreadScheduledExecutor();
        z = scheduledExecutorServiceNewSingleThreadScheduledExecutor;
        C = scheduledExecutorServiceNewSingleThreadScheduledExecutor.scheduleWithFixedDelay(new Runnable() { // from class: com.beiguard.gameshield.GameshieldManager$$ExternalSyntheticLambda10
            @Override // java.lang.Runnable
            public final void run() {
                GameshieldManager.B();
            }
        }, 0L, 1L, TimeUnit.SECONDS);
    }

    public static void c(int i2, final int i3, String str) {
        int i4 = d0.f26a;
        if (i4 == 1088 || i4 == 1004 || i4 == 1005 || i4 == 1024) {
            return;
        }
        int i5 = i3 - 1;
        if (i5 >= 0) {
            int[] iArr = G0;
            if (i5 < iArr.length) {
                iArr[i5] = 0;
            }
        }
        String str2 = "(1726)" + str;
        CompletableFuture<Void> andSet = p.getAndSet(null);
        if (andSet != null) {
            andSet.cancel(true);
        }
        ExecutorService executorService = t;
        if (executorService != null) {
            executorService.shutdownNow();
        }
        Iterator it = q.iterator();
        while (it.hasNext()) {
            ((CompletableFuture) it.next()).cancel(true);
        }
        q.clear();
        CompletableFuture<Void> completableFuture = m;
        if (completableFuture != null) {
            completableFuture.cancel(true);
            u.shutdownNow();
        }
        u = Executors.newCachedThreadPool();
        m = new CompletableFuture<>();
        String str3 = F;
        String str4 = E;
        final String[] strArr = !g(O0) ? new Random().nextInt(2) == 0 ? new String[]{b(0, "/d_api.php"), b(1, "/d_api.php"), b(2, "/d_api.php"), b(3, "/d_api.php")} : new String[]{b(0, "/d_api.php"), b(2, "/d_api.php"), b(1, "/d_api.php"), b(3, "/d_api.php")} : !g(N0) ? new String[]{b(0, "/d_api.php"), b(1, "/d_api.php"), b(2, "/d_api.php")} : new String[]{b(0, "/d_api.php"), b(1, "/d_api.php")};
        String uniqueID = getUniqueID();
        String string = Long.toString(l.a());
        String strE = e("device_type=2&device_uid=" + uniqueID + "&device_time=" + string + "&key=" + str4);
        StringBuilder sb = new StringBuilder("device_uid=");
        sb.append(uniqueID);
        sb.append("&device_time=");
        sb.append(string);
        sb.append("&key=");
        Charset charset = h.f15a;
        StringBuilder sb2 = new StringBuilder();
        for (String str5 : h.f) {
            sb2.append(str5);
        }
        sb.append(sb2.toString());
        String strE2 = e(sb.toString());
        final HashMap map = new HashMap();
        map.put("device_type", "2");
        map.put("device_uid", uniqueID);
        map.put("device_time", string);
        map.put("token", strE);
        map.put("first_token", strE2);
        map.put("username", str3);
        map.put("request_type", Long.toString(i2));
        map.put("request_area", Long.toString(i3));
        map.put("request_reason", str2);
        map.put("ad_code", o0);
        map.put("sdk_code", s0);
        int[] iArr2 = Y0;
        map.put("ping_ms1", Integer.toString(iArr2[0]));
        map.put("ping_ms2", Integer.toString(iArr2[1]));
        map.put("ping_ms3", Integer.toString(iArr2[2]));
        map.put("ping_ms4", Integer.toString(iArr2[3]));
        map.put("ping_ms5", Integer.toString(iArr2[4]));
        map.put("ping_ms6", Integer.toString(iArr2[5]));
        int[] iArr3 = X0;
        map.put("lose_pack1", Integer.toString(iArr3[0]));
        map.put("lose_pack2", Integer.toString(iArr3[1]));
        map.put("lose_pack3", Integer.toString(iArr3[2]));
        map.put("lose_pack4", Integer.toString(iArr3[3]));
        map.put("lose_pack5", Integer.toString(iArr3[4]));
        map.put("lose_pack6", Integer.toString(iArr3[5]));
        map.put("maxband_flg", str2.contains("高带宽") ? "1" : "0");
        map.put("type", "tcpdispatch");
        map.put("version", "10726");
        final AtomicInteger atomicInteger = new AtomicInteger(0);
        final int i6 = -1;
        for (final String str6 : strArr) {
            i6++;
            final CompletableFuture completableFutureSupplyAsync = CompletableFuture.supplyAsync(new Supplier() { // from class: com.beiguard.gameshield.GameshieldManager$$ExternalSyntheticLambda22
                @Override // java9.util.function.Supplier
                public final Object get() {
                    return GameshieldManager.a(str6, map, i6, strArr);
                }
            }, u);
            q.add(completableFutureSupplyAsync);
            completableFutureSupplyAsync.whenComplete(new BiConsumer() { // from class: com.beiguard.gameshield.GameshieldManager$$ExternalSyntheticLambda23
                @Override // java9.util.function.BiConsumer
                public final void accept(Object obj, Object obj2) throws JSONException, NoSuchPaddingException, NoSuchAlgorithmException, InvalidKeyException, IOException, NumberFormatException {
                    GameshieldManager.a(completableFutureSupplyAsync, i3, atomicInteger, strArr, (String) obj, (Throwable) obj2);
                }

                @Override // java9.util.function.BiConsumer
                public /* synthetic */ BiConsumer andThen(BiConsumer biConsumer) {
                    return BiConsumer.CC.$default$andThen(this, biConsumer);
                }
            });
        }
        m.thenRun(new Runnable() { // from class: com.beiguard.gameshield.GameshieldManager$$ExternalSyntheticLambda24
            @Override // java.lang.Runnable
            public final void run() {
                GameshieldManager.j();
            }
        }).exceptionally(new Function() { // from class: com.beiguard.gameshield.GameshieldManager$$ExternalSyntheticLambda25
            @Override // java9.util.function.Function
            public /* synthetic */ Function andThen(Function function) {
                return Function.CC.$default$andThen(this, function);
            }

            @Override // java9.util.function.Function
            public final Object apply(Object obj) {
                return GameshieldManager.a((Throwable) obj);
            }

            @Override // java9.util.function.Function
            public /* synthetic */ Function compose(Function function) {
                return Function.CC.$default$compose(this, function);
            }
        });
    }

    public static void a() {
        ArrayList arrayList;
        ArrayList arrayList2;
        if (d0.f26a == 1088) {
            return;
        }
        ArrayList<HashMap<b, b>> arrayList3 = g;
        synchronized (arrayList3) {
            arrayList = new ArrayList(arrayList3);
        }
        boolean z2 = false;
        for (int i2 = 0; i2 < arrayList.size(); i2++) {
            int i3 = d0.K;
            if ((i3 != 1 || i2 != 2) && (i3 != 2 || (i2 != 2 && i2 != 3))) {
                Iterator it = ((Map) arrayList.get(i2)).entrySet().iterator();
                while (it.hasNext()) {
                    b bVar = (b) ((Map.Entry) it.next()).getKey();
                    k kVarC = c(bVar.f29b, bVar.f28a);
                    if (kVarC != null) {
                        int i4 = kVarC.r.get();
                        if (kVarC.x && i4 > 0) {
                            long j2 = kVarC.s.get();
                            try {
                                int iA = kVarC.a();
                                if (i4 == kVarC.t.get() && iA == kVarC.v.get() && j2 < kVarC.u.get()) {
                                    kVarC.d();
                                    z2 = true;
                                }
                                kVarC.t.set(i4);
                                kVarC.v.set(iA);
                                kVarC.u.set(System.currentTimeMillis());
                            } catch (Exception unused) {
                            }
                        }
                    }
                    z2 = true;
                }
                if (z2) {
                    break;
                }
            }
        }
        if (!z2) {
            ArrayList<HashMap<b, b>> arrayList4 = h;
            synchronized (arrayList4) {
                arrayList2 = new ArrayList(arrayList4);
            }
            for (int i5 = 0; i5 < arrayList2.size(); i5++) {
                Iterator it2 = ((Map) arrayList2.get(i5)).entrySet().iterator();
                while (true) {
                    if (!it2.hasNext()) {
                        break;
                    }
                    b bVar2 = (b) ((Map.Entry) it2.next()).getKey();
                    if (d(bVar2.f29b, bVar2.f28a) == null) {
                        z2 = true;
                        break;
                    }
                }
                if (z2) {
                    break;
                }
            }
        }
        if (z2) {
            v();
        }
        CompletableFuture<Void> completableFuture = p.get();
        if (completableFuture == null || completableFuture.isDone()) {
            if (d() > 0 || Q0.get()) {
                Q0.set(false);
            } else if (I == -1 || System.currentTimeMillis() - I <= 180000) {
                return;
            }
            A();
        }
    }

    public static String b(String str, String str2) {
        I0 = 600;
        try {
            String[] strArrA = a(str, '.');
            if (strArrA.length == 4) {
                int[] iArr = new int[4];
                for (int i2 = 0; i2 < 4; i2++) {
                    iArr[i2] = k(strArrA[i2].trim());
                }
                I0 = 601;
                int iK = iArr[3] + k(str2.trim());
                iArr[3] = iK;
                if (iK < 0) {
                    iArr[3] = 0;
                } else if (iK > 255) {
                    iArr[3] = 255;
                }
                I0 = 602;
                StringBuilder sb = new StringBuilder();
                sb.append(iArr[0]);
                for (int i3 = 1; i3 < 4; i3++) {
                    sb.append('.');
                    sb.append(iArr[i3]);
                }
                return sb.toString();
            }
            throw new IllegalArgumentException("Invalid IP address");
        } catch (Exception unused) {
            return str;
        }
    }

    /* JADX WARN: Removed duplicated region for block: B:21:0x0045  */
    /* JADX WARN: Removed duplicated region for block: B:47:0x0088  */
    /* JADX WARN: Removed duplicated region for block: B:69:0x0123 A[PHI: r12
      0x0123: PHI (r12v55 java.lang.String) = (r12v51 java.lang.String), (r12v59 java.lang.String) binds: [B:68:0x0121, B:57:0x00d7] A[DONT_GENERATE, DONT_INLINE]] */
    /*
        Code decompiled incorrectly, please refer to instructions dump.
        To view partially-correct add '--show-bad-code' argument
    */
    public static boolean a(java.lang.String r11, java.lang.String r12, boolean r13) throws javax.crypto.NoSuchPaddingException, java.security.NoSuchAlgorithmException, java.io.IOException, java.security.InvalidKeyException, java.lang.NumberFormatException {
        /*
            Method dump skipped, instructions count: 947
            To view this dump add '--comments-level debug' option
        */
        throw new UnsupportedOperationException("Method not decompiled: com.beiguard.gameshield.GameshieldManager.a(java.lang.String, java.lang.String, boolean):boolean");
    }

    public static String a(String str, Map map, int i2, String[] strArr) throws InterruptedException, IOException {
        String next;
        int length = strArr.length - 1;
        String str2 = "";
        try {
            if (i2 == length) {
                Thread.sleep(6500L);
            } else if (i2 > 0) {
                Thread.sleep(i2 * 2000);
            }
            CompletableFuture<Void> completableFuture = m;
            if (completableFuture != null && completableFuture.isDone()) {
                return null;
            }
            if (System.currentTimeMillis() < B0) {
                return "";
            }
            B0 = System.currentTimeMillis() + 900;
            StringBuilder sb = new StringBuilder();
            for (Map.Entry entry : map.entrySet()) {
                if (sb.length() != 0) {
                    sb.append(Typography.amp);
                }
                sb.append(URLEncoder.encode((String) entry.getKey(), "UTF-8"));
                sb.append('=');
                sb.append(URLEncoder.encode((String) entry.getValue(), "UTF-8"));
            }
            byte[] bytes = sb.toString().getBytes(h.f15a);
            HttpURLConnection httpURLConnection = (HttpURLConnection) new URL(str).openConnection();
            httpURLConnection.setConnectTimeout(10000);
            httpURLConnection.setReadTimeout(10000);
            httpURLConnection.setRequestMethod("POST");
            httpURLConnection.setDoOutput(true);
            httpURLConnection.getOutputStream().write(bytes);
            if (httpURLConnection.getResponseCode() == 200 && (next = new Scanner(httpURLConnection.getInputStream()).useDelimiter("\\A").next()) != null && next.contains("result") && a(next, E)) {
                str2 = next;
            }
            httpURLConnection.disconnect();
            return str2;
        } catch (Exception e2) {
            if (e2 instanceof InterruptedException) {
                throw new RuntimeException(e2);
            }
            boolean z2 = e2 instanceof SocketTimeoutException;
            if (i2 != length) {
                return str2;
            }
            throw new RuntimeException(e2);
        }
    }

    /* JADX WARN: Removed duplicated region for block: B:45:0x00ad  */
    /*
        Code decompiled incorrectly, please refer to instructions dump.
        To view partially-correct add '--show-bad-code' argument
    */
    public static void a(java9.util.concurrent.CompletableFuture r3, int r4, java.util.concurrent.atomic.AtomicInteger r5, java.lang.String[] r6, java.lang.String r7, java.lang.Throwable r8) throws org.json.JSONException, javax.crypto.NoSuchPaddingException, java.security.NoSuchAlgorithmException, java.security.InvalidKeyException, java.io.IOException, java.lang.NumberFormatException {
        /*
            Method dump skipped, instructions count: 313
            To view this dump add '--comments-level debug' option
        */
        throw new UnsupportedOperationException("Method not decompiled: com.beiguard.gameshield.GameshieldManager.a(java9.util.concurrent.CompletableFuture, int, java.util.concurrent.atomic.AtomicInteger, java.lang.String[], java.lang.String, java.lang.Throwable):void");
    }

    public static Void a(Throwable th) {
        Throwable cause = th.getCause();
        if (cause instanceof InterruptedException) {
            Thread.currentThread().interrupt();
        } else {
            if (!(cause instanceof SocketTimeoutException)) {
                int i2 = g0 + 1;
                g0 = i2;
                if (i2 >= 10) {
                    f0 = 5;
                } else if (i2 >= 5) {
                    f0 = 3;
                } else {
                    f0 = 1;
                }
            } else if (e0) {
                j0++;
            } else {
                i0 = PointerIconCompat.TYPE_ALIAS;
            }
            if (!e0) {
                e0 = true;
            }
            for (String str : S) {
                if (!g(str) && (h(str) || i(str))) {
                    h0 = i0 == 0;
                    A();
                }
            }
        }
        th.getMessage();
        int i3 = i.f17a;
        return null;
    }

    public static String a(String str, int i2, String[] strArr) throws IOException {
        int length = strArr.length;
        String strGroup = "";
        try {
            HttpURLConnection httpURLConnection = (HttpURLConnection) new URL(str).openConnection();
            httpURLConnection.setRequestMethod("GET");
            if (httpURLConnection.getResponseCode() == 200) {
                BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(httpURLConnection.getInputStream()));
                StringBuilder sb = new StringBuilder();
                while (true) {
                    String line = bufferedReader.readLine();
                    if (line == null) {
                        break;
                    }
                    sb.append(line);
                }
                bufferedReader.close();
                String string = sb.toString();
                if (!g(string)) {
                    Matcher matcher = Pattern.compile("\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b|\\b(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}\\b").matcher(string);
                    if (matcher.find()) {
                        strGroup = matcher.group();
                    }
                }
            }
            httpURLConnection.disconnect();
        } catch (Exception e2) {
            boolean z2 = e2 instanceof SocketTimeoutException;
            if (i2 == length - 1) {
                throw new RuntimeException(e2);
            }
        }
        return strGroup;
    }

    /* JADX WARN: Code restructure failed: missing block: B:58:0x0115, code lost:
    
        if (com.beiguard.gameshield.GameshieldManager.i.select() <= 0) goto L101;
     */
    /* JADX WARN: Code restructure failed: missing block: B:59:0x0117, code lost:
    
        r1 = com.beiguard.gameshield.GameshieldManager.i.selectedKeys().iterator();
     */
    /* JADX WARN: Code restructure failed: missing block: B:61:0x0125, code lost:
    
        if (r1.hasNext() == false) goto L102;
     */
    /* JADX WARN: Code restructure failed: missing block: B:62:0x0127, code lost:
    
        r2 = r1.next();
        r1.remove();
     */
    /* JADX WARN: Code restructure failed: missing block: B:63:0x0134, code lost:
    
        if (r2.isValid() != false) goto L93;
     */
    /* JADX WARN: Code restructure failed: missing block: B:66:0x013b, code lost:
    
        if (r2.isAcceptable() == false) goto L120;
     */
    /* JADX WARN: Code restructure failed: missing block: B:67:0x013d, code lost:
    
        r3 = (a.k) r2.attachment();
     */
    /* JADX WARN: Code restructure failed: missing block: B:68:0x0143, code lost:
    
        if (r3 == null) goto L135;
     */
    /* JADX WARN: Code restructure failed: missing block: B:71:0x014a, code lost:
    
        if (r2.isConnectable() != false) goto L123;
     */
    /* JADX WARN: Code restructure failed: missing block: B:73:0x0150, code lost:
    
        if (r2.isReadable() != false) goto L124;
     */
    /* JADX WARN: Code restructure failed: missing block: B:75:0x0156, code lost:
    
        if (r2.isWritable() == false) goto L131;
     */
    /* JADX WARN: Code restructure failed: missing block: B:76:0x0158, code lost:
    
        r3 = (a.b) r2.attachment();
     */
    /* JADX WARN: Code restructure failed: missing block: B:77:0x015e, code lost:
    
        if (r3 == null) goto L132;
     */
    /* JADX WARN: Code restructure failed: missing block: B:78:0x0160, code lost:
    
        r3 = r3.d;
     */
    /* JADX WARN: Code restructure failed: missing block: B:79:0x0162, code lost:
    
        if (r3 == null) goto L133;
     */
    /* JADX WARN: Code restructure failed: missing block: B:80:0x0164, code lost:
    
        r3.b(r2);
     */
    /* JADX WARN: Code restructure failed: missing block: B:82:0x0168, code lost:
    
        r2 = move-exception;
     */
    /* JADX WARN: Code restructure failed: missing block: B:83:0x0169, code lost:
    
        r2.getMessage();
        r2 = a.i.f17a;
     */
    /*
        Code decompiled incorrectly, please refer to instructions dump.
        To view partially-correct add '--show-bad-code' argument
    */
    public static void a(java.util.List r7) {
        /*
            Method dump skipped, instructions count: 376
            To view this dump add '--comments-level debug' option
        */
        throw new UnsupportedOperationException("Method not decompiled: com.beiguard.gameshield.GameshieldManager.a(java.util.List):void");
    }

    public static Void a(String str, long j2, String str2, String str3) throws JSONException, IOException {
        Socket socket;
        String str4 = S[0];
        SocketChannel socketChannel = c0[4];
        int port = (socketChannel == null || !socketChannel.isConnected() || (socket = socketChannel.socket()) == null) ? 0 : socket.getPort();
        if (port == 0) {
            port = a(Y[0], new Random().nextInt(2) + 2, str4);
        }
        int i2 = port;
        if (!g(str4) && i2 != 0) {
            if ("connect".equals(str)) {
                Arrays.fill(R0, -1L);
                S0 = -1;
            } else {
                Arrays.fill(R0, 0L);
                S0 = -1;
            }
            if (("connect".equals(str) || "sysn".equals(str)) && j2 > 0) {
                N.set(j2);
            }
            String string = Long.toString(j2);
            String uniqueID = getUniqueID();
            String string2 = Long.toString(l.a());
            String string3 = Long.toString(d());
            String str5 = String.format("{\"type\":\"sysn4\",\"opt_type\":\"%s\",\"instance_id\":\"%s\",\"device_uid\":\"%s\",\"device_time\":\"%s\",\"connect_num\":\"%s\",\"connect_speed\":\"%s\",\"token\":\"%s\",\"version\":\"%s\"}", str, str3, uniqueID, string2, string3, string, e("opt_type=" + str + "&device_uid=" + uniqueID + "&device_time=" + string2 + "&connect_num=" + string3 + "&connect_speed=" + string + "&key=" + str2), "10726");
            AtomicReference atomicReference = new AtomicReference(null);
            a(4, str4, i2, str5, atomicReference, t, true);
            a aVar = (a) atomicReference.get();
            if (aVar == null) {
                b(4);
                if (i2 < 10000) {
                    a(4, str4, a(Y[0], new Random().nextInt(2), str4), str5, atomicReference, t, true);
                    aVar = (a) atomicReference.get();
                    if (aVar == null) {
                        b(4);
                    }
                }
                return null;
            }
            if (z0) {
                b(4);
            }
            a(aVar);
        }
        return null;
    }

    /* JADX WARN: Code restructure failed: missing block: B:60:0x017a, code lost:
    
        b(r20);
     */
    /* JADX WARN: Removed duplicated region for block: B:126:0x02e6  */
    /* JADX WARN: Removed duplicated region for block: B:192:? A[RETURN, SYNTHETIC] */
    /* JADX WARN: Removed duplicated region for block: B:21:0x0053 A[Catch: all -> 0x02fa, InterruptedException -> 0x02fc, IOException -> 0x033d, TryCatch #11 {IOException -> 0x033d, InterruptedException -> 0x02fc, blocks: (B:5:0x0011, B:7:0x0020, B:17:0x0046, B:19:0x004d, B:29:0x00d7, B:31:0x00dd, B:33:0x00e9, B:36:0x00f1, B:38:0x00f7, B:40:0x00fd, B:42:0x0103, B:43:0x0107, B:46:0x011a, B:47:0x0135, B:49:0x013b, B:50:0x013f, B:61:0x017d, B:68:0x01b0, B:69:0x01b7, B:114:0x02b8, B:85:0x0202, B:95:0x0243, B:92:0x0234, B:93:0x023b, B:94:0x023c, B:76:0x01c7, B:83:0x01fa, B:84:0x0201, B:96:0x0244, B:103:0x0276, B:104:0x027d, B:105:0x027e, B:112:0x02b0, B:113:0x02b7, B:21:0x0053, B:23:0x0074, B:24:0x00c6, B:26:0x00cc, B:27:0x00d0, B:28:0x00d3), top: B:172:0x0011, outer: #11 }] */
    /* JADX WARN: Removed duplicated region for block: B:23:0x0074 A[Catch: all -> 0x02fa, InterruptedException -> 0x02fc, IOException -> 0x033d, TryCatch #11 {IOException -> 0x033d, InterruptedException -> 0x02fc, blocks: (B:5:0x0011, B:7:0x0020, B:17:0x0046, B:19:0x004d, B:29:0x00d7, B:31:0x00dd, B:33:0x00e9, B:36:0x00f1, B:38:0x00f7, B:40:0x00fd, B:42:0x0103, B:43:0x0107, B:46:0x011a, B:47:0x0135, B:49:0x013b, B:50:0x013f, B:61:0x017d, B:68:0x01b0, B:69:0x01b7, B:114:0x02b8, B:85:0x0202, B:95:0x0243, B:92:0x0234, B:93:0x023b, B:94:0x023c, B:76:0x01c7, B:83:0x01fa, B:84:0x0201, B:96:0x0244, B:103:0x0276, B:104:0x027d, B:105:0x027e, B:112:0x02b0, B:113:0x02b7, B:21:0x0053, B:23:0x0074, B:24:0x00c6, B:26:0x00cc, B:27:0x00d0, B:28:0x00d3), top: B:172:0x0011, outer: #11 }] */
    /* JADX WARN: Removed duplicated region for block: B:31:0x00dd A[Catch: all -> 0x02fa, InterruptedException -> 0x02fc, IOException -> 0x033d, TryCatch #11 {IOException -> 0x033d, InterruptedException -> 0x02fc, blocks: (B:5:0x0011, B:7:0x0020, B:17:0x0046, B:19:0x004d, B:29:0x00d7, B:31:0x00dd, B:33:0x00e9, B:36:0x00f1, B:38:0x00f7, B:40:0x00fd, B:42:0x0103, B:43:0x0107, B:46:0x011a, B:47:0x0135, B:49:0x013b, B:50:0x013f, B:61:0x017d, B:68:0x01b0, B:69:0x01b7, B:114:0x02b8, B:85:0x0202, B:95:0x0243, B:92:0x0234, B:93:0x023b, B:94:0x023c, B:76:0x01c7, B:83:0x01fa, B:84:0x0201, B:96:0x0244, B:103:0x0276, B:104:0x027d, B:105:0x027e, B:112:0x02b0, B:113:0x02b7, B:21:0x0053, B:23:0x0074, B:24:0x00c6, B:26:0x00cc, B:27:0x00d0, B:28:0x00d3), top: B:172:0x0011, outer: #11 }] */
    /*
        Code decompiled incorrectly, please refer to instructions dump.
        To view partially-correct add '--show-bad-code' argument
    */
    public static void a(int r15, long r16, java.util.concurrent.atomic.AtomicReference r18, java.util.concurrent.atomic.AtomicReference r19, int r20, java.lang.String r21, int r22, boolean r23, java.lang.String r24, java.util.List r25) {
        /*
            Method dump skipped, instructions count: 862
            To view this dump add '--comments-level debug' option
        */
        throw new UnsupportedOperationException("Method not decompiled: com.beiguard.gameshield.GameshieldManager.a(int, long, java.util.concurrent.atomic.AtomicReference, java.util.concurrent.atomic.AtomicReference, int, java.lang.String, int, boolean, java.lang.String, java.util.List):void");
    }
}

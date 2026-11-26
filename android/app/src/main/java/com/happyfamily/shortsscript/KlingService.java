package com.happyfamily.shortsscript;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.GestureDescription;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Path;
import android.graphics.PixelFormat;
import android.graphics.Rect;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.view.accessibility.AccessibilityWindowInfo;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/**
 * 클링 자동 입력 도우미.
 * 사용자가 앱에서 "클링으로 보내기"를 누를 때만 동작한다. 평소에는 화면 이벤트를 무시한다.
 * 동작 순서(flow)는 JSON으로 받는다: start → (샷마다) shot → between → end.
 * 화면 기록(inspect) 모드는 지금 화면의 버튼 정보를 파일로 남겨 flow 를 만드는 데 쓴다.
 */
public class KlingService extends AccessibilityService {
    static volatile KlingService self;
    static volatile String lastStatus = "";
    /* 이번 작업에서 끝까지 입력(생성 요청)한 샷 번호들 — 원클릭 이어 하기에 쓴다 */
    static volatile String lastDone = "[]", lastJobId = "";
    static final String DUMP_FILE = "kling_dumps.json";

    private Handler ui;
    private WindowManager wm;
    private LinearLayout panel;
    private TextView statusTv;
    private Button actBtn, stopBtn;
    private Runnable actRun, stopRun;
    private volatile boolean running = false, cancel = false;
    private JSONArray dumps = new JSONArray();
    private Uri dumpUri; private String dumpName;
    static volatile Uri lastDumpUri; static volatile String lastDumpName = "";
    private int repK = 0, repN = 0;
    private JSONObject job, flow;

    static class StepFail extends Exception { StepFail(String m) { super(m); } }

    @Override protected void onServiceConnected() { self = this; ui = new Handler(Looper.getMainLooper()); }
    @Override public void onAccessibilityEvent(AccessibilityEvent e) { }
    @Override public void onInterrupt() { cancel = true; }
    @Override public boolean onUnbind(Intent i) { cancel = true; hidePanel(); self = null; return super.onUnbind(i); }

    static boolean isOn() { return self != null; }
    boolean isRunning() { return running; }

    /* ---------- 클링 앱 찾기 ---------- */
    static String findKling(Context c, String preferred) { return findApp(c, preferred, new String[]{"kling", "클링", "可灵"}); }
    static String findGrok(Context c, String preferred) { return findApp(c, preferred, new String[]{"grok", "그록"}); }
    static String findPickle(Context c, String preferred) { return findApp(c, preferred, new String[]{"피클", "pickle"}); }
    static String findApp(Context c, String preferred, String[] keys) {
        PackageManager pm = c.getPackageManager();
        if (preferred != null && !preferred.isEmpty() && pm.getLaunchIntentForPackage(preferred) != null) return preferred;
        Intent i = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER);
        for (ResolveInfo r : pm.queryIntentActivities(i, 0)) {
            String label = String.valueOf(r.loadLabel(pm)).toLowerCase(), pk = r.activityInfo.packageName;
            if (pk.equals(c.getPackageName())) continue;
            for (String k : keys) if (label.contains(k) || pk.toLowerCase().contains(k)) return pk;
        }
        return "";
    }

    /* ---------- 떠 있는 안내 막대 ---------- */
    private int dp(int v) { return Math.round(v * getResources().getDisplayMetrics().density); }
    private Button mkBtn() {
        Button b = new Button(this);
        b.setAllCaps(false); b.setTextSize(13); b.setTextColor(0xFFFFFFFF); b.setMinHeight(0); b.setMinimumHeight(0); b.setMinWidth(0); b.setMinimumWidth(0);
        b.setPadding(dp(12), dp(6), dp(12), dp(6));
        GradientDrawable g = new GradientDrawable(); g.setColor(0xFFF0284A); g.setCornerRadius(dp(14)); b.setBackground(g);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-2, -2); lp.leftMargin = dp(6); b.setLayoutParams(lp);
        return b;
    }
    private void showPanel(String act, Runnable onAct, String stop, Runnable onStop) {
        actRun = onAct; stopRun = onStop;
        ui.post(() -> {
            if (panel == null) {
                wm = (WindowManager) getSystemService(WINDOW_SERVICE);
                panel = new LinearLayout(this);
                panel.setOrientation(LinearLayout.HORIZONTAL);
                panel.setGravity(Gravity.CENTER_VERTICAL);
                panel.setPadding(dp(14), dp(8), dp(8), dp(8));
                GradientDrawable bg = new GradientDrawable(); bg.setColor(0xEE141A2E); bg.setCornerRadius(dp(18)); panel.setBackground(bg);
                statusTv = new TextView(this); statusTv.setTextColor(0xFFFFFFFF); statusTv.setTextSize(13); statusTv.setMaxLines(3);
                panel.addView(statusTv, new LinearLayout.LayoutParams(0, -2, 1));
                actBtn = mkBtn(); stopBtn = mkBtn();
                GradientDrawable g2 = new GradientDrawable(); g2.setColor(0xFF3E4760); g2.setCornerRadius(dp(14)); stopBtn.setBackground(g2);
                actBtn.setOnClickListener(v -> { if (actRun != null) new Thread(actRun).start(); });
                stopBtn.setOnClickListener(v -> { if (stopRun != null) stopRun.run(); });
                panel.addView(actBtn); panel.addView(stopBtn);
                WindowManager.LayoutParams lp = new WindowManager.LayoutParams(-1, -2, WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
                        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN, PixelFormat.TRANSLUCENT);
                lp.gravity = Gravity.TOP; lp.y = dp(40); lp.horizontalMargin = 0.03f;
                wm.addView(panel, lp);
            }
            actBtn.setVisibility(act == null ? View.GONE : View.VISIBLE); if (act != null) actBtn.setText(act);
            stopBtn.setText(stop);
            panel.setVisibility(View.VISIBLE);
        });
    }
    private void hidePanel() {
        if (ui == null) return;
        ui.post(() -> { try { if (panel != null && wm != null) wm.removeView(panel); } catch (Exception ignored) { } panel = null; });
    }
    private void panelVisible(boolean v) {
        CountDownLatch l = new CountDownLatch(1);
        ui.post(() -> { if (panel != null) panel.setVisibility(v ? View.VISIBLE : View.INVISIBLE); l.countDown(); });
        try { l.await(500, TimeUnit.MILLISECONDS); } catch (InterruptedException ignored) { }
    }
    private void status(String s) { lastStatus = s; ui.post(() -> { if (statusTv != null) statusTv.setText(s); }); }

    /* ---------- 자동 입력 ---------- */
    boolean startJob(JSONObject j, JSONObject f) {
        if (running) return false;
        job = j; flow = f; cancel = false; running = true;
        lastDone = "[]"; lastJobId = j.optString("id", "");
        showPanel(null, null, "중지", () -> { cancel = true; status("중지하는 중…"); });
        new Thread(this::runJob).start();
        return true;
    }
    private void runJob() {
        JSONArray shots = job.optJSONArray("shots");
        int n = shots == null ? 0 : shots.length();
        try {
            status("클링 앱을 여는 중…");
            runSteps(flow.optJSONArray("start"), null, -1, n);
            JSONArray done = new JSONArray();
            for (int i = 0; i < n && !job.optBoolean("collectOnly"); i++) {
                if (cancel) throw new StepFail("사용자가 중지했습니다");
                JSONObject sh = shots.getJSONObject(i);
                if (sh.optBoolean("skip")) continue;   /* 이미 생성 요청한 샷: 내려받기만 */
                JSONArray imgs = sh.optJSONArray("images");
                if (imgs != null && imgs.length() > 0) { status(prefix(i, n) + "사진 준비 중"); saveImages(imgs); }
                runSteps(flow.optJSONArray("shot"), sh, i, n);
                done.put(i); lastDone = done.toString();
                if (i < n - 1) runSteps(flow.optJSONArray("between"), sh, i, n);
            }
            if (job.optBoolean("collect") && flow.has("collect")) {
                status("생성이 끝나길 기다렸다가 영상을 내려받습니다");
                runSteps(flow.optJSONArray("collectStart"), null, -1, n);
                for (int i = 0; i < n; i++) {
                    if (cancel) throw new StepFail("사용자가 중지했습니다");
                    runSteps(flow.optJSONArray("collect"), shots.getJSONObject(i), i, n);
                }
                runSteps(flow.optJSONArray("collectEnd"), null, n - 1, n);
            }
            runSteps(flow.optJSONArray("end"), shots != null && n > 0 ? shots.getJSONObject(n - 1) : null, n - 1, n);
            job.put("returned", flow.toString().contains("\"returnApp\""));
            status(job.optString("doneMsg", "끝났습니다. " + n + "개 입력. " + (job.optBoolean("autoGenerate") ? "클링에서 생성 결과를 확인하세요." : "클링에서 내용을 확인하고 생성을 누르세요.")));
            if (!job.optBoolean("returned")) showPanel(null, null, "닫기", this::hidePanel);
        } catch (Exception e) {
            String m = e instanceof StepFail ? e.getMessage() : "오류: " + e;
            status("멈춤 · " + m);
            newDumpSession();
            showPanel("이 화면 기록", this::dumpScreen, "닫기", this::finishInspect);
        } finally { running = false; }
    }
    private String prefix(int i, int n) { return n > 1 ? "샷 " + (i + 1) + "/" + n + " · " : ""; }
    private void runSteps(JSONArray steps, JSONObject sh, int i, int n) throws Exception {
        if (steps == null) return;
        int pause = flow.optInt("after", 800);
        for (int k = 0; k < steps.length(); k++) {
            if (cancel) throw new StepFail("사용자가 중지했습니다");
            JSONObject st = steps.getJSONObject(k);
            String cond = st.optString("if", "");
            if (!cond.isEmpty() && !truthy(cond, sh)) continue;
            String say = st.optString("say", st.optString("do"));
            String dd = st.optString("do");
            if (!"launch".equals(dd) && !"wait".equals(dd) && !"returnApp".equals(dd)) waitForTarget();
            status(prefix(Math.max(i, 0), n) + say);
            boolean ok;
            try { ok = exec(st, sh, i, n); } catch (Exception e) { ok = false; }
            if (!ok && !st.optBoolean("optional")) throw new StepFail(st.has("fail") ? st.optString("fail") : prefix(Math.max(i, 0), n) + "\"" + say + "\" 단계에서 대상을 찾지 못했습니다");
            Thread.sleep(st.optInt("after", pause));
        }
    }
    private boolean truthy(String cond, JSONObject sh) {
        boolean neg = cond.startsWith("!"); String c = neg ? cond.substring(1) : cond; boolean v;
        if (c.equals("imageCount")) v = sh != null && sh.optJSONArray("images") != null && sh.optJSONArray("images").length() > 0;
        else if (sh != null && sh.has(c)) v = sh.optBoolean(c, !sh.optString(c, "").isEmpty());
        else v = job.optBoolean(c, false);
        return neg != v;
    }
    private String expand(String s, JSONObject sh, int i, int n) {
        int imgs = sh != null && sh.optJSONArray("images") != null ? sh.optJSONArray("images").length() : 0;
        return s.replace("${prompt}", sh != null ? sh.optString("prompt") : "").replace("${neg}", job.optString("neg"))
                .replace("${shot}", String.valueOf(i + 1)).replace("${total}", String.valueOf(n)).replace("${imageCount}", String.valueOf(imgs))
                .replace("${duration}", sh != null ? sh.optString("sec", "5") : "5")
                .replace("${i0}", String.valueOf(Math.max(i, 0))).replace("${ri}", String.valueOf(Math.max(0, n - 1 - i)))
                .replace("${k}", String.valueOf(repK)).replace("${rk}", String.valueOf(Math.max(0, repN - 1 - repK)));
    }
    private boolean exec(JSONObject st, JSONObject sh, int i, int n) throws Exception {
        String d = st.optString("do");
        JSONObject f = st.optJSONObject("find");
        if (f != null && f.opt("index") instanceof String) { f = new JSONObject(f.toString()); f.put("index", parseInt(expand(f.getString("index"), sh, i, n), 0)); }
        int to = st.optInt("timeout", 6000);
        DisplayMetrics dm = getResources().getDisplayMetrics();
        switch (d) {
            case "launch": {
                String pk = job.optString("package");
                Intent li = pk.isEmpty() ? null : getPackageManager().getLaunchIntentForPackage(pk);
                if (li == null) return false;
                li.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(li);
                return true;
            }
            case "wait": Thread.sleep(st.optInt("ms", 1000)); return true;
            case "waitFor": return find(f, to) != null;
            case "waitGone": { long end = System.currentTimeMillis() + to; while (System.currentTimeMillis() < end) { if (findAll(f).isEmpty()) return true; Thread.sleep(300); } return false; }
            case "click": {
                AccessibilityNodeInfo nd = find(f, to);
                if (nd != null) return clickNode(nd);
                JSONObject t = st.optJSONObject("orTap");
                return t != null && tap((float) t.optDouble("x", .5) * dm.widthPixels, (float) t.optDouble("y", .5) * dm.heightPixels);
            }
            case "repeat": {
                int cnt = parseInt(expand(st.optString("count", "1"), sh, i, n), 1);
                int sk = repK, sn = repN;
                try { repN = cnt; for (repK = 0; repK < cnt; repK++) runSteps(st.optJSONArray("steps"), sh, i, n); }
                finally { repK = sk; repN = sn; }
                return true;
            }
            case "when": {   /* 대상이 보이면 steps 실행 (unless 의 반대) */
                if (find(f, st.optInt("timeout", 1500)) == null) return true;
                runSteps(st.optJSONArray("steps"), sh, i, n);
                return true;
            }
            case "unless": {
                if (find(f, st.optInt("timeout", 1500)) != null) return true;
                runSteps(st.optJSONArray("steps"), sh, i, n);
                return true;
            }
            case "longClick": { AccessibilityNodeInfo nd = find(f, to); return nd != null && (nd.performAction(AccessibilityNodeInfo.ACTION_LONG_CLICK) || clickNode(nd)); }
            case "clickEach": {
                int cnt = parseInt(expand(st.optString("count", "1"), sh, i, n), 1);
                long end = System.currentTimeMillis() + to; List<AccessibilityNodeInfo> all = findAll(f);
                while (all.size() < cnt && System.currentTimeMillis() < end) { Thread.sleep(300); all = findAll(f); }
                if (all.size() < cnt) return false;
                for (int k = 0; k < cnt; k++) { if (!clickNode(all.get(k))) return false; Thread.sleep(st.optInt("gap", 500)); }
                return true;
            }
            case "setText": { AccessibilityNodeInfo nd = find(f, to); return nd != null && setText(nd, expand(st.optString("value"), sh, i, n)); }
            case "tapIn": {   /* 찾은 칸 안의 상대 위치(rx, ry: 0~1)를 누른다. 화면 크기와 상관없음 */
                AccessibilityNodeInfo nd = find(f, to); if (nd == null) return false;
                Rect r = new Rect(); nd.getBoundsInScreen(r);
                return tap(r.left + (float) st.optDouble("rx", .5) * r.width(), r.top + (float) st.optDouble("ry", .5) * r.height());
            }
            case "tap": return tap((float) st.optDouble("x", .5) * dm.widthPixels, (float) st.optDouble("y", .5) * dm.heightPixels);
            case "swipe": return swipe((float) st.optDouble("x1", .5) * dm.widthPixels, (float) st.optDouble("y1", .7) * dm.heightPixels,
                    (float) st.optDouble("x2", .5) * dm.widthPixels, (float) st.optDouble("y2", .3) * dm.heightPixels, st.optInt("ms", 350));
            case "scrollTo": {
                for (int k = 0; k < st.optInt("max", 6); k++) {
                    if (find(f, 600) != null) return true;
                    if (!swipe(dm.widthPixels * .5f, dm.heightPixels * .72f, dm.widthPixels * .5f, dm.heightPixels * .35f, 350)) return false;
                    Thread.sleep(600);
                }
                return find(f, 600) != null;
            }
            case "back": return performGlobalAction(GLOBAL_ACTION_BACK);
            case "returnApp": {
                Intent ri = new Intent(this, MainActivity.class);
                ri.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
                startActivity(ri);
                hidePanel();
                return true;
            }
            default: return false;
        }
    }
    private static int parseInt(String s, int def) { try { return Integer.parseInt(s.trim()); } catch (Exception e) { return def; } }

    /* ---------- 화면에서 대상 찾기 ---------- */
    private List<AccessibilityNodeInfo> roots() {
        List<AccessibilityNodeInfo> r = new ArrayList<>();
        try {
            for (AccessibilityWindowInfo w : getWindows()) {
                if (w.getType() == AccessibilityWindowInfo.TYPE_ACCESSIBILITY_OVERLAY) continue;
                AccessibilityNodeInfo n = w.getRoot(); if (n != null) r.add(n);
            }
        } catch (Exception ignored) { }
        if (r.isEmpty()) { AccessibilityNodeInfo n = getRootInActiveWindow(); if (n != null) r.add(n); }
        return r;
    }
    private List<AccessibilityNodeInfo> findAll(JSONObject f) {
        List<AccessibilityNodeInfo> out = new ArrayList<>();
        if (f == null) return out;
        for (AccessibilityNodeInfo r : roots()) collect(r, f, out, 0);
        return out;
    }
    private void collect(AccessibilityNodeInfo n, JSONObject f, List<AccessibilityNodeInfo> out, int depth) {
        if (n == null || depth > 60) return;
        if (match(n, f)) out.add(n);
        for (int k = 0; k < n.getChildCount(); k++) collect(n.getChild(k), f, out, depth + 1);
    }
    /* 배달 콜 같은 다른 앱이 앞에 뜨면 멈추지 않고, 대상 앱이 다시 앞에 올 때까지 기다린다 (최대 20분) */
    private String activePkg() {
        try { AccessibilityNodeInfo r = getRootInActiveWindow(); return r == null || r.getPackageName() == null ? null : r.getPackageName().toString(); }
        catch (Exception e) { return null; }
    }
    private boolean targetAway() {
        String t = job == null ? "" : job.optString("package"); if (t.isEmpty()) return false;
        String a = activePkg(); return a != null && !a.equals(t);
    }
    private long waitForTarget() throws InterruptedException {
        if (!targetAway()) return 0;
        long t0 = System.currentTimeMillis(); String keep = lastStatus;
        String name = job.optString("appName", "작업하던 앱");
        while (targetAway() && !cancel && System.currentTimeMillis() - t0 < 20 * 60_000L) {
            status("다른 화면이 떠서 잠시 기다리는 중 · " + name + ("피클".equals(name) ? "로" : "으로") + " 돌아오면 이어서 합니다");
            Thread.sleep(700);
        }
        if (cancel) return System.currentTimeMillis() - t0;
        Thread.sleep(1500);   /* 돌아온 화면이 자리 잡을 때까지 */
        status(keep);
        return System.currentTimeMillis() - t0;
    }
    private AccessibilityNodeInfo find(JSONObject f, int timeout) throws InterruptedException {
        long end = System.currentTimeMillis() + timeout;
        do {
            end += waitForTarget();
            List<AccessibilityNodeInfo> all = findAll(f);
            int idx = f == null ? 0 : f.optInt("index", 0);
            if (idx < 0) idx = all.size() + idx;
            if (idx >= 0 && idx < all.size()) return all.get(idx);
            Thread.sleep(300);
        } while (System.currentTimeMillis() < end && !cancel);
        return null;
    }
    private static boolean has(CharSequence cs, Object pat) {
        if (pat == null) return true;
        if (pat instanceof JSONArray) { JSONArray a = (JSONArray) pat; for (int k = 0; k < a.length(); k++) if (has(cs, a.opt(k))) return true; return false; }
        if (cs == null) return false;
        String s = cs.toString().trim().toLowerCase(), p = String.valueOf(pat).toLowerCase();
        return p.startsWith("=") ? s.equals(p.substring(1)) : s.contains(p);
    }
    private boolean match(AccessibilityNodeInfo n, JSONObject f) {
        if (!n.isVisibleToUser()) return false;
        if (f.has("text") && !has(n.getText(), f.opt("text"))) return false;
        if (f.has("desc") && !has(n.getContentDescription(), f.opt("desc"))) return false;
        if (f.has("any") && !(has(n.getText(), f.opt("any")) || has(n.getContentDescription(), f.opt("any")))) return false;
        if (f.has("id")) { String id = n.getViewIdResourceName(); if (id == null || !id.endsWith(f.optString("id"))) return false; }
        if (f.has("cls")) { CharSequence c = n.getClassName(); if (c == null || !c.toString().endsWith(f.optString("cls"))) return false; }
        if (f.has("pkg")) { CharSequence p = n.getPackageName(); if (p == null || !p.toString().contains(f.optString("pkg"))) return false; }
        if (f.has("editable") && n.isEditable() != f.optBoolean("editable")) return false;
        if (f.has("clickable") && n.isClickable() != f.optBoolean("clickable")) return false;
        if (f.has("area")) {
            JSONArray a = f.optJSONArray("area"); Rect r = new Rect(); n.getBoundsInScreen(r); DisplayMetrics dm = getResources().getDisplayMetrics();
            float cx = r.exactCenterX() / dm.widthPixels, cy = r.exactCenterY() / dm.heightPixels;
            if (a != null && a.length() == 4 && (cx < a.optDouble(0) || cy < a.optDouble(1) || cx > a.optDouble(2) || cy > a.optDouble(3))) return false;
        }
        if (f.has("minW")) { Rect r = new Rect(); n.getBoundsInScreen(r); if (r.width() < dp(f.optInt("minW"))) return false; }
        return true;
    }

    /* ---------- 누르기·입력 ---------- */
    private boolean clickNode(AccessibilityNodeInfo n) {
        AccessibilityNodeInfo c = n;
        while (c != null && !c.isClickable()) c = c.getParent();
        if (c != null && c.performAction(AccessibilityNodeInfo.ACTION_CLICK)) return true;
        Rect r = new Rect(); n.getBoundsInScreen(r);
        return tap(r.exactCenterX(), r.exactCenterY());
    }
    private boolean gesture(Path p, long ms) {
        panelVisible(false);
        GestureDescription g = new GestureDescription.Builder().addStroke(new GestureDescription.StrokeDescription(p, 0, ms)).build();
        CountDownLatch l = new CountDownLatch(1); boolean[] ok = {false};
        ui.post(() -> dispatchGesture(g, new GestureResultCallback() {
            @Override public void onCompleted(GestureDescription d) { ok[0] = true; l.countDown(); }
            @Override public void onCancelled(GestureDescription d) { l.countDown(); }
        }, null));
        try { l.await(ms + 2000, TimeUnit.MILLISECONDS); } catch (InterruptedException ignored) { }
        panelVisible(true);
        return ok[0];
    }
    private boolean tap(float x, float y) { Path p = new Path(); p.moveTo(x, y); return gesture(p, 60); }
    private boolean swipe(float x1, float y1, float x2, float y2, long ms) { Path p = new Path(); p.moveTo(x1, y1); p.lineTo(x2, y2); return gesture(p, ms); }
    private boolean setText(AccessibilityNodeInfo n, String t) throws InterruptedException {
        n.performAction(AccessibilityNodeInfo.ACTION_FOCUS);
        if (!n.isFocused()) clickNode(n);
        Thread.sleep(250);
        Bundle b = new Bundle(); b.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, t);
        if (n.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, b)) return true;
        CountDownLatch l = new CountDownLatch(1);
        ui.post(() -> { ((ClipboardManager) getSystemService(CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText("prompt", t)); l.countDown(); });
        l.await(1, TimeUnit.SECONDS);
        return n.performAction(AccessibilityNodeInfo.ACTION_PASTE);
    }

    /* 사진은 갤러리 맨 앞에 보이도록 순서를 거꾸로, 1초 간격으로 저장한다 (첫 번째 인물이 가장 최신) */
    /* 지난번에 클링용으로 저장한 인물 사진(kling_ref_)을 지운다. 이 앱이 만든 파일이라 권한 없이 지울 수 있다 */
    private void clearOldRefs() {
        try {
            getContentResolver().delete(MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                    MediaStore.Images.Media.DISPLAY_NAME + " LIKE ?", new String[]{"kling_ref_%"});
        } catch (Exception ignored) { }
    }
    private void saveImages(JSONArray imgs) throws InterruptedException {
        if (Build.VERSION.SDK_INT < 29) return;
        clearOldRefs(); Thread.sleep(600);
        for (int k = imgs.length() - 1; k >= 0; k--) {
            try {
                String s = imgs.getString(k); int c = s.indexOf(',');
                byte[] b = Base64.decode(c >= 0 ? s.substring(c + 1) : s, Base64.DEFAULT);
                ContentValues v = new ContentValues();
                v.put(MediaStore.Images.Media.DISPLAY_NAME, "kling_ref_" + System.currentTimeMillis() + ".jpg");
                v.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
                v.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/SDMRef");   /* 클링 앨범 목록에 "SDMRef"로 따로 보인다 */
                v.put(MediaStore.Images.Media.DATE_TAKEN, System.currentTimeMillis());
                Uri u = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, v);
                if (u != null) try (OutputStream os = getContentResolver().openOutputStream(u)) { os.write(b); }
            } catch (Exception ignored) { }
            if (k > 0) Thread.sleep(1100);
        }
        Thread.sleep(1500);   /* 클링 사진 목록에 새 사진이 잡힐 시간 */
    }

    /* ---------- 화면 기록 ---------- */
    void startInspect() {
        newDumpSession();
        status("클링에서 기록할 화면을 띄운 뒤 '이 화면 기록'을 누르세요. 화면마다 한 번씩.");
        showPanel("이 화면 기록", this::dumpScreen, "끝내기", this::finishInspect);
    }
    private void newDumpSession() {
        dumps = new JSONArray(); dumpUri = null;
        dumpName = "kling_screens_" + new java.text.SimpleDateFormat("yyyyMMdd_HHmmss", java.util.Locale.US).format(new java.util.Date()) + ".json";
    }
    private void dumpScreen() {
        try {
            panelVisible(false); Thread.sleep(300);
            JSONObject s = new JSONObject(); JSONArray nodes = new JSONArray();
            DisplayMetrics dm = getResources().getDisplayMetrics();
            s.put("time", System.currentTimeMillis()); if (lastStatus != null) s.put("status", lastStatus); s.put("w", dm.widthPixels); s.put("h", dm.heightPixels);
            for (AccessibilityNodeInfo r : roots()) walk(r, 0, nodes);
            s.put("nodes", nodes); dumps.put(s);
            panelVisible(true);
            writeDumps();
            boolean saved = saveDumpsToDownloads();
            status("화면 " + dumps.length() + "개 기록함" + (saved ? " · 다운로드/ShortDramaMaker/" + dumpName + " 에 저장됨" : " · 파일 저장 실패(설정에서 파일로 저장하세요)") + ". 다음 화면으로 가서 또 누르거나 '끝내기'를 누르세요.");
        } catch (Exception e) { panelVisible(true); status("기록 실패: " + e); }
    }
    private void walk(AccessibilityNodeInfo n, int depth, JSONArray out) throws Exception {
        if (n == null || depth > 60 || out.length() > 2500) return;
        CharSequence t = n.getText(), d = n.getContentDescription(); String id = n.getViewIdResourceName();
        if (n.isVisibleToUser() && (t != null || d != null || id != null || n.isClickable() || n.isEditable() || n.isScrollable())) {
            Rect r = new Rect(); n.getBoundsInScreen(r);
            JSONObject o = new JSONObject();
            o.put("d", depth); o.put("pkg", String.valueOf(n.getPackageName()));
            CharSequence cls = n.getClassName(); if (cls != null) o.put("cls", cls.toString().replaceAll(".*\\.", ""));
            if (t != null) o.put("t", t.toString()); if (d != null) o.put("ds", d.toString()); if (id != null) o.put("id", id);
            o.put("b", new JSONArray(new int[]{r.left, r.top, r.right, r.bottom}));
            if (n.isClickable()) o.put("c", 1); if (n.isEditable()) o.put("e", 1); if (n.isScrollable()) o.put("s", 1);
            out.put(o);
        }
        for (int k = 0; k < n.getChildCount(); k++) walk(n.getChild(k), depth + 1, out);
    }
    private void writeDumps() {
        try (FileOutputStream os = new FileOutputStream(new File(getFilesDir(), DUMP_FILE))) {
            os.write(dumps.toString().getBytes(StandardCharsets.UTF_8));
        } catch (Exception ignored) { }
    }
    /* 기록할 때마다 다운로드/ShortDramaMaker 폴더의 파일 하나에 이번 기록 전체를 덮어쓴다 */
    private boolean saveDumpsToDownloads() {
        if (Build.VERSION.SDK_INT < 29) return false;
        try {
            if (dumpUri == null) {
                ContentValues v = new ContentValues();
                v.put(MediaStore.Downloads.DISPLAY_NAME, dumpName);
                v.put(MediaStore.Downloads.MIME_TYPE, "application/json");
                v.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/ShortDramaMaker");
                dumpUri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                lastDumpUri = dumpUri; lastDumpName = dumpName;
                if (dumpUri == null) return false;
            }
            JSONObject o = new JSONObject();
            o.put("app", "short-drama-maker"); o.put("flow", flow != null ? flow.optString("version") : ""); o.put("screens", dumps);
            try (OutputStream os = getContentResolver().openOutputStream(dumpUri, "wt")) { os.write(o.toString().getBytes(StandardCharsets.UTF_8)); }
            return true;
        } catch (Exception e) { dumpUri = null; return false; }
    }
    private void finishInspect() {
        writeDumps(); hidePanel();
        Intent i = new Intent(this, MainActivity.class); i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        startActivity(i);
    }
}

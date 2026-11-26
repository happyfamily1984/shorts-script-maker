package com.happyfamily.shortsscript;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.window.OnBackInvokedDispatcher;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Iterator;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private static final int REQ_SAVE = 11;
    private static final int REQ_PICK = 12;
    private static final int REQ_VIDEOS = 13;
    private VideoMaker maker;

    private WebView web;
    private FrameLayout root;
    private byte[] pendingBytes;
    private ValueCallback<Uri[]> fileCallback;
    private boolean dark = false;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        root = new FrameLayout(this);
        web = new WebView(this);
        root.addView(web, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);
        applyBars();

        root.setOnApplyWindowInsetsListener((v, insets) -> {
            int l, t, r, b;
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets s = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                android.graphics.Insets ime = insets.getInsets(WindowInsets.Type.ime());
                l = s.left; t = s.top; r = s.right; b = Math.max(s.bottom, ime.bottom);
            } else {
                l = insets.getSystemWindowInsetLeft(); t = insets.getSystemWindowInsetTop();
                r = insets.getSystemWindowInsetRight(); b = insets.getSystemWindowInsetBottom();
            }
            v.setPadding(l, t, r, b);
            return Build.VERSION.SDK_INT >= 30 ? WindowInsets.CONSUMED : insets.consumeSystemWindowInsets();
        });

        WebSettings ws = web.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setTextZoom(100);
        ws.setAllowFileAccess(false);
        ws.setAllowContentAccess(false);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setBackgroundColor(Color.TRANSPARENT);
        web.setWebViewClient(new WebViewClient());
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> cb, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = cb;
                Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                boolean img = false;
                if (params != null && params.getAcceptTypes() != null) for (String t : params.getAcceptTypes()) if (t != null && t.startsWith("image")) img = true;
                i.setType(img ? "image/*" : "*/*");
                try { startActivityForResult(i, REQ_PICK); } catch (Exception e) { fileCallback = null; return false; }
                return true;
            }
        });
        web.addJavascriptInterface(new Bridge(), "AndroidBridge");

        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::handleBack);
        }
        if (state != null) web.restoreState(state);
        else web.loadUrl("file:///android_asset/index.html");
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.evaluateJavascript("window.onAppResume && window.onAppResume()", null);
    }

    private void handleBack() {
        web.evaluateJavascript("window.onAndroidBack ? (window.onAndroidBack(), 1) : 0", null);
    }

    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() { handleBack(); }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @SuppressWarnings("deprecation")
    private void applyBars() {
        int top = dark ? 0xFF0E1322 : 0xFFE6EEFF;
        int bottom = dark ? 0xFF161C2D : 0xFFFFFFFF;
        GradientDrawable g = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM, new int[]{top, top, bottom});
        root.setBackground(g);
        Window w = getWindow();
        w.setStatusBarColor(top);
        w.setNavigationBarColor(bottom);
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController c = w.getInsetsController();
            if (c != null) {
                int mask = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
                c.setSystemBarsAppearance(dark ? 0 : mask, mask);
            }
        } else {
            int f = dark ? 0 : (View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | (Build.VERSION.SDK_INT >= 26 ? View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR : 0));
            w.getDecorView().setSystemUiVisibility(f);
        }
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req == REQ_PICK) {
            if (fileCallback != null) {
                Uri u = (res == RESULT_OK && data != null) ? data.getData() : null;
                fileCallback.onReceiveValue(u != null ? new Uri[]{u} : null);
                fileCallback = null;
            }
        } else if (req == REQ_VIDEOS) {
            JSONArray out = new JSONArray();
            if (res == RESULT_OK && data != null) {
                if (data.getClipData() != null) for (int k = 0; k < data.getClipData().getItemCount(); k++) out.put(data.getClipData().getItemAt(k).getUri().toString());
                else if (data.getData() != null) out.put(data.getData().toString());
                for (int k = 0; k < out.length(); k++) try { getContentResolver().takePersistableUriPermission(Uri.parse(out.optString(k)), Intent.FLAG_GRANT_READ_URI_PERMISSION); } catch (Exception ignored) { }
            }
            web.evaluateJavascript("window.onVideosPicked && window.onVideosPicked(" + out.toString() + ")", null);
        } else if (req == REQ_SAVE) {
            boolean ok = false;
            if (res == RESULT_OK && data != null && data.getData() != null && pendingBytes != null) {
                try (OutputStream os = getContentResolver().openOutputStream(data.getData())) {
                    os.write(pendingBytes);
                    ok = true;
                } catch (Exception ignored) { }
            }
            pendingBytes = null;
            web.evaluateJavascript("window.onNativeSaved && window.onNativeSaved(" + ok + ")", null);
        }
    }

    private void createDocument(String name, String type, byte[] bytes) {
        pendingBytes = bytes;
        Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType(type);
        i.putExtra(Intent.EXTRA_TITLE, name);
        try { startActivityForResult(i, REQ_SAVE); }
        catch (Exception e) { pendingBytes = null; notifySaved(false); }
    }

    private void notifySaved(boolean ok) {
        web.evaluateJavascript("window.onNativeSaved && window.onNativeSaved(" + ok + ")", null);
    }

    private static byte[] decodeDataUrl(String dataUrl) {
        try {
            int c = dataUrl.indexOf(',');
            return Base64.decode(c >= 0 ? dataUrl.substring(c + 1) : dataUrl, Base64.DEFAULT);
        } catch (Exception e) { return null; }
    }

    private class Bridge {
        @JavascriptInterface
        public void shareText(String title, String text) {
            runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_SEND);
                i.setType("text/plain");
                i.putExtra(Intent.EXTRA_SUBJECT, title);
                i.putExtra(Intent.EXTRA_TEXT, text);
                startActivity(Intent.createChooser(i, "대본 공유"));
            });
        }

        @JavascriptInterface
        public void saveFile(String name, String mime, String text) {
            String type = mime.startsWith("text/") || mime.equals("application/json") ? mime : "application/octet-stream";
            runOnUiThread(() -> createDocument(name, type, text.getBytes(StandardCharsets.UTF_8)));
        }

        /* data:image/...;base64,... 를 사용자가 고른 위치에 저장 */
        @JavascriptInterface
        public void saveImage(String name, String dataUrl) {
            byte[] b = decodeDataUrl(dataUrl);
            runOnUiThread(() -> { if (b == null) notifySaved(false); else createDocument(name, "image/jpeg", b); });
        }

        /* 사진 앱의 Pictures/ShortDramaMaker 에 저장한 뒤 앱을 골라 공유 */
        @JavascriptInterface
        public void shareImage(String name, String dataUrl) {
            byte[] b = decodeDataUrl(dataUrl);
            if (b == null) return;
            if (Build.VERSION.SDK_INT < 29) { runOnUiThread(() -> createDocument(name, "image/jpeg", b)); return; }
            new Thread(() -> {
                Uri uri = null;
                try {
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.Images.Media.DISPLAY_NAME, name);
                    v.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
                    v.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/ShortDramaMaker");
                    uri = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, v);
                    if (uri != null) try (OutputStream os = getContentResolver().openOutputStream(uri)) { os.write(b); }
                } catch (Exception e) { uri = null; }
                final Uri u = uri;
                runOnUiThread(() -> {
                    if (u == null) { createDocument(name, "image/jpeg", b); return; }
                    Intent i = new Intent(Intent.ACTION_SEND);
                    i.setType("image/jpeg");
                    i.putExtra(Intent.EXTRA_STREAM, u);
                    i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    startActivity(Intent.createChooser(i, "사진 보내기"));
                });
            }).start();
        }

        @JavascriptInterface
        public void setDark(boolean d) {
            runOnUiThread(() -> { dark = d; applyBars(); });
        }

        @JavascriptInterface
        public void http(String id, String url, String method, String headersJson, String body) {
            new Thread(() -> {
                int status = 0;
                String text = "";
                HttpURLConnection c = null;
                try {
                    if (!url.startsWith("https://generativelanguage.googleapis.com/") && !url.startsWith("https://raw.githubusercontent.com/") && !url.startsWith("https://gist.githubusercontent.com/")) throw new IllegalArgumentException("blocked host");
                    c = (HttpURLConnection) new URL(url).openConnection();
                    c.setRequestMethod(method);
                    c.setConnectTimeout(15000);
                    c.setReadTimeout(120000);
                    JSONObject h = new JSONObject(headersJson);
                    Iterator<String> it = h.keys();
                    while (it.hasNext()) { String k = it.next(); c.setRequestProperty(k, h.getString(k)); }
                    if (body != null && !body.isEmpty()) {
                        c.setDoOutput(true);
                        try (OutputStream os = c.getOutputStream()) { os.write(body.getBytes(StandardCharsets.UTF_8)); }
                    }
                    status = c.getResponseCode();
                    InputStream in = status >= 400 ? c.getErrorStream() : c.getInputStream();
                    if (in != null) {
                        ByteArrayOutputStream bo = new ByteArrayOutputStream();
                        byte[] buf = new byte[8192]; int n;
                        while ((n = in.read(buf)) > 0) bo.write(buf, 0, n);
                        in.close();
                        text = bo.toString("UTF-8");
                    }
                } catch (Exception e) {
                    status = 0;
                } finally {
                    if (c != null) c.disconnect();
                }
                final String js = "window.__nativeHttp && window.__nativeHttp(" + JSONObject.quote(id) + "," + status + "," + JSONObject.quote(text) + ")";
                runOnUiThread(() -> web.evaluateJavascript(js, null));
            }).start();
        }

        /* ---------- 클링 자동 입력 ---------- */
        @JavascriptInterface
        public String klingInfo(String preferredPkg) {
            try {
                JSONObject o = new JSONObject();
                o.put("on", KlingService.isOn());
                o.put("running", KlingService.self != null && KlingService.self.isRunning());
                String pk = KlingService.findKling(MainActivity.this, preferredPkg);
                o.put("pkg", pk);
                if (!pk.isEmpty()) o.put("label", String.valueOf(getPackageManager().getApplicationLabel(getPackageManager().getApplicationInfo(pk, 0))));
                o.put("status", KlingService.lastStatus);
                o.put("sdk", Build.VERSION.SDK_INT);
                return o.toString();
            } catch (Exception e) { return "{}"; }
        }

        @JavascriptInterface
        public String startKling(String jobJson, String flowJson) {
            try {
                if (!KlingService.isOn()) return "접근성 설정에서 '숏드라마 메이커 · 자동 입력'을 켜 주세요.";
                JSONObject job = new JSONObject(jobJson), flow = new JSONObject(flowJson);
                String pk = KlingService.findKling(MainActivity.this, flow.optString("package"));
                if (pk.isEmpty()) return "클링 앱을 찾지 못했습니다. 클링 앱이 설치되어 있는지 확인하세요.";
                job.put("package", pk);
                return KlingService.self.startJob(job, flow) ? "ok" : "이미 자동 입력이 진행 중입니다.";
            } catch (Exception e) { return "자동 입력을 시작하지 못했습니다: " + e.getMessage(); }
        }

        @JavascriptInterface
        public String startKlingInspect(String preferredPkg) {
            if (!KlingService.isOn()) return "접근성 설정에서 '숏드라마 메이커 · 자동 입력'을 켜 주세요.";
            String pk = KlingService.findKling(MainActivity.this, preferredPkg);
            runOnUiThread(() -> {
                KlingService.self.startInspect();
                Intent li = pk.isEmpty() ? null : getPackageManager().getLaunchIntentForPackage(pk);
                if (li != null) { li.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); startActivity(li); }
            });
            return pk.isEmpty() ? "클링 앱을 찾지 못해 기록 막대만 띄웁니다. 클링 앱을 직접 여세요." : "ok";
        }

        /* ---------- 그록 등 다른 앱 (target: kling | grok) ---------- */
        private String findTarget(String target, String preferred) {
            if ("grok".equals(target)) return KlingService.findGrok(MainActivity.this, preferred);
            if ("pickle".equals(target)) return KlingService.findPickle(MainActivity.this, preferred);
            return KlingService.findKling(MainActivity.this, preferred);
        }

        @JavascriptInterface
        public String autoInfo(String target, String preferredPkg) {
            try {
                JSONObject o = new JSONObject();
                o.put("on", KlingService.isOn());
                o.put("running", KlingService.self != null && KlingService.self.isRunning());
                String pk = findTarget(target, preferredPkg);
                o.put("pkg", pk);
                if (!pk.isEmpty()) o.put("label", String.valueOf(getPackageManager().getApplicationLabel(getPackageManager().getApplicationInfo(pk, 0))));
                o.put("status", KlingService.lastStatus);
                return o.toString();
            } catch (Exception e) { return "{}"; }
        }

        @JavascriptInterface
        public String startAuto(String target, String jobJson, String flowJson) {
            try {
                if (!KlingService.isOn()) return "접근성 설정에서 '숏드라마 메이커 · 자동 입력'을 켜 주세요.";
                JSONObject job = new JSONObject(jobJson), flow = new JSONObject(flowJson);
                String pk = findTarget(target, flow.optString("package"));
                if (pk.isEmpty()) return ("grok".equals(target) ? "그록" : "클링") + " 앱을 찾지 못했습니다. 설치되어 있는지 확인하세요.";
                job.put("package", pk);
                return KlingService.self.startJob(job, flow) ? "ok" : "이미 자동 입력이 진행 중입니다.";
            } catch (Exception e) { return "자동 입력을 시작하지 못했습니다: " + e.getMessage(); }
        }

        @JavascriptInterface
        public String startAutoInspect(String target, String preferredPkg) {
            if (!KlingService.isOn()) return "접근성 설정에서 '숏드라마 메이커 · 자동 입력'을 켜 주세요.";
            String pk = findTarget(target, preferredPkg);
            runOnUiThread(() -> {
                KlingService.self.startInspect();
                Intent li = pk.isEmpty() ? null : getPackageManager().getLaunchIntentForPackage(pk);
                if (li != null) { li.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); startActivity(li); }
            });
            return pk.isEmpty() ? "앱을 찾지 못해 기록 막대만 띄웁니다. 앱을 직접 여세요." : "ok";
        }

        /* ---------- 갤러리에서 방금 저장된 사진 가져오기 ---------- */
        private String[] mediaPerms() { return Build.VERSION.SDK_INT >= 33 ? new String[]{"android.permission.READ_MEDIA_IMAGES", "android.permission.READ_MEDIA_VIDEO"} : new String[]{"android.permission.READ_EXTERNAL_STORAGE"}; }

        @JavascriptInterface
        public boolean hasMediaPerm() {
            for (String p : mediaPerms()) if (checkSelfPermission(p) != android.content.pm.PackageManager.PERMISSION_GRANTED) return false;
            return true;
        }

        @JavascriptInterface
        public void requestMediaPerm() { runOnUiThread(() -> requestPermissions(mediaPerms(), 21)); }

        /* ---------- 완성 영상 만들기 ---------- */
        /* sinceMs 이후 새로 저장된 동영상(이 앱이 만든 결과는 제외), 오래된 것부터 */
        @JavascriptInterface
        public String listVideosSince(double sinceMs) {
            JSONArray out = new JSONArray();
            String[] proj = {MediaStore.Video.Media._ID, MediaStore.Video.Media.DISPLAY_NAME, MediaStore.Video.Media.DURATION, MediaStore.Video.Media.DATE_ADDED};
            String[] args = {String.valueOf((long) (sinceMs / 1000) - 2)};
            try (android.database.Cursor c = getContentResolver().query(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, proj, MediaStore.Video.Media.DATE_ADDED + ">=?", args, MediaStore.Video.Media.DATE_ADDED + " ASC")) {
                while (c != null && c.moveToNext()) {
                    String name = c.getString(1);
                    if (name != null && name.contains("_assembled")) continue;
                    JSONObject o = new JSONObject();
                    o.put("uri", android.content.ContentUris.withAppendedId(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, c.getLong(0)).toString());
                    o.put("name", name); o.put("dur", c.getLong(2)); o.put("date", c.getLong(3) * 1000);
                    out.put(o);
                }
            } catch (Exception ignored) { }
            return out.toString();
        }

        /* 동영상 1초 지점 작은 미리보기 */
        @JavascriptInterface
        public String videoThumb(String uri) {
            android.media.MediaMetadataRetriever r = new android.media.MediaMetadataRetriever();
            try {
                r.setDataSource(MainActivity.this, Uri.parse(uri));
                android.graphics.Bitmap bm = r.getFrameAtTime(1_000_000, android.media.MediaMetadataRetriever.OPTION_CLOSEST_SYNC);
                if (bm == null) return "";
                int w = 200, h = Math.max(1, bm.getHeight() * w / Math.max(1, bm.getWidth()));
                android.graphics.Bitmap s = android.graphics.Bitmap.createScaledBitmap(bm, w, h, true);
                ByteArrayOutputStream bo = new ByteArrayOutputStream();
                s.compress(android.graphics.Bitmap.CompressFormat.JPEG, 80, bo);
                return "data:image/jpeg;base64," + Base64.encodeToString(bo.toByteArray(), Base64.NO_WRAP);
            } catch (Exception e) { return ""; }
            finally { try { r.release(); } catch (Exception ignored) { } }
        }

        /* 직접 고르기: 결과는 window.onVideosPicked([uri...]) */
        @JavascriptInterface
        public void pickVideos() {
            runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("video/*");
                i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                try { startActivityForResult(i, REQ_VIDEOS); } catch (Exception ignored) { }
            });
        }

        @JavascriptInterface
        public boolean assemble(String jobJson) {
            try {
                if (maker == null) maker = new VideoMaker(MainActivity.this);
                if (maker.busy()) return false;
                JSONObject job = new JSONObject(jobJson);
                maker.start(job, o -> runOnUiThread(() -> web.evaluateJavascript("window.onAssemble && window.onAssemble(" + o.toString() + ")", null)));
                return true;
            } catch (Exception e) { return false; }
        }

        @JavascriptInterface
        public void cancelAssemble() { if (maker != null) maker.cancel(); }

        @JavascriptInterface
        public void shareVideo(String uri, String title, String text) {
            runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_SEND);
                i.setType("video/mp4");
                i.putExtra(Intent.EXTRA_STREAM, Uri.parse(uri));
                i.putExtra(Intent.EXTRA_TITLE, title);
                i.putExtra(Intent.EXTRA_SUBJECT, title);
                i.putExtra(Intent.EXTRA_TEXT, text);
                i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                ((android.content.ClipboardManager) getSystemService(CLIPBOARD_SERVICE)).setPrimaryClip(android.content.ClipData.newPlainText("upload", text));
                startActivity(Intent.createChooser(i, "업로드할 앱 고르기"));
            });
        }

        /* 피클 같은 특정 앱으로 영상(있으면)과 지시문을 바로 보낸다. 결과: ok | noapp | noshare */
        @JavascriptInterface
        public String shareToApp(String target, String uri, String text) {
            String pk = findTarget(target, "");
            if (pk.isEmpty()) return "noapp";
            Intent i = new Intent(Intent.ACTION_SEND);
            boolean hasVideo = uri != null && !uri.isEmpty();
            i.setType(hasVideo ? "video/mp4" : "text/plain");
            if (hasVideo) { i.putExtra(Intent.EXTRA_STREAM, Uri.parse(uri)); i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION); }
            i.putExtra(Intent.EXTRA_TEXT, text);
            i.setPackage(pk);
            ((android.content.ClipboardManager) getSystemService(CLIPBOARD_SERVICE)).setPrimaryClip(android.content.ClipData.newPlainText("instruction", text));
            if (i.resolveActivity(getPackageManager()) == null) {
                if (hasVideo) { i.setType("text/plain"); i.removeExtra(Intent.EXTRA_STREAM); if (i.resolveActivity(getPackageManager()) == null) return "noshare"; }
                else return "noshare";
            }
            runOnUiThread(() -> { try { startActivity(i); } catch (Exception ignored) { } });
            return "ok";
        }

        @JavascriptInterface
        public void openVideo(String uri) {
            runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_VIEW);
                i.setDataAndType(Uri.parse(uri), "video/mp4");
                i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                try { startActivity(i); } catch (Exception ignored) { }
            });
        }

        /* sinceMs 이후 추가된 가장 최근 사진(이 앱이 저장한 참조 사진은 제외)을 줄여서 data URL 로 */
        @JavascriptInterface
        public String latestImageSince(double sinceMs) {
            String[] proj = {MediaStore.Images.Media._ID, MediaStore.Images.Media.DISPLAY_NAME};
            String sel = MediaStore.Images.Media.DATE_ADDED + ">=?";
            String[] args = {String.valueOf((long) (sinceMs / 1000) - 2)};
            try (android.database.Cursor c = getContentResolver().query(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, proj, sel, args, MediaStore.Images.Media.DATE_ADDED + " DESC")) {
                while (c != null && c.moveToNext()) {
                    String name = c.getString(1);
                    if (name != null && name.startsWith("kling_ref_")) continue;
                    Uri u = android.content.ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, c.getLong(0));
                    android.graphics.BitmapFactory.Options o = new android.graphics.BitmapFactory.Options();
                    o.inJustDecodeBounds = true;
                    try (java.io.InputStream in = getContentResolver().openInputStream(u)) { android.graphics.BitmapFactory.decodeStream(in, null, o); }
                    int s = 1; while (Math.max(o.outWidth, o.outHeight) / (s * 2) >= 1600) s *= 2;
                    android.graphics.BitmapFactory.Options o2 = new android.graphics.BitmapFactory.Options(); o2.inSampleSize = s;
                    android.graphics.Bitmap bm;
                    try (java.io.InputStream in = getContentResolver().openInputStream(u)) { bm = android.graphics.BitmapFactory.decodeStream(in, null, o2); }
                    if (bm == null) continue;
                    ByteArrayOutputStream bo = new ByteArrayOutputStream();
                    bm.compress(android.graphics.Bitmap.CompressFormat.JPEG, 90, bo);
                    return "data:image/jpeg;base64," + Base64.encodeToString(bo.toByteArray(), Base64.NO_WRAP);
                }
            } catch (Exception ignored) { }
            return "";
        }

        @JavascriptInterface
        public String readKlingDumps() {
            try { return new String(java.nio.file.Files.readAllBytes(new java.io.File(getFilesDir(), KlingService.DUMP_FILE).toPath()), StandardCharsets.UTF_8); }
            catch (Exception e) { return ""; }
        }

        @JavascriptInterface
        public void clearKlingDumps() { new java.io.File(getFilesDir(), KlingService.DUMP_FILE).delete(); }

        @JavascriptInterface
        public void openAccessibility() {
            runOnUiThread(() -> { try { startActivity(new Intent(android.provider.Settings.ACTION_ACCESSIBILITY_SETTINGS)); } catch (Exception ignored) { } });
        }

        @JavascriptInterface
        public void openAppInfo() {
            runOnUiThread(() -> { try { startActivity(new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName()))); } catch (Exception ignored) { } });
        }

        @JavascriptInterface
        public void exitApp() {
            runOnUiThread(MainActivity.this::finishAndRemoveTask);
        }
    }
}

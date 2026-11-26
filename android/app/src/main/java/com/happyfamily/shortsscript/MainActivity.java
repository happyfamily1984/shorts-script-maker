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

        @JavascriptInterface
        public void exitApp() {
            runOnUiThread(MainActivity.this::finishAndRemoveTask);
        }
    }
}

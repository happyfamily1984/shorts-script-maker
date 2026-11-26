package com.happyfamily.shortsscript;

import android.app.Activity;
import android.content.ContentValues;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.text.Layout;
import android.text.StaticLayout;
import android.text.TextPaint;

import androidx.media3.common.Effect;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MimeTypes;
import androidx.media3.effect.BitmapOverlay;
import androidx.media3.effect.MatrixTransformation;
import androidx.media3.effect.OverlayEffect;
import androidx.media3.effect.OverlaySettings;
import androidx.media3.effect.Presentation;
import androidx.media3.effect.TextureOverlay;
import androidx.media3.transformer.Composition;
import androidx.media3.transformer.EditedMediaItem;
import androidx.media3.transformer.EditedMediaItemSequence;
import androidx.media3.transformer.Effects;
import androidx.media3.transformer.ExportException;
import androidx.media3.transformer.ExportResult;
import androidx.media3.transformer.ProgressHolder;
import androidx.media3.transformer.Transformer;

import com.google.common.collect.ImmutableList;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;

/**
 * 클립 여러 개를 이어 붙이고 자막을 새겨 세로 1080x1920 MP4 하나로 만든다 (Media3 Transformer).
 * 결과는 사진·동영상 앱의 Movies/ShortDramaMaker 에 저장하고 JS 의 window.onAssemble 로 알린다.
 */
class VideoMaker {
    interface Callback { void send(JSONObject o); }

    private final Activity act;
    private final Handler main = new Handler(Looper.getMainLooper());
    private Transformer transformer;
    private File outFile;
    private String title;
    private Callback cb;

    VideoMaker(Activity a) { act = a; }

    private volatile boolean active = false;
    boolean busy() { return active || transformer != null; }

    void cancel() {
        main.post(() -> { cancelled = true; if (transformer != null) { transformer.cancel(); transformer = null; cleanup(); send("cancelled", 0, null, null); } });
    }

    /* job.clips(영상 uri 목록) 또는 job.items([{video:uri} | {image:dataURL, ms}]) 를 받는다.
       사진은 먼저 천천히 확대되는 짧은 영상으로 만든 뒤, 영상들과 이어 붙인다. */
    private final List<String> parts = new ArrayList<>();
    private final List<int[]> stillJobs = new ArrayList<>();   /* {parts 위치, 길이 ms} */
    private final List<File> stillFiles = new ArrayList<>();
    private JSONObject job;
    private int stillsDone = 0;
    private boolean cancelled = false;

    void start(JSONObject j, Callback callback) {
        cb = callback; job = j; cancelled = false; active = true;
        main.post(() -> {
            try {
                parts.clear(); stillJobs.clear(); stillFiles.clear(); stillsDone = 0;
                title = job.optString("title", "short-drama");
                JSONArray items = job.optJSONArray("items");
                if (items == null) {
                    JSONArray clips = job.getJSONArray("clips");
                    for (int i = 0; i < clips.length(); i++) parts.add(clips.getString(i));
                } else {
                    for (int i = 0; i < items.length(); i++) {
                        JSONObject it = items.getJSONObject(i);
                        if (it.has("image")) {
                            String d = it.getString("image"); d = d.substring(d.indexOf(',') + 1);
                            File f = new File(act.getCacheDir(), "still_" + System.currentTimeMillis() + "_" + i + ".jpg");
                            try (java.io.FileOutputStream os = new java.io.FileOutputStream(f)) { os.write(android.util.Base64.decode(d, android.util.Base64.DEFAULT)); }
                            stillFiles.add(f);
                            stillJobs.add(new int[]{parts.size(), it.optInt("ms", 5000)});
                            parts.add(Uri.fromFile(f).toString());
                        } else parts.add(it.getString("video"));
                    }
                }
                send("running", 0, null, null);
                nextStill();
            } catch (Exception e) {
                transformer = null;
                send("error", 0, null, "영상을 만들지 못했습니다: " + e.getMessage());
            }
        });
    }

    /* 사진 한 장 → 1080x1920 영상 (가운데로 천천히 8% 확대) */
    private void nextStill() {
        if (cancelled) return;
        if (stillsDone >= stillJobs.size()) { finalExport(); return; }
        int[] sj = stillJobs.get(stillsDone);
        final long durUs = sj[1] * 1000L;
        try {
            MediaItem mi = new MediaItem.Builder().setUri(Uri.parse(parts.get(sj[0]))).setImageDurationMs(sj[1]).build();
            List<Effect> fx = new ArrayList<>();
            fx.add(Presentation.createForWidthAndHeight(1080, 1920, Presentation.LAYOUT_SCALE_TO_FIT_WITH_CROP));
            fx.add((MatrixTransformation) t -> { android.graphics.Matrix mx = new android.graphics.Matrix(); float k = 1f + 0.08f * Math.min(1f, Math.max(0f, t / (float) durUs)); mx.postScale(k, k); return mx; });
            EditedMediaItem em = new EditedMediaItem.Builder(mi).setFrameRate(30).setEffects(new Effects(ImmutableList.of(), fx)).build();
            File out = new File(act.getCacheDir(), "stillv_" + System.currentTimeMillis() + "_" + stillsDone + ".mp4");
            transformer = new Transformer.Builder(act).setVideoMimeType(MimeTypes.VIDEO_H264)
                    .addListener(new Transformer.Listener() {
                        @Override public void onCompleted(Composition c, ExportResult r) {
                            transformer = null; stillFiles.add(out);
                            parts.set(sj[0], Uri.fromFile(out).toString()); stillsDone++;
                            send("running", Math.round(40f * stillsDone / stillJobs.size()), null, null);
                            nextStill();
                        }
                        @Override public void onError(Composition c, ExportResult r, ExportException e) { transformer = null; cleanup(); send("error", 0, null, "장면 이미지를 영상으로 바꾸지 못했습니다: " + e.getMessage()); }
                    }).build();
            transformer.start(em, out.getAbsolutePath());
        } catch (Exception e) { transformer = null; cleanup(); send("error", 0, null, "장면 이미지를 영상으로 바꾸지 못했습니다: " + e.getMessage()); }
    }

    private void finalExport() {
        try {
            JSONArray subs = job.optJSONArray("subs");
            boolean burn = job.optBoolean("burn", true);
            float size = (float) job.optDouble("size", 58), pos = (float) job.optDouble("pos", -0.62);
            List<EditedMediaItem> items = new ArrayList<>();
            for (int i = 0; i < parts.size(); i++) {
                List<Effect> fx = new ArrayList<>();
                fx.add(Presentation.createForWidthAndHeight(1080, 1920, Presentation.LAYOUT_SCALE_TO_FIT));
                String line = subs != null && i < subs.length() ? subs.optString(i, "").trim() : "";
                if (burn && !line.isEmpty()) {
                    Bitmap bm = subtitleBitmap(line, size);
                    OverlaySettings os = new OverlaySettings.Builder().setBackgroundFrameAnchor(0f, pos).build();
                    fx.add(new OverlayEffect(ImmutableList.<TextureOverlay>of(BitmapOverlay.createStaticBitmapOverlay(bm, os))));
                }
                items.add(new EditedMediaItem.Builder(MediaItem.fromUri(Uri.parse(parts.get(i))))
                        .setEffects(new Effects(ImmutableList.of(), fx)).build());
            }
            Composition comp = new Composition.Builder(new EditedMediaItemSequence(items))
                    .experimentalSetForceAudioTrack(true).build();
            outFile = new File(act.getCacheDir(), "assemble_" + System.currentTimeMillis() + ".mp4");
            final int base = stillJobs.isEmpty() ? 0 : 40;
            progBase = base;
            transformer = new Transformer.Builder(act)
                    .setVideoMimeType(MimeTypes.VIDEO_H264)
                    .setAudioMimeType(MimeTypes.AUDIO_AAC)
                    .addListener(new Transformer.Listener() {
                        @Override public void onCompleted(Composition c, ExportResult r) { transformer = null; cleanup(); new Thread(VideoMaker.this::publish).start(); }
                        @Override public void onError(Composition c, ExportResult r, ExportException e) { transformer = null; cleanup(); send("error", 0, null, "영상을 만들지 못했습니다: " + e.getMessage()); }
                    }).build();
            transformer.start(comp, outFile.getAbsolutePath());
            send("running", base, null, null);
            pollProgress();
        } catch (Exception e) {
            transformer = null; cleanup();
            send("error", 0, null, "영상을 만들지 못했습니다: " + e.getMessage());
        }
    }
    private int progBase = 0;
    private void cleanup() { for (File f : stillFiles) f.delete(); stillFiles.clear(); }

    private void pollProgress() {
        main.postDelayed(() -> {
            if (transformer == null) return;
            ProgressHolder ph = new ProgressHolder();
            if (transformer.getProgress(ph) == Transformer.PROGRESS_STATE_AVAILABLE) send("running", progBase + Math.round(ph.progress * (100 - progBase) / 100f), null, null);
            pollProgress();
        }, 700);
    }

    /* 만든 파일을 동영상 앱(Movies/ShortDramaMaker)에 옮긴다 */
    private void publish() {
        try {
            ContentValues v = new ContentValues();
            String name = title.replaceAll("[\\\\/:*?\"<>|]", "_") + "_assembled_" + System.currentTimeMillis() + ".mp4";
            v.put(MediaStore.Video.Media.DISPLAY_NAME, name);
            v.put(MediaStore.Video.Media.MIME_TYPE, "video/mp4");
            Uri uri;
            if (android.os.Build.VERSION.SDK_INT >= 29) {
                v.put(MediaStore.Video.Media.RELATIVE_PATH, Environment.DIRECTORY_MOVIES + "/ShortDramaMaker");
                uri = act.getContentResolver().insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, v);
            } else {
                uri = android.net.Uri.fromFile(outFile);
            }
            if (uri != null && android.os.Build.VERSION.SDK_INT >= 29) {
                try (InputStream in = new FileInputStream(outFile); OutputStream os = act.getContentResolver().openOutputStream(uri)) {
                    byte[] buf = new byte[1 << 16]; int n;
                    while ((n = in.read(buf)) > 0) os.write(buf, 0, n);
                }
                outFile.delete();
            }
            send("done", 100, uri == null ? null : uri.toString(), null);
        } catch (Exception e) { send("error", 0, null, "영상을 저장하지 못했습니다: " + e.getMessage()); }
    }

    /* 흰 글씨 + 검은 테두리, 최대 두 줄로 감싸는 자막 그림 */
    private static Bitmap subtitleBitmap(String text, float size) {
        int w = 940;
        TextPaint fill = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        fill.setTextSize(size); fill.setColor(Color.WHITE); fill.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD));
        TextPaint stroke = new TextPaint(fill);
        stroke.setStyle(Paint.Style.STROKE); stroke.setStrokeWidth(size * 0.16f); stroke.setColor(Color.BLACK); stroke.setStrokeJoin(Paint.Join.ROUND);
        StaticLayout lf = StaticLayout.Builder.obtain(text, 0, text.length(), fill, w).setAlignment(Layout.Alignment.ALIGN_CENTER).setMaxLines(3).build();
        StaticLayout ls = StaticLayout.Builder.obtain(text, 0, text.length(), stroke, w).setAlignment(Layout.Alignment.ALIGN_CENTER).setMaxLines(3).build();
        int h = lf.getHeight() + (int) (size * 0.4f);
        Bitmap bm = Bitmap.createBitmap(w + 40, h, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(bm);
        c.translate(20, size * 0.2f);
        ls.draw(c); lf.draw(c);
        return bm;
    }

    private void send(String state, int progress, String uri, String error) {
        try {
            JSONObject o = new JSONObject();
            if (!"running".equals(state)) active = false;
            o.put("state", state); o.put("progress", progress);
            if (uri != null) o.put("uri", uri);
            if (error != null) o.put("error", error);
            if (cb != null) cb.send(o);
        } catch (Exception ignored) { }
    }
}

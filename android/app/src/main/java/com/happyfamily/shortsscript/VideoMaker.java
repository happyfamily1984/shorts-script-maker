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

    boolean busy() { return transformer != null; }

    void cancel() {
        main.post(() -> { if (transformer != null) { transformer.cancel(); transformer = null; send("cancelled", 0, null, null); } });
    }

    void start(JSONObject job, Callback callback) {
        cb = callback;
        main.post(() -> {
            try {
                JSONArray clips = job.getJSONArray("clips"), subs = job.optJSONArray("subs");
                boolean burn = job.optBoolean("burn", true);
                float size = (float) job.optDouble("size", 58), pos = (float) job.optDouble("pos", -0.62);
                title = job.optString("title", "short-drama");
                List<EditedMediaItem> items = new ArrayList<>();
                for (int i = 0; i < clips.length(); i++) {
                    List<Effect> fx = new ArrayList<>();
                    fx.add(Presentation.createForWidthAndHeight(1080, 1920, Presentation.LAYOUT_SCALE_TO_FIT));
                    String line = subs != null && i < subs.length() ? subs.optString(i, "").trim() : "";
                    if (burn && !line.isEmpty()) {
                        Bitmap bm = subtitleBitmap(line, size);
                        OverlaySettings os = new OverlaySettings.Builder().setBackgroundFrameAnchor(0f, pos).build();
                        fx.add(new OverlayEffect(ImmutableList.<TextureOverlay>of(BitmapOverlay.createStaticBitmapOverlay(bm, os))));
                    }
                    items.add(new EditedMediaItem.Builder(MediaItem.fromUri(Uri.parse(clips.getString(i))))
                            .setEffects(new Effects(ImmutableList.of(), fx)).build());
                }
                Composition comp = new Composition.Builder(new EditedMediaItemSequence(items))
                        .experimentalSetForceAudioTrack(true).build();
                outFile = new File(act.getCacheDir(), "assemble_" + System.currentTimeMillis() + ".mp4");
                transformer = new Transformer.Builder(act)
                        .setVideoMimeType(MimeTypes.VIDEO_H264)
                        .setAudioMimeType(MimeTypes.AUDIO_AAC)
                        .addListener(new Transformer.Listener() {
                            @Override public void onCompleted(Composition c, ExportResult r) { transformer = null; new Thread(VideoMaker.this::publish).start(); }
                            @Override public void onError(Composition c, ExportResult r, ExportException e) { transformer = null; send("error", 0, null, "영상을 만들지 못했습니다: " + e.getMessage()); }
                        }).build();
                transformer.start(comp, outFile.getAbsolutePath());
                send("running", 0, null, null);
                pollProgress();
            } catch (Exception e) {
                transformer = null;
                send("error", 0, null, "영상을 만들지 못했습니다: " + e.getMessage());
            }
        });
    }

    private void pollProgress() {
        main.postDelayed(() -> {
            if (transformer == null) return;
            ProgressHolder ph = new ProgressHolder();
            if (transformer.getProgress(ph) == Transformer.PROGRESS_STATE_AVAILABLE) send("running", ph.progress, null, null);
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
            o.put("state", state); o.put("progress", progress);
            if (uri != null) o.put("uri", uri);
            if (error != null) o.put("error", error);
            if (cb != null) cb.send(o);
        } catch (Exception ignored) { }
    }
}

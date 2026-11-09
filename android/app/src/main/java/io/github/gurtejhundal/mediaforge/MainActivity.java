package io.github.gurtejhundal.mediaforge;

import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.webkit.*;
import android.widget.FrameLayout;
import android.widget.Toast;
import androidx.activity.ComponentActivity;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.webkit.*;
import org.json.JSONObject;
import java.io.*;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Local assets only in the renderer; files leave the app only through the system picker. */
public class MainActivity extends ComponentActivity {
    static final String ORIGIN = "https://appassets.androidplatform.net";
    private WebView web;
    private ValueCallback<Uri[]> fileChooser;
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private File exportFile;
    private OutputStream exportStream;
    private String exportToken, exportName, exportMime, saveId;
    private long expectedBytes, writtenBytes;
    private JavaScriptReplyProxy saveReply;
    private final ActivityResultLauncher<Intent> openFile = registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), result -> {
        if (fileChooser != null) {
            fileChooser.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result.getResultCode(), result.getData()));
            fileChooser = null;
        }
    });
    private final ActivityResultLauncher<Intent> saveFile = registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), result -> {
        Uri uri = result.getData() == null ? null : result.getData().getData();
        io.execute(() -> {
            try {
                if (result.getResultCode() != RESULT_OK || uri == null) {
                    reply(saveReply, saveId, true, "cancelled", true);
                } else {
                    try (InputStream in = new FileInputStream(exportFile); OutputStream out = getContentResolver().openOutputStream(uri, "wt")) {
                        if (out == null) throw new IOException("The selected location is not writable.");
                        byte[] buffer = new byte[64 * 1024];
                        int count;
                        while ((count = in.read(buffer)) != -1) out.write(buffer, 0, count);
                    }
                    reply(saveReply, saveId, true, null, null);
                }
            } catch (Exception error) {
                // Avoid leaving a zero-byte or partial result after a provider failure.
                if (uri != null) try { android.provider.DocumentsContract.deleteDocument(getContentResolver(), uri); } catch (Exception ignored) { }
                reply(saveReply, saveId, false, "error", "Could not save the file. Try another location.");
            } finally { clearExport(); }
        });
    });

    @SuppressLint("SetJavaScriptEnabled")
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        // Never retain stale exports after process death. Inputs/drafts are memory-only.
        File[] stale = getCacheDir().listFiles((directory, name) -> name.startsWith("mf-export-"));
        if (stale != null) for (File file : stale) file.delete();
        FrameLayout frame = new FrameLayout(this);
        frame.setBackgroundColor(Color.rgb(238, 232, 219));
        web = new WebView(this);
        web.setId(android.R.id.primary);
        frame.addView(web, new FrameLayout.LayoutParams(-1, -1));
        setContentView(frame);
        ViewCompat.setOnApplyWindowInsetsListener(frame, (view, insets) -> {
            androidx.core.graphics.Insets edges = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout() | WindowInsetsCompat.Type.ime());
            view.setPadding(edges.left, edges.top, edges.right, edges.bottom);
            return insets;
        });
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true); // Only URIs explicitly selected in the system picker.
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setSupportMultipleWindows(true);
        CookieManager.getInstance().setAcceptCookie(false);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, false);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        android.content.pm.PackageInfo webViewPackage = WebView.getCurrentWebViewPackage();
        int webViewMajor = 0;
        try { webViewMajor = Integer.parseInt(webViewPackage.versionName.split("\\.")[0]); } catch (Exception ignored) { }
        if (webViewMajor < 111) { showWebViewUpdate(); return; }
        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            WebViewCompat.addWebMessageListener(web, "MediaForgeFiles", Collections.singleton(ORIGIN), (view, message, origin, mainFrame, proxy) -> {
                if (!mainFrame || !ORIGIN.equals(origin.toString())) return;
                io.execute(() -> handleMessage(message.getData(), proxy));
            });
        } else { showWebViewUpdate(); return; }
        WebViewAssetLoader loader = new WebViewAssetLoader.Builder().addPathHandler("/", this::asset).build();
        web.setWebViewClient(new WebViewClientCompat() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if ("appassets.androidplatform.net".equals(request.getUrl().getHost())) {
                    WebResourceResponse response = loader.shouldInterceptRequest(request.getUrl());
                    return response != null ? response : new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
                }
                // Model/OCR runtime downloads need HTTPS. No remote page gets the native bridge.
                if (!"https".equals(request.getUrl().getScheme())) return new WebResourceResponse("text/plain", "UTF-8", new ByteArrayInputStream(new byte[0]));
                return null;
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equals(uri.getScheme()) && "appassets.androidplatform.net".equals(uri.getHost())) return false;
                if (request.isForMainFrame()) openExternal(uri);
                return true;
            }
            @Override public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                frame.removeView(view); view.destroy(); web = null;
                new AlertDialog.Builder(MainActivity.this).setTitle("The workbench ran out of memory")
                    .setMessage("Try a smaller file after reopening. Previously saved files are safe; unsaved results must be recreated.")
                    .setPositiveButton("Reopen", (dialog, which) -> recreate()).setCancelable(false).show();
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileChooser != null) fileChooser.onReceiveValue(null);
                fileChooser = callback;
                try { openFile.launch(params.createIntent().addCategory(Intent.CATEGORY_OPENABLE)); }
                catch (Exception error) { fileChooser.onReceiveValue(null); fileChooser = null; Toast.makeText(MainActivity.this, "No file picker is installed.", Toast.LENGTH_LONG).show(); }
                return true;
            }
            @Override public boolean onCreateWindow(WebView view, boolean dialog, boolean userGesture, android.os.Message result) {
                WebView popup = new WebView(MainActivity.this);
                popup.setWebViewClient(new WebViewClient() {
                    @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                        if (userGesture) openExternal(request.getUrl());
                        popup.destroy();
                        return true;
                    }
                });
                ((WebView.WebViewTransport) result.obj).setWebView(popup);
                result.sendToTarget();
                return true;
            }
        });
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override public void handleOnBackPressed() {
                if (web == null) { finish(); return; }
                Runnable leave = () -> {
                    if (web.canGoBack()) web.goBack();
                    else if (web.getUrl() != null && !"/".equals(Uri.parse(web.getUrl()).getPath())) web.loadUrl(ORIGIN + "/");
                    else finish();
                };
                web.evaluateJavascript("Boolean(window.__mediaforgeHasWorkingFiles)", dirty -> {
                    if ("true".equals(dirty)) new AlertDialog.Builder(MainActivity.this)
                        .setTitle("Working files are still open")
                        .setMessage("Save your results before leaving. Working files and previews will be cleared.")
                        .setNegativeButton("Keep working", null)
                        .setPositiveButton("Leave and discard", (dialog, which) -> web.evaluateJavascript("window.__mediaforgeAllowDiscard=true", ignored -> leave.run()))
                        .show();
                    else leave.run();
                });
            }
        });
        web.loadUrl(ORIGIN + "/");
    }

    private void showWebViewUpdate() {
        new AlertDialog.Builder(this).setTitle("Update Android System WebView")
            .setMessage("MediaForge needs a current Android System WebView to save exports safely. Update it in your app store, then reopen MediaForge.")
            .setPositiveButton("Close", (dialog, which) -> finish()).setCancelable(false).show();
    }
    private WebResourceResponse asset(String path) {
        try {
            if (path.contains("..") || path.contains("\\")) return null;
            if (path.isEmpty() || path.endsWith("/")) path += "index.html";
            else if (!path.substring(path.lastIndexOf('/') + 1).contains(".")) path += "/index.html";
            String mime = path.endsWith(".js") ? "application/javascript" : path.endsWith(".css") ? "text/css" : path.endsWith(".wasm") ? "application/wasm" : path.endsWith(".html") ? "text/html" : path.endsWith(".svg") ? "image/svg+xml" : path.endsWith(".txt") ? "text/plain" : MimeTypeMap.getSingleton().getMimeTypeFromExtension(MimeTypeMap.getFileExtensionFromUrl(path));
            WebResourceResponse response = new WebResourceResponse(mime == null ? "application/octet-stream" : mime, "UTF-8", getAssets().open("public/" + path));
            response.setResponseHeaders(new HashMap<String, String>() {{ put("Cross-Origin-Opener-Policy", "same-origin"); put("Cross-Origin-Embedder-Policy", "require-corp"); put("X-Content-Type-Options", "nosniff"); }});
            return response;
        } catch (IOException error) { return null; }
    }
    private void openExternal(Uri uri) {
        if (!"https".equals(uri.getScheme()) && !"http".equals(uri.getScheme())) return;
        try { startActivity(new Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE)); }
        catch (Exception error) { Toast.makeText(this, "No browser is installed.", Toast.LENGTH_SHORT).show(); }
    }
    private void handleMessage(String data, JavaScriptReplyProxy proxy) {
        String id = "";
        try {
            if (data == null || data.length() > 300_000) throw new IOException("Invalid export request.");
            JSONObject request = new JSONObject(data);
            id = request.getString("id");
            String action = request.getString("action");
            if (action.equals("start")) {
                if (exportFile != null) throw new IOException("Finish the open Save dialog before saving another file.");
                expectedBytes = request.getLong("size");
                if (expectedBytes < 0 || expectedBytes > 256L * 1024 * 1024) throw new IOException("Android exports are limited to 256 MB.");
                exportName = request.getString("filename").replaceAll("[\\x00-\\x1f/\\\\]", "-");
                if (exportName.trim().isEmpty()) exportName = "mediaforge-export";
                exportName = exportName.substring(0, Math.min(180, exportName.length()));
                exportMime = request.getString("mime");
                if (!exportMime.matches("[a-zA-Z0-9.+-]+/[a-zA-Z0-9.+-]+")) exportMime = "application/octet-stream";
                exportFile = File.createTempFile("mf-export-", ".tmp", getCacheDir());
                exportStream = new FileOutputStream(exportFile);
                writtenBytes = 0;
                exportToken = UUID.randomUUID().toString();
                reply(proxy, id, true, "token", exportToken);
                return;
            }
            if (exportToken == null || !exportToken.equals(request.optString("token"))) throw new IOException("This export is no longer available. Try Save again.");
            switch (action) {
                case "chunk":
                    if (saveReply != null) throw new IOException("A Save dialog is already open.");
                    byte[] bytes = Base64.decode(request.getString("data"), Base64.NO_WRAP);
                    if (writtenBytes + bytes.length > expectedBytes) throw new IOException("Invalid export size.");
                    exportStream.write(bytes); writtenBytes += bytes.length;
                    break;
                case "finish":
                    if (saveReply != null || writtenBytes != expectedBytes) throw new IOException("Incomplete export. Try again.");
                    exportStream.close(); exportStream = null;
                    saveReply = proxy; saveId = id;
                    runOnUiThread(() -> {
                        try { saveFile.launch(new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(exportMime).putExtra(Intent.EXTRA_TITLE, exportName)); }
                        catch (Exception error) { io.execute(() -> { reply(saveReply, saveId, false, "error", "No file picker is installed."); clearExport(); }); }
                    });
                    return; // Acknowledge only after the user saves or cancels.
                case "cancel": clearExport(); break;
                default: throw new IOException("Unknown export request.");
            }
            reply(proxy, id, true, null, null);
        } catch (Exception error) { reply(proxy, id, false, "error", error.getMessage() == null ? "Could not prepare the export." : error.getMessage()); }
    }
    private void reply(JavaScriptReplyProxy proxy, String id, boolean ok, String key, Object value) {
        if (proxy == null || !WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) return;
        try {
            JSONObject json = new JSONObject().put("id", id).put("ok", ok);
            if (key != null) json.put(key, value);
            runOnUiThread(() -> { try { proxy.postMessage(json.toString()); } catch (Exception ignored) { } });
        } catch (Exception ignored) { }
    }
    private void clearExport() {
        if (exportStream != null) try { exportStream.close(); } catch (IOException ignored) { }
        if (exportFile != null) exportFile.delete();
        exportStream = null; exportFile = null; exportToken = null; saveReply = null; saveId = null;
    }
    @Override protected void onDestroy() {
        if (fileChooser != null) fileChooser.onReceiveValue(null);
        if (web != null) { ((FrameLayout) web.getParent()).removeView(web); web.destroy(); }
        io.execute(this::clearExport); io.shutdown();
        super.onDestroy();
    }
}

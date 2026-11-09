package io.github.gurtejhundal.mediaforge;

import android.graphics.Bitmap;
import android.os.ParcelFileDescriptor;
import android.webkit.WebView;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.uiautomator.*;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.*;
import static org.junit.Assert.*;

/** Real installed APK, renderer, Android picker and saved bytes; no network fixture server. */
@RunWith(AndroidJUnit4.class)
public class OfflineWorkbenchTest {
    private ActivityScenario<MainActivity> scenario;
    private final UiDevice device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
    private String js(String expression) throws Exception {
        CountDownLatch latch = new CountDownLatch(1);
        String[] result = new String[1];
        scenario.onActivity(activity -> ((WebView) activity.findViewById(android.R.id.primary)).evaluateJavascript(expression, value -> { result[0] = value; latch.countDown(); }));
        assertTrue("Renderer response timed out", latch.await(10, TimeUnit.SECONDS));
        return result[0];
    }
    private void until(String expression) throws Exception {
        long deadline = System.currentTimeMillis() + 40_000;
        while (System.currentTimeMillis() < deadline) {
            if ("true".equals(js(expression))) { android.util.Log.i("MediaForgeTest", "Passed: " + expression); return; }
            Thread.sleep(200);
        }
        fail("Condition timed out: " + expression + "\n" + js("document.body.innerText.slice(-4000)"));
    }
    private void navigate(String path, String heading) throws Exception {
        js("window.__mediaforgeAllowDiscard=true;location.href=" + org.json.JSONObject.quote(MainActivity.ORIGIN + path));
        until("location.pathname===" + org.json.JSONObject.quote(path) + " && document.readyState==='complete' && document.querySelector('h1')?.textContent.includes(" + org.json.JSONObject.quote(heading) + ")");
        until("!!document.querySelector('main') && !!window.MediaForgeFiles");
        until("document.fonts.status==='loaded' && typeof window.__mediaforgeHasWorkingFiles==='boolean'");
        Thread.sleep(1000); // Let page hydration and font layout settle before native taps.
        assertEquals("true", js("document.documentElement.scrollWidth <= innerWidth"));
    }
    private void click(String text) throws Exception {
        String selector = "Array.from(document.querySelectorAll('button')).find(x=>x.textContent.trim()=== " + org.json.JSONObject.quote(text) + ")";
        until("!!(" + selector + ") && !(" + selector + ").disabled");
        tap(selector);
    }
    private void tap(String selector) throws Exception {
        js("(" + selector + ").scrollIntoView({block:'center',behavior:'instant'})");
        Thread.sleep(150); // Native taps must follow the painted scroll position, not a smooth-scroll start.
        org.json.JSONArray point = new org.json.JSONArray(js("(()=>{const r=(" + selector + ").getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2,innerWidth]})()"));
        int[] origin = new int[2]; float[] scale = new float[1];
        scenario.onActivity(activity -> { WebView view = activity.findViewById(android.R.id.primary); view.getLocationOnScreen(origin); scale[0] = (float) view.getWidth() / point.optInt(2); });
        device.click(origin[0] + (int) (point.getDouble(0) * scale[0]), origin[1] + (int) (point.getDouble(1) * scale[0]));
    }
    private void systemSave(String filename) throws Exception {
        BySelector editor = By.clazz("android.widget.EditText").pkg(java.util.regex.Pattern.compile(".*documentsui"));
        assertNotNull("Android Save dialog opened", device.wait(Until.findObject(editor), 15_000));
        device.waitForIdle();
        try { device.findObject(editor).setText(filename); }
        catch (StaleObjectException changed) { device.waitForIdle(); device.wait(Until.findObject(editor), 5000).setText(filename); }
        BySelector saveButton = By.text(java.util.regex.Pattern.compile("(?i)save")).pkg(java.util.regex.Pattern.compile(".*documentsui"));
        UiObject2 save = device.wait(Until.findObject(saveButton), 5000);
        assertNotNull("System Save button", save);
        try { save.click(); }
        catch (StaleObjectException changed) { device.waitForIdle(); device.wait(Until.findObject(saveButton), 5000).click(); }
        device.waitForIdle();
        until("document.body.textContent.includes('Saved ')");
    }
    private byte[] shell(String command) throws Exception {
        try (ParcelFileDescriptor descriptor = InstrumentationRegistry.getInstrumentation().getUiAutomation().executeShellCommand(command);
             InputStream in = new ParcelFileDescriptor.AutoCloseInputStream(descriptor);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192]; int count;
            while ((count = in.read(buffer)) != -1) out.write(buffer, 0, count);
            return out.toByteArray();
        }
    }
    private void fixture(String name, String mime) throws Exception {
        fixture(name, mime, "input[type=file]", 1);
    }
    private void fixture(String name, String mime, String selector, int copies) throws Exception {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        try (InputStream in = InstrumentationRegistry.getInstrumentation().getContext().getAssets().open(name)) {
            byte[] buffer = new byte[8192]; int count;
            while ((count = in.read(buffer)) != -1) bytes.write(buffer, 0, count);
        }
        String encoded = android.util.Base64.encodeToString(bytes.toByteArray(), android.util.Base64.NO_WRAP);
        js("(()=>{const s=atob('" + encoded + "');const bytes=Uint8Array.from(s,c=>c.charCodeAt(0));const dt=new DataTransfer();for(let i=0;i<" + copies + ";i++)dt.items.add(new File([bytes]," + org.json.JSONObject.quote(name) + ",{type:" + org.json.JSONObject.quote(mime) + "}));const input=document.querySelector(" + org.json.JSONObject.quote(selector) + ");input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()");
        until("document.body.innerText.includes(" + org.json.JSONObject.quote(name) + ")");
    }
    private void input(String selector, String value) throws Exception {
        js("Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(document.querySelector(" + org.json.JSONObject.quote(selector) + ")," + org.json.JSONObject.quote(value) + ");document.querySelector(" + org.json.JSONObject.quote(selector) + ").dispatchEvent(new Event('input',{bubbles:true}))");
    }
    @android.annotation.TargetApi(31)
    private void screenshot(String name) throws Exception {
        until("document.fonts.status==='loaded'");
        device.waitForIdle();
        Thread.sleep(500); // DOM completion can precede the compositor's first visible frame.
        shell("mkdir -p /sdcard/Download/MediaForge-test-captures");
        Bitmap bitmap = InstrumentationRegistry.getInstrumentation().getUiAutomation().takeScreenshot();
        ParcelFileDescriptor[] pipe = InstrumentationRegistry.getInstrumentation().getUiAutomation()
            .executeShellCommandRw("dd of=/sdcard/Download/MediaForge-test-captures/" + name);
        try (OutputStream out = new ParcelFileDescriptor.AutoCloseOutputStream(pipe[1]);
             InputStream in = new ParcelFileDescriptor.AutoCloseInputStream(pipe[0])) {
            assertTrue(bitmap.compress(Bitmap.CompressFormat.PNG, 100, out));
            out.close();
            while (in.read() != -1) { }
        } finally { bitmap.recycle(); }
    }

    @android.annotation.TargetApi(31)
    @Test public void offlineImportSaveCancelAndPersistence() throws Exception {
        shell("rm -f /sdcard/Download/mediaforge-android-test.png /sdcard/Download/mediaforge-android-test.json");
        ParcelFileDescriptor[] fixturePipe = InstrumentationRegistry.getInstrumentation().getUiAutomation().executeShellCommandRw("dd of=/sdcard/Download/mediaforge-input.csv");
        try (OutputStream out = new ParcelFileDescriptor.AutoCloseOutputStream(fixturePipe[1]);
             InputStream in = new ParcelFileDescriptor.AutoCloseInputStream(fixturePipe[0])) {
            out.write("name,count\nAlpha,2\n".getBytes(StandardCharsets.UTF_8)); out.close();
            while (in.read() != -1) { }
        }
        scenario = ActivityScenario.launch(MainActivity.class);
        try {
            until("document.body.textContent.includes('MediaForge') && !!window.MediaForgeFiles");
            js("localStorage.removeItem('mediaforge.localActivity.v1')");
            navigate("/tools/qr-generator/", "QR generator");
            assertEquals("true", js("isSecureContext && !!crypto.randomUUID"));
            js("Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(document.querySelector('#qr-content'),'MediaForge on Android'); document.querySelector('#qr-content').dispatchEvent(new Event('input',{bubbles:true}))");
            click("Generate locally");
            until("document.querySelector('img[alt*=\"QR\"]')?.complete && document.querySelector('img[alt*=\"QR\"]').naturalWidth>0");
            js("document.querySelector('img[alt*=\"QR\"]').scrollIntoView({block:'center',behavior:'instant'})");
            Thread.sleep(400); // Let the real renderer paint before capturing evidence.
            screenshot("android-qr.png");
            until("window.__mediaforgeHasWorkingFiles===true");
            device.pressBack();
            UiObject2 keepWorking = device.wait(Until.findObject(By.text(java.util.regex.Pattern.compile("(?i)keep working"))), 5000);
            assertNotNull("Back must protect the working QR", keepWorking);
            keepWorking.click();
            until("!!document.querySelector('img[alt*=\"QR\"]')");
            click("Download QR code");
            assertNotNull(device.wait(Until.findObject(By.clazz("android.widget.EditText")), 15_000));
            device.pressBack(); device.waitForIdle();
            if (device.hasObject(By.text("SAVE"))) device.pressBack();
            until("document.body.textContent.includes('Save cancelled')");
            assertEquals("null", js("localStorage.getItem('mediaforge.localActivity.v1')"));
            click("Download QR code");
            systemSave("mediaforge-android-test.png");
            byte[] png = shell("cat /sdcard/Download/mediaforge-android-test.png");
            assertTrue(png.length > 100);
            assertArrayEquals(new byte[]{(byte)137,80,78,71,13,10,26,10}, java.util.Arrays.copyOf(png, 8));
            until("JSON.parse(localStorage.getItem('mediaforge.localActivity.v1')).totalExports===1");
            navigate("/tools/file-converter/", "Universal File Converter");
            tap("document.querySelector('[role=button][aria-label^=\"Choose or drop\"]')");
            UiObject2 fixture = device.wait(Until.findObject(By.text("mediaforge-input.csv")), 5000);
            if (fixture == null) {
                UiObject2 drawer = device.findObject(By.desc("Show roots"));
                if (drawer != null) drawer.click();
                UiObject2 downloads = device.wait(Until.findObject(By.text("Downloads")), 5000);
                assertNotNull("Downloads storage location", downloads);
                device.waitForIdle();
                try { device.findObject(By.text("Downloads")).click(); }
                catch (StaleObjectException changed) { device.waitForIdle(); device.wait(Until.findObject(By.text("Downloads")), 5000).click(); }
                fixture = device.wait(Until.findObject(By.text("mediaforge-input.csv")), 5000);
            }
            if (fixture == null) { new UiScrollable(new UiSelector().scrollable(true)).setMaxSearchSwipes(5).scrollTextIntoView("mediaforge-input.csv"); fixture = device.findObject(By.text("mediaforge-input.csv")); }
            assertNotNull("Fixture visible in real Android picker", fixture); fixture.click();
            until("document.body.textContent.includes('mediaforge-input.csv')");
            js("Array.from(document.querySelectorAll('p,span')).find(e=>e.textContent==='mediaforge-input.csv')?.scrollIntoView({block:'center',behavior:'instant'})");
            screenshot("android-import.png");
            click("Convert to JSON");
            systemSave("mediaforge-android-test.json");
            String json = new String(shell("cat /sdcard/Download/mediaforge-android-test.json"), StandardCharsets.UTF_8);
            assertEquals("Alpha", new org.json.JSONArray(json).getJSONObject(0).getString("name"));
            assertEquals("2", new org.json.JSONArray(json).getJSONObject(0).getString("count"));
            until("JSON.parse(localStorage.getItem('mediaforge.localActivity.v1')).totalExports===2");
            scenario.close(); scenario = ActivityScenario.launch(MainActivity.class);
            until("!!window.MediaForgeFiles && document.body.textContent.includes('MediaForge')");
            assertEquals("2", js("JSON.parse(localStorage.getItem('mediaforge.localActivity.v1')).totalExports"));
            screenshot("android-workbench.png");
            navigate("/tools/video-downloader/", "Media downloader");
            until("document.body.textContent.includes('Use the web workbench')");
            device.pressBack();
            until("location.pathname==='/'");
            assertEquals("true", js("!document.body.textContent.includes('Application error')"));
        } finally { scenario.close(); }
    }

    @Test public void everyBundledPageOpensOfflineWithWorkingNavigation() throws Exception {
        scenario = ActivityScenario.launch(MainActivity.class);
        try {
            until("!!window.MediaForgeFiles && !!document.querySelector('h1')");
            String[] routes = {"audio-studio", "bg-remover", "compress", "file-converter", "format-converter", "image-enhancer", "image-cleanup", "image-modifier", "pdf-organizer", "png-to-favicon", "qr-generator", "resize", "video-converter", "video-downloader", "video-to-audio", "video-to-image", "video-upscaler", "watermark-remover"};
            for (String route : routes) {
                navigate("/tools/" + route + "/", "");
                assertEquals("Tool identity missing for " + route, "true", js("!!document.querySelector('nav[aria-label=\"Media tools\"] a[aria-current=\"page\"]')"));
                assertEquals("Client error on " + route, "false", js("document.body.innerText.toLowerCase().includes('application error')"));
            }
            navigate("/report/", "Report a problem");
            until("document.body.textContent.includes('Direct feedback is unavailable')");
        } finally { scenario.close(); }
    }

    @Test public void imageAudioAndPdfProduceRealSavedFilesOffline() throws Exception {
        shell("rm -f /sdcard/Download/mediaforge-resized.png /sdcard/Download/mediaforge-audio.wav /sdcard/Download/mediaforge-pages.pdf");
        scenario = ActivityScenario.launch(MainActivity.class);
        try {
            until("!!window.MediaForgeFiles && !!document.querySelector('h1')");
            navigate("/tools/resize/", "Image Resizer");
            fixture("sample.png", "image/png");
            until("!document.querySelector('#width').disabled && !!document.querySelector('#width').value");
            input("#width", "-1"); click("Resize Image");
            until("document.body.textContent.includes('Dimensions must be whole numbers')");
            input("#width", "128"); input("#height", "128"); click("Resize Image");
            systemSave("mediaforge-resized.png");
            byte[] png = shell("cat /sdcard/Download/mediaforge-resized.png");
            assertEquals(128, java.nio.ByteBuffer.wrap(png, 16, 4).getInt());
            assertEquals(128, java.nio.ByteBuffer.wrap(png, 20, 4).getInt());
            navigate("/tools/audio-studio/", "Audio Studio");
            fixture("sample.wav", "audio/wav");
            click("Run Audio to WAV");
            until("Array.from(document.querySelectorAll('button')).some(x=>x.textContent.includes('Download'))");
            tap("Array.from(document.querySelectorAll('button')).find(x=>x.textContent.includes('Download'))");
            systemSave("mediaforge-audio.wav");
            byte[] wav = shell("cat /sdcard/Download/mediaforge-audio.wav");
            assertTrue(wav.length > 44);
            assertEquals("RIFF", new String(wav, 0, 4, StandardCharsets.US_ASCII));
            assertEquals("WAVE", new String(wav, 8, 4, StandardCharsets.US_ASCII));
            navigate("/tools/pdf-organizer/", "Document Studio");
            tap("Array.from(document.querySelectorAll('button')).find(x=>x.textContent.startsWith('Extract pages'))");
            fixture("sample.pdf", "application/pdf");
            input("#pages", "1,3"); click("Run Extract pages");
            systemSave("mediaforge-pages.pdf");
            byte[] pdf = shell("cat /sdcard/Download/mediaforge-pages.pdf");
            File file = File.createTempFile("verified-", ".pdf", InstrumentationRegistry.getInstrumentation().getTargetContext().getCacheDir());
            try {
                try (OutputStream out = new FileOutputStream(file)) { out.write(pdf); }
                try (android.graphics.pdf.PdfRenderer renderer = new android.graphics.pdf.PdfRenderer(ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY))) {
                    assertEquals(2, renderer.getPageCount());
                }
            } finally { file.delete(); }
        } finally { scenario.close(); }
    }

    @Test public void batchAndVisibleCleanupSaveRealOutputs() throws Exception {
        shell("rm -f /sdcard/Download/mediaforge-batch.zip /sdcard/Download/mediaforge-cropped.png");
        scenario = ActivityScenario.launch(MainActivity.class);
        try {
            until("!!window.MediaForgeFiles && !!document.querySelector('h1')");
            navigate("/tools/format-converter/", "Format Converter");
            click("Multiple files"); fixture("sample.png", "image/png", "input[type=file][multiple]", 2);
            click("Process 2 images"); until("document.body.innerText.includes('2 of 2 ready')");
            click("Save finished images as ZIP"); systemSave("mediaforge-batch.zip");
            java.util.Set<String> names = new java.util.HashSet<>();
            try (java.util.zip.ZipInputStream zip = new java.util.zip.ZipInputStream(new ByteArrayInputStream(shell("cat /sdcard/Download/mediaforge-batch.zip")))) {
                java.util.zip.ZipEntry entry;
                while ((entry = zip.getNextEntry()) != null) { names.add(entry.getName()); if (entry.getName().endsWith(".png")) { byte[] signature = new byte[8]; assertEquals(8, zip.read(signature)); assertEquals(80, signature[1]); assertEquals(78, signature[2]); assertEquals(71, signature[3]); } }
            }
            assertEquals(3, names.size()); assertTrue(names.contains("batch-report.json"));
            navigate("/tools/image-cleanup/", "Visible watermark cropper"); fixture("sample.png", "image/png");
            until("!document.querySelector('#trim-bottom').disabled && document.querySelector('img[alt=\"sample.png\"]').naturalWidth>0");
            int width = Integer.parseInt(js("document.querySelector('img[alt=\"sample.png\"]').naturalWidth"));
            int height = Integer.parseInt(js("document.querySelector('img[alt=\"sample.png\"]').naturalHeight"));
            input("#trim-right", "12"); input("#trim-bottom", "10"); click("Create cropped preview");
            until("!!document.querySelector('img[alt=\"Cropped image preview\"]')");
            click("Save cropped PNG"); systemSave("mediaforge-cropped.png");
            byte[] png = shell("cat /sdcard/Download/mediaforge-cropped.png");
            assertEquals(width - 12, java.nio.ByteBuffer.wrap(png, 16, 4).getInt());
            assertEquals(height - 10, java.nio.ByteBuffer.wrap(png, 20, 4).getInt());
        } finally { scenario.close(); }
    }
}

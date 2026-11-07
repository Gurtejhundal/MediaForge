const { test } = require('node:test');
const assert = require('node:assert/strict');
const { _electron: electron } = require('@playwright/test');
const { mkdtemp, rm, readFile } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

test('desktop boots, isolates privileges, exports, denies unauthenticated HTTP, and persists after restart', { timeout: 90_000 }, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'mediaforge-desktop-test-'));
  const launch = () => electron.launch({ chromiumSandbox: true, executablePath: process.env.MEDIAFORGE_TEST_EXECUTABLE || undefined, args: [...(process.env.MEDIAFORGE_TEST_EXECUTABLE ? [] : ['desktop-app']), `--user-data-dir=${directory}`], env: { ...process.env, MEDIAFORGE_TEST_USER_DATA: directory }, timeout: 35_000 });
  let desktop;
  try {
    desktop = await launch();
    assert.equal(await desktop.evaluate(({ app }) => app.getName()), 'MediaForge');
    const page = await desktop.firstWindow();
    await page.waitForSelector('h1');
    const url = new URL(page.url());
    assert.equal(url.hostname, '127.0.0.1');
    const preferences = await desktop.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences());
    assert.equal(preferences.nodeIntegration,false);
    assert.equal(preferences.contextIsolation,true);
    assert.equal(preferences.sandbox,true);
    assert.equal(await page.evaluate(() => typeof window.require),'undefined');
    assert.equal((await fetch(`${url.origin}/api/health`)).status,403);
    await page.goto(`${url.origin}/tools/qr-generator`);
    await page.getByLabel('Text or URL').fill('MediaForge desktop smoke test');
    await page.getByRole('button',{name:'Generate locally',exact:true}).click();
    await page.getByRole('button',{name:'Generate locally',exact:true}).waitFor({state:'visible'});
    await page.waitForSelector('img[alt="Generated QR code"]');
    await desktop.evaluate(({session}, output) => { session.fromPartition('persist:mediaforge').once('will-download', (_event,item) => { item.setSavePath(output); }); }, path.join(directory,'qr.png'));
    await page.getByRole('button',{name:/Download/}).click();
    let image;
    for(let attempt=0;attempt<60;attempt++) { try { image=await readFile(path.join(directory,'qr.png')); if(image.length>0)break; } catch {} await new Promise(resolve=>setTimeout(resolve,100)); }
    assert.ok(image?.length,'The native download must save a real file.');
    assert.equal(image.subarray(1,4).toString(),'PNG');
    if (process.env.MEDIAFORGE_CAPTURE_PATH) await page.screenshot({ path: process.env.MEDIAFORGE_CAPTURE_PATH });
    const counters=await page.evaluate(()=>JSON.parse(localStorage.getItem('mediaforge.localActivity.v1')));
    assert.equal(counters.totalExports,1);
    await desktop.close();
    desktop=await launch();
    const reopened=await desktop.firstWindow(); await reopened.waitForSelector('h1');
    assert.equal(new URL(reopened.url()).origin,url.origin);
    assert.equal(await reopened.evaluate(()=>JSON.parse(localStorage.getItem('mediaforge.localActivity.v1')).totalExports),1);
    await desktop.close();desktop=undefined;
    // Child process must stop with the application.
    await assert.rejects(fetch(`${url.origin}/api/health`,{signal:AbortSignal.timeout(1000)}));
  } finally { await desktop?.close(); await rm(directory,{recursive:true,force:true}); }
});

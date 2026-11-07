const { app, BrowserWindow, dialog, session, shell, utilityProcess } = require('electron');
const { randomBytes } = require('node:crypto');
const { mkdir, readFile, writeFile } = require('node:fs/promises');
const net = require('node:net');
const path = require('node:path');
const { canOpenExternal, isAppUrl } = require('./policy.cjs');

const profileOverride = app.commandLine.getSwitchValue('user-data-dir');
if (profileOverride) app.setPath('userData', path.resolve(profileOverride));
let server, window, origin, quitting = false;
const token = randomBytes(32).toString('hex');
const instance = randomBytes(16).toString('hex');

function reservePort(port = 0) {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', reject);
    probe.listen(port, '127.0.0.1', () => {
      const selected = probe.address().port;
      probe.close((error) => error ? reject(error) : resolve(selected));
    });
  });
}
async function persistentPort() {
  const directory = app.getPath('userData');
  const filename = path.join(directory, 'server-port.json');
  await mkdir(directory, { recursive: true });
  let port;
  try { port = JSON.parse(await readFile(filename, 'utf8')).port; }
  catch (error) { if (error.code !== 'ENOENT') throw new Error('The saved desktop port setting is unreadable. Back up your profile before repairing server-port.json.'); }
  if (port !== undefined && (!Number.isInteger(port) || port < 1024 || port > 65535)) throw new Error('The saved desktop port is invalid. Back up your profile before repairing server-port.json.');
  try { port = await reservePort(port); }
  catch { throw new Error('MediaForge’s saved local port is already in use. Close the conflicting process and retry; your profile has not been changed.'); }
  await writeFile(filename, JSON.stringify({ port }), { mode: 0o600 });
  return port;
}
async function startServer() {
  const port = await persistentPort();
  origin = `http://127.0.0.1:${port}`;
  const root = app.isPackaged ? path.join(process.resourcesPath, 'web') : path.join(__dirname, '..', 'desktop-app', 'web');
  // Never inherit developer secrets, webhook credentials, or NODE_OPTIONS.
  const env = Object.fromEntries(['PATH', 'SystemRoot', 'WINDIR', 'HOME', 'USERPROFILE', 'TEMP', 'TMP', 'TMPDIR', 'LANG', 'LC_ALL'].filter((key) => process.env[key]).map((key) => [key, process.env[key]]));
  Object.assign(env, { NODE_ENV: 'production', HOSTNAME: '127.0.0.1', PORT: String(port), NEXT_TELEMETRY_DISABLED: '1', MEDIAFORGE_DESKTOP_TOKEN: token, MEDIAFORGE_DESKTOP_INSTANCE: instance });
  server = utilityProcess.fork(path.join(root, 'server.js'), [], { cwd: root, env, stdio: 'pipe', serviceName: 'MediaForge local workbench' });
  let exited = false;
  let startupDiagnostics = "";
  let ready = false;
  server.on('exit', () => { exited = true; if (window && !quitting) { dialog.showErrorBox('Local workbench stopped', 'Restart MediaForge to reopen the workbench. Exported files remain in your chosen download folder.'); app.quit(); } });
  // Consume output to avoid stalled child pipes; never persist submitted data.
  server.stdout.on('data', () => {});
  server.stderr.on('data', (chunk) => { if (!ready) startupDiagnostics = (startupDiagnostics + chunk.toString()).slice(-2000); });
  for (let attempt = 0; attempt < 120; attempt++) {
    if (exited) throw new Error(`The local server stopped during startup. Reinstall the complete application package.\n${startupDiagnostics}`);
    try {
      const response = await fetch(`${origin}/api/health`, { headers: { 'x-mediaforge-desktop-token': token }, signal: AbortSignal.timeout(500) });
      if (response.ok && (await response.json()).instance === instance) { ready = true; return; }
    } catch { /* The server is still starting. */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('The local workbench did not start within 30 seconds. Check whether security software blocked the application.');
}
function createWindow() {
  const profile = session.fromPartition('persist:mediaforge');
  profile.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  profile.setPermissionCheckHandler(() => false);
  profile.on('will-download', (_event, item) => {
    item.setSaveDialogOptions({ title: 'Save MediaForge export', buttonLabel: 'Save export', properties: ['showOverwriteConfirmation'] });
  });
  profile.webRequest.onBeforeSendHeaders((details, callback) => {
    const headers = { ...details.requestHeaders };
    if (isAppUrl(details.url, origin)) headers['x-mediaforge-desktop-token'] = token;
    callback({ requestHeaders: headers });
  });
  window = new BrowserWindow({ width: 1440, height: 1000, minWidth: 360, minHeight: 600, backgroundColor: '#12130f', title: 'MediaForge', icon: path.join(__dirname, 'icon.png'), show: false, autoHideMenuBar: true, webPreferences: { session: profile, nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true, spellcheck: false } });
  window.webContents.setWindowOpenHandler(({ url }) => { if (canOpenExternal(url)) void shell.openExternal(url); return { action: 'deny' }; });
  window.webContents.on('will-navigate', (event, url) => { if (!isAppUrl(url, origin)) { event.preventDefault(); if (canOpenExternal(url)) void shell.openExternal(url); } });
  window.webContents.on('will-attach-webview', (event) => event.preventDefault());
  window.once('ready-to-show', () => window.show());
  window.on('closed', () => { window = undefined; });
  void window.loadURL(origin);
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (window) { if (window.isMinimized()) window.restore(); window.focus(); } });
  app.whenReady().then(async () => {
    await startServer();
    createWindow();
    app.on('activate', () => { if (!window) createWindow(); });
  }).catch((error) => { console.error('MediaForge startup failed:', error.message); dialog.showErrorBox('MediaForge could not start', error.message); app.quit(); });
}
app.on('before-quit', () => { quitting = true; server?.kill(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// Programa de escritorio (Windows) de StockSoft.
const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const REMOTE = 'https://stocksoft.web.app/app/';
let autoUpdater = null; try { autoUpdater = require('electron-updater').autoUpdater; } catch (e) {}

let win = null;
const settingsFile = () => path.join(app.getPath('userData'), 'ajustes.json');
function readSettings() { try { return JSON.parse(fs.readFileSync(settingsFile(), 'utf8')); } catch (e) { return {}; } }
function writeSettings(s) { try { fs.writeFileSync(settingsFile(), JSON.stringify(s, null, 2)); } catch (e) {} }
function backupDir() {
  const s = readSettings();
  const d = s.backupDir || path.join(app.getPath('documents'), 'Sistema de Ventas - Copias');
  fs.mkdirSync(d, { recursive: true });
  return d;
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 860, minWidth: 380, minHeight: 600,
    backgroundColor: '#0b1220', title: 'StockSoft',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, spellcheck: false }
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Ver', submenu: [{ role: 'reload', label: 'Recargar' }, { role: 'togglefullscreen', label: 'Pantalla completa' }, { role: 'zoomIn', label: 'Acercar' }, { role: 'zoomOut', label: 'Alejar' }, { role: 'resetZoom', label: 'Tamaño normal' }, { type: 'separator' }, { role: 'toggleDevTools', label: 'Herramientas de desarrollo' }] }
  ]));
  win.setMenuBarVisibility(false);
  // Se carga la versión publicada (siempre la más reciente); sin internet, la copia incluida en el programa.
  const local = path.join(__dirname, '..', 'web', 'index.html');
  win.loadURL(REMOTE).catch(() => win.loadFile(local));
  win.webContents.on('did-fail-load', (e, code, desc, url, isMain) => { if (isMain && String(url).startsWith(REMOTE)) win.loadFile(local); });
  const ours = url => url.startsWith(REMOTE) || url.startsWith('file:');
  // Los enlaces externos (WhatsApp, bcv.org.ve…) se abren en el navegador.
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^(https?|mailto|tel):/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!ours(url) && /^(https?|mailto|tel):/.test(url)) { e.preventDefault(); shell.openExternal(url); } });
}

/* ---- Tasa oficial del BCV leída directamente de bcv.org.ve ---- */
function getHtml(url, insecure, depth = 0) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Accept-Language': 'es' }, rejectUnauthorized: !insecure, timeout: 20000 }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && depth < 4) { res.resume(); return getHtml(new URL(res.headers.location, url).href, insecure, depth + 1).then(resolve, reject); }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      let data = ''; res.setEncoding('utf8'); res.on('data', c => data += c); res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('Tiempo de espera agotado')));
  });
}
function parseBCV(html) {
  const grab = id => {
    const m = html.match(new RegExp('id="' + id + '"[\\s\\S]{0,1500}?<strong>\\s*([\\d.,]+)\\s*</strong>', 'i'));
    if (!m) return null;
    const v = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
    return isFinite(v) && v > 0 ? v : null;
  };
  const iso = html.match(/Fecha Valor:[\s\S]{0,400}?content="(\d{4}-\d{2}-\d{2})/i);
  const txt = html.match(/Fecha Valor:[\s\S]{0,400}?>\s*([A-Za-zÁÉÍÓÚáéíóúñ]+,\s*\d{1,2}\s+[A-Za-zÁÉÍÓÚáéíóúñ]+\s+\d{4})\s*</i);
  return { usd: grab('dolar'), eur: grab('euro'), dateISO: iso ? iso[1] : null, dateText: txt ? txt[1].replace(/\s+/g, ' ').trim() : null };
}
ipcMain.handle('bcv', async () => {
  let html;
  try { html = await getHtml('https://www.bcv.org.ve/', false); }
  catch (e) { html = await getHtml('https://www.bcv.org.ve/', true); } // el certificado de bcv.org.ve a veces viene incompleto
  const r = parseBCV(html);
  if (!r.usd) throw new Error('No se encontró la tasa en bcv.org.ve');
  return r;
});

/* ---- Copias de seguridad automáticas ---- */
ipcMain.handle('backupInfo', () => ({ dir: backupDir(), last: readSettings().lastBackup || null }));
ipcMain.handle('backup', (e, name, json, day) => {
  const dir = backupDir();
  fs.writeFileSync(path.join(dir, name.replace(/[\\/:*?"<>|]/g, '-')), json, 'utf8');
  const s = readSettings(); s.lastBackup = day; writeSettings(s);
  const files = fs.readdirSync(dir).filter(f => /^respaldo-.*\.json$/.test(f)).map(f => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs })).sort((a, b) => b.t - a.t);
  files.slice(30).forEach(x => { try { fs.unlinkSync(path.join(dir, x.f)); } catch (err) {} });
  return path.join(dir, name);
});
ipcMain.handle('chooseBackupDir', async () => {
  const r = await dialog.showOpenDialog(win, { title: 'Carpeta para las copias de seguridad', properties: ['openDirectory', 'createDirectory'], defaultPath: backupDir() });
  if (r.canceled || !r.filePaths[0]) return null;
  const s = readSettings(); s.backupDir = r.filePaths[0]; writeSettings(s);
  return r.filePaths[0];
});
ipcMain.handle('openBackupDir', () => shell.openPath(backupDir()));

/* ---- Guardar archivos (PDF de etiquetas, notas, Excel…) ---- */
ipcMain.handle('saveAs', async (e, name, data) => {
  const r = await dialog.showSaveDialog(win, { title: 'Guardar archivo', defaultPath: path.join(app.getPath('downloads'), name) });
  if (r.canceled || !r.filePath) return null;
  fs.writeFileSync(r.filePath, typeof data === 'string' ? data : Buffer.from(data));
  shell.showItemInFolder(r.filePath);
  return r.filePath;
});
ipcMain.handle('version', () => app.getVersion());

const single = app.requestSingleInstanceLock();
if (!single) app.quit();
else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    createWindow();
    // Actualización automática del programa desde GitHub Releases.
    if (autoUpdater && app.isPackaged) {
      autoUpdater.autoDownload = true;
      autoUpdater.on('update-downloaded', async info => {
        const r = await dialog.showMessageBox(win, { type: 'info', buttons: ['Reiniciar ahora', 'Más tarde'], defaultId: 0, title: 'Actualización lista', message: 'Hay una nueva versión de StockSoft (' + info.version + ').', detail: 'Se instalará al reiniciar el programa.' });
        if (r.response === 0) autoUpdater.quitAndInstall();
      });
      autoUpdater.on('error', e => console.warn('Actualización:', e && e.message));
      autoUpdater.checkForUpdates().catch(() => {});
      setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 6 * 3600e3);
    }
  });
  app.on('window-all-closed', () => app.quit());
}

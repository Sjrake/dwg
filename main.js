'use strict';
const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const fs   = require('fs');

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); }

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400, height: 900, minWidth: 900, minHeight: 600,
    title: 'CorioTEC DrawingVault',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    backgroundColor: '#0d1117',
  });
  mainWindow.loadFile(path.join(__dirname, 'DrawingVault.html'));
  mainWindow.once('ready-to-show', () => { mainWindow.show(); mainWindow.focus(); });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.on('second-instance', () => {
  if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); }
});

app.whenReady().then(() => {
  createWindow();
  buildMenu();
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// ── IPC handlers ─────────────────────────────────────────────────
ipcMain.handle('get-version',      () => app.getVersion());
ipcMain.handle('get-data-path',    () => app.getPath('userData'));
ipcMain.handle('get-app-path',     () => __dirname);
ipcMain.handle('open-data-folder', () => shell.openPath(app.getPath('userData')));

ipcMain.handle('file-exists', (e, filePath) => {
  try { return fs.existsSync(filePath); } catch { return false; }
});

ipcMain.handle('read-file-base64', (e, filePath) => {
  try { return fs.readFileSync(filePath).toString('base64'); } catch { return null; }
});

ipcMain.handle('find-cad-file', (e, drawingName, folderPath) => {
  const exts = ['.dwg', '.DWG', '.dxf', '.DXF'];
  for (const ext of exts) {
    const p = path.join(folderPath, drawingName + ext);
    if (fs.existsSync(p)) return p;
  }
  return null;
});

ipcMain.handle('open-with-system', (e, filePath) => {
  shell.openPath(filePath);
});

ipcMain.handle('choose-folder', async (e, startPath) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Kies map', properties: ['openDirectory','createDirectory'],
    defaultPath: startPath || app.getPath('documents'),
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('choose-cad-file', async (e, startPath) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Kies CAD bestand',
    filters: [{ name: 'CAD bestanden', extensions: ['dwg','dxf'] },
              { name: 'Alle bestanden', extensions: ['*'] }],
    defaultPath: startPath || app.getPath('documents'),
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('read-json', (e, filePath) => {
  try { return fs.readFileSync(filePath, 'utf8'); } catch { return null; }
});

ipcMain.handle('write-json', (e, filePath, data) => {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, data, 'utf8');
    return true;
  } catch { return false; }
});

ipcMain.handle('list-json', (e, folderPath) => {
  try {
    if (!fs.existsSync(folderPath)) return [];
    return fs.readdirSync(folderPath)
      .filter(f => f.toLowerCase().endsWith('.json'))
      .map(f => {
        const st = fs.statSync(path.join(folderPath, f));
        return { name: f, size: st.size, modified: st.mtime.toISOString() };
      });
  } catch { return []; }
});

function buildMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Bestand', submenu: [
      { label: 'Afsluiten', role: 'quit' }
    ]},
    { label: 'Bewerken', submenu: [
      { role: 'undo', label: 'Ongedaan maken' },
      { role: 'redo', label: 'Opnieuw' },
      { type: 'separator' },
      { role: 'cut', label: 'Knippen' },
      { role: 'copy', label: 'Kopiëren' },
      { role: 'paste', label: 'Plakken' },
    ]},
    { label: 'Weergave', submenu: [
      { role: 'reload', label: 'Vernieuwen' },
      { role: 'togglefullscreen', label: 'Volledig scherm' },
      { role: 'zoomIn', label: 'Inzoomen' },
      { role: 'zoomOut', label: 'Uitzoomen' },
      { role: 'resetZoom', label: 'Standaard zoom' },
    ]},
  ]));
}

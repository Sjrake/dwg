'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('_hta', {
  ready:         () => true,
  isElectron:    true,
  appPath:       null, // set after init
  dataPath:      null,
  fileExists:    (p)    => ipcRenderer.invoke('file-exists', p),
  readFile:      (p)    => ipcRenderer.invoke('read-file-base64', p),
  getFilePath:   (n, d) => ipcRenderer.invoke('find-cad-file', n, d),
  openSystem:    (p)    => ipcRenderer.invoke('open-with-system', p),
  chooseFolder:  (s)    => ipcRenderer.invoke('choose-folder', s),
  chooseFile:    (f, s) => ipcRenderer.invoke('choose-cad-file', s),
  readJson:      (p)    => ipcRenderer.invoke('read-json', p),
  writeJson:     (p, d) => ipcRenderer.invoke('write-json', p, d),
  listJson:      (p)    => ipcRenderer.invoke('list-json', p),
  getVersion:    ()     => ipcRenderer.invoke('get-version'),
  getDataPath:   ()     => ipcRenderer.invoke('get-data-path'),
  getAppPath:    ()     => ipcRenderer.invoke('get-app-path'),
});

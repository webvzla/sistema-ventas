const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktop', {
  bcv: () => ipcRenderer.invoke('bcv'),
  saveAs: (name, data) => ipcRenderer.invoke('saveAs', name, data),
  backup: (name, json, day) => ipcRenderer.invoke('backup', name, json, day),
  backupInfo: () => ipcRenderer.invoke('backupInfo'),
  chooseBackupDir: () => ipcRenderer.invoke('chooseBackupDir'),
  openBackupDir: () => ipcRenderer.invoke('openBackupDir'),
  version: () => ipcRenderer.invoke('version')
});

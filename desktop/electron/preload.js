const { contextBridge, ipcRenderer } = require('electron');

// Expose safe, isolated APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  getServerStatus: () => ipcRenderer.invoke('get-server-status'),
  getEnvPath: () => ipcRenderer.invoke('get-env-path'),
  platform: process.platform
});

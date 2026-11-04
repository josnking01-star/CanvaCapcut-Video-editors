const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('desktopAPI', {
  platform: process.platform,
  isElectron: true,
  appVersion: '3.0.0',
});

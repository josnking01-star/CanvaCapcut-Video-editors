const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'OmniCut Studio Elite - Universal Video Suite',
    icon: path.join(__dirname, '../public/favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    autoHideMenuBar: true,
    backgroundColor: '#020617',
  });

  // Wait for the backend server to be ready on port 3000
  const checkServer = () => {
    fetch('http://localhost:3000')
      .then(() => {
        mainWindow.loadURL('http://localhost:3000');
      })
      .catch(() => {
        setTimeout(checkServer, 500);
      });
  };

  checkServer();

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (serverProcess) {
      serverProcess.kill();
    }
  });
}

function startBackend() {
  const isDev = process.env.NODE_ENV === 'development';
  const serverPath = path.join(__dirname, '../server.ts');
  
  // Start server process
  serverProcess = spawn('npx', ['tsx', serverPath], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: '3000' },
    shell: true,
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`[Server]: ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Server Error]: ${data}`);
  });
}

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

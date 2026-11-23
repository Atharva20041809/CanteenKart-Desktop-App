const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const http = require('http');

let mainWindow = null;
let backendServer = null;
let loadedEnvPath = '';

// Determine environment configuration path
// 1. Check ~/Library/Application Support/CanteenKart/.env (or appData directory)
// 2. Fallback to bundled .env in process.resourcesPath or project root
function resolveAndLoadEnv() {
  const userDataDir = app.getPath('userData'); // e.g. ~/Library/Application Support/CanteenKart
  const overrideEnvPath = path.join(userDataDir, '.env');

  const bundledEnvPath = app.isPackaged
    ? path.join(process.resourcesPath, '.env')
    : path.resolve(__dirname, '../../.env');

  if (fs.existsSync(overrideEnvPath)) {
    console.log(`[Electron] Loading override .env from: ${overrideEnvPath}`);
    dotenv.config({ path: overrideEnvPath });
    loadedEnvPath = overrideEnvPath;
  } else if (fs.existsSync(bundledEnvPath)) {
    console.log(`[Electron] Loading bundled .env from: ${bundledEnvPath}`);
    dotenv.config({ path: bundledEnvPath });
    loadedEnvPath = bundledEnvPath;
  } else {
    console.log('[Electron] No .env file found; using defaults.');
    loadedEnvPath = 'defaults';
  }

  // Ensure default PORT if not set
  if (!process.env.PORT) {
    process.env.PORT = '5000';
  }
}

// Start backend Express server inside Electron or as child process
function startBackend() {
  resolveAndLoadEnv();

  let backendModulePath;
  if (app.isPackaged) {
    backendModulePath = path.join(process.resourcesPath, 'backend', 'server.js');
  } else {
    backendModulePath = path.resolve(__dirname, '../../backend/server.js');
  }

  console.log(`[Electron] Starting backend from: ${backendModulePath}`);
  try {
    const { startServer } = require(backendModulePath);
    const port = Number(process.env.PORT) || 5000;
    backendServer = startServer(port);
  } catch (err) {
    console.error('[Electron] Failed to start backend server:', err);
  }
}

// Wait until backend server responds on /api/health
function waitForBackendReady(port, callback, attempts = 0) {
  if (attempts > 30) {
    console.warn('[Electron] Backend readiness check timed out. Proceeding anyway.');
    return callback();
  }

  const req = http.get(`http://localhost:${port}/api/health`, (res) => {
    if (res.statusCode === 200) {
      console.log('[Electron] Backend is ready!');
      return callback();
    }
    setTimeout(() => waitForBackendReady(port, callback, attempts + 1), 300);
  });

  req.on('error', () => {
    setTimeout(() => waitForBackendReady(port, callback, attempts + 1), 300);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 650,
    title: 'CanteenKart - Canteen Management',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  // Load URL based on dev vs packaged
  const isDev = !app.isPackaged && process.env.VITE_DEV_SERVER_URL;
  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist-vite/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('get-env-path', () => {
  return {
    loadedEnvPath,
    overrideDir: app.getPath('userData')
  };
});

ipcMain.handle('get-server-status', async () => {
  const port = process.env.PORT || 5000;
  return new Promise((resolve) => {
    http.get(`http://localhost:${port}/api/health`, (res) => {
      let rawData = '';
      res.on('data', chunk => rawData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(rawData));
        } catch {
          resolve({ status: 'error', dbConnected: false });
        }
      });
    }).on('error', (err) => {
      resolve({ status: 'down', dbConnected: false, error: err.message });
    });
  });
});

app.whenReady().then(() => {
  startBackend();
  const port = Number(process.env.PORT) || 5000;

  waitForBackendReady(port, () => {
    createWindow();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (backendServer && backendServer.close) {
    backendServer.close(() => {
      console.log('[Electron] Backend server stopped.');
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  } else {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }
});

app.on('before-quit', () => {
  if (backendServer && backendServer.close) {
    try {
      backendServer.close();
    } catch (e) {
      // ignore
    }
  }
});

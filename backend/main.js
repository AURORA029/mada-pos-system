const { app, BrowserWindow } = require('electron');
const path = require('path');
const log = require('electron-log');

// ==========================================
// CONFIGURATION DES LOGS DE PRODUCTION
// Les logs seront écrits dans : AppData/Roaming/mada-pos/logs/main.log
// ==========================================
log.transports.file.level = 'info';
log.info('[ELECTRON_SYS]: =========================================');
log.info('[ELECTRON_SYS]: Démarrage de l\'application MADA POS');
log.info('[ELECTRON_SYS]: =========================================');

// Capture ultime pour ne jamais rater un crash fatal ("Écran blanc")
process.on('uncaughtException', (error) => {
  log.error('[ELECTRON_FATAL_CRASH]: Exception non gérée interceptée !', error);
});

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, 
    height: 800,
    webPreferences: { 
      nodeIntegration: true, 
      contextIsolation: false 
    },
    autoHideMenuBar: true, 
    title: "Mada POS - Terminal de Caisse"
  });

  const startUrl = 'http://localhost:5000/';

  const loadWithRetry = () => {
    mainWindow.loadURL(startUrl).catch((err) => {
      log.warn(`[ELECTRON_SYS]: Serveur non prêt (${err.message}), nouvelle tentative dans 1s...`);
      setTimeout(loadWithRetry, 1000);
    });
  };

  loadWithRetry();

  mainWindow.on('closed', () => { 
    mainWindow = null; 
  });
}

app.on('ready', () => {
  // 1. Définition de la zone sécurisée Windows
  const userDataPath = app.getPath('userData');
  global.safeStoragePath = userDataPath;
  
  // 2. INJECTION STRICTE (ZERO TRUST)
  process.env.DB_PATH = path.join(app.getPath('userData'), 'backend', 'mada_pos_v2.sqlite');
  process.env.PORT = 5000;

  log.info(`[ELECTRON_SYS]: AppData localisé dans : ${userDataPath}`);
  log.info(`[ELECTRON_SYS]: Chemin forcé de la DB : ${process.env.DB_PATH}`);

  // 3. Lancement du serveur Express embarqué
  try {
    require(path.join(__dirname, 'server.js'));
    log.info("[ELECTRON_SYS]: Moteur Express (server.js) injecté avec succès.");
  } catch (err) {
    log.error("[ELECTRON_CRITICAL_ERROR]: Échec fatal du chargement de server.js :", err);
  }

  // 4. Lancement de l'UI
  setTimeout(createWindow, 1000);
});

app.on('window-all-closed', () => {
  log.info('[ELECTRON_SYS]: Fermeture complète de l\'application.');
  if (process.platform !== 'darwin') app.quit();
});
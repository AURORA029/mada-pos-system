const { app, BrowserWindow } = require('electron');
const path = require('path');

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
    mainWindow.loadURL(startUrl).catch(() => {
      console.log("[ELECTRON_SYS]: Serveur non prêt, nouvelle tentative dans 1s...");
      setTimeout(loadWithRetry, 1000);
    });
  };

  loadWithRetry();

  mainWindow.on('closed', () => { 
    mainWindow = null; 
  });
}

app.on('ready', () => {
  // 1. Définition de la zone sécurisée Windows (ex: C:\Users\Nom\AppData\Roaming\mada-pos)
  const userDataPath = app.getPath('userData');
  global.safeStoragePath = userDataPath;
  
  // 2. INJECTION STRICTE (ZERO TRUST)
  // On dicte au backend exactement où écrire la DB pour éviter tout écrasement au build
  process.env.DB_PATH = path.join(userDataPath, 'mada_pos.sqlite');
  process.env.PORT = 5000;

  console.log("[ELECTRON_SYS]: Démarrage. AppData localisé dans :", userDataPath);

  // 3. Lancement du serveur Express embarqué
  try {
    require(path.join(__dirname, 'server.js'));
    console.log("[ELECTRON_SYS]: Moteur Express injecté avec succès.");
  } catch (err) {
    console.error("[ELECTRON_CRITICAL_ERROR]: Échec du chargement de server.js :", err);
  }

  // 4. Lancement de l'UI
  setTimeout(createWindow, 1000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
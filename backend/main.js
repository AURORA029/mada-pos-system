const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800,
    webPreferences: { nodeIntegration: true, contextIsolation: false },
    autoHideMenuBar: true, title: "Mada POS - Système de Caisse"
  });

  const startUrl = 'http://localhost:5000/';

  // Tentative de chargement avec répétition automatique si le serveur dort encore
  const loadWithRetry = () => {
    mainWindow.loadURL(startUrl).catch(() => {
      console.log("Serveur pas encore prêt, on réessaie dans 1s...");
      setTimeout(loadWithRetry, 1000);
    });
  };

  loadWithRetry();

  mainWindow.on('closed', () => { mainWindow = null; });
}


app.on('ready', () => {
  // On définit la zone de sauvegarde autorisée par Windows (AppData)
  const userDataPath = app.getPath('userData');
  global.safeStoragePath = userDataPath; // <--- LA CLÉ EST ICI
  
  process.chdir(userDataPath);

  try {
    require(path.join(__dirname, 'server.js'));
    console.log("Moteur Node.js allumé dans :", userDataPath);
  } catch (err) {
    console.error('Erreur du serveur Node:', err);
  }

  setTimeout(createWindow, 2000);
});


app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

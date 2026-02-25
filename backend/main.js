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
  // Définition de la zone sécurisée Windows pour toute l'application
  global.safeStoragePath = app.getPath('userData');
  process.chdir(global.safeStoragePath);

  try {
    require(path.join(__dirname, 'server.js'));
    console.log("Moteur Node.js démarré dans :", global.safeStoragePath);
  } catch (err) {
    console.error('Erreur au chargement de server.js:', err);
  }

  // On lance l'interface juste après
  setTimeout(createWindow, 1000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

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
  // CORRECTION 2 : Le Master Dev Trick
  // On déplace le cerveau de Node.js dans un dossier Windows autorisé (AppData).
  // Ainsi, la base de données SQLite pourra se créer sans faire crasher le système !
  process.chdir(app.getPath('userData'));

  // CORRECTION 3 : Suppression du "fork" instable
  // On intègre le serveur Express directement dans le processus principal
  try {
    require(path.join(__dirname, 'server.js'));
    console.log("Le moteur Node.js est allumé !");
  } catch (err) {
    console.error('Erreur CRITIQUE du serveur Node:', err);
  }

  // On laisse 2 secondes au serveur pour s'allumer avant d'afficher l'interface
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

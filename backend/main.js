const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true, // Masque la barre de menu standard (Fichier, Édition...)
    title: "Mada POS - Système de Caisse"
  });

  // En production, Electron charge l'application React compilée servie par le Backend
  mainWindow.loadURL('http://localhost:5000/admin');

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', () => {
  // 1. Démarrage du serveur Express en tâche de fond
  serverProcess = fork(path.join(__dirname, 'server.js'));

  serverProcess.on('error', (err) => {
    console.error('Erreur du serveur Node:', err);
  });

  // 2. Création de la fenêtre logicielle après un léger délai 
  // pour laisser le temps à la base de données de s'initialiser
  setTimeout(createWindow, 2000);
});

// Arrêt propre du serveur backend lorsque l'on ferme le logiciel
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  if (serverProcess) {
    serverProcess.kill();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
const { app, BrowserWindow, ipcMain } = require('electron');
const log = require('electron-log');
const { autoUpdater } = require('electron-updater');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

const fs = require('fs');
const Papa = require('papaparse');
const csvFilePath = 'assets/available'
const file = fs.createReadStream(csvFilePath);

let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  mainWindow.loadFile('src/index.html');
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
  mainWindow.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });
}

app.on('ready', () => {
  createWindow();
  autoUpdater.checkForUpdatesAndNotify();
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

ipcMain.on('app_version', (event) => {
  event.sender.send('app_version', { version: app.getVersion() });
});

autoUpdater.on('checking-for-update', () => {
  log.info('Checking for update...');
})

autoUpdater.on('update-available', () => {
  mainWindow.webContents.send('update_available');
});

autoUpdater.on('update-downloaded', () => {
  mainWindow.webContents.send('update_downloaded');
});

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});

ipcMain.on('available_offers', (event) => {
  var csvData=[];
  Papa.parse(file, {
    step: function(result) {
      csvData.push(result.data)
    },
    complete: function(results, file) {
      console.log('Complete', csvData.length, 'records.');
      event.sender.send('available_offers', csvData);
    }
    //complete: function(results) {
      //console.log(results);
    //}
  });
  //event.sender.send('available_offers', csvData);
});
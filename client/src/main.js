// @flow
// Load .env configurations
require('dotenv').load();

const isDev = require('electron-is-dev');
const {app, BrowserWindow, ipcMain} = require('electron');
const {fork} = require('child_process');
const path = require('path');
const url = require('url');
const bcrypt = require('bcrypt');

/**
 * Installs extensions and debugging.
 * @returns {Promise.<*[]>}
 */
const installExtensions = () => {
  // Start debug
  require('devtron').install();

  // Start extensions
  const {
    default: installExtension,
    REACT_DEVELOPER_TOOLS,
    REDUX_DEVTOOLS,
  } = require('electron-devtools-installer');
  const extensions = [REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS];

  // Install extensions
  return Promise
    .all(extensions.map(extension => installExtension(extension)))
    .catch(console.log);
};

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  if (isDev) {
    // Install debug extensions
    installExtensions();
  }

  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600});

  const entryUrl = process.env.ELECTRON_APP_URL || url.format({
    pathname: path.resolve(__dirname, '../build/index.html'),
    protocol: 'file:',
    slashes: true
  });
  mainWindow.loadURL(entryUrl);
  mainWindow.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on('hash', (event, password) => {
  bcrypt.hash(password, 10, function (err, hash) {
    event.sender.send('hash', hash);
  });
});

ipcMain.on('generateKeyPair', (event, secret) => {
  const child = fork(path.resolve(__dirname, './children/keyPairGenerator.js'));
  child.on('message', (keyPair) => {
    event.sender.send('generateKeyPair', keyPair);
    child.kill();
  });
  child.send(secret);
});
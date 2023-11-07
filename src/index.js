const { app, BrowserWindow, systemPreferences } = require('electron');
const path = require('path');

function checkAccessibilityPermissions(callback) {
  // Immediately check if the app is already a trusted accessibility client without prompting the user
  if (systemPreferences.isTrustedAccessibilityClient(false)) {
    console.log('The app is already trusted as an accessibility client.');
    callback(true);
  } else {
    // Not trusted, so try with prompting
    const isTrustedNow = systemPreferences.isTrustedAccessibilityClient(true);
    if (isTrustedNow) {
      console.log('We have accessibility permissions now!');
      callback(true);
    } else {
      console.log('The app is not trusted as an accessibility client.');
      // Start a periodic check every 10 seconds to see if the user has granted access
      const intervalId = setInterval(() => {
        if (systemPreferences.isTrustedAccessibilityClient(false)) {
          console.log('Accessibility permissions granted after checking again.');
          clearInterval(intervalId);
          callback(true);
        } else {
          console.log('Still not trusted, waiting for user to grant permissions...');
        }
      }, 3000);
    }
  }
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

app.whenReady().then(() => {
  checkAccessibilityPermissions((isTrusted) => {
    if (isTrusted) {
      const { uIOhook } = require('uiohook-napi');
      uIOhook.on('keydown', (e) => {
        console.log('key pressed...', e)
      });
      
      uIOhook.start();
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
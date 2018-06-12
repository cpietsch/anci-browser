const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let gooWindow


function createWindow () {
  mainWindow = new BrowserWindow({width: 1150, height: 1300})
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // app.setAboutPanelOptions({
  //     applicationName: "ANCI Browser",
  //     applicationVersion: "1.0",
  //     copyright: 'Christopher Pietsch'
  //   })

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  mainWindow.on('closed', function () {
    mainWindow = null
  })

  // gooWindow = new BrowserWindow({width: 900, height: 500, parent: mainWindow})
  // gooWindow.loadURL('https://google.de')
  // gooWindow.webContents.openDevTools()
  // console.log(gooWindow)

  // gooWindow = new BrowserView({
  //   parent: mainWindow,
  //     webPreferences: {
  //       nodeIntegration: false
  //     }
  //   })
  //   mainWindow.setBrowserView(gooWindow)
  //   mainWindow.webContents.gooWindow = gooWindow
  //   gooWindow.setBounds({ x: 0, y: 300, width: 900, height: 1000 })
  //   gooWindow.webContents.loadURL('https://images.google.de/')
}

app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})

const { BrowserWindow, app, dialog } = require("electron");
const firebaseAdmin = require("firebase-admin");

require("dotenv").config();

const fireInstances = {};

global.createFirebaseInstance = async (path, name) => {

    if(fireInstances[name]) {
        fireInstances[name].delete();
    }

    fireInstances[name] = firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(require(path)),
    }, `${name}`);

    return fireInstances[name];
};

let mainWindow = null;

function createMainWindow () {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
    });

    if(process.env.ENVIRONMENT === "development") {
        mainWindow.loadURL(`http://localhost:9000`);
        mainWindow.webContents.openDevTools({ mode: "undocked" });
    } else {
        mainWindow.loadURL(`file://${__dirname}/index.html`);
    }

    mainWindow.on('closed', () => {
        mainWindow = null
    });
}

app.on('ready', createMainWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createMainWindow();
    }
});
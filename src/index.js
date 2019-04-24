const { BrowserWindow, app } = require("electron");
const firebaseAdmin = require("firebase-admin");

require("dotenv").config();

// TODO Make configurable
global.firebaseApp = firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(require("C:\\Users\\SomeGuyFromMontana\\Documents\\TrueFrame Projects\\firebase-client\\service-account-credentials\\dev-fire-key.json")),
    databaseURL: "https://true-frame-v2.firebaseio.com",
    projectId: "true-frame-v2",
    storageBucket: "true-frame-v2.appspot.com"
});

let win = null;

function createWindow () {
    win = new BrowserWindow({
        width: 800,
        height: 600,
    });

    if(process.env.ENVIRONMENT === "development") {
        win.loadURL(`http://localhost:9000`);
    } else {
        win.loadURL(`file://${__dirname}/index.html`);
    }

    win.webContents.openDevTools({ mode: "undocked" });

    win.on('closed', () => {
        win = null
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});
import { initializeApp, credential } from "firebase-admin";
import { readFile } from "fs";
import ObjectsToCSV from "objects-to-csv";
import * as Path from "path";
import {ipcMain, BrowserWindow, app, dialog} from "electron";

// Object used for mapping instance sessions.
const fireInstances = {};

/**
 * Creates a new Firebase instance using the specified credentials and session name.
 *
 * @param path Location of the credentials file
 * @param name Name of the session
 * @returns A new Firebase instance
 */
ipcMain.handle("createFirebaseInstance", async (event, path, name) => {
    if(fireInstances[name]) {
        fireInstances[name].delete();
    }

    try {
        fireInstances[name] = initializeApp({
            credential: credential.cert(path),
        }, `${name}`);
    } catch (e) {
        console.error(e);
        throw new Error("Error parsing credentials file. Ensure that the file is correct.");
    }

    return fireInstances[name];
});

ipcMain.handle("deleteFirebaseInstance", (event, name) => {

    if(!fireInstances[name]) {
        return;
    }

    fireInstances[name].delete();
    delete fireInstances[name];
});

ipcMain.handle("createCSVFileFromObjects", (event, filepath: string, contents: object[]) => {
    new ObjectsToCSV(contents).toDisk(filepath, { allColumns: true });
    return Path.basename(filepath)
});

ipcMain.handle("openDialog", (event, options: any) => {
    return dialog.showOpenDialog(null, options)
});

let mainWindow = null;

function createMainWindow () {
    mainWindow = new BrowserWindow({
        'minHeight': 768,
        'minWidth': 1024,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    if(process.env.ENVIRONMENT === "development") {
        mainWindow.loadURL(`http://localhost:8519`);
        mainWindow.webContents.openDevTools({ mode: "undocked" });
    } else {
        mainWindow.loadURL(`file://${__dirname}/../renderer/index.html`);
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

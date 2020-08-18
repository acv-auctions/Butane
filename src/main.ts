import { BrowserWindow, app } from "electron";
import * as firebase from "firebase-admin";
import { readFile } from "fs";
import ObjectsToCSV from "objects-to-csv";
import * as path from "path";

declare var global;

// Object used for mapping instance sessions.
const fireInstances = {};

/**
 * Creates a new Firebase instance using the specified credentials and session name.
 *
 * @param path Location of the credentials file
 * @param name Name of the session
 * @returns A new Firebase instance
 */
global.createFirebaseInstance = async (path, name) => {

    if(fireInstances[name]) {
        fireInstances[name].delete();
    }

    let certificate: any;
    let contentsAtPath;

    try {
        contentsAtPath = await new Promise((accept, reject) => {
            readFile(path, { encoding: 'utf-8' }, (error, data) => {
                if(error) {
                    reject();
                }

                accept(data);
            });
        }) as string;
    } catch (e) {
        throw new Error("Could not read file at given path. Perhaps it was moved?");
    }

    try {
        certificate = JSON.parse(contentsAtPath);
    } catch (e) {
        throw new Error("Invalid JSON format.");
    }

    try {
        fireInstances[name] = firebase.initializeApp({
            credential: firebase.credential.cert(certificate),
        }, `${name}`);
    } catch (e) {
        throw new Error("Error parsing credentials file. Ensure that the file is correct.");
    }

    return fireInstances[name];
};

global.deleteFirebaseInstance = async (name) => {

    if(!fireInstances[name]) {
        return;
    }

    fireInstances[name].delete();
    delete fireInstances[name];
};

global.createCSVFileFromObjects = (filepath: string, contents: object[]) => {
    new ObjectsToCSV(contents).toDisk(filepath, { allColumns: true });
    return path.basename(filepath)
};

let mainWindow = null;

function createMainWindow () {
    mainWindow = new BrowserWindow({
        'minHeight': 768,
        'minWidth': 1024,
        webPreferences: {
            nodeIntegration: true
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

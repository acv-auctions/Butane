## Firebase Electron Client (Working Title)

Firebase Electron Client is an Electron application that wraps around
Firebase's admin SDK to make management of collections and documents
a little easier. It exposes an "SQL-like" DDL for creating, updating,
and deleting documents, along with sorting and filtering.

##### At the moment, it is recommended not to execute queries against production projects unless you know what you're doing.

#### Running locally

1. Clone the repository
2. Navigate to the directory containing the repository and run `npm install`
3. Run the following scripts via NPM: `build-electron-renderer-prod`, `start-local-server`, and `start-electron`

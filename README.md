# Firebase Electron Client (Working Title)

Firebase Electron Client is an Electron application that wraps around
Firebase's admin SDK to make management of collections and documents
a little easier. It exposes an "SQL-like" DSL for creating, updating,
and deleting documents, along with sorting and filtering.

### Currently, the DSL is fragile and lacking documentation. It is highly recommended not to execute queries against production projects.

Before starting, you'll need a service account credentials file
for a Firebase project. This can be found via your project's settings
page under the "Service accounts" tab. **This file should be treated
as a private key.**

## Running locally

1. Clone the repository
2. Navigate to the directory containing the repository and run `npm install`
3. Run the following scripts via NPM: `build-electron-renderer-prod`, `start-local-server`, and `start-electron`

## License

Copyright 2022 ACV Auctions

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

#### http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

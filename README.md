# Butane

Butane is an Electron application that wraps around the
Firebase admin SDK to make management of collections and documents
a little easier. It exposes an "SQL-like" DSL for creating, updating,
and deleting documents, along with sorting and filtering.

### Currently, the DSL is fragile and lacking documentation. It is highly recommended not to execute queries against production projects.

## Getting started

You'll need a service account with the `Firebase Admin` role associated with your Firebase project, along with a private key file generated when creating a key under the service account.

See https://cloud.google.com/iam/docs/creating-managing-service-accounts for information about creating service accounts.

It's highly recommended that you create a separate service account specifically for Butane, rather than creating a new key under an existing service account.

#### Do not share your private key with anyone! Your private key gives you complete control over your Firebase project!

If you must share access to a Firebase project, e.g. multiple users using Butane, it's recommended that you create a new service account per user and only allow a narrow scope of permissions, e.g. reading but not writing documents. This will break some functionality within Butane, but it's much more secure than giving full access.  

## Running locally

1. Install dependencies using `npm i`
2. Execute `npm run`:
    1. `build-electron-main-dev`
    2. `start-local-server`
    3. `start-electron`
    
## Building for production

TODO

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

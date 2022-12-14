<template>
    <div class="flex">
        <section v-for="(collection, index) in collections" class="w-50 overflow-hidden">
            <header class="flex align-items-center justify-center">
                <h3 class="mr-4">{{collection.id}}</h3>
                <button v-on:click="onReloadButtonClick(index)">
                  <img width="25" src="../static/reload.svg" />
                </button>
            </header>
            <div class="list-container">
                <ul v-if="collection.list.length" class="styled-default">
                    <li v-for="identifier in collection.list" @click="onListItemClick(index, identifier)">
                        <span>{{identifier}}</span>
                    </li>
                </ul>
                <h5 class="text-center" v-else-if="!loadingDocuments && !collection.list.length">
                    No documents in this collection.
                </h5>
                <div v-if="collection.type === CollectionType.DOCUMENTS" class="text-center">
                    <button v-if="!collection.endOfDocuments"
                            v-bind:disabled="loadingDocuments"
                            v-on:click="onLoadMoreDocumentsButtonClick(index)"
                            class="button">Load More</button>
                </div>
            </div>
        </section>
    </div>
</template>

<script lang="ts">
    import {FirestoreEntity} from "../../util/types";
    import { ipcRenderer } from "electron";

    export default {
        name: "collectionView",
        data: function() {
            return {
                loadingDocuments: false,
                CollectionType: FirestoreEntity,
                collections: []
            }
        },
        inject: ['updateStatusMessage'],
        mounted: async function() {
            this.refreshRootCollection();
        },
        methods: {

            async refreshRootCollection() {

                let rootCollectionPaths;

                try {
                  rootCollectionPaths = await ipcRenderer.invoke("getRootFirestoreCollections", this.$parent.$props.firebaseInstanceId);
                } catch (e) {
                    console.error(e);
                    // TODO
                }

                // Load initial root collection
                this.collections[0] = {
                    type: FirestoreEntity.COLLECTION,
                    id: "Root",
                    list: rootCollectionPaths
                };

                this.$forceUpdate();
            },

            onListItemClick: async function(index, identifier) {

                const item = this.collections[index];

                switch (item.type) {

                    case FirestoreEntity.DOCUMENTS:

                        const path = this.collections.slice(1).map(collection => { return collection.id }).join("/");

                        const reference = this.firebase.firestore().doc(`${path}/${identifier}`);

                        const documentSnapshot = await reference.get();

                        this.$emit("documentSelected", documentSnapshot);

                        break;
                    case FirestoreEntity.COLLECTION:

                        let collectionCopy = [ ...this.collections ];

                        // First index contains the root documents - we'll want to preserve those.
                        if(index === 0) {
                            collectionCopy = collectionCopy.slice(0, 1);
                        } else {
                            collectionCopy = collectionCopy.slice(0, index);
                        }

                        collectionCopy.push({
                            type: FirestoreEntity.DOCUMENTS,
                            id: identifier,
                            list: [],
                            lastDocument: null,
                            endOfDocuments: false
                        });

                        this.collections = collectionCopy;

                        this.onLoadMoreDocumentsButtonClick(collectionCopy.length - 1);

                        break;

                }
            },

            onLoadMoreDocumentsButtonClick: async function(index) {
                const item = this.collections[index];

                this.loadingDocuments = true;

                let collectionReference = this.firebase.firestore().collection(item.id);

                if(item.lastDocument) {
                    collectionReference = collectionReference.startAfter(item.lastDocument)
                }

                const result = await collectionReference.limit(50).get();

                this.loadingDocuments = false;

                const docs = result.docs.map(doc => {
                    return doc.id
                });

                docs.forEach(id => {
                    item.list.push(id);
                });

                if(docs.length < 25) {
                    item.endOfDocuments = true;
                } else {
                    item.lastDocument = result.docs[result.docs.length - 1];
                }
            },

            onReloadButtonClick: async function(index) {

                if(this.loadingDocuments) {
                    return;
                }

                this.loadingDocuments = true;

                this.collections[index].list = [];

                if(index === 0) {
                    await this.refreshRootCollection();
                } else {
                    this.collections[index].lastDocument = null;
                    this.collections[index].endOfDocuments = false;

                    await this.onLoadMoreDocumentsButtonClick(index);
                }

                this.updateStatusMessage(`Collection has been reloaded`, true);

                this.loadingDocuments = false;
            }
        }
    };
</script>

<style lang="scss">
    //@import "../css/component/collection_view";
</style>

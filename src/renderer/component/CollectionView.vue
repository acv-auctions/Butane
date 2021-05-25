<template>
    <section class="collection-wrapper">
        <div v-for="(collection, index) in collections" class="collection animate-fade-in-right">
            <header>
                <h3>{{collection.id}}</h3>
                <img v-on:click="onReloadButtonClick(index)" width="25" src="../img/reload.svg" />
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
        </div>
    </section>
</template>

<script lang="ts">
    import {CollectionType} from "util/types";

    interface State {
        loadingDocuments: boolean;
        CollectionType: CollectionType;
        collections: {
            type: CollectionType;
            id: string;
            list: any[];
            lastDocument?: firebase.firestore.DocumentReference | null;
            endOfDocuments?: boolean;
        }[];
    }

    export default {
        name: "collectionView",
        data: function() {
            return {
                loadingDocuments: false,
                CollectionType: CollectionType,
                collections: []
            } as State
        },
        props: {
            firebase: Object
        },
        inject: ['updateStatusMessage'],
        mounted: async function() {
            this.refreshRootCollection();
        },
        methods: {

            async refreshRootCollection() {

                let collections;

                try {
                    collections = await this.firebase.firestore().listCollections();
                } catch (e) {
                    console.error(e);
                    // TODO
                }

                // Load initial root collection
                this.collections[0] = {
                    type: CollectionType.COLLECTION,
                    id: "Root",
                    list: collections.map(reference => {
                        return reference.path;
                    })
                };

                this.$forceUpdate();
            },

            onListItemClick: async function(index, identifier) {

                const item = this.collections[index];

                switch (item.type) {

                    case CollectionType.DOCUMENTS:

                        const path = this.collections.slice(1).map(collection => { return collection.id }).join("/");

                        const reference = this.firebase.firestore().doc(`${path}/${identifier}`);

                        const documentSnapshot = await reference.get();

                        this.$emit("documentSelected", documentSnapshot);

                        break;
                    case CollectionType.COLLECTION:

                        let collectionCopy = [ ...this.collections ];

                        // First index contains the root documents - we'll want to preserve those.
                        if(index === 0) {
                            collectionCopy = collectionCopy.slice(0, 1);
                        } else {
                            collectionCopy = collectionCopy.slice(0, index);
                        }

                        collectionCopy.push({
                            type: CollectionType.DOCUMENTS,
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
    @import "../css/component/collection_view";
</style>

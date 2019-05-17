<template>
    <section class="collection-wrapper">
        <div v-for="(collection, index) in collections" class="collection animate-fade-in-right">
            <header>
                <h3>{{collection.id}}</h3>
            </header>
            <div class="list-container">
                <ul class="styled">
                    <li v-for="identifier in collection.list" @click="onListItemClick(index, identifier)">
                        <span>{{identifier}}</span>
                    </li>
                </ul>
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
    import {CollectionType} from "../util/types";

    export default {
        name: "collectionView",
        data: function() {
            return {
                loadingDocuments: false,
                CollectionType: CollectionType,
                collections: []
            }
        },
        props: ['firebase'],
        mounted: async function() {
            const collections = await this.firebase.firestore().getCollections();

            // Load initial root collection
            this.collections.push({
                type: CollectionType.COLLECTION,
                id: "Root",
                list: collections.map(reference => {
                    return reference._path.relativeName;
                })
            });
        },
        methods: {
            onListItemClick: async function(index, identifier) {

                const item = this.collections[index];

                switch (item.type) {

                    case CollectionType.DOCUMENTS:

                        const path = this.collections.slice(1).map(collection => { return collection.id }).join("/");

                        const reference = this.firebase.firestore().doc(`${path}/${identifier}`);

                        /*const subCollectionIdentifiers = (await reference.getCollections()).map(reference => {
                            return reference._path.relativeName;
                        });*/

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

                const result = await collectionReference.limit(25).get();

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
            }
        }
    };
</script>

<style lang="scss">
    @import "../css/component/collection_view";
</style>
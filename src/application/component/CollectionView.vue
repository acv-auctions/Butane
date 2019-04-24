<template>
    <section class="collection-wrapper">
        <div v-for="(collection, index) in collections" class="collection">
            <header>
                <h3>{{collection.id}}</h3>
            </header>
            <div class="list-container">
                <ul class="styled">
                    <li v-for="identifier in collection.list" @click="onListItemClick(index, identifier)">
                        {{identifier}}
                    </li>
                </ul>
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
                collections: []
            }
        },
        mounted: async function() {
            const collections = await this.$root.firebase.firestore().getCollections();

            this.collections.push({
                type: CollectionType.COLLECTION,
                id: "Root Collections",
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

                        const reference = this.$root.firebase.firestore().doc(`${path}/${identifier}`);

                        /*const subCollectionIdentifiers = (await reference.getCollections()).map(reference => {
                            return reference._path.relativeName;
                        });*/

                        const documentSnapshot = await reference.get();

                        this.$emit("documentSelected", documentSnapshot);

                        break;
                    case CollectionType.COLLECTION:

                        let _collection = [ ...this.collections ];

                        // First index contains the root documents - we'll want to preserve those.
                        if(index === 0) {
                            _collection = _collection.slice(0, 1);
                        } else {
                            _collection = _collection.slice(0, index);
                        }

                        // TODO Configurable limit
                        const result = await this.$root.firebase.firestore().collection(identifier).limit(25).get();

                        const docs = result.docs.map(doc => {
                            return doc.id
                        });

                        _collection.push({
                            type: CollectionType.DOCUMENTS,
                            id: identifier,
                            list: docs
                        });

                        this.collections = _collection;

                        break;

                }
            }
        }
    };
</script>

<style lang="scss">
    @import "../css/component/collection_view";
</style>
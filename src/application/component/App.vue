<template>
    <div class="main-container">
        <collection-view @documentSelected="onCollectionItemClick"></collection-view>
        <template v-if="documents.length">
            <document-view :documents="documents" @dismissDocumentView="onDismissDocumentView"></document-view>
        </template>
        <section class="query-wrapper">
            <term-input @querySubmit="onQuerySubmission" />
        </section>
    </div>
</template>

<script lang="ts">
    import Terminal from "./Terminal.vue";
    import FirebaseSQL from "../util/FirebaseSQL";
    import CollectionView from "./CollectionView";
    import DocumentView from "./DocumentView";

    export default {
        name: "App",
        components: {
            'document-view': DocumentView,
            'collection-view': CollectionView,
            'term-input': Terminal
        },
        data: function() {
            return {
                documents: []
            }
        },
        methods: {

            onQuerySubmission: async function(query) {

                let querySnapshot;

                try {
                    const firebase = this.$root.firebase;

                    querySnapshot = await FirebaseSQL(query, firebase.firestore());
                } catch (e) {
                    console.error(e);
                    return;
                }

                const { docs } = querySnapshot;

                this.documents = docs.map(documentSnapshot => {
                    return {
                        id: documentSnapshot.id,
                        payload: documentSnapshot.data()
                    }
                });
            },

            onCollectionItemClick: async function(document) {
                this.documents.push({
                    id: document.id,
                    payload: document.data()
                });
            },

            onDismissDocumentView: function() {
                this.documents = [];
            }
        }
    }
</script>

<style lang="scss">
    @import "../css/component/app";
</style>
<template>
    <div class="main-container">
        <div class="main-content">
            <collection-view @documentSelected="onCollectionItemClick"></collection-view>
            <template v-if="documents.length">
                <document-view :documents="documents" @dismissDocumentView="onDismissDocumentView"></document-view>
            </template>
        </div>
        <section class="query-wrapper">
            <term-input v-bind:is-disabled="querySubmitted" @querySubmit="onQuerySubmission" />
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
                documents: [],
                querySubmitted: false
            }
        },
        methods: {

            onQuerySubmission: async function(query) {

                let querySnapshot;

                this.querySubmitted = true;

                try {
                    const firebase = this.$root.firebase;

                    querySnapshot = await FirebaseSQL(query, firebase.firestore());
                } catch (e) {

                    const { code } = e;

                    if(code === 9) {
                        const splitPoint = e.details.indexOf(":") + 1;
                        const indexCreationLink = e.details.substr(splitPoint).trim();
                        console.info(indexCreationLink);
                    } else {
                        console.error(e);
                    }

                    return;
                } finally {
                    this.querySubmitted = false;
                }

                // It's possible that
                if(!querySnapshot) {
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
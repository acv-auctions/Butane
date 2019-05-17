<template>
    <div class="main-container">
        <div class="main-content">
            <collection-view v-bind:firebase="firebase" @documentSelected="onCollectionItemClick"></collection-view>
            <document-view v-if="documents.length" :documents="documents" @dismissDocumentView="onDismissDocumentView"></document-view>
        </div>
        <section>
            <div class="query-notification-container">
                <strong>Status:</strong>&nbsp;
                <span v-if="!querySubmitted && queryError" v-html="queryError" class="error"></span>
                <span v-if="!querySubmitted && querySuccess" v-html="querySuccess"></span>
                <span v-if="querySubmitted">Query submitted - waiting for response...</span>
                <span v-if="!querySubmitted && !querySuccess && !queryError">Waiting...</span>
            </div>
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
        name: "Main",
        components: {
            'document-view': DocumentView,
            'collection-view': CollectionView,
            'term-input': Terminal
        },
        props: ["firebase"],
        data: function() {
            return {
                documents: [],
                querySubmitted: false,
                queryError: null,
                querySuccess: null
            }
        },
        methods: {

            onQuerySubmission: async function(query) {

                let docs;

                this.querySubmitted = true;
                this.queryError = null;
                this.querySuccess = null;

                try {
                    docs = await FirebaseSQL(query, this.firebase.firestore());
                } catch (e) {

                    const { code } = e;

                    if(code === 9) {
                        const splitPoint = e.details.indexOf(":") + 1;
                        const indexCreationLink = e.details.substr(splitPoint).trim();
                        this.queryError = `This query requires an index - <a href="${indexCreationLink}">click here to create it</a>.`;
                    } else {
                        this.queryError = e.message;
                    }
                } finally {
                    this.querySubmitted = false;
                }

                if(this.queryError) {
                    return;
                }

                // It's possible that
                if(!docs) {
                    return;
                }

                this.documents = docs;
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
    @import "../css/component/main";
</style>
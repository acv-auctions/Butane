<template>
    <div class="main-container">
        <div class="main-content">
            <collection-view :firebase="firebase" @documentSelected="onCollectionItemClick"></collection-view>
            <document-view :firebase="firebase" v-if="documents.length" :documents="documents" @dismissDocumentView="onDismissDocumentView"></document-view>
        </div>
        <section>
            <div class="query-notification-container">
                <strong>Status:</strong>&nbsp;
                <span v-if="!querySubmitted && !status.message.length">Waiting...</span>
                <span v-if="!querySubmitted" v-bind:class="{ 'text-error': status.type === false, 'text-success': status.type }">
                    {{ status.message }}
                </span>
                <span v-if="querySubmitted">Query submitted - waiting for response...</span>
            </div>
            <term-input v-bind:is-disabled="querySubmitted" @querySubmit="onQuerySubmission" />
        </section>
    </div>
</template>

<script lang="ts">
    import Terminal from "component/Terminal";
    import FirebaseSQL from "util/FirebaseSQL";
    import CollectionView from "component/CollectionView";
    import DocumentView from "component/DocumentView";

    interface State {
        documents: any;
        querySubmitted: boolean;
        status: {
            message: string,
            type: boolean | null
        }
    }

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
                status: {
                    message: "",
                    type: null
                }
            } as State;
        },
        provide: function() {
            return {
                updateStatusMessage: this.setStatus
            }
        },
        methods: {

            setStatus: function(message: string, type: boolean = null) {
                this.status = {
                    message,
                    type
                }
            },

            onQuerySubmission: async function(query) {

                let docs;

                let hasError = false;
                this.querySubmitted = true;

                try {
                    docs = await FirebaseSQL(query, this.firebase.firestore());
                } catch (e) {

                    hasError = true;

                    const { code } = e;

                    if(code === 9) {
                        const splitPoint = e.details.indexOf(":") + 1;
                        const indexCreationLink = e.details.substr(splitPoint).trim();

                        this.setStatus(`This query requires an index - <a href="${indexCreationLink}">click here to create it</a>.`, false);
                    } else {
                        this.setStatus(e.message, false);
                    }

                    console.error(e);
                } finally {
                    this.querySubmitted = false;
                }

                if(hasError) {
                    return;
                }

                if(!docs) {
                    this.setStatus("Query executed successfully - no results found.", true);
                    return;
                }

                this.setStatus("Query executed successfully.", true);

                this.documents = docs;
            },

            onCollectionItemClick: async function(document) {

                if(this.querySubmitted) {
                    return;
                }

                this.setStatus("Fetching document...");

                this.querySubmitted = true;

                const doc = await this.firebase.firestore().doc(document.ref.path).get();

                this.querySubmitted = false;

                if(!doc.exists) {
                    this.setStatus("Could not find document. Perhaps it was deleted?", false);
                    return;
                }

                this.setStatus("Document has been successfully retrieved.", true);

                this.documents.push({
                    id: document.id,
                    payload: document.data(),
                    path: document.ref.path
                });
            },

            onDismissDocumentView: function(g) {
                this.documents = [];
            }
        }
    }
</script>

<style lang="scss">
    @import "../css/component/main";
</style>

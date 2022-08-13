<template>
    <section class="document-wrapper">
        <div @click="dissmiss" class="background-container"></div>
        <div class="content-container animate-fade-in-up">
            <div class="selection">
                <div>
                    <button @click="onExportToCSVButtonClick" class="button">Export to CSV</button>
                </div>
                <ul class="styled-default">
                    <li v-bind:class="{ selected: selectedIndex === index }"
                        v-for="(doc, index) in documents"
                        v-on:click="onItemClick(index)">
                        <span>{{ doc.id }}</span>
                    </li>
                </ul>
            </div>
            <div ref="view-container" class="view">
                <div>
                    <div class="document-options">
                        <button v-on:click="onDocumentCopyButtonClick()" class="button button-clear">Copy ID</button>
                        <button v-bind:disabled="submitted" v-on:click="updateCurrentDocumentOption(DocumentActionType.DUPE)" class="button button-clear">Duplicate</button>
                        <button v-bind:disabled="submitted" v-on:click="updateCurrentDocumentOption(DocumentActionType.DELETE)" class="button button-clear">Delete</button>
                    </div>
                    <div v-if="documentOptionModel === DocumentActionType.DUPE">

                        <label>Collection</label>
                        <input v-model="documentDuplicateCollectionModel" placeholder="Leave blank to use this document's parent collection" type="text" />

                        <label class="m-t-10">Document ID</label>
                        <input v-model="documentDuplicateIDModel" placeholder="Leave blank to use auto-generated ID" type="text" />

                        <div class="m-t-10">
                            <button v-bind:disabled="submitted" v-on:click="onSubmitDuplicateDocumentButtonClick()" class="button">Confirm</button>
                            <button v-bind:disabled="submitted" v-on:click="onCancelActionClick()" class="button button-clear">Cancel</button>
                        </div>
                    </div>

                    <div v-if="documentOptionModel === DocumentActionType.DELETE">
                        <p class="text-error">
                            Are you sure you want to delete this document? This cannot be undone; perhaps consider moving it into a separate collection?
                        </p>
                        <div class="m-t-10">
                            <button v-bind:disabled="submitted" v-on:click="onSubmitDeleteDocumentButtonClick()" class="button">Yes</button>
                            <button v-on:click="onCancelActionClick()" class="button">No</button>
                        </div>
                    </div>
                </div>
                <VJsoneditor @error="onEditorModelError" :plus="false" v-model="documentEditPayloadCopy" />
                <div v-if="!documentEditModelValid">
                    <small class="text-error">There's an error in the JSON structure. Correct it, or click 'Revert' to return to the previously valid state.</small>
                </div>
                <div class="m-t-10">
                    <button v-bind:disabled="submitted || !documentEditModelValid" v-on:click="onSubmitEditedDocumentButtonClick()" class="button">Save</button>
                    <button v-bind:disabled="submitted" v-on:click="resetEditorModel()" class="button button-clear">Revert</button>
                </div>
            </div>
        </div>
    </section>
</template>

<script lang="ts">

    import fileCopyIcon from "img/file-copy.svg";
    import {DocumentActionType} from "util/types";
    import { clipboard } from "electron"
    import VJsoneditor from "v-jsoneditor";
    import { ipcRenderer } from "electron";
    import FirebaseSQL from "../util/FirebaseSQL";

    export default {
        name: "DocumentView",
        props: {
            documents: Array,
            firebase: Object
        },
        inject: ['updateStatusMessage'],
        components: {
            VJsoneditor
        },
        data: function() {
            return {
                fileCopyIcon,
                selectedIndex: 0,
                DocumentActionType: DocumentActionType,
                documentOptionModel: null,
                documentDuplicateCollectionModel: "",
                documentDuplicateIDModel: "",
                documentEditPayloadCopy: {},
                documentEditModelValid: true,
                submitted: false,
            }
        },
        watch: {
            documents: function(newVal, oldVal) {
                this.selectedIndex = 0;
                this.onItemClick(this.selectedIndex);
            },
            documentEditPayloadCopy: function() {
                this.documentEditModelValid = true;
            }
        },

        mounted: function() {
            this.resetEditorModel();
        },

        methods: {

            dissmiss: function() {
                this.$emit("dismissDocumentView")
            },

            onItemClick: function(index) {
                this.selectedIndex = index;
                this.resetEditorModel();
                this.$refs['view-container'].scrollTo({ top: 0, behavior: 'smooth' });
            },

            resetEditorModel: function() {

                // A deep copy may be better
                this.documentEditPayloadCopy = JSON.parse(JSON.stringify(this.documents[this.selectedIndex].payload));
            },

            onEditorModelError: function(e, a) {
                this.documentEditModelValid = false;
            },

            onDocumentCopyButtonClick: function() {
                clipboard.writeText(this.documents[this.selectedIndex].id);
            },

            onExportToCSVButtonClick: async function() {
                const result = await remote.dialog.showSaveDialog({
                    filters: [ { name: "CSV", extensions: ["csv"] } ]
                });
                const file = await ipcRenderer.invoke("createCSVFileFromObjects", result.filePath, this.documents.map(document => { return document.payload }));
                this.updateStatusMessage(`Exported results to "${file}"`, true)
            },

            onSubmitDuplicateDocumentButtonClick: async function() {

                const currentSelectedDocument = this.documents[this.selectedIndex];

                const collection = this.documentDuplicateCollectionModel.length
                    ? this.documentDuplicateCollectionModel
                    : currentSelectedDocument.path.substring(0, currentSelectedDocument.path.lastIndexOf("/"));

                const collectionReference = this.firebase.firestore().collection(collection);

                try {
                    await FirebaseSQL(`DUPLICATE ${this.documents[this.selectedIndex].id} INTO ${collection}`, this.firebase.firestore());

                    this.updateStatusMessage(`Document '${currentSelectedDocument.path}' has been duplicated to '${collectionReference.path}`, true);
                } catch (e) {
                    this.updateStatusMessage(`Error: ${e.message}`, false);
                } finally {
                    this.documentOptionModel = "";
                    this.documentDuplicateCollectionModel = "";
                    this.documentDuplicateIDModel = "";
                    this.submitted = false;
                }
            },

            updateCurrentDocumentOption: function(option) {
                this.documentOptionModel = option;
            },

            onSubmitEditedDocumentButtonClick: async function() {

                const t = (tree: object) => {
                    for(const key in tree) {
                        const v = tree[key];


                    }
                };

                const { path } = this.documents[this.selectedIndex];

                const doc = this.firebase.firestore().doc(path);

                await doc.set(this.documentEditPayloadCopy);

                // TODO Mutate?
                this.documents[this.selectedIndex].payload = this.documentEditPayloadCopy;
            },

            onSubmitDeleteDocumentButtonClick: async function() {
                const { path } = this.documents[this.selectedIndex];

                try {
                    await this.firebase.firestore().doc(path).delete();
                    this.updateStatusMessage(`Document '${path}' has successfully been deleted.`, true)
                } catch (e) {
                    this.updateStatusMessage(`An error occurred while trying to delete document: ${e.message}`, false);
                    return;
                }

                this.$emit("dismissDocumentView");
            },

            onCancelActionClick: function() {
                this.documentOptionModel = null;
            }
        }
    }
</script>

<style lang="scss">
    @import "../css/component/document_view";
</style>

<template>
  <div ref="parent" @click="dismiss($event)" class="bg-black/70 absolute w-full h-full flex justify-center items-center">
    <div class="backdrop-blur-sm bg-slate-900/20 w-5/6 h-5/6 p-3 flex border-solid border border-gray-800">
      <section class="flex flex-col w-64">
        <h3 class="text-white text-center mb-3">
          {{ documents.length }} doc(s)
        </h3>
        <div class="flex-1 overflow-auto h-full mb-5">
          <ul>
            <li class="mb-2 cursor-pointer flex justify-between" :class="{ selected: selectedIndex === index }"
                v-for="(doc, index) in documents">
            <button v-on:click="onItemClick(index)" class="text-left overflow-hidden whitespace-nowrap overflow-ellipsis flex-1" :class="{
              'text-green-500': selectedIndex === index,
              'text-white': selectedIndex !== index,
              'hover:text-green-200': selectedIndex !== index
            }">{{ doc.id }}</button>
              <button>
                <SvgIcon :class="{ 'fill-sky-500':
                   documentsWithSubcollections[doc.id] !== undefined
                  && documentsWithSubcollections[doc.id].status === 'DONE'
                  && documentsWithSubcollections[doc.id].collections.length,
                  'fill-orange-500': documentsWithSubcollections[doc.id] !== undefined
                  && documentsWithSubcollections[doc.id].status === 'LOADING'}" icon="layers"/>
              </button>
            </li>
          </ul>
        </div>
        <div>
          <button v-on:click="onExportToCSVButtonClick" class="button block w-full">Export CSV</button>
        </div>
      </section>
      <section class="pl-10 flex flex-col flex-1 relative">
        <div class="flex-1" ref="editorRef"></div>
        <div class="mt-3">
          <input readonly type="text" class="input w-full text-sm text-gray-400 border-b-[1px] bg-transparent pl-2" :value="documents[selectedIndex] ? documents[selectedIndex].path : ''" />
        </div>
        <div v-if="documentOptionModel !== null" class="absolute w-full h-full bg-gray-900/80 z-10 flex justify-center items-center">
          <div class="w-2/3 bg-black p-5 border-[1px] border-gray-700 border-dotted">
            <template v-if="documentOptionModel === DocumentActionType.DELETE">
              <h2 class="text-stone-100 text-center">Are you sure you want to delete this document? This cannot be undone!</h2>
              <div class="flex mt-4">
                <button v-on:click="documentOptionModel = null" class="button flex-1 mr-10">Cancel</button>
                <button v-on:click="onSubmitDeleteDocumentButtonClick" class="button red solid flex-1">Delete</button>
              </div>
            </template>
            <template v-else-if="documentOptionModel === DocumentActionType.DUPE">
              <form ref="duplicateFormRef">
                <label>
                  <span class="text-white">Document ID</span>
                  <input name="document_id" class="p-2 block w-full mb-4 mt-2 input text-sm" aria-label="Leave empty to generate ID" placeholder="Leave empty to generate ID" maxlength="30" type="text">
                </label>
                <label>
                  <span class="text-white">Collection path</span>
                  <input name="collection_id" class="p-2 block w-full mb-4 mt-2 input text-sm" aria-label="Leave empty to use document collection" placeholder="Leave empty to use document collection" maxlength="30" type="text">
                </label>
              </form>
              <div class="flex mt-4">
                <button v-on:click="documentOptionModel = null" class="button flex-1 mr-10">Cancel</button>
                <button v-on:click="onSubmitDuplicateDocumentButtonClick" class="button red solid flex-1">Duplicate</button>
              </div>
            </template>
          </div>
        </div>
        <div class="flex justify-around mt-5">
          <Vue3Popper arrow hover placement="top" content="Copy document ID">
            <button v-on:click="onDocumentCopyIdButtonClick()">
              <SvgIcon class="hover:fill-sky-400" icon="copy"></SvgIcon>
            </button>
          </Vue3Popper>
          <Vue3Popper arrow hover placement="top" content="Duplicate document">
          <button v-bind:disabled="submitted" v-on:click="documentOptionModel = DocumentActionType.DUPE">
            <SvgIcon class="hover:fill-violet-500" icon="duplicate"></SvgIcon>
          </button>
          </Vue3Popper>
          <Vue3Popper arrow hover placement="top" content="Delete document">
            <button v-bind:disabled="submitted" v-on:click="documentOptionModel = DocumentActionType.DELETE">
              <SvgIcon class="hover:fill-orange-500" icon="delete"></SvgIcon>
            </button>
          </Vue3Popper>
          <div class="w-1 border-l-[1px] border-solid border-l-gray-700" />
          <Vue3Popper arrow hover placement="top" content="Revert changes">
            <button v-bind:disabled="submitted" v-on:click="resetEditorModel()">
              <SvgIcon class="hover:fill-blue-500" icon="revert"></SvgIcon>
            </button>
          </Vue3Popper>
          <Vue3Popper arrow hover placement="top" content="Save">
            <button v-bind:disabled="submitted || !documentEditModelValid" v-on:click="onSubmitEditedDocumentButtonClick()">
              <SvgIcon :class="{ 'fill-green-500 hover:fill-green-700': documentEditModelValid, 'fill-red-500 hover:fill-red-700': !documentEditModelValid }" icon="save"></SvgIcon>
            </button>
          </Vue3Popper>
        </div>
      </section>
    </div>
  </div>
</template>

<script lang="ts">
import {DocumentActionType} from "../../util/types";
import {clipboard, ipcRenderer} from "electron"
import SvgIcon from "./SvgIcon.vue";
import FirebaseSQL from "../../util/FirebaseSQL";
import JsonEditor from "jsoneditor";
import Vue3Popper from "vue3-popper";
import { toRaw } from "vue";

let jsonEditorInstance: JsonEditor;

    export default {
        name: "DocumentView",
        props: {
            documents: Array,
            firebaseInstanceId: String
        },
        inject: ['updateStatusMessage'],
        components: {
          SvgIcon,
          Vue3Popper
        },
        data: function() {
            return {
                documentsWithSubcollections: {},
                selectedIndex: -1,
                DocumentActionType: DocumentActionType,
                documentOptionModel: null,
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
          jsonEditorInstance = new JsonEditor(this.$refs['editorRef'],
              {
                mode: 'code',
                onValidationError: errors => {
                  this.documentEditModelValid = errors.length === 0;
                }
              });

          this.onItemClick(0);
        },

        methods: {

            loadSubcollections: async function(documentPath) {

              const splitPath = documentPath.split("/");
              const documentId = splitPath[splitPath.length - 1];

              if(this.documentsWithSubcollections[documentId] === undefined) {
                const documentSubCollection = this.documentsWithSubcollections[documentId] = {
                  status: "LOADING",
                  collections: []
                };

                try {
                  const results = await ipcRenderer.invoke("getDocumentSubCollections", this.$props.firebaseInstanceId, documentPath);
                  documentSubCollection.status = "DONE";
                  documentSubCollection.collections = results;
                } catch (e) {
                  documentSubCollection.status = "ERROR";
                }

                this.$forceUpdate();
              }
            },

            dismiss: function(event) {
              const { target } = event;
              if(target === this.$refs.parent) {
                this.$emit("dismissDocumentView")
              }
            },

            onItemClick: function(index) {
              this.selectedIndex = index;
              const { payload, path } = this.documents[index];
              // TODO Deep copy?
              this.documentEditPayloadCopy = JSON.parse(JSON.stringify(payload));
              jsonEditorInstance.set(payload);

              // TODO Limit?
              this.loadSubcollections(path);
            },

            resetEditorModel: function() {
                jsonEditorInstance.set(this.documentEditPayloadCopy);
            },

            onDocumentCopyIdButtonClick: function() {
                clipboard.writeText(this.documents[this.selectedIndex].id);
            },

            onExportToCSVButtonClick: async function() {
                const { filePath } = await ipcRenderer.invoke("showSaveDialog",{
                    filters: [ { name: "CSV", extensions: ["csv"] } ]
                });
                const file = await ipcRenderer.invoke("createCSVFileFromObjects", filePath, this.documents.map(document => toRaw(document.payload)));
                this.updateStatusMessage(`Exported results to "${file}"`, true)
            },

            onSubmitDuplicateDocumentButtonClick: async function() {

                const currentSelectedDocument = this.documents[this.selectedIndex];

              const { path, id } = currentSelectedDocument;
              const lastIndexOf = path.lastIndexOf("/");
              const collection = path.substring(0, lastIndexOf);

                try {

                  this.$emit("querySubmit", `DUPLICATE ${id} INTO ${collection}`);
                  this.documentOptionModel = null;
                  this.submitted = false;
                } catch (e) {
                    console.error(e);
                }
            },

            updateCurrentDocumentOption: function(option) {
                this.documentOptionModel = option;
            },

            onSubmitEditedDocumentButtonClick: async function() {
              const { path } = this.documents[this.selectedIndex];
              const lastIndexOf = path.lastIndexOf("/");
              const collection = path.substring(0, lastIndexOf);
              const documentId = path.substring(lastIndexOf + 1);
              this.$emit("querySubmit", `UPDATE ${collection} SET ${JSON.stringify(jsonEditorInstance.get())} OVERWRITE WHERE DOCID = "${documentId}"`);
            },

            onSubmitDeleteDocumentButtonClick: async function() {
              const { path } = this.documents[this.selectedIndex];
              const lastIndexOf = path.lastIndexOf("/");
              const collection = path.substring(0, lastIndexOf);
              const documentId = path.substring(lastIndexOf + 1);

              this.$emit("querySubmit", `DELETE FROM ${collection} WHERE DOCID = "${documentId}"`);
              this.documentOptionModel = null;
            },

            onCancelActionClick: function() {
                this.documentOptionModel = null;
            }
        }
    }
</script>

<style lang="scss">
@import "jsoneditor/dist/jsoneditor.css";
/* dark styling of the editor */
div.jsoneditor,
div.jsoneditor-menu {
  border-color: #4b4b4b;
}
div.jsoneditor-menu {
  background-color: #4b4b4b;
}
div.jsoneditor-tree,
div.jsoneditor textarea.jsoneditor-text {
  background-color: #666666;
  color: #ffffff;
}
div.jsoneditor-field,
div.jsoneditor-value {
  color: #ffffff;
}
table.jsoneditor-search div.jsoneditor-frame {
  background: #808080;
}

tr.jsoneditor-highlight,
tr.jsoneditor-selected {
  background-color: #808080;
}

div.jsoneditor-field[contenteditable=true]:focus,
div.jsoneditor-field[contenteditable=true]:hover,
div.jsoneditor-value[contenteditable=true]:focus,
div.jsoneditor-value[contenteditable=true]:hover,
div.jsoneditor-field.jsoneditor-highlight,
div.jsoneditor-value.jsoneditor-highlight {
  background-color: #808080;
  border-color: #808080;
}

div.jsoneditor-field.highlight-active,
div.jsoneditor-field.highlight-active:focus,
div.jsoneditor-field.highlight-active:hover,
div.jsoneditor-value.highlight-active,
div.jsoneditor-value.highlight-active:focus,
div.jsoneditor-value.highlight-active:hover {
  background-color: #b1b1b1;
  border-color: #b1b1b1;
}

div.jsoneditor-tree button:focus {
  background-color: #868686;
}

/* coloring of JSON in tree mode */
div.jsoneditor-readonly {
  color: #acacac;
}
div.jsoneditor td.jsoneditor-separator {
  color: #acacac;
}
div.jsoneditor-value.jsoneditor-string {
  color: #00ff88;
}
div.jsoneditor-value.jsoneditor-object,
div.jsoneditor-value.jsoneditor-array {
  color: #bababa;
}
div.jsoneditor-value.jsoneditor-number {
  color: #ff4040;
}
div.jsoneditor-value.jsoneditor-boolean {
  color: #ff8048;
}
div.jsoneditor-value.jsoneditor-null {
  color: #49a7fc;
}
div.jsoneditor-value.jsoneditor-invalid {
  color: white;
}
</style>

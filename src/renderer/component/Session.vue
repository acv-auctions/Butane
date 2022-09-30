<template>
    <div class="w-96 h-64 flex flex-col justify-between">
        <template v-if="currentView === SessionViewType.SAVED">
            <table v-if="previousSessions.length">
                <tbody>
                <tr class="p-4 pl-8" v-for="(session, index) in previousSessions">
                    <td class="pr-2">
                        <button v-on:click="onSessionConfirmClick(index)" class="hover:bg-gray-800 p-1 text-left block w-full">
                          <div class="text-white">{{ session.label }}</div>
                          <small class="text-white">{{ getFileNameFromPath(session.credential_path) }}</small>
                        </button>
                    </td>
                    <td >
                        <button v-on:click="onSessionDeleteClick(index)" class="button red small block">
                            DELETE
                        </button>
                    </td>
                </tr>
                </tbody>
            </table>
          <div v-else class="text-center text-white p-3">You have no saved sessions.</div>
        </template>
        <template v-if="currentView === SessionViewType.NEW">
            <h2 class="text-white">Create new session</h2>
            <form>
              <input class="p-2 block w-full mb-4 input" aria-label="Session label" placeholder="Session label" v-model="form.sessionLabel" maxlength="30" type="text">
              <input class="p-2 block w-full input border-dotted border-2 bg-transparent cursor-pointer" ref="folderSelectorInput" aria-label="Browse to file" v-model="form.credentialFilePath" v-on:focus="openFolderSelectorDialog()" placeholder="Browse to file" type="text">
            </form>
        </template>

      <button v-if="currentView === SessionViewType.SAVED"
              v-on:click="switchView(SessionViewType.NEW)"
              class="button blue">Create New Session</button>

      <div v-if="currentView === SessionViewType.NEW" class="flex justify-between">
        <button
            v-bind:disabled="folderSelectionDialogOpen"
            v-on:click="switchView(SessionViewType.SAVED)"
            class="button red">Cancel</button>
        <button
            v-bind:disabled="!form.credentialFilePath || !form.sessionLabel"
            v-on:click="onSaveSessionButtonClick()"
            v-bind:class="{ gray: !form.credentialFilePath || !form.sessionLabel, blue: form.credentialFilePath && form.sessionLabel }"
            class="button">Save</button>
      </div>

    </div>
</template>

<script type="ts">
    import { SessionViewType } from "../../util/types";
    import Path from "path";
    import { ipcRenderer } from "electron";

    export default {
        name: "Session",
        data: function() {
            return {
                folderSelectionDialogOpen: false,
                SessionViewType: SessionViewType,
                currentView: SessionViewType.SAVED,
                previousSessions: [],
                form: {
                    credentialFilePath: "",
                    sessionLabel: ""
                }
            }
        },
        mounted: function() {
            this.reloadSessions();
        },
        methods: {

            reloadSessions: function() {
                let sessions = window.localStorage.getItem("sessions");

                if(sessions) {
                    this.previousSessions = JSON.parse(sessions);
                }
            },

            getFileNameFromPath: function(path) {
                return Path.basename(path);
            },

            resetFormModels: function() {
                this.form.credentialFilePath = "";
                this.form.sessionLabel = "";
            },

            switchView: function(view) {
                this.currentView = view;
                this.resetFormModels();
                this.$emit("viewChange");
            },

            onSaveSessionButtonClick: function() {

                let sessions = [];

                const savedSessions = window.localStorage.getItem("sessions");

                if(savedSessions) {
                    sessions = JSON.parse(savedSessions);
                }

                sessions.push({
                    credential_path: this.form.credentialFilePath,
                    label: this.form.sessionLabel
                });

                window.localStorage.setItem("sessions", JSON.stringify(sessions));

                this.reloadSessions();

                this.switchView(SessionViewType.SAVED)
            },

            openFolderSelectorDialog: async function() {

                this.folderSelectionDialogOpen = true;
                this.$refs['folderSelectorInput'].blur();

                const { filePaths } = await ipcRenderer.invoke("openDialog", {
                  properties: [ "openFile" ],
                  filters: [{ name: 'Firebase service account', extensions: ['json'] }]
                });

                this.folderSelectionDialogOpen = false;

                if(!filePaths.length) {
                  return;
                }

                this.form.credentialFilePath = filePaths[0];
            },

            onSessionConfirmClick: function(index) {
                let savedSessions = window.localStorage.getItem("sessions");
                savedSessions = JSON.parse(savedSessions);

                const { credential_path, label } = savedSessions[index];

                this.$emit("sessionChosen", credential_path, label);
            },

            onSessionDeleteClick: function(index) {
                let savedSessions = window.localStorage.getItem("sessions");
                savedSessions = JSON.parse(savedSessions);

                savedSessions.splice(index, 1);

                window.localStorage.setItem("sessions", JSON.stringify(savedSessions));

                this.reloadSessions();
            }

        }
    }
</script>

<style lang="scss">
.session-container {
  width: 400px;
  min-height: 300px;
  border: 1px solid #d2d2d2;
  padding: 1em;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  .session-table-container {
    max-height: 350px;
    overflow: auto;

    td:last-child {
      min-width: 200px;
    }
  }

  .create-session-button-container {
    display: flex;
    justify-content: space-between;
  }
}
</style>

<template>
    <div class="session-container">
        <div class="session-table-container" v-if="currentView === SessionViewType.SAVED">
            <table v-if="previousSessions.length">
                <tbody>
                <tr v-for="(session, index) in previousSessions">
                    <td>
                        <div>{{ session.label }}</div>
                        <small>{{ getFileNameFromPath(session.credential_path) }}</small>
                    </td>
                    <td class="text-right">
                        <button v-on:click="onSessionConfirmClick(index)" class="button-small m-r-10">
                            SELECT
                        </button>
                        <button v-on:click="onSessionDeleteClick(index)" class="button-small button-error m-r-10">
                            DELETE
                        </button>
                    </td>
                </tr>
                </tbody>
            </table>

          <div v-if="!previousSessions.length" class="terminal-alert">You have no saved sessions.</div>
        </div>
        <div v-if="currentView === SessionViewType.NEW">
            <h3>Create new session</h3>
            <form>
                <div class="form-group">
                  <label>
                    Session label
                    <input placeholder="Enter a name" v-model="form.sessionLabel" maxlength="30" type="text">
                  </label>
                </div>
                <div class="form-group">
                  <label>
                    Service account key
                    <input ref="folderSelectorInput" v-model="form.credentialFilePath" v-on:focus="openFolderSelectorDialog()" placeholder="Browse to file" type="text">
                  </label>
                </div>
            </form>
        </div>

      <div>
        <button v-if="currentView === SessionViewType.SAVED" v-on:click="switchView(SessionViewType.NEW)" class="btn btn-block btn-primary">Create New Session</button>
        <div v-if="currentView === SessionViewType.NEW" class="create-session-button-container">
          <button
                  v-bind:disabled="folderSelectionDialogOpen"
                  v-on:click="switchView(SessionViewType.SAVED)"
                  class="btn btn-error">Cancel</button>
          <button
                  v-bind:disabled="!form.credentialFilePath || !form.sessionLabel"
                  v-on:click="onSaveSessionButtonClick()"
                  class="btn btn-primary">Save</button>
        </div>
      </div>

    </div>
</template>

<script type="ts">
    import { SessionViewType } from "util/types";
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
    @import "../css/component/session.scss";
</style>

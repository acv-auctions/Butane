<template>
    <div class="session-container">
        <div class="action-bar">
            <button v-if="currentView === SessionViewType.SAVED" v-on:click="switchView(SessionViewType.NEW)" class="button">Create New Session</button>
            <button v-if="currentView === SessionViewType.NEW"
                    v-bind:disabled="folderSelectionDialogOpen"
                    v-on:click="switchView(SessionViewType.SAVED)"
                    class="button button-outline">Cancel</button>
            <button v-if="currentView === SessionViewType.NEW"
                    v-bind:disabled="!form.credentialFilePath || !form.sessionLabel"
                    v-on:click="onSaveSessionButtonClick()"
                    class="button">Save</button>
        </div>
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
            <h5 v-if="!previousSessions.length">You have no previous sessions.</h5>
        </div>
        <div class="m-t-10" v-if="currentView === SessionViewType.NEW">
            <form>
                <label>Session Label</label>
                <input class="m-b-10" v-model="form.sessionLabel" maxlength="30" type="text">
                <label>Credential File Path</label>
                <input ref="folderSelectorInput" v-model="form.credentialFilePath" v-on:focus="openFolderSelectorDialog()" placeholder="Click to browse" type="text">
            </form>
        </div>

    </div>
</template>

<script>
    import { SessionViewType } from "util/types";
    import { remote } from "electron";

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
                return remote.require("path").basename(path);
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

            openFolderSelectorDialog: function() {

                this.folderSelectionDialogOpen = true;
                this.$refs['folderSelectorInput'].blur();

                remote.dialog.showOpenDialog(null, {
                    properties: [ "openFile" ]
                }, paths => {

                    this.folderSelectionDialogOpen = false;

                    if(!paths) {
                        return;
                    }

                    this.form.credentialFilePath = paths[0];
                })
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
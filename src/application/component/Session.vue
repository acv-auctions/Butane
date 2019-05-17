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
        <div v-if="currentView === SessionViewType.SAVED">
            <ul class="styled" v-if="previousSessions.length">
                <li v-for="(session, index) in previousSessions" v-on:click="onSessionClick(index)">
                    <div>{{ session.label }}</div>
                    <small>{{ getFileNameFromPath(session.credential_path) }}</small>
                </li>
            </ul>
            <h5 v-if="!previousSessions.length">You have no previous sessions.</h5>
        </div>
        <div v-if="currentView === SessionViewType.NEW">
            <form>
                <label>Session Label</label>
                <input v-model="form.sessionLabel" type="text">
                <label>Credential File Path</label>
                <input ref="folderSelectorInput" v-model="form.credentialFilePath" v-on:focus="openFolderSelectorDialog()" placeholder="Click to browse" type="text">
            </form>
        </div>
    </div>
</template>

<script>
    import { SessionViewType } from "../util/types";
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
            let sessions = window.localStorage.getItem("sessions");

            if(sessions) {
                this.previousSessions = JSON.parse(sessions);
            }
        },
        methods: {

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

            onSessionClick: function(index) {
                let savedSessions = window.localStorage.getItem("sessions");
                savedSessions = JSON.parse(savedSessions);

                const { credential_path, label } = savedSessions[index];

                this.$emit("sessionChosen", credential_path, label);
            }

        }
    }
</script>

<style lang="scss">
    @import "../css/component/session.scss";
</style>
<template>
    <div class="tabs-container">
        <div class="tab-bar">
            <div class="tab" v-bind:class="{ active: index === currentTabIndex }" v-for="(instance, index) of fireInstance">
                <div v-on:click="onTabClick(index)" class="click-container"></div>
                <small>{{ instance ? instance.name : "New Tab" }}</small>
                <div v-on:click="onTabCloseClick(index)" class="close">
                    <img width="15" src="../img/close-white.png"/>
                </div>
            </div>
            <div v-on:click="onAddTabClick()" class="add-tab">
                <img src="../img/add-white.png"/>
            </div>
        </div>

        <div class="tab-content" v-for="(instance, index) of fireInstance" v-bind:class="{ 'd-none': index !== currentTabIndex }">
            <h5 class="error text-center" v-if="error">An error has occurred: {{error}}</h5>
            <session-choose @viewChange="onSessionViewChange" @sessionChosen="onSessionChosen" v-if="!instance"></session-choose>
            <main-view v-if="instance" v-bind:firebase="instance" />
        </div>
    </div>
</template>

<script lang="ts">
    import Main from "component/Main";
    import Session from "component/Session";
    import { ipcRenderer } from "electron";

    export default {
        name: "Tabs",
        components: {
            "main-view": Main,
            "session-choose": Session
        },
        data: function() {
            return {
                fireInstance: [ null ],
                currentTabIndex: 0,
                error: null
            }
        },
        methods: {

            onSessionViewChange: function() {
                this.error = null;
            },

            onSessionChosen: async function(path, label) {

                this.error = null;

                try {
                  this.fireInstance[this.currentTabIndex] = await ipcRenderer.invoke("createFirebaseInstance", path, `${label}_${this.currentTabIndex}`);
                } catch (e) {
                    this.error = e.message;
                    return;
                }

                this.$forceUpdate();
            },

            onAddTabClick: function() {
                this.fireInstance.push(null);
                this.currentTabIndex = this.fireInstance.length - 1;
            },

            onTabClick: function(index) {
                this.currentTabIndex = index;
            },

            onTabCloseClick: function(index) {

                if(this.fireInstance[index]) {
                    ipcRenderer.invoke("deleteFirebaseInstance", this.fireInstance[index].name);
                }

                this.fireInstance.splice(index, 1);

                if(!this.fireInstance.length) {
                    this.fireInstance.push(null);
                    this.currentTabIndex = 0;
                } else if(this.currentTabIndex === index) {
                    this.currentTabIndex = index - 1;
                } else if(index < this.currentTabIndex) {
                    this.currentTabIndex = this.currentTabIndex - 1;
                }
            }
        }
    }
</script>

<style lang="scss">
    @import "../css/component/tabs";
</style>

<template>
    <div class="tabs-container">
        <div class="tab-bar">
            <div class="tab" v-for="(instance, index) of fireInstance">
                <small>{{ instance ? instance.name : "New Tab" }}</small>
            </div>
        </div>

        <div class="tab-content" v-for="(instance, index) of fireInstance" v-bind:class="{ 'd-none': index !== currentTabIndex }">
            <h5 class="error" v-if="error">An error has occurred: {{error}}</h5>
            <session-choose @sessionChosen="onSessionChosen" v-if="!instance"></session-choose>
            <main-view v-if="instance" v-bind:firebase="instance" />
        </div>
    </div>
</template>

<script>
    import Main from "./Main.vue";
    import Session from "./Session";
    import { remote } from "electron";

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

            onSessionChosen: async function(path, label) {

                this.error = null;

                try {
                    this.fireInstance[this.currentTabIndex] = await remote.getGlobal("createFirebaseInstance")(path, `${label}_${this.currentTabIndex}`);
                } catch (e) {
                    this.error = e.message;
                    return;
                }

                this.$forceUpdate();
            }
        }
    }
</script>

<style lang="scss">
    @import "../css/component/tabs";
</style>
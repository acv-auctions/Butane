<template>
    <div class="terminal-container">
        <textarea ref="termtext" v-bind:disabled="isDisabled" v-on:keypress="onTextAreaKeyPress" v-model="queryModel"></textarea>
        <button v-bind:disabled="isDisabled" v-on:click="submitQuery" class="button">
            {{ isDisabled ? "Loading" : "Submit" }}
        </button>
    </div>
</template>

<script lang="ts">
    export default {
        name: "termInput",
        props: [ "isDisabled" ],
        data: () => {
            return {
                queryModel: ""
            }
        },
        watch: {
            "isDisabled": function(oldVal, newVal) {
                if(newVal) {
                    // Prop changes occur before the view has re-rendered. In this case, set a timeout.
                    window.setTimeout(() => {
                        this.$refs["termtext"].focus();
                    }, 100);
                }
            }
        },
        methods: {

            submitQuery: function() {

                if(this.isDisabled) {
                    return;
                }

                this.$emit("querySubmit", this.queryModel);
            },

            onTextAreaKeyPress: function(e) {
                const { keyCode } = e;

                if(keyCode === 13) {
                    e.preventDefault();
                    this.submitQuery();
                }
            }

        }
    }
</script>

<style lang="scss">
    @import "../css/component/terminal";
</style>
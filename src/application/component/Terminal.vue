<template>
    <div class="terminal-container">
        <textarea v-on:keypress="onTextAreaKeyPress" v-model="queryModel"></textarea>
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
<template>
    <div class="terminal-container">
        <textarea v-on:keypress="onTextAreaKeyPress" v-model="queryModel"></textarea>
        <button class="button">Submit</button>
    </div>
</template>

<script lang="ts">
    export default {
        name: "termInput",
        data: () => {
            return {
                queryModel: ""
            }
        },
        methods: {

            onTextAreaKeyPress: function(e) {
                const { keyCode } = e;

                if(keyCode === 13) {
                    e.preventDefault();
                    this.$emit("querySubmit", this.queryModel);
                }
            }

        }
    }
</script>

<style lang="scss">
    @import "../css/component/terminal";
</style>
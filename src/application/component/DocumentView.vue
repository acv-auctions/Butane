<template>
    <section class="document-wrapper">
        <div @click="dissmiss" class="background-container"></div>
        <div class="content-container animate-fade-in-up">
            <div class="selection">
                <ul class="styled">
                    <li v-bind:class="{ selected: selectedIndex === index }"
                        v-for="(doc, index) in documents"
                        v-on:click="onItemClick(index)">
                        {{ doc.id }}
                    </li>
                </ul>
            </div>
            <div ref="view-container" class="view">
                <table>
                    <tbody>
                    <tr v-for="key in Object.keys(documents[selectedIndex].payload).sort((a, b) =>  { return a.localeCompare(b) })">
                        <td>
                            <h4>{{key}}</h4>
                            <div v-html="renderObjectTree(key)"></div>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </section>
</template>

<script>
    export default {
        name: "DocumentView",
        props: ["documents"],
        data: function() {
            return {
                selectedIndex: 0
            }
        },
        methods: {

            dissmiss: function() {
                this.$emit("dismissDocumentView")
            },

            onItemClick: function(index) {
                this.selectedIndex = index;
            }
        }
    }
</script>

<style lang="scss">
    @import "../css/component/document_view";
</style>
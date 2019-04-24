<template>
    <section class="document-wrapper">
        <div @click="dissmiss" class="background-container"></div>
        <div class="content-container">
            <div class="selection">
                <ul class="styled">
                    <li v-for="(doc, index) in documents" v-on:click="onItemClick(index)">
                        {{ doc.id }}
                    </li>
                </ul>
            </div>
            <div class="view">
                <table>
                    <tbody>
                    <tr v-for="key in Object.keys(documents[selectedIndex].payload)">
                        <td>
                            <h4>{{key}}</h4>
                            <blockquote>
                                {{ documents[selectedIndex].payload[key] }}
                            </blockquote>
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
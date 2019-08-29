import Vue from "vue";
import Tabs from "component/Tabs";
import { shell } from "electron";

import "./css/index.scss";

new Vue({
    data: {},
    el: "#entry",
    render: h => h(Tabs),
    mounted: function() {

        // Open any valid links in external web browser
        this.$el.addEventListener("click", e => {
            const target = e.target as HTMLElement;

            if(target.tagName === "A") {
                e.preventDefault();

                try {
                    const url = new URL(target.getAttribute("href"));

                    shell.openExternal(url.toString());
                } catch (e) {
                    // Do nothing
                }
            }
        });
    }
});
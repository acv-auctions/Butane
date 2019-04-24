import Vue from "vue";
import App from "./component/App";
import { remote } from "electron";

import "./css/main.scss";

new Vue({
    data: {
        firebase: remote.getGlobal("firebaseApp")
    },
    el: "#entry",
    render: h => h(App)
});
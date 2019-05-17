import Vue from "vue";
import Tabs from "./component/Tabs";

import "./css/index.scss";

new Vue({
    data: {},
    el: "#entry",
    render: h => h(Tabs)
});
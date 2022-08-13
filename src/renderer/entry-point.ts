import { createApp } from "vue";
import Tabs from "component/Tabs";
import { shell } from "electron";

import "./css/index.scss";

const app = createApp(Tabs);

const el = document.querySelector("body");

el.addEventListener("click", e => {
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
})

app.mount(el);

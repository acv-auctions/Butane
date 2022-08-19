import { createApp } from "vue";
import MainWindow from "component/Window";
import { shell } from "electron";

import "css/index.scss";

const app = createApp(MainWindow);

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

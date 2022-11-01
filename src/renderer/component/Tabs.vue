<template>
  <div class="h-full">
    <div class="tab-bar bg-black border-b border-gray-900 border-solid flex">
      <div class="flex overflow-hidden flex-1 items-end pl-2">
        <button v-on:click="onTabClick(index)"
                :title="instance ? instance.label : 'New Tab'"
                class="pl-2 pr-2 mr-2 w-[300px] flex justify-between items-center h-5/6 rounded-tl-md rounded-tr-md relative"
                v-bind:class="{ 'bg-gray-900': index === currentTabIndex, 'bg-slate-700': index !== currentTabIndex }" v-for="(instance, index) of tabInstances">
          <small class="text-white max-w-[150px] mr-4 overflow-hidden whitespace-nowrap pointer-events-none">{{ instance ? instance.label : "New Tab" }}</small>
          <button class="z-10 hover:bg-red-700 bg-orange-800 w-[16px] h-[16px] text-center" v-on:click="onTabCloseClick(index)">
            <img alt="Close tab" src="../static/close-white.png"/>
          </button>
        </button>
        <button v-on:click="onAddTabClick()" class="shrink-0 h-5/6 bg-black rounded-tl-md rounded-tr-md flex items-center justify-center">
          <img alt="Add tab" width="18" src="../static/add-white.png"/>
        </button>
        <div class="dragger w-full h-full"></div>
      </div>
      <div>
        <button class="window-button">
          <img alt="Close tab" width="18" src="../static/close-white.png"/>
        </button>
        <button></button>
        <button></button>
      </div>
    </div>

    <div class="h-full" v-bind:class="{ 'hidden': tabInstances[currentTabIndex] }">
      <tab-scene :stopScene="tabInstances[currentTabIndex] != null" :typer-container-ref-name="'typewriter'" />
      <div class="h-full bg-gradient-to-t from-slate-900 to-black flex flex-col justify-center items-center">
        <div class="z-10 bg-black/60 p-5 border-4 border-solid border-slate-800">
          <h5 class="error text-center" v-if="error">An error has occurred: {{error}}</h5>
          <session-choose @viewChange="onSessionViewChange" @sessionChosen="onSessionChosen"></session-choose>
        </div>
        <div class="font-terminal mt-12 text-lg text-white w-96 h-32 bg-black/60 text-center py-2 z-10 pointer-events-none" ref="typewriter"></div>
      </div>
    </div>

    <template v-for="(_, index) of tabInstances">
      <div class="h-full" v-if="tabInstances[index]" v-bind:class="{ 'hidden': index !== currentTabIndex }">
        <main-view v-bind:firebaseInstanceId="tabInstances[index].id" />
      </div>
    </template>
  </div>
</template>

<script lang="ts">

import Main from "component/Main";
import Session from "component/Session";
import TabScene from "component/TabScene";
import { ipcRenderer } from "electron";

export default {
  name: "Tabs",
  components: {
    "main-view": Main,
    "session-choose": Session,
    "tab-scene": TabScene
  },
  data: function() {
    return {
      tabInstances: [null],
      currentTabIndex: 0,
      error: null
    }
  },
  methods: {

    onSessionViewChange: function() {
      this.error = null;
    },

    onSessionChosen: async function(path, label) {

      this.error = null;

      let generatedId = await ipcRenderer.invoke("createFirebaseInstance", path);

      try {
        this.tabInstances[this.currentTabIndex] = { id: generatedId, "label": `${label}_${generatedId}` };
        //this.tabInstances.push({ id: generatedId, "label": `${label}_${generatedId}` });
      } catch (e) {
        this.error = e.message;
        return;
      }

      this.$forceUpdate();
    },

    onAddTabClick: function() {
      this.tabInstances.push(null);
      this.currentTabIndex = this.tabInstances.length - 1;
    },

    onTabClick: function(index) {
      this.currentTabIndex = index;
    },

    onTabCloseClick: function(indexToDelete) {

      if(this.tabInstances[indexToDelete]) {
        ipcRenderer.invoke("deleteFirebaseInstance", this.tabInstances[indexToDelete].name);
      }

      if(this.tabInstances.length === 1 && indexToDelete === 0) {
        this.tabInstances[0] = null;
        return;
      }

      this.tabInstances.splice(indexToDelete, 1);
    }
  }
}
</script>

<style scoped lang="scss">

@import "../css/variables";

.tab-bar {
  height: $tab-bar-height;

  .dragger {
    -webkit-app-region: drag;
  }

  .window-button {
    height: 100%;
    width: 2.5em;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}
</style>

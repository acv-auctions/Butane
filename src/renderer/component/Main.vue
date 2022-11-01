<template>
  <div class="bg-gray-900 main">
    <div class="w-full z-10 node-graph" ref="nodeGraph"></div>
    <div class="background bg-gray-900 w-full absolute z-0 left-0"></div>
    <div v-if="documents.length" class="document-view-wrapper w-full absolute z-10 top-0 left-0">
      <document-view @querySubmit="onQuerySubmission"
                     :firebaseInstanceId="firebaseInstanceId"
                     :documents="documents"
                     @dismissDocumentView="onDismissDocumentView"></document-view>
    </div>
    <div class="action-history"></div>
    <section class="shell bg-zinc-900">
      <shell ref="shellRef" @querySubmit="onQuerySubmission" />
    </section>
  </div>
</template>

<script lang="ts">
import Terminal from "component/Terminal";
import {colorsFromTheme, hsv, rgb, rgbCss} from "@thi.ng/color";
import CollectionView from "component/CollectionView";
import DocumentView from "component/DocumentView";
import {ipcRenderer} from "electron";
import Cytoscape from "cytoscape/dist/cytoscape.esm.js";
import {FirestoreEntity} from "util/types";

interface State {
  documents: any;
  querySubmitted: boolean;
  status: {
    message: string,
    type: boolean | null
  }
}

let cytoscapeInstance;
let cytoscapeLayout;

const createNodeTemplate = (path: string,
                            type: FirestoreEntity,
                            posX: number,
                            posY: number,
                            isRoot: boolean = false,
                            parent: string = null) => {

  const colorRange = [
      ...colorsFromTheme([
          { range: "intense" }, { range: "dark", base: rgb(106, 42, 163), weight: 0.5 }, { range: "neutral" }
          ],
          { num: 5, variance: 5 }
      )];

  const truncateLabel = path.length > 10;

  const label = truncateLabel ? `${path.substring(0, 10)}...` : path;

  return {
    group: 'nodes',
    data: {
      id: path,
      label,
      background_gradient: `${rgbCss(colorRange[0])} ${rgbCss(colorRange[1])} ${rgbCss(colorRange[2])}`,
      root: isRoot,
      parent,
      type
    },
    position: { x: posX, y: posY },
    locked: true
  }
};

export default {
  name: "Main",
  components: {
    'document-view': DocumentView,
    'collection-view': CollectionView,
    'shell': Terminal
  },
  props: ["firebaseInstanceId"],
  mounted: async function() {
    cytoscapeInstance = new Cytoscape({
      container: this.$refs["nodeGraph"],
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            color: '#ffffff',
            'background-fill': 'linear-gradient',
            'background-gradient-stop-colors': 'data(background_gradient)',
            'background-gradient-direction': 'to-top-right',
            'font-family': 'Proggy Vector',
            'font-size': '12px'
          }
        }
      ],
      layout: {
        name: "preset"
      }
    });

    cytoscapeInstance.on('tap', async e => {
      const { target } = e;
      const { data } = target[0]._private;
      const { type, id } = data;
      switch (type) {
        case FirestoreEntity.COLLECTION:
          const nodeTemplates = (await this.onQuerySubmission(`SELECT * FROM ${id} LIMIT 5`)).map(document => {
            return createNodeTemplate(document.id, FirestoreEntity.DOCUMENT, 0, 0, false, id);
          });

          cytoscapeInstance.add(nodeTemplates);

          for(const node of cytoscapeInstance.nodes()) {
            const { _private } = node[0];
            if(_private.data.id !== id && _private.data.parent !== id) {
              node[0].remove();
            }
          }

          break;
          case FirestoreEntity.DOCUMENT:
            break;
      }
    });

    let rootCollectionPaths;

    try {
      rootCollectionPaths = await ipcRenderer.invoke("getRootFirestoreCollections", this.$props.firebaseInstanceId);
    } catch (e) {
      console.error(e);
      // TODO
    }

    const canvasWidth = cytoscapeInstance.width();

    let x = 50, y = 50;

    const nodes = [];

    for(const collectionPath of rootCollectionPaths) {

      nodes.push(createNodeTemplate(collectionPath, FirestoreEntity.COLLECTION, x, y, true));

      if(x + 100 > canvasWidth) {
        x = 50;
        y += 100;
      } else {
        x += 100;
      }
    }

    cytoscapeInstance.add(nodes);
  },
  data: function() {
    return {
      documents: [],
      firebaseInstanceId: this.$props.firebaseInstanceId,
      querySubmitted: false,
      status: {
        message: "",
        type: null
      }
    };
  },
  provide: function() {
    return {
      updateStatusMessage: this.setStatus
    }
  },
  methods: {

    setStatus: function(message: string, type: boolean = null) {
      this.status = {
        message,
        type
      }
    },

    onQuerySubmission: async function(query) {

      let docs;

      let hasError = false;
      this.querySubmitted = true;

      try {
        docs = await ipcRenderer.invoke("queryFirestore", this.$props.firebaseInstanceId, query);
        console.log(docs);
      } catch (e) {

        hasError = true;

        const { code } = e;

        if(code === 9) {
          const splitPoint = e.details.indexOf(":") + 1;
          const indexCreationLink = e.details.substr(splitPoint).trim();

          this.setStatus(`This query requires an index - <a href="${indexCreationLink}">click here to create it</a>.`, false);
        } else {
          this.setStatus(e.message, false);
        }

        console.error(e);
      } finally {
        this.querySubmitted = false;
      }

      if(hasError) {
        console.error(hasError);
        return;
      }

      if(this.documents.length) {
        this.$refs['shellRef'].reset();
      }

      if(!docs) {
        this.setStatus("Query executed successfully - no results found.", true);
        return;
      }

      this.setStatus("Query executed successfully.", true);

      this.documents = docs;
    },

    onCollectionItemClick: async function(document) {

      if(this.querySubmitted) {
        return;
      }

      this.setStatus("Fetching document...");

      this.querySubmitted = true;

      const doc = await this.firebase.firestore().doc(document.ref.path).get();

      this.querySubmitted = false;

      if(!doc.exists) {
        this.setStatus("Could not find document. Perhaps it was deleted?", false);
        return;
      }

      this.setStatus("Document has been successfully retrieved.", true);

      this.documents.push({
        id: document.id,
        payload: document.data(),
        path: document.ref.path
      });
    },

    onDismissDocumentView: function(g) {
      this.documents = [];
    }
  }
}
</script>

<style lang="scss">
@import "../css/variables";

.main {
  height: calc(100vh - #{$tab-bar-container-height});
}

.node-graph, .document-view-wrapper {
  height: calc(100% - #{$terminal-container-height});
}

.shell {
  height: $terminal-container-height;
}

.action-history {
  position: absolute;
  width: 100%;
  height: 100px;
  left: 0;
  bottom: $terminal-container-height;
}

.background {
  top: $tab-bar-height;
  height: calc(100% - #{$tab-bar-height});
  //background: url("../static/starfield.png");
  //background-size: 100% 100%;
  //filter: blur(3px);
}
</style>

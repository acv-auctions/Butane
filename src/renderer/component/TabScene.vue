<template>
  <div ref="stage" class="absolute overflow-hidden w-full stage">
    <div class="absolute h-full w-full pointer-events-none">
      <div class="absolute w-full h-3/6 glow"></div>
      <img class="absolute opacity-50 -top-96" src="../static/starfield.png"/>
      <template v-if="runScene">
        <div v-if="sceneToPlay === Scene.ROCKET" class="absolute h-[240vh] -bottom-[100vh] w-24 flex flex-col justify-end" :style="{ 'left': sceneParams.x + 'px' }">
          <div class="rocket-ship"></div>
          <div class="exhaust flex justify-around">
            <div class="flume"></div>
            <div class="flume"></div>
          </div>
        </div>
        <div v-else class="absolute h-full w-full">
          <template v-if="sceneToPlay === Scene.MARS">
            <div class="mars"></div>
          </template>
        </div>
      </template>
    </div>

    <button v-on:click="togglePlay()" class="absolute right-5 bottom-5">
      {{ play ? "Pause" : "Play" }}
    </button>
  </div>
</template>

<script lang="ts">
import {TabScene} from "../../util/types";
import Typewriter from "typewriter-effect/dist/core";

let tw: Typewriter;
let firstSceneTimeout: any;
let nextSceneTimeout: any;

const scenes = [
  {
    type: TabScene.ROCKET,
    html: "<span class='text-green-500'>INSERT</span> <span class='text-green-500'>INTO</span> space <br/> <span class='text-violet-300'>{ \"type\": \"shuttle\", \"name\": \"Discovery\", \"dest\": \"ISS\" }</span><span class='hidden'>;</span>"
  },
  {
    type: TabScene.MARS,
    html: "<span class='text-green-500'>UPDATE</span> planet/earth/moon <br/> <span class='text-green-500'>SET</span> <span class='text-violet-300'>DOCID(planet/earth/mars)</span><span class='hidden'>;</span>"
  },
].map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);

export default {
  name: "TabScene",
  props: ["typerContainerRefName", "stopScene"],
  watch: {
    stopScene: function(oldVal, newVal) {
      // TODO Probably not needed...
      if(oldVal !== newVal) {
        this.togglePlay();
      }
    }
  },
  mounted() {
    tw = new Typewriter(this.$parent.$refs[this.typerContainerRefName], {
      delay: 30,
      onCreateTextNode: (character) => {
        if(character === ";" && this.play) {
          nextSceneTimeout = setTimeout(() => {
            let duration, scene;

            switch (this.sceneToPlay) {
              case TabScene.ROCKET:
                duration = getComputedStyle(document.body).getPropertyValue("--scene-rocket-duration");
                break;
              case TabScene.MARS:
                duration = getComputedStyle(document.body).getPropertyValue("--scene-mars-duration");
                break;
            }

            const parsedDuration = parseFloat(duration.split("s")[0]);

            this.runScene = true;

            nextSceneTimeout = setTimeout(() => {
              this.runScene = false;
              this.setupNextScene();
            }, parsedDuration * 1000);
          }, 500);
        }

        return document.createTextNode(character);
      },
    });

    tw.typeString("<span class='text-green-500'>Welcome to</span> <span class='text-blue-200'>Butane</span><br/>")
        .pauseFor(1500)
        .typeString("A <span class='text-orange-300'>Firebase Firestore</span> query utility")
        .start();

    firstSceneTimeout = setTimeout(() => {
      this.setupNextScene();
    }, 5000);
  },
  data: function() {
    return {
      Scene: TabScene,
      sceneToPlay: null,
      runScene: false,
      sceneParams: {},
      play: true,
      sceneIndex: 0
    }
  },
  methods: {
    stopTyper: function() {
      tw.stop();
      tw.state.eventQueue = [];
    },
    clearTyperContainer: function() {
      this.$parent.$refs[this.typerContainerRefName].querySelector(".Typewriter__wrapper").innerHTML = "";
    },
    setupNextScene: function() {
      const stageRef = this.$refs["stage"];

      const scene = scenes[this.sceneIndex];

      this.sceneIndex += 1;

      if(this.sceneIndex > scenes.length - 1) {
        this.sceneIndex = 0;
      }

      switch (scene.type) {
        case TabScene.ROCKET:
          const { width } = stageRef.getBoundingClientRect();

          this.sceneParams = {
            // TODO It's probably better to use the image's width rather than a static number
            x: Math.random() * (width - 100)
          }
          break;
      }

      this.sceneToPlay = scene.type;

      this.clearTyperContainer();

      tw.typeString(scene.html).start();
    },
    togglePlay: function() {
      this.play = !this.play;
      if(this.play) {
        this.setupNextScene();
      } else {
        clearInterval(firstSceneTimeout);
        clearInterval(nextSceneTimeout);
        this.runScene = false;
        this.stopTyper();
        this.clearTyperContainer();
      }
    }
  }
}
</script>

<style lang="scss">
:root {
  --scene-rocket-duration: 4s;
  --scene-mars-duration: 10s;
}
</style>

<style lang="scss" scoped>

@keyframes thrust {
  0% { transform: translateX(0) }
  25% { transform: translateX(2px) }
  50% { transform: translateX(-1px) }
  75% { transform: translateX(4px) }
  100% { transform: translateX(0) }
}

@keyframes up {
  0% { height: 0; /*height: 400px;*/ }
  //25% { height: 400px; }
  75% { opacity: 1 }
  80% { height: 100%; }
  100% { height: 100%; opacity: 0; }
}

@keyframes mars-oversize {
  0% {background-image: url("../static/scene/moon.png"); transform: rotate(0deg); left: -64px; top: 10px; width: 24px; height: 24px; }
  30% { background-image: url("../static/scene/moon.png"); left: 30vw; top: 20px; width: 48px; height: 48px; }
  60% { background-image: url("../static/scene/mars.png"); left: 60vw; top: 20px; width: 400px; height: 400px; }
  100% { background-image: url("../static/scene/mars.png"); transform: rotate(150deg); left: 100vw; top: 20px; width: 600px; height: 600px; }
}

@import "../css/variables";

.stage {
  height: calc(100vh - #{$tab-bar-height});

  .glow {
    background:linear-gradient(to top, rgba(255, 255, 0, 0) 0%, rgba(27, 35, 91, 0.3) 90%);
  }
}

.rocket-ship {
  background-image: url("../static/rocket-4.png");
  position: relative;
  //width: 100%;
  height: 245px;
  animation: thrust linear 0.2s infinite;
  background-size: contain;
  background-repeat: no-repeat;
  left: -4px;
}

.exhaust {
  animation: up linear var(--scene-rocket-duration);

  .flume {

    margin-top: 25px;

    &:before {
      content: "";
      width: 0;
      height: 0;
      position: relative;
      bottom: 40px;
      border-bottom: 18px solid #ffa800;
      border-left: 18px solid transparent;
      border-right: 18px solid transparent;
    }
    width: 36px;
    background: linear-gradient(90deg, rgba(255,100,4,1) 0%, rgba(255,193,193,1) 50%, rgba(255,100,4,1) 100%);
  }
}

.mars {
  position: relative;
  animation: mars-oversize linear var(--scene-mars-duration);
  background-size: contain;
  background-repeat: no-repeat;
}
</style>

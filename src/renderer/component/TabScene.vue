<template>
  <div ref="stage" class="absolute overflow-hidden w-full stage">
    <div class="absolute h-full w-full pointer-events-none">
      <div class="absolute w-full h-3/6 glow"></div>
      <img class="absolute opacity-50 -top-96" src="../static/starfield.png"/>
      <div v-if="live === Scene.ROCKET" class="absolute h-[240vh] -bottom-[100vh] w-24 flex flex-col justify-end" :style="{ 'left': liveParameters.x + 'px' }">
        <div class="rocket-ship"></div>
        <div class="exhaust flex justify-around">
          <div class="flume"></div>
          <div class="flume"></div>
        </div>
      </div>
    </div>

    <button v-on:click="togglePlay()" class="absolute right-5 bottom-5">
      {{ play ? "Pause" : "Play" }}
    </button>
  </div>
</template>

<script lang="ts">
import {TabScene} from "util/types";
import Typewriter from "typewriter-effect/dist/core";

let tw: Typewriter;
let initialTimeout: number;

const scenes = [
  {
    type: TabScene.ROCKET,
    html: "<span class='text-green-500'>INSERT</span> <span class='text-green-500'>INTO</span> space <br/> <span class='text-violet-300'>{ type: 'shuttle', name: 'Discovery', dest: \"ISS\" }</span><span class='hidden'>;</span>"
  }
].map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);

export default {
  name: "TabScene",
  props: ["typerContainerRefName"],
  mounted() {
    tw = new Typewriter(this.$parent.$refs[this.typerContainerRefName], {
      delay: 30,
      onCreateTextNode: (character) => {
        if(character === ";" && this.play) {
          setTimeout(() => {
            let duration, scene;

            switch (this.rehearsal) {
              case TabScene.ROCKET:
                scene = TabScene.ROCKET;
                duration = getComputedStyle(document.body).getPropertyValue("--scene-rocket-duration");
                break;
            }

            this.live = scene;
            const parsedDuration = parseFloat(duration.split("s")[0]);

            setTimeout(() => {
              this.live = null;

              if(this.play) {
                this.playNextScene();
              }
            }, parsedDuration * 1000);
          }, 500);
        }

        return document.createTextNode(character);
      },
    });

    tw.typeString("Welcome to Butane").start();

    initialTimeout = setTimeout(() => {
      if(this.play) {
        this.clearTyperContainer();
        this.playNextScene();
      }
    }, 5000);
  },
  data: function() {
    return {
      Scene: TabScene,
      live: null,
      rehearsal: null,
      liveParameters: {},
      play: true,
      sceneIndex: 0
    }
  },
  methods: {
    clearTyperContainer: function() {
      this.$parent.$refs[this.typerContainerRefName].querySelector(".Typewriter__wrapper").innerHTML = "";
    },
    playNextScene: function() {
      const stageRef = this.$refs["stage"];

      let nextSceneIndex = this.sceneIndex++;

      if(nextSceneIndex === scenes.length) {
        this.sceneIndex = 0;
        nextSceneIndex = 0;
      }

      const scene = scenes[nextSceneIndex];

      this.rehearsal = scene.type;

      switch (scene.type) {
        case TabScene.ROCKET:
          const { width } = stageRef.getBoundingClientRect();

          this.liveParameters = {
            // TODO It's probably better to use the image's width rather than a static number
            x: Math.random() * (width - 100)
          }
          break;
      }

      this.clearTyperContainer();

      tw.typeString(scene.html).start();
    },
    togglePlay: function() {
      clearInterval(initialTimeout);
      this.play = !this.play;
      if(this.play) {
        this.playRandomScene();
      }
    }
  }
}
</script>

<style lang="scss">
:root {
  --scene-rocket-duration: 4s;
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
</style>

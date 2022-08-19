<template>
  <div class="h-screen overflow-hidden">
    <tabs/>
  </div>
</template>

<script>
import Tabs from "component/Tabs";

export default {
  name: "Window",
  components: {
    "tabs": Tabs
  }
}
</script>

<style lang="scss">

@import "../css/variables";

.window {
  //height: calc(100vh - #{$tab-bar-height});
}
</style>

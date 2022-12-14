<template>
  <div class="relative h-full overflow-hidden">
    <p class="pl-2 pt-2 text-white">
      <span class="mr-2">&gt;</span>
      <template v-for="(word, wordIndex) in words">
        <span
            :style="{ color: word.properties && word.properties.color ? word.properties.color : null }"
            v-if="word.value"
            class="text-[14px] inline-block relative"
            v-for="(value, charIndex) in word.value.split('')"
            :class="{
              'term-cursor': wordIndex === currentWordIndex && charIndex === currentWordPosition
            }">
          {{value}}
        </span>
        <span v-else class="inline-block relative" :class="{
              cursor: false
            }">
          &nbsp;
        </span>
        <span class="inline-block relative term-cursor-word-end" :class="{
          'term-cursor': wordIndex === currentWordIndex && words[currentWordIndex].value
          ? currentWordPosition === words[currentWordIndex].value.length
          : false }"></span>
      </template>
    </p>
    <!--<div class="cursor absolute left-0 top-[6px]" :style="{ left: `${cursorPosition * 8}px` }"></div> -->
    <input ref="input"
           @input="onInput"
           @paste="onPaste"
           @keydown="onKeyDown" type="text" class="opacity-0 absolute left-0 top-0 w-full h-full" />
  </div>
</template>

<script lang="ts">

import TerminalWordFormat from "../../util/TerminalWordFormat";
import { TerminalWord } from "../../util/types"
import {markRaw, toRaw} from "vue";

const formatWord = (word: TerminalWord) => {
  if(word.value) {
    word.properties = TerminalWordFormat[word.value.toLowerCase()] ?? undefined;
  }
  return word;
}

const createWord = (val: string | null): TerminalWord => {
  return formatWord({
    value: val
  });
}

export default {
  data() {
    return {
      previousQueries: [],
      currentWordIndex: 0,
      currentWordPosition: 0,
      words: [] as TerminalWord[],
      previousQueryIndex: null
    }
  },
  methods: {
    onPaste: function(event) {
      const { clipboardData } = event;
      const clipboardTextData = clipboardData.getData("text");
      if(!this.words[this.currentWordIndex]) {
        this.words[this.currentWordIndex] = createWord(clipboardTextData);
      } else {
        const currentWordValue = this.words[this.currentWordIndex].value;
        this.words[this.currentWordIndex].value = `${currentWordValue.slice(0, this.currentWordPosition)}${clipboardTextData}${currentWordValue.slice(this.currentWordPosition - 1)}`;
      }
      this.currentWordPosition += clipboardTextData.length + 1;
    },
    onKeyDown: function(event) {
      const { key } = event;
      const { currentWordPosition, currentWordIndex, words } = this;

      switch (key) {
        case "ArrowDown": {

          if(this.previousQueryIndex === null) {
            return;
          }

          if(this.previousQueryIndex + 1 < this.previousQueries.length) {
            this.previousQueryIndex += 1;
            this.words = JSON.parse(this.previousQueries[this.previousQueryIndex]);
            this.currentWordIndex = this.words.length - 1;
            this.currentWordPosition = this.words[this.currentWordIndex].value ? this.words[this.currentWordIndex].value.length : 0;
            console.log(this.currentWordIndex, this.currentWordPosition);
          } else {
            this.previousQueryIndex = null;
            this.words = [];
            this.currentWordIndex = 0;
            this.currentWordPosition = 0;
          }
          break;
        }
        case "ArrowUp": {

          console.log(this.previousQueryIndex, this.previousQueries);

          if(!this.previousQueries.length) {
            return;
          }

          if(this.previousQueryIndex === null) {
            this.previousQueryIndex = this.previousQueries.length - 1;
          } else if(this.previousQueryIndex - 1 >= 0) {
            this.previousQueryIndex -= 1;
          } else {
            return;
          }

          this.words = JSON.parse(this.previousQueries[this.previousQueryIndex]);
          this.currentWordIndex = this.words.length - 1;
          this.currentWordPosition = this.words[this.currentWordIndex].value ? this.words[this.currentWordIndex].value.length : 0;
          console.log(this.currentWordIndex, this.currentWordPosition);

          break;
        }
        case "Enter": {
          event.preventDefault();

          this.previousQueries.push(JSON.stringify(this.words));

          if(this.previousQueries.length > 15) {
            this.previousQueries = this.previousQueries.slice(1);
          }

          this.previousQueryIndex = null;

          this.$emit("querySubmit", this.words.filter(s => s.value).map(s => s.value).join(" "));

          this.reset();
          break;
        }
        case "ArrowLeft": {
          const nextPositionInWord = currentWordPosition - 1;

          if(nextPositionInWord < 0) {
            let nextWordIndex = currentWordIndex - 1;
            let nextWord = words[nextWordIndex];

            if(nextWordIndex >= 0) {

              this.currentWordIndex = nextWordIndex;

              if(!nextWord.value) {
                this.currentWordIndex--;
                const w = words[this.currentWordIndex];
                this.currentWordPosition = w.value ? w.value.length : 1;
              } else {
                this.currentWordPosition = nextWord.value.length;
              }
            }
          } else {
            this.currentWordPosition = nextPositionInWord;
          }
          break;
        }
        case "ArrowRight": {
          const nextPositionInWord = currentWordPosition + 1;
          const wordAtCurrentIndex = words[currentWordIndex];
          const nextWordIndex = currentWordIndex + 1;
          const wordAtNextIndex = words[nextWordIndex];

          if(nextPositionInWord > (wordAtCurrentIndex && wordAtCurrentIndex.value ? wordAtCurrentIndex.value.length : 0)) {
            if(nextWordIndex < words.length) {
              this.currentWordIndex = nextWordIndex;

              if(wordAtNextIndex && !wordAtNextIndex.value) {
                this.currentWordIndex++;
              }

              this.currentWordPosition = 0;
            }
          } else {
            this.currentWordPosition = nextPositionInWord;
          }
          break;
        }
      }
      //console.log(this.currentWordIndex, this.currentWordPosition, this.words);
    },
    reset: function() {
      this.words = [];
      this.currentWordPosition = 0;
      this.currentWordIndex = 0;
    },
    onInput: function(event) {

      const { data: eventInputData } = event;
      const { words, currentWordIndex, currentWordPosition } = this;

      if(eventInputData) {
        const word = this.words[currentWordIndex];
        const wordVal = word ? word.value : null;

        let left = null, right = null;

        if(wordVal) {
          left = wordVal.substring(0, currentWordPosition);
          right = wordVal.substring(currentWordPosition);
        }

        if(eventInputData === " ") {
          const words = [...this.words.slice(0, currentWordIndex)];

          if(left) {
            const wordLeft = createWord(left);
            words.push(formatWord(wordLeft));
          }

          words.push(createWord(null));

          if(right) {
            const wordRight = createWord(right);
            words.push(formatWord(wordRight));
          }

          this.words = [ ...words, ...this.words.slice(currentWordIndex + 1)];
          this.currentWordIndex += left ? 2 : 1;
          //this.currentWordIndex += 1;
          this.currentWordPosition = 0;
        } else if(!words[currentWordIndex]
            && words[currentWordIndex - 1]
            && words[currentWordIndex - 1].value) {
          words[currentWordIndex - 1].value += eventInputData;
        } else {
          if(wordVal) {
            words[currentWordIndex].value = `${left ?? ""}${eventInputData}${right ?? ""}`;
            formatWord(words[currentWordIndex]);
          } else {
            words.push(createWord(eventInputData));
          }

          this.currentWordPosition += 1;
        }

        //console.log(this.currentWordIndex, this.currentWordPosition ,words);
      } else {

        const currentWord = words[currentWordIndex];
        const previousWord = words[currentWordIndex - 1];

        if(currentWord && currentWord.value && currentWordPosition - 1 >= 0) {
          this.currentWordPosition -= 1;

          const sub = `${currentWord.value.substring(0, this.currentWordPosition)}${currentWord.value.substring(this.currentWordPosition + 1)}`;

          if(!sub.length) {
            words.splice(currentWordIndex, 1);
          } else {
            currentWord.value = sub;
            formatWord(currentWord);
          }

          //console.log("Within word", this.currentWordIndex, this.currentWordPosition, this.words);
          return;
        }

        if(previousWord && !previousWord.value) {

          this.currentWordIndex -= 2;

          let nextWord = words[this.currentWordIndex];

          this.currentWordPosition = nextWord && nextWord.value ? nextWord.value.length : 0;

          words.splice(this.currentWordIndex + 1, 1);

          const right = words[this.currentWordIndex + 1];

          //console.log(nextWord, right);

          if(nextWord && nextWord.value && right && right.value) {
            nextWord.value += right.value;
            words.splice(this.currentWordIndex + 1, 1);
            formatWord(nextWord);
          }

          //console.log("Previous value", this.currentWordIndex, this.currentWordPosition, this.words);
          return;
        }

        if(this.currentWordIndex - 1 >= 0) {
          this.currentWordIndex -= 1;
          this.currentWordPosition = previousWord && previousWord.value ? previousWord.value.length : 0;
          words.splice(currentWordIndex, 1);
        }

        //console.log("Just delete", this.currentWordIndex, this.currentWordPosition, this.words);
      }
    }
  }
};
</script>

<style lang="scss" scoped>
@keyframes blink {
  from { opacity: 0; }
  to { opacity: 100; }
}

.term-cursor {
  &:after {
    content: '';
    position: absolute;
    //display: block;
    top: 0;
    left: 0;
    width: 2px;
    height: 18px;
    background: red;
    //animation-name: blink;
    animation-duration: 800ms;
    animation-iteration-count: infinite;
  }

  &-word-end {
    &:after {
      top: -14px;
    }
  }
}
</style>

<template>
  <div id="app">
    <img
      v-on:click="onCanClicked"
      :class='["", clicked && "clicked" ]'
      class="can"
      src="@/assets/dose.jpg">
    <AnswerView v-bind:data="answers"/>
  </div>
</template>

<script>
import AnswerView from './components/AnswerView'
import { fetchAnswers } from './api'
import _ from 'lodash'

export default {
  name: 'App',
  components: {
    AnswerView
  },
  data () {
    return {
      answers: undefined,
      clicked: false
    }
  },
  methods: {
    async onCanClicked () {
      this.clicked = true
      _.sample(this.audioFiles).play()
      try {
        let res = await fetchAnswers()
        let json = await res.json()
        this.answers = json
      } catch (err) {
        console.error(err)
      }
      setTimeout(() => {
        this.clicked = false
        this.timeout = null
      }, 650)
    }
  },
  created () {
    this.audioFiles = [
      new Audio(require('./assets/dose_klopf1.ogg')),
      new Audio(require('./assets/dose_klopf2.ogg')),
      new Audio(require('./assets/dose_klopf3.ogg'))
    ]
  }
}
</script>

<style>
body, html {
  margin: 0;
  padding: 0;
  background: white;
  color: black;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  font-size: 130%;
  margin: 0 auto;
  padding: 0px;
  max-width: 500px;
}

.can {
  height: 250px;
  transform: rotate(0deg) scale(1.0);
}

/* @keyframes wiggle-animation {
  0% { transform: rotate(0deg) scaleY(1.0); }
  33% { transform: rotate(-3deg) scaleY(1.05); }
  50% { transform: rotate(0deg) scaleY(1.12); }
  66% { transform: rotate(+3deg) scaleY(1.05); }
  100% { transform: rotate(0deg) scaleY(1.0); }
} */

@keyframes wiggle-animation {
  0%    { transform: rotate(0deg)   scaleY(1.00); }
  10%   { transform: rotate(0deg)   scaleY(1.08); }
  20%   { transform: rotate(+3deg)   scaleY(1.00); }
  30%   { transform: rotate(0deg)   scaleY(0.94); }
  40%   { transform: rotate(-3deg)   scaleY(1.00); }
  50%   { transform: rotate(0deg)   scaleY(1.05); }
  60%   { transform: rotate(+1deg)   scaleY(1.00); }
  70%   { transform: rotate(0deg)   scaleY(0.96); }
  80%   { transform: rotate(-1deg)   scaleY(1.00); }
  90%   { transform: rotate(0deg)   scaleY(1.02); }
  100%  { transform: rotate(0deg)   scaleY(1.00); }
}

.can.clicked {
  transform-origin: top center;
  animation: wiggle-animation ease-out .6s;
}
</style>

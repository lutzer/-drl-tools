<template>
  <div id="app">
    <img
      v-on:click="onCanClicked"
      :class='["", clicked && "clicked" ]'
      class="can"
      src="./assets/dose.jpg">
    <AnswerView v-bind:data="answers"/>
  </div>
</template>

<script>
import AnswerView from './components/AnswerView'
import { fetchAnswers } from './api'

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
      }, 500)
    }
  }
}
</script>

<style>
body, html {
  margin: 0;
  padding: 0;
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
  height: 200px;
  transform: rotate(0deg) scale(1.0);
}

@keyframes wiggle-animation {
  0% { transform: rotate(0deg) scaleY(1.0); }
  33% { transform: rotate(-3deg) scaleY(1.05); }
  50% { transform: rotate(0deg) scaleY(1.12); }
  66% { transform: rotate(+3deg) scaleY(1.05); }
  100% { transform: rotate(0deg) scaleY(1.0); }
}

.can.clicked {
  transform-origin: top center;
  animation: wiggle-animation .5s infinite;
}
</style>

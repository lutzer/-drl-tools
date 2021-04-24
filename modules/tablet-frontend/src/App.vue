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
      }, 200)
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
  transition: all .2s ease-in-out;
}

.can.clicked {
  transform: scale(1.3);
}
</style>

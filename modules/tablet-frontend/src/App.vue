<template>
  <div id="app">
    <CanButton v-on:clicked="onCanClicked"/>
    <AnswerView v-bind:data="answer"/>
  </div>
</template>

<script>
import AnswerView from './components/AnswerView'
import CanButton from './components/CanButton'
import { fetchAnswers } from './api'
import _sample from 'lodash/sample'

export default {
  name: 'App',
  components: {
    AnswerView,
    CanButton
  },
  data () {
    return {
      answer: undefined
    }
  },
  methods: {
    async onCanClicked () {
      try {
        let res = await fetchAnswers()
        let json = await res.json()
        this.answer = _sample(json)
      } catch (err) {
        console.error(err)
      }
    }
  }
}
</script>

<style>
@font-face {
  font-family: 'Inconsolata';
  src: local("Inconsolata"),
   url(./assets/fonts/Inconsolata-Regular.ttf) format("truetype");
}

body, html {
  margin: 0;
  padding: 0;
  background: white;
  color: black;
}

#app {
  font-family: 'Inconsolata', monospace;
  letter-spacing: 0.05em;
  line-height: 150%;
  text-align: center;
  color: #2c3e50;
  font-size: 110%;
  margin: 0 auto;
  padding: 0px;
  max-width: 500px;
}
</style>

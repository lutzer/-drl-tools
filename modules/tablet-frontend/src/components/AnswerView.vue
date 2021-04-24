<template>
  <div class="answer-view" :class='["", animation && "animate" ]'>
    <ul class="answer">
      <li
        v-for="item in answer"
        :key="item.message">
        {{ item }}
      </li>
    </ul>
  </div>
</template>

<script>
import config from '../config'
import _ from 'lodash'

export default {
  name: 'MainView',
  props: ['data'],
  data () {
    return {
      msg: 'Welcome to Your Vue.js App',
      api: config.apiAddress,
      animation: false
    }
  },
  computed: {
    answer: function () {
      if (!this.data) {
        return []
      }
      let dataset = _.sample(this.data)
      let result = dataset.map((e) => {
        return _.isString(e.value) ? e.value : e.value.input
      }, '')
      return result
    }
  },
  watch: {
    answer: function () {
      if (this.timeout) {
        this.animation = false
        clearTimeout(this.timeout)
        setTimeout(() => { this.animation = true }, 10)
      } else {
        this.animation = true
      }
      this.timeout = setTimeout(() => { this.animation = false }, 4010)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.answer-view {
  position: absolute;
  width: 100%;
  max-width: 500px;
  top: 30%;
  opacity: 0;
}

@keyframes drop-down-animation {
  0% { top: 30%; opacity: 0 }
  20% { top: 50%; opacity: 1 }
  90% { top: 50%; opacity: 1 }
  100% { top: 53%; opacity: 0 }
}

.answer-view.animate {
  animation: 4s ease-in-out 0s drop-down-animation;
}

ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: block;
  margin: 0 10px;
}
</style>

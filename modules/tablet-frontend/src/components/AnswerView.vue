<template>
  <div class="answer-view" :class='["", animation && "animate" ]'>
    <ul class="answer">
      <li
        v-for="item in answer"
        :key="item.key">
        <span class="topic">{{ item.topic }}</span>
        <span class="text">{{ item.text }}</span>
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
      let result = dataset.map((e, i) => {
        return {
          key: i,
          topic: e.topic,
          text: _.isString(e.value) ? e.value : e.value.input,
          type: _.isString(e.value) ? 'text' : 'choice'
        }
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
      this.timeout = setTimeout(() => { this.animation = false }, 8010)
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
  opacity: 0;
}

@keyframes drop-down-animation {
  0% { top: 35%; opacity: 0; transform: scale(0.7); }
  10% { top: 60%; opacity: 1; transform: scale(1); }
  95% { top: 60%; opacity: 1; transform: scale(1); }
  100% { top: 63%; opacity: 0; transform: scale(1); }
}

.answer-view.animate {
  animation: 8s ease-in-out 0s drop-down-animation;
}

ul {
  list-style-type: none;
  padding: 0;
  display: inline
}

li {
  display: block;
  margin: 0 10px;
  text-align: center;
}

.topic {
  opacity: 0.2;
  padding-right: 0.5em;
  /* font-weight: bold; */
  /* color: #F8FF00 */
}
</style>

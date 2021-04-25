<template>
  <div id="can-button">
    <img
      v-on:click="onCanClicked"
      :class='["", clicked && "clicked" ]'
      class="can"
      src="../assets/images/dose.jpg">
  </div>
</template>

<script>
import _sample from 'lodash/sample'

export default {
  name: 'CanButton',
  data () {
    return {
      clicked: false
    }
  },
  methods: {
    async onCanClicked () {
      this.clicked = true
      this.$emit('clicked')
      _sample(this.audioFiles).play()
      setTimeout(() => {
        this.clicked = false
        this.timeout = null
      }, 650)
    }
  },
  created () {
    this.audioFiles = [
      new Audio(require('../assets/dose_klopf1.ogg')),
      new Audio(require('../assets/dose_klopf2.ogg')),
      new Audio(require('../assets/dose_klopf3.ogg'))
    ]
  }
}
</script>

<style scoped>
.can {
  height: 250px;
  transform: rotate(0deg) scale(1.0);
}

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

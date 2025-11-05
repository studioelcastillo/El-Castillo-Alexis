<template>
  <q-page class="flex flex-center">
    <img
      alt="Quasar logo"
      src="~assets/quasar-logo-vertical.svg"
      style="width: 200px; height: 200px"
    >
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'IndexPage',
  props: {
    view: { type: String, default: 'login' }
  },
  created () {
    if (this.view === 'te') {
      this.errorsAlerts(this.$route.params.error)
      this.goTo('logout')
    }
  }
})
</script>

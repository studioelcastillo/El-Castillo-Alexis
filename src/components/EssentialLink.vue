<template>
  <!-- target=_blank -->
  <q-item
    v-if="target === '_blank'"
    clickable
    :active="(link == currentUrl)"
    tag="a"
    target="_blank"
    :href="link"
  >
    <q-item-section
      v-if="icon"
      avatar
    >
      <q-icon :name="icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
      <q-item-label caption>{{ caption }}</q-item-label>
    </q-item-section>
  </q-item>
  <!-- goto -->
  <q-item
    v-else
    clickable
    :active="(link == currentUrl)"
    tag="a"
    @click="onClickEvent"
  >
    <q-item-section
      v-if="icon"
      avatar
    >
      <q-icon :name="icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
      <q-item-label caption>{{ caption }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script>
import { defineComponent } from 'vue'
import { xMisc } from '../mixins/xMisc.js'

export default defineComponent({
  name: 'EssentialLink',
  mixins: [xMisc],
  props: {
    title: {
      type: String,
      required: true
    },
    caption: {
      type: String,
      default: ''
    },
    link: {
      type: String,
      default: '#'
    },
    icon: {
      type: String,
      default: ''
    },
    currentUrl: {
      type: String,
      default: ''
    },
  },
  data () {
  },
  mounted () {
  },
  methods: {
    onClickEvent () {
      this.$emit('update:currentUrl', this.link)
      this.goTo(this.link)
    }
  }
})
</script>
<style type="text/css">
  .q-item.q-router-link--active, .q-item--active {
    color: #E5D18E;
  }
</style>
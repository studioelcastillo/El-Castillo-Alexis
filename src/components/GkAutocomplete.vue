<template>
  <div>
    <q-select
      filled
      v-model="model"
      :label="label"
      :label-color="labelColor"
      use-input
      hide-selected
      fill-input
      @filter="filterFn"
      :options="filteredOpts"
      @update:model-value="updateFn"
      :disable="options.length == 0"
      lazy-rules
      :rules="rules"
      :readonly="readonly"
    />
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { xMisc } from '../mixins/xMisc.js'

export default defineComponent({
  name: 'GkSelectMultiple',
  mixins: [xMisc],
  props: {
    modelValue: {
      required: true
    },
    label: {
      type: String,
      default: ''
    },
    labelColor: {
      type: String,
      default: ''
    },
    options: {
      type: Array,
      default: () => []
    },
    readonly: {
      type: Boolean,
      default: false
    },
    rules: {
      type: Array,
      default: () => []
    },
  },
  watch: {
    modelValue(newVal, oldVal) {
      this.model = newVal
    }
  },
  data() {
    return {
      model: null,
      filteredOpts: []
    }
  },
  created () {
  },
  methods: {
    updateFn (value) {
      var model = value
      this.$emit('update:modelValue', model)
      return false
    },
    filterFn (val, update) {
      // if the input its empty
      if (val == '') {
        update(() => {
          // filter only not selected
          const selecteds = []
          this.filteredOpts = this.options.filter(v => !selecteds.includes(v.value))
        })
        return
      }

      // else
      update(() => {
        // filter string contains
        const needle = val.toLowerCase()
        this.filteredOpts = this.options.filter(v => v.label.toLowerCase().indexOf(needle) > -1)
      })
    },
  }
})
</script>

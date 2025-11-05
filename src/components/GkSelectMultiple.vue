<template>
  <div :style="{marginBottom: marginBottom}">
    <q-select
      filled
      v-model="model"
      :label="label"
      :label-color="labelColor"
      use-input
      hide-selected
      fill-input
      @filter="filterFn"
      :options="selectOpts"
      @update:model-value="updateFn"
      :disable="options.length == 0"
      lazy-rules
      :rules="[
        val => (modelValue.length >= minSelection) || 'Debe seleccionar al menos (' + minSelection + ') ' + (minSelection == 1 ? 'opción' : 'opciones'),
        val => (modelValue.length <= maxSelection) || 'Debe seleccionar maximo (' + maxSelection + ') opciones',
      ]"
      :readonly="readonly"
    />
    <q-chip
      v-if="modelValue.length === 0 && allItemsLabel !== ''"
      :color="'primary'"
      :text-color="getContrastYIQ('primary')"      
      :style="{backgroundColor: 'primary'}"
    >
      {{ allItemsLabel }}
    </q-chip>
    <q-chip
      v-for="(item, index) in modelValue"
      :key="index"
      :color="(item.color) ? item.color : 'primary'"
      :text-color="getContrastYIQ((item.color) ? item.color : 'primary')"
      :removable="!readonly"
      @remove="removeItem(index)"
      :style="{backgroundColor: (item.color) ? item.color : 'primary'}"
    >
      {{item.label}}
    </q-chip>
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
    minSelection: {
      type: Number,
      default: 0
    },
    maxSelection: {
      type: Number,
      default: 999999
    },
    allItemsLabel: {
      type: String,
      default: ''
    },
    allItemsOption: {
      type: Boolean,
      default: false
    },
    marginBottom: {
      type: String,
      default: '0 px'
    }
  },
  data() {
    return {
      model: null,
      filteredOpts: [],
      actionOpts: [] // usado para agregar TODOS al inicio de las opciones y que limpie dichas opciones
    }
  },
  created () {
    if (this.allItemsOption) {
      this.actionOpts = [{label: this.allItemsLabel, value: this.allItemsLabel + 'E@^6zY)")uGC2=c'}]
    }
  },
  computed: {
    selectOpts() {
      return (this.modelValue.length === 0 || this.filteredOpts.length + this.modelValue.length !== this.options.length) ? this.filteredOpts : this.actionOpts.concat(this.filteredOpts)
    }
  },
  methods: {
    updateFn (value) {
      if (value.value === this.allItemsLabel + 'E@^6zY)")uGC2=c') {
        this.removeAllItems()
      } else {
        var model = this.modelValue
        model.push(value)
        this.$emit('update:modelValue', model)
      }
      this.model = { label: '', value: '' }
      return false
    },
    filterFn (val, update) {
      // if the input its empty
      if (val == '') {
        update(() => {
          // filter only not selected
          const selecteds = []
          for (let index = 0; index < this.modelValue.length; index++) {
            selecteds.push(this.modelValue[index].value)
          }
          this.filteredOpts = this.options.filter(v => !selecteds.includes(v.value))
        })
        return
      }

      // else
      update(() => {
        // filter not selected
        const selecteds = []
        for (let index = 0; index < this.modelValue.length; index++) {
          selecteds.push(this.modelValue[index].value)
        }
        // filter string contains
        const needle = val.toLowerCase()
        this.filteredOpts = this.options.filter(v => v.label.toLowerCase().indexOf(needle) > -1 && !selecteds.includes(v.value))
      })
    },
    removeItem (index) {
      var model = this.modelValue
      model.splice(index, 1)
      this.$emit('update:modelValue', model)
    },
    removeAllItems () {
      var model = this.modelValue
      model.length = 0
      this.$emit('update:modelValue', model)
    }
  }
})
</script>

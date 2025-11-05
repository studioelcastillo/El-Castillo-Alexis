<template>
  <q-select
    filled
    v-model="internalValue"
    :label="selectRequestLabel"
    label-color="primary"
    use-input
    hide-selected
    fill-input
    :options="optionsList"
    @filter="getOptions"
    :hint="'Digitar al menos 3 caracteres para seleccionar ' + selectRequestLabel"
  >
    <template v-slot:no-option>
      <q-item><q-item-section class="text-grey">Sin resultados</q-item-section></q-item>
    </template>
  </q-select>
</template>

<script>
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'selectRequest',
  mixins: [xMisc, sGate],
  props: {
    modelValue: null,
    fetchOptionsFn: {
      type: Function,
      required: true
    },
    selectRequestLabel: {
      type: String,
      default: 'Usuario'
    }
  },
  data () {
    return {
      optionsList: []
    }
  },
  computed: {
    internalValue: {
      get () {
        return this.modelValue
      },
      set (val) {
        this.$emit('update:modelValue', val)
      }
    }
  },
  methods: {
    async getOptions (val, update, abort) {
      if (val.length < 3) {
        abort()
        return
      }
      try {
        const response = await this.fetchOptionsFn(val)
        update(() => {
          this.optionsList = response.data.data
        })
      } catch (error) {
        this.errorsAlerts(error)
      }
    }
  }
}
</script>
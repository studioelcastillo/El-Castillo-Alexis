<template>
  <q-card-section>
    <q-card class="my-card" flat bordered>
      <q-card-actions>
        <div class="text-h5 q-mt-sm q-mb-xs">{{ label }}</div>
        <q-space/>
        <q-btn
          color="grey"
          round
          flat
          dense
          :icon="expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"
          @click="expanded = !expanded"
        />
      </q-card-actions>

      <q-slide-transition>
        <div v-show="expanded">
          <q-separator />
          <div class="row q-pa-md q-col-gutter-xs">
            <div v-for="(option, index) in options" :key="index" class="col-12 col-sm-6 col-md-4 col-lg-4">
              <q-card flat bordered class="my-card">
                <q-card-section>
                  <div class="text-subtitle1">{{ option.label }}</div>
                  <q-radio v-model="permissions[option.key]" val="SI" :label="'SI'" :disable="readonly" @update:model-value="updateFn" />
                  <q-radio v-model="permissions[option.key]" val="NO" :label="'NO'" :disable="readonly" @update:model-value="updateFn" />
                </q-card-section>
              </q-card>            
            </div>
          </div>
        </div>
      </q-slide-transition>
    </q-card>
  </q-card-section>
</template>
<script>
import { defineComponent, ref } from 'vue'
import { xMisc } from '../mixins/xMisc.js'

export default defineComponent({
  name: 'UserOtherPermissions',
  mixins: [xMisc],
  props: {
    modelValue: {
      required: true
    },
    label: {
      type: String,
      default: 'Otros permisos y funcionalidades especiales'
    },
    readonly: {
      type: Boolean,
      default: false
    },
  },
  watch: { 
    modelValue: function(newVal, oldVal) { // watch it
      this.permissions = (this.modelValue) ? this.modelValue : {}
      this.setPermissions()
    }
  },
  data() {
    return {
      model: null,
      filteredOpts: [],
      options: [
        {
          label: 'Solicitar Cuotas',
          key: 'HAS_QUOTAS'
        },
        {
          label: 'Automatizar propuestas',
          key: 'AUTOPROPOSAL'
        },
        {
          label: 'Puede Tener ordenes',
          key: 'CAN_HAVE_ORDERS'
        }
      ],
      permissions: {},
      expanded: true
    }
  },
  created () {
    this.permissions = (this.modelValue) ? this.modelValue : {}
    this.setPermissions()
  },
  methods: {
    setPermissions () {
      for (let index = 0; index < this.options.length; index++) {
        if ( !Object.keys(this.permissions).some(x => x == this.options[index].key) ) {
          this.permissions[this.options[index].key] = 'NO'
        }
      }
    },
    updateFn (value) {
      this.$emit('update:modelValue', this.permissions)
      return false
    },
  }
})
</script>

<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card">
          <q-form
              @submit="onSubmit"
              class="q-gutter-md"
            >
            <q-card-section v-if="!isDialog">
              <div class="q-px-md q-gutter-sm">
                <q-btn color="black" @click="goTo('studios_shifts')" :label="'&lt; ' + 'Regresar'" />
              </div>
            </q-card-section>

            <q-separator v-if="!isDialog" class="q-my-none" inset />

            <q-card-section v-if="isDialog" class="row items-center q-pb-none">
              <h5 class="is-size-3">{{initTitle}}</h5>
              <q-space />
              <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>

            <q-separator v-if="isDialog" inset />

            <q-card-section>
              <h5 v-if="!isDialog" class="is-size-3">{{initTitle}}</h5>
              <br v-if="!isDialog">
              <div class="row q-col-gutter-sm">
                <div class="col-xs-12 col-sm-12">
                  <q-select
                    filled
                    v-model="studioShift.std_id"
                    label="Estudio"
                    label-color="primary"
                    :options="studios"
                    lazy-rules
                    :rules="[
                      val => !!val.value || 'Este campo es requerido',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.std_id"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="studioShift.name"
                    label="Nombre"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.name"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type="time"
                    v-model="studioShift.begin_time"
                    label="Hora de entrada"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.begin_time"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type="time"
                    v-model="studioShift.finish_time"
                    label="Hora de salida"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.finish_time"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type="number"
                    v-model="studioShift.capacity"
                    label="Cantidad de cuartos"
                    label-color=""
                    lazy-rules
                    :rules="[
                    ]"
                    :readonly="mode == 'show' || readonlyFields.capacity"
                  />
                  <br>
                </div>

              </div>
            </q-card-section>

            <q-separator inset />

            <q-card-section v-if="mode == 'create' || mode == 'edit'">
              <div>
                <q-btn type="submit" class="bg-primary text-white submit1" label="Enviar"/>
                <q-btn v-if="mode == 'edit'" @click="(isDialog) ? this.$emit('close') : this.mode = 'show';" label="Cancelar" />
                <q-btn v-else @click="(isDialog) ? this.$emit('close') : goTo('studios_shifts')" label="Cancelar" />
              </div>
            </q-card-section>
            <q-card-section v-else-if="mode == 'show'">
              <div>
                <q-btn v-if="openGate('edit-studios_shifts', sUser.prof_id)" class="bg-primary text-white submit1" label="Editar" @click="this.mode = 'edit'" />
              </div>
            </q-card-section>
          </q-form>
        </q-card>
        <!-- <StudiosModels v-if="(this.mode == 'show' || this.mode == 'edit') && studioShift.id > 0" :is-subgrid="true" :parent-mode="mode" parent-table="studios_shifts" parent-field="stdshift_id" :parent-id="studioShift.id" /> -->
      </div>
    </div>
  </div>
</template>

<script>
import StudioShiftService from 'src/services/StudioShiftService'
import StudioService from 'src/services/StudioService'
import StudiosModels from 'src/pages/StudioModel/StudiosModels.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'StudioShiftForm',
  mixins: [xMisc, sGate],
  components: {
    // StudiosModels,
  },
  props: {
    isDialog: {
      type: String,
      default: null
    },
    parentTable: {
      type: String,
      default: null
    },
    parentField: {
      type: String,
      default: null
    },
    parentId: {
      type: Number,
      default: null
    },
    dialogChildId: {
      type: Number,
      default: null
    },
    modeprop: {
      type: String,
      default: ''
    },
  },
  data () {
    return {
      sUser: {},
      mode: (this.$route.params.id) ? 'edit' : 'create',
      initTitle: 'Crear turno',
      studioShift: {
        id: 0,
        std_id: '',
        name: '',
        begin_time: '',
        finish_time: '',
        capacity: '',
        created_at: '',
      },
      readonlyFields: {
        std_id: false,
        name: false,
        begin_time: false,
        finish_time: false,
        capacity: false,
        created_at: false,
      },
      studios: [],
    }
  },
  mounted () {
    this.sUser = this.decryptSession('user')

    // if mode is sended from modeprop
    if (this.modeprop != '') {
      this.mode = this.modeprop
    
    // if mode is sended from subgrid
    } else if ((this.$route.params.id && !this.isDialog) || (this.isDialog && this.parentId !== null && this.dialogChildId !== null)) {
      this.mode = 'edit'
    }

    if (this.mode === 'edit' || this.mode === 'show') {
      this.studioShift.id = (this.isDialog) ? this.dialogChildId : this.$route.params.id
      this.getData()
    }
    this.getSelects()
  },
  methods: {
    async onSubmit () {
      try {
        this.activateLoading('Cargando')
        // var response = {}
        // POST
        if (this.mode === 'create') {
          var record = await StudioShiftService.addStudioShift({
            std_id: this.studioShift.std_id.value,
            stdshift_name: this.studioShift.name,
            stdshift_begin_time: this.studioShift.begin_time,
            stdshift_finish_time: this.studioShift.finish_time,
            stdshift_capacity: this.studioShift.capacity,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Creado')
          this.studioShift.id = record.data.data.stdshift_id
        } else if (this.mode === 'edit') {
          var record = await StudioShiftService.editStudioShift({
            id: (this.isDialog) ? this.dialogChildId : this.studioShift.id,
            std_id: this.studioShift.std_id.value,
            stdshift_name: this.studioShift.name,
            stdshift_begin_time: this.studioShift.begin_time,
            stdshift_finish_time: this.studioShift.finish_time,
            stdshift_capacity: this.studioShift.capacity,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Actualizado')
        }
        // if can edit >> edit, else >> show
        this.mode = (this.openGate('edit-studios_shifts', this.sUser.prof_id)) ? 'edit' : 'show'
        if (this.isDialog) {
          this.$emit('save')
          this.getData()
        } else {
          this.goTo('studios_shifts/' + this.mode + '/' + this.studioShift.id)
          this.getData()
        }
        this.disableLoading()
      } catch (error) {
        console.log(error)
        this.disableLoading()
        if (error.response && error.response.data.error && error.response.data.error.code && error.response.data.error.message) {
          if (error.response.data.error.code === 'UNEXPECTED_ERROR') {
            this.alert('negative', error.response.data.error.message)
          } else {
            this.alert('warning', error.response.data.error.message)
          }
        } else {
          this.errorsAlerts(error)
        }
      }
    },
    async getData () {
      if (this.mode === 'edit') {
        this.initTitle = 'Editar turno'
      } else if (this.mode === 'show') {
        this.initTitle = 'Ver turno'
      }

      try {
        this.activateLoading('Cargando')
        var response = await StudioShiftService.getStudioShift({ id: this.studioShift.id, token: this.decryptSession('token') })
        this.studioShift.id = response.data.data[0].stdshift_id
        this.studioShift.name = response.data.data[0].stdshift_name
        this.studioShift.begin_time = response.data.data[0].stdshift_begin_time
        this.studioShift.finish_time = response.data.data[0].stdshift_finish_time
        this.studioShift.capacity = response.data.data[0].stdshift_capacity
        this.studioShift.created_at = response.data.data[0].created_at
        if (response.data.data[0].studio) {
          this.studioShift.std_id = {
            label: response.data.data[0].studio.std_name,
            value: response.data.data[0].studio.std_id,
          }
        }

        this.disableLoading()
      } catch (error) {
        this.errorsAlerts(error)
        this.disableLoading()
      }
    },
    async getSelects () {
      var response
      // studios
      this.studios = []
      this.studios.push({
        label: '',
        value: '',
      })
      // async
      response = await StudioService.getStudios({ token: this.decryptSession('token') })
      for (var u = 0; u < response.data.data.length; u++) {
        this.studios.push({
          label: response.data.data[u].std_name,
          value: response.data.data[u].std_id,
        })
      }

      // pre-select from dialog parent
      if (this.isDialog) {
        for (var dp = 0; dp < this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))].length; dp++) {
          if (parseInt(this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))][dp].value) === parseInt(this.parentId)) {
            this.studioShift[this.parentField] = {
              label: this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))][dp].label,
              value: this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))][dp].value,
            }
            this.readonlyFields[this.parentField] = true
          }
        }
      }
    },
    toggleInstructions () {
      // if (this.needHelp) {
      //   this.needHelp = false
      //   this.helpText = 'Ayuda'
      // } else {
      //   this.needHelp = true
      //   this.helpText = 'Cerrar ayuda'
      // }
    }
  }
}
</script>

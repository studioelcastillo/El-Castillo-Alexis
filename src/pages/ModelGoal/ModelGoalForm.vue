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
                <q-btn color="black" @click="goTo('models_goals')" :label="'&lt; ' + 'Regresar'" />
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
                    v-model="modelGoal.stdmod_id"
                    label="Modelo"
                    label-color="primary"
                    :options="studiosModels"
                    lazy-rules
                    :rules="[
                      val => !!val.value || 'Este campo es requerido',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.stdmod_id"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-select
                    filled
                    v-model="modelGoal.type"
                    label="Tipo"
                    label-color=""
                    :options="['', 'PRESENCIAL', 'SATELITE', 'FIJO']"
                    lazy-rules
                    :rules="[
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.type"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type="number"
                    v-model="modelGoal.amount"
                    label="Monto"
                    label-color="primary"
                    lazy-rules
                    step="any"
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.amount"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type="number"
                    v-model="modelGoal.percent"
                    label="Porcentaje de ingreso"
                    label-color=""
                    lazy-rules
                    step="any"
                    :rules="[
                    ]"
                    :readonly="mode == 'show' || readonlyFields.percent"
                  />
                  <br>
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    v-model="modelGoal.date"
                    label="Fecha"
                    label-color=""
                    mask="date"
                    :rules="[
                    val => this.validateDateFormat(val) || 'El formato de fecha no es válida',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.date"
                  >
                    <template v-slot:append>
                      <q-icon name="event" class="cursor-pointer">
                        <q-popup-proxy v-if="!(mode == 'show' || readonlyFields.date)" cover transition-show="scale" transition-hide="scale">
                          <q-date v-model="modelGoal.date">
                            <div class="row items-center justify-end">
                              <q-btn v-close-popup label="Close" color="primary" flat />
                            </div>
                          </q-date>
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                </div>

              </div>
            </q-card-section>

            <q-separator inset />

            <q-card-section v-if="mode == 'create' || mode == 'edit'">
              <div>
                <q-btn type="submit" class="bg-primary text-white submit1" label="Enviar"/>
                <q-btn v-if="mode == 'edit'" @click="(isDialog) ? this.$emit('close') : this.mode = 'show';" label="Cancelar" />
                <q-btn v-else @click="(isDialog) ? this.$emit('close') : goTo('models_goals')" label="Cancelar" />
              </div>
            </q-card-section>
            <q-card-section v-else-if="mode == 'show'">
              <div>
                <q-btn v-if="openGate('edit-models_goals', sUser.prof_id)" class="bg-primary text-white submit1" label="Editar" @click="this.mode = 'edit'" />
              </div>
            </q-card-section>
          </q-form>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script>
import ModelGoalService from 'src/services/ModelGoalService'
import StudioModelService from 'src/services/StudioModelService'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'ModelGoalForm',
  mixins: [xMisc, sGate],
  components: {
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
      initTitle: 'Crear meta',
      modelGoal: {
        id: 0,
        stdmod_id: '',
        type: '',
        amount: '',
        created_at: '',
        percent: '',
        date: '',
      },
      readonlyFields: {
        stdmod_id: false,
        type: true,
        amount: false,
        created_at: false,
        percent: false,
        date: true,
      },
      studiosModels: [],
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
      this.modelGoal.id = (this.isDialog) ? this.dialogChildId : this.$route.params.id
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
          var record = await ModelGoalService.addModelGoal({
            stdmod_id: this.modelGoal.stdmod_id.value,
            modgoal_type: this.modelGoal.type,
            modgoal_amount: this.modelGoal.amount,
            modgoal_percent: this.modelGoal.percent,
            modgoal_date: this.modelGoal.date,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Creado')
          this.modelGoal.id = record.data.data.modgoal_id
        } else if (this.mode === 'edit') {
          var record = await ModelGoalService.editModelGoal({
            id: (this.isDialog) ? this.dialogChildId : this.modelGoal.id,
            stdmod_id: this.modelGoal.stdmod_id.value,
            modgoal_type: this.modelGoal.type,
            modgoal_amount: this.modelGoal.amount,
            modgoal_percent: this.modelGoal.percent,
            modgoal_date: this.modelGoal.date,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Actualizado')
        }
        // if can edit >> edit, else >> show
        this.mode = (this.openGate('edit-models_goals', this.sUser.prof_id)) ? 'edit' : 'show'
        if (this.isDialog) {
          this.$emit('save')
          this.$emit('close')
        } else {
          this.goTo('models_goals/' + this.mode + '/' + this.modelGoal.id)
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
        this.initTitle = 'Editar meta'
      } else if (this.mode === 'show') {
        this.initTitle = 'Ver meta'
      }

      try {
        this.activateLoading('Cargando')
        var response = await ModelGoalService.getModelGoal({ id: this.modelGoal.id, token: this.decryptSession('token') })
        this.modelGoal.id = response.data.data[0].modgoal_id
        this.modelGoal.type = response.data.data[0].modgoal_type
        this.modelGoal.amount = response.data.data[0].modgoal_amount
        this.modelGoal.created_at = response.data.data[0].created_at
        this.modelGoal.percent = response.data.data[0].modgoal_percent
        this.modelGoal.date = response.data.data[0].modgoal_date
        if (response.data.data[0].studio_model) {
          this.modelGoal.stdmod_id = {
            label: response.data.data[0].studio_model.stdmod_id,
            value: response.data.data[0].studio_model.stdmod_id,
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
      // studiosModels
      this.studiosModels = []
      this.studiosModels.push({
        label: '',
        value: '',
      })
      // async
      response = await StudioModelService.getStudiosModels({ token: this.decryptSession('token') })
      for (var u = 0; u < response.data.data.length; u++) {
        this.studiosModels.push({
          label: response.data.data[u].stdmod_id,
          value: response.data.data[u].stdmod_id,
        })
      }

      // pre-select from dialog parent
      if (this.isDialog) {
        for (var dp = 0; dp < this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))].length; dp++) {
          if (parseInt(this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))][dp].value) === parseInt(this.parentId)) {
            this.modelGoal[this.parentField] = {
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

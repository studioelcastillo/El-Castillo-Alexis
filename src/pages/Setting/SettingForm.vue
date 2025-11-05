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
                <q-btn color="black" @click="goTo('settings')" :label="'&lt; ' + 'Regresar'" />
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
                  <q-input
                    filled
                    type=""
                    v-model="setting.key"
                    label="Clave"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.key"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="setting.value"
                    label="Valor"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.value"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input v-if="mode == 'show'" filled type="" label="Activo" label-color="primary" readonly>
                    <template v-slot:append>
                      <q-chip v-if="setting.active" color="green-3">SI</q-chip>
                      <q-chip v-else color="red-3">NO</q-chip>
                    </template>
                  </q-input>
                  <q-toggle
                    v-else
                    v-model="setting.active"
                    color="green"
                    :label="(setting.active) ? 'Activo' : 'Inactivo'"
                    checked-icon="check"
                    unchecked-icon="clear"
                  />
                  <br>
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="setting.default"
                    label="Valor por defecto"
                    label-color=""
                    lazy-rules
                    :rules="[
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.default"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type="number"
                    v-model="setting.year"
                    label="Año"
                    label-color=""
                    lazy-rules
                    :rules="[
                    ]"
                    :readonly="mode == 'show' || readonlyFields.year"
                  />
                  <br>
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    v-model="setting.since"
                    label="Desde"
                    label-color=""
                    mask="date"
                    :rules="[
                    val => this.validateDateFormat(val) || 'El formato de fecha no es válida',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.since"
                  >
                    <template v-slot:append>
                      <q-icon name="event" class="cursor-pointer">
                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                          <q-date v-model="setting.since">
                            <div class="row items-center justify-end">
                              <q-btn v-close-popup label="Close" color="primary" flat />
                            </div>
                          </q-date>
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    v-model="setting.until"
                    label="Hasta"
                    label-color=""
                    mask="date"
                    :rules="[
                    val => this.validateDateFormat(val) || 'El formato de fecha no es válida',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.until"
                  >
                    <template v-slot:append>
                      <q-icon name="event" class="cursor-pointer">
                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                          <q-date v-model="setting.until">
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
                <q-btn v-else @click="(isDialog) ? this.$emit('close') : goTo('settings')" label="Cancelar" />
              </div>
            </q-card-section>
            <q-card-section v-else-if="mode == 'show'">
              <div>
                <q-btn v-if="openGate('edit-settings', sUser.prof_id)" class="bg-primary text-white submit1" label="Editar" @click="this.mode = 'edit'" />
              </div>
            </q-card-section>
          </q-form>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script>
import SettingService from 'src/services/SettingService'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'SettingForm',
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
      initTitle: 'Crear campo config.',
      setting: {
        id: 0,
        key: '',
        value: '',
        active: true,
        default: '',
        year: '',
        since: '',
        until: '',
        created_at: '',
      },
      readonlyFields: {
        key: false,
        value: false,
        active: false,
        default: false,
        year: false,
        since: false,
        until: false,
        created_at: false,
      },
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
      this.setting.id = (this.isDialog) ? this.dialogChildId : this.$route.params.id
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
          var record = await SettingService.addSetting({
            sett_key: this.setting.key,
            sett_value: this.setting.value,
            sett_active: this.setting.active,
            sett_default: this.setting.default,
            sett_year: this.setting.year,
            sett_since: this.setting.since,
            sett_until: this.setting.until,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Creado')
          this.setting.id = record.data.data.sett_id
        } else if (this.mode === 'edit') {
          var record = await SettingService.editSetting({
            id: (this.isDialog) ? this.dialogChildId : this.setting.id,
            sett_key: this.setting.key,
            sett_value: this.setting.value,
            sett_active: this.setting.active,
            sett_default: this.setting.default,
            sett_year: this.setting.year,
            sett_since: this.setting.since,
            sett_until: this.setting.until,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Actualizado')
        }
        // if can edit >> edit, else >> show
        this.mode = (this.openGate('edit-settings', this.sUser.prof_id)) ? 'edit' : 'show'
        if (this.isDialog) {
          this.$emit('save')
          this.$emit('close')
        } else {
          this.goTo('settings/' + this.mode + '/' + this.setting.id)
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
        this.initTitle = 'Editar campo config.'
      } else if (this.mode === 'show') {
        this.initTitle = 'Ver campo config.'
      }

      try {
        this.activateLoading('Cargando')
        var response = await SettingService.getSetting({ id: this.setting.id, token: this.decryptSession('token') })
        this.setting.id = response.data.data[0].sett_id
        this.setting.key = response.data.data[0].sett_key
        this.setting.value = response.data.data[0].sett_value
        this.setting.active = response.data.data[0].sett_active
        this.setting.default = response.data.data[0].sett_default
        this.setting.year = response.data.data[0].sett_year
        this.setting.since = response.data.data[0].sett_since
        this.setting.until = response.data.data[0].sett_until
        this.setting.created_at = response.data.data[0].created_at

        this.disableLoading()
      } catch (error) {
        this.errorsAlerts(error)
        this.disableLoading()
      }
    },
    async getSelects () {
      var response
      // pre-select from dialog parent
      if (this.isDialog) {
        for (var dp = 0; dp < this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))].length; dp++) {
          if (parseInt(this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))][dp].value) === parseInt(this.parentId)) {
            this.setting[this.parentField] = {
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

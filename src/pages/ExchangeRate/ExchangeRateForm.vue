<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card"  v-if="this.openGate('add-exchanges_rates', this.sUser.prof_id) || 
          (this.openGate('show-exchanges_rates', this.sUser.prof_id) && this.mode == 'show') || 
          (this.openGate('edit-exchanges_rates', this.sUser.prof_id) && this.mode == 'edit')">
          <q-form
              @submit="onSubmit"
              class="q-gutter-md"
            >
            <q-card-section v-if="!isDialog">
              <div class="q-px-md q-gutter-sm">
                <q-btn color="black" @click="goTo('exchanges_rates')" :label="'&lt; ' + 'Regresar'" />
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
                    v-model="exchangeRate.date"
                    label="Fecha"
                    label-color="primary"
                    mask="date"
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                    val => this.validateDateFormat(val) || 'El formato de fecha no es válida',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.date"
                  >
                    <template v-slot:append>
                      <q-icon name="event" class="cursor-pointer">
                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                          <q-date v-model="exchangeRate.date">
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
                  <q-select
                    filled
                    v-model="exchangeRate.from"
                    label="Moneda origen"
                    label-color="primary"
                    :options="['', 'USD', 'EUR']"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.from"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-select
                    filled
                    v-model="exchangeRate.to"
                    label="Moneda destino"
                    label-color="primary"
                    :options="['', 'COP']"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.to"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type="number"
                    v-model="exchangeRate.rate"
                    label="Tasa"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.rate"
                    step="any"
                    @update:model-value="exchangeRate.type = 'MANUAL'"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="exchangeRate.type"
                    label="Tipo"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.type"
                  />
                </div>

              </div>
            </q-card-section>

            <q-separator inset />

            <q-card-section v-if="(mode == 'create' || mode == 'edit') && exchangeRate.type !== 'AUTO'">
              <div>
                <q-btn type="submit" class="bg-primary text-white submit1" label="Enviar"/>
                <q-btn v-if="mode == 'edit'" @click="(isDialog) ? this.$emit('close') : this.mode = 'show';" label="Cancelar" />
                <q-btn v-else @click="(isDialog) ? this.$emit('close') : goTo('exchanges_rates')" label="Cancelar" />
              </div>
            </q-card-section>
            <q-card-section v-else-if="mode == 'show' && exchangeRate.type !== 'AUTO'">
              <div>
                <q-btn v-if="openGate('edit-exchanges_rates', sUser.prof_id)" class="bg-primary text-white submit1" label="Editar" @click="this.mode = 'edit'" />
              </div>
            </q-card-section>
          </q-form>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script>
import ExchangeRateService from 'src/services/ExchangeRateService'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'ExchangeRateForm',
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
      initTitle: 'Crear tasa de cambio',
      exchangeRate: {
        id: 0,
        date: '',
        from: '',
        to: 'COP',
        rate: '',
        type: 'MANUAL',
        created_at: '',
      },
      readonlyFields: {
        date: false,
        from: false,
        to: false,
        rate: false,
        type: true,
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
      this.exchangeRate.id = (this.isDialog) ? this.dialogChildId : this.$route.params.id
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
        if (this.mode === 'create' && this.openGate('add-exchanges_rates', this.sUser.prof_id)) {
          var record = await ExchangeRateService.addExchangeRate({
            exrate_date: this.exchangeRate.date,
            exrate_from: this.exchangeRate.from,
            exrate_to: this.exchangeRate.to,
            exrate_rate: this.exchangeRate.rate,
            exrate_type: this.exchangeRate.type,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Creado')
          this.exchangeRate.id = record.data.data.exrate_id
        } else if (this.mode === 'edit' && this.openGate('edit-exchanges_rates', this.sUser.prof_id)) {
          var record = await ExchangeRateService.editExchangeRate({
            id: (this.isDialog) ? this.dialogChildId : this.exchangeRate.id,
            exrate_date: this.exchangeRate.date,
            exrate_from: this.exchangeRate.from,
            exrate_to: this.exchangeRate.to,
            exrate_rate: this.exchangeRate.rate,
            exrate_type: this.exchangeRate.type,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Actualizado')
        }
        // if can edit >> edit, else >> show
        this.mode = (this.openGate('edit-exchanges_rates', this.sUser.prof_id)) ? 'edit' : 'show'
        if (this.isDialog) {
          this.$emit('save')
          this.$emit('close')
        } else {
          this.goTo('exchanges_rates/') //+ this.mode + '/' + this.exchangeRate.id
          this.getData()
        }
        this.disableLoading()
      } catch (error) {
        console.log(error)
        this.disableLoading()
        if (error.response && error.response.data && error.response.data.code && error.response.data.message) {
          if (error.response.data.code === 'UNEXPECTED_ERROR') {
            this.alert('negative', error.response.data.message)
          } else {
            this.alert('warning', error.response.data.message)
          }
        } else {
          this.errorsAlerts(error)
        }
      }
    },
    async getData () {
      if (this.mode === 'edit') {
        this.initTitle = 'Editar tasa de cambio'
      } else if (this.mode === 'show') {
        this.initTitle = 'Ver tasa de cambio'
      }

      try {
        this.activateLoading('Cargando')
        if ((this.openGate('show-exchanges_rates', this.sUser.prof_id) && this.mode == 'show') || (this.openGate('edit-exchanges_rates', this.sUser.prof_id) && this.mode == 'edit')) {
          var response = await ExchangeRateService.getExchangeRate({ id: this.exchangeRate.id, token: this.decryptSession('token') })
          this.exchangeRate.id = response.data.data[0].exrate_id
          this.exchangeRate.date = response.data.data[0].exrate_date
          this.exchangeRate.from = response.data.data[0].exrate_from
          this.exchangeRate.to = response.data.data[0].exrate_to
          this.exchangeRate.rate = response.data.data[0].exrate_rate
          this.exchangeRate.type = response.data.data[0].exrate_type
          this.exchangeRate.created_at = response.data.data[0].created_at
        }

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
            this.exchangeRate[this.parentField] = {
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

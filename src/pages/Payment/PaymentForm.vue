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
                <q-btn color="black" @click="goTo('payments')" :label="'&lt; ' + 'Regresar'" />
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
                    v-model="payment.payfile_id"
                    label="Cargue de pagos"
                    label-color="primary"
                    :options="paymentsFiles"
                    lazy-rules
                    :rules="[
                      val => !!val.value || 'Este campo es requerido',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.payfile_id"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-select
                    filled
                    v-model="payment.std_id"
                    label="Estudio"
                    label-color=""
                    :options="studios"
                    lazy-rules
                    :rules="[
                    ]"
                    :readonly="mode == 'show' || readonlyFields.std_id"
                  />
                  <br>
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-select
                    filled
                    v-model="payment.stdmod_id"
                    label="Modelo"
                    label-color=""
                    :options="studiosModels"
                    lazy-rules
                    :rules="[
                    ]"
                    :readonly="mode == 'show' || readonlyFields.stdmod_id"
                  />
                  <br>
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type="number"
                    v-model="payment.amount"
                    label="Monto pago"
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
                    v-model="payment.period_since"
                    label="Periodo (desde)"
                    label-color="primary"
                    mask="date"
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                    val => this.validateDateFormat(val) || 'El formato de fecha no es válida',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.period_since"
                  >
                    <template v-slot:append>
                      <q-icon name="event" class="cursor-pointer">
                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                          <q-date v-model="payment.period_since">
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
                    v-model="payment.period_until"
                    label="Periodo (hasta)"
                    label-color="primary"
                    mask="date"
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                    val => this.validateDateFormat(val) || 'El formato de fecha no es válida',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.period_until"
                  >
                    <template v-slot:append>
                      <q-icon name="event" class="cursor-pointer">
                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                          <q-date v-model="payment.period_until">
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
                <q-btn v-else @click="(isDialog) ? this.$emit('close') : goTo('payments')" label="Cancelar" />
              </div>
            </q-card-section>
            <q-card-section v-else-if="mode == 'show'">
              <div>
                <q-btn v-if="openGate('edit-payments', sUser.prof_id)" class="bg-primary text-white submit1" label="Editar" @click="this.mode = 'edit'" />
              </div>
            </q-card-section>
          </q-form>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script>
import PaymentService from 'src/services/PaymentService'
import StudioService from 'src/services/StudioService'
import StudioModelService from 'src/services/StudioModelService'
import PaymentFileService from 'src/services/PaymentFileService'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'PaymentForm',
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
      initTitle: 'Crear pago',
      payment: {
        id: 0,
        payfile_id: '',
        std_id: '',
        stdmod_id: '',
        amount: '',
        period_since: '',
        period_until: '',
        created_at: '',
      },
      readonlyFields: {
        payfile_id: false,
        std_id: false,
        stdmod_id: false,
        amount: false,
        period_since: false,
        period_until: false,
        created_at: false,
      },
      studios: [],
      studiosModels: [],
      paymentsFiles: [],
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
      this.payment.id = (this.isDialog) ? this.dialogChildId : this.$route.params.id
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
          var record = await PaymentService.addPayment({
            payfile_id: this.payment.payfile_id.value,
            std_id: this.payment.std_id.value,
            stdmod_id: this.payment.stdmod_id.value,
            pay_amount: this.payment.amount,
            pay_period_since: this.payment.period_since,
            pay_period_until: this.payment.period_until,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Creado')
          this.payment.id = record.data.data.pay_id
        } else if (this.mode === 'edit') {
          var record = await PaymentService.editPayment({
            id: (this.isDialog) ? this.dialogChildId : this.payment.id,
            payfile_id: this.payment.payfile_id.value,
            std_id: this.payment.std_id.value,
            stdmod_id: this.payment.stdmod_id.value,
            pay_amount: this.payment.amount,
            pay_period_since: this.payment.period_since,
            pay_period_until: this.payment.period_until,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Actualizado')
        }
        // if can edit >> edit, else >> show
        this.mode = (this.openGate('edit-payments', this.sUser.prof_id)) ? 'edit' : 'show'
        if (this.isDialog) {
          this.$emit('save')
          this.$emit('close')
        } else {
          this.goTo('payments/' + this.mode + '/' + this.payment.id)
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
        this.initTitle = 'Editar pago'
      } else if (this.mode === 'show') {
        this.initTitle = 'Ver pago'
      }

      try {
        this.activateLoading('Cargando')
        var response = await PaymentService.getPayment({ id: this.payment.id, token: this.decryptSession('token') })
        this.payment.id = response.data.data[0].pay_id
        this.payment.amount = response.data.data[0].pay_amount
        this.payment.period_since = response.data.data[0].pay_period_since
        this.payment.period_until = response.data.data[0].pay_period_until
        this.payment.created_at = response.data.data[0].created_at
        if (response.data.data[0].studio) {
          this.payment.std_id = {
            label: response.data.data[0].studio.std_name,
            value: response.data.data[0].studio.std_id,
          }
        }
        if (response.data.data[0].studio_model) {
          this.payment.stdmod_id = {
            label: response.data.data[0].studio_model.stdmod_id,
            value: response.data.data[0].studio_model.stdmod_id,
          }
        }
        if (response.data.data[0].payment_file) {
          this.payment.payfile_id = {
            label: response.data.data[0].payment_file.payfile_description,
            value: response.data.data[0].payment_file.payfile_id,
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

      // paymentsFiles
      this.paymentsFiles = []
      this.paymentsFiles.push({
        label: '',
        value: '',
      })
      // async
      response = await PaymentFileService.getPaymentsFiles({ token: this.decryptSession('token') })
      for (var u = 0; u < response.data.data.length; u++) {
        this.paymentsFiles.push({
          label: response.data.data[u].payfile_description,
          value: response.data.data[u].payfile_id,
        })
      }

      // pre-select from dialog parent
      if (this.isDialog) {
        for (var dp = 0; dp < this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))].length; dp++) {
          if (parseInt(this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))][dp].value) === parseInt(this.parentId)) {
            this.payment[this.parentField] = {
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

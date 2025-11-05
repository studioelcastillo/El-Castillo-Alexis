<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card">
          <q-form
              @submit="onSubmit"
              class="q-gutter-md"
            >
            <q-card-section v-if="!isDialog && false">
              <div class="q-px-md q-gutter-sm">
                <q-btn color="black" @click="goTo('models_streams')" :label="'&lt; ' + 'Regresar'" />
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
                    v-model="modelStream.modacc_id"
                    label="Cuenta"
                    label-color="primary"
                    :options="modelsAccounts"
                    lazy-rules
                    :rules="[
                      val => !!val.value || 'Este campo es requerido',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.modacc_id"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    v-model="modelStream.date"
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
                          <q-date v-model="modelStream.date">
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
                    type="number"
                    v-model="modelStream.earnings_tokens"
                    label="Tokens"
                    label-color=""
                    lazy-rules
                    step="any"
                    :rules="[
                    ]"
                    :readonly="mode == 'show' || readonlyFields.earnings_tokens"
                  />
                  <br>
                </div>
                <div class="col-xs-12 col-sm-12">
                  <q-radio v-model="typeEarning" val="usd" label="USD" />
                  <q-radio v-model="typeEarning" val="eur" label="EUR" />
                </div>

                <div class="col-xs-12 col-sm-12" v-if="typeEarning === 'usd'">
                  <q-input
                    filled
                    type="number"
                    v-model="modelStream.earnings_usd"
                    label="Ganancia (USD)"
                    label-color=""
                    lazy-rules
                    step="any"
                    :rules="[
                    ]"
                    :readonly="mode == 'show' || readonlyFields.earnings_usd"
                  />
                  <br>
                </div>

                <div class="col-xs-12 col-sm-12" v-if="typeEarning === 'eur'">
                  <q-input
                    filled
                    type="number"
                    v-model="modelStream.earnings_eur"
                    label="Ganancia (EUR)"
                    label-color=""
                    lazy-rules
                    step="any"
                    :rules="[
                    ]"
                    :readonly="mode == 'show' || readonlyFields.earnings_eur"
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
                <q-btn v-else @click="(isDialog) ? this.$emit('close') : goTo('models_streams')" label="Cancelar" />
              </div>
            </q-card-section>
            <q-card-section v-else-if="mode == 'show'">
              <div>
                <q-btn v-if="openGate('edit-models_streams', sUser.prof_id)" class="bg-primary text-white submit1" label="Editar" @click="this.mode = 'edit'" />
                <q-btn v-if="openGate('menu-models_accounts', sUser.prof_id)" class="bg-blue-6 text-white submit1 q-ml-sm" label="Ver Cuenta" @click="goTo('models_accounts/show/' + modelStream.modacc_id.value, '_blank')" />
              </div>
            </q-card-section>
          </q-form>
        </q-card>
        <ModelsStreamsCustomers v-if="(this.mode == 'show' || this.mode == 'edit') && modelStream.id > 0" :is-subgrid="true" :parent-mode="mode" parent-table="models_streams" parent-field="modstr_id" :parent-id="modelStream.id" />
      </div>
    </div>
  </div>
</template>

<script>
import ModelStreamService from 'src/services/ModelStreamService'
import ModelAccountService from 'src/services/ModelAccountService'
import ModelsStreamsCustomers from 'src/pages/ModelStreamCustomer/ModelsStreamsCustomers.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'ModelStreamForm',
  mixins: [xMisc, sGate],
  components: {
    ModelsStreamsCustomers,
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
    modelId: {
      type: Number,
      default: null
    }
  },
  data () {
    return {
      sUser: {},
      mode: (this.$route.params.id) ? 'edit' : 'create',
      initTitle: 'Crear stream',
      modelStream: {
        id: 0,
        modacc_id: '',
        date: '',
        period: '',
        earnings_tokens: '',
        earnings_usd: '',
        earnings_eur: '',
        created_at: '',
      },
      readonlyFields: {
        modacc_id: false,
        date: false,
        period: false,
        earnings_tokens: false,
        earnings_usd: false,
        earnings_eur: false,
        created_at: false,
      },
      modelsAccounts: [],
      typeEarning: 'usd'
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
      this.modelStream.id = (this.isDialog) ? this.dialogChildId : this.$route.params.id
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
          var record = await ModelStreamService.addModelStream({
            modacc_id: this.modelStream.modacc_id.value,
            modstr_date: this.modelStream.date,
            modstr_period: this.modelStream.period,
            modstr_earnings_tokens: this.modelStream.earnings_tokens,
            modstr_earnings_usd: (this.typeEarning == 'usd') ? this.modelStream.earnings_usd : null,
            modstr_earnings_eur: (this.typeEarning == 'eur') ? this.modelStream.earnings_eur : null,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Creado')
          this.modelStream.id = record.data.data.modstr_id
        } else if (this.mode === 'edit') {
          var record = await ModelStreamService.editModelStream({
            id: (this.isDialog) ? this.dialogChildId : this.modelStream.id,
            modacc_id: this.modelStream.modacc_id.value,
            modstr_date: this.modelStream.date,
            modstr_period: this.modelStream.period,
            modstr_earnings_tokens: this.modelStream.earnings_tokens,
            modstr_earnings_usd: (this.typeEarning == 'usd') ? this.modelStream.earnings_usd : null,
            modstr_earnings_eur: (this.typeEarning == 'eur') ? this.modelStream.earnings_eur : null,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Actualizado')
        }
        // if can edit >> edit, else >> show
        this.mode = (this.openGate('edit-models_streams', this.sUser.prof_id)) ? 'edit' : 'show'
        if (this.isDialog) {
          this.$emit('save')
          this.getData()
        } else {
          this.goTo('models_streams/' + this.mode + '/' + this.modelStream.id)
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
        this.initTitle = 'Editar stream'
      } else if (this.mode === 'show') {
        this.initTitle = 'Ver stream'
      }

      try {
        this.activateLoading('Cargando')
        var response = await ModelStreamService.getModelStream({ id: this.modelStream.id, token: this.decryptSession('token') })
        console.log(response)
        this.modelStream.id = response.data.data[0].modstr_id
        this.modelStream.date = response.data.data[0].modstr_date
        this.modelStream.period = response.data.data[0].modstr_period
        this.modelStream.earnings_tokens = response.data.data[0].modstr_earnings_tokens
        this.modelStream.earnings_usd = response.data.data[0].modstr_earnings_usd
        this.modelStream.earnings_eur = response.data.data[0].modstr_earnings_eur
        this.modelStream.created_at = response.data.data[0].created_at
        if (response.data.data[0].model_account) {
          this.modelStream.modacc_id = {
            label: response.data.data[0].model_account.modacc_username + ' (' + response.data.data[0].model_account.modacc_app + ')',
            value: response.data.data[0].model_account.modacc_id,
          }
        }
        if (this.modelStream.earnings_eur !== null && this.modelStream.earnings_usd === null) {
          this.typeEarning =  'eur'
        }

        this.disableLoading()
      } catch (error) {
        this.errorsAlerts(error)
        this.disableLoading()
      }
    },
    async getSelects () {
      var response
      // modelsAccounts
      this.modelsAccounts = []
      this.modelsAccounts.push({
        label: '',
        value: '',
      })
      // async
      response = await ModelAccountService.getModelsAccountsByModel({ id: this.modelId, token: this.decryptSession('token') })
      for (var u = 0; u < response.data.data.length; u++) {
        this.modelsAccounts.push({
          label: response.data.data[u].modacc_username + ' (' + response.data.data[u].modacc_app + ')',
          value: response.data.data[u].modacc_id,
        })
      }

      // pre-select from dialog parent
      if (this.isDialog) {
        for (var dp = 0; dp < this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))].length; dp++) {
          if (parseInt(this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))][dp].value) === parseInt(this.parentId)) {
            this.modelStream[this.parentField] = {
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

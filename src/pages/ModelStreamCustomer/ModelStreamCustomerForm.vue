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
                <q-btn color="black" @click="goTo('models_streams_customers')" :label="'&lt; ' + 'Regresar'" />
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
                    v-model="modelStreamCustomer.modstr_id"
                    label="Stream"
                    label-color="primary"
                    :options="modelsStreams"
                    lazy-rules
                    :rules="[
                      val => !!val.value || 'Este campo es requerido',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.modstr_id"
                  ></q-select>
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="modelStreamCustomer.name"
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
                    type=""
                    v-model="modelStreamCustomer.account"
                    label="Cuenta"
                    label-color=""
                    lazy-rules
                    :rules="[
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.account"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="modelStreamCustomer.website"
                    label="Sitio web"
                    label-color=""
                    lazy-rules
                    :rules="[
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.website"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="modelStreamCustomer.product"
                    label="Producto"
                    label-color=""
                    lazy-rules
                    :rules="[
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.product"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type="number"
                    v-model="modelStreamCustomer.price"
                    label="Precio"
                    label-color=""
                    lazy-rules
                    step="any"
                    :rules="[
                    ]"
                    :readonly="mode == 'show' || readonlyFields.price"
                  />
                  <br>
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type="number"
                    v-model="modelStreamCustomer.earnings"
                    label="Ganancia"
                    label-color="primary"
                    lazy-rules
                    step="any"
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.earnings"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="modelStreamCustomer.received_at"
                    label="Fecha de recibido"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.received_at"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type="number"
                    v-model="modelStreamCustomer.chat_duration"
                    label="Duración del chat (horas)"
                    label-color=""
                    lazy-rules
                    step="any"
                    :rules="[
                    ]"
                    :readonly="mode == 'show' || readonlyFields.chat_duration"
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
                <q-btn v-else @click="(isDialog) ? this.$emit('close') : goTo('models_streams_customers')" label="Cancelar" />
              </div>
            </q-card-section>
            <q-card-section v-else-if="mode == 'show'">
              <div>
                <q-btn v-if="openGate('edit-models_streams_customers', sUser.prof_id)" class="bg-primary text-white submit1" label="Editar" @click="this.mode = 'edit'" />
                <q-btn v-if="openGate('menu-models_streams', sUser.prof_id)" class="bg-blue-6 text-white submit1 q-ml-sm" label="Ver Stream" @click="goTo('models_streams/show/' + modelStreamCustomer.modstr_id.value, '_blank')" />
              </div>
            </q-card-section>
          </q-form>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script>
import ModelStreamCustomerService from 'src/services/ModelStreamCustomerService'
import ModelStreamService from 'src/services/ModelStreamService'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'ModelStreamCustomerForm',
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
      initTitle: 'Crear cliente',
      modelStreamCustomer: {
        id: 0,
        modstr_id: '',
        name: '',
        account: '',
        website: '',
        product: '',
        price: '',
        earnings: '',
        received_at: '',
        chat_duration: '',
        created_at: '',
      },
      readonlyFields: {
        modstr_id: false,
        name: false,
        account: false,
        website: false,
        product: false,
        price: false,
        earnings: false,
        received_at: false,
        chat_duration: false,
        created_at: false,
      },
      modelsStreams: [],
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
      this.modelStreamCustomer.id = (this.isDialog) ? this.dialogChildId : this.$route.params.id
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
          var record = await ModelStreamCustomerService.addModelStreamCustomer({
            modstr_id: this.modelStreamCustomer.modstr_id.value,
            modstrcus_name: this.modelStreamCustomer.name,
            modstrcus_account: this.modelStreamCustomer.account,
            modstrcus_website: this.modelStreamCustomer.website,
            modstrcus_product: this.modelStreamCustomer.product,
            modstrcus_price: this.modelStreamCustomer.price,
            modstrcus_earnings: this.modelStreamCustomer.earnings,
            modstrcus_received_at: this.modelStreamCustomer.received_at,
            modstrcus_chat_duration: this.modelStreamCustomer.chat_duration,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Creado')
          this.modelStreamCustomer.id = record.data.data.modstrcus_id
        } else if (this.mode === 'edit') {
          var record = await ModelStreamCustomerService.editModelStreamCustomer({
            id: (this.isDialog) ? this.dialogChildId : this.modelStreamCustomer.id,
            modstr_id: this.modelStreamCustomer.modstr_id.value,
            modstrcus_name: this.modelStreamCustomer.name,
            modstrcus_account: this.modelStreamCustomer.account,
            modstrcus_website: this.modelStreamCustomer.website,
            modstrcus_product: this.modelStreamCustomer.product,
            modstrcus_price: this.modelStreamCustomer.price,
            modstrcus_earnings: this.modelStreamCustomer.earnings,
            modstrcus_received_at: this.modelStreamCustomer.received_at,
            modstrcus_chat_duration: this.modelStreamCustomer.chat_duration,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Actualizado')
        }
        // if can edit >> edit, else >> show
        this.mode = (this.openGate('edit-models_streams_customers', this.sUser.prof_id)) ? 'edit' : 'show'
        if (this.isDialog) {
          this.$emit('save')
          this.$emit('close')
        } else {
          this.goTo('models_streams_customers/' + this.mode + '/' + this.modelStreamCustomer.id)
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
        this.initTitle = 'Editar cliente'
      } else if (this.mode === 'show') {
        this.initTitle = 'Ver cliente'
      }

      try {
        this.activateLoading('Cargando')
        var response = await ModelStreamCustomerService.getModelStreamCustomer({ id: this.modelStreamCustomer.id, token: this.decryptSession('token') })
        this.modelStreamCustomer.id = response.data.data[0].modstrcus_id
        this.modelStreamCustomer.name = response.data.data[0].modstrcus_name
        this.modelStreamCustomer.account = response.data.data[0].modstrcus_account
        this.modelStreamCustomer.website = response.data.data[0].modstrcus_website
        this.modelStreamCustomer.product = response.data.data[0].modstrcus_product
        this.modelStreamCustomer.price = response.data.data[0].modstrcus_price
        this.modelStreamCustomer.earnings = response.data.data[0].modstrcus_earnings
        this.modelStreamCustomer.received_at = response.data.data[0].modstrcus_received_at
        this.modelStreamCustomer.chat_duration = response.data.data[0].modstrcus_chat_duration
        this.modelStreamCustomer.created_at = response.data.data[0].created_at
        if (response.data.data[0].model_stream) {
          this.modelStreamCustomer.modstr_id = {
            label: response.data.data[0].model_stream.modstr_id,
            value: response.data.data[0].model_stream.modstr_id,
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
      // modelsStreams
      this.modelsStreams = []
      this.modelsStreams.push({
        label: '',
        value: '',
      })
      // async
      response = await ModelStreamService.getModelsStreams({ token: this.decryptSession('token') })
      for (var u = 0; u < response.data.data.length; u++) {
        this.modelsStreams.push({
          label: response.data.data[u].modstr_id,
          value: response.data.data[u].modstr_id,
        })
      }

      // pre-select from dialog parent
      if (this.isDialog) {
        for (var dp = 0; dp < this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))].length; dp++) {
          if (parseInt(this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))][dp].value) === parseInt(this.parentId)) {
            this.modelStreamCustomer[this.parentField] = {
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

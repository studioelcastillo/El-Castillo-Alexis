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
                <q-btn color="black" @click="goTo('banks_accounts')" :label="'&lt; ' + 'Regresar'" />
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
                    v-model="bankAccount.std_id"
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
                  <q-select
                    filled
                    v-model="bankAccount.entity"
                    label="Entidad"
                    label-color="primary"
                    :options="['', 'BANCO DE BOGOTA', 'BANCO POPULAR', 'BANCOLOMBIA', 'BANCO BBVA', 'COLPATRIA', 'BANCO DE OCCIDENTE', 'BANCO CAJA SOCIAL', 'BANCO DAVIVIENDA', 'BANCO AV VILLAS', 'BANCOOMEVA', 'SCOTIABANK']"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.entity"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="bankAccount.number"
                    label="Nro. de cuenta"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.number"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-select
                    filled
                    v-model="bankAccount.type"
                    label="Tipo de cuenta"
                    label-color="primary"
                    :options="['', 'CORRIENTE', 'AHORRO']"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.type"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input v-if="mode == 'show'" filled type="" label="Cuenta principal" label-color="primary" readonly>
                    <template v-slot:append>
                      <q-chip v-if="bankAccount.main" color="green-3">SI</q-chip>
                      <q-chip v-else  color="red-3">NO</q-chip>
                    </template>
                  </q-input>
                  <q-toggle
                    v-else
                    v-model="bankAccount.main"
                    color="green"
                    :label="'Cuenta principal ' + (bankAccount.main ? '(SI)' : '(NO)')"
                    checked-icon="check"
                    unchecked-icon="clear"
                  />
                  <br>
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="bankAccount.beneficiary_name"
                    label="Nombre del beneficiario"
                    label-color=""
                    lazy-rules
                    :rules="[
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.beneficiary_name"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="bankAccount.beneficiary_document"
                    label="Nro. de identificación del beneficiario"
                    label-color=""
                    lazy-rules
                    :rules="[
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.beneficiary_document"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-select
                    filled
                    v-model="bankAccount.beneficiary_document_type"
                    label="Tipo de documento del beneficiario"
                    label-color=""
                    :options="['', 'CEDULA CUIDADANIA', 'CEDULA EXTRANJERIA', 'PASAPORTE', 'NIT', 'PPT']"
                    lazy-rules
                    :rules="[
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.beneficiary_document_type"
                  />
                </div>

              </div>
            </q-card-section>

            <q-separator inset />

            <q-card-section v-if="mode == 'create' || mode == 'edit'">
              <div>
                <q-btn type="submit" class="bg-primary text-white submit1" label="Enviar"/>
                <q-btn v-if="mode == 'edit'" @click="(isDialog) ? this.$emit('close') : this.mode = 'show';" label="Cancelar" />
                <q-btn v-else @click="(isDialog) ? this.$emit('close') : goTo('banks_accounts')" label="Cancelar" />
              </div>
            </q-card-section>
            <q-card-section v-else-if="mode == 'show'">
              <div>
                <q-btn v-if="openGate('edit-banks_accounts', sUser.prof_id)" class="bg-primary text-white submit1" label="Editar" @click="this.mode = 'edit'" />
              </div>
            </q-card-section>
          </q-form>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script>
import BankAccountService from 'src/services/BankAccountService'
import StudioService from 'src/services/StudioService'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'BankAccountForm',
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
      initTitle: 'Crear cuenta bancaria',
      bankAccount: {
        id: 0,
        std_id: '',
        entity: '',
        number: '',
        type: '',
        main: '',
        created_at: '',
        beneficiary_name: '',
        beneficiary_document: '',
        beneficiary_document_type: '',
      },
      readonlyFields: {
        std_id: false,
        entity: false,
        number: false,
        type: false,
        main: false,
        created_at: false,
        beneficiary_name: false,
        beneficiary_document: false,
        beneficiary_document_type: false,
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
      this.bankAccount.id = (this.isDialog) ? this.dialogChildId : this.$route.params.id
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
          var record = await BankAccountService.addBankAccount({
            std_id: this.bankAccount.std_id.value,
            bankacc_entity: this.bankAccount.entity,
            bankacc_number: this.bankAccount.number,
            bankacc_type: this.bankAccount.type,
            bankacc_main: this.bankAccount.main,
            bankacc_beneficiary_name: this.bankAccount.beneficiary_name,
            bankacc_beneficiary_document: this.bankAccount.beneficiary_document,
            bankacc_beneficiary_document_type: this.bankAccount.beneficiary_document_type,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Creado')
          this.bankAccount.id = record.data.data.bankacc_id
        } else if (this.mode === 'edit') {
          var record = await BankAccountService.editBankAccount({
            id: (this.isDialog) ? this.dialogChildId : this.bankAccount.id,
            std_id: this.bankAccount.std_id.value,
            bankacc_entity: this.bankAccount.entity,
            bankacc_number: this.bankAccount.number,
            bankacc_type: this.bankAccount.type,
            bankacc_main: this.bankAccount.main,
            bankacc_beneficiary_name: this.bankAccount.beneficiary_name,
            bankacc_beneficiary_document: this.bankAccount.beneficiary_document,
            bankacc_beneficiary_document_type: this.bankAccount.beneficiary_document_type,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Actualizado')
        }
        // if can edit >> edit, else >> show
        this.mode = (this.openGate('edit-banks_accounts', this.sUser.prof_id)) ? 'edit' : 'show'
        if (this.isDialog) {
          this.$emit('save')
          this.$emit('close')
        } else {
          this.goTo('banks_accounts/' + this.mode + '/' + this.bankAccount.id)
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
        this.initTitle = 'Editar cuenta bancaria'
      } else if (this.mode === 'show') {
        this.initTitle = 'Ver cuenta bancaria'
      }

      try {
        this.activateLoading('Cargando')
        var response = await BankAccountService.getBankAccount({ id: this.bankAccount.id, token: this.decryptSession('token') })
        this.bankAccount.id = response.data.data[0].bankacc_id
        this.bankAccount.entity = response.data.data[0].bankacc_entity
        this.bankAccount.number = response.data.data[0].bankacc_number
        this.bankAccount.type = response.data.data[0].bankacc_type
        this.bankAccount.main = response.data.data[0].bankacc_main
        this.bankAccount.created_at = response.data.data[0].created_at
        this.bankAccount.beneficiary_name = response.data.data[0].bankacc_beneficiary_name
        this.bankAccount.beneficiary_document = response.data.data[0].bankacc_beneficiary_document
        this.bankAccount.beneficiary_document_type = response.data.data[0].bankacc_beneficiary_document_type
        if (response.data.data[0].studio) {
          this.bankAccount.std_id = {
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
            this.bankAccount[this.parentField] = {
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

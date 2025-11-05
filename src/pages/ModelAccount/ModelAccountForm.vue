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
                <q-btn color="black" @click="goTo('models_accounts')" :label="'&lt; ' + 'Regresar'" />
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
                  <select-pages-options
                    v-model="modelAccount.app"
                    :mode="mode"
                    :readonly="mode != 'create' || readonlyFields.app"
                    :error-message="formSubmitted && !modelAccount.app ? 'Este campo es requerido' : ''"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="modelAccount.username"
                    label="Nombre de usuario"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.username"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="modelAccount.password"
                    label="Contraseña"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.password"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="modelAccount.payment_username"
                    label="Pseudónimo de pago"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="(mode != 'create' && !openGate('modify_payment_username', sUser.prof_id)) || readonlyFields.payment_username"
                  />
                </div>
                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="modelAccount.mail"
                    label="Correo"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 150) || 'Máximo 150 caracteres',
                      val => this.validarEmail(val) || 'Por favor escriba un correo real'
                    ]"
                    :readonly="!openGate('edit-mail-models_accounts', sUser.prof_id) || readonlyFields.mail"
                  />
                </div>
                <div class="col-xs-12 col-sm-12" v-if="modelAccount.app == 'XLOVECAM'">
                  <q-input
                    filled
                    type=""
                    v-model="modelAccount.linkacc"
                    label="Link de cuenta"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.linkacc"
                  />
                </div>
                <div class="col-xs-12 col-sm-12">
                  <q-input v-if="mode == 'show'" filled type="" label="Activo" label-color="primary" readonly>
                    <template v-slot:append>
                      <q-chip v-if="modelAccount.active" color="green-3">SI</q-chip>
                      <q-chip v-else color="red-3">NO</q-chip>
                    </template>
                  </q-input>
                  <q-toggle
                    v-else
                    v-model="modelAccount.active"
                    color="green"
                    :label="(modelAccount.active) ? 'Activo' : 'Inactivo'"
                    checked-icon="check"
                    unchecked-icon="clear"
                  />
                  <br>
                </div>
              </div>
            </q-card-section>

            <q-separator inset />

            <q-card-section v-if="mode == 'create' || mode == 'edit'">
              <div>
                <q-btn type="submit" @click="validatePage" class="bg-primary text-white submit1" label="Enviar"/>
                <q-btn v-if="mode == 'edit'" @click="(isDialog) ? this.$emit('close') : this.mode = 'show';" label="Cancelar" />
                <q-btn v-else @click="(isDialog) ? this.$emit('close') : goTo('models_accounts')" label="Cancelar" />
              </div>
            </q-card-section>
            <q-card-section v-else-if="mode == 'show' && false">
              <div>
                <q-btn v-if="openGate('edit-models_accounts', sUser.prof_id)" class="bg-primary text-white submit1" label="Editar" @click="this.mode = 'edit'" />
              </div>
            </q-card-section>
          </q-form>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script>
import ModelAccountService from 'src/services/ModelAccountService'
import SelectPagesOptions from 'src/components/SelectPagesOptions.vue'
import StudioModelService from 'src/services/StudioModelService'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'ModelAccountForm',
  mixins: [xMisc, sGate],
  components: { SelectPagesOptions },
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
      initTitle: 'Crear cuenta',
      modelAccount: {
        id: 0,
        stdmod_id: {},
        app: '',
        username: '',
        password: '',
        payment_username: '',
        mail: '',
        state: '',
        active: true,
        created_at: '',
        last_search_at: '',
        last_result_at: '',
        fail_message: '',
        fail_count: '',
        linkacc: ''
      },
      readonlyFields: {
        stdmod_id: false,
        app: false,
        username: false,
        password: false,
        payment_username: false,
        state: false,
        active: false,
        created_at: false,
        last_search_at: false,
        last_result_at: false,
        fail_message: false,
        fail_count: false,
        mail: false
      },
      studiosModels: [],
      formSubmitted: false
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

    // get id modelo
    this.modelAccount.stdmod_id.value = parseInt(this.parentId)

    if (this.mode === 'edit' || this.mode === 'show') {
      this.modelAccount.id = (this.isDialog) ? this.dialogChildId : this.$route.params.id
      this.getData()
    }
    // this.getSelects()
  },
  methods: {
    async onSubmit () {
      try {
        this.activateLoading('Cargando')
        // var response = {}
        // POST
        if (!this.modelAccount.app) {
          this.formSubmitted = true
          this.disableLoading()
          return
        }
        this.formSubmitted = false
        if (this.mode === 'create') {
          var record = await ModelAccountService.addModelAccount({
            stdmod_id: this.modelAccount.stdmod_id.value,
            modacc_app: this.modelAccount.app,
            modacc_username: this.modelAccount.username,
            modacc_password: this.modelAccount.password,
            modacc_payment_username: this.modelAccount.payment_username,
            modacc_mail: this.modelAccount.mail,
            modacc_state: this.modelAccount.state,
            modacc_active: this.modelAccount.active,
            modacc_last_search_at: this.modelAccount.last_search_at,
            modacc_last_result_at: this.modelAccount.last_result_at,
            modacc_fail_message: this.modelAccount.fail_message,
            modacc_fail_count: this.modelAccount.fail_count,
            modacc_linkacc: this.modelAccount.linkacc,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Creado')
          this.modelAccount.id = record.data.data.modacc_id
        } else if (this.mode === 'edit') {
          var record = await ModelAccountService.editModelAccount({
            id: (this.isDialog) ? this.dialogChildId : this.modelAccount.id,
            stdmod_id: this.modelAccount.stdmod_id.value,
            modacc_username: this.modelAccount.username,
            modacc_password: this.modelAccount.password,
            modacc_payment_username: this.modelAccount.payment_username,
            modacc_mail: this.modelAccount.mail,
            modacc_state: this.modelAccount.state,
            modacc_active: this.modelAccount.active,
            modacc_last_search_at: this.modelAccount.last_search_at,
            modacc_last_result_at: this.modelAccount.last_result_at,
            modacc_fail_message: this.modelAccount.fail_message,
            modacc_fail_count: this.modelAccount.fail_count,
            modacc_linkacc: this.modelAccount.linkacc,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Actualizado')
        }

        if (this.isDialog) {
          this.$emit('save')
          this.$emit('close')
          this.getData()
        } else {
          this.goTo('models_accounts/' + this.mode + '/' + this.modelAccount.id)
          this.getData()
        }
        // if can edit >> edit, else >> show
        this.mode = (this.openGate('edit-models_accounts', this.sUser.prof_id)) ? 'edit' : 'show'
        this.disableLoading()
      } catch (error) {
        // console.log(error)
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
        this.initTitle = 'Editar cuenta'
      } else if (this.mode === 'show') {
        this.initTitle = 'Ver cuenta'
      }
      try {
        this.activateLoading('Cargando')
        var response = await ModelAccountService.getModelAccount({ id: this.modelAccount.id, token: this.decryptSession('token') })
        this.modelAccount.id = response.data.data[0].modacc_id
        this.modelAccount.app = response.data.data[0].modacc_app
        this.modelAccount.username = response.data.data[0].modacc_username
        this.modelAccount.password = response.data.data[0].modacc_password
        this.modelAccount.payment_username = response.data.data[0].modacc_payment_username
        this.modelAccount.mail = response.data.data[0].modacc_mail
        this.modelAccount.active = response.data.data[0].modacc_active
        this.modelAccount.created_at = response.data.data[0].created_at
        this.modelAccount.linkacc = response.data.data[0].modacc_linkacc
        if (response.data.data[0].studio_model) {
          this.modelAccount.stdmod_id = {
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
    validatePage () {
      this.formSubmitted = (!this.modelAccount.app) ? true : false
    }
  }
}
</script>

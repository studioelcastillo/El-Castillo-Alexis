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
                <q-btn color="black" @click="goTo('studios_accounts')" :label="'&lt; ' + 'Regresar'" />
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
                    v-model="studioAccount.std_id"
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
                    v-model="studioAccount.app"
                    label="App"
                    label-color="primary"
                    :options="['', 'BIMBIM', 'BONGACAMS', 'CAM4', 'CAMS', 'CAMSODA ALIADOS', 'CHATURBATE', 'FLIRT4FREE', 'IMLIVE', 'LIVEJASMIN', 'MYDIRTYHOBBY', 'MYFREECAMS', 'SKYPRIVATE', 'STREAMATE', 'STREAMRAY', 'STRIPCHAT', 'XLOVECAM', 'XMODELS', 'ONLYFANS', 'XHAMSTER', 'CHERRY', 'DREAMCAM']"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.app"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="studioAccount.username"
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
                    type="password"
                    v-model="studioAccount.password"
                    label="Contraseña"
                    label-color=""
                    lazy-rules
                    :rules="[
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.password"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="studioAccount.apikey"
                    label="Api key"
                    label-color=""
                    lazy-rules
                    :rules="[
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.apikey"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input v-if="mode == 'show'" filled type="" label="Activo" label-color="primary" readonly>
                    <template v-slot:append>
                      <q-chip v-if="studioAccount.active" color="green-3">SI</q-chip>
                      <q-chip v-else color="red-3">NO</q-chip>
                    </template>
                  </q-input>
                  <q-toggle
                    v-else
                    v-model="studioAccount.active"
                    color="green"
                    :label="(studioAccount.active) ? 'Activo' : 'Inactivo'"
                    checked-icon="check"
                    unchecked-icon="clear"
                  />
                  <br>
                </div>

                <!-- <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="studioAccount.last_search_at"
                    label="Última consulta"
                    label-color=""
                    lazy-rules
                    :rules="[
                    ]"
                    :readonly="mode == 'show' || readonlyFields.last_search_at"
                  />
                  <br>
                </div> -->

                <!-- <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="studioAccount.last_result_at"
                    label="Última resultado"
                    label-color=""
                    lazy-rules
                    :rules="[
                    ]"
                    :readonly="mode == 'show' || readonlyFields.last_result_at"
                  />
                  <br>
                </div> -->

                <!-- <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type="textarea"
                    v-model="studioAccount.fail_message"
                    label="Mensaje de fallo"
                    label-color=""
                    lazy-rules
                    :rules="[
                    ]"
                    :readonly="mode == 'show' || readonlyFields.fail_message"
                  />
                  <br>
                </div> -->

                <!-- <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type="number"
                    v-model="studioAccount.fail_count"
                    label="Conteo de fallos"
                    label-color=""
                    lazy-rules
                    :rules="[
                    ]"
                    :readonly="mode == 'show' || readonlyFields.fail_count"
                  />
                  <br>
                </div> -->

              </div>
            </q-card-section>

            <q-separator inset />

            <q-card-section v-if="mode == 'create' || mode == 'edit'">
              <div>
                <q-btn type="submit" class="bg-primary text-white submit1" label="Enviar"/>
                <q-btn v-if="mode == 'edit'" @click="(isDialog) ? this.$emit('close') : this.mode = 'show';" label="Cancelar" />
                <q-btn v-else @click="(isDialog) ? this.$emit('close') : goTo('studios_accounts')" label="Cancelar" />
              </div>
            </q-card-section>
            <q-card-section v-else-if="mode == 'show'">
              <div>
                <q-btn v-if="openGate('edit-studios_accounts', sUser.prof_id)" class="bg-primary text-white submit1" label="Editar" @click="this.mode = 'edit'" />
              </div>
            </q-card-section>
          </q-form>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script>
import StudioAccountService from 'src/services/StudioAccountService'
import StudioService from 'src/services/StudioService'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'StudioAccountForm',
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
      initTitle: 'Crear cuenta master',
      studioAccount: {
        id: 0,
        std_id: '',
        app: '',
        username: '',
        password: '',
        apikey: '',
        active: true,
        last_search_at: '',
        last_result_at: '',
        fail_message: '',
        fail_count: '',
        created_at: '',
      },
      readonlyFields: {
        std_id: false,
        app: false,
        username: false,
        password: false,
        apikey: false,
        active: false,
        last_search_at: false,
        last_result_at: false,
        fail_message: false,
        fail_count: false,
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
      this.studioAccount.id = (this.isDialog) ? this.dialogChildId : this.$route.params.id
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
          var record = await StudioAccountService.addStudioAccount({
            std_id: this.studioAccount.std_id.value,
            stdacc_app: this.studioAccount.app,
            stdacc_username: this.studioAccount.username,
            stdacc_password: this.studioAccount.password,
            stdacc_apikey: this.studioAccount.apikey,
            stdacc_active: this.studioAccount.active,
            stdacc_last_search_at: this.studioAccount.last_search_at,
            stdacc_last_result_at: this.studioAccount.last_result_at,
            stdacc_fail_message: this.studioAccount.fail_message,
            stdacc_fail_count: this.studioAccount.fail_count,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Creado')
          this.studioAccount.id = record.data.data.stdacc_id
        } else if (this.mode === 'edit') {
          var record = await StudioAccountService.editStudioAccount({
            id: (this.isDialog) ? this.dialogChildId : this.studioAccount.id,
            std_id: this.studioAccount.std_id.value,
            stdacc_app: this.studioAccount.app,
            stdacc_username: this.studioAccount.username,
            stdacc_password: this.studioAccount.password,
            stdacc_apikey: this.studioAccount.apikey,
            stdacc_active: this.studioAccount.active,
            stdacc_last_search_at: this.studioAccount.last_search_at,
            stdacc_last_result_at: this.studioAccount.last_result_at,
            stdacc_fail_message: this.studioAccount.fail_message,
            stdacc_fail_count: this.studioAccount.fail_count,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Actualizado')
        }
        // if can edit >> edit, else >> show
        this.mode = (this.openGate('edit-studios_accounts', this.sUser.prof_id)) ? 'edit' : 'show'
        if (this.isDialog) {
          this.$emit('save')
          this.$emit('close')
        } else {
          this.goTo('studios_accounts/' + this.mode + '/' + this.studioAccount.id)
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
        this.initTitle = 'Editar cuenta master'
      } else if (this.mode === 'show') {
        this.initTitle = 'Ver cuenta master'
      }

      try {
        this.activateLoading('Cargando')
        var response = await StudioAccountService.getStudioAccount({ id: this.studioAccount.id, token: this.decryptSession('token') })
        this.studioAccount.id = response.data.data[0].stdacc_id
        this.studioAccount.app = response.data.data[0].stdacc_app
        this.studioAccount.username = response.data.data[0].stdacc_username
        this.studioAccount.password = response.data.data[0].stdacc_password
        this.studioAccount.apikey = response.data.data[0].stdacc_apikey
        this.studioAccount.active = response.data.data[0].stdacc_active
        this.studioAccount.last_search_at = response.data.data[0].stdacc_last_search_at
        this.studioAccount.last_result_at = response.data.data[0].stdacc_last_result_at
        this.studioAccount.fail_message = response.data.data[0].stdacc_fail_message
        this.studioAccount.fail_count = response.data.data[0].stdacc_fail_count
        this.studioAccount.created_at = response.data.data[0].created_at
        if (response.data.data[0].studio) {
          this.studioAccount.std_id = {
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
            this.studioAccount[this.parentField] = {
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

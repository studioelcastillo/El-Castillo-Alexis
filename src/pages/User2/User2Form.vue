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
                <q-btn color="black" @click="goTo('users2')" :label="'&lt; ' + 'Regresar'" />
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
                    v-model="user2.prof_id"
                    label="Perfil"
                    label-color="primary"
                    :options="profiles"
                    lazy-rules
                    :rules="[
                      val => !!val.value || 'Este campo es requerido',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.prof_id"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="user2.identification"
                    label="Identificación"
                    label-color=""
                    lazy-rules
                    :rules="[
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.identification"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="user2.name"
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
                    v-model="user2.surname"
                    label="user_surname"
                    label-color=""
                    lazy-rules
                    :rules="[
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.surname"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type="email"
                    v-model="user2.email"
                    label="Email"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validarEmail(val) || 'Por favor escriba un correo real',
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.email"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="user2.password"
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
                  <q-input v-if="mode == 'show'" filled type="" label="Activo" label-color="primary" readonly>
                    <template v-slot:append>
                      <q-chip v-if="user2.active" color="green-3">SI</q-chip>
                      <q-chip v-else color="red-3">NO</q-chip>
                    </template>
                  </q-input>
                  <q-toggle
                    v-else
                    v-model="user2.active"
                    color="green"
                    :label="(user2.active) ? 'Activo' : 'Inactivo'"
                    checked-icon="check"
                    unchecked-icon="clear"
                  />
                  <br>
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type="textarea"
                    v-model="user2.token_recovery_password"
                    label="user_token_recovery_password"
                    label-color=""
                    lazy-rules
                    :rules="[
                    ]"
                    :readonly="mode == 'show' || readonlyFields.token_recovery_password"
                  />
                  <br>
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="user2.telephone"
                    label="user_telephone"
                    label-color=""
                    lazy-rules
                    :rules="[
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.telephone"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="user2.address"
                    label="Dirección"
                    label-color=""
                    lazy-rules
                    :rules="[
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.address"
                  />
                </div>

              </div>
            </q-card-section>

            <q-separator inset />

            <q-card-section v-if="mode == 'create' || mode == 'edit'">
              <div>
                <q-btn type="submit" class="bg-primary text-white submit1" label="Enviar"/>
                <q-btn v-if="mode == 'edit'" @click="(isDialog) ? this.$emit('close') : this.mode = 'show';" label="Cancelar" />
                <q-btn v-else @click="(isDialog) ? this.$emit('close') : goTo('users2')" label="Cancelar" />
              </div>
            </q-card-section>
            <q-card-section v-else-if="mode == 'show'">
              <div>
                <q-btn v-if="openGate('edit-users2', sUser.prof_id)" class="bg-primary text-white submit1" label="Editar" @click="this.mode = 'edit'" />
              </div>
            </q-card-section>
          </q-form>
        </q-card>
        <UsersPermissions2 v-if="(this.mode == 'show' || this.mode == 'edit') && user2.id > 0" :is-subgrid="true" :parent-mode="mode" parent-table="users2" parent-field="user_id" :parent-id="user2.id" />
      </div>
    </div>
  </div>
</template>

<script>
import User2Service from 'src/services/User2Service'
import ProfileService from 'src/services/ProfileService'
import UsersPermissions2 from 'src/pages/UserPermission2/UsersPermissions2.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'User2Form',
  mixins: [xMisc, sGate],
  components: {
    UsersPermissions2,
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
      initTitle: 'Crear usuario',
      user2: {
        id: 0,
        prof_id: '',
        identification: '',
        name: '',
        surname: '',
        email: '',
        password: '',
        active: true,
        token_recovery_password: '',
        telephone: '',
        address: '',
        created_at: '',
      },
      readonlyFields: {
        prof_id: false,
        identification: false,
        name: false,
        surname: false,
        email: false,
        password: false,
        active: false,
        token_recovery_password: false,
        telephone: false,
        address: false,
        created_at: false,
      },
      profiles: [],
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
      this.user2.id = (this.isDialog) ? this.dialogChildId : this.$route.params.id
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
          var record = await User2Service.addUser2({
            prof_id: this.user2.prof_id.value,
            user_identification: this.user2.identification,
            user_name: this.user2.name,
            user_surname: this.user2.surname,
            user_email: this.user2.email,
            user_password: this.user2.password,
            user_active: this.user2.active,
            user_token_recovery_password: this.user2.token_recovery_password,
            user_telephone: this.user2.telephone,
            user_address: this.user2.address,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Creado')
          this.user2.id = record.data.data.user_id
        } else if (this.mode === 'edit') {
          var record = await User2Service.editUser2({
            id: (this.isDialog) ? this.dialogChildId : this.user2.id,
            prof_id: this.user2.prof_id.value,
            user_identification: this.user2.identification,
            user_name: this.user2.name,
            user_surname: this.user2.surname,
            user_email: this.user2.email,
            user_password: this.user2.password,
            user_active: this.user2.active,
            user_token_recovery_password: this.user2.token_recovery_password,
            user_telephone: this.user2.telephone,
            user_address: this.user2.address,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Actualizado')
        }
        // if can edit >> edit, else >> show
        this.mode = (this.openGate('edit-users2', this.sUser.prof_id)) ? 'edit' : 'show'
        if (this.isDialog) {
          this.$emit('save')
          this.getData()
        } else {
          this.goTo('users2/' + this.mode + '/' + this.user2.id)
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
        this.initTitle = 'Editar usuario'
      } else if (this.mode === 'show') {
        this.initTitle = 'Ver usuario'
      }

      try {
        this.activateLoading('Cargando')
        var response = await User2Service.getUser2({ id: this.user2.id, token: this.decryptSession('token') })
        this.user2.id = response.data.data[0].user_id
        this.user2.identification = response.data.data[0].user_identification
        this.user2.name = response.data.data[0].user_name
        this.user2.surname = response.data.data[0].user_surname
        this.user2.email = response.data.data[0].user_email
        this.user2.password = response.data.data[0].user_password
        this.user2.active = response.data.data[0].user_active
        this.user2.token_recovery_password = response.data.data[0].user_token_recovery_password
        this.user2.telephone = response.data.data[0].user_telephone
        this.user2.address = response.data.data[0].user_address
        this.user2.created_at = response.data.data[0].created_at
        if (response.data.data[0].profile) {
          this.user2.prof_id = {
            label: response.data.data[0].profile.prof_name,
            value: response.data.data[0].profile.prof_id,
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
      // profiles
      this.profiles = []
      this.profiles.push({
        label: '',
        value: '',
      })
      // async
      response = await ProfileService.getProfiles({ token: this.decryptSession('token') })
      for (var u = 0; u < response.data.data.length; u++) {
        this.profiles.push({
          label: response.data.data[u].prof_name,
          value: response.data.data[u].prof_id,
        })
      }

      // pre-select from dialog parent
      if (this.isDialog) {
        for (var dp = 0; dp < this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))].length; dp++) {
          if (parseInt(this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))][dp].value) === parseInt(this.parentId)) {
            this.user2[this.parentField] = {
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

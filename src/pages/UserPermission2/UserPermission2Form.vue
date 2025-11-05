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
                <q-btn color="black" @click="goTo('users_permissions2')" :label="'&lt; ' + 'Regresar'" />
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
                    v-model="userPermission2.user_id"
                    label="Usuario"
                    label-color="primary"
                    :options="users2"
                    lazy-rules
                    :rules="[
                      val => !!val.value || 'Este campo es requerido',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.user_id"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="userPermission2.feature"
                    label="Caracteristica"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.feature"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="userPermission2.state"
                    label="Estado"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.state"
                  />
                </div>

              </div>
            </q-card-section>

            <q-separator inset />

            <q-card-section v-if="mode == 'create' || mode == 'edit'">
              <div>
                <q-btn type="submit" class="bg-primary text-white submit1" label="Enviar"/>
                <q-btn v-if="mode == 'edit'" @click="(isDialog) ? this.$emit('close') : this.mode = 'show';" label="Cancelar" />
                <q-btn v-else @click="(isDialog) ? this.$emit('close') : goTo('users_permissions2')" label="Cancelar" />
              </div>
            </q-card-section>
            <q-card-section v-else-if="mode == 'show'">
              <div>
                <q-btn v-if="openGate('edit-users_permissions2', sUser.prof_id)" class="bg-primary text-white submit1" label="Editar" @click="this.mode = 'edit'" />
              </div>
            </q-card-section>
          </q-form>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script>
import UserPermission2Service from 'src/services/UserPermission2Service'
import User2Service from 'src/services/User2Service'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'UserPermission2Form',
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
      initTitle: 'Crear permisos',
      userPermission2: {
        id: 0,
        user_id: '',
        feature: '',
        state: '',
        created_at: '',
      },
      readonlyFields: {
        user_id: false,
        feature: false,
        state: false,
        created_at: false,
      },
      users2: [],
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
      this.userPermission2.id = (this.isDialog) ? this.dialogChildId : this.$route.params.id
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
          var record = await UserPermission2Service.addUserPermission2({
            user_id: this.userPermission2.user_id.value,
            userperm_feature: this.userPermission2.feature,
            userperm_state: this.userPermission2.state,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Creado')
          this.userPermission2.id = record.data.data.userperm_id
        } else if (this.mode === 'edit') {
          var record = await UserPermission2Service.editUserPermission2({
            id: (this.isDialog) ? this.dialogChildId : this.userPermission2.id,
            user_id: this.userPermission2.user_id.value,
            userperm_feature: this.userPermission2.feature,
            userperm_state: this.userPermission2.state,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Actualizado')
        }
        // if can edit >> edit, else >> show
        this.mode = (this.openGate('edit-users_permissions2', this.sUser.prof_id)) ? 'edit' : 'show'
        if (this.isDialog) {
          this.$emit('save')
          this.$emit('close')
        } else {
          this.goTo('users_permissions2/' + this.mode + '/' + this.userPermission2.id)
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
        this.initTitle = 'Editar permisos'
      } else if (this.mode === 'show') {
        this.initTitle = 'Ver permisos'
      }

      try {
        this.activateLoading('Cargando')
        var response = await UserPermission2Service.getUserPermission2({ id: this.userPermission2.id, token: this.decryptSession('token') })
        this.userPermission2.id = response.data.data[0].userperm_id
        this.userPermission2.feature = response.data.data[0].userperm_feature
        this.userPermission2.state = response.data.data[0].userperm_state
        this.userPermission2.created_at = response.data.data[0].created_at
        if (response.data.data[0].user2) {
          this.userPermission2.user_id = {
            label: response.data.data[0].user2.user_name,
            value: response.data.data[0].user2.user_id,
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
      // users2
      this.users2 = []
      this.users2.push({
        label: '',
        value: '',
      })
      // async
      response = await User2Service.getUsers2({ token: this.decryptSession('token') })
      for (var u = 0; u < response.data.data.length; u++) {
        this.users2.push({
          label: response.data.data[u].user_name,
          value: response.data.data[u].user_id,
        })
      }

      // pre-select from dialog parent
      if (this.isDialog) {
        for (var dp = 0; dp < this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))].length; dp++) {
          if (parseInt(this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))][dp].value) === parseInt(this.parentId)) {
            this.userPermission2[this.parentField] = {
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

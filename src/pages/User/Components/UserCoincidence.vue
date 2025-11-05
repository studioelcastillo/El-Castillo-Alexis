<template>
  <q-dialog v-model="dialog" @hide="onDialogClose">
    <q-card style="width: 70%; max-width: 80vw;">
      <q-card-section>
        <div class="text-h6">Coincidencias encontradas</div>
      </q-card-section>

      <q-card-section>
        <q-table
          title="Usuarios"
          :columns="columns"
          :rows="dataset"
          rows-per-page-label="Registros por página"
          no-data-label="No hay registros disponibles"
        >
          <!-- body -->
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td key="user_identification" :props="props" :class="{ 'text-teal': user.identification === props.row.user_identification }">{{ props.row.user_identification }}</q-td>
              <q-td key="user_name" :props="props" :class="{ 'text-teal': user.name === props.row.user_name && user.surname === props.row.user_surname }"> {{ props.row.user_name }}</q-td>
              <q-td key="user_surname" :props="props" :class="{ 'text-teal': user.name === props.row.user_name && user.surname === props.row.user_surname }">{{ props.row.user_surname }}</q-td>
              <q-td key="user_birthdate" :props="props">{{ props.row.user_birthdate }}</q-td>
              <q-td key="action" :props="props" v-if="openGate('user-coincidence-unify', sUser.prof_id)">
                <a class="text-blue-8" style="cursor: pointer; padding: 5px;" @click="showModel(props.row.user_id)"> 
                  <q-icon size="md" name="visibility"/>
                  <q-tooltip :offset="[0, 10]">Ver</q-tooltip>
                </a>
                <a v-if="isCreating" class="text-yellow-8" style="cursor: pointer; padding: 5px;" @click="unifyWithUser(props.row.user_id)"> 
                  <q-icon size="md" name="merge"/>
                  <q-tooltip :offset="[0, 10]">Unificar</q-tooltip>
                </a>
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-card-section>
      <q-card-actions align="right">
        <div v-if="isSubmiting && !unsubmittable" class="col-xs-12 col-sm-12">
          <q-input v-model="skipDescription" filled type="textarea" label="Comentario omisi&oacute;n" />
        </div>
        <q-btn v-if="isSubmiting && !unsubmittable" flat label="Cerrar" color="primary" v-close-popup />
        <q-btn flat :label="(isSubmiting && !unsubmittable) ? 'Omisi&oacute;n' : 'Cerrar'" @click="skipAndSubmit" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'
import UserService from 'src/services/UserService'

export default {
  name: 'userCoincidence',
  mixins: [xMisc, sGate],
  props: {
    user: {
      type: Object,
      default: () => { return {} }
    },
    isCreating : {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      sUser: {},
      dialog: false,
      columns: [
        {
          name: 'user_identification',
          required: true,
          label: 'Identificación',
          align: 'left',
          field: row => row.user_identification,
          sortable: false
        },
        {
          name: 'user_name',
          required: true,
          label: 'Nombre',
          align: 'left',
          field: row => row.user_name,
          sortable: true
        },
        {
          name: 'user_surname',
          required: true,
          label: 'Apellido',
          align: 'left',
          field: row => row.user_surname,
          sortable: true
        },
        {
          name: 'user_birthdate',
          required: true,
          label: 'Fecha nacimiento',
          align: 'left',
          field: row => row.user_birthdate,
          sortable: false
        }
      ],
      dataset: [],
      skipDescription: '',
      isSubmiting: false,
      unsubmittable: false
    }
  },
  mounted () {
    this.sUser = this.decryptSession('user')
    if (this.openGate('user-coincidence-unify', this.sUser.prof_id)) {
      this.columns.push({
        name: 'action',
        required: false,
        label: 'Acciones',
        align: 'left',
        sortable: false
      })
    }
  },
  methods: {
    onDialogClose() {
      this.isSubmiting = false
    },
    async checkUsers () {
      try {
        const response = await UserService.getUsersCoincide({ user: this.user, token: this.decryptSession('token') })
        this.dataset = response.data.data
        this.unsubmittable = response.data.unsubmittable
      } catch (error) {
        console.log(error)
        this.disableLoading()
      }
    },
    showComponent () {
      this.checkUsers()
      this.dialog =  true
    },
    showModel (id) {
      var url = this.getFrontUrl('users/show/' + id)
      var win = window.open(url, '_blank')
      win.focus()
    },
    skipAndSubmit () {
      if (this.isSubmiting && !this.unsubmittable) {
        this.dialog = false
        this.isSubmiting = false
        this.$emit('submit-skip', this.skipDescription)
      }
    },
    unifyWithUser (userId) {
      this.$q.dialog({
        title: 'Confirmar',
        message: '¿Estás seguro de unificar con este usuario?, todos los datos no vacios sobreescribirán los datos del usuario a unificar.',
        cancel: 'Cancelar',
        ok: 'Aceptar',
        persistent: true
      }).onOk(async () => {
        try {
          this.activateLoading('Cargando')
          this.$emit('unify-user', userId)
          this.disableLoading()
        } catch (error) {
          this.activateLoading('Cargando')
          if (error.response && error.response.data && error.response.data.code && error.response.data.message) {
            if (error.response.data.code === 'UNEXPECTED_ERROR') {
              this.alert('negative', error.response.data.message)
            } else {
              this.alert('warning', error.response.data.message)
            }
          } else {
            this.errorsAlerts(error)
          }
          this.disableLoading()
        }
      }).onCancel(() => {
        // console.log('>>>> Cancel')
      })
    }
  }
}
</script>
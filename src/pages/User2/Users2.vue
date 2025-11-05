<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card">
          <q-card-section>
            <div class="text-h5 text-weight-bolder">
              users2
              <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('add-users2', sUser.prof_id)" class="text-green" style="cursor: pointer;" @click="(isSubgrid) ? openSubgridForm('create') : goTo('users2/new')"> <q-icon name="add_box"/> </a>
              <a class="text-blue" style="cursor: pointer;" @click="downloadExcel()"><q-icon name="move_to_inbox"/><q-tooltip :delay="100" :offset="[0, 10]">Descargar users2</q-tooltip></a>
            </div>
          </q-card-section>

          <q-separator inset />

          <q-card-section>
            <q-table
              title="users2"
              dense
              :columns="columns"
              :rows="dataset"
              :filter="filter"
              :loading="loading"
              :visible-columns="visibleColumns"
              rows-per-page-label="Registros por página"
              no-data-label="No hay registros disponibles"
            >
              <!-- header -->
              <template v-slot:top-right="props">
                <!-- filter -->
                <q-input borderless dense debounce="300" v-model="filter" placeholder="Buscar">
                  <template v-slot:append>
                    <q-icon name="search" />
                  </template>
                </q-input>
                <!-- visibleColumns -->
                <!-- <q-select
                  v-model="visibleColumns"
                  multiple
                  outlined
                  dense
                  options-dense
                  display-value="Columnas"
                  emit-value
                  map-options
                  :options="columns"
                  option-value="name"
                  options-cover
                  style="min-width: 150px"
                /> -->
                <!-- fullscreen -->
                <q-btn
                  flat round dense
                  :icon="props.inFullscreen ? 'fullscreen_exit' : 'fullscreen'"
                  @click="props.toggleFullscreen"
                  class="q-ml-md"
                />
              </template>
              <!-- body -->
              <template v-slot:body="props">
                <q-tr :props="props">
                  <q-td key="user_id" :props="props">{{ props.row.user_id }}</q-td>
                  <q-td key="profile.prof_name" :props="props">{{ (props.row.profile) ? props.row.profile.prof_name : null }}</q-td>
                  <q-td key="user_identification" :props="props">{{ props.row.user_identification }}</q-td>
                  <q-td key="user_name" :props="props">{{ props.row.user_name }}</q-td>
                  <q-td key="user_surname" :props="props">{{ props.row.user_surname }}</q-td>
                  <q-td key="user_email" :props="props">{{ props.row.user_email }}</q-td>
                  <q-td key="user_password" :props="props">{{ props.row.user_password }}</q-td>
                  <q-td key="user_active" :props="props">
                    <q-toggle
                      v-model="props.row.toggleActive"
                      @update:model-value="toggleActive(props.row)"
                      color="green"
                      checked-icon="check"
                      unchecked-icon="clear"
                    />
                  </q-td>
                  <q-td key="user_token_recovery_password" :props="props">{{ props.row.user_token_recovery_password }}</q-td>
                  <q-td key="user_telephone" :props="props">{{ props.row.user_telephone }}</q-td>
                  <q-td key="user_address" :props="props">{{ props.row.user_address }}</q-td>
                  <q-td key="created_at" :props="props">{{ convertUTCDateToLocalDate(props.row.created_at, 'DD/MM/YYYY hh:mm:ss a') }}</q-td>
                  <q-td key="action" :props="props">
                    <a v-if="openGate('show-users2', sUser.prof_id)" class="text-blue-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('show', props.row.user_id) : goTo('users2/show/' + props.row.user_id)"> <q-icon size="md" name="visibility"/>
                      <q-tooltip :offset="[0, 10]">Ver</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('edit-users2', sUser.prof_id)" class="text-blue-grey-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('edit', props.row.user_id) : goTo('users2/edit/' + props.row.user_id)"> <q-icon size="md" name="edit"/>
                      <q-tooltip :offset="[0, 10]">Editar</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('delete-users2', sUser.prof_id)" class="text-red" style="cursor: pointer;" @click="deleteDialog(props.row.user_id)"> <q-icon size="md" name="delete"/>
                      <q-tooltip :offset="[0, 10]">Eliminar</q-tooltip>
                    </a>
                  </q-td>
                </q-tr>
              </template>
            </q-table>
          </q-card-section>
        </q-card>

        <q-dialog v-if="isSubgrid" v-model="dialog">
          <q-card style="width: 100%;">
            <User2Form :is-dialog="true" :parent-table="parentTable" :parent-field="parentField" :parent-id="parentId" :dialog-child-id="dialogChildId" :modeprop="dialogMode" @save="getUsers2()" @close="dialogChildId = null; dialog = false"/>
          </q-card>
        </q-dialog>
      </div>
    </div>
  </div>
</template>

<script>
import User2Service from 'src/services/User2Service'
import User2Form from 'src/pages/User2/User2Form.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'Users2List',
  mixins: [xMisc, sGate],
  components: {
    User2Form
  },
  props: {
    isSubgrid: {
      type: Boolean,
      default: false
    },
    parentMode: {
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
    }
  },
  setup () {
    return {
    }
  },
  data () {
    return {
      sUser: {},
      loading: false,
      dialog: false,
      dialogMode: 'create',
      dialogChildId: null,
      dataset: [],
      filter: '',
      visibleColumns: ['prof_id', 'user_identification', 'user_name', 'user_surname', 'user_email', 'user_password', 'user_active', 'user_token_recovery_password', 'user_telephone', 'user_address', 'created_at'],
      columns: [
        {
          name: 'user_id',
          required: true,
          label: 'Id',
          align: 'left',
          field: row => row.user_id,
          sortable: true
        },
        {
          name: 'profile.prof_name',
          required: true,
          label: 'Perfil',
          align: 'left',
          field: row => (row.profile) ? row.profile.prof_name : null,
          sortable: true
        },
        {
          name: 'user_identification',
          required: true,
          label: 'Identificación',
          align: 'left',
          field: row => row.user_identification,
          sortable: true
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
          label: 'user_surname',
          align: 'left',
          field: row => row.user_surname,
          sortable: true
        },
        {
          name: 'user_email',
          required: true,
          label: 'Email',
          align: 'left',
          field: row => row.user_email,
          sortable: true
        },
        {
          name: 'user_password',
          required: true,
          label: 'Contraseña',
          align: 'left',
          field: row => row.user_password,
          sortable: true
        },
        {
          name: 'user_active',
          required: true,
          label: 'Activo',
          align: 'center',
          field: row => row.user_active,
          sortable: true
        },
        {
          name: 'user_token_recovery_password',
          required: true,
          label: 'user_token_recovery_password',
          align: 'left',
          field: row => row.user_token_recovery_password,
          sortable: true
        },
        {
          name: 'user_telephone',
          required: true,
          label: 'user_telephone',
          align: 'left',
          field: row => row.user_telephone,
          sortable: true
        },
        {
          name: 'user_address',
          required: true,
          label: 'Dirección',
          align: 'left',
          field: row => row.user_address,
          sortable: true
        },
        {
          name: 'created_at',
          required: true,
          label: 'Fecha creación',
          align: 'left',
          field: row => row.created_at,
          sortable: true
        },
        {
          name: 'action',
          required: true,
          label: 'Acciones',
          align: 'left',
          sortable: true
        }
      ]
    }
  },
  created () {
    this.sUser = this.decryptSession('user')
    this.getUsers2()
  },
  methods: {
    async getUsers2 () {
      try {
        this.loading = true
        let query = (this.isSubgrid) ? this.parentField + '=' + this.parentId : ''
        var response = await User2Service.getUsers2({ query: query, token: this.decryptSession('token') })
        this.dataset = response.data.data
        for (var i = 0; i < this.dataset.length; i++) {
          this.dataset[i].toggleActive = this.dataset[i].user_active
        }
        this.loading = false
      } catch (error) {
        this.errorsAlerts(error)
        this.loading = false
      }
    },
    openSubgridForm (mode, id) {
      this.dialogMode = mode
      this.dialogChildId = id
      this.dialog = true
    },
    deleteDialog (id) {
      this.$q.dialog({
        title: 'Confirmar',
        message: '¿Estás seguro de eliminar este registro?',
        cancel: 'Cancelar',
        ok: 'Aceptar',
        persistent: true
      }).onOk(() => {
        this.deleteData(id)
      }).onCancel(() => {
        // console.log('>>>> Cancel')
      })
    },
    async deleteData (id) {
      try {
        this.activateLoading('Cargando')
        var response = await User2Service.delUser2({ id: id, token: this.decryptSession('token') })
        if (response.data.status === 'success') {
          this.alert('positive', 'Eliminado')
          this.getUsers2()
        } else {
          this.alert('negative', 'Error')
        }
        this.disableLoading()
      } catch (error) {
        this.errorsAlerts(error)
        this.disableLoading()
      }
    },
    downloadExcel() {
      // query
      var query = ''
      if (this.isSubgrid) {
        query = '&' + this.parentField + '=' + this.parentId
      }
      // url
      var url = this.getApiUrl('/api/users2/export?access_token=' + this.decryptSession('token') + query)
      var win = window.open(url, '_blank')
      win.focus()      
    },
    async toggleActive (row) {
      var newState = row.toggleActive
      try {
        this.activateLoading(this.$t('loading'))

        // activate
        if (newState === true) {
          var response = await User2Service.activateUser2({ id: row.user_id, token: this.decryptSession('token') })
          var successMessage = this.$t('activated')
        // inactivate
        } else if (newState === false) {
          var response = await User2Service.inactivateUser2({ id: row.user_id, token: this.decryptSession('token') })
          var successMessage = this.$t('inactivated')
        }

        if (response.data.status === 'success') {
          this.alert('positive', successMessage)
          row.user_active = newState
          row.toggleActive = newState
        } else {
          this.alert('negative', this.$t('errorMessage'))
          row.user_active = !newState
          row.toggleActive = !newState
        }

        this.disableLoading()
      } catch (error) {
        console.log(error)
        row.user_active = !newState
        row.toggleActive = !newState
        this.errorsAlerts(error)
        this.disableLoading()
      }        
    }
  }
}
</script>
<style type="text/css">
  body {
    background: #ECF0F3;
  }
</style>

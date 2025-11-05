<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card">
          <q-card-section>
            <div class="text-h5 text-weight-bolder">
              Cuentas master
              <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('add-studios_accounts', sUser.prof_id)" class="text-green" style="cursor: pointer;" @click="(isSubgrid) ? openSubgridForm('create') : goTo('studios_accounts/new')"> <q-icon name="add_box"/> </a>
              <a class="text-blue" style="cursor: pointer;" @click="downloadExcel()"><q-icon name="move_to_inbox"/><q-tooltip :delay="100" :offset="[0, 10]">Descargar Cuentas master</q-tooltip></a>
            </div>
          </q-card-section>

          <q-separator inset />

          <q-card-section>
            <q-table
              title="Cuentas master"
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
                  <q-td key="stdacc_id" :props="props">{{ props.row.stdacc_id }}</q-td>
                  <q-td key="studio.std_name" :props="props">{{ (props.row.studio) ? props.row.studio.std_name : null }}</q-td>
                  <q-td key="stdacc_app" :props="props">{{ props.row.stdacc_app }}</q-td>
                  <q-td key="stdacc_username" :props="props">{{ props.row.stdacc_username }}</q-td>
                  <!-- <q-td key="stdacc_password" :props="props">{{ props.row.stdacc_password }}</q-td> -->
                  <q-td key="stdacc_apikey" :props="props">{{ props.row.stdacc_apikey }}</q-td>
                  <q-td key="stdacc_active" :props="props">
                    <q-toggle
                      v-model="props.row.toggleActive"
                      @update:model-value="toggleActive(props.row)"
                      color="green"
                      checked-icon="check"
                      unchecked-icon="clear"
                    />
                  </q-td>
                  <!-- <q-td key="stdacc_last_search_at" :props="props">{{ props.row.stdacc_last_search_at }}</q-td> -->
                  <!-- <q-td key="stdacc_last_result_at" :props="props">{{ props.row.stdacc_last_result_at }}</q-td> -->
                  <!-- <q-td key="stdacc_fail_message" :props="props">{{ props.row.stdacc_fail_message }}</q-td> -->
                  <!-- <q-td key="stdacc_fail_count" :props="props">{{ miles(props.row.stdacc_fail_count) }}</q-td> -->
                  <q-td key="created_at" :props="props">{{ convertUTCDateToLocalDate(props.row.created_at, 'DD/MM/YYYY hh:mm:ss a') }}</q-td>
                  <q-td key="action" :props="props">
                    <a v-if="openGate('show-studios_accounts', sUser.prof_id)" class="text-blue-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('show', props.row.stdacc_id) : goTo('studios_accounts/show/' + props.row.stdacc_id)"> <q-icon size="md" name="visibility"/>
                      <q-tooltip :offset="[0, 10]">Ver</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('edit-studios_accounts', sUser.prof_id)" class="text-blue-grey-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('edit', props.row.stdacc_id) : goTo('studios_accounts/edit/' + props.row.stdacc_id)"> <q-icon size="md" name="edit"/>
                      <q-tooltip :offset="[0, 10]">Editar</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('delete-studios_accounts', sUser.prof_id)" class="text-red" style="cursor: pointer;" @click="deleteDialog(props.row.stdacc_id)"> <q-icon size="md" name="delete"/>
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
            <StudioAccountForm :is-dialog="true" :parent-table="parentTable" :parent-field="parentField" :parent-id="parentId" :dialog-child-id="dialogChildId" :modeprop="dialogMode" @save="getStudiosAccounts()" @close="dialogChildId = null; dialog = false"/>
          </q-card>
        </q-dialog>
      </div>
    </div>
  </div>
</template>

<script>
import StudioAccountService from 'src/services/StudioAccountService'
import StudioAccountForm from 'src/pages/StudioAccount/StudioAccountForm.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'StudiosAccountsList',
  mixins: [xMisc, sGate],
  components: {
    StudioAccountForm
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
      visibleColumns: ['std_id', 'stdacc_app', 'stdacc_username', 'stdacc_password', 'stdacc_apikey', 'stdacc_active', 'stdacc_last_search_at', 'stdacc_last_result_at', 'stdacc_fail_message', 'stdacc_fail_count', 'created_at'],
      columns: [
        {
          name: 'stdacc_id',
          required: true,
          label: 'Id',
          align: 'left',
          field: row => row.stdacc_id,
          sortable: true
        },
        {
          name: 'studio.std_name',
          required: true,
          label: 'Estudio',
          align: 'left',
          field: row => (row.studio) ? row.studio.std_name : null,
          sortable: true
        },
        {
          name: 'stdacc_app',
          required: true,
          label: 'App',
          align: 'left',
          field: row => row.stdacc_app,
          sortable: true
        },
        {
          name: 'stdacc_username',
          required: true,
          label: 'Nombre de usuario',
          align: 'left',
          field: row => row.stdacc_username,
          sortable: true
        },
        // {
        //   name: 'stdacc_password',
        //   required: true,
        //   label: 'Contraseña',
        //   align: 'left',
        //   field: row => row.stdacc_password,
        //   sortable: true
        // },
        {
          name: 'stdacc_apikey',
          required: true,
          label: 'Api key',
          align: 'left',
          field: row => row.stdacc_apikey,
          sortable: true
        },
        {
          name: 'stdacc_active',
          required: true,
          label: 'Activo',
          align: 'center',
          field: row => row.stdacc_active,
          sortable: true
        },
        // {
        //   name: 'stdacc_last_search_at',
        //   required: true,
        //   label: 'Última consulta',
        //   align: 'left',
        //   field: row => row.stdacc_last_search_at,
        //   sortable: true
        // },
        // {
        //   name: 'stdacc_last_result_at',
        //   required: true,
        //   label: 'Última resultado',
        //   align: 'left',
        //   field: row => row.stdacc_last_result_at,
        //   sortable: true
        // },
        // {
        //   name: 'stdacc_fail_message',
        //   required: true,
        //   label: 'Mensaje de fallo',
        //   align: 'left',
        //   field: row => row.stdacc_fail_message,
        //   sortable: true
        // },
        // {
        //   name: 'stdacc_fail_count',
        //   required: true,
        //   label: 'Conteo de fallos',
        //   align: 'left',
        //   field: row => row.stdacc_fail_count,
        //   sortable: true
        // },
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
    this.getStudiosAccounts()
  },
  methods: {
    async getStudiosAccounts () {
      try {
        this.loading = true
        let query = (this.isSubgrid) ? this.parentField + '=' + this.parentId : ''
        var response = await StudioAccountService.getStudiosAccounts({ query: query, token: this.decryptSession('token') })
        this.dataset = response.data.data
        for (var i = 0; i < this.dataset.length; i++) {
          this.dataset[i].toggleActive = this.dataset[i].stdacc_active
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
        var response = await StudioAccountService.delStudioAccount({ id: id, token: this.decryptSession('token') })
        if (response.data.status === 'success') {
          this.alert('positive', 'Eliminado')
          this.getStudiosAccounts()
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
      var url = this.getApiUrl('/api/studios_accounts/export?access_token=' + this.decryptSession('token') + query)
      var win = window.open(url, '_blank')
      win.focus()      
    },
    async toggleActive (row) {
      var newState = row.toggleActive
      try {
        this.activateLoading(this.$t('loading'))

        // activate
        if (newState === true) {
          var response = await StudioAccountService.activateStudioAccount({ id: row.stdacc_id, token: this.decryptSession('token') })
          var successMessage = this.$t('activated')
        // inactivate
        } else if (newState === false) {
          var response = await StudioAccountService.inactivateStudioAccount({ id: row.stdacc_id, token: this.decryptSession('token') })
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

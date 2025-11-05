<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card">
          <q-card-section>
            <div class="text-h5 text-weight-bolder">
              Cuentas
              <a v-if="openGate('add-models_accounts', sUser.prof_id)" class="text-green" style="cursor: pointer;" @click="(isSubgrid) ? openSubgridForm('create') : goTo('models_accounts/new')"> <q-icon name="add_box"/> </a>
              <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('transfer-models_accounts', sUser.prof_id) && studiosModels.length > 0" class="text-blue" style="cursor: pointer;" @click="dialogChangeStudio = true"> <q-icon name="transfer_within_a_station"/> </a>
              <!--<a class="text-blue" style="cursor: pointer;" @click="downloadExcel()"><q-icon name="move_to_inbox"/><q-tooltip :delay="100" :offset="[0, 10]">Descargar Cuentas</q-tooltip></a>-->
            </div>
          </q-card-section>

          <q-separator inset />

          <q-card-section>
            <q-table
              title="Cuentas"
              dense
              :columns="columns"
              :rows="dataset"
              :filter="filter"
              :loading="loading"
              :visible-columns="visibleColumns"
              rows-per-page-label="Registros por página"
              no-data-label="No hay registros disponibles"
              v-model:pagination="pagination"
            >
              <!-- header -->
              <template v-slot:top-right="props">
                <!-- filter -->
                <q-input borderless dense debounce="300" v-model="filter" placeholder="Buscar">
                  <template v-slot:append>
                    <q-icon name="search" />
                  </template>
                </q-input>
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
                  <!--<q-td key="modacc_id" :props="props">{{ props.row.modacc_id }}</q-td>
                  <q-td key="stdmod_id" :props="props">{{ miles(props.row.stdmod_id) }}</q-td>-->
                  <q-td key="modacc_mail" :props="props">{{ props.row.modacc_mail }}</q-td>
                  <q-td key="modacc_app" :props="props">{{ props.row.modacc_app }}</q-td>
                  <q-td key="modacc_username" :props="props">{{ props.row.modacc_username }}</q-td>
                  <q-td key="modacc_password" :props="props">{{ props.row.modacc_password }}</q-td>
                  <q-td key="modacc_payment_username" :props="props">{{ props.row.modacc_payment_username }}</q-td>
                  <!--<q-td key="modacc_state" :props="props">
                    <q-chip>{{ props.row.modacc_state }}</q-chip>
                  </q-td>-->
                  <q-td key="modacc_active" :props="props">
                    <q-toggle
                      v-if="openGate('edit-models_accounts', sUser.prof_id)"
                      v-model="props.row.toggleActive"
                      @update:model-value="toggleActive(props.row)"
                      color="green"
                      checked-icon="check"
                      unchecked-icon="clear"
                    />
                    <div v-else>
                      <q-chip v-if="props.row.toggleActive" color="green-3">SI</q-chip>
                      <q-chip v-else color="red-3">NO</q-chip>  
                    </div>
                  </q-td>
                  <q-td key="created_at" :props="props">{{ convertUTCDateToLocalDate(props.row.created_at, 'DD/MM/YYYY hh:mm:ss a') }}</q-td>
                  <!--<q-td key="modacc_last_search_at" :props="props">{{ props.row.modacc_last_search_at }}</q-td>
                  <q-td key="modacc_last_result_at" :props="props">{{ props.row.modacc_last_result_at }}</q-td>
                  <q-td key="modacc_fail_count" :props="props">{{ miles(props.row.modacc_fail_count) }}</q-td>-->
                  <q-td key="action" :props="props">
                    <a v-if="openGate('show-models_accounts', sUser.prof_id)" class="text-blue-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('show', props.row.modacc_id) : goTo('models_accounts/show/' + props.row.modacc_id)"> <q-icon size="md" name="visibility"/>
                      <q-tooltip :offset="[0, 10]">Ver</q-tooltip>
                    </a>
                    <a v-if="openGate('edit-models_accounts', sUser.prof_id)" class="text-blue-grey-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('edit', props.row.modacc_id) : goTo('models_accounts/edit/' + props.row.modacc_id)"> <q-icon size="md" name="edit"/>
                      <q-tooltip :offset="[0, 10]">Editar</q-tooltip>
                    </a>
                    <a v-if="openGate('delete-models_accounts', sUser.prof_id)" class="text-red" style="cursor: pointer;" @click="deleteDialog(props.row.modacc_id)"> <q-icon size="md" name="delete"/>
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
            <ModelAccountForm :is-dialog="true" :parent-table="parentTable" :parent-field="parentField" :parent-id="parentId" :dialog-child-id="dialogChildId" :modeprop="dialogMode" @save="getModelsAccounts()" @close="dialogChildId = null; dialog = false"/>
          </q-card>
        </q-dialog>
        <q-dialog v-if="studiosModels.length > 0" v-model="dialogChangeStudio">
          <q-card style="width: 100%;">
            <div class="q-pa-md">
              <div class="row">
                <div class="col-12">
                  <q-card flat bordered class="my-card">
                    <q-card-section class="row items-center q-pb-none">
                      <h5 class="is-size-3">Transladar cuentas a contrato</h5>
                      <q-space />
                      <q-btn icon="close" flat round dense v-close-popup />
                    </q-card-section>
                    <q-card-section>
                      <q-select
                        filled
                        label="Contrato"
                        v-model="studioModelToChange"
                        :options="studiosModels"
                        label-color=""
                        lazy-rules
                      />
                    </q-card-section>
                    <q-card-section>
                      <div>
                        <q-btn class="bg-primary text-white submit1" label="Enviar" @click="changeAccountsContract(null)" />
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </div>
          </q-card>
        </q-dialog>
      </div>
    </div>
  </div>
</template>

<script>
import StudioModelService from 'src/services/StudioModelService'
import ModelAccountService from 'src/services/ModelAccountService'
import ModelAccountForm from 'src/pages/ModelAccount/ModelAccountForm.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'ModelsAccountsList',
  mixins: [xMisc, sGate],
  components: {
    ModelAccountForm
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
      visibleColumns: ['modacc_mail', 'modacc_app', 'modacc_username', 'modacc_password', 'modacc_state', 'modacc_active', 'created_at', 'modacc_last_search_at', 'modacc_last_result_at', 'modacc_fail_message', 'modacc_fail_count'],
      columns: [
        {
          name: 'modacc_id',
          required: false,
          label: 'Id',
          align: 'left',
          field: row => row.modacc_id,
          sortable: true
        },
        {
          name: 'stdmod_id',
          required: false,
          label: 'Modelo',
          align: 'left',
          field: row => row.stdmod_id,
          sortable: true
        },
        {
          name: 'modacc_mail',
          required: true,
          label: 'Correo',
          align: 'left',
          field: row => row.modacc_app,
          sortable: true
        },
        {
          name: 'modacc_app',
          required: true,
          label: 'Aplicación',
          align: 'left',
          field: row => row.modacc_app,
          sortable: true
        },
        {
          name: 'modacc_username',
          required: true,
          label: 'Nombre de usuario',
          align: 'left',
          field: row => row.modacc_username,
          sortable: true
        },
        {
          name: 'modacc_password',
          required: true,
          label: 'Contraseña',
          align: 'left',
          field: row => row.modacc_password,
          sortable: true
        },
        {
          name: 'modacc_payment_username',
          required: true,
          label: 'Nick de pago',
          align: 'left',
          field: row => row.modacc_payment_username,
          sortable: true
        },
        /*{
          name: 'modacc_state',
          required: true,
          label: 'Estado',
          align: 'left',
          field: row => row.modacc_state,
          sortable: true
        },*/
        {
          name: 'modacc_active',
          required: true,
          label: 'Activo',
          align: 'center',
          field: row => row.modacc_active,
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
       /* {
          name: 'modacc_last_search_at',
          required: true,
          label: 'Fecha última consulta',
          align: 'left',
          field: row => row.modacc_last_search_at,
          sortable: true
        },
        {
          name: 'modacc_last_result_at',
          required: true,
          label: 'Fecha de últimos resultados',
          align: 'left',
          field: row => row.modacc_last_result_at,
          sortable: true
        },
        {
          name: 'modacc_fail_count',
          required: true,
          label: 'Intentos fallidos',
          align: 'left',
          field: row => row.modacc_fail_count,
          sortable: true
        },*/
        {
          name: 'action',
          required: true,
          label: 'Acciones',
          align: 'left',
          sortable: true
        }
      ],
      studiosModels: [],
      dialogChangeStudio: false,
      studioModelToChange: '',
      pagination: {
        sortBy: 'created_at',
        descending: true,
        page: 1,
        rowsPerPage: 20
      }
    }
  },
  created () {
    this.sUser = this.decryptSession('user')
    this.getModelsAccounts()
    if (this.openGate('transfer-models_accounts', this.sUser.prof_id)) {
      this.getStudioModelsFromModel()  
    }
  },
  methods: {
    async getModelsAccounts () {
      try {
        this.loading = true
        let query = (this.isSubgrid) ? this.parentField + '=' + this.parentId : ''
        var response = await ModelAccountService.getModelsAccounts({ query: query, token: this.decryptSession('token') })
        this.dataset = response.data.data
        for (var i = 0; i < this.dataset.length; i++) {
          this.dataset[i].toggleActive = this.dataset[i].modacc_active
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
        var response = await ModelAccountService.delModelAccount({ id: id, token: this.decryptSession('token') })
        if (response.data.status === 'success') {
          this.alert('positive', 'Eliminado')
          this.getModelsAccounts()
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
      var url = this.getApiUrl('/api/models_accounts/export?access_token=' + this.decryptSession('token') + query)
      var win = window.open(url, '_blank')
      win.focus()      
    },
    async toggleActive (row) {
      var newState = row.toggleActive
      try {
        this.activateLoading(this.$t('loading'))

        // activate
        if (newState === true) {
          var response = await ModelAccountService.activateModelAccount({ id: row.modacc_id, token: this.decryptSession('token') })
          var successMessage = this.$t('activated')
        // inactivate
        } else if (newState === false) {
          var response = await ModelAccountService.inactivateModelAccount({ id: row.modacc_id, token: this.decryptSession('token') })
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
    },
    async getStudioModelsFromModel () {
      var response = await StudioModelService.getStudiosModelsFromModelByStudioModel({ id: this.parentId, token: this.decryptSession('token') })
      if (response.data.data.length > 0) {
        this.studiosModels =  response.data.data
        this.studioModelToChange = response.data.data[0]
      }
    },
    changeAccountsContract (modacc_id) {
      this.$q.dialog({
        title: 'Confirmar translados de cuentas',
        message: '¿Deseas realmente transferir todos las cuentas a el contrato seleccionado?',
        cancel: true,
        persistent: true
      }).onOk(() => {
        this.changeAccountsContractRequest()
      })
    },
    async changeAccountsContractRequest () {
      const account_ids = this.dataset.map(row=> row.modacc_id)
      try {
        this.activateLoading('Cargando')
        // POST
        var record = await ModelAccountService.changeAccountsContract({
          stdmod_id: this.studioModelToChange.value,
          modacc_ids: account_ids,
          token: this.decryptSession('token')
        })
        this.alert('positive', 'Cuentas transladadas')
        this.disableLoading()
        this.$emit('close')
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
    }
  }
}
</script>
<style type="text/css">
  body {
    background: #ECF0F3;
  }
</style>

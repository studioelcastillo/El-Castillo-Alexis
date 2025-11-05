<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card">
          <q-card-section>
            <div class="text-h5 text-weight-bolder">
              Cuentas bancarias
              <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('add-banks_accounts', sUser.prof_id)" class="text-green" style="cursor: pointer;" @click="(isSubgrid) ? openSubgridForm('create') : goTo('banks_accounts/new')"> <q-icon name="add_box"/> </a>
              <a class="text-blue" style="cursor: pointer;" @click="downloadExcel()"><q-icon name="move_to_inbox"/><q-tooltip :delay="100" :offset="[0, 10]">Descargar Cuentas bancarias</q-tooltip></a>
            </div>
          </q-card-section>

          <q-separator inset />

          <q-card-section>
            <q-table
              title="Cuentas bancarias"
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
                  <q-td key="bankacc_id" :props="props">{{ props.row.bankacc_id }}</q-td>
                  <q-td key="studio.std_name" :props="props">{{ (props.row.studio) ? props.row.studio.std_name : null }}</q-td>
                  <q-td key="bankacc_entity" :props="props">{{ props.row.bankacc_entity }}</q-td>
                  <q-td key="bankacc_number" :props="props">{{ props.row.bankacc_number }}</q-td>
                  <q-td key="bankacc_type" :props="props">{{ props.row.bankacc_type }}</q-td>
                  <q-td key="bankacc_main" :props="props">
                    <q-chip v-if="props.row.bankacc_main" color="green-3">SI</q-chip>
                    <q-chip v-else color="red-3">NO</q-chip>
                  </q-td>
                  <q-td key="created_at" :props="props">{{ convertUTCDateToLocalDate(props.row.created_at, 'DD/MM/YYYY hh:mm:ss a') }}</q-td>
                  <q-td key="bankacc_beneficiary_name" :props="props">{{ props.row.bankacc_beneficiary_name }}</q-td>
                  <q-td key="bankacc_beneficiary_document" :props="props">{{ props.row.bankacc_beneficiary_document }}</q-td>
                  <q-td key="bankacc_beneficiary_document_type" :props="props">{{ props.row.bankacc_beneficiary_document_type }}</q-td>
                  <q-td key="action" :props="props">
                    <a v-if="openGate('show-banks_accounts', sUser.prof_id)" class="text-blue-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('show', props.row.bankacc_id) : goTo('banks_accounts/show/' + props.row.bankacc_id)"> <q-icon size="md" name="visibility"/>
                      <q-tooltip :offset="[0, 10]">Ver</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('edit-banks_accounts', sUser.prof_id)" class="text-blue-grey-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('edit', props.row.bankacc_id) : goTo('banks_accounts/edit/' + props.row.bankacc_id)"> <q-icon size="md" name="edit"/>
                      <q-tooltip :offset="[0, 10]">Editar</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('delete-banks_accounts', sUser.prof_id)" class="text-red" style="cursor: pointer;" @click="deleteDialog(props.row.bankacc_id)"> <q-icon size="md" name="delete"/>
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
            <BankAccountForm :is-dialog="true" :parent-table="parentTable" :parent-field="parentField" :parent-id="parentId" :dialog-child-id="dialogChildId" :modeprop="dialogMode" @save="getBanksAccounts()" @close="dialogChildId = null; dialog = false"/>
          </q-card>
        </q-dialog>
      </div>
    </div>
  </div>
</template>

<script>
import BankAccountService from 'src/services/BankAccountService'
import BankAccountForm from 'src/pages/BankAccount/BankAccountForm.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'BanksAccountsList',
  mixins: [xMisc, sGate],
  components: {
    BankAccountForm
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
      visibleColumns: ['std_id', 'bankacc_entity', 'bankacc_number', 'bankacc_type', 'bankacc_main', 'created_at', 'bankacc_beneficiary_name', 'bankacc_beneficiary_document', 'bankacc_beneficiary_document_type'],
      columns: [
        {
          name: 'bankacc_id',
          required: true,
          label: 'Id',
          align: 'left',
          field: row => row.bankacc_id,
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
          name: 'bankacc_entity',
          required: true,
          label: 'Entidad',
          align: 'left',
          field: row => row.bankacc_entity,
          sortable: true
        },
        {
          name: 'bankacc_number',
          required: true,
          label: 'Nro. de cuenta',
          align: 'left',
          field: row => row.bankacc_number,
          sortable: true
        },
        {
          name: 'bankacc_type',
          required: true,
          label: 'Tipo de cuenta',
          align: 'left',
          field: row => row.bankacc_type,
          sortable: true
        },
        {
          name: 'bankacc_main',
          required: true,
          label: 'Cuenta principal',
          align: 'center',
          field: row => row.bankacc_main,
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
          name: 'bankacc_beneficiary_name',
          required: true,
          label: 'Nombre del beneficiario',
          align: 'left',
          field: row => row.bankacc_beneficiary_name,
          sortable: true
        },
        {
          name: 'bankacc_beneficiary_document',
          required: true,
          label: 'Nro. de identificación del beneficiario',
          align: 'left',
          field: row => row.bankacc_beneficiary_document,
          sortable: true
        },
        {
          name: 'bankacc_beneficiary_document_type',
          required: true,
          label: 'Tipo de documento del beneficiario',
          align: 'left',
          field: row => row.bankacc_beneficiary_document_type,
          sortable: true
        },
        {
          name: 'action',
          required: true,
          label: 'Acciones',
          align: 'left',
          sortable: true
        }
      ],
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
    this.getBanksAccounts()
  },
  methods: {
    async getBanksAccounts () {
      try {
        this.loading = true
        let query = (this.isSubgrid) ? this.parentField + '=' + this.parentId : ''
        var response = await BankAccountService.getBanksAccounts({ query: query, token: this.decryptSession('token') })
        this.dataset = response.data.data
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
        var response = await BankAccountService.delBankAccount({ id: id, token: this.decryptSession('token') })
        if (response.data.status === 'success') {
          this.alert('positive', 'Eliminado')
          this.getBanksAccounts()
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
      var url = this.getApiUrl('/api/banks_accounts/export?access_token=' + this.decryptSession('token') + query)
      var win = window.open(url, '_blank')
      win.focus()      
    },
  }
}
</script>
<style type="text/css">
  body {
    background: #ECF0F3;
  }
</style>

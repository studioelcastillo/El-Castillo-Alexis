<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card">
          <q-card-section>
            <div class="text-h5 text-weight-bolder">
              <br>
              Transacciones
              <a class="text-blue" style="cursor: pointer;" @click="downloadExcel()"><q-icon name="move_to_inbox"/><q-tooltip :delay="100" :offset="[0, 10]">Descargar Transacciones</q-tooltip></a>
            </div>
          </q-card-section>
          <q-separator inset />
          <!-- INGRESOS -->
          <q-card-section id="ingresos-card-section" v-if="openGate('add-transactions_income', sUser.prof_id)">
            <q-table
              title="Ingresos"
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
            	<template v-slot:top-left>
            		<div class="text-h5 text-weight-bolder">
            			<span class="text-h6">Ingresos</span>
			        		<a v-if="(!isSubgrid || parentMode == 'edit') && openGate('add-transactions', sUser.prof_id)" class="text-white q-ml-xs" style="cursor: pointer;" @click="(isSubgrid) ? openSubgridForm('create', 'INGRESOS') : goTo('transactions/new')"> 
			        			<q-icon name="add_box"/> 
			        		</a>
			        	</div>
            	</template>
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
                  <q-td key="trans_id" :props="props">{{ props.row.trans_id }}</q-td>
                  <q-td key="user_id" :props="props">{{ miles(props.row.user_id) }}</q-td>
                  <q-td key="transaction_type.transtype_name" :props="props">{{ (props.row.transaction_type) ? props.row.transaction_type.transtype_name : null }}</q-td>
                  <q-td key="product.prod_name" :props="props">{{ (props.row.product) ? props.row.product.prod_name : null }}</q-td>
                  <q-td key="std_name" :props="props">{{ (props.row.std_name) ? (props.row.stdmod_id + ' ' + props.row.std_name) : null }}</q-td>
                  <q-td key="trans_description" :props="props">{{ props.row.trans_description }}</q-td>
                  <q-td key="trans_amount" :props="props">{{ miles(props.row.trans_amount) }}</q-td>
                  <q-td key="total" :props="props">{{ miles(props.row.trans_amount * props.row.trans_quantity) }}</q-td>
                  <q-td key="trans_date" :props="props">{{ props.row.trans_date }}</q-td>
                  <q-td key="created_at" :props="props">{{ convertUTCDateToLocalDate(props.row.created_at, 'DD/MM/YYYY hh:mm:ss a') }}</q-td>
                  <q-td key="action" :props="props">
                    <a v-if="openGate('show-transactions', sUser.prof_id)" class="text-blue-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('show', props.row.trans_id) : goTo('transactions/show/' + props.row.trans_id)"> <q-icon size="md" name="visibility"/>
                      <q-tooltip :offset="[0, 10]">Ver</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('edit-transactions', sUser.prof_id) && props.row.period_state === 'ABIERTO'" class="text-blue-grey-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('edit', props.row.trans_id) : goTo('transactions/edit/' + props.row.trans_id)"> <q-icon size="md" name="edit"/>
                      <q-tooltip :offset="[0, 10]">Editar</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('delete-transactions', sUser.prof_id) && props.row.period_state === 'ABIERTO'" class="text-red" style="cursor: pointer;" @click="deleteDialog(props.row.trans_id)"> <q-icon size="md" name="delete"/>
                      <q-tooltip :offset="[0, 10]">Eliminar</q-tooltip>
                    </a>
                  </q-td>
                </q-tr>
              </template>
            </q-table>
          </q-card-section>
          <!-- EGRESOS -->
          <q-card-section id="egresos-card-section" v-if="openGate('add-transactions_expenses', sUser.prof_id)">
            <q-table
              title="Egresos"
              dense
              :columns="columns"
              :rows="dataset2"
              :filter="filter2"
              :loading="loading"
              :visible-columns="visibleColumns"
              rows-per-page-label="Registros por página"
              no-data-label="No hay registros disponibles"
              color="purple"
              v-model:pagination="pagination"
            >
            	<template v-slot:top-left>
            		<div class="text-h5 text-weight-bolder">
            			<span class="text-h6">Egresos</span>
			        		<a v-if="(!isSubgrid || parentMode == 'edit') && openGate('add-transactions', sUser.prof_id)" class="text-white q-ml-xs" style="cursor: pointer;" @click="(isSubgrid) ? openSubgridForm('create', 'EGRESOS') : goTo('transactions/new')"> 
			        			<q-icon name="add_box"/> 
			        		</a>
			        	</div>
            	</template>
              <!-- header -->
              <template v-slot:top-right="props">
                <!-- filter -->
                <q-input borderless dense debounce="300" v-model="filter2" placeholder="Buscar">
                  <template v-slot:append>
                    <q-icon name="search" />
                  </template>
                </q-input>
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
                  <q-td key="trans_id" :props="props">{{ props.row.trans_id }}</q-td>
                  <q-td key="user_id" :props="props">{{ miles(props.row.user_id) }}</q-td>
                  <q-td key="transaction_type.transtype_name" :props="props">{{ (props.row.transaction_type) ? props.row.transaction_type.transtype_name : null }}</q-td>
                  <q-td key="product.prod_name" :props="props">{{ (props.row.product) ? props.row.product.prod_name : null }}</q-td>
                  <q-td key="std_name" :props="props">{{ (props.row.std_name) ? (props.row.stdmod_id + ' ' + props.row.std_name) : null }}</q-td>
                  <q-td key="trans_description" :props="props">{{ props.row.trans_description }}</q-td>
                  <q-td key="trans_amount" :props="props">{{ miles(props.row.trans_amount) }}</q-td>
                  <q-td key="total" :props="props">{{ miles(props.row.trans_amount * props.row.trans_quantity) }}</q-td>
                  <q-td key="trans_date" :props="props">{{ props.row.trans_date }}</q-td>
                  <q-td key="created_at" :props="props">{{ convertUTCDateToLocalDate(props.row.created_at, 'DD/MM/YYYY hh:mm:ss a') }}</q-td>
                  <q-td key="action" :props="props">
                    <a v-if="openGate('show-transactions', sUser.prof_id)" class="text-blue-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('show', props.row.trans_id) : goTo('transactions/show/' + props.row.trans_id)"> <q-icon size="md" name="visibility"/>
                      <q-tooltip :offset="[0, 10]">Ver</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('edit-transactions', sUser.prof_id) && props.row.period_state === 'ABIERTO'" class="text-blue-grey-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('edit', props.row.trans_id) : goTo('transactions/edit/' + props.row.trans_id)"> <q-icon size="md" name="edit"/>
                      <q-tooltip :offset="[0, 10]">Editar</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('delete-transactions', sUser.prof_id) && props.row.period_state === 'ABIERTO'" class="text-red" style="cursor: pointer;" @click="deleteDialog(props.row.trans_id)"> <q-icon size="md" name="delete"/>
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
            <TransactionForm :is-dialog="true" :parent-table="parentTable" :parent-field="parentField" :parent-id="parentId" :dialog-child-id="dialogChildId" :modeprop="dialogMode" :transfer-group-prop="transferGroup" @save="getTransactions()" @close="dialogChildId = null; dialog = false" :is-model="isModel"/>
          </q-card>
        </q-dialog>
      </div>
    </div>
  </div>
</template>

<script>
import TransactionService from 'src/services/TransactionService'
import TransactionForm from 'src/pages/Transaction/TransactionForm.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'TransactionsList',
  mixins: [xMisc, sGate],
  components: {
    TransactionForm
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
    },
    isModel: {
      type: Boolean,
      default: false
    },
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
      transferGroup: 'INGRESOS',
      dataset: [],
      dataset2: [],
      filter: '',
      filter2: '',
      visibleColumns: ['transaction_type.transtype_name', 'trans_date', 'trans_description', 'trans_amount', 'product.prod_name', 'created_at'],
      columns: [
        {
          name: 'trans_id',
          label: 'Id',
          align: 'left',
          field: row => row.trans_id,
          sortable: true
        },
        {
          name: 'user_id',
          label: 'Modelo',
          align: 'left',
          field: row => row.user_id,
          sortable: true
        },
        {
          name: 'transaction_type.transtype_name',
          required: true,
          label: 'Tipo de transferencia',
          align: 'left',
          field: row => (row.transaction_type) ? row.transaction_type.transtype_name : null,
          sortable: true
        },
        {
          name: 'product.prod_name',
          required: true,
          label: 'Producto',
          align: 'left',
          field: row => (row.product) ? row.product.prod_name : null,
          sortable: true
        },
        {
          name: 'std_name',
          required: true,
          label: 'Contrato',
          align: 'left',
          field: row => (row.std_name) ?  row.stdmod_id + ' ' + row.std_name : null,
          sortable: true
        },
        {
          name: 'trans_description',
          required: true,
          label: 'Descripción',
          align: 'left',
          field: row => row.trans_description,
          sortable: true
        },
        {
          name: 'trans_amount',
          required: true,
          label: 'Monto',
          align: 'left',
          field: row => row.trans_amount,
          sortable: true
        },
        {
          name: 'total',
          required: true,
          label: 'Total',
          align: 'left',
          field: row => row.trans_quantity,
          sortable: true
        },
        {
          name: 'trans_date',
          required: true,
          label: 'Fecha',
          align: 'left',
          field: row => row.trans_date,
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
    this.getTransactions()
  },
  methods: {
    async getTransactions () {
      try {
        this.loading = true
        if (this.openGate('menu-transactions', this.sUser.prof_id)) {
          let query = (this.isSubgrid) ? 'parentfield=' + this.parentField + '&parentid=' + this.parentId : ''
          query += (query != '') ? '&' : ''
          var response = await TransactionService.getTransactions({ query: query + 'transtype_group=INGRESOS', token: this.decryptSession('token') })
          this.dataset = response.data.data
          response = await TransactionService.getTransactions({ query: query + 'transtype_group=EGRESOS', token: this.decryptSession('token') })
          this.dataset2 = response.data.data
          console.log(response)
        }
        this.loading = false
      } catch (error) {
        this.errorsAlerts(error)
        this.loading = false
      }
    },
    openSubgridForm (mode, id) {
      this.dialogMode = mode
      if (id === 'INGRESOS' || id === 'EGRESOS') {
      	this.transferGroup = id
      } else {
      	this.dialogChildId = id
      }
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
        var response = await TransactionService.delTransaction({ id: id, token: this.decryptSession('token') })
        if (response.data.status === 'success') {
          this.alert('positive', 'Eliminado')
          this.getTransactions()
        } else {
          this.alert('negative', 'Error')
        }
        this.disableLoading()
      } catch (error) {
        if (error.response && error.response.data.code && error.response.data.message) {
          this.alert('warning', error.response.data.message)
        } else {
          this.errorsAlerts(error)
        }
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
      var url = this.getApiUrl('/api/transactions/export?access_token=' + this.decryptSession('token') + query)
      var win = window.open(url, '_blank')
      win.focus()      
    }
  }
}
</script>
<style type="text/css">
  body {
    background: #ECF0F3;
  }
  #ingresos-card-section .q-table__top {
    background-color: #009e71;
    color: #ffffff;
  }

  #ingresos-card-section th {
    background-color: #00ffb7;
  }

  #egresos-card-section .q-table__top {
    background-color: #bd6a00;
    color: #ffffff;
  }

  #egresos-card-section th {
    background-color: #ff8f00;
  }
</style>

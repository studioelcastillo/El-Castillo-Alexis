<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card">
          <q-card-section>
            <div class="text-h5 text-weight-bolder">
              Transacciones
              <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('add-models_transactions', sUser.prof_id)" class="text-green" style="cursor: pointer;" @click="(isSubgrid) ? openSubgridForm('create') : goTo('models_transactions/new')"> <q-icon name="add_box"/> </a>
              <a class="text-blue" style="cursor: pointer;" @click="downloadExcel()"><q-icon name="move_to_inbox"/><q-tooltip :delay="100" :offset="[0, 10]">Descargar Transacciones</q-tooltip></a>
            </div>
          </q-card-section>

          <q-separator inset />

          <!-- INGRESOS -->
          <q-card-section id="ingresos-card-section">
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
                  <q-td key="modtrans_id" :props="props">{{ props.row.modtrans_id }}</q-td>
                  <q-td key="stdmod_id" :props="props">{{ miles(props.row.stdmod_id) }}</q-td>
                  <q-td key="transaction_type.transtype_name" :props="props">{{ (props.row.transaction_type) ? props.row.transaction_type.transtype_name : null }}</q-td>
                  <q-td key="modtrans_date" :props="props">{{ props.row.modtrans_date }}</q-td>
                  <q-td key="modtrans_description" :props="props">{{ props.row.modtrans_description }}</q-td>
                  <q-td key="modtrans_amount" :props="props">{{ miles(props.row.modtrans_amount) }}</q-td>
                  <q-td key="product.prod_name" :props="props">{{ (props.row.product) ? props.row.product.prod_name : null }}</q-td>
                  <q-td key="created_at" :props="props">{{ convertUTCDateToLocalDate(props.row.created_at, 'DD/MM/YYYY hh:mm:ss a') }}</q-td>
                  <q-td key="action" :props="props">
                    <a v-if="openGate('show-models_transactions', sUser.prof_id)" class="text-blue-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('show', props.row.modtrans_id) : goTo('models_transactions/show/' + props.row.modtrans_id)"> <q-icon size="md" name="visibility"/>
                      <q-tooltip :offset="[0, 10]">Ver</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('edit-models_transactions', sUser.prof_id)" class="text-blue-grey-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('edit', props.row.modtrans_id) : goTo('models_transactions/edit/' + props.row.modtrans_id)"> <q-icon size="md" name="edit"/>
                      <q-tooltip :offset="[0, 10]">Editar</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('delete-models_transactions', sUser.prof_id)" class="text-red" style="cursor: pointer;" @click="deleteDialog(props.row.modtrans_id)"> <q-icon size="md" name="delete"/>
                      <q-tooltip :offset="[0, 10]">Eliminar</q-tooltip>
                    </a>
                  </q-td>
                </q-tr>
              </template>
            </q-table>
          </q-card-section>
          <!-- EGRESOS -->
          <q-card-section id="egresos-card-section">
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
            >
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
                  <q-td key="modtrans_id" :props="props">{{ props.row.modtrans_id }}</q-td>
                  <q-td key="stdmod_id" :props="props">{{ miles(props.row.stdmod_id) }}</q-td>
                  <q-td key="transaction_type.transtype_name" :props="props">{{ (props.row.transaction_type) ? props.row.transaction_type.transtype_name : null }}</q-td>
                  <q-td key="modtrans_date" :props="props">{{ props.row.modtrans_date }}</q-td>
                  <q-td key="modtrans_description" :props="props">{{ props.row.modtrans_description }}</q-td>
                  <q-td key="modtrans_amount" :props="props">{{ miles(props.row.modtrans_amount) }}</q-td>
                  <q-td key="product.prod_name" :props="props">{{ (props.row.product) ? props.row.product.prod_name : null }}</q-td>
                  <q-td key="created_at" :props="props">{{ convertUTCDateToLocalDate(props.row.created_at, 'DD/MM/YYYY hh:mm:ss a') }}</q-td>
                  <q-td key="action" :props="props">
                    <a v-if="openGate('show-models_transactions', sUser.prof_id)" class="text-blue-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('show', props.row.modtrans_id) : goTo('models_transactions/show/' + props.row.modtrans_id)"> <q-icon size="md" name="visibility"/>
                      <q-tooltip :offset="[0, 10]">Ver</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('edit-models_transactions', sUser.prof_id)" class="text-blue-grey-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('edit', props.row.modtrans_id) : goTo('models_transactions/edit/' + props.row.modtrans_id)"> <q-icon size="md" name="edit"/>
                      <q-tooltip :offset="[0, 10]">Editar</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('delete-models_transactions', sUser.prof_id)" class="text-red" style="cursor: pointer;" @click="deleteDialog(props.row.modtrans_id)"> <q-icon size="md" name="delete"/>
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
            <ModelTransactionForm :is-dialog="true" :parent-table="parentTable" :parent-field="parentField" :parent-id="parentId" :dialog-child-id="dialogChildId" :modeprop="dialogMode" @save="getModelsTransactions()" @close="dialogChildId = null; dialog = false"/>
          </q-card>
        </q-dialog>
      </div>
    </div>
  </div>
</template>

<script>
import ModelTransactionService from 'src/services/ModelTransactionService'
import ModelTransactionForm from 'src/pages/ModelTransaction/ModelTransactionForm.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'ModelsTransactionsList',
  mixins: [xMisc, sGate],
  components: {
    ModelTransactionForm
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
      dataset2: [],
      filter: '',
      filter2: '',
      visibleColumns: ['stdmod_id', 'transtype_id', 'modtrans_date', 'modtrans_description', 'modtrans_amount', 'prod_id', 'created_at'],
      columns: [
        {
          name: 'modtrans_id',
          required: true,
          label: 'Id',
          align: 'left',
          field: row => row.modtrans_id,
          sortable: true
        },
        {
          name: 'stdmod_id',
          required: true,
          label: 'Modelo',
          align: 'left',
          field: row => row.stdmod_id,
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
          name: 'modtrans_date',
          required: true,
          label: 'Fecha',
          align: 'left',
          field: row => row.modtrans_date,
          sortable: true
        },
        {
          name: 'modtrans_description',
          required: true,
          label: 'Descripción',
          align: 'left',
          field: row => row.modtrans_description,
          sortable: true
        },
        {
          name: 'modtrans_amount',
          required: true,
          label: 'Monto',
          align: 'left',
          field: row => row.modtrans_amount,
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
    this.getModelsTransactions()
  },
  methods: {
    async getModelsTransactions () {
      try {
        this.loading = true
        let query = (this.isSubgrid) ? 'parentfield=' + this.parentField + '&parentid=' + this.parentId : ''
        query += (query != '') ? '&' : ''
        var response = await ModelTransactionService.getModelsTransactions({ query: query + 'transtype_group=INGRESOS', token: this.decryptSession('token') })
        this.dataset = response.data.data
        response = await ModelTransactionService.getModelsTransactions({ query: query + 'transtype_group=EGRESOS', token: this.decryptSession('token') })
        this.dataset2 = response.data.data
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
        var response = await ModelTransactionService.delModelTransaction({ id: id, token: this.decryptSession('token') })
        if (response.data.status === 'success') {
          this.alert('positive', 'Eliminado')
          this.getModelsTransactions()
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
      var url = this.getApiUrl('/api/models_transactions/export?access_token=' + this.decryptSession('token') + query)
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

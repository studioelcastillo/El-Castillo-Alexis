<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12" v-if="this.openGate('menu-exchanges_rates', this.sUser.prof_id)">
        <q-card flat bordered class="my-card">
          <q-card-section>
            <div class="text-h5 text-weight-bolder">
              Tasas de cambio
              <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('add-exchanges_rates', sUser.prof_id)" class="text-green" style="cursor: pointer;" @click="(isSubgrid) ? openSubgridForm('create') : goTo('exchanges_rates/new')"> <q-icon name="add_box"/> </a>
              <a class="text-blue" style="cursor: pointer;" @click="downloadExcel()"><q-icon name="move_to_inbox"/><q-tooltip :delay="100" :offset="[0, 10]">Descargar Tasas de cambio</q-tooltip></a>
            </div>
          </q-card-section>

          <q-separator inset />

          <q-card-section>
            <q-table
              title="Tasas de cambio"
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
                  <q-td key="exrate_id" :props="props">{{ props.row.exrate_id }}</q-td>
                  <q-td key="exrate_date" :props="props">{{ props.row.exrate_date }}</q-td>
                  <q-td key="exrate_from" :props="props">{{ props.row.exrate_from }}</q-td>
                  <q-td key="exrate_to" :props="props">{{ props.row.exrate_to }}</q-td>
                  <q-td key="exrate_rate" :props="props">{{ miles(props.row.exrate_rate) }}</q-td>
                  <q-td key="exrate_type" :props="props">{{ props.row.exrate_type }}</q-td>
                  <q-td key="created_at" :props="props">{{ convertUTCDateToLocalDate(props.row.created_at, 'DD/MM/YYYY hh:mm:ss a') }}</q-td>
                  <q-td key="action" :props="props">
                    <a v-if="openGate('show-exchanges_rates', sUser.prof_id)" class="text-blue-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('show', props.row.exrate_id) : goTo('exchanges_rates/show/' + props.row.exrate_id)"> <q-icon size="md" name="visibility"/>
                      <q-tooltip :offset="[0, 10]">Ver</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('edit-exchanges_rates', sUser.prof_id)" class="text-blue-grey-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('edit', props.row.exrate_id) : goTo('exchanges_rates/edit/' + props.row.exrate_id)"> <q-icon size="md" name="edit"/>
                      <q-tooltip :offset="[0, 10]">Editar</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('delete-exchanges_rates', sUser.prof_id)" class="text-red" style="cursor: pointer;" @click="deleteDialog(props.row.exrate_id)"> <q-icon size="md" name="delete"/>
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
            <ExchangeRateForm :is-dialog="true" :parent-table="parentTable" :parent-field="parentField" :parent-id="parentId" :dialog-child-id="dialogChildId" :modeprop="dialogMode" @save="getExchangesRates()" @close="dialogChildId = null; dialog = false"/>
          </q-card>
        </q-dialog>
      </div>
    </div>
  </div>
</template>

<script>
import ExchangeRateService from 'src/services/ExchangeRateService'
import ExchangeRateForm from 'src/pages/ExchangeRate/ExchangeRateForm.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'ExchangesRatesList',
  mixins: [xMisc, sGate],
  components: {
    ExchangeRateForm
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
      visibleColumns: ['exrate_date', 'exrate_from', 'exrate_to', 'exrate_rate', 'exrate_type', 'created_at'],
      columns: [
        {
          name: 'exrate_id',
          required: true,
          label: 'Id',
          align: 'left',
          field: row => row.exrate_id,
          sortable: true
        },
        {
          name: 'exrate_date',
          required: true,
          label: 'Fecha',
          align: 'left',
          field: row => row.exrate_date,
          sortable: true
        },
        {
          name: 'exrate_from',
          required: true,
          label: 'Moneda origen',
          align: 'left',
          field: row => row.exrate_from,
          sortable: true
        },
        {
          name: 'exrate_to',
          required: true,
          label: 'Moneda destino',
          align: 'left',
          field: row => row.exrate_to,
          sortable: true
        },
        {
          name: 'exrate_rate',
          required: true,
          label: 'Tasa',
          align: 'left',
          field: row => row.exrate_rate,
          sortable: true
        },
        {
          name: 'exrate_type',
          required: true,
          label: 'Tipo',
          align: 'left',
          field: row => row.exrate_type,
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
    this.getExchangesRates()  
  },
  methods: {
    async getExchangesRates () {
      try {
        this.loading = true
        if (this.openGate('menu-exchanges_rates', this.sUser.prof_id)) {
          let query = (this.isSubgrid) ? this.parentField + '=' + this.parentId : ''
          var response = await ExchangeRateService.getExchangesRates({ query: query, token: this.decryptSession('token') })
          this.dataset = response.data.data  
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
        var response = await ExchangeRateService.delExchangeRate({ id: id, token: this.decryptSession('token') })
        if (response.data.status === 'success') {
          this.alert('positive', 'Eliminado')
          this.getExchangesRates()
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
      var url = this.getApiUrl('/api/exchanges_rates/export?access_token=' + this.decryptSession('token') + query)
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

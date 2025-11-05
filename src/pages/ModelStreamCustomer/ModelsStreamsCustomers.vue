<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card">
          <q-card-section>
            <div class="text-h5 text-weight-bolder">
              Clientes
              <!-- <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('add-models_streams_customers', sUser.prof_id)" class="text-green" style="cursor: pointer;" @click="(isSubgrid) ? openSubgridForm('create') : goTo('models_streams_customers/new')"> <q-icon name="add_box"/> </a> -->
              <a class="text-blue" style="cursor: pointer;" @click="downloadExcel()"><q-icon name="move_to_inbox"/><q-tooltip :delay="100" :offset="[0, 10]">Descargar Clientes</q-tooltip></a>
            </div>
          </q-card-section>

          <q-separator inset />

          <q-card-section>
            <q-table
              title="Clientes"
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
                  <q-td key="modstrcus_id" :props="props">{{ props.row.modstrcus_id }}</q-td>
                  <q-td key="modstr_id" :props="props">{{ miles(props.row.modstr_id) }}</q-td>
                  <q-td key="modstrcus_name" :props="props">{{ props.row.modstrcus_name }}</q-td>
                  <q-td key="modstrcus_account" :props="props">{{ props.row.modstrcus_account }}</q-td>
                  <q-td key="modstrcus_website" :props="props">{{ props.row.modstrcus_website }}</q-td>
                  <q-td key="modstrcus_product" :props="props">{{ props.row.modstrcus_product }}</q-td>
                  <q-td key="modstrcus_price" :props="props">{{ miles(props.row.modstrcus_price) }}</q-td>
                  <q-td key="modstrcus_earnings" :props="props">{{ miles(props.row.modstrcus_earnings) }}</q-td>
                  <q-td key="modstrcus_received_at" :props="props">{{ props.row.modstrcus_received_at }}</q-td>
                  <q-td key="modstrcus_chat_duration" :props="props">{{ miles(props.row.modstrcus_chat_duration) }}</q-td>
                  <q-td key="created_at" :props="props">{{ convertUTCDateToLocalDate(props.row.created_at, 'DD/MM/YYYY hh:mm:ss a') }}</q-td>
                  <q-td key="action" :props="props">
                    <a v-if="openGate('show-models_streams_customers', sUser.prof_id)" class="text-blue-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('show', props.row.modstrcus_id) : goTo('models_streams_customers/show/' + props.row.modstrcus_id)"> <q-icon size="md" name="visibility"/>
                      <q-tooltip :offset="[0, 10]">Ver</q-tooltip>
                    </a>
                    <!-- <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('edit-models_streams_customers', sUser.prof_id)" class="text-blue-grey-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('edit', props.row.modstrcus_id) : goTo('models_streams_customers/edit/' + props.row.modstrcus_id)"> <q-icon size="md" name="edit"/>
                      <q-tooltip :offset="[0, 10]">Editar</q-tooltip>
                    </a> -->
                    <!-- <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('delete-models_streams_customers', sUser.prof_id)" class="text-red" style="cursor: pointer;" @click="deleteDialog(props.row.modstrcus_id)"> <q-icon size="md" name="delete"/>
                      <q-tooltip :offset="[0, 10]">Eliminar</q-tooltip>
                    </a> -->
                    <a v-if="openGate('menu-models_streams', sUser.prof_id)" class="text-blue-grey-8" style="cursor: pointer; padding: 5px;" @click="goTo('models_streams/show/' + props.row.modstr_id, '_blank')"> <q-icon size="md" name="stream"/>
                      <q-tooltip :offset="[0, 10]">Ver Stream</q-tooltip>
                    </a>
                  </q-td>
                </q-tr>
              </template>
            </q-table>
          </q-card-section>
        </q-card>

        <q-dialog v-if="isSubgrid" v-model="dialog">
          <q-card style="width: 100%;">
            <ModelStreamCustomerForm :is-dialog="true" :parent-table="parentTable" :parent-field="parentField" :parent-id="parentId" :dialog-child-id="dialogChildId" :modeprop="dialogMode" @save="getModelsStreamsCustomers()" @close="dialogChildId = null; dialog = false"/>
          </q-card>
        </q-dialog>
      </div>
    </div>
  </div>
</template>

<script>
import ModelStreamCustomerService from 'src/services/ModelStreamCustomerService'
import ModelStreamCustomerForm from 'src/pages/ModelStreamCustomer/ModelStreamCustomerForm.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'ModelsStreamsCustomersList',
  mixins: [xMisc, sGate],
  components: {
    ModelStreamCustomerForm
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
      visibleColumns: ['modstr_id', 'modstrcus_name', 'modstrcus_account', 'modstrcus_website', 'modstrcus_product', 'modstrcus_price', 'modstrcus_earnings', 'modstrcus_received_at', 'modstrcus_chat_duration', 'created_at'],
      columns: [
        {
          name: 'modstrcus_id',
          required: true,
          label: 'Id',
          align: 'left',
          field: row => row.modstrcus_id,
          sortable: true
        },
        {
          name: 'modstr_id',
          required: true,
          label: 'Stream',
          align: 'left',
          field: row => row.modstr_id,
          sortable: true
        },
        {
          name: 'modstrcus_name',
          required: true,
          label: 'Nombre',
          align: 'left',
          field: row => row.modstrcus_name,
          sortable: true
        },
        {
          name: 'modstrcus_account',
          required: true,
          label: 'Cuenta',
          align: 'left',
          field: row => row.modstrcus_account,
          sortable: true
        },
        {
          name: 'modstrcus_website',
          required: true,
          label: 'Sitio web',
          align: 'left',
          field: row => row.modstrcus_website,
          sortable: true
        },
        {
          name: 'modstrcus_product',
          required: true,
          label: 'Producto',
          align: 'left',
          field: row => row.modstrcus_product,
          sortable: true
        },
        {
          name: 'modstrcus_price',
          required: true,
          label: 'Precio',
          align: 'left',
          field: row => row.modstrcus_price,
          sortable: true
        },
        {
          name: 'modstrcus_earnings',
          required: true,
          label: 'Ganancia',
          align: 'left',
          field: row => row.modstrcus_earnings,
          sortable: true
        },
        {
          name: 'modstrcus_received_at',
          required: true,
          label: 'Fecha de recibido',
          align: 'left',
          field: row => row.modstrcus_received_at,
          sortable: true
        },
        {
          name: 'modstrcus_chat_duration',
          required: true,
          label: 'Duración del chat (horas)',
          align: 'left',
          field: row => row.modstrcus_chat_duration,
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
    this.getModelsStreamsCustomers()
  },
  methods: {
    async getModelsStreamsCustomers () {
      try {
        this.loading = true
        let query = (this.isSubgrid) ? this.parentField + '=' + this.parentId : ''
        var response = await ModelStreamCustomerService.getModelsStreamsCustomers({ query: query, token: this.decryptSession('token') })
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
        var response = await ModelStreamCustomerService.delModelStreamCustomer({ id: id, token: this.decryptSession('token') })
        if (response.data.status === 'success') {
          this.alert('positive', 'Eliminado')
          this.getModelsStreamsCustomers()
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
      var url = this.getApiUrl('/api/models_streams_customers/export?access_token=' + this.decryptSession('token') + query)
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

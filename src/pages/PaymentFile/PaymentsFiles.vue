<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card">
          <q-card-section>
            <div class="text-h5 text-weight-bolder">
              Cargues de pagos
              <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('add-payments_files', sUser.prof_id)" class="text-green" style="cursor: pointer;" @click="(isSubgrid) ? openSubgridForm('create') : goTo('payments_files/new')"> <q-icon name="add_box"/> </a>
              <a class="text-blue" style="cursor: pointer;" @click="downloadExcel()"><q-icon name="move_to_inbox"/><q-tooltip :delay="100" :offset="[0, 10]">Descargar Cargues de pagos</q-tooltip></a>
            </div>
          </q-card-section>

          <q-separator inset />

          <q-card-section>
            <q-table
              title="Cargues de pagos"
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
                  <q-td key="payfile_id" :props="props">{{ props.row.payfile_id }}</q-td>
                  <q-td key="payfile_description" :props="props">{{ props.row.payfile_description }}</q-td>
                  <q-td key="payfile_filename" :props="props">{{ props.row.payfile_filename }}</q-td>
                  <q-td key="payfile_template" :props="props">{{ props.row.payfile_template }}</q-td>
                  <q-td key="payfile_total" :props="props">{{ miles(props.row.payfile_total) }}</q-td>
                  <q-td key="created_by.user_name" :props="props">{{ (props.row.created_by) ? props.row.created_by.user_name : null }}</q-td>
                  <q-td key="created_at" :props="props">{{ convertUTCDateToLocalDate(props.row.created_at, 'DD/MM/YYYY hh:mm:ss a') }}</q-td>
                  <q-td key="action" :props="props">
                    <a v-if="openGate('show-payments_files', sUser.prof_id)" class="text-blue-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('show', props.row.payfile_id) : goTo('payments_files/show/' + props.row.payfile_id)"> <q-icon size="md" name="visibility"/>
                      <q-tooltip :offset="[0, 10]">Ver</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('edit-payments_files', sUser.prof_id)" class="text-blue-grey-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('edit', props.row.payfile_id) : goTo('payments_files/edit/' + props.row.payfile_id)"> <q-icon size="md" name="edit"/>
                      <q-tooltip :offset="[0, 10]">Editar</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('delete-payments_files', sUser.prof_id)" class="text-red" style="cursor: pointer;" @click="deleteDialog(props.row.payfile_id)"> <q-icon size="md" name="delete"/>
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
            <PaymentFileForm :is-dialog="true" :parent-table="parentTable" :parent-field="parentField" :parent-id="parentId" :dialog-child-id="dialogChildId" :modeprop="dialogMode" @save="getPaymentsFiles()" @close="dialogChildId = null; dialog = false"/>
          </q-card>
        </q-dialog>
      </div>
    </div>
  </div>
</template>

<script>
import PaymentFileService from 'src/services/PaymentFileService'
import PaymentFileForm from 'src/pages/PaymentFile/PaymentFileForm.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'PaymentsFilesList',
  mixins: [xMisc, sGate],
  components: {
    PaymentFileForm
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
      visibleColumns: ['payfile_description', 'payfile_filename', 'payfile_template', 'payfile_total', 'created_by', 'created_at'],
      columns: [
        {
          name: 'payfile_id',
          required: true,
          label: 'Id',
          align: 'left',
          field: row => row.payfile_id,
          sortable: true
        },
        {
          name: 'payfile_description',
          required: true,
          label: 'Descripción',
          align: 'left',
          field: row => row.payfile_description,
          sortable: true
        },
        {
          name: 'payfile_filename',
          required: true,
          label: 'Nombre de archivo',
          align: 'left',
          field: row => row.payfile_filename,
          sortable: true
        },
        {
          name: 'payfile_template',
          required: true,
          label: 'Plantilla',
          align: 'left',
          field: row => row.payfile_template,
          sortable: true
        },
        {
          name: 'payfile_total',
          required: true,
          label: 'Total',
          align: 'left',
          field: row => row.payfile_total,
          sortable: true
        },
        {
          name: 'created_by.user_name',
          required: true,
          label: 'Creado por',
          align: 'left',
          field: row => (row.created_by) ? row.created_by.user_name : null,
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
    this.getPaymentsFiles()
  },
  methods: {
    async getPaymentsFiles () {
      try {
        this.loading = true
        let query = (this.isSubgrid) ? this.parentField + '=' + this.parentId : ''
        var response = await PaymentFileService.getPaymentsFiles({ query: query, token: this.decryptSession('token') })
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
        var response = await PaymentFileService.delPaymentFile({ id: id, token: this.decryptSession('token') })
        if (response.data.status === 'success') {
          this.alert('positive', 'Eliminado')
          this.getPaymentsFiles()
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
      var url = this.getApiUrl('/api/payments_files/export?access_token=' + this.decryptSession('token') + query)
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

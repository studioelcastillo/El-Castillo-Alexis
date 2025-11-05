<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card">
          <q-card-section>
            <div class="text-h5 text-weight-bolder">
              Pagos
              <!-- <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('add-payments', sUser.prof_id)" class="text-green" style="cursor: pointer;" @click="(isSubgrid) ? openSubgridForm('create') : goTo('payments/new')"> <q-icon name="add_box"/> </a> -->
              <a class="text-blue" style="cursor: pointer;" @click="downloadExcel()"><q-icon name="move_to_inbox"/><q-tooltip :delay="100" :offset="[0, 10]">Descargar Pagos</q-tooltip></a>
            </div>
          </q-card-section>

          <q-separator inset />

          <q-card-section>
            <q-table
              title="Pagos"
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
                  <q-td key="pay_id" :props="props">{{ props.row.pay_id }}</q-td>
                  <q-td key="payment_file.payfile_description" :props="props">{{ (props.row.payment_file) ? props.row.payment_file.payfile_description : null }}</q-td>
                  <q-td key="studio_model.studio.std_name" :props="props">{{ (props.row.studio_model && props.row.studio_model.studio) ? props.row.studio_model.studio.std_name : null }}</q-td>
                  <q-td key="studio_model.user_model.std_name" :props="props">
                    {{ (props.row.studio_model && props.row.studio_model.user_model) ? props.row.studio_model.user_model.user_name + ' ' + props.row.studio_model.user_model.user_surname + '' : null }}
                  </q-td>
                  <q-td key="stdmod_id" :props="props">{{ miles(props.row.stdmod_id) }}</q-td>
                  <q-td key="pay_amount" :props="props">{{ miles(props.row.pay_amount) }}</q-td>
                  <q-td key="pay_period_since" :props="props">{{ props.row.pay_period_since }}</q-td>
                  <q-td key="pay_period_until" :props="props">{{ props.row.pay_period_until }}</q-td>
                  <q-td key="created_at" :props="props">{{ convertUTCDateToLocalDate(props.row.created_at, 'DD/MM/YYYY hh:mm:ss a') }}</q-td>
                  <q-td key="action" :props="props">
                    <!-- <a v-if="openGate('show-payments', sUser.prof_id)" class="text-blue-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('show', props.row.pay_id) : goTo('payments/show/' + props.row.pay_id)"> <q-icon size="md" name="visibility"/>
                      <q-tooltip :offset="[0, 10]">Ver</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('edit-payments', sUser.prof_id)" class="text-blue-grey-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('edit', props.row.pay_id) : goTo('payments/edit/' + props.row.pay_id)"> <q-icon size="md" name="edit"/>
                      <q-tooltip :offset="[0, 10]">Editar</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('delete-payments', sUser.prof_id)" class="text-red" style="cursor: pointer;" @click="deleteDialog(props.row.pay_id)"> <q-icon size="md" name="delete"/>
                      <q-tooltip :offset="[0, 10]">Eliminar</q-tooltip>
                    </a> -->
                  </q-td>
                </q-tr>
              </template>
            </q-table>
          </q-card-section>
        </q-card>

        <q-dialog v-if="isSubgrid" v-model="dialog">
          <q-card style="width: 100%;">
            <PaymentForm :is-dialog="true" :parent-table="parentTable" :parent-field="parentField" :parent-id="parentId" :dialog-child-id="dialogChildId" :modeprop="dialogMode" @save="getPayments()" @close="dialogChildId = null; dialog = false"/>
          </q-card>
        </q-dialog>
      </div>
    </div>
  </div>
</template>

<script>
import PaymentService from 'src/services/PaymentService'
import PaymentForm from 'src/pages/Payment/PaymentForm.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'PaymentsList',
  mixins: [xMisc, sGate],
  components: {
    PaymentForm
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
      visibleColumns: ['payfile_id', 'std_id', 'stdmod_id', 'pay_amount', 'pay_period_since', 'pay_period_until', 'created_at'],
      columns: [
        {
          name: 'pay_id',
          required: true,
          label: 'Id',
          align: 'left',
          field: row => row.pay_id,
          sortable: true
        },
        {
          name: 'payment_file.payfile_description',
          required: true,
          label: 'Cargue de pagos',
          align: 'left',
          field: row => (row.payment_file) ? row.payment_file.payfile_description : null,
          sortable: true
        },
        {
          name: 'studio_model.studio.std_name',
          required: true,
          label: 'Estudio',
          align: 'left',
          field: row => (row.studio_model && row.studio_model.studio.std_name) ? row.studio_model.studio.std_name : null,
          sortable: true
        },
        {
          name: 'studio_model.user_model.std_name',
          required: true,
          label: 'Modelo',
          align: 'left',
          field: row => (row.studio_model && row.studio_model.user_model) ? row.studio_model.user_model.user_name : null,
          sortable: true
        },
        {
          name: 'pay_amount',
          required: true,
          label: 'Monto pago',
          align: 'left',
          field: row => row.pay_amount,
          sortable: true
        },
        {
          name: 'pay_period_since',
          required: true,
          label: 'Periodo (desde)',
          align: 'left',
          field: row => row.pay_period_since,
          sortable: true
        },
        {
          name: 'pay_period_until',
          required: true,
          label: 'Periodo (hasta)',
          align: 'left',
          field: row => row.pay_period_until,
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
    this.getPayments()
  },
  methods: {
    async getPayments () {
      try {
        this.loading = true
        let query = (this.isSubgrid) ? this.parentField + '=' + this.parentId : ''
        var response = await PaymentService.getPayments({ query: query, token: this.decryptSession('token') })
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
        var response = await PaymentService.delPayment({ id: id, token: this.decryptSession('token') })
        if (response.data.status === 'success') {
          this.alert('positive', 'Eliminado')
          this.getPayments()
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
      var url = this.getApiUrl('/api/payments/export?access_token=' + this.decryptSession('token') + query)
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

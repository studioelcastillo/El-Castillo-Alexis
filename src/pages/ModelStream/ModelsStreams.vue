<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card">
          <q-card-section>
            <div class="text-h5 text-weight-bolder">
              Streams
              <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('add-models_streams', sUser.prof_id)" class="text-green" style="cursor: pointer;" @click="(isSubgrid) ? openSubgridForm('create') : goTo('models_streams/new')"> <q-icon name="add_box"/> </a>
              <a class="text-blue" style="cursor: pointer;" @click="downloadExcel()"><q-icon name="move_to_inbox"/><q-tooltip :delay="100" :offset="[0, 10]">Descargar Streams</q-tooltip></a>
            </div>
          </q-card-section>

          <q-separator inset />

          <q-card-section>
            <q-table
              title="Streams"
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
                  <q-td key="model_account.modacc_payment_username" :props="props">{{ props.row.model_account.modacc_payment_username }}</q-td>
                  <q-td key="modacc_app" :props="props">{{ props.row.model_account.modacc_app }}</q-td>
                  <!-- <q-td key="model_account.studio_model.user_model.user_name" :props="props">{{ props.row.model_account.studio_model.user_model.user_name + ' ' + props.row.model_account.studio_model.user_model.user_surname }}</q-td> -->
                  <q-td key="modstr_date" :props="props">{{ props.row.modstr_date }}</q-td>
                  <q-td key="modstr_earnings_tokens" :props="props">{{ miles(props.row.modstr_earnings_tokens) }}</q-td>
                  <q-td key="modstr_earnings_usd" :props="props">{{ miles(props.row.modstr_earnings_usd) }}</q-td>
                  <q-td key="modstr_earnings_eur" :props="props">{{ miles(props.row.modstr_earnings_eur) }}</q-td>
                  <q-td key="modstr_earnings_cop" :props="props">{{ miles(props.row.modstr_earnings_cop) }}</q-td>
                  <q-td key="modstr_time" :props="props">{{ miles(props.row.modstr_time) }}</q-td>
                  <q-td key="modstr_source" :props="props"><q-chip>{{ props.row.modstr_source }}</q-chip></q-td>
                  <q-td key="created_at" :props="props">{{ convertUTCDateToLocalDate(props.row.created_at, 'DD/MM/YYYY hh:mm:ss a') }}</q-td>
                  <q-td key="action" :props="props">
                    <a v-if="openGate('show-models_streams', sUser.prof_id)" class="text-blue-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('show', props.row.modstr_id) : goTo('models_streams/show/' + props.row.modstr_id)"> <q-icon size="md" name="visibility"/>
                      <q-tooltip :offset="[0, 10]">Ver</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('edit-models_streams', sUser.prof_id)" class="text-blue-grey-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('edit', props.row.modstr_id) : goTo('models_streams/edit/' + props.row.modstr_id)"> <q-icon size="md" name="edit"/>
                      <q-tooltip :offset="[0, 10]">Editar</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('delete-models_streams', sUser.prof_id)" class="text-red" style="cursor: pointer;" @click="deleteDialog(props.row.modstr_id)"> <q-icon size="md" name="delete"/>
                      <q-tooltip :offset="[0, 10]">Eliminar</q-tooltip>
                    </a>
                  </q-td>
                </q-tr>
              </template>
              <!-- footer -->
              <template v-slot:bottom-row>
                <q-tr>
                  <q-td></q-td>
                  <q-td><strong>TOTAL</strong></q-td>
                  <q-td></q-td>
                  <q-td>{{ miles(totals.tokens) }}</q-td>
                  <q-td>{{ miles(totals.usd) }}</q-td>
                  <q-td>{{ miles(totals.eur) }}</q-td>
                  <q-td>{{ miles(totals.cop) }}</q-td>
                  <q-td></q-td>
                  <q-td></q-td>
                  <q-td></q-td>
                </q-tr>
              </template>
            </q-table>
          </q-card-section>
        </q-card>

        <q-dialog v-if="isSubgrid" v-model="dialog">
          <q-card style="width: 100%;">
            <ModelStreamForm :is-dialog="true" :parent-table="parentTable" :parent-field="parentField" :parent-id="parentId" :dialog-child-id="dialogChildId" :modeprop="dialogMode" @save="getModelsStreams()" @close="dialogChildId = null; dialog = false" :model-id="modelId" />
          </q-card>
        </q-dialog>
      </div>
    </div>
  </div>
</template>

<script>
import ModelStreamService from 'src/services/ModelStreamService'
import ModelStreamForm from 'src/pages/ModelStream/ModelStreamForm.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'ModelsStreamsList',
  mixins: [xMisc, sGate],
  components: {
    ModelStreamForm
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
    modelId: {
      type: Number,
      default: null
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
      dataset: [],
      totals: [],
      filter: '',
      visibleColumns: ['modstr_date', 'modstr_period', 'modstr_earnings_tokens', 'modstr_earnings_usd', 'modstr_earnings_eur', 'modstr_earnings_cop', 'modstr_time', 'created_at', 'model_account.modacc_payment_username', 'model_account.studio_model.user_model.user_name'],
      columns: [
        {
          name: 'model_account.modacc_payment_username',
          required: false,
          label: 'Pseudonimo de pago',
          align: 'left',
          field: row => row.model_account.modacc_payment_username,
          sortable: true
        },
        {
          name: 'modacc_app',
          required: true,
          label: 'Pagina',
          align: 'left',
          field: row => row.model_account.modacc_app,
          sortable: true
        },
        // {
        //   name: 'model_account.studio_model.user_model.user_name',
        //   required: false,
        //   label: 'Nombre modelo',
        //   align: 'left',
        //   field: row => row.model_account.studio_model.user_model.user_name + ' ' + row.model_account.studio_model.user_model.user_surname,
        //   sortable: true
        // },
        {
          name: 'modstr_id',
          required: false,
          label: 'Id',
          align: 'left',
          field: row => row.modstr_id,
          sortable: true
        },
        {
          name: 'modacc_id',
          required: false,
          label: 'Cuenta',
          align: 'left',
          field: row => row.modacc_id,
          sortable: true
        },
        {
          name: 'modstr_date',
          required: true,
          label: 'Fecha',
          align: 'left',
          field: row => row.modstr_date,
          sortable: true
        },
        {
          name: 'modstr_earnings_tokens',
          required: true,
          label: 'Tokens',
          align: 'left',
          field: row => row.modstr_earnings_tokens,
          sortable: true
        },
        {
          name: 'modstr_earnings_usd',
          required: true,
          label: 'Ganancia (USD)',
          align: 'left',
          field: row => row.modstr_earnings_usd,
          sortable: true
        },
        {
          name: 'modstr_earnings_eur',
          required: true,
          label: 'Ganancia (EUR)',
          align: 'left',
          field: row => row.modstr_earnings_eur,
          sortable: true
        },
        {
          name: 'modstr_earnings_cop',
          required: true,
          label: 'Ganancia (COP)',
          align: 'left',
          field: row => row.modstr_earnings_cop,
          sortable: true
        },
        {
          name: 'modstr_time',
          required: true,
          label: 'Tiempo (horas)',
          align: 'left',
          field: row => row.modstr_time,
          sortable: true
        },
        {
          name: 'modstr_source',
          required: true,
          label: 'Fuentes',
          align: 'left',
          field: row => row.modstr_source,
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
    this.getModelsStreams()
  },
  methods: {
    async getModelsStreams () {
      try {
        this.loading = true
        if (this.modelId) {
          var response = await ModelStreamService.getModelsStreamsByModel({ id: this.modelId, token: this.decryptSession('token') })
        } else {
          let query = (this.isSubgrid) ? this.parentField + '=' + this.parentId : ''
          var response = await ModelStreamService.getModelsStreams({ query: query, token: this.decryptSession('token') })
        }
        console.log(response)
        this.dataset = response.data.data
        this.totals = response.data.totals
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
        var response = await ModelStreamService.delModelStream({ id: id, token: this.decryptSession('token') })
        if (response.data.status === 'success') {
          this.alert('positive', 'Eliminado')
          this.getModelsStreams()
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
        query = '&' + this.parentField + '=' + this.modelId
      }
      // url
      var url = this.getApiUrl('/api/models_streams/export?access_token=' + this.decryptSession('token') + query)
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

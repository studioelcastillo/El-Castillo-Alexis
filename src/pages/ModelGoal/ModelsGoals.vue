<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card">
          <q-card-section>
            <div class="text-h5 text-weight-bolder">
              Metas
              <!--<a v-if="(!isSubgrid || parentMode == 'edit') && openGate('add-models_goals', sUser.prof_id)" class="text-green" style="cursor: pointer;" @click="(isSubgrid) ? openSubgridForm('create') : goTo('models_goals/new')"> <q-icon name="add_box"/> </a>-->
              <a class="text-blue" style="cursor: pointer;" @click="downloadExcel()"><q-icon name="move_to_inbox"/><q-tooltip :delay="100" :offset="[0, 10]">Descargar Metas</q-tooltip></a>
            </div>
          </q-card-section>

          <q-separator inset />

          <q-card-section>
            <q-table
              title="Metas"
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
                  <q-td key="modgoal_id" :props="props">{{ props.row.modgoal_id }}</q-td>
                  <q-td key="stdmod_id" :props="props">{{ miles(props.row.stdmod_id) }}</q-td>
                  <q-td key="modgoal_type" :props="props">{{ props.row.modgoal_type }}</q-td>
                  <q-td key="modgoal_amount" :props="props">{{ miles(props.row.modgoal_amount) }}</q-td>
                  <q-td key="modgoal_percent" :props="props">
                    {{ miles(props.row.modgoal_percent) }}
                    {{ props.row.modgoal_reach_goal ? '✅' : '❌' }}
                  </q-td>
                  <q-td key="modgoal_date" :props="props">{{ props.row.modgoal_date }}</q-td>
                  <q-td key="modgoal_auto" :props="props"><q-chip>{{ props.row.modgoal_auto ? 'AUTO' : 'MANUAL' }}</q-chip></q-td>
                  <q-td key="created_at" :props="props">{{ convertUTCDateToLocalDate(props.row.created_at, 'DD/MM/YYYY hh:mm:ss a') }}</q-td>
                  <q-td key="action" :props="props">
                    <a v-if="openGate('show-models_goals', sUser.prof_id)" class="text-blue-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('show', props.row.modgoal_id) : goTo('models_goals/show/' + props.row.modgoal_id)"> <q-icon size="md" name="visibility"/>
                      <q-tooltip :offset="[0, 10]">Ver</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('edit-models_goals', sUser.prof_id) && props.row.period_state == 'ABIERTO'" class="text-blue-grey-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('edit', props.row.modgoal_id) : goTo('models_goals/edit/' + props.row.modgoal_id)"> <q-icon size="md" name="edit"/>
                      <q-tooltip :offset="[0, 10]">Editar</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('delete-models_goals', sUser.prof_id) && props.row.period_state == 'ABIERTO'" class="text-red" style="cursor: pointer;" @click="deleteDialog(props.row.modgoal_id)"> <q-icon size="md" name="delete"/>
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
            <ModelGoalForm :is-dialog="true" :parent-table="parentTable" :parent-field="parentField" :parent-id="parentId" :dialog-child-id="dialogChildId" :modeprop="dialogMode" @save="getModelsGoals()" @close="dialogChildId = null; dialog = false"/>
          </q-card>
        </q-dialog>
      </div>
    </div>
  </div>
</template>

<script>
import ModelGoalService from 'src/services/ModelGoalService'
import ModelGoalForm from 'src/pages/ModelGoal/ModelGoalForm.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'ModelsGoalsList',
  mixins: [xMisc, sGate],
  components: {
    ModelGoalForm
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
      visibleColumns: ['stdmod_id', 'modgoal_type', 'modgoal_amount', 'created_at', 'modgoal_percent', 'modgoal_date', 'modgoal_auto'],
      columns: [
        {
          name: 'modgoal_id',
          required: true,
          label: 'Id',
          align: 'left',
          field: row => row.modgoal_id,
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
          name: 'modgoal_type',
          required: true,
          label: 'Tipo',
          align: 'left',
          field: row => row.modgoal_type,
          sortable: true
        },
        {
          name: 'modgoal_amount',
          required: true,
          label: 'Monto',
          align: 'left',
          field: row => row.modgoal_amount,
          sortable: true
        },
        {
          name: 'modgoal_percent',
          required: true,
          label: 'Porcentaje de ingreso',
          align: 'left',
          field: row => row.modgoal_percent,
          sortable: true
        },
        {
          name: 'modgoal_date',
          required: true,
          label: 'Periodo',
          align: 'left',
          field: row => row.modgoal_date,
          sortable: true
        },
        {
          name: 'modgoal_auto',
          required: true,
          label: 'Asignado',
          align: 'left',
          field: row => row.modgoal_auto,
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
    this.getModelsGoals()
  },
  methods: {
    async getModelsGoals () {
      try {
        this.loading = true
        if (this.openGate('menu-models_goals', this.sUser.prof_id)) {
          let query = (this.isSubgrid) ? this.parentField + '=' + this.parentId : ''
          var response = await ModelGoalService.getModelsGoals({ query: query, token: this.decryptSession('token') })
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
        var response = await ModelGoalService.delModelGoal({ id: id, token: this.decryptSession('token') })
        if (response.data.status === 'success') {
          this.alert('positive', 'Eliminado')
          this.getModelsGoals()
        } else {
          this.alert('negative', 'Error')
        }
        this.disableLoading()
      } catch (error) {
        if (error.response.data.message === 'El periodo relacionado a esta meta esta cerrado y no puede ser eliminada') {
          this.alert('negative', error.response.data.message)
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
      var url = this.getApiUrl('/api/models_goals/export?access_token=' + this.decryptSession('token') + query)
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

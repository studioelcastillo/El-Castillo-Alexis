<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12" v-if="this.openGate('menu-studios', this.sUser.prof_id)">
        <q-card flat bordered class="my-card">
          <q-card-section>
            <div class="text-h5 text-weight-bolder">
              Estudios
              <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('add-studios', sUser.prof_id)" class="text-green" style="cursor: pointer;" @click="(isSubgrid) ? openSubgridForm('create') : goTo('studios/new')"> <q-icon name="add_box"/> </a>
              <a class="text-blue" style="cursor: pointer;" @click="downloadExcel()"><q-icon name="move_to_inbox"/><q-tooltip :delay="100" :offset="[0, 10]">Descargar Estudios</q-tooltip></a>
            </div>
          </q-card-section>

          <q-separator inset />

          <q-card-section>
            <q-table
              title="Estudios"
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
                <br>
                <q-toggle
                  v-model="filterToggleActive"
                  @update:model-value="getStudios()"
                  color="green"
                  checked-icon="check"
                  unchecked-icon="clear"
                  :label="filterToggleActiveLabel"
                />
              </template>
              <!-- body -->
              <template v-slot:body="props">
                <q-tr :props="props">
                  <q-td key="std_id" :props="props">{{ props.row.std_id }}</q-td>
                  <q-td key="std_active" :props="props">
                    <q-toggle
                      v-model="props.row.std_active"
                      @update:model-value="toggleActive(props.row)"
                      color="green"
                      checked-icon="check"
                      unchecked-icon="clear"
                    />
                  </q-td>
                  <q-td key="std_nit" :props="props">{{ props.row.std_nit }}</q-td>
                  <q-td key="std_name" :props="props">{{ props.row.std_name }}</q-td>
                  <!--<q-td key="std_shifts" :props="props">{{ props.row.std_shifts }}</q-td>-->
                  <q-td key="std_percent" :props="props">{{ miles(props.row.std_percent) }}</q-td>
                  <q-td key="std_liquidation_interval" :props="props">{{ props.row.std_liquidation_interval }}</q-td>
                  <q-td key="created_at" :props="props">{{ convertUTCDateToLocalDate(props.row.created_at, 'DD/MM/YYYY hh:mm:ss a') }}</q-td>
                  <!-- <q-td key="std_ally" :props="props">
                    <q-chip v-if="props.row.std_ally" color="green-3">SI</q-chip>
                    <q-chip v-else color="red-3">NO</q-chip>
                  </q-td> -->
                  <q-td key="action" :props="props">
                    <a v-if="openGate('show-studios', sUser.prof_id)" class="text-blue-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('show', props.row.std_id) : goTo('studios/show/' + props.row.std_id)"> <q-icon size="md" name="visibility"/>
                      <q-tooltip :offset="[0, 10]">Ver</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && (openGate('edit-studios', sUser.prof_id) || openGate('menu-studios_rooms', sUser.prof_id))" class="text-blue-grey-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('edit', props.row.std_id) : goTo('studios/edit/' + props.row.std_id)"> <q-icon size="md" name="edit"/>
                      <q-tooltip :offset="[0, 10]">Editar</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('delete-studios', sUser.prof_id)" class="text-red" style="cursor: pointer;" @click="deleteDialog(props.row.std_id)"> <q-icon size="md" name="delete"/>
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
            <StudioForm :is-dialog="true" :parent-table="parentTable" :parent-field="parentField" :parent-id="parentId" :dialog-child-id="dialogChildId" :modeprop="dialogMode" @save="getStudios()" @close="dialogChildId = null; dialog = false"/>
          </q-card>
        </q-dialog>
      </div>
    </div>
  </div>
</template>

<script>
import StudioService from 'src/services/StudioService'
import StudioForm from 'src/pages/Studio/StudioForm.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'StudiosList',
  mixins: [xMisc, sGate],
  components: {
    StudioForm
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
      visibleColumns: ['std_active','std_nit', 'std_name', 'std_percent', 'std_liquidation_interval', 'created_at', 'std_image', 'std_bank_entity', 'std_bank_account', 'std_bank_account_type'],
      columns: [
        {
          name: 'std_id',
          required: true,
          label: 'Id',
          align: 'left',
          field: row => row.std_id,
          sortable: true
        },
         {
          name: 'std_active',
          required: true,
          label: 'Activo',
          align: 'left',
          field: row => row.std_active,
          sortable: true
        },
        {
          name: 'std_nit',
          required: true,
          label: 'NIT',
          align: 'left',
          field: row => row.std_nit,
          sortable: true
        },
        {
          name: 'std_name',
          required: true,
          label: 'Nombre',
          align: 'left',
          field: row => row.std_name,
          sortable: true
        },
        {
          name: 'std_shifts',
          required: false,
          label: 'Turnos',
          align: 'left',
          field: row => row.std_shifts,
          sortable: true
        },
        {
          name: 'std_percent',
          required: true,
          label: 'Porcentaje de ingreso',
          align: 'left',
          field: row => row.std_percent,
          sortable: true
        },
        {
          name: 'std_liquidation_interval',
          required: true,
          label: 'Intervalo de Liq.',
          align: 'left',
          field: row => row.std_liquidation_interval,
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
        // {
        //   name: 'std_ally',
        //   required: true,
        //   label: '¿Estudio aliado?',
        //   align: 'center',
        //   field: row => row.std_ally,
        //   sortable: true
        // },
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
      },
      filterToggleActive: true
    }
  },
  computed: {
    filterToggleActiveLabel () {
      return (this.filterToggleActive) ? 'Estudios activos' : 'Estudios inactivos'
    }
  },
  created () {
    this.sUser = this.decryptSession('user')
    this.getStudios()
  },
  methods: {
    async getStudios () {
      try {
        this.loading = true
        if (this.openGate('menu-studios', this.sUser.prof_id)) {
          let query = (this.isSubgrid) ? this.parentField + '=' + this.parentId : ''
          query += '&active=' + this.filterToggleActive
          var response = await StudioService.getStudios({ query: query, token: this.decryptSession('token') })
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
        var response = await StudioService.delStudio({ id: id, token: this.decryptSession('token') })
        if (response.data.status === 'success') {
          this.alert('positive', 'Eliminado')
          this.getStudios()
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
      var url = this.getApiUrl('/api/studios/export?access_token=' + this.decryptSession('token') + query)
      var win = window.open(url, '_blank')
      win.focus()      
    },
    async toggleActive (row) {
      var newState = row.std_active
      try {
        this.activateLoading(this.$t('loading'))

        // activate
        if (newState === true) {
          var response = await StudioService.activateStudio({ id: row.std_id, token: this.decryptSession('token') })
          var successMessage = this.$t('activated')
        // inactivate
        } else if (newState === false) {
          var response = await StudioService.inactivateStudio({ id: row.std_id, token: this.decryptSession('token') })
          var successMessage = this.$t('inactivated')
        }

        if (response.data.status === 'success') {
          this.alert('positive', successMessage)
          row.std_active = newState
        } else {
          this.alert('negative', this.$t('errorMessage'))
          row.std_active = !newState
        }

        this.disableLoading()
      } catch (error) {
        console.log(error)
        row.std_active = !newState
        this.errorsAlerts(error)
        this.disableLoading()
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

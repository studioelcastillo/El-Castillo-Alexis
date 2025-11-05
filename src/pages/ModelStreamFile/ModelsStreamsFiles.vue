<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card">
          <q-card-section>
            <div class="text-h5 text-weight-bolder">
              Cargues de streams
              <!-- <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('add-models_streams_files', sUser.prof_id)" class="text-green" style="cursor: pointer;" @click="(isSubgrid) ? openSubgridForm('create') : goTo('models_streams_files/new')"> <q-icon name="add_box"/> </a> -->
              <!-- <a class="text-blue" style="cursor: pointer;" @click="downloadExcel()"><q-icon name="move_to_inbox"/><q-tooltip :delay="100" :offset="[0, 10]">Descargar Cargues de streams</q-tooltip></a> -->
              <a class="text-blue" style="cursor: pointer;" @click="getModelsStreamsFiles()"> <q-icon name="refresh"/> </a>
            </div>
          </q-card-section>

          <q-separator inset />

          <q-card-section>
            <q-toggle
              v-model="filterToggleDate"
              color="green"
              checked-icon="check"
              unchecked-icon="clear"
              :label="filterToggleDateLabel"
            />
            <q-table
              title="Cargues de streams"
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
                  <q-td key="modstrfile_id" :props="props">{{ props.row.modstrfile_id }}</q-td>
                  <q-td key="modstrfile_description" :props="props">{{ props.row.modstrfile_description }}</q-td>
                  <q-td key="modstrfile_filename" :props="props">{{ props.row.modstrfile_filename }}</q-td>
                  <q-td key="modstrfile_template" :props="props"><q-chip>{{ props.row.modstrfile_template }}</q-chip></q-td>
                  <q-td key="created_by.user_name" :props="props"><q-chip>{{ (props.row.created_by) ? props.row.created_by.user_name : null }}</q-chip></q-td>
                  <q-td key="created_at" :props="props">{{ convertUTCDateToLocalDate(props.row.created_at, 'DD/MM/YYYY hh:mm:ss a') }}</q-td>
                  <q-td key="action" :props="props">
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('download-models_streams_files', sUser.prof_id)" class="text-blue" style="cursor: pointer;" @click="downloadFile(props.row.modstrfile_id)"> <q-icon size="md" name="move_to_inbox"/>
                      <q-tooltip :delay="100" :offset="[0, 10]">Descargar archivo</q-tooltip>
                    </a>
                    <a v-if="openGate('show-models_streams_files', sUser.prof_id)" class="text-blue-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('show', props.row.modstrfile_id) : goTo('models_streams_files/show/' + props.row.modstrfile_id)"> <q-icon size="md" name="visibility"/>
                      <q-tooltip :offset="[0, 10]">Ver</q-tooltip>
                    </a>
                    <!-- <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('edit-models_streams_files', sUser.prof_id)" class="text-blue-grey-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('edit', props.row.modstrfile_id) : goTo('models_streams_files/edit/' + props.row.modstrfile_id)"> <q-icon size="md" name="edit"/>
                      <q-tooltip :offset="[0, 10]">Editar</q-tooltip>
                    </a> -->
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('delete-models_streams_files', sUser.prof_id)" class="text-red" style="cursor: pointer;" @click="deleteDialog(props.row.modstrfile_id)"> <q-icon size="md" name="delete"/>
                      <q-tooltip :offset="[0, 10]">Eliminar</q-tooltip>
                    </a>
                  </q-td>
                </q-tr>
              </template>
            </q-table>
          </q-card-section>
        </q-card>

        <q-dialog v-if="isSubgrid" v-model="dialog" full-width full-height>
          <q-card style="width: 100%;">
            <ModelStreamFileForm :is-dialog="true" :parent-table="parentTable" :parent-field="parentField" :parent-id="parentId" :dialog-child-id="dialogChildId" :modeprop="dialogMode" @save="getModelsStreamsFiles()" @close="dialogChildId = null; dialog = false"/>
          </q-card>
        </q-dialog>
      </div>
    </div>
  </div>
</template>

<script>
import ModelStreamFileService from 'src/services/ModelStreamFileService'
import ModelStreamFileForm from 'src/pages/ModelStreamFile/ModelStreamFileForm.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'ModelsStreamsFilesList',
  mixins: [xMisc, sGate],
  components: {
    ModelStreamFileForm
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
    period: {
      type: Object,
      default: null
    }
  },
  watch: {
    period: {
      handler(newVal) {
        if (newVal.value != 0) {
          this.getModelsStreamsFiles()
        }
      },
      immediate: true
    },
    filterToggleDate: {
      handler(newVal) {
        this.getModelsStreamsFiles()
      }
    }
  },
  computed: {
    filterToggleDateLabel () {
      return (this.filterToggleDate) ? 'Filtrado por periodo' : 'Todos los periodos'
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
      visibleColumns: ['modstrfile_description', 'modstrfile_filename', 'modstrfile_template', 'created_by', 'created_at'],
      columns: [
        {
          name: 'modstrfile_id',
          required: true,
          label: 'Id',
          align: 'left',
          field: row => row.modstrfile_id,
          sortable: true
        },
        {
          name: 'modstrfile_description',
          required: true,
          label: 'Descripción',
          align: 'left',
          field: row => row.modstrfile_description,
          sortable: true
        },
        {
          name: 'modstrfile_filename',
          required: true,
          label: 'Nombre de archivo',
          align: 'left',
          field: row => row.modstrfile_filename,
          sortable: true
        },
        {
          name: 'modstrfile_template',
          required: true,
          label: 'Plantilla',
          align: 'left',
          field: row => row.modstrfile_template,
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
      },
      filterToggleDate: true
    }
  },
  created () {
    this.sUser = this.decryptSession('user')
    // this.getModelsStreamsFiles()
  },
  methods: {
    async getModelsStreamsFiles () {
      try {
        this.loading = true
        let query = (this.isSubgrid) ? this.parentField + '=' + this.parentId : ''
        if (this.period && this.filterToggleDate) {
          query += '&period_since=' + this.period.since + '&period_until=' + this.period.until
        }
        var response = await ModelStreamFileService.getModelsStreamsFiles({ query: query, token: this.decryptSession('token') })
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
        var response = await ModelStreamFileService.delModelStreamFile({ id: id, token: this.decryptSession('token') })
        if (response.data.status === 'success') {
          this.alert('positive', 'Eliminado')
          this.getModelsStreamsFiles()
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
      var url = this.getApiUrl('/api/models_streams_files/export?access_token=' + this.decryptSession('token') + query)
      var win = window.open(url, '_blank')
      win.focus()      
    },
    downloadFile (id) {
      // url
      var url = this.getApiUrl('/api/models_streams_files/download/' + id + '?access_token=' + this.decryptSession('token'))
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
</style>

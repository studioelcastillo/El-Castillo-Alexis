<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card">
          <q-card-section>
            <div class="text-h5 text-weight-bolder">
              Configuración
              <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('add-settings', sUser.prof_id)" class="text-green" style="cursor: pointer;" @click="(isSubgrid) ? openSubgridForm('create') : goTo('settings/new')"> <q-icon name="add_box"/> </a>
              <a class="text-blue" style="cursor: pointer;" @click="downloadExcel()"><q-icon name="move_to_inbox"/><q-tooltip :delay="100" :offset="[0, 10]">Descargar Configuración</q-tooltip></a>
            </div>
          </q-card-section>

          <q-separator inset />

          <q-card-section>
            <q-table
              title="Configuración"
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
                  <q-td key="sett_id" :props="props">{{ props.row.sett_id }}</q-td>
                  <q-td key="sett_key" :props="props">{{ props.row.sett_key }}</q-td>
                  <q-td key="sett_value" :props="props">{{ props.row.sett_value }}</q-td>
                  <q-td key="sett_active" :props="props">
                    <q-toggle
                      v-model="props.row.toggleActive"
                      @update:model-value="toggleActive(props.row)"
                      color="green"
                      checked-icon="check"
                      unchecked-icon="clear"
                    />
                  </q-td>
                  <q-td key="sett_default" :props="props">{{ props.row.sett_default }}</q-td>
                  <q-td key="sett_year" :props="props">{{ miles(props.row.sett_year) }}</q-td>
                  <q-td key="sett_since" :props="props">{{ props.row.sett_since }}</q-td>
                  <q-td key="sett_until" :props="props">{{ props.row.sett_until }}</q-td>
                  <q-td key="created_at" :props="props">{{ convertUTCDateToLocalDate(props.row.created_at, 'DD/MM/YYYY hh:mm:ss a') }}</q-td>
                  <q-td key="action" :props="props">
                    <a v-if="openGate('show-settings', sUser.prof_id)" class="text-blue-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('show', props.row.sett_id) : goTo('settings/show/' + props.row.sett_id)"> <q-icon size="md" name="visibility"/>
                      <q-tooltip :offset="[0, 10]">Ver</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('edit-settings', sUser.prof_id)" class="text-blue-grey-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('edit', props.row.sett_id) : goTo('settings/edit/' + props.row.sett_id)"> <q-icon size="md" name="edit"/>
                      <q-tooltip :offset="[0, 10]">Editar</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('delete-settings', sUser.prof_id)" class="text-red" style="cursor: pointer;" @click="deleteDialog(props.row.sett_id)"> <q-icon size="md" name="delete"/>
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
            <SettingForm :is-dialog="true" :parent-table="parentTable" :parent-field="parentField" :parent-id="parentId" :dialog-child-id="dialogChildId" :modeprop="dialogMode" @save="getSettings()" @close="dialogChildId = null; dialog = false"/>
          </q-card>
        </q-dialog>
      </div>
    </div>
  </div>
</template>

<script>
import SettingService from 'src/services/SettingService'
import SettingForm from 'src/pages/Setting/SettingForm.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'SettingsList',
  mixins: [xMisc, sGate],
  components: {
    SettingForm
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
      visibleColumns: ['sett_key', 'sett_value', 'sett_active', 'sett_default', 'sett_year', 'sett_since', 'sett_until', 'created_at'],
      columns: [
        {
          name: 'sett_id',
          required: true,
          label: 'Id',
          align: 'left',
          field: row => row.sett_id,
          sortable: true
        },
        {
          name: 'sett_key',
          required: true,
          label: 'Clave',
          align: 'left',
          field: row => row.sett_key,
          sortable: true
        },
        {
          name: 'sett_value',
          required: true,
          label: 'Valor',
          align: 'left',
          field: row => row.sett_value,
          sortable: true
        },
        {
          name: 'sett_active',
          required: true,
          label: 'Activo',
          align: 'center',
          field: row => row.sett_active,
          sortable: true
        },
        {
          name: 'sett_default',
          required: true,
          label: 'Valor por defecto',
          align: 'left',
          field: row => row.sett_default,
          sortable: true
        },
        {
          name: 'sett_year',
          required: true,
          label: 'Año',
          align: 'left',
          field: row => row.sett_year,
          sortable: true
        },
        {
          name: 'sett_since',
          required: true,
          label: 'Desde',
          align: 'left',
          field: row => row.sett_since,
          sortable: true
        },
        {
          name: 'sett_until',
          required: true,
          label: 'Hasta',
          align: 'left',
          field: row => row.sett_until,
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
    this.getSettings()
  },
  methods: {
    async getSettings () {
      try {
        this.loading = true
        let query = (this.isSubgrid) ? this.parentField + '=' + this.parentId : ''
        var response = await SettingService.getSettings({ query: query, token: this.decryptSession('token') })
        this.dataset = response.data.data
        for (var i = 0; i < this.dataset.length; i++) {
          this.dataset[i].toggleActive = this.dataset[i].sett_active
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
        var response = await SettingService.delSetting({ id: id, token: this.decryptSession('token') })
        if (response.data.status === 'success') {
          this.alert('positive', 'Eliminado')
          this.getSettings()
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
      var url = this.getApiUrl('/api/settings/export?access_token=' + this.decryptSession('token') + query)
      var win = window.open(url, '_blank')
      win.focus()      
    },
    async toggleActive (row) {
      var newState = row.toggleActive
      try {
        this.activateLoading(this.$t('loading'))

        // activate
        if (newState === true) {
          var response = await SettingService.activateSetting({ id: row.sett_id, token: this.decryptSession('token') })
          var successMessage = this.$t('activated')
        // inactivate
        } else if (newState === false) {
          var response = await SettingService.inactivateSetting({ id: row.sett_id, token: this.decryptSession('token') })
          var successMessage = this.$t('inactivated')
        }

        if (response.data.status === 'success') {
          this.alert('positive', successMessage)
          row.user_active = newState
          row.toggleActive = newState
        } else {
          this.alert('negative', this.$t('errorMessage'))
          row.user_active = !newState
          row.toggleActive = !newState
        }

        this.disableLoading()
      } catch (error) {
        console.log(error)
        row.user_active = !newState
        row.toggleActive = !newState
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

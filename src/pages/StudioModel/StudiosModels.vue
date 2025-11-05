<template>
  <div class="q-pt-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card">
          <q-card-section>
            <div class="text-h5">
              Contratos
              <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('add-studios_models', sUser.prof_id)" class="text-green" style="cursor: pointer;" @click="(isSubgrid) ? openSubgridForm('create') : goTo('studios_models/new')"> <q-icon name="add_box"/> </a>
              <a class="text-blue" style="cursor: pointer;" @click="downloadExcel()"><q-icon name="move_to_inbox"/><q-tooltip :delay="100" :offset="[0, 10]">Descargar Contratos</q-tooltip></a>
            </div>
          </q-card-section>

          <q-separator inset />

          <q-card-section>
            <q-table
              title="Contratos"
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
                  <!--<q-td key="stdmod_id" :props="props">{{ props.row.stdmod_id }}</q-td>-->
                  <q-td key="stdmod_contract_number" :props="props">{{ props.row.stdmod_contract_number }}</q-td>
                  <q-td key="studio.std_name" :props="props">{{ (props.row.studio) ? props.row.studio.std_name : null }}</q-td>
                  <q-td key="studio_room.stdroom_name" :props="props">{{ (props.row.studio_room) ? props.row.studio_room.stdroom_name : null }}</q-td>
                  <!--<q-td key="user_model.user_name" :props="props">{{ (props.row.user_model) ? props.row.user_model.user_name : null }}</q-td>
                  <q-td key="user_model.user_surname" :props="props">{{ (props.row.user_model) ? props.row.user_model.user_surname : null }}</q-td>-->
                  <q-td key="stdmod_start_at" :props="props">{{ props.row.stdmod_start_at }}</q-td>
                  <q-td key="stdmod_finish_at" :props="props">{{ props.row.stdmod_finish_at }}</q-td>
                  <q-td key="stdmod_active" :props="props">
                    <template v-if="parentMode == 'show' || !openGate('activate-inactivate-studios_models', sUser.prof_id)">
                      <q-chip v-if="props.row.toggleActive" color="green-3">SI</q-chip>
                      <q-chip v-else color="red-3">NO</q-chip>
                    </template>
                    <q-toggle
                      v-else
                      v-model="props.row.toggleActive"
                      @update:model-value="toggleActive(props.row)"
                      color="green"
                      checked-icon="check"
                      unchecked-icon="clear"
                    />
                  </q-td>
                  <q-td key="stdmod_percent" :props="props">{{ miles(props.row.stdmod_percent) }}</q-td>
                  <q-td key="stdmod_rtefte" :props="props">
                    <q-chip v-if="props.row.stdmod_rtefte" color="green-3">SI</q-chip>
                    <q-chip v-else color="red-3">NO</q-chip>
                  </q-td>
                  <q-td key="created_at" :props="props">{{ convertUTCDateToLocalDate(props.row.created_at, 'DD/MM/YYYY hh:mm:ss a') }}</q-td>
                  <q-td key="studio_shift.stdshift_name" :props="props">{{ (props.row.studio_shift) ? props.row.studio_shift.stdshift_name : null }}</q-td>
                  <q-td key="stdmod_commission_type" :props="props">{{ props.row.stdmod_commission_type }}</q-td>
                  <q-td key="stdmod_goal" :props="props">{{ miles(props.row.stdmod_goal) }}</q-td>
                  <q-td key="action" :props="props">
                    <a v-if="openGate('show-studios_models', sUser.prof_id)" class="text-blue-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('show', props.row.stdmod_id) : goTo('studios_models/show/' + props.row.stdmod_id)"> <q-icon size="md" name="visibility"/>
                      <q-tooltip :offset="[0, 10]">Ver</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('edit-studios_models', sUser.prof_id)" class="text-blue-grey-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('edit', props.row.stdmod_id) : goTo('studios_models/edit/' + props.row.stdmod_id)"> <q-icon size="md" name="edit"/>
                      <q-tooltip :offset="[0, 10]">Editar</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('delete-studios_models', sUser.prof_id)" class="text-red" style="cursor: pointer;" @click="deleteDialog(props.row.stdmod_id)"> <q-icon size="md" name="delete"/>
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
            <StudioModelForm
              :is-dialog="true"
              :parent-table="parentTable"
              :parent-field="parentField"
              :parent-id="parentId"
              :dialog-child-id="dialogChildId"
              :modeprop="dialogMode"
              :user-model="userModel"
              @save="getStudiosModels()"
              @close="dialogChildId = null; dialog = false"
            />
          </q-card>
        </q-dialog>
      </div>
    </div>
  </div>
</template>

<script>
import StudioModelService from 'src/services/StudioModelService'
import StudioModelForm from 'src/pages/StudioModel/StudioModelForm.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'StudiosModelsList',
  mixins: [xMisc, sGate],
  components: {
    StudioModelForm
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
    userModel: {
      type: Object,
      default: function () {
        return {
          value: 0,
          label: ''
        }
      }
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
      visibleColumns: ['stdroom_id', 'stdmod_contract_number', 'user_id_model', 'stdmod_start_at', 'stdmod_finish_at', 'stdmod_active', 'stdmod_percent', 'stdmod_rtefte', 'created_at', 'stdshift_id', 'stdmod_commission_type', 'stdmod_goal'],
      columns: [
        {
          name: 'stdmod_id',
          required: false,
          label: 'Id',
          align: 'left',
          field: row => row.stdmod_id,
          sortable: true
        },
        {
          name: 'stdmod_contract_number',
          required: false,
          label: 'Nro de contrato',
          align: 'left',
          field: row => row.stdmod_contract_number,
          sortable: true
        },
        {
          name: 'studio.std_name',
          required: true,
          label: 'Estudio',
          align: 'left',
          field: row => (row.studio) ? row.studio.std_name : null,
          sortable: true
        },
        {
          name: 'studio_room.stdroom_name',
          required: true,
          label: 'Cuarto',
          align: 'left',
          field: row => (row.studio_room) ? row.studio_room.stdroom_name : null,
          sortable: true
        },
        {
          name: 'user_model.user_name',
          required: false,
          label: 'Usuario',
          align: 'left',
          field: row => (row.user_model) ? row.user_model.user_name : null,
          sortable: true
        },
        {
          name: 'user_model.user_surname',
          required: false,
          label: 'Apellido',
          align: 'left',
          field: row => (row.user_model) ? row.user_model.user_surname : null,
          sortable: true
        },
        {
          name: 'stdmod_start_at',
          required: true,
          label: 'Inicio',
          align: 'left',
          field: row => row.stdmod_start_at,
          sortable: true
        },
        {
          name: 'stdmod_finish_at',
          required: true,
          label: 'Fin',
          align: 'left',
          field: row => row.stdmod_finish_at,
          sortable: true
        },
        {
          name: 'stdmod_active',
          required: true,
          label: 'Activo',
          align: 'center',
          field: row => row.stdmod_active,
          sortable: true
        },
        {
          name: 'stdmod_percent',
          required: true,
          label: 'Porcentaje de ingreso',
          align: 'left',
          field: row => row.stdmod_percent,
          sortable: true
        },
        {
          name: 'stdmod_rtefte',
          required: true,
          label: '¿Apllica Rte. Fte?',
          align: 'center',
          field: row => row.stdmod_rtefte,
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
          name: 'studio_shift.stdshift_name',
          required: true,
          label: 'Turno',
          align: 'left',
          field: row => (row.studio_shift) ? row.studio_shift.stdshift_name : null,
          sortable: true
        },
        {
          name: 'stdmod_commission_type',
          required: true,
          label: 'Tipo de comisión',
          align: 'left',
          field: row => row.stdmod_commission_type,
          sortable: true
        },
        {
          name: 'stdmod_goal',
          required: true,
          label: 'Meta',
          align: 'left',
          field: row => row.stdmod_goal,
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
    this.getStudiosModels()
  },
  methods: {
    async getStudiosModels () {
      try {
        this.loading = true
        if (this.openGate('menu-studios_models', this.sUser.prof_id)) {
          let query = (this.isSubgrid) ? 'parentfield=' + this.parentField  : ''
          query += (this.isSubgrid) ? '&parentid=' + this.parentId : ''
          //query += (this.isSubgrid) ? '&user_id_owner=' + this.ownerId : ''
          var response = await StudioModelService.getStudiosModels({ query: query, token: this.decryptSession('token') })
          this.dataset = response.data.data
          for (var i = 0; i < this.dataset.length; i++) {
            this.dataset[i].toggleActive = this.dataset[i].stdmod_active
          }
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
        var response = await StudioModelService.delStudioModel({ id: id, token: this.decryptSession('token') })
        if (response.data.status === 'success') {
          this.alert('positive', 'Eliminado')
          this.getStudiosModels()
        } else {
          if (response.data.code === 'UNEXPECTED_ERROR') {
            this.alert('negative', response.data.message)
          } else {
            this.alert('warning', response.data.message)
          }
        }
        this.disableLoading()
      } catch (error) {
        this.activateLoading('Cargando')
        if (error.response && error.response.data && error.response.data.code && error.response.data.message) {
          if (error.response.data.code === 'UNEXPECTED_ERROR') {
            this.alert('negative', error.response.data.message)
          } else {
            this.alert('warning', error.response.data.message)
          }
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
      var url = this.getApiUrl('/api/studios_models/export?access_token=' + this.decryptSession('token') + query)
      var win = window.open(url, '_blank')
      win.focus()
    },
    async toggleActive (row) {
      var newState = row.toggleActive
      try {
        this.activateLoading(this.$t('loading'))

        // activate
        if (newState === true) {
          var response = await StudioModelService.activateStudioModel({ id: row.stdmod_id, token: this.decryptSession('token') })
          var successMessage = this.$t('activated')
        // inactivate
        } else if (newState === false) {
          var response = await StudioModelService.inactivateStudioModel({ id: row.stdmod_id, token: this.decryptSession('token') })
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

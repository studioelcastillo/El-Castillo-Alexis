<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card">
          <q-card-section>
            <div class="text-h5 text-weight-bolder">
              Configuracion de comisiones
              <a v-if="openGate('add-commissions', sUser.prof_id)" class="text-green" style="cursor: pointer;" @click="goTo('setup_commissions/new')">
                <q-icon name="add_box"/>
              </a>
            </div>
          </q-card-section>

          <q-separator inset />

          <q-card-section>
            <q-table
              title="Configuraciones"
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
              <template v-slot:top="props">
                <div class="row q-col-gutter-sm"  style="max-width: 70%; min-width: 70%;">
                  <div class="col-xs-6 col-sm-6">
                    <!--#asegurase que los permisos funcionen para todos los roles -->
                    <gk-select-multiple
                      filled
                      v-model="studiosSelected"
                      label="Estudios"
                      label-color=""
                      use-input
                      hide-selected
                      fill-input
                      :options="studiosOptions"
                      :min-selection="0"
                      all-items-label="TODOS"
                      margin-bottom="18px"
                      @update:model-value="getCommissions"
                    />
                  </div>
                </div>
                <q-space />
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
              
              <template v-slot:body="props">
                <q-tr :props="props">
                  <q-td key="setcomm_id" :props="props">{{ props.row.setcomm_id }}</q-td>
                  <q-td key="studio" :props="props"> <span v-if="props.row.studio">{{ props.row.studio.std_name}}</span></q-td>
                  <q-td key="setcomm_title" :props="props">{{ props.row.setcomm_title }}</q-td>
                  <q-td key="setcomm_description" :props="props">{{ props.row.setcomm_description }}</q-td>
                  <q-td key="setcomm_type" :props="props">{{ props.row.setcomm_type }}</q-td>
                  <q-td key="created_at" :props="props">{{ convertUTCDateToLocalDate(props.row.created_at, 'DD/MM/YYYY hh:mm:ss a') }}</q-td>
                  <q-td key="action" :props="props">
                    <a v-if="openGate('show-commissions', sUser.prof_id)" class="text-blue-8" style="cursor: pointer; padding: 5px;" @click="goTo('setup_commissions/show/' + props.row.setcomm_id)">
                      <q-icon size="md" name="visibility"/>
                      <q-tooltip :offset="[0, 10]">Ver</q-tooltip>
                    </a>
                    <a v-if="openGate('edit-commissions', sUser.prof_id)" class="text-blue-grey-8" style="cursor: pointer; padding: 5px;" @click="goTo('setup_commissions/edit/' + props.row.setcomm_id)">
                      <q-icon size="md" name="edit"/>
                      <q-tooltip :offset="[0, 10]">Editar</q-tooltip>
                    </a>
                    <a v-if="openGate('delete-commissions', sUser.prof_id)" class="text-red" style="cursor: pointer;" @click="deleteDialog(props.row.setcomm_id)">
                      <q-icon size="md" name="delete"/>
                      <q-tooltip :offset="[0, 10]">Eliminar</q-tooltip>
                    </a>
                  </q-td>
                </q-tr>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script>
// Importa el servicio y mixins necesarios
import StudioService from 'src/services/StudioService'
import GkSelectMultiple from 'src/components/GkSelectMultiple.vue'
import CommissionService from 'src/services/SetupCommissionService'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'CommissionsList',
  mixins: [xMisc, sGate],
  data () {
    return {
      sUser: {},
      loading: false,
      dataset: [],
      filter: '',
      visibleColumns: ['setcomm_id', 'setcomm_title', 'setcomm_type', 'setcomm_value', 'setcomm_from', 'setcomm_until', 'created_at'],
      columns: [
        { name: 'setcomm_id', required: true, label: 'Id', align: 'left', field: row => row.setcomm_id, sortable: true },
        { name: 'studio', required: true, label: 'Estudio', align: 'left', field: row => row.studio.std_name, sortable: true },
        { name: 'setcomm_title', required: true, label: 'Título', align: 'left', field: row => row.setcomm_title, sortable: true },
        { name: 'setcomm_description', required: false, label: 'Descripción', align: 'left', field: row => row.setcomm_description, sortable: false },
        { name: 'setcomm_type', required: true, label: 'Tipo', align: 'left', field: row => row.setcomm_type, sortable: true },
        { name: 'created_at', required: true, label: 'Fecha creación', align: 'left', field: row => row.created_at, sortable: true },
        { name: 'action', required: true, label: 'Acciones', align: 'left', sortable: false }
      ],
      pagination: {
        sortBy: 'created_at',
        descending: true,
        page: 1,
        rowsPerPage: 20
      },
      studiosSelected: [],
      studiosOptions: [],
    }
  },
  components: {
    GkSelectMultiple
  },
  created () {
    this.sUser = this.decryptSession('user')
    this.getCommissions()
    this.getSelects()
  },
  methods: {
    async getCommissions () {
      try {
        this.loading = true
        const studiosSelected = this.studiosSelected.map(std => std.value)
        let query = ''
        query += '&studios=' + studiosSelected
        const response = await CommissionService.getCommissions({ query: query, token: this.decryptSession('token') })
        this.dataset = response.data.data
        
        this.loading = false
      } catch (error) {
        this.errorsAlerts(error)
        this.loading = false
      }
    },
    goTo (route) {
      this.$router.push({ path: '/' + route })
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
      })
    },
    async getSelects () {
      this.studiosOptions = []
      //this.studiosOptions.push({ label: 'Estudio base', value: -1 })
      const response2 = await StudioService.getStudios({ query: '', token: this.decryptSession('token') })
      for (var u = 0; u < response2.data.data.length; u++) {
        this.studiosOptions.push({
          label: response2.data.data[u].std_name,
          value: response2.data.data[u].std_id
        })
      }
    },
    async deleteData (id) {
      try {
        this.activateLoading('Cargando')
        const response = await CommissionService.delCommission({ id: id, token: this.decryptSession('token') })
        if (response.data.status === 'success') {
          this.alert('positive', 'Eliminado')
          this.getCommissions()
        } else {
          this.alert('negative', 'Error')
        }
        this.disableLoading()
      } catch (error) {
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

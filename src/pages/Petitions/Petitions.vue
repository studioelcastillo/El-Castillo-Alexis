<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card">
          <q-card-section>
            <div class="text-h5 text-weight-bolder">
              Solicitudes
              <a v-if="openGate('create-petitions', sUser.prof_id) || openGate('create-petition-own', sUser.prof_id)" class="text-green" style="cursor: pointer;" @click="goTo('petitions/new')"> <q-icon name="add_box"/> </a>
            </div>
          </q-card-section>

          <q-separator inset />

          <q-card-section>
            <q-table
              title="Solicitudes"
              dense
              :columns="columns"
              :rows="dataset"
              :loading="loading"
              :filter="filter"
              v-model:pagination="pagination"
              @request="onRequest"
              rows-per-page-label="Registros por página"
              no-data-label="No hay registros disponibles"
              binary-state-sort
            >
              <template v-slot:top="props">
                <div class="row q-col-gutter-sm"  style="max-width: 70%; min-width: 70%;">
                  <div class="col-xs-6 col-sm-6">
                    <gk-select-multiple
                      filled
                      v-model="statesFilter"
                      label="Estados"
                      label-color=""
                      use-input
                      hide-selected
                      fill-input
                      :options="statesFilterOptions"
                      :min-selection="0"
                      all-items-label="TODOS"
                      :all-items-option="true"
                      margin-bottom="18px"
                      @update:model-value="updateSelectMultiple"
                    />
                    
                  </div>
                  <div v-if="openGate('edit-petitions', sUser.prof_id)" class="col-xs-6 col-sm-6">
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
                      @update:model-value="updateSelectMultiple"
                    />
                  </div>
                </div>
                <q-space />
                <q-input borderless dense debounce="300" v-model="filter" placeholder="Buscar">
                  <template v-slot:append>
                    <q-icon name="search" />
                  </template>
                </q-input>
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
                  <q-td key="ptn_consecutive" :props="props">{{ props.row.ptn_consecutive }}</q-td>
                  <q-td key="ptn_type" :props="props">{{ props.row.ptn_type }}</q-td>
                  <q-td key="user_id" :props="props">{{ props.row.user.user_name + ' ' + props.row.user.user_surname}}</q-td>
                  <q-td key="state" :props="props"><q-chip :color="this.statesColors[props.row.petition_state[props.row.petition_state.length - 1].ptnstate_state]" text-color="white">{{ statesLabels[props.row.petition_state[props.row.petition_state.length - 1].ptnstate_state] }}</q-chip></q-td>
                  <q-td key="ptn_nick_final" :props="props">{{ props.row.ptn_nick_final }}</q-td>
                  <q-td key="ptn_page" :props="props">{{ props.row.ptn_page }}</q-td>
                  <q-td key="created_at" :props="props">{{ convertUTCDateToLocalDate(props.row.created_at, 'DD/MM/YYYY hh:mm:ss') }}</q-td>
                  <q-td key="updated_at" :props="props">{{ convertUTCDateToLocalDate(props.row.updated_at, 'DD/MM/YYYY hh:mm:ss') }}</q-td>
                  <q-td key="action" :props="props">
                    <a v-if="openGate('show-petitions', sUser.prof_id)" class="text-blue-8" style="cursor: pointer; padding: 5px;" @click="goTo('petitions/show/' + props.row.ptn_id)"> <q-icon size="md" name="visibility"/>
                      <q-tooltip :offset="[0, 10]">Ver</q-tooltip>
                    </a>
                    <a v-if="openGate('edit-petitions', sUser.prof_id)" class="text-blue-grey-8" style="cursor: pointer; padding: 5px;" @click="goTo('petitions/edit/' + props.row.ptn_id)"> <q-icon size="md" name="edit"/>
                      <q-tooltip :offset="[0, 10]">Editar</q-tooltip>
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
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'
import PetitionService from 'src/services/PetitionService'
import GkSelectMultiple from 'src/components/GkSelectMultiple.vue'
import StudioService from 'src/services/StudioService'

export default {
  name: 'PetitionsList',
  mixins: [xMisc, sGate],
  components: {
    GkSelectMultiple
  },
  props: {
    parentMode: {
      type: String,
      default: null
    }
  },
  data () {
    return {
      sUser: {},
      changePasswordDialog: false,
      columns: [
        {
          name: 'ptn_consecutive',
          required: true,
          label: 'Consecutivo',
          align: 'left',
          field: row => row.ptn_consecutive,
          sortable: true
        },
        {
          name: 'ptn_type',
          required: true,
          label: 'Tipo',
          align: 'left',
          field: row => row.ptn_type,
          sortable: true
        },
        {
          name: 'user_id',
          required: true,
          label: 'Usuario',
          align: 'left',
          field: row => row.user_id,
          sortable: true
        },
        {
          name: 'state',
          required: true,
          label: 'Estado',
          align: 'left',
          field: row => row.state,
          sortable: true
        },
        {
          name: 'ptn_nick_final',
          required: true,
          label: 'Nick',
          align: 'left',
          field: row => row.ptn_nick_final,
          sortable: true
        },
        {
          name: 'ptn_page',
          required: true,
          label: 'Pagina',
          align: 'left',
          field: row => row.ptn_page,
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
          name: 'updated_at',
          required: true,
          label: 'Última actualización',
          align: 'left',
          field: row => row.updated_at,
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
      dataset: [],
      statesColors: { 
        'EN PROCESO': 'orange',
        'PENDIENTE': 'deep-purple',
        'APROBADA': 'green',
        'RECHAZADA': 'red'
      },
      statesFilter: [
        { label: 'ABIERTO', value: 'EN PROCESO' },
        { label: 'EN PROCESO', value: 'PENDIENTE' }
      ],
      statesFilterOptions: [
        { label: 'ABIERTO', value: 'EN PROCESO' },
        { label: 'EN PROCESO', value: 'PENDIENTE' },
        { label: 'APROBADA', value: 'APROBADA' },
        { label: 'RECHAZADA', value: 'RECHAZADA' }
      ],
      statesLabels: {
        'EN PROCESO': 'ABIERTO',
        'PENDIENTE': 'EN PROCESO',
        'APROBADA': 'APROBADA',
        'RECHAZADA': 'RECHAZADA'
      },
      pagination: {
        sortBy: 'updated_at',
        descending: false,
        page: 1,
        rowsPerPage: 20,
      },
      filter: '',
      loading: false,
      studiosOptions: [],
      studiosSelected: []
    }
  },
  created () {
    this.sUser = this.decryptSession('user')
    this.getSelects()
    this.onRequest({
      pagination: this.pagination,
      filter: this.filter
    })
  },
  methods: {
    updateSelectMultiple () {
      this.onRequest({
        pagination: this.pagination,
        filter: this.filter
      })
    },
    async fetchFromServer (start, length, filter, sortBy, descending) {
      var columns = []
      var prefix = 'petitions.'
      for (var u = 0; u < this.columns.length; u++) {
        if (this.columns[u].name !== 'action' && this.columns[u].name !== 'state' && this.columns[u].name !== 'user_id') {
          columns.push(prefix + this.columns[u].name)
        }
      }
      const studiosSelected = this.studiosSelected.map(std => std.value)
      let query = ''
      query += 'start=' + start
      query += '&length=' + length
      query += '&sortby=petitions.' + sortBy
      query += '&dir=' + ((descending) ? 'DESC' : 'ASC')
      query += '&filter=' + filter
      query += '&columns=' + columns.join()
      query += '&studios=' + studiosSelected
      query += (!this.openGate('edit-petitions', this.sUser.prof_id)) ? '&user_id=' + this.sUser.user_id : ''
      const statesFilter = this.statesFilter.map(s => s.value)
      if (statesFilter.length > 0) {   
        query += (query.length > 1) ? '&' : ''
        query += 'states=' + statesFilter  
      }
      var response = await PetitionService.getPetitions({ query: query, token: this.decryptSession('token') })
      return response.data
    },
    async onRequest (props) {
      const { page, rowsPerPage, sortBy, descending } = props.pagination
      const filter = props.filter
      this.loading = true

      const startRow = (page - 1) * rowsPerPage
      const data = await this.fetchFromServer(startRow, rowsPerPage, filter, sortBy, descending)
      this.dataset = data.data
      this.pagination.rowsNumber = data.recordsTotal
      this.pagination.page = page
      this.pagination.rowsPerPage = rowsPerPage
      this.pagination.sortBy = sortBy
      this.pagination.descending = descending

      this.loading = false
    },
    async getSelects () {
      this.studiosOptions = []
      const response = await StudioService.getStudios({ query: '', token: this.decryptSession('token') })
      for (var u = 0; u < response.data.data.length; u++) {
        this.studiosOptions.push({
          label: response.data.data[u].std_name,
          value: response.data.data[u].std_id
        })
      }
    }
  }
}
</script>
<style type="text/css">
  body {
    background: #ECF0F3;
  }
  .q-table__top {
    align-items: start;
  }
</style>

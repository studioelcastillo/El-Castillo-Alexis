<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card">
          <q-card-section>
            <div class="text-h6">Historial de sesiones</div>
          </q-card-section>

          <q-separator inset />

          <q-card-section>
            <!-- :columns="columns" -->
            <q-table
              :title="Sesiones"
              dense
              :columns="columns"
              :rows="dataset"
              rows-per-page-label="Registros por página"
              :loading="loading"
              :filter="filter"
              v-model:pagination="pagination"
              @request="onRequest"
              binary-state-sort
            >
              <template v-slot:top-right>
                <q-input borderless dense debounce="300" v-model="filter" :placeholder="$t('search')">
                  <template v-slot:append>
                    <q-icon name="search" />
                  </template>
                </q-input>
                <!-- fullscreen -->
                <!-- <q-btn
                  flat round dense
                  :icon="props.inFullscreen ? 'fullscreen_exit' : 'fullscreen'"
                  @click="props.toggleFullscreen"
                  class="q-ml-md"
                /> -->
              </template>
              <!-- body -->
              <template v-slot:body="props">
                <q-tr :props="props">
                  <q-td key="lgnhist_id" :props="props">{{ props.row.lgnhist_id }}</q-td>
                  <q-td key="user" :props="props">{{ props.row.user_name + ' ' + props.row.user_surname }}</q-td>
                  <q-td key="lgnhist_login" :props="props">{{ convertUTCDateToLocalDate(props.row.lgnhist_login, 'DD/MM/YYYY hh:mm:ss') }}</q-td>
                  <q-td key="lgnhist_logout" :props="props">{{ convertUTCDateToLocalDate(props.row.lgnhist_logout, 'DD/MM/YYYY hh:mm:ss') }}</q-td>
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
import LoginHistoryService from 'src/services/LoginHistoryService'
import { xMisc } from 'src/mixins/xMisc.js'

export default {
  name: 'LoginHistory',
  mixins: [xMisc],
  components: {
  },
  data () {
    return {
      loading: false,
      dataset: [],
      filter: '',
      columns: [
        {
          name: 'lgnhist_id',
          required: true,
          label: 'Id',
          align: 'left',
          field: row => row.lgnhist_id,
          sortable: true
        },
        {
          name: 'user',
          required: true,
          label: 'Usuario',
          align: 'left',
          field: row => row.user_name + ' ' + row.user_surname,
          sortable: true
        },
        {
          name: 'lgnhist_login',
          required: true,
          label: 'Fecha inicio',
          align: 'left',
          field: row => row.lgnhist_login,
          sortable: true
        },
        {
          name: 'lgnhist_logout',
          required: true,
          label: 'Fecha cierre',
          align: 'left',
          field: row => row.lgnhist_logout,
          sortable: true
        }
      ],
      pagination: {
        sortBy: 'lgnhist_id',
        descending: true,
        page: 1,
        rowsPerPage: 20
      }
    }
  },
  created () {
    this.onRequest({
      pagination: this.pagination,
      filter: this.filter
    })
  },
  methods: {
    // on request datatable
    async onRequest (props) {
      try {
        this.loading = true
        // init
        const { page, rowsPerPage, sortBy, descending } = props.pagination
        const filter = props.filter
        const fetchCount = rowsPerPage
        const startRow = (page - 1) * rowsPerPage
        // async
        const response = await this.fetchFromServer(startRow, fetchCount, filter, sortBy, descending)
        this.dataset = response.data.data
        this.pagination.rowsNumber = response.data.recordsTotal
        this.pagination.page = page
        this.pagination.rowsPerPage = rowsPerPage
        this.pagination.sortBy = sortBy
        this.pagination.descending = descending
        // loading
        this.loading = false
      } catch (error) {
        this.errorsAlerts(error)
        this.loading = false
      }
    },
    // async request
    async fetchFromServer (start, length, filter, sortBy, descending) {

      let filters = ''
      filters += 'start=' + start
      filters += '&length=' + length
      filters += '&filter=' + filter
      filters += '&sortby=' + sortBy
      filters += '&dir=' + ((descending) ? 'DESC' : 'ASC')
      var response = await LoginHistoryService.getHistory({ token: this.decryptSession('token'), filters: filters })
      return response
    }
  }
}
</script>

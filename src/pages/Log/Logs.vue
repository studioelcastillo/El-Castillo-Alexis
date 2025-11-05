<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card">
          <q-card-section>
            <div class="text-h6">
              {{$t('log')}}
            </div>
          </q-card-section>

          <q-separator inset />

          <q-card-section>
            <!-- :columns="columns" -->
            <q-table
              :title="$t('log')"
              dense
              :columns="columns"
              :rows="dataset"
              :rows-per-page-label="$t('records')"
              :loading="loading"
              :filter="filter"
              v-model:pagination="pagination"
              @request="onRequest"
              binary-state-sort
            >
              <template v-slot:top-right="props">
                <q-input borderless dense debounce="300" v-model="filter" :placeholder="$t('search')">
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
                <!-- another buttons -->
                <q-btn round size="sm" color="primary" icon="archive" @click="exportLog()">
                  <q-tooltip :offset="[0, 10]">{{$t('export')}}</q-tooltip>
                </q-btn>
              </template>
              <!-- body -->
              <template v-slot:body="props">
                <q-tr :props="props">
                  <q-td key="log_id" :props="props">{{ props.row.log_id }}</q-td>
                  <q-td key="log_table" :props="props">{{ $t(props.row.log_table) }}</q-td>
                  <q-td key="log_table_id" :props="props">{{ props.row.log_table_id }}</q-td>
                  <q-td key="log_action" :props="props">{{ $t(props.row.log_action) }}</q-td>
                  <q-td key="created_at" :props="props">{{ convertUTCDateToLocalDate(props.row.created_at, 'DD/MM/YYYY hh:mm:ss') }}</q-td>
                  <q-td key="action" :props="props">
                    <a class="text-blue" style="cursor: pointer; padding: 5px;" @click="goTo('logs/view/' + props.row.log_id)"> <q-icon size="md" name="visibility"/>
                      <q-tooltip :offset="[0, 10]">{{$t('showMore')}}</q-tooltip>
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
import LogService from 'src/services/LogService'
import { xMisc } from 'src/mixins/xMisc.js'

export default {
  name: 'LogsList',
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
          name: 'log_id',
          required: true,
          label: 'Id',
          align: 'left',
          field: row => row.log_id,
          sortable: true
        },
        {
          name: 'log_table',
          required: true,
          label: 'Menú',
          align: 'left',
          field: row => this.$t(row.log_table),
          sortable: true
        },
        {
          name: 'log_table_id',
          required: true,
          label: 'Id Registro',
          align: 'left',
          field: row => row.log_table_id,
          sortable: true
        },
        {
          name: 'log_action',
          required: true,
          label: 'Acción',
          align: 'left',
          field: row => this.$t(row.log_action),
          sortable: true
        },
        {
          name: 'created_at',
          required: true,
          label: 'Fecha de creación',
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
        sortBy: 'log_id',
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
    // ???? old method
    async getLogs () {
      try {
        var response = await LogService.getLogs({ token: this.decryptSession('token') })
        this.dataset = response.data.data
      } catch (error) {
        this.errorsAlerts(error)
        this.loading = false
      }
    },
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
        this.pagination.rowsNumber = response.recordsTotal
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
      var columns = []
      for (var u = 0; u < this.columns.length; u++) {
        if (this.columns[u].name !== 'action') {
          columns.push(this.columns[u].name)
        }
      }

      let filters = ''
      filters += 'start=' + start
      filters += '&length=' + length
      filters += '&filter=' + filter
      filters += '&sortby=' + sortBy
      filters += '&dir=' + ((descending) ? 'DESC' : 'ASC')
      filters += '&columns=' + columns.join()
      var response = await LogService.getLogs({ token: this.decryptSession('token'), filters: filters })
      return response
    },
    // export to CSV
    exportLog () {
      this.activateLoading(this.$t('loading'))
      var url = this.getApiUrl('/api/logs/export?access_token=' + this.decryptSession('token') + '&tz=' + (Intl.DateTimeFormat().resolvedOptions().timeZone) + '&tzo=' + new Date().getTimezoneOffset())
      var win = window.open(url, '_blank')
      win.focus()
      this.disableLoading()
    }
  }
}
</script>

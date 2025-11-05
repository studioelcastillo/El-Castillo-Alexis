<template>
  <div class="payroll-periods-list">
    <!-- Filtros y controles superiores -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md items-end">
          <!-- Filtro por estudio -->
          <div class="col-xs-12 col-sm-4">
            <q-select
              v-model="filters.studio"
              :options="filteredStudios"
              label="Estudio"
              filled
              dense
              clearable
              use-input
              input-debounce="300"
              @filter="filterStudios"
              @update:model-value="loadPeriods"
              option-label="label"
              option-value="value"
              emit-value
              map-options
            >
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    Sin resultados
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <!-- Filtro por estado -->
          <div class="col-xs-12 col-sm-3">
            <q-select
              v-model="filters.state"
              :options="stateOptions"
              label="Estado"
              filled
              dense
              clearable
              emit-value
              map-options
              @update:model-value="loadPeriods"
            />
          </div>

          <!-- Filtro por intervalo -->
          <div class="col-xs-12 col-sm-3">
            <q-select
              v-model="filters.interval"
              :options="intervalOptions"
              label="Intervalo"
              filled
              dense
              clearable
              emit-value
              map-options
              @update:model-value="loadPeriods"
            />
          </div>

          <!-- Botón de actualizar -->
          <div class="col-xs-12 col-sm-2">
            <q-btn
              color="primary"
              icon="refresh"
              label=""
              unelevated
              @click="loadPeriods"
              :loading="loading"
              class="full-width"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Tabla de períodos -->
    <q-card flat >
      <q-card-section class="q-pa-none">
        <q-table
          ref="tableRef"
          title=""
          :rows="periods"
          flat
          :columns="columns"
          :loading="loading"
          :filter="filter"
          row-key="payroll_period_id"
          :pagination="pagination"
          @request="onRequest"
          binary-state-sort
          class="payroll-periods-table"
        >
          <!-- Barra superior de la tabla -->
          <!-- <template v-slot:top-right>
            <q-input
              borderless
              dense
              debounce="300"
              v-model="filter"
              placeholder="Buscar..."
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </template> -->

          <!-- Columna de estado con chip colorido -->
          <template v-slot:body-cell-state="props">
            <q-td :props="props">
              <q-chip
                :color="getStateColor(props.value)"
                text-color="white"
                :label="props.value"
                size="sm"
              />
            </q-td>
          </template>

          <!-- Columna de fechas formateadas -->
          <template v-slot:body-cell-period="props">
            <q-td :props="props">
              <div class="text-body2">
                {{ formatDateRange(props.row.payroll_period_start_date, props.row.payroll_period_end_date) }}
              </div>
              <!-- <div class="text-caption text-grey-6">
                {{ getDaysDifference(props.row.payroll_period_start_date, props.row.payroll_period_end_date) }} días
              </div> -->
            </q-td>
          </template>

          <!-- Columna de SMMLV formateado -->
          <template v-slot:body-cell-smmlv="props">
            <q-td :props="props">
              {{ formatCurrency(props.value) }}
            </q-td>
          </template>

          <!-- Columna de acciones -->
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <!-- Cerrar período (solo si está abierto) -->
              <a
                v-if="props.row.payroll_period_state === 'ABIERTO'"
                class="text-blue-8"
                style="cursor: pointer; padding: 5px;"
                @click="closePeriod(props.row)"
              >
                <q-icon size="md" name="lock"/>
                <q-tooltip :offset="[0, 10]">Cerrar periodo</q-tooltip>
              </a>

              <!-- Ver período (solo si está cerrado) -->
              <a
                v-if="props.row.payroll_period_state === 'CERRADO'"
                class="text-teal"
                style="cursor: pointer; padding: 5px;"
                @click="viewPeriod(props.row)"
              >
                <q-icon size="md" name="visibility"/>
                <q-tooltip :offset="[0, 10]">Ver periodo</q-tooltip>
              </a>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </div>
</template>

<script>
import { date } from 'quasar'
import PaysheetService from '../services/PaysheetService'
import StudioService from '../services/StudioService'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'PayrollPeriodsList',
  mixins: [xMisc, sGate],
  props: {
    studioId: {
      type: [Number, String],
      default: null
    },
    userToken: {
      type: String,
      required: true
    },
    studios: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      loading: false,
      filter: '',
      periods: [],
      actionLoading: {},
      allStudios: [],
      filteredStudios: [],
      filters: {
        studio: this.studioId || null,
        state: null,
        interval: null
      },
      pagination: {
        sortBy: 'payroll_period_start_date',
        descending: true,
        page: 1,
        rowsPerPage: 10,
        rowsNumber: 0
      },
      stateOptions: [
        { label: 'Abierto', value: 'ABIERTO' },
        { label: 'Liquidado', value: 'LIQUIDADO' }
      ],
      intervalOptions: [
        { label: 'Semanal', value: 'SEMANAL' },
        { label: 'Quincenal', value: 'QUINCENAL' },
        { label: 'Mensual', value: 'MENSUAL' }
      ],
      columns: [
        {
          name: 'payroll_period_id',
          label: 'ID',
          field: 'payroll_period_id',
          align: 'left',
          sortable: true
        },
        {
          name: 'studio',
          label: 'Estudio',
          field: row => row.studio?.std_name || 'N/A',
          align: 'left',
          sortable: true
        },
        {
          name: 'period',
          label: 'Período',
          field: 'payroll_period_start_date',
          align: 'left',
          sortable: true
        },
        {
          name: 'interval',
          label: 'Intervalo',
          field: 'payroll_period_interval',
          align: 'center',
          sortable: true
        },
        {
          name: 'state',
          label: 'Estado',
          field: 'payroll_period_state',
          align: 'center',
          sortable: true
        },
        {
          name: 'smmlv',
          label: 'SMMLV',
          field: 'payroll_period_smmlv',
          align: 'right',
          sortable: true
        },
        {
          name: 'actions',
          label: 'Acciones',
          field: 'actions',
          align: 'center',
          sortable: false
        }
      ]
    }
  },
  created() {
    this.sUser = this.decryptSession('user')
    this.loadStudios()
    this.loadPeriods()
  },
  methods: {
    async loadPeriods() {
      this.loading = true
      try {
        const params = {
          token: this.decryptSession('token'),
          std_id: this.filters.studio,
          state: this.filters.state,
          interval: this.filters.interval
        }

        const response = await PaysheetService.getPayrollPeriods(params)

        if (response.data.status === 'success') {
          this.periods = response.data.data || []
          this.pagination.rowsNumber = this.periods.length
        } else {
          throw new Error(response.data.message || 'Error al cargar períodos')
        }
      } catch (error) {
        console.error('Error loading periods:', error)
        this.$q.notify({
          type: 'negative',
          message: 'Error al cargar los períodos de nómina',
          caption: error.message
        })
      } finally {
        this.loading = false
      }
    },

    async loadStudios() {
      try {
        const response = await StudioService.getStudios({
          id: '',
          query: 'active=true',
          token: this.decryptSession('token')
        })

        if (response.data.status === 'success') {
          this.allStudios = response.data.data.map(studio => ({
            label: studio.std_name,
            value: studio.std_id
          }))
          this.filteredStudios = [...this.allStudios]
        }
      } catch (error) {
        console.error('Error loading studios:', error)
        this.$q.notify({
          type: 'negative',
          message: 'Error al cargar estudios',
          caption: error.message
        })
      }
    },

    filterStudios(val, update) {
      if (val === '') {
        update(() => {
          this.filteredStudios = [...this.allStudios]
        })
        return
      }

      update(() => {
        const needle = val.toLowerCase()
        this.filteredStudios = this.allStudios.filter(studio =>
          studio.label.toLowerCase().indexOf(needle) > -1
        )
      })
    },

    buildQuery() {
      const params = new URLSearchParams()

      if (this.filters.studio) params.append('std_id', this.filters.studio)
      if (this.filters.state) params.append('state', this.filters.state)
      if (this.filters.interval) params.append('interval', this.filters.interval)

      return params.toString()
    },

    onRequest(props) {
      const { page, rowsPerPage, sortBy, descending } = props.pagination

      this.pagination.page = page
      this.pagination.rowsPerPage = rowsPerPage
      this.pagination.sortBy = sortBy
      this.pagination.descending = descending

      this.loadPeriods()
    },

    // Acciones de períodos
    viewPeriod(period) {
      this.$emit('period-selected', period)
    },

    editPeriod(period) {
      this.$emit('period-selected', period, 'edit')
    },

    async closePeriod(period) {
      try {
        await this.$q.dialog({
          title: 'Confirmar cierre',
          message: `¿Está seguro de cerrar el período ${this.formatDateRange(period.payroll_period_start_date, period.payroll_period_end_date)}?`,
          cancel: true,
          persistent: true
        })

        this.$set(this.actionLoading, period.payroll_period_id, true)

        const response = await PaysheetService.closePayrollPeriod(period.payroll_period_id, this.decryptSession('token'))

        if (response.data.status === 'success') {
          this.$q.notify({
            type: 'positive',
            message: 'Período cerrado exitosamente'
          })
          this.loadPeriods()
          this.$emit('period-updated', response.data.data)
        } else {
          throw new Error(response.data.message)
        }
      } catch (error) {
        if (error !== false) { // No fue cancelado por el usuario
          console.error('Error closing period:', error)
          this.$q.notify({
            type: 'negative',
            message: 'Error al cerrar el período',
            caption: error.message
          })
        }
      } finally {
        this.$set(this.actionLoading, period.payroll_period_id, false)
      }
    },

    async openPeriod(period) {
      try {
        await this.$q.dialog({
          title: 'Confirmar apertura',
          message: `¿Está seguro de abrir el período ${this.formatDateRange(period.payroll_period_start_date, period.payroll_period_end_date)}?`,
          cancel: true,
          persistent: true
        })

        this.$set(this.actionLoading, period.payroll_period_id, true)

        const response = await PaysheetService.openPayrollPeriod(period.payroll_period_id, this.decryptSession('token'))

        if (response.data.status === 'success') {
          this.$q.notify({
            type: 'positive',
            message: 'Período abierto exitosamente'
          })
          this.loadPeriods()
          this.$emit('period-updated', response.data.data)
        } else {
          throw new Error(response.data.message)
        }
      } catch (error) {
        if (error !== false) {
          console.error('Error opening period:', error)
          this.$q.notify({
            type: 'negative',
            message: 'Error al abrir el período',
            caption: error.message
          })
        }
      } finally {
        this.$set(this.actionLoading, period.payroll_period_id, false)
      }
    },

    async liquidatePeriod(period) {
      try {
        await this.$q.dialog({
          title: 'Confirmar liquidación',
          message: `¿Está seguro de liquidar el período ${this.formatDateRange(period.payroll_period_start_date, period.payroll_period_end_date)}? Esta acción no se puede deshacer.`,
          cancel: true,
          persistent: true
        })

        this.$set(this.actionLoading, period.payroll_period_id, true)

        const response = await PaysheetService.liquidatePayrollPeriod(period.payroll_period_id, this.decryptSession('token'))

        if (response.data.status === 'success') {
          this.$q.notify({
            type: 'positive',
            message: 'Período liquidado exitosamente'
          })
          this.loadPeriods()
          this.$emit('period-updated', response.data.data)
        } else {
          throw new Error(response.data.message)
        }
      } catch (error) {
        if (error !== false) {
          console.error('Error liquidating period:', error)
          this.$q.notify({
            type: 'negative',
            message: 'Error al liquidar el período',
            caption: error.message
          })
        }
      } finally {
        this.$set(this.actionLoading, period.payroll_period_id, false)
      }
    },

    async deletePeriod(period) {
      try {
        await this.$q.dialog({
          title: 'Confirmar eliminación',
          message: `¿Está seguro de eliminar el período ${this.formatDateRange(period.payroll_period_start_date, period.payroll_period_end_date)}? Esta acción no se puede deshacer.`,
          cancel: true,
          persistent: true
        })

        this.$set(this.actionLoading, period.payroll_period_id, true)

        const response = await PaysheetService.deletePayrollPeriod(period.payroll_period_id, this.decryptSession('token'))

        if (response.data.status === 'success') {
          this.$q.notify({
            type: 'positive',
            message: 'Período eliminado exitosamente'
          })
          this.loadPeriods()
          this.$emit('period-deleted', period)
        } else {
          throw new Error(response.data.message)
        }
      } catch (error) {
        if (error !== false) {
          console.error('Error deleting period:', error)
          this.$q.notify({
            type: 'negative',
            message: 'Error al eliminar el período',
            caption: error.message
          })
        }
      } finally {
        this.$set(this.actionLoading, period.payroll_period_id, false)
      }
    },

    // Utilidades de formato
    getStateColor(state) {
      const colors = {
        'ABIERTO': 'positive',
        'CERRADO': 'warning',
        'LIQUIDADO': 'info'
      }
      return colors[state] || 'grey'
    },

    formatDateRange(startDate, endDate) {
      const start = this.formatDateToCustom(startDate)
      const end = this.formatDateToCustom(endDate)
      return `${start} - ${end}`
    },

    formatDateToCustom(dateString) {
      if (!dateString) return '';

      // Extraer solo la parte de la fecha (YYYY-MM-DD) sin la hora
      const datePart = dateString.split('T')[0];
      const [year, month, day] = datePart.split('-');

      // Crear fecha usando año, mes (0-indexado) y día
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

      // Array de nombres de meses abreviados en español
      const monthNames = [
        'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
        'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'
      ];

      // Formatear como SEP-01-2025
      const monthAbbr = monthNames[date.getMonth()];
      const dayFormatted = String(date.getDate()).padStart(2, '0');
      const yearFormatted = date.getFullYear();

      return `${monthAbbr}-${dayFormatted}-${yearFormatted}`;
    },

    getDaysDifference(startDate, endDate) {
      // Extraer solo la parte de la fecha sin zona horaria
      const startPart = startDate.split('T')[0];
      const endPart = endDate.split('T')[0];

      const [startYear, startMonth, startDay] = startPart.split('-').map(Number);
      const [endYear, endMonth, endDay] = endPart.split('-').map(Number);

      const start = new Date(startYear, startMonth - 1, startDay);
      const end = new Date(endYear, endMonth - 1, endDay);

      const diffTime = Math.abs(end - start);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    },

    formatCurrency(amount) {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      }).format(amount)
    }
  }
}
</script>

<style lang="scss" scoped>
.payroll-periods-list {
  .payroll-periods-table {
    .q-table__top {
      padding: 12px 16px;
    }

    .q-table thead tr th {
      position: sticky;
      z-index: 1;
      background: #fff;
    }

    .q-table tbody td {
      white-space: nowrap;
    }
  }
}
</style>

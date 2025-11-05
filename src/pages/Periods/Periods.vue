<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card">
          <q-card-section>
            <div class="text-h5 text-weight-bolder">
              Periodos
            </div>
          </q-card-section>

          <q-separator inset />

          <q-card-section>
            <q-tabs
              v-model="activeTab"
              class="text-grey"
              active-color="primary"
              indicator-color="primary"
              align="justify"
              narrow-indicator

            >
              <q-tab name="commissions" label="Periodos generales" />
              <q-tab name="payroll" label="Periodos de nómina" />
            </q-tabs>

            <q-separator />

            <q-tab-panels v-model="activeTab" animated>
              <!-- Pestaña de Periodos de Comisiones (contenido original) -->
              <q-tab-panel name="commissions" class="q-pa-none">
                <q-table
                  title="Periodos"
                  dense
                  :columns="columns"
                  :rows="dataset"
                  :filter="filter"
                  :loading="loading"
                  rows-per-page-label="Registros por página"
                  no-data-label="No hay registros disponibles"
                  v-model:pagination="pagination"
                >
                  <!-- header -->
                  <template v-slot:top-right>
                    <!-- filter -->
                    <q-input borderless dense debounce="300" v-model="filter" placeholder="Buscar">
                      <template v-slot:append>
                        <q-icon name="search" />
                      </template>
                    </q-input>
                  </template>
                  <!-- body -->
                  <template v-slot:body="props">
                    <q-tr :props="props">
                      <q-td key="period_id" :props="props">{{ props.row.period_id }}</q-td>
                      <q-td key="period_start_date" :props="props">{{ props.row.period_start_date }}</q-td>
                      <q-td key="period_end_date" :props="props">{{ props.row.period_end_date }}</q-td>
                      <q-td key="period_state" :props="props">{{ props.row.period_state }}</q-td>
                      <q-td key="period_closed_date" :props="props">{{ convertUTCDateToLocalDate(props.row.period_closed_date, 'DD/MM/YYYY hh:mm:ss a') }}</q-td>
                      <q-td key="user_name" :props="props"><span v-if="props.row.user">{{ props.row.user.user_name }}</span></q-td>
                      <q-td key="action" :props="props">
                        <a v-if="openGate('close-period', sUser.prof_id) && props.row.period_state === 'ABIERTO'" class="text-blue-8" style="cursor: pointer; padding: 5px;" @click="periodDialog(props.row.period_id,'')">
                          <q-icon size="md" name="lock"/>
                          <q-tooltip :offset="[0, 10]">Cerrar periodo</q-tooltip>
                        </a>
                        <a v-if="openGate('close-period', sUser.prof_id) && props.row.period_state === 'CERRADO'" class="text-teal" style="cursor: pointer; padding: 5px;" @click="periodDialog(props.row.period_id, props.row.period_observation)">
                          <q-icon size="md" name="visibility"/>
                          <q-tooltip :offset="[0, 10]">Ver periodo</q-tooltip>
                        </a>
                        <a v-if="openGate('close-period', sUser.prof_id) && props.row.period_state === 'CERRADO'" class="text-blue-8" style="cursor: pointer; padding: 5px;" @click="openPeriod(props.row.period_id)">
                          <q-icon size="md" name="lock_open"/>
                          <q-tooltip :offset="[0, 10]">Abrir periodo</q-tooltip>
                        </a>
                      </q-td>
                    </q-tr>
                  </template>
                </q-table>
              </q-tab-panel>

              <!-- Pestaña de Periodos de Nómina -->
              <q-tab-panel name="payroll" class="q-pa-none">
                <div class="text-h6 q-mt-md q-mb-md">Periodos de nómina</div>
                <PayrollPeriodsList />
              </q-tab-panel>
            </q-tab-panels>
          </q-card-section>
        </q-card>

        <q-dialog v-if="isSubgrid" v-model="dialog">
          <q-card style="width: 100%;">

          </q-card>
        </q-dialog>
        <q-dialog v-model="periodDialogBool" persistent>
          <q-card style="width: 100%;">
            <q-card-section>
              <div class="text-h6" v-if="toClosePeriod">Cerrar periodo</div>
              <div class="text-h6" v-else >Ver Periodo</div>
            </q-card-section>

            <q-card-section class="q-pt-none">
              <q-input dense v-model="periodObservation" type="textarea" autofocus :readonly="!toClosePeriod"/>
            </q-card-section>

            <q-card-actions align="right" class="text-primary">
              <q-btn v-if="toClosePeriod" flat label="Cancelar" v-close-popup />
              <q-btn v-if="toClosePeriod" flat label="Confirmar" @click="closePeriod()" v-close-popup />
              <q-btn v-else flat label="Cerrar" v-close-popup />
            </q-card-actions>
          </q-card>
        </q-dialog>
      </div>
    </div>
  </div>
</template>

<script>
import PeriodService from 'src/services/PeriodService'
import PayrollPeriodsList from 'src/components/PayrollPeriodsList.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'PeriodsLists',
  components: {
    PayrollPeriodsList
  },
  mixins: [xMisc, sGate],
  data () {
    return {
      activeTab: 'commissions', // Pestaña activa por defecto
      sUser: {},
      loading: false,
      dataset: [],
      filter: '',
      periodDialogBool: false,
      periodObservation: '',
      periodId: 0,
      toClosePeriod: false,
      columns: [
        {
          name: 'period_id',
          required: true,
          label: 'Id',
          align: 'left',
          field: row => row.period_id,
          sortable: true
        },
        {
          name: 'period_start_date',
          required: true,
          label: 'Fecha inicio',
          align: 'left',
          field: row => row.period_start_date,
          sortable: true
        },
        {
          name: 'period_end_date',
          required: true,
          label: 'Fecha fin',
          align: 'left',
          field: row => row.period_end_date,
          sortable: true
        },
        {
          name: 'period_state',
          required: true,
          label: 'Estado',
          align: 'left',
          field: row => row.period_state,
          sortable: true
        },
        {
          name: 'period_closed_date',
          required: true,
          label: 'Fecha de cierre',
          align: 'left',
          field: row => row.period_closed_date,
          sortable: true
        },
        {
          name: 'user_name',
          required: true,
          label: 'Usuario',
          align: 'left',
          field: row => row.user.user_name,
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
    this.getPeriods()
  },
  methods: {
    async getPeriods () {
      try {
        this.loading = true
        var response = await PeriodService.getPeriods({ token: this.decryptSession('token') })
        this.dataset = response.data.data
        this.loading = false
      } catch (error) {
        this.errorsAlerts(error)
        this.loading = false
      }
    },
    periodDialog (id, observation) {
      this.periodId = id
      this.periodObservation = observation
      this.toClosePeriod = (observation === '')
      this.periodDialogBool = true
    },
    async closePeriod () {
      try {
        this.loading = true
        if (this.openGate('close-period', this.sUser.prof_id)) {
          var record = await PeriodService.closePeriod({ id: this.periodId, period_observation: this.periodObservation, token: this.decryptSession('token') })
          this.alert('positive', 'Periodo cerrado')
          this.getPeriods()
        }
        this.loading = false
      } catch (error) {
        // console.log(error)
        this.loading = false
      }
    },
    openPeriod (id) {
      this.loading = true
      this.$q.dialog({
        title: 'Confirmar',
        message: '¿Estás seguro de abrir este periodo?',
        cancel: 'Cancelar',
        ok: 'Aceptar',
        persistent: true
      }).onOk(async () => {
        var record = await PeriodService.openPeriod({ id: id, token: this.decryptSession('token') })
        this.alert('positive', 'Periodo abierto')
        this.getPeriods()
      }).onCancel(() => {
        // console.log('>>>> Cancel')
      })
      this.loading = false
    }
  }
}
</script>
<style type="text/css">
  body {
    background: #ECF0F3;
  }
</style>

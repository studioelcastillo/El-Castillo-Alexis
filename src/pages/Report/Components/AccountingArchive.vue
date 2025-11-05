<template>
	<q-card flat bordered class="my-card">
      <q-form @submit="generateReport" class="q-gutter-md">
        <q-card-section>
          <div class="row q-col-gutter-sm">
            <div class="col-xs-12 col-sm-12">
              <h5 class="is-size-3">Descargar archivos contables</h5>
              <br>
            </div>
          </div>
          <div class="row q-col-gutter-sm">
            <div class="col-xs-6 col-sm-6">
              <div class="col-xs-12 col-sm-12">
                <p><b :class="(report_period_state === 'ABIERTO') ? 'text-green-10' : 'text-red-10'">{{ report_period_label }}</b></p>
              </div>
              <q-select
                filled
                v-model="archiveAction"
                label="Archivo"
                label-color=""
                use-input
                hide-selected
                fill-input
                :options="(isModelLiquidation) ? modelArchiveOptions : studioArchiveOptions"
                @update:model-value="getConsecutive()"
              /><br>
              <q-input
                filled
                v-model="consecutive"
                label="Consecutivo"
                label-color=""
                lazy-rules
                :rules="[
                  val => !!val || 'Este campo es requerido',
                  val => !isNaN(val) || 'Debe ser un numero',
                  val => Number.isInteger(parseFloat(val)) || 'Debe ser entero',
                ]"
              />
            </div>
            <div class="col-xs-12 col-sm-12 q-gutter-sm">
              <q-radio v-model="exportAction" val="all" label="Todos" />
              <q-radio v-model="exportAction" val="pending" label="Pendientes" />
              <q-radio v-model="exportAction" val="downloaded" label="Previamente descargados" />
            </div>
          </div>
        </q-card-section>
        <q-card-section>
          <div>
            <q-btn type="submit" class="bg-primary text-white submit1" label="Generar" />
          </div>
        </q-card-section>
      </q-form>
    </q-card>
</template>
<script>

import ReportService from 'src/services/ReportService'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'AccountingArchives',
  mixins: [xMisc, sGate],
  props: {
    report_period_since: { type: String, default: null },
    report_period_until: { type: String, default: null },
    report_period_state: { type: String, default: null },
    report_period_label: { type: String, default: null },
    isModelLiquidation: { type: Boolean, default: true }
  },
  data () {
    return {
      consecutive: 0,
      exportAction: 'all',
      archiveAction: 'Pagos de modelos',
      modelArchiveOptions: ['Pagos de modelos', 'Retefuente de modelos'],
      studioArchiveOptions: ['Pagos de estudios', 'Retefuente de estudios']
    }
  },
  created () {
    this.archiveAction = (this.isModelLiquidation) ? 'Pagos de modelos' : 'Pagos de estudios'
    this.getConsecutive()
  },
  methods: {
    generateReport () {
      try {
        this.activateLoading(this.$t('loading'))
        var url = ''
        switch (this.archiveAction) {
          case 'Pagos de modelos':
            url = this.getApiUrl('/api/reports/models_payments_report/report?access_token=' + this.decryptSession('token') + '&action=' + this.exportAction + '&report_since=' + this.report_period_since + '&report_until=' + this.report_period_until + '&consecutive=' + this.consecutive)
            break
          case 'Retefuente de modelos':
            url = this.getApiUrl('/api/reports/models_retefuente_report/report?access_token=' + this.decryptSession('token') + '&action=' + this.exportAction + '&report_since=' + this.report_period_since + '&report_until=' + this.report_period_until + '&consecutive=' + this.consecutive)
            break
          case 'Pagos de estudios':
            url = this.getApiUrl('/api/reports/studios_payments_report/report?access_token=' + this.decryptSession('token') + '&action=' + this.exportAction + '&report_since=' + this.report_period_since + '&report_until=' + this.report_period_until + '&consecutive=' + this.consecutive)
            break
          case 'Retefuente de estudios':
            url = this.getApiUrl('/api/reports/studios_retefuente_report/report?access_token=' + this.decryptSession('token') + '&action=' + this.exportAction + '&report_since=' + this.report_period_since + '&report_until=' + this.report_period_until + '&consecutive=' + this.consecutive)
            break
        }
        this.consecutive = parseInt(this.consecutive) + 1
        var win = window.open(url, '_blank')
        win.focus()
        this.disableLoading()
      } catch (error) {
        this.errorsAlerts(error)
        this.disableLoading()
      }
    },
    async getConsecutive () {
      var report_number = 18
      switch (this.archiveAction) {
        case 'Pagos de modelos':
          report_number = 18
          break
        case 'Retefuente de modelos':
          report_number = 9
          break
        case 'Pagos de estudios':
          report_number = 18
          break
        case 'Retefuente de estudios':
          report_number = 14
          break
      }
      // const report_number = (this.archiveAction === 'Pagos de modelos') ? 18 : 9
      const report = await ReportService.getConsecutiveReport({ report_number: report_number, token: this.decryptSession('token') })
      this.consecutive = report.data.data
    }
  }
}
</script>

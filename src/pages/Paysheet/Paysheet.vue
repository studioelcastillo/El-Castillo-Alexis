<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <!-- Formulario de selección -->
        <q-card v-show="openGate('menu-models_liquidation', sUser.prof_id)" flat bordered class="my-card">
          <q-form @submit="onSubmit" class="q-gutter-md">
            <q-card-section>
              <div class="row q-col-gutter-sm">
                <!-- Selector de Estudio (PRIMERO) -->
                <div v-if="![4,5].includes(sUser.prof_id)" class="col-sm-4">
                  <q-select
                    filled
                    v-model="payroll.studio"
                    label="Estudio"
                    label-color="primary"
                    :options="studios"
                    lazy-rules
                    :rules="[
                      val => !!val.value || 'Este campo es requerido',
                    ]"
                    @update:model-value="studioChanged"
                    color="teal-10"
                  />
                </div>

                <!-- Selector de Período de Nómina (SEGUNDO, basado en estudio) -->
                <div class="col-xs-12 col-sm-4">
                  <q-select
                    filled
                    v-model="payroll.payrollPeriod"
                    label="Período de nómina"
                    label-color="primary"
                    :options="payrollPeriods"
                    :loading="loadingPeriods"
                    :disable="!payroll.studio.value || loadingPeriods"
                    lazy-rules
                    :rules="[
                      val => !!val.value || 'Este campo es requerido',
                    ]"
                    @update:model-value="periodChanged"
                    color="teal-10"
                    :bg-color="(payroll.payrollPeriod.state === 'ABIERTO') ? 'green-11' : 'orange-11'"
                  >
                    <template v-slot:option="scope">
                      <q-item v-bind="scope.itemProps" :class="(scope.opt.state === 'ABIERTO') ? 'bg-green-11' : 'bg-orange-11'">
                        <q-item-section>
                          <span>{{ scope.opt.label }}</span>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>

                <!-- Selector de Períodos de Comisión (TERCERO, múltiple) -->
                <div class="col-sm-4">
                  <q-select
                    filled
                    multiple
                    use-chips
                    v-model="payroll.commissionPeriods"
                    label="Períodos de comisión"
                    label-color="primary"
                    :options="availableCommissionPeriods"
                    :loading="loadingCommissionPeriods"
                    :disable="!payroll.studio.value || !payroll.payrollPeriod.value || loadingCommissionPeriods || payroll.payrollPeriod.state === 'LIQUIDADO'"
                    lazy-rules
                    :rules="[
                      val => (payroll.payrollPeriod.state !== 'ABIERTO' || (val && val.length > 0)) || 'Debe seleccionar al menos un período',
                    ]"
                    color="teal-10"
                    >
                    <!-- :hint="payroll.payrollPeriod.state === 'LIQUIDADO' ? 'Períodos usados en esta liquidación' : 'Seleccione los períodos de comisión'" -->
                    <template v-slot:option="scope">
                      <q-item v-bind="scope.itemProps">
                        <q-item-section>
                          <q-item-label>{{ scope.opt.label }}</q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>

                <!-- Información del período seleccionado -->
                <!-- <div v-if="payroll.payrollPeriod.value" class="col-xs-12 col-sm-4">
                  <q-card flat bordered class="info-card">
                    <q-card-section class="q-pa-sm">
                      <div class="text-caption text-grey-7">Estado del Período</div>
                      <div class="text-subtitle2" :class="getStateColor(payroll.payrollPeriod.state)">
                        {{ payroll.payrollPeriod.state }}
                      </div>
                      <div class="text-caption text-grey-7 q-mt-xs">SMMLV</div>
                      <div class="text-body2">${{ miles(payroll.payrollPeriod.smmlv) }}</div>
                    </q-card-section>
                  </q-card>
                </div> -->
              </div>
            </q-card-section>

            <q-separator class="q-mt-none" />

            <q-card-section class="q-mt-none">
              <div>
                <q-btn
                  :label="submitBtnLabel"
                  type="submit"
                  class="bg-primary text-white"
                  :loading="loading"
                  :disable="!payroll.studio.value || !payroll.payrollPeriod.value || (payroll.payrollPeriod.state === 'ABIERTO' && payroll.commissionPeriods.length === 0)"
                />
                <q-btn
                  v-if="payrollData.length > 0 && payroll.payrollPeriod.state === 'ABIERTO'"
                  label="Liquidar"
                  color="green-8"
                  class="q-ml-sm"
                  @click="processLiquidation"
                  :loading="processing"
                />
              </div>
            </q-card-section>
          </q-form>
        </q-card>

        <br>

        <!-- Tabla de Liquidación de Nómina -->
        <q-card v-show="openGate('menu-models_liquidation', sUser.prof_id) && payrollData.length > 0" flat bordered class="my-card">
          <q-card-section>
            <q-table
              flat bordered
              ref="tableRef"
              title="Liquidación de nómina"
              dense
              :columns="columns"
              :rows="payrollData"
              :filter="filter"
              :loading="loading"
              rows-per-page-label="Registros por página"
              no-data-label="No hay registros disponibles"
              row-key="employee_id"
              :pagination="initialPagination"
              hide-bottom
              class="header-table"
            >
              <!-- header -->
              <template v-slot:top-right="props">
                <!-- filter -->
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
                  <q-td auto-width>
                    <q-btn size="sm" color="primary" round dense @click="props.row.expand = !props.row.expand" :icon="props.row.expand ? 'remove' : 'add'" />
                  </q-td>
                  <q-td key="employee_name" :props="props">
                    <span>
                      {{ props.row.employee_name }}
                      <a v-if="openGate('show-users', sUser.prof_id)" @click="goTo('users/show/' + props.row.employee_id, '_blank')" style="cursor:pointer;">
                        <q-icon name="open_in_new" size="sm" class="text-teal-8">
                          <q-tooltip :delay="100" :offset="[0, 10]">Consultar empleado</q-tooltip>
                        </q-icon>
                      </a>
                    </span>
                  </q-td>
                  <q-td key="total_salary" :props="props">${{ miles(props.row.total_salary || 0) }}</q-td>
                  <q-td key="commissions" :props="props">${{ miles(props.row.commissions || 0) }}</q-td>
                  <q-td key="total_deducciones" :props="props">${{ miles(props.row.total_deducciones) }}</q-td>
                  <q-td key="total_neto" :props="props" class="text-bold">${{ miles(props.row.total_neto) }}</q-td>
                  <q-td key="action" :props="props">
                    <a v-if="props.row.payroll_trans_id" class="text-red" style="cursor: pointer;" @click="downloadPayrollPdf(props.row.payroll_trans_id)">
                      <q-icon size="sm" name="picture_as_pdf"/>
                      <q-tooltip :offset="[0, 10]">Descargar PDF - Certificado Nómina</q-tooltip>
                    </a>
                  </q-td>
                </q-tr>

                <!-- Expansión con detalles -->
                <q-tr
                  v-show="props.row.expand"
                  :props="props"
                  class="expansion-container"
                >
                  <q-td colspan="100%">
                    <!-- Composición Salario Total -->
                    <q-table
                      :rows="getSalaryCompositionRows(props.row)"
                      :columns="prestacionesColumns"
                      row-key="concepto"
                      :pagination="initialPagination"
                      hide-bottom
                      class="header-expansion-table-g q-mb-sm q-mt-xs"
                    >
                      <template v-slot:top>
                        <div class="row full-width items-center">
                          <div class="col">Composición salario total</div>
                          <q-btn
                            v-if="payroll.payrollPeriod.state === 'ABIERTO'"
                            size="sm"
                            flat
                            icon="add"
                            label="Agregar hora extra"
                            @click="openExtraHourDialog(props.row)"
                          />
                        </div>
                      </template>

                      <template v-slot:body="subprops">
                        <q-tr :props="subprops">
                          <q-td key="concepto" :props="subprops">
                            {{ subprops.row.concepto }}
                            <q-btn
                              v-if="subprops.row.isEditable && payroll.payrollPeriod.state === 'ABIERTO'"
                              size="xs"
                              flat
                              round
                              color="red"
                              icon="delete"
                              @click="deleteExtraHour(subprops.row.concept_id)"
                            >
                              <q-tooltip>Eliminar</q-tooltip>
                            </q-btn>
                          </q-td>
                          <q-td key="porcentaje" :props="subprops">{{ subprops.row.porcentaje }}%</q-td>
                          <q-td key="valor" :props="subprops">${{ miles(subprops.row.valor) }}</q-td>
                        </q-tr>
                      </template>

                      <template v-slot:bottom-row>
                        <q-tr>
                          <q-td><b>Total salario</b></q-td>
                          <q-td class="text-center"><b>100.00%</b></q-td>
                          <q-td class="text-right"><b>${{ miles(getCompositionSalaryTotal(props.row)) }}</b></q-td>
                        </q-tr>
                      </template>
                    </q-table>

                    <!-- Prestaciones Sociales -->
                    <q-table
                      :rows="getPrestacionesRows(props.row.prestaciones)"
                      :columns="prestacionesColumns"
                      row-key="concepto"
                      :pagination="initialPagination"
                      hide-bottom
                      class="header-expansion-table-g q-mb-sm q-mt-xs"
                    >
                      <!-- header -->
                      <template v-slot:top>
                        <div>Prestaciones sociales</div>
                      </template>
                      <!-- body -->
                      <template v-slot:body="subprops">
                        <q-tr :props="subprops">
                          <q-td key="concepto" :props="subprops">{{ subprops.row.concepto }}</q-td>
                          <q-td key="porcentaje" :props="subprops">{{ subprops.row.porcentaje }}</q-td>
                          <q-td key="valor" :props="subprops">${{ miles(subprops.row.valor) }}</q-td>
                        </q-tr>
                      </template>
                      <!-- footer -->
                      <template v-slot:bottom-row>
                        <q-tr>
                          <q-td key="concepto"><b>Total prestaciones</b></q-td>
                          <q-td key="porcentaje" class="text-center"><b>20.83%</b></q-td>
                          <q-td key="valor" class="text-right"><b>${{ miles(getPrestacionesTotal(props.row.prestaciones)) }}</b></q-td>
                        </q-tr>
                      </template>
                    </q-table>

                    <!-- Seguridad Social (Solo empleador) -->
                    <q-table
                      :rows="getSeguridadSocialEmpleadorRows(props.row.social_security)"
                      :columns="prestacionesColumns"
                      row-key="concepto"
                      :pagination="initialPagination"
                      hide-bottom
                      class="header-expansion-table-g q-mb-sm"
                    >
                      <!-- header -->
                      <template v-slot:top>
                        <div>Seguridad social</div>
                      </template>
                      <!-- body -->
                      <template v-slot:body="subprops">
                        <q-tr :props="subprops">
                          <q-td key="concepto" :props="subprops">{{ subprops.row.concepto }}</q-td>
                          <q-td key="porcentaje" :props="subprops">{{ subprops.row.porcentaje }}</q-td>
                          <q-td key="valor" :props="subprops">${{ miles(subprops.row.valor) }}</q-td>
                        </q-tr>
                      </template>
                      <!-- footer -->
                      <template v-slot:bottom-row>
                        <q-tr>
                          <q-td key="concepto"><b>Total Seg. social</b></q-td>
                          <q-td key="porcentaje" class="text-center"><b>21.02%</b></q-td>
                          <q-td key="valor" class="text-right"><b>${{ miles(getSeguridadSocialEmpleadorTotal(props.row.social_security)) }}</b></q-td>
                        </q-tr>
                      </template>
                    </q-table>

                    <!-- Parafiscales (Solo empleador) -->
                    <q-table
                      :rows="getParafiscalesRows(props.row.parafiscales)"
                      :columns="prestacionesColumns"
                      row-key="concepto"
                      :pagination="initialPagination"
                      hide-bottom
                      class="header-expansion-table-g q-mb-sm"
                    >
                      <!-- header -->
                      <template v-slot:top>
                        <div>Parafiscales</div>
                      </template>
                      <!-- body -->
                      <template v-slot:body="subprops">
                        <q-tr :props="subprops">
                          <q-td key="concepto" :props="subprops">{{ subprops.row.concepto }}</q-td>
                          <q-td key="porcentaje" :props="subprops">{{ subprops.row.porcentaje }}</q-td>
                          <q-td key="valor" :props="subprops">${{ miles(subprops.row.valor) }}</q-td>
                        </q-tr>
                      </template>
                      <!-- footer -->
                      <template v-slot:bottom-row>
                        <q-tr>
                          <q-td key="concepto"><b>Total parafiscales</b></q-td>
                          <q-td key="porcentaje" class="text-center"><b>9.00%</b></q-td>
                          <q-td key="valor" class="text-right"><b>${{ miles(getTotalParafiscales(props.row.parafiscales)) }}</b></q-td>
                        </q-tr>
                      </template>
                    </q-table>

                    <!-- Detalle de Comisiones -->
                    <q-table
                      v-if="props.row.commission_details && props.row.commission_details.length > 0"
                      :rows="props.row.commission_details"
                      :columns="commissionDetailsColumns"
                      row-key="model_name"
                      :pagination="initialPagination"
                      hide-bottom
                      class="header-expansion-table-g q-mb-sm"
                    >
                      <!-- header -->
                      <template v-slot:top>
                        <!-- <div>Detalle {{ commissionLabel }}</div> -->
                        <div>Detalle comisiones</div>
                      </template>
                      <!-- body -->
                      <template v-slot:body="subprops">
                        <q-tr :props="subprops">
                          <q-td key="model_name" :props="subprops">{{ subprops.row.model_name }}</q-td>
                          <q-td key="commission_percentage" :props="subprops">{{ subprops.row.commission_percentage }}%</q-td>
                          <q-td key="total_earnings" :props="subprops">${{ miles(subprops.row.total_earnings) }}</q-td>
                          <q-td key="commission_amount" :props="subprops">${{ miles(subprops.row.commission_amount) }}</q-td>
                        </q-tr>
                      </template>
                      <!-- footer -->
                      <template v-slot:bottom-row>
                        <q-tr>
                          <q-td colspan="3"><b>Total comisiones</b></q-td>
                          <q-td class="text-right"><b>${{ miles(props.row.commissions) }}</b></q-td>
                        </q-tr>
                      </template>
                    </q-table>

                    <!-- Deducciones (EPS y Pensión empleado) -->
                    <q-table
                      :rows="getDeduccionesRows(props.row.social_security)"
                      :columns="prestacionesColumns"
                      row-key="concepto"
                      :pagination="initialPagination"
                      hide-bottom
                      class="header-expansion-table-r q-mb-sm"
                    >
                      <!-- header -->
                      <template v-slot:top>
                        <div>Deducciones</div>
                      </template>
                      <!-- body -->
                      <template v-slot:body="subprops">
                        <q-tr :props="subprops">
                          <q-td key="concepto" :props="subprops">{{ subprops.row.concepto }}</q-td>
                          <q-td key="porcentaje" :props="subprops">{{ subprops.row.porcentaje }}</q-td>
                          <q-td key="valor" :props="subprops">${{ miles(subprops.row.valor) }}</q-td>
                        </q-tr>
                      </template>
                      <!-- footer -->
                      <template v-slot:bottom-row>
                        <q-tr>
                          <q-td key="concepto"><b>Total deducciones</b></q-td>
                          <q-td key="porcentaje" class="text-center"><b>8.00%</b></q-td>
                          <q-td key="valor" class="text-right"><b>${{ miles(props.row.total_deducciones) }}</b></q-td>
                        </q-tr>
                      </template>
                    </q-table>
                  </q-td>
                </q-tr>

                <!-- Totales -->
                <q-tr v-if="payrollData.length - 1 == payrollData.indexOf(props.row)" style="background-color: black; color: white;">
                  <q-td auto-width align="center"></q-td>
                  <q-td key="employee_name"><b>Totales</b></q-td>
                  <q-td key="total_salary" class="text-right"><b>${{ milesFixed(totals.total_salary) }}</b></q-td>
                  <q-td key="commissions" class="text-right"><b>${{ milesFixed(totals.total_commissions) }}</b></q-td>
                  <q-td key="total_deducciones" class="text-right"><b>${{ milesFixed(totals.total_deducciones) }}</b></q-td>
                  <q-td key="total_neto" class="text-bold text-right"><b>${{ milesFixed(totals.total_neto) }}</b></q-td>
                  <q-td key="action"></q-td>
                </q-tr>
              </template>
            </q-table>
          </q-card-section>
        </q-card>

        <!-- Resumen de empleados elegibles -->
        <!-- <q-card v-if="employeesSummary && payroll.studio.value" flat bordered class="my-card q-mt-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">Resumen de Empleados</div>
            <div class="row q-col-gutter-md">
              <div class="col-md-4">
                <q-card flat class="bg-green-1">
                  <q-card-section class="text-center">
                    <div class="text-h4 text-green-8">{{ employeesSummary.eligible || 0 }}</div>
                    <div class="text-subtitle2">Empleados Elegibles</div>
                  </q-card-section>
                </q-card>
              </div>
              <div class="col-md-4">
                <q-card flat class="bg-orange-1">
                  <q-card-section class="text-center">
                    <div class="text-h4 text-orange-8">{{ employeesSummary.ineligible || 0 }}</div>
                    <div class="text-subtitle2">No Elegibles</div>
                  </q-card-section>
                </q-card>
              </div>
              <div class="col-md-4">
                <q-card flat class="bg-blue-1">
                  <q-card-section class="text-center">
                    <div class="text-h4 text-blue-8">{{ employeesSummary.total || 0 }}</div>
                    <div class="text-subtitle2">Total</div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card> -->

        <!-- Dialog: Agregar hora extra -->
        <q-dialog v-model="extraHourDialog" persistent>
          <q-card style="min-width: 500px">
            <q-card-section>
              <div class="text-h6">Agregar hora extra - {{ selectedEmployee.employee_name }}</div>
            </q-card-section>

            <q-card-section class="q-pt-none">
              <q-select
                v-model="extraHourForm.type"
                :options="extraHourTypes"
                label="Tipo de hora extra"
                filled
                emit-value
                map-options
                @update:model-value="updateSurcharge"
              />

              <q-input
                v-model.number="extraHourForm.hours"
                type="number"
                label="Cantidad de horas"
                filled
                step="0.5"
                min="0"
                class="q-mt-sm"
              />

              <q-input
                v-model.number="extraHourForm.hourly_rate"
                type="number"
                label="Valor hora base"
                filled
                prefix="$"
                readonly
                hint="Se calcula automáticamente desde el salario base"
                class="q-mt-sm"
              />

              <q-input
                v-model.number="extraHourForm.surcharge_percentage"
                type="number"
                label="Recargo (%)"
                filled
                suffix="%"
                :readonly="extraHourForm.type !== 'EXTRA_HOUR_CUSTOM'"
                class="q-mt-sm"
              />

              <q-input
                :model-value="calculateExtraHourTotal()"
                label="Total"
                filled
                prefix="$"
                readonly
                class="q-mt-sm"
              />

              <q-input
                v-model="extraHourForm.description"
                label="Descripción (opcional)"
                filled
                type="textarea"
                rows="2"
                class="q-mt-sm"
              />
            </q-card-section>

            <q-card-actions align="right">
              <q-btn flat label="Cancelar" color="grey" v-close-popup />
              <q-btn
                label="Guardar"
                color="black"
                @click="saveExtraHour"
                :loading="savingExtraHour"
              />
            </q-card-actions>
          </q-card>
        </q-dialog>

      </div>
    </div>
  </div>
</template>

<script>
import StudioService from 'src/services/StudioService'
import PaysheetService from 'src/services/PaysheetService'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'
import axios from 'axios'

export default {
  name: 'PayrollLiquidationList',
  mixins: [xMisc, sGate],
  setup () {
    return {
    }
  },
  data () {
    return {
      sUser: {},
      loading: false,
      loadingPeriods: false,
      // Nuevos datos para horas extras
      extraHourDialog: false,
      savingExtraHour: false,
      selectedEmployee: {},
      extraHourForm: {
        type: 'EXTRA_HOUR_DIURNA',
        hours: 0,
        hourly_rate: 0,
        surcharge_percentage: 25,
        total: 0,
        description: ''
      },
      extraHourTypes: [
        { label: 'Diurna (25%)', value: 'EXTRA_HOUR_DIURNA', surcharge: 25 },
        { label: 'Nocturna (75%)', value: 'EXTRA_HOUR_NOCTURNA', surcharge: 75 },
        { label: 'Dominical (105%)', value: 'EXTRA_HOUR_DOMINICAL', surcharge: 105 },
        { label: 'Dominical Nocturna (155%)', value: 'EXTRA_HOUR_DOMINICAL_NOCTURNA', surcharge: 155 },
        // { label: 'Festiva (100%)', value: 'EXTRA_HOUR_FESTIVA', surcharge: 100 },
        { label: 'Personalizada', value: 'EXTRA_HOUR_CUSTOM', surcharge: 0 }
      ],
      processing: false,
      payroll: {
        studio: { value: 0, label: '' },
        payrollPeriod: { value: 0, label: '', state: '', smmlv: 0 },
        commissionPeriods: [], // NUEVO
      },
      studios: [],
      payrollPeriods: [],
      availableCommissionPeriods: [], // NUEVO
      loadingCommissionPeriods: false, // NUEVO
      payrollData: [],
      employeesSummary: null,
      totals: {
        total_base_salary: 0,
        total_prestaciones: 0,
        total_auxilios: 0,
        total_devengado: 0,
        total_deducciones: 0,
        total_neto: 0
      },
      filter: '',
      initialPagination: {
        sortBy: 'desc',
        descending: false,
        page: 0,
        rowsPerPage: 0
      },
      // Columnas para las tablas de detalle
      prestacionesColumns: [
        {
          name: 'concepto',
          required: true,
          label: 'Concepto',
          align: 'left',
          field: 'concepto',
          sortable: false
        },
        {
          name: 'porcentaje',
          required: true,
          label: 'Porcentaje',
          align: 'center',
          field: 'porcentaje',
          sortable: false
        },
        {
          name: 'valor',
          required: true,
          label: 'Valor',
          align: 'right',
          field: 'valor',
          sortable: false
        }
      ],
      // Columnas para la tabla de detalle de comisiones
      commissionDetailsColumns: [
        {
          name: 'model_name',
          required: true,
          label: 'Modelo',
          align: 'left',
          field: 'model_name',
          sortable: false
        },
        {
          name: 'commission_percentage',
          required: true,
          label: 'Porcentaje',
          align: 'center',
          field: 'commission_percentage',
          sortable: false
        },
        {
          name: 'total_earnings',
          required: true,
          label: 'Ganancias totales',
          align: 'right',
          field: 'total_earnings',
          sortable: false
        },
        {
          name: 'commission_amount',
          required: true,
          label: 'Comisión',
          align: 'right',
          field: 'commission_amount',
          sortable: false
        }
      ],
      submitBtnLabel: 'Vista Previa'
    }
  },
  computed: {
    commissionLabel() {
      if (!this.payroll.payrollPeriod.value) return 'Comisiones';

      // Extraer el mes de la fecha de inicio del período
      const startDate = new Date(this.payroll.payrollPeriod.start_date);
      const month = startDate.getMonth() + 1; // getMonth() retorna 0-11, sumamos 1 para 1-12

      // Mes par = Auxilio de Rodamiento, mes impar = Aux. de Alimentación
      return month % 2 === 0 ? 'Aux. de rodamiento' : 'Aux. de alimentación';
    },
    columns() {
      return [
        {
          name: 'expand',
          required: true,
          label: '',
          align: 'left',
          sortable: false
        },
        {
          name: 'employee_name',
          required: true,
          label: 'Empleado',
          align: 'left',
          field: row => row.employee_name,
          sortable: true
        },
        {
          name: 'total_salary',
          required: true,
          label: 'Salario total',
          align: 'right',
          field: row => row.total_salary || 0,
          sortable: true
        },
        {
          name: 'commissions',
          required: true,
          label: 'Comisiones',
          align: 'right',
          field: row => row.commissions || 0,
          sortable: true
        },
        {
          name: 'total_deducciones',
          required: true,
          label: 'Deducciones',
          align: 'right',
          field: row => row.total_deducciones,
          sortable: true
        },
        {
          name: 'total_neto',
          required: true,
          label: 'Valor a pagar',
          align: 'right',
          field: row => row.total_neto,
          sortable: true
        },
        {
          name: 'action',
          required: true,
          label: 'Acciones',
          align: 'center',
          sortable: false
        }
      ];
    }
  },
  created () {
    this.sUser = this.decryptSession('user')
    this.getStudios()
  },
  methods: {
    async getStudios () {
      try {
        this.studios = []
        const response = await StudioService.getStudios({
          query: '',
          token: this.decryptSession('token')
        })

        for (var u = 0; u < response.data.data.length; u++) {
          this.studios.push({
            label: response.data.data[u].std_name,
            value: response.data.data[u].std_id
          })
        }

        // Auto-select first studio if only one available
        if (this.studios.length === 1) {
          this.payroll.studio = this.studios[0]
          this.studioChanged()
        }
      } catch (error) {
        this.errorsAlerts(error)
      }
    },

    async studioChanged() {
      if (!this.payroll.studio.value) {
        this.payrollPeriods = []
        this.payrollData = []
        return
      }

      try {
        this.loadingPeriods = true
        this.payrollPeriods = []
        this.payroll.payrollPeriod = { value: 0, label: '', state: '', smmlv: 0 }

        const response = await this.$api.get(`api/payroll/periods?std_id=${this.payroll.studio.value}`, {
          headers: { Authorization: `Bearer ${this.decryptSession('token')}` }
        })

        // Manejar la estructura de respuesta { status: "success", data: [...] }
        const periodsData = response.data.data || response.data

        if (periodsData && periodsData.length > 0) {
          for (let period of periodsData) {
            // Formatear fechas para mostrar solo la fecha sin hora
            const startDate = period.payroll_period_start_date.split('T')[0]
            const endDate = period.payroll_period_end_date.split('T')[0]

            this.payrollPeriods.push({
              label: `Período ${startDate} - ${endDate} (${period.payroll_period_state})`,
              value: period.payroll_period_id,
              state: period.payroll_period_state,
              start_date: startDate,
              end_date: endDate,
              interval: period.payroll_period_interval,
              smmlv: parseFloat(period.payroll_period_smmlv)
            })
          }

          // Auto-select first period
          if (this.payrollPeriods.length > 0) {
            this.payroll.payrollPeriod = this.payrollPeriods[0]
            this.periodChanged()
          }
        }

        // Load employees summary
        await this.loadEmployeesSummary()

      } catch (error) {
        this.errorsAlerts(error)
      } finally {
        this.loadingPeriods = false
      }
    },

    async periodChanged() {
      this.submitBtnLabel = (this.payroll.payrollPeriod.state === 'ABIERTO') ? 'Vista Previa' : 'Consultar'
      this.payrollData = []
      this.payroll.commissionPeriods = [] // Limpiar selección

      // Si el período está LIQUIDADO, cargar los períodos usados
      if (this.payroll.payrollPeriod.state === 'LIQUIDADO') {
        await this.loadUsedCommissionPeriodsFromTransactions()
      } else {
        // Si está ABIERTO o CERRADO, cargar períodos disponibles
        await this.loadCommissionPeriods()
      }
    },

    async loadCommissionPeriods() {
      if (!this.payroll.payrollPeriod.value || !this.payroll.studio.value) {
        this.availableCommissionPeriods = []
        return
      }

      try {
        this.loadingCommissionPeriods = true
        const response = await this.$api.get(
          `/api/payroll/periods/${this.payroll.payrollPeriod.value}/commission-periods?std_id=${this.payroll.studio.value}`,
          { headers: { Authorization: `Bearer ${this.decryptSession('token')}` }}
        )

        if (response.data.status === 'success') {
          this.availableCommissionPeriods = response.data.data.map(period => ({
            label: `${period.period_start_date} - ${period.period_end_date}`,
            value: period.period_id,
            start_date: period.period_start_date,
            end_date: period.period_end_date,
            state: period.period_state
          }))
        }

      } catch (error) {
        this.errorsAlerts(error)
      } finally {
        this.loadingCommissionPeriods = false
      }
    },

    async loadUsedCommissionPeriodsFromTransactions() {
      try {
        this.loadingCommissionPeriods = true

        // Obtener transacciones para leer los períodos usados
        const transactionsResponse = await this.$api.get(
          `/api/payroll/liquidation/transactions/${this.payroll.payrollPeriod.value}`,
          { headers: { Authorization: `Bearer ${this.decryptSession('token')}` }}
        )

        if (transactionsResponse.data.success && transactionsResponse.data.data.length > 0) {
          const firstTransaction = transactionsResponse.data.data[0]
          const commissionPeriodIds = JSON.parse(firstTransaction.commission_periods || '[]')

          if (commissionPeriodIds.length > 0) {
            await this.loadUsedCommissionPeriods(commissionPeriodIds)
          } else {
            // No hay períodos guardados, cargar todos los disponibles como fallback
            await this.loadCommissionPeriods()
          }
        } else {
          // No hay transacciones, cargar períodos disponibles
          await this.loadCommissionPeriods()
        }
      } catch (error) {
        console.error('Error loading used commission periods from transactions:', error)
        // Si falla, cargar todos los períodos disponibles
        await this.loadCommissionPeriods()
      } finally {
        this.loadingCommissionPeriods = false
      }
    },

    async loadUsedCommissionPeriods(periodIds) {
      if (!periodIds || periodIds.length === 0) {
        return
      }

      try {
        // Cargar información de los períodos específicos
        const response = await this.$api.post(
          '/api/payroll/periods/by-ids',
          { period_ids: periodIds },
          { headers: { Authorization: `Bearer ${this.decryptSession('token')}` }}
        )

        if (response.data.status === 'success') {
          // Cargar solo estos períodos en las opciones disponibles
          this.availableCommissionPeriods = response.data.data.map(period => ({
            label: `${period.period_start_date} - ${period.period_end_date}`,
            value: period.period_id,
            start_date: period.period_start_date,
            end_date: period.period_end_date,
            state: period.period_state
          }))

          // Pre-seleccionar estos períodos
          this.payroll.commissionPeriods = this.availableCommissionPeriods
        }

      } catch (error) {
        console.error('Error loading period details:', error)
        // Si falla, cargar todos los períodos disponibles
        await this.loadCommissionPeriods()
      }
    },

    async loadEmployeesSummary() {
      if (!this.payroll.studio.value) return

      try {
        const response = await this.$api.get(`/api/payroll/liquidation/employees/${this.payroll.studio.value}`, {
          headers: { Authorization: `Bearer ${this.decryptSession('token')}` }
        })

        if (response.data.success) {
          this.employeesSummary = response.data.data.counts
        }
      } catch (error) {
        console.error('Error loading employees summary:', error)
      }
    },

    async onSubmit() {
      // Validar períodos si está ABIERTO
      if (this.payroll.payrollPeriod.state === 'ABIERTO') {
        if (!this.payroll.commissionPeriods || this.payroll.commissionPeriods.length === 0) {
          this.alert('warning', 'Debe seleccionar al menos un período de comisión')
          return
        }
      }

      try {
        this.activateLoading('Generando vista previa de nómina...')

        // Si el período está liquidado, obtener transacciones reales
        if (this.payroll.payrollPeriod.state === 'LIQUIDADO') {
          const transactionsResponse = await this.$api.get(`/api/payroll/liquidation/transactions/${this.payroll.payrollPeriod.value}`, {
            headers: { Authorization: `Bearer ${this.decryptSession('token')}` }
          })

          if (transactionsResponse.data.success) {
            // Transformar transacciones al formato esperado por el componente
            this.payrollData = transactionsResponse.data.data.map(transaction => ({
              employee_id: transaction.user_id,
              employee_name: transaction.user?.user_name || 'N/A',
              employee_identification: transaction.user?.user_identification || 'N/A',
              stdmod_id: transaction.stdmod_id,
              base_salary: parseFloat(transaction.base_salary),
              dotacion_amount: parseFloat(transaction.dotacion_amount || 0),
              commissions: parseFloat(transaction.commission_amount),
              auxilios: {
                transporte: parseFloat(transaction.transport_allowance),
                alimentacion: parseFloat(transaction.food_allowance)
              },
              prestaciones: {
                cesantias: parseFloat(transaction.cesantias),
                prima: parseFloat(transaction.prima),
                vacaciones: parseFloat(transaction.vacaciones)
              },
              social_security: {
                eps_employee: parseFloat(transaction.eps_employee),
                pension_employee: parseFloat(transaction.pension_employee),
                eps_employer: parseFloat(transaction.eps_employer),
                pension_employer: parseFloat(transaction.pension_employer),
                arl: parseFloat(transaction.arl)
              },
              parafiscales: {
                sena: parseFloat(transaction.sena),
                icbf: parseFloat(transaction.icbf),
                caja_compensacion: parseFloat(transaction.caja_compensacion)
              },
              total_salary: parseFloat(transaction.base_salary) + parseFloat(transaction.dotacion_amount || 0) + parseFloat(transaction.transport_allowance) + parseFloat(transaction.food_allowance) + parseFloat(transaction.extra_hours_amount || 0) + parseFloat(transaction.cesantias) + parseFloat(transaction.prima) + parseFloat(transaction.vacaciones) + parseFloat(transaction.eps_employer) + parseFloat(transaction.pension_employer) + parseFloat(transaction.arl) + parseFloat(transaction.sena) + parseFloat(transaction.icbf) + parseFloat(transaction.caja_compensacion),
              total_devengado: parseFloat(transaction.total_devengado),
              total_deducciones: parseFloat(transaction.total_deducciones),
              total_neto: parseFloat(transaction.total_neto),
              payroll_trans_id: transaction.payroll_trans_id,
              extra_hours_detail: transaction.extra_hours_detail || [],
              commission_details: transaction.commission_details || []
            }))

            this.totals = this.calculateTotals(this.payrollData)
            this.alert('positive', `Transacciones cargadas: ${this.payrollData.length} empleados`)
          }
        } else {
          // Si está en ABIERTO o CERRADO, generar vista previa
          const response = await this.$api.post('/api/payroll/liquidation/preview', {
            studio_id: this.payroll.studio.value,
            payroll_period_id: this.payroll.payrollPeriod.value,
            commission_periods: this.payroll.commissionPeriods.map(p => p.value) // NUEVO
          }, {
            headers: { Authorization: `Bearer ${this.decryptSession('token')}` }
          })

          if (response.data.success) {
            this.payrollData = response.data.data.employees
            this.totals = this.calculateTotals(response.data.data.employees)

            this.alert('positive', `Vista previa generada: ${this.payrollData.length} empleados`)
          } else {
            this.alert('negative', response.data.message)
          }
        }

        this.disableLoading()
      } catch (error) {
        this.disableLoading()
        this.errorsAlerts(error)
      }
    },

    async processLiquidation() {
      this.$q.dialog({
        title: 'Confirmar Liquidación',
        message: `¿Está seguro de procesar la liquidación de nómina para ${this.payrollData.length} empleados? Esta acción cerrará el período y generará las transacciones.`,
        cancel: 'Cancelar',
        ok: 'Procesar',
        persistent: true
      }).onOk(async () => {
        try {
          this.processing = true

          const response = await this.$api.post('/api/payroll/liquidation/process', {
            studio_id: this.payroll.studio.value,
            payroll_period_id: this.payroll.payrollPeriod.value,
            commission_periods: this.payroll.commissionPeriods.map(p => p.value) // NUEVO
          }, {
            headers: { Authorization: `Bearer ${this.decryptSession('token')}` }
          })

          if (response.data.success) {
            this.alert('positive', 'Liquidación procesada exitosamente')
            this.payroll.payrollPeriod.state = 'LIQUIDADO'
            this.periodChanged()

            // Reload data to get transaction IDs for PDF generation
            await this.onSubmit()
          } else {
            this.alert('negative', response.data.message)
          }
        } catch (error) {
          this.errorsAlerts(error)
        } finally {
          this.processing = false
        }
      })
    },

    downloadPayrollPdf(transactionId) {
      const url = this.getApiUrl(`/api/payroll/liquidation/pdf/${transactionId}?access_token=${this.decryptSession('token')}`)
      const win = window.open(url, '_blank')
      win.focus()
    },

    getPrestacionesTotal(prestaciones) {
      return (prestaciones.cesantias || 0) + (prestaciones.prima || 0) + (prestaciones.vacaciones || 0)
    },

    getAuxiliosTotal(auxilios) {
      return (auxilios.transporte || 0) + (auxilios.alimentacion || 0)
    },

    getStateColor(state) {
      switch(state) {
        case 'ABIERTO': return 'text-green'
        case 'CERRADO': return 'text-orange'
        case 'LIQUIDADO': return 'text-blue'
        default: return 'text-grey'
      }
    },

    // Helper methods to convert payroll data to table rows
    getPrestacionesRows(prestaciones) {
      const rows = [];

      if (prestaciones.cesantias > 0) {
        rows.push({
          concepto: 'Cesantías',
          porcentaje: '8.33%',
          valor: prestaciones.cesantias
        });
      }

      if (prestaciones.prima > 0) {
        rows.push({
          concepto: 'Prima de Servicios',
          porcentaje: '8.33%',
          valor: prestaciones.prima
        });
      }

      if (prestaciones.vacaciones > 0) {
        rows.push({
          concepto: 'Vacaciones',
          porcentaje: '4.17%',
          valor: prestaciones.vacaciones
        });
      }

      return rows;
    },

    // Seguridad Social - Solo empleador (EPS, Pensión, ARL)
    getSeguridadSocialEmpleadorRows(seguridadSocial) {
      const rows = [];

      if (seguridadSocial.eps_employer > 0) {
        rows.push({
          concepto: 'EPS Empleador',
          porcentaje: '8.50%',
          valor: seguridadSocial.eps_employer
        });
      }

      if (seguridadSocial.pension_employer > 0) {
        rows.push({
          concepto: 'Pensión Empleador',
          porcentaje: '12.00%',
          valor: seguridadSocial.pension_employer
        });
      }

      if (seguridadSocial.arl > 0) {
        rows.push({
          concepto: 'ARL',
          porcentaje: '0.52%',
          valor: seguridadSocial.arl
        });
      }

      return rows;
    },

    getSeguridadSocialEmpleadorTotal(seguridadSocial) {
      return (seguridadSocial.eps_employer || 0) + (seguridadSocial.pension_employer || 0) + (seguridadSocial.arl || 0);
    },

    // Parafiscales - Solo empleador (SENA, ICBF, Caja)
    getParafiscalesRows(parafiscales) {
      const rows = [];

      if (parafiscales.sena > 0) {
        rows.push({
          concepto: 'SENA',
          porcentaje: '2.00%',
          valor: parafiscales.sena
        });
      }

      if (parafiscales.icbf > 0) {
        rows.push({
          concepto: 'ICBF',
          porcentaje: '3.00%',
          valor: parafiscales.icbf
        });
      }

      if (parafiscales.caja_compensacion > 0) {
        rows.push({
          concepto: 'Caja de compensación',
          porcentaje: '4.00%',
          valor: parafiscales.caja_compensacion
        });
      }

      return rows;
    },

    // Nueva tabla: Deducciones - Solo empleado (EPS y Pensión)
    getDeduccionesRows(seguridadSocial) {
      const rows = [];

      if (seguridadSocial.eps_employee > 0) {
        rows.push({
          concepto: 'EPS',
          porcentaje: '4.00%',
          valor: seguridadSocial.eps_employee
        });
      }

      if (seguridadSocial.pension_employee > 0) {
        rows.push({
          concepto: 'Pensión',
          porcentaje: '4.00%',
          valor: seguridadSocial.pension_employee
        });
      }

      return rows;
    },

    getTotalParafiscales(parafiscales) {
      return (parafiscales.sena || 0) + (parafiscales.icbf || 0) + (parafiscales.caja_compensacion || 0);
    },

    // Función miles mejorada sin ceros adelante
    milesFixed(input) {
      if (input == null || input === undefined || input === '') {
        return '0';
      }

      const num = parseFloat(input);
      if (isNaN(num)) {
        return '0';
      }

      return num.toLocaleString('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
    },

    // NUEVOS MÉTODOS PARA GESTIÓN DE HORAS EXTRAS Y CONCEPTOS ADICIONALES

    getSalaryCompositionRows(employee) {
      // Calcular el total de la composición (base + dotación + auxilios + horas extras)
      const compositionTotal = this.getCompositionSalaryTotal(employee);

      const rows = [
        {
          concepto: 'Salario base',
          porcentaje: this.calculatePercentage(employee.base_salary, compositionTotal),
          valor: employee.base_salary,
          isEditable: false
        }
      ];

      // Agregar dotación si existe
      if (employee.dotacion_amount > 0) {
        rows.push({
          concepto: 'Dotación',
          porcentaje: this.calculatePercentage(employee.dotacion_amount, compositionTotal),
          valor: employee.dotacion_amount,
          isEditable: false
        });
      }

      if (employee.auxilios?.transporte > 0) {
        rows.push({
          concepto: 'Auxilio de transporte',
          porcentaje: this.calculatePercentage(employee.auxilios.transporte, compositionTotal),
          valor: employee.auxilios.transporte,
          isEditable: false
        });
      }

      if (employee.auxilios?.alimentacion > 0) {
        rows.push({
          concepto: 'Auxilio de alimentación',
          porcentaje: this.calculatePercentage(employee.auxilios.alimentacion, compositionTotal),
          valor: employee.auxilios.alimentacion,
          isEditable: false
        });
      }

      // Agregar horas extras
      if (employee.extra_hours_detail && employee.extra_hours_detail.length > 0) {
        employee.extra_hours_detail.forEach(extra => {
          rows.push({
            concepto: `Hora extra ${this.getExtraHourLabel(extra.concept_type)} (${extra.hours}h × ${extra.surcharge_percentage}%)`,
            porcentaje: this.calculatePercentage(extra.total_amount, compositionTotal),
            valor: extra.total_amount,
            isEditable: true,
            concept_id: extra.payroll_concept_id
          });
        });
      }

      return rows;
    },

    getExtraHourLabel(type) {
      const labels = {
        'EXTRA_HOUR_DIURNA': 'Diurna',
        'EXTRA_HOUR_NOCTURNA': 'Nocturna',
        'EXTRA_HOUR_DOMINICAL': 'Dominical',
        'EXTRA_HOUR_DOMINICAL_NOCTURNA': 'Dominical Nocturna',
        'EXTRA_HOUR_FESTIVA': 'Dominical',
        'EXTRA_HOUR_CUSTOM': 'Personalizada'
      };
      return labels[type] || type;
    },

    calculatePercentage(value, total) {
      if (total === 0 || !total) return '0.00';
      return ((value / total) * 100).toFixed(2);
    },

    openExtraHourDialog(employee) {
      this.selectedEmployee = employee;

      // Calcular valor hora base (salario_base_mensual / 240 horas mensuales)
      const baseSalary = employee.base_salary || 0;
      const hourlyRate = baseSalary / 240;

      this.extraHourForm = {
        type: 'EXTRA_HOUR_DIURNA',
        hours: 0,
        hourly_rate: Math.round(hourlyRate),
        surcharge_percentage: 25,
        total: 0,
        description: ''
      };

      this.extraHourDialog = true;
    },

    updateSurcharge(type) {
      const selected = this.extraHourTypes.find(t => t.value === type);
      if (selected && type !== 'EXTRA_HOUR_CUSTOM') {
        this.extraHourForm.surcharge_percentage = selected.surcharge;
      }
    },

    calculateExtraHourTotal() {
      const { hourly_rate, hours, surcharge_percentage } = this.extraHourForm;
      const baseAmount = hourly_rate * hours;
      const surchargeAmount = baseAmount * (surcharge_percentage / 100);
      const total = baseAmount + surchargeAmount;
      this.extraHourForm.total = Math.round(total);
      return this.miles(this.extraHourForm.total);
    },

    async saveExtraHour() {
      try {
        this.savingExtraHour = true;

        const payload = {
          user_id: this.selectedEmployee.employee_id,
          concept_type: this.extraHourForm.type,
          hours: this.extraHourForm.hours,
          hourly_rate: this.extraHourForm.hourly_rate,
          surcharge_percentage: this.extraHourForm.surcharge_percentage,
          total_amount: this.extraHourForm.total,
          description: this.extraHourForm.description
        };

        await this.$api.post(`/api/payroll/periods/${this.payroll.payrollPeriod.value}/concepts`, payload, {
          headers: { Authorization: `Bearer ${this.decryptSession('token')}` }
        });

        this.alert('positive', 'Hora extra agregada correctamente');
        this.extraHourDialog = false;

        // Recargar vista previa
        await this.onSubmit();
      } catch (error) {
        this.errorsAlerts(error);
      } finally {
        this.savingExtraHour = false;
      }
    },

    async deleteExtraHour(conceptId) {
      this.$q.dialog({
        title: 'Confirmar',
        message: '¿Eliminar esta hora extra?',
        cancel: true,
        persistent: true
      }).onOk(async () => {
        try {
          await this.$api.delete(`/api/payroll/concepts/${conceptId}`, {
            headers: { Authorization: `Bearer ${this.decryptSession('token')}` }
          });

          this.alert('positive', 'Hora extra eliminada');
          await this.onSubmit();
        } catch (error) {
          this.errorsAlerts(error);
        }
      });
    },

    // Calcular total de la tabla "Composición salario total" (solo base + dotación + auxilios + horas extras)
    getCompositionSalaryTotal(employee) {
      let total = parseFloat(employee.base_salary) || 0;

      console.log('🔵 Composición Salario - Base:', total);

      // Sumar dotación
      if (employee.dotacion_amount) {
        const dotacion = parseFloat(employee.dotacion_amount) || 0;
        console.log('🔵 + Dotación:', dotacion);
        total += dotacion;
      }

      // Sumar auxilios (transporte y alimentación)
      if (employee.auxilios?.transporte) {
        const transporte = parseFloat(employee.auxilios.transporte) || 0;
        console.log('🔵 + Auxilio transporte:', transporte);
        total += transporte;
      }
      if (employee.auxilios?.alimentacion) {
        const alimentacion = parseFloat(employee.auxilios.alimentacion) || 0;
        console.log('🔵 + Auxilio alimentación:', alimentacion);
        total += alimentacion;
      }

      // Sumar horas extras
      if (employee.extra_hours_detail && employee.extra_hours_detail.length > 0) {
        console.log('🔵 Horas extras encontradas:', employee.extra_hours_detail.length);
        employee.extra_hours_detail.forEach((extra, index) => {
          const amount = parseFloat(extra.total_amount) || 0;
          console.log(`🔵 + Hora extra ${index + 1}:`, amount, extra);
          total += amount;
        });
      } else {
        console.log('🔵 No hay horas extras');
      }

      console.log('🔵 TOTAL COMPOSICIÓN:', total);
      return total;
    },

    // Actualizar cálculo de totales
    calculateTotals(employees) {
      const totals = {
        total_base_salary: 0,
        total_salary: 0,
        total_commissions: 0,
        total_prestaciones: 0,
        total_auxilios: 0,
        total_devengado: 0,
        total_deducciones: 0,
        total_neto: 0
      };

      employees.forEach(emp => {
        totals.total_base_salary += emp.base_salary || 0;
        totals.total_salary += emp.total_salary || 0;
        totals.total_commissions += emp.commissions || 0;
        totals.total_prestaciones += this.getPrestacionesTotal(emp.prestaciones);
        totals.total_auxilios += this.getAuxiliosTotal(emp.auxilios);
        totals.total_devengado += emp.total_devengado || 0;
        totals.total_deducciones += emp.total_deducciones || 0;
        totals.total_neto += emp.total_neto || 0;
      });

      return totals;
    }
  }
}
</script>

<style type="text/css">
  body {
    background: #ECF0F3;
  }

  .header-table th {
    background-color: #00b4ff;
  }

  .expansion-container {
    background-color: #f5f5f5;
  }

  .info-card {
    min-height: 80px;
  }

  .detail-card {
    height: 100%;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    border-bottom: 1px solid #eee;
  }

  .detail-row:last-child {
    border-bottom: none;
  }

  .detail-row span:first-child {
    font-weight: 500;
    color: #666;
  }

  .detail-row span:last-child {
    font-weight: 600;
    color: #333;
  }

  /* Expansion table styles matching ModelLiquidation.vue */
  .header-expansion-table-g .q-table__top {
    background-color: #009e71;
    color: #ffffff;
  }

  .header-expansion-table-g th {
    background-color: #00ffb7;
  }

  .header-expansion-table-r .q-table__top {
    background-color: #bd6a00;
    color: #ffffff;
  }

  .header-expansion-table-r th {
    background-color: #ff8f00;
  }
</style>

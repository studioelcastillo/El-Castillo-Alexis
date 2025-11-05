<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card v-show="openGate('menu-studios_liquidation', sUser.prof_id)" flat bordered class="my-card">
          <q-form @submit="onSubmit" class="q-gutter-md">
            <q-card-section>
              <div class="row q-col-gutter-sm">
                <div class="col-xs-12 col-sm-4">
                  <q-select
                    filled
                    v-model="report.report_period"
                    label="Periodo"
                    label-color="primary"
                    :options="periods"
                    lazy-rules
                    :rules="[
                      val => !!val.value || 'Este campo es requerido',
                    ]"
                    @update:model-value="periodChanged"
                    color="teal-10"
                    :bg-color="(report.report_period.state === 'ABIERTO') ? 'green-11' : 'red-11'"
                  >
                    <template v-slot:option="scope">
                      <q-item v-bind="scope.itemProps" :class="(scope.opt.state === 'ABIERTO') ? 'bg-green-11' : 'bg-red-11'">
                        <q-item-section>
                          <span>{{ scope.opt.label }}</span>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>

                <div v-if="![4,5].includes(sUser.prof_id)" class="col-xs-12 col-sm-4">
                  <q-select
                    filled
                    v-model="report.std_active"
                    label="Estudios activos/inactivos"
                    label-color="primary"
                    :options="[
                      { label: 'SI', value: 'true' },
                      { label: 'NO', value: 'false' },
                    ]"
                    lazy-rules
                    :rules="[
                    ]"
                    @update:model-value="getStudios()"
                  />
                  <br>
                </div>

                <div v-if="![4,5].includes(sUser.prof_id)" class="col-xs-12 col-sm-4">
                  <q-select
                    filled
                    v-model="report.std_id"
                    label="Estudio"
                    label-color="primary"
                    :options="studios"
                    lazy-rules
                    :rules="[
                    ]"
                  />
                  <br>
                </div>

                <div v-if="![4,5].includes(sUser.prof_id)" class="col-xs-12 col-sm-4">
                  <gk-select-multiple
                    filled
                    v-model="report.destiny_banks"
                    label="Filtrar por cuenta destino"
                    label-color=""
                    use-input
                    hide-selected
                    fill-input
                    :options="banks_entities"
                    :min-selection="0"
                    all-items-label="TODOS"
                  /><br>
                  <br>
                </div>

                <div class="col-xs-12 col-sm-4">
                  <gk-select-multiple
                    filled
                    v-model="report.apps"
                    label="Plataformas"
                    label-color=""
                    use-input
                    hide-selected
                    fill-input
                    :options="apps"
                    :min-selection="0"
                    all-items-label="TODAS"
                  /><br><br>
                </div>

                <div v-if="![4,5].includes(sUser.prof_id)" class="col-xs-12 col-sm-4">
                  <gk-select-multiple
                    filled
                    v-model="report.shifts"
                    label="Turnos"
                    label-color=""
                    use-input
                    hide-selected
                    fill-input
                    :options="studios_shifts"
                    :min-selection="0"
                    all-items-label="TODOS"
                  /><br>
                  <br>
                </div>

                <div v-if="![4,5].includes(sUser.prof_id)" class="col-xs-12 col-sm-4">
                  <q-select
                    filled
                    v-model="report.std_ally_master_pays"
                    label="Pago por master"
                    label-color="primary"
                    :options="[
                      { label: 'SI', value: 'true' },
                      { label: 'NO', value: 'false' },
                    ]"
                    lazy-rules
                    :rules="[
                    ]"
                  />
                  <br>
                </div>

                <div v-if="![4,5].includes(sUser.prof_id)" class="col-xs-12 col-sm-4">
                  <q-select
                    filled
                    v-model="report.orderBy"
                    label="Ordenamiento"
                    label-color=""
                    use-input
                    hide-selected
                    fill-input
                    :options="[
                      {label: 'Ingresos', value: 'sum_earnings_usd DESC, sum_earnings_eur DESC'},
                      {label: 'Nombres', value: 'st.std_name'},
                      {label: 'Horas en linea', value: 'sum_time DESC'},
                      {label: 'Pseudónimo', value: 'ma.modacc_username'},
                      {label: 'Bancos', value: 'bka.bankacc_entity'},
                    ]"
                    :min-selection="0"
                  /><br>
                  <br>
                </div>
              </div>
            </q-card-section>

            <q-separator inset />

            <q-card-section>
              <div>
                <q-btn :label="submitBtnLabel" type="submit" class="bg-primary text-white"/>
                <q-btn
                  color="red"
                  icon="picture_as_pdf"
                  class="q-ml-sm"
                  @click="downloadResumenPdf"
                >
                  <q-tooltip>Total por páginas</q-tooltip>
                </q-btn>
              </div>
            </q-card-section>
          </q-form>
        </q-card>

        <br>

        <!-- summary -->
        <q-card v-show="openGate('liquidation-summary_per_source', sUser.prof_id)" flat bordered class="my-card">
          <q-card-section>
            <h5 class="is-size-3">Resumen por fuente</h5><br>
            <q-list bordered class="rounded-borders">
              <template v-for="(source, index) in summary.bySource" :key="index">
                <q-expansion-item
                  expand-separator
                  :label="source.modstr_source"
                  :caption="'Total (USD): $' + miles(source.sum_earnings_usd) + ', Total (EUR): $' + miles(source.sum_earnings_eur) + ', Total (COP): $' + miles(source.sum_earnings_cop)"
                >
                  <q-card>
                    <q-card-section>
                      <div class="row q-col-gutter-sm">
                        <q-card class="col-xs-12 col-sm-4 col-md-3 col-xl-2 flex-center q-mt-sm q-mb-sm" v-for="(income, income_index) in source.incomes" :key="income_index">
                          <q-card-section>
                            <h6>{{ income.modacc_app }}:</h6>
                            <q-separator />
                            <br>
                            <table>
                              <tr>
                                <td><b>Total (USD):</b></td>
                                <td class="q-pl-sm">${{ miles(income.sum_earnings_usd) }}</td>
                              </tr>
                              <tr>
                                <td><b>Total (EUR):</b></td>
                                <td class="q-pl-sm">${{ miles(income.sum_earnings_eur) }}</td>
                              </tr>
                              <tr>
                                <td><b>Total (COP):</b></td>
                                <td class="q-pl-sm">${{ miles(income.sum_earnings_cop) }}</td>
                              </tr>
                            </table>
                          </q-card-section>
                        </q-card>
                      </div>
                    </q-card-section>
                  </q-card>
                </q-expansion-item>
              </template>
            </q-list>
          </q-card-section>
        </q-card>

        <br>

        <q-card v-show="openGate('menu-studios_liquidation', sUser.prof_id)" flat bordered class="my-card">
          <q-card-section>
            <q-table
              flat bordered
              ref="tableRef"
              title="Estudios"
              dense
              :columns="columns"
              :rows="dataset"
              :filter="filter"
              :loading="loading"
              :visible-columns="visibleColumns"
              rows-per-page-label="Registros por página"
              no-data-label="No hay registros disponibles"
              row-key="std_name"
              :pagination="initialPagination"
              selection="multiple"
              v-model:selected="selectedRows"
              @selection="handleSelection"
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

              <template v-slot:header-selection="scope">
                <q-checkbox v-model="scope.selected" />
              </template>

              <template v-slot:body="props">
                <q-tr 
                  v-if="(props.row.sum_earnings_usd != 0) || 
                    (props.row.sum_earnings_eur != 0) || 
                    (props.row.sum_earnings_cop != 0) ||
                    (props.row.sum_earnings_discounts != 0) ||
                    (props.row.sum_earnings_others != 0) ||
                    (props.row.sum_earnings_net != 0)"
                  :props="props" 
                  :style="{backgroundColor: (props.row.sum_earnings_total < 0) ? '#ffe5e5' : '' }"
                >
                  <q-td auto-width align="center">
                    <!-- pago realizado -->
                    <a v-if="props.row.payments.length > 0" class="text-blue-8" style="cursor: pointer; padding: 5px;" @click="openSubgridForm('show', props.row.payments)">
                      <q-icon name="check_circle" size="sm" class="text-green"/>
                      <q-tooltip :delay="100" :offset="[0, 10]">Ya se ha realizado pago</q-tooltip>
                    </a>
                    <!-- Si no es un usuario estudio y no se paga desde master -->
                    <!-- <span v-else-if="!openGate('is-studio', sUser.prof_id) && !props.row.std_ally_master_pays">
                      <q-icon name="currency_exchange" size="sm" class="text-orange"/>
                      <q-tooltip :delay="100" :offset="[0, 10]">No se paga desde master</q-tooltip>
                    </span> -->
                    <!-- valor inferior a 30000 -->
                    <span v-else-if="props.row.sum_earnings_total < 30000">
                      <q-icon name="warning" size="sm" class="text-orange"/>
                      <q-tooltip :delay="100" :offset="[0, 10]">Pago debe ser superior a $30.000 (COP)</q-tooltip>
                    </span>
                    <!-- pendiente de pago -->
                    <q-checkbox v-else :model-value="props.selected" @update:model-value="(val, evt) => { Object.getOwnPropertyDescriptor(props, 'selected').set(val, evt) }" />
                  </q-td>
                  <q-td auto-width>
                    <span class="q-mr-sm text-caption text-grey-7">#{{ dataset.indexOf(props.row) + 1 }}</span>
                    <q-btn size="sm" color="primary" round dense @click="props.row.expand = !props.row.expand" :icon="props.row.expand ? 'remove' : 'add'" />
                  </q-td>
                  <q-td key="std_name" :props="props">
                    <span>
                      <q-avatar v-if="props.row.bankacc_entity == 'BANCO BBVA'" size="xs" color="white" style="border: 1px solid #444444" ><img src="/icons/bbva-logo.png"><q-tooltip :delay="100" :offset="[0, 10]">BBVA</q-tooltip></q-avatar>
                      <q-avatar v-if="props.row.bankacc_entity == 'BANCOLOMBIA'" size="xs" color="white" style="border: 1px solid #444444" ><img src="/icons/bancolombia-logo.png"><q-tooltip :delay="100" :offset="[0, 10]">BANCOLOMBIA</q-tooltip></q-avatar>
                      <q-avatar v-if="props.row.bankacc_entity == 'SCOTIABANK'" size="xs" color="white" style="border: 1px solid #444444" ><img src="/icons/scotiabank-logo.png"><q-tooltip :delay="100" :offset="[0, 10]">SCOTIABANK</q-tooltip></q-avatar>
                      <q-avatar v-if="props.row.bankacc_entity == 'BANCO AV VILLAS'" size="xs" color="white" style="border: 1px solid #444444" ><img src="/icons/avvillas-logo.jpg"><q-tooltip :delay="100" :offset="[0, 10]">AVVILLAS</q-tooltip></q-avatar>
                      <q-avatar v-if="props.row.bankacc_entity == 'NEQUI'" size="xs" color="white" style="border: 1px solid #444444" ><img src="/icons/nequi-logo.jpg"><q-tooltip :delay="100" :offset="[0, 10]">NEQUI</q-tooltip></q-avatar>
                      <q-avatar v-if="props.row.bankacc_entity == 'BANCO DAVIVIENDA'" size="xs" color="white" style="border: 1px solid #444444" ><img src="/icons/davivienda-logo.png"><q-tooltip :delay="100" :offset="[0, 10]">DAVIVIENDA</q-tooltip></q-avatar>
                      <q-avatar v-if="props.row.bankacc_entity == 'FALABELLA'" size="xs" color="white" style="border: 1px solid #444444" ><img src="/icons/falabella-logo.webp"><q-tooltip :delay="100" :offset="[0, 10]">FALABELLA</q-tooltip></q-avatar>
                      <q-avatar v-if="props.row.bankacc_entity == 'AHORRO A LA MANO'" size="xs" color="white" style="border: 1px solid #444444" ><img src="/icons/ahorro-a-la-mano-logo.png"><q-tooltip :delay="100" :offset="[0, 10]">AHORRO A LA MANO</q-tooltip></q-avatar>
                      <q-icon v-else-if="!props.row.bankacc_entity" name="error" size="sm" class="text-red"><q-tooltip :delay="100" :offset="[0, 10]">No posee cuenta registrada</q-tooltip></q-icon>
                      {{ props.row.std_name }}
                      <a v-if="openGate('show-studios', sUser.prof_id)" @click="goTo('studios/show/' + props.row.std_id, '_blank')" style="cursor:pointer;">
                        <q-icon name="open_in_new" size="sm" class="text-teal-8">
                          <q-tooltip :delay="100" :offset="[0, 10]">Ver registro</q-tooltip>
                        </q-icon>
                      </a>
                    </span>
                  </q-td>
                  <q-td key="owner_name" :props="props">{{ props.row.owner_name }}</q-td>
                  <q-td key="sum_earnings_usd" :props="props">${{ miles(props.row.sum_earnings_usd) }}</q-td>
                  <q-td key="sum_earnings_eur" :props="props">${{ miles(props.row.sum_earnings_eur) }}</q-td>
                  <q-td key="sum_earnings_cop" :props="props">${{ miles(props.row.sum_earnings_cop) }}</q-td>
                  <q-td key="sum_earnings_discounts" :props="props">${{ miles(props.row.sum_earnings_discounts) }}</q-td>
                  <q-td key="sum_earnings_others" :props="props">${{ miles(props.row.sum_earnings_others) }}</q-td>
                  <q-td key="sum_earnings_net" :props="props">${{ miles(props.row.sum_earnings_net) }}</q-td>
                  <!-- <q-td key="sum_earnings_time" :props="props">
                    <span v-if="props.row.sum_earnings_hours >= 40">
                      {{ props.row.sum_earnings_time }}
                      <q-icon name="alarm_on" size="sm" class="text-green"/><q-tooltip :delay="100" :offset="[0, 10]">Tiempo completado</q-tooltip>
                    </span>
                    <span v-else>
                      {{ props.row.sum_earnings_time }}
                      <q-icon name="error" size="sm" class="text-red"/><q-tooltip :delay="100" :offset="[0, 10]">Tiempo no completado</q-tooltip>
                    </span>
                  </q-td> -->
                  <q-td key="sum_earnings_rtefte" :props="props">${{ miles(props.row.sum_earnings_rtefte) }}</q-td>
                  <q-td key="sum_earnings_total" :props="props">${{ miles(props.row.sum_earnings_total) }}</q-td>
                  <q-td key="action" :props="props">
                    <!-- <a v-if="(!isSubgrid || parentMode == 'edit')" class="text-red" style="cursor: pointer;" @click="downloadLiquidationPdf(props.row.std_id)"> <q-icon size="sm" name="picture_as_pdf"/>
                      <q-tooltip :offset="[0, 10]">Descargar PDF - Liquidación</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit')" class="text-red" style="cursor: pointer;" @click="downloadPaymentNotePdf(props.row.std_id)"> <q-icon size="sm" name="picture_as_pdf"/>
                      <q-tooltip :offset="[0, 10]">Descargar PDF - Cuenta de Cobro</q-tooltip>
                    </a> -->
                  </q-td>
                </q-tr>
                <!-- expand -->
                <q-tr 
                  v-if="(props.row.sum_earnings_usd != 0) || 
                    (props.row.sum_earnings_eur != 0) || 
                    (props.row.sum_earnings_cop != 0) ||
                    (props.row.sum_earnings_discounts != 0) ||
                    (props.row.sum_earnings_others != 0) ||
                    (props.row.sum_earnings_net != 0)"
                  v-show="props.row.expand" 
                  :props="props" 
                  class="expansion-container"
                >
                  <q-td colspan="100%">
                    <!-- ingresos -->
                    <q-table
                      v-if="props.row.incomes.length > 0"
                      :rows="props.row.incomes"
                      :columns="incomesColumns"
                      row-key="name"
                      :pagination="initialPagination"
                      hide-bottom
                      class="header-expansion-table-g q-mb-sm q-mt-xs"
                    >
                      <!-- header -->
                      <template v-slot:top>
                        <div>Ingresos</div>
                      </template>
                      <!-- body -->
                      <template v-slot:body="subprops">
                        <q-tr :props="subprops">
                          <q-td key="modacc_period" :props="subprops">{{ subprops.row.modacc_period }}</q-td>
                          <q-td key="modacc_app" :props="subprops">{{ subprops.row.modacc_app }}</q-td>
                          <q-td key="modstr_earnings_trm" :props="subprops">${{ miles(subprops.row.modstr_earnings_trm) }}</q-td>
                          <q-td key="modstr_earnings_percent" :props="subprops">{{ miles(subprops.row.modstr_earnings_percent * 100) }}%</q-td>
                          <q-td key="sum_earnings_tokens" :props="subprops">{{ miles(subprops.row.sum_earnings_tokens) }}</q-td>
                          <q-td key="modstr_tokens_rate" :props="subprops">{{ subprops.row.modstr_tokens_rate }}</q-td>
                          <q-td key="sum_time" :props="subprops">{{ subprops.row.sum_time }}</q-td>
                          <q-td key="sum_earnings_usd" :props="subprops">${{ miles(subprops.row.sum_earnings_usd) }}</q-td>
                          <q-td key="sum_earnings_eur" :props="subprops">${{ miles(subprops.row.sum_earnings_eur) }}</q-td>
                          <q-td key="sum_earnings_cop" :props="subprops">${{ miles(subprops.row.sum_earnings_cop) }}</q-td>
                        </q-tr>
                      </template>
                      <!-- footer -->
                      <template v-slot:bottom-row>
                        <q-tr>
                          <q-td key="modacc_period"><b>Total</b></q-td>
                          <q-td key="modacc_app"><b></b></q-td>
                          <q-td key="modstr_earnings_trm"><b></b></q-td>
                          <q-td key="modstr_earnings_percent"><b></b></q-td>
                          <q-td key="sum_earnings_tokens"><b>{{ miles(props.row.sum_earnings_tokens) }}</b></q-td>
                          <q-td key="modstr_tokens_rate"><b></b></q-td>
                          <!-- <q-td key="sum_time"><b>{{ props.row.sum_earnings_time }}</b></q-td> -->
                          <q-td key="sum_earnings_usd"><b>${{ miles(props.row.sum_earnings_usd) }}</b></q-td>
                          <q-td key="sum_earnings_eur"><b>${{ miles(props.row.sum_earnings_eur) }}</b></q-td>
                          <q-td key="sum_earnings_cop"><b>${{ miles(props.row.sum_earnings_cop) }}</b></q-td>
                        </q-tr>
                      </template>
                    </q-table>
                    <!-- descuentos -->
                    <q-table
                      v-if="props.row.discounts.length > 0"
                      :rows="props.row.discounts"
                      :columns="discountsColumns"
                      row-key="name"
                      :pagination="initialPagination"
                      hide-bottom
                      class="header-expansion-table-r q-mb-sm"
                    >
                      <!-- header -->
                      <template v-slot:top>
                        <div>Descuentos</div>
                      </template>
                      <!-- body -->
                      <template v-slot:body="subprops">
                        <q-tr :props="subprops">
                          <q-td key="trans_date" :props="subprops">{{ subprops.row.trans_date }}</q-td>
                          <q-td key="transtype_name" :props="subprops">{{ subprops.row.transtype_name }}</q-td>
                          <q-td key="trans_description" :props="subprops">{{ subprops.row.trans_description }}</q-td>
                          <q-td key="trans_total" :props="subprops">${{ miles(subprops.row.trans_total) }}</q-td>
                        </q-tr>
                      </template>
                      <!-- footer -->
                      <template v-slot:bottom-row>
                        <q-tr>
                          <q-td key="trans_date"><b>Total</b></q-td>
                          <q-td key="transtype_name"></q-td>
                          <q-td key="trans_description"><b></b></q-td>
                          <q-td key="trans_total"><b>${{ miles(props.row.sum_earnings_discounts) }}</b></q-td>
                        </q-tr>
                      </template>
                    </q-table>
                    <!-- otros ingresos -->
                    <q-table
                      v-if="props.row.others.length > 0"
                      :rows="props.row.others"
                      :columns="otherIncomesColumns"
                      row-key="name"
                      :pagination="initialPagination"
                      hide-bottom
                      class="header-expansion-table-g q-mb-sm"
                    >
                      <!-- header -->
                      <template v-slot:top>
                        <div>Otros ingresos</div>
                      </template>
                      <!-- body -->
                      <template v-slot:body="subprops">
                        <q-tr :props="subprops">
                          <q-td key="trans_date" :props="subprops">{{ subprops.row.trans_date }}</q-td>
                          <q-td key="transtype_name" :props="subprops">{{ subprops.row.transtype_name }}</q-td>
                          <q-td key="trans_description" :props="subprops">{{ subprops.row.trans_description }}</q-td>
                          <q-td key="trans_total" :props="subprops">${{ miles(subprops.row.trans_total) }}</q-td>
                        </q-tr>
                      </template>
                      <!-- footer -->
                      <template v-slot:bottom-row>
                        <q-tr>
                          <q-td key="trans_date"><b>Total</b></q-td>
                          <q-td key="transtype_name"></q-td>
                          <q-td key="trans_description"><b></b></q-td>
                          <q-td key="trans_total"><b>${{ miles(props.row.sum_earnings_others) }}</b></q-td>
                        </q-tr>
                      </template>
                    </q-table>
                  </q-td>
                </q-tr>
                <q-tr v-if="dataset.length - 1 == dataset.indexOf(props.row)" style="background-color: black; color: white;">
                  <q-td auto-width align="center"></q-td>
                  <q-td key="user_name"></q-td>
                  <q-td key="std_name"><b>{{ dataset.length }} estudios</b></q-td>
                  <q-td key="owner_name"><b>Totales</b></q-td>
                  <q-td key="sum_earnings_usd">${{ miles(totalTable.sum_earnings_usd) }}</q-td>
                  <q-td key="sum_earnings_eur">${{ miles(totalTable.sum_earnings_eur) }}</q-td>
                  <q-td key="sum_earnings_cop">${{ miles(totalTable.sum_earnings_cop) }}</q-td>
                  <q-td key="sum_earnings_discounts">${{ miles(totalTable.sum_earnings_discounts) }}</q-td>
                  <q-td key="sum_earnings_others">${{ miles(totalTable.sum_earnings_others) }}</q-td>
                  <q-td key="sum_earnings_net">${{ miles(totalTable.sum_earnings_net) }}</q-td>
                  <!--<q-td key="sum_earnings_time">{{ totalTable.sum_earnings_time }}</q-td>-->
                  <q-td key="sum_earnings_rtefte">${{ miles(totalTable.sum_earnings_rtefte) }}</q-td>
                  <q-td key="sum_earnings_total">${{ miles(totalTable.sum_earnings_total) }}</q-td>
                  <q-td key="action"></q-td>
                </q-tr>
              </template>
            </q-table>

            <q-card-section v-if="openGate('generate_file-studios_liquidation', sUser.prof_id)">
              <div style="display:flex; justify-content:center;">
                <q-btn label="Descargar archivo" type="submit" class="bg-green text-white" @click="liquidationExport()">
                  <a class="text-white q-ml-sm" style="cursor: pointer;"><q-icon name="save_alt"/></a>
                </q-btn>
              </div>
            </q-card-section>
          </q-card-section>
        </q-card>

        <br>

        <!-- payments -->
        <q-card v-if="openGate('generate_file-studios_liquidation', sUser.prof_id)" flat bordered class="my-card">
          <q-form @submit="onSubmit" class="q-gutter-md">
            <q-card-section>
              <div class="row q-col-gutter-sm">
                <div class="col-xs-12 col-sm-12">
                  <q-card flat bordered class="my-card">
                    <q-card-section>
                      <div class="row q-col-gutter-sm">
                        <div class="col-xs-12 col-sm-12">
                          <h5 class="is-size-3">Descargar archivo de pagos</h5>
                          <br>
                        </div>
                      </div>
                      <div class="row q-col-gutter-sm">
                        <div class="col-xs-12 col-sm-12">
                          <p><b>seleccionar banco:</b></p>
                        </div>
                        <div class="col-xs-12 col-sm-12">
                          <div style="display: flex; flex-direction: row; flex-wrap: wrap;">
                            <div v-for="(bank, index) in banks" v-bind:key="index" style="width: 120px;">
                              <q-card flat bordered class="my-card" :style="{
                                  border: (report.bank == bank.value) ? '1px solid #46adff' : '',
                                  backgroundColor: (report.bank == bank.value) ? '#4dc7cd21 !important' : ''
                                }">
                                <q-card-section style="display: flex; flex-direction: column; align-items: center; text-align: center; height: 140px; cursor: pointer; padding-bottom: 0px;" @click="report.bank = bank.value">
                                  <span>{{ bank.label }}</span>
                                  <q-img width="60px" height="60px" :src="bank.image" />
                                  <q-radio v-model="report.bank" :val="bank.value" color="blue" keep-color />
                                </q-card-section>
                              </q-card>
                            </div>
                          </div>
                        </div>
                      </div>
                    </q-card-section>
                    <q-card-section>
                      <div>
                        <q-btn class="bg-primary text-white submit1" label="Descargar plano de pago" @click="downloadPaymentPlain" />
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </q-card-section>
          </q-form>
        </q-card>

        <q-dialog v-if="dialogPayments.length > 0" v-model="dialog" full-width full-height>
          <q-card flat bordered class="my-card" style="width: 100%;">
            <q-card-section>
              <template v-for="(payment, index) in dialogPayments" v-bind:key="index">
                <q-card flat bordered class="my-card" style="width: 100%;">
                  <PaymentFileForm is-dialog="true" :dialog-child-id="payment.payfile_id" modeprop="show" @save="onSubmit()" @close="dialogChildId = null; dialog = false"/>
                </q-card>
                <br>
              </template>
            </q-card-section>
          </q-card>
        </q-dialog>
        <br>
        <AccountingArchive 
          v-if="openGate('download-studios-reports', sUser.prof_id)" 
          :report_period_since="report.report_period.since" 
          :report_period_until="report.report_period.until" 
          :report_period_state="report.report_period.state" 
          :report_period_label="report.report_period.label"
          :is-model-liquidation="false"
        />
      </div>
    </div>
  </div>
</template>

<script>
import StudioModelService from 'src/services/StudioModelService'
import StudioService from 'src/services/StudioService'
import ReportService from 'src/services/ReportService'
import LiquidationService from 'src/services/LiquidationService'
import StudioShiftService from 'src/services/StudioShiftService'
import StudioModelForm from 'src/pages/StudioModel/StudioModelForm.vue'
import PaymentFileForm from 'src/pages/PaymentFile/PaymentFileForm.vue'
import GkSelectMultiple from 'src/components/GkSelectMultiple.vue'
import PeriodService from 'src/services/PeriodService'
import AccountingArchive from 'src/pages/Report/Components/AccountingArchive.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

import { ref, toRaw, nextTick } from 'vue'

export default {
  name: 'StudiosStudiosList',
  mixins: [xMisc, sGate],
  components: {
    PaymentFileForm,
    GkSelectMultiple,
    AccountingArchive
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
      dialogPayments: [],
      // form
      report: {
        report_period: { value: 0, label: '' },
        std_id: { value: 0, label: '' },
        std_ally_master_pays: { label: 'SI', value: 'true' },
        std_active: { label: 'SI', value: 'true' },
        destiny_banks: [],
        apps: [],
        shifts: [],
        orderBy: {label: 'Ingresos', value: 'sum_earnings_usd DESC, sum_earnings_eur DESC'},
        bank: 'BANCO BBVA',
      },
      periods: [],
      studios: [],
      studios_shifts: [],
      banks_entities: [
        { label: 'BANCO DE BOGOTA', value: 'BANCO DE BOGOTA' },
        { label: 'BANCO POPULAR', value: 'BANCO POPULAR' },
        { label: 'BANCOLOMBIA', value: 'BANCOLOMBIA' },
        { label: 'BANCO BBVA', value: 'BANCO BBVA' },
        { label: 'COLPATRIA', value: 'COLPATRIA' },
        { label: 'BANCO DE OCCIDENTE', value: 'BANCO DE OCCIDENTE' },
        { label: 'BANCO CAJA SOCIAL', value: 'BANCO CAJA SOCIAL' },
        { label: 'BANCO DAVIVIENDA', value: 'BANCO DAVIVIENDA' },
        { label: 'BANCO AV VILLAS', value: 'BANCO AV VILLAS' },
        { label: 'BANCOOMEVA', value: 'BANCOOMEVA' },
        { label: 'SCOTIABANK', value: 'SCOTIABANK' },
      ],
      apps: [
        { label: 'Páginas privadas', value: 'private', disable: true },
        { label: 'LIVEJASMIN', value: 'LIVEJASMIN' },
        { label: 'STREAMATE', value: 'STREAMATE' },
        { label: 'IMLIVE', value: 'IMLIVE' },
        { label: 'FLIRT4FREE', value: 'FLIRT4FREE' },
        { label: 'SKYPRIVATE', value: 'SKYPRIVATE' },
        { label: 'XLOVECAM', value: 'XLOVECAM' },
        { label: 'STREAMRAY', value: 'STREAMRAY' },
        { label: 'ADULTWORK', value: 'ADULTWORK' },
        { label: 'SAKURALIVE', value: 'SAKURALIVE' },
        { label: 'Páginas de tokens', value: 'token', disable: true },
        { label: 'MYFREECAMS', value: 'MYFREECAMS' },
        { label: 'CHATURBATE', value: 'CHATURBATE' },
        { label: 'BONGACAMS', value: 'BONGACAMS' },
        { label: 'CAM4', value: 'CAM4' },
        { label: 'CAMSODA', value: 'CAMSODA' },
        { label: 'CAMSODA ALIADOS', value: 'CAMSODA ALIADOS' },
        { label: 'MYDIRTYHOBBY', value: 'MYDIRTYHOBBY' },
        { label: 'STRIPCHAT', value: 'STRIPCHAT' },
        { label: 'CHERRY', value: 'CHERRY' },
        { label: 'DREAMCAM', value: 'DREAMCAM' },
        { label: 'Páginas de contenido', value: 'content', disable: true },
        { label: 'ONLYFANS', value: 'ONLYFANS' },
        { label: 'ONLYFANS_VIP', value: 'ONLYFANS_VIP' },
        { label: 'F2F', value: 'F2F' },
        { label: 'FANSLY', value: 'FANSLY' },
        { label: 'FANCENTRO', value: 'FANCENTRO' },
        { label: 'XHAMSTER', value: 'XHAMSTER' },
        { label: 'SWIPEY.AI', value: 'SWIPEY.AI' },
        { label: 'CHARMS', value: 'CHARMS' },
        { label: 'PORNHUB', value: 'PORNHUB' },
        { label: 'SEXCOM', value: 'SEXCOM' },
        { label: 'LOYALFANS', value: 'LOYALFANS' },
        { label: 'LOVERFANS', value: 'LOVERFANS' },
        { label: 'MANYVIDS', value: 'MANYVIDS' },
        //{ label: 'KWIKY', value: 'KWIKY' },
        { label: 'Redes sociales', value: 'social', disable: true },
        { label: 'MYLINKDROP', value: 'MYLINKDROP' },
        { label: 'INSTAGRAM', value: 'INSTAGRAM' },
        { label: 'X', value: 'X' },
        { label: 'TIKTOK', value: 'TIKTOK' },
        { label: 'TELEGRAM', value: 'TELEGRAM' },
        { label: 'REDDIT', value: 'REDDIT' },
        { label: 'LOVENSE', value: 'LOVENSE' },
        { label: 'AMAZON', value: 'AMAZON' },
        { label: 'TWITCH', value: 'TWITCH' },
        { label: 'DISCORD', value: 'DISCORD' }
      ],
      banks: [
        {
          value: 'BANCO BBVA',
          label: 'Banco BBVA',
          image: '/icons/bbva-logo.png',
        },
        {
          value: 'BANCOLOMBIA',
          label: 'Bancolombia',
          image: '/icons/bancolombia-logo.png',
        },
        {
          value: 'SCOTIABANK',
          label: 'Scotiabank',
          image: '/icons/scotiabank-logo.png',
        },
        {
          value: 'BANCO AV VILLAS',
          label: 'AV Villas',
          image: '/icons/avvillas-logo.jpg',
        },
      ],
      // datatables
      dataset: [],
      summary: {
        bySource: []
      },
      filter: '',
      visibleColumns: ['user_name', 'std_name', 'modacc_app', 'modacc_username'],
      initialPagination: {
        sortBy: 'desc',
        descending: false,
        page: 0,
        rowsPerPage: 0
        // rowsNumber: xx if getting data from a server
      },
      columns: [
        {
          name: 'expand',
          required: true,
          label: '',
          align: 'left',
          sortable: true
        },
        {
          name: 'std_name',
          required: true,
          label: 'Estudio',
          align: 'left',
          field: row => row.std_name,
          sortable: true
        },
        {
          name: 'owner_name',
          required: true,
          label: 'Propietario',
          align: 'left',
          field: row => row.owner_name,
          sortable: true
        },
        {
          name: 'sum_earnings_usd',
          required: true,
          label: '(USD)',
          align: 'left',
          field: row => row.sum_earnings_usd,
          sortable: true
        },
        {
          name: 'sum_earnings_eur',
          required: true,
          label: '(EUR)',
          align: 'left',
          field: row => row.sum_earnings_eur,
          sortable: true
        },
        {
          name: 'sum_earnings_cop',
          required: true,
          label: '(COP)',
          align: 'left',
          field: row => row.sum_earnings_cop,
          sortable: true
        },
        {
          name: 'sum_earnings_discounts',
          required: true,
          label: 'Descuentos',
          align: 'left',
          field: row => row.sum_earnings_discounts,
          sortable: true
        },
        {
          name: 'sum_earnings_others',
          required: true,
          label: 'Otros Ing.',
          align: 'left',
          field: row => row.sum_earnings_others,
          sortable: true
        },
        {
          name: 'sum_earnings_net',
          required: true,
          label: 'Neto',
          align: 'left',
          field: row => row.sum_earnings_net,
          sortable: true
        },
        // {
        //   name: 'sum_earnings_time',
        //   required: true,
        //   label: 'Horas (40h)',
        //   align: 'left',
        //   field: row => row.sum_earnings_time,
        //   sortable: true
        // },
        {
          name: 'sum_earnings_rtefte',
          required: true,
          label: 'Rte/Fte',
          align: 'left',
          field: row => row.sum_earnings_rtefte,
          sortable: true
        },
        {
          name: 'sum_earnings_total',
          required: true,
          label: 'A Pagar',
          align: 'left',
          field: row => row.sum_earnings_total,
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
      incomesColumns: [
        {
          name: 'modacc_period',
          required: true,
          label: 'Periodo',
          align: 'left',
          field: row => row.modacc_period,
          sortable: true
        },
        {
          name: 'modacc_app',
          required: true,
          label: 'Plataforma',
          align: 'left',
          field: row => row.modacc_app,
          sortable: true
        },
        {
          name: 'modstr_earnings_trm',
          required: true,
          label: 'Tasa',
          align: 'left',
          field: row => row.modstr_earnings_trm,
          sortable: true
        },
        {
          name: 'modstr_earnings_percent',
          required: true,
          label: 'Comisión',
          align: 'left',
          field: row => row.modstr_earnings_percent,
          sortable: true
        },
        {
          name: 'sum_earnings_tokens',
          required: true,
          label: 'Tokens',
          align: 'left',
          field: row => row.sum_earnings_tokens,
          sortable: true
        },
        {
          name: 'modstr_tokens_rate',
          required: true,
          label: 'Tokens (%)',
          align: 'left',
          field: row => row.modstr_tokens_rate,
          sortable: true
        },
        {
          name: 'sum_time',
          required: true,
          label: 'Tiempo',
          align: 'left',
          field: row => row.sum_time,
          sortable: true
        },
        {
          name: 'sum_earnings_usd',
          required: true,
          label: '(USD)',
          align: 'left',
          field: row => row.sum_earnings_usd,
          sortable: true
        },
        {
          name: 'sum_earnings_eur',
          required: true,
          label: '(EUR)',
          align: 'left',
          field: row => row.sum_earnings_eur,
          sortable: true
        },
        {
          name: 'sum_earnings_cop',
          required: true,
          label: 'Total',
          align: 'left',
          field: row => row.sum_earnings_cop,
          sortable: true
        },
      ],
      discountsColumns: [
        {
          name: 'trans_date',
          required: true,
          label: 'Fecha',
          align: 'left',
          field: row => row.trans_date,
          sortable: true
        },
        {
          name: 'transtype_name',
          required: true,
          label: 'Tipo',
          align: 'left',
          field: row => row.transtype_name,
          sortable: true
        },
        {
          name: 'trans_description',
          required: true,
          label: 'Descripción',
          align: 'left',
          field: row => row.trans_description,
          sortable: true
        },
        {
          name: 'trans_total',
          required: true,
          label: 'Valor',
          align: 'left',
          field: row => row.trans_total,
          sortable: true
        },
      ],
      otherIncomesColumns: [
        {
          name: 'trans_date',
          required: true,
          label: 'Fecha',
          align: 'left',
          field: row => row.trans_date,
          sortable: true
        },
        {
          name: 'transtype_name',
          required: true,
          label: 'Tipo',
          align: 'left',
          field: row => row.transtype_name,
          sortable: true
        },
        {
          name: 'trans_description',
          required: true,
          label: 'Descripción',
          align: 'left',
          field: row => row.trans_description,
          sortable: true
        },
        {
          name: 'trans_total',
          required: true,
          label: 'Valor',
          align: 'left',
          field: row => row.trans_total,
          sortable: true
        },
      ],
      selectedRows: [],
      storedSelectedRow: null,
      submitBtnLabel: 'Liquidar'
    }
  },
  computed: {
    totalTable () {
      let objSum = {
        sum_earnings_cop: 0,
        sum_earnings_discounts: 0,
        sum_earnings_eur: 0,
        sum_earnings_hours: 0,
        sum_earnings_net: 0,
        sum_earnings_others: 0,
        sum_earnings_rtefte: 0,
        //sum_earnings_time: "00:00:00"
        sum_earnings_tokens: 0,
        sum_earnings_total: 0,
        sum_earnings_usd: 0
      }
      let sumEarningsHoursArr = []
      for (let i = 0; i < this.dataset.length; i++) {
        objSum.sum_earnings_tokens += this.dataset[i].sum_earnings_tokens
        objSum.sum_earnings_usd += this.dataset[i].sum_earnings_usd
        objSum.sum_earnings_eur += this.dataset[i].sum_earnings_eur
        objSum.sum_earnings_cop += this.dataset[i].sum_earnings_cop
        objSum.sum_earnings_others += this.dataset[i].sum_earnings_others
        objSum.sum_earnings_discounts += this.dataset[i].sum_earnings_discounts
        objSum.sum_earnings_net += this.dataset[i].sum_earnings_net
        objSum.sum_earnings_rtefte += this.dataset[i].sum_earnings_rtefte
        objSum.sum_earnings_total += this.dataset[i].sum_earnings_total
        sumEarningsHoursArr.push(this.dataset[i].sum_earnings_time)
      }
      // let sumEarningsHoursArr = ['01:24:34', '12:44:43']
      objSum.sum_earnings_time = this.sumHoursArray(sumEarningsHoursArr)
      return objSum
    }
  },
  created () {
    this.sUser = this.decryptSession('user')
    this.getSelects()
  },
  methods: {
    async getSelects () {
      var response

      // get studios
      this.getStudios()

      // studios_shifts
      this.studios_shifts = []
      // this.studios_shifts.push({
      //   label: '',
      //   value: '',
      // })
      // async
      response = await StudioShiftService.getStudiosShiftsDistinct({ token: this.decryptSession('token') })
      for (var u = 0; u < response.data.data.length; u++) {
        this.studios_shifts.push({
          label: response.data.data[u].stdshift_name,
          value: response.data.data[u].stdshift_name,
        })
      }

      // periods
      this.periods = []
      // async
      response = await PeriodService.getPeriodsLimited({ token: this.decryptSession('token') })
      for (var u = 0; u < response.data.data.length; u++) {
        this.periods.push({
          label: 'Periodo desde ' + response.data.data[u].period_start_date + ' hasta ' + response.data.data[u].period_end_date,
          since: response.data.data[u].period_start_date,
          until: response.data.data[u].period_end_date,
          state: response.data.data[u].period_state,
          value: response.data.data[u].period_id
        })
      }
      if (this.periods.length > 0) {
        this.report.report_period = this.periods[0]
        this.periodChanged()

        // Si es modelo ejecuta el periodo actual
        if (this.sUser.prof_id == 4 || this.sUser.prof_id == 5) {
          this.onSubmit()
        }
      }
    },
    async getStudios () {
      var response
      // studios
      this.studios = []
      this.studios.push({ label: 'TODOS', value: '', ally_master_pays: true })
      this.report.std_id = { label: 'TODOS', value: '', ally_master_pays: true }
      // query
      let query = ''

      // Si es un perfil de master >> consulta solo los que se pagan por master
      // 1: ADMIN
      // 3: GESTOR
      // 6: CREADOR CUENTAS
      // 11: CONTABILIDAD
      if ([1, 3, 6, 11].includes(this.sUser.prof_id)) {
        query += 'std_ally_master_pays=true'
      }

      if (this.report.std_active && this.report.std_active.value) {
        query += '&std_active=' + this.report.std_active.value
      }
      // async
      response = await StudioService.getStudios({ query: query, token: this.decryptSession('token') })
      for (var u = 0; u < response.data.data.length; u++) {
        this.studios.push({
          label: response.data.data[u].std_name,
          value: response.data.data[u].std_id,
          ally_master_pays: response.data.data[u].std_ally_master_pays,
        })
      }

      // Valida si solo posee acceso a un estudio para preseleccionarlo
      // length == 2: La opcion TODOS + el unico estudio al que tiene acceso
      if (this.studios.length == 2) {
        this.report.std_id = this.studios[1]
        this.studios = [this.studios[1]]
      }
    },
    async onSubmit () {
      if (!this.report.bank) {
        this.alert('warning', 'Debe seleccionar un formato de banco')
        return false
      }

      try {
        this.activateLoading('Cargando')
        let query = (this.isSubgrid) ? this.parentField + '=' + this.parentId : ''
        query += '&report_since=' + this.report.report_period.since + '&report_until=' + this.report.report_period.until

        if (this.report.std_active && this.report.std_active.value) {
          query += '&std_active=' + this.report.std_active.value
        }
        if (this.report.std_id && this.report.std_id.value) {
          query += '&std_id=' + this.report.std_id.value
        }
        if (this.report.std_ally_master_pays && this.report.std_ally_master_pays.value) {
          query += '&std_ally_master_pays=' + this.report.std_ally_master_pays.value
        }
        if (this.report.destiny_banks.length > 0) {
          for (var i = 0; i < this.report.destiny_banks.length; i++) {
            query += '&report_destiny_banks[]=' + this.report.destiny_banks[i].value
          }
        }
        if (this.report.apps.length > 0) {
          for (var i = 0; i < this.report.apps.length; i++) {
            query += '&report_apps[]=' + this.report.apps[i].value
          }
        }
        if (this.report.shifts.length > 0) {
          for (var i = 0; i < this.report.shifts.length; i++) {
            query += '&report_shifts[]=' + this.report.shifts[i].value
          }
        }
        if (this.report.orderBy.value) {
          query += '&orderBy=' + this.report.orderBy.value
        }
        var response = await LiquidationService.getStudiosLiquidation({ query: query, token: this.decryptSession('token') })
        this.dataset = response.data.data
        this.summary = response.data.summary
        this.disableLoading()
      } catch (error) {
        this.errorsAlerts(error)
        this.disableLoading()
      }
    },
    downloadLiquidationPdf (idStudio) {
      // download
      var url = this.getApiUrl('/api/liquidations/studios/pdf/' + idStudio + '?access_token=' + this.decryptSession('token') + '&report_since=' + this.report.report_period.since + '&report_until=' + this.report.report_period.until + '&tz=' + (Intl.DateTimeFormat().resolvedOptions().timeZone) + '&tzo=' + new Date().getTimezoneOffset())
      var win = window.open(url, '_blank')
      win.focus()
    },
    downloadCertificationPdf (idStudio) {
      // download
      var url = this.getApiUrl('/api/liquidations/studios/certification/pdf/' + idStudio + '?access_token=' + this.decryptSession('token') + '&report_since=' + this.report.report_period.since + '&report_until=' + this.report.report_period.until + '&tz=' + (Intl.DateTimeFormat().resolvedOptions().timeZone) + '&tzo=' + new Date().getTimezoneOffset())
      var win = window.open(url, '_blank')
      win.focus()
    },
    downloadPaymentNotePdf (idStudio) {
      // download
      var url = this.getApiUrl('/api/liquidations/studios/payment_note/pdf/' + idStudio + '?access_token=' + this.decryptSession('token') + '&report_since=' + this.report.report_period.since + '&report_until=' + this.report.report_period.until + '&tz=' + (Intl.DateTimeFormat().resolvedOptions().timeZone) + '&tzo=' + new Date().getTimezoneOffset())
      var win = window.open(url, '_blank')
      win.focus()
    },
    liquidationExport() {
      let query = (this.isSubgrid) ? this.parentField + '=' + this.parentId : ''
      query += '&report_since=' + this.report.report_period.since + '&report_until=' + this.report.report_period.until
      if (this.report.std_id && this.report.std_id.value) {
        query += '&std_id=' + this.report.std_id.value
      }
      if (this.report.bank) {
        query += '&bank=' + this.report.bank
      }
      if (this.report.destiny_banks.length > 0) {
        for (var i = 0; i < this.report.destiny_banks.length; i++) {
          query += '&report_destiny_banks[]=' + this.report.destiny_banks[i].value
        }
      }
      if (this.report.apps.length > 0) {
        this.alert('warning', 'No puede generar pago si posee filtro de Plataformas')
        return false
      }
      if (this.selectedRows.length > 0) {
        for (var i = 0; i < this.selectedRows.length; i++) {
          query += '&std_ids[]=' + this.selectedRows[i].std_id
        }
      }
      if (this.report.orderBy.value) {
        query += '&orderBy=' + this.report.orderBy.value
      }
      // download
      var url = this.getApiUrl('/api/liquidations/studios/export?access_token=' + this.decryptSession('token') + '&' + query)
      var win = window.open(url, '_blank')
      win.focus()
    },
    downloadPaymentPlain() {
      this.$q.dialog({
        title: 'Confirmar',
        message: 'Los registros quedaran marcados como ya pagos ¿Estás seguro de generar el archivo de pago?',
        cancel: 'Cancelar',
        ok: 'Aceptar',
        persistent: true
      }).onOk(() => {
        let query = (this.isSubgrid) ? this.parentField + '=' + this.parentId : ''
        query += '&report_since=' + this.report.report_period.since + '&report_until=' + this.report.report_period.until
        if (this.report.std_id && this.report.std_id.value) {
          query += '&std_id=' + this.report.std_id.value
        }
        if (this.report.bank) {
          query += '&bank=' + this.report.bank
        }
        if (this.report.destiny_banks.length > 0) {
          for (var i = 0; i < this.report.destiny_banks.length; i++) {
            query += '&report_destiny_banks[]=' + this.report.destiny_banks[i].value
          }
        }
        if (this.report.apps.length > 0) {
          this.alert('warning', 'No puede generar pago si posee filtro de Plataformas')
          return false
        }
        if (this.selectedRows.length > 0) {
          for (var i = 0; i < this.selectedRows.length; i++) {
            query += '&std_ids[]=' + this.selectedRows[i].std_id
          }
        }
        // download
        var url = this.getApiUrl('/api/liquidations/studios/payment_plain?access_token=' + this.decryptSession('token') + '&' + query)
        var win = window.open(url, '_blank')
        win.focus()

        // reload info
        this.onSubmit()
      }).onCancel(() => {
        // console.log('>>>> Cancel')
      })
    },
    openSubgridForm (mode, payments) {
      this.dialogMode = mode
      this.dialogPayments = payments
      this.dialog = true
    },
    handleSelection ({ rows, added, evt }) {
      // ignore selection change from header of not from a direct click event
      if (rows.length !== 1 || evt === void 0) {
        return
      }

      const oldSelectedRow = this.storedSelectedRow
      const [newSelectedRow] = rows
      const { ctrlKey, shiftKey } = evt

      if (shiftKey !== true) {
        this.storedSelectedRow = newSelectedRow
      }

      // wait for the default selection to be performed
      nextTick(() => {
        if (shiftKey === true) {
          const tableRows = this.$refs.tableRef.filteredSortedRows
          let firstIndex = tableRows.indexOf(oldSelectedRow)
          let lastIndex = tableRows.indexOf(newSelectedRow)

          if (firstIndex < 0) {
            firstIndex = 0
          }

          if (firstIndex > lastIndex) {
            [ firstIndex, lastIndex ] = [ lastIndex, firstIndex ]
          }

          const rangeRows = tableRows.slice(firstIndex, lastIndex + 1)
          // we need the original row object so we can match them against the rows in range
          const selectedRowsRaw = this.selectedRows.map(toRaw)

          this.selectedRows = added === true
            ? selectedRowsRaw.concat(rangeRows.filter(row => selectedRowsRaw.includes(row) === false))
            : selectedRowsRaw.filter(row => rangeRows.includes(row) === false)
        }
        else if (ctrlKey !== true && added === true) {
          this.selectedRows = [newSelectedRow]
        }
      })
    },
    periodChanged () {
      this.submitBtnLabel = (this.report.report_period.state === 'ABIERTO') ? 'Liquidar' : 'Consultar'
    },
    sumHoursArray (hoursArr) { // suma un arreglo de horas con formato "00:00:00" y devuelve el resultado
      let totalHours = 0;
      let totalMinutes = 0;
      let totalSeconds = 0;

      hoursArr.forEach(hourE => {
        const [h, m, s] = hourE.split(':').map(Number);
        totalHours += h;
        totalMinutes += m;
        totalSeconds += s;
      });

      // Manejar los desbordamientos de segundos
      if (totalSeconds >= 60) {
        totalMinutes += Math.floor(totalSeconds / 60);
        totalSeconds = totalSeconds % 60;
      }

      // Manejar los desbordamientos de minutos
      if (totalMinutes >= 60) {
        totalHours += Math.floor(totalMinutes / 60);
        totalMinutes = totalMinutes % 60;
      }

      // Formatear el resultado en "hh:mm:ss"
      const hours = String(totalHours).padStart(2, '0');
      const minutes = String(totalMinutes).padStart(2, '0');
      const seconds = String(totalSeconds).padStart(2, '0');

      return `${hours}:${minutes}:${seconds}`;
    },
	downloadResumenPdf() {
      let query = ''
      query += '&report_since=' + this.report.report_period.since + '&report_until=' + this.report.report_period.until

      if (this.report.std_active && this.report.std_active.value) {
        query += '&std_active=' + this.report.std_active.value
      }
      if (this.report.std_id && this.report.std_id.value) {
        query += '&std_id=' + this.report.std_id.value
      }
      if (this.report.std_ally_master_pays && this.report.std_ally_master_pays.value) {
        query += '&std_ally_master_pays=' + this.report.std_ally_master_pays.value
      }
      if (this.report.destiny_banks.length > 0) {
        for (var i = 0; i < this.report.destiny_banks.length; i++) {
          query += '&report_destiny_banks[]=' + this.report.destiny_banks[i].value
        }
      }
      if (this.report.apps.length > 0) {
        for (var i = 0; i < this.report.apps.length; i++) {
          query += '&report_apps[]=' + this.report.apps[i].value
        }
      }
      if (this.report.shifts.length > 0) {
        for (var i = 0; i < this.report.shifts.length; i++) {
          query += '&report_shifts[]=' + this.report.shifts[i].value
        }
      }
      if (this.report.orderBy.value) {
        query += '&orderBy=' + this.report.orderBy.value
      }

      // download
      var url = this.getApiUrl('/liquidation/studios/summary-pdf?' + query.substring(1))
      var win = window.open(url, '_blank')
      win.focus()
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
    background-color: #dadada;
  }

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

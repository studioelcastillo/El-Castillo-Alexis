<template>
  <div class="q-pa-md">
    <!-- <div class="row">
      <div class="col"></div>
      <div class="col-12">
        <q-card flat bordered class="my-card bg-primary text-black">
          <q-card-section>
            <div class="q-pa-md q-gutter-sm text-white">
              <h4 v-if="$q.screen.lt.sm"><b class="text-accent">Hola, {{ sUser.user_name.toUpperCase() }}.</b></h4>
              <h3 v-else><b class="text-accent">Hola, {{ sUser.user_name.toUpperCase() }}.</b></h3>
              <h5 class="subtitle">
                ¡Bienvenid@ al portal de <b class="text-accent">El Castillo</b>!
              </h5>
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col">
      </div>
    </div>
    <br> -->
    <div v-if="loader" class="q-pa-md q-gutter-xs">
      <div class="q-gutter-md row justify-center" style="font-size: 2em">
        <q-spinner-facebook color="secondary" size="2em"/>
      </div>
    </div>
    <div v-else>
      <div v-if="openGate('charts-dashboard', sUser.prof_id)" class="row">
        <div class="col-md-12 col-xs-12">
          <q-card flat bordered class="my-card">
            <q-card-section>
              <div class="row q-col-gutter-sm" style="display: flex; justify-content: center;">
                <div class="col-xs-12 col-sm-6">
                  <q-select
                    filled
                    v-model="report.period"
                    label="Periodo"
                    label-color="primary"
                    :options="periods"
                    lazy-rules
                    :rules="[
                      val => !!val.value || 'Este campo es requerido',
                    ]"
                    @update:model-value="getCharts(); getIndicators();"
                  />
                </div>

                <div v-if="[1,11].includes(sUser.prof_id)" class="col-xs-12 col-sm-4">
                  <q-select
                    filled
                    v-model="report.std_id"
                    label="Estudio"
                    label-color="primary"
                    :options="studios"
                    lazy-rules
                    :rules="[
                    ]"
                    @update:model-value="getCharts(); getIndicators();"
                  />
                  <br>
                </div>
                <div v-if="[7].includes(sUser.prof_id)" class="col-xs-12 col-sm-4">
                  <q-select
                    filled
                    v-model="monitor"
                    label="Monitor"
                    label-color="primary"
                    :options="monitors"
                    lazy-rules
                    @update:model-value="getCharts(); getIndicators();"
                  />
                  <br>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
      <br>

      <!-- indicadores -->
      <div v-if="openGate('indicators-dashboard', sUser.prof_id)" class="row">
        <div v-if="[1,2,3,4,5,11].includes(sUser.prof_id)" class="col-md-12 col-xs-12">
          <q-card flat bordered class="my-card" style="overflow-y: auto;">
            <q-card-section class="bg-black text-white">
              <div class="text-h5 text-weight-bolder">
                Tasa de cambio {{(indicatorsList.trm) ? '(' + indicatorsList.trm.date + ')' : ''}}
              </div>
            </q-card-section>

            <div class="row">
              <div class="col-md-12 col-xs-12">
                <div class="row">
                  <q-card v-if="[1,2,3,4,5,11].includes(sUser.prof_id)" flat bordered class="col-md-6 col-xs-12 bg-grey-1" :class="[1,2,3,4,5,11].includes(sUser.prof_id) ? {} : 'col-md-12'">
                    <q-card-section class="text-center bg-white">
                      <h6 class="is-size-3"><small>Tasa USD a COP</small></h6>
                    </q-card-section>
                    <q-separator />
                    <!-- notice "border-radius-inherit" below; it's important when in a QCard -->
                    <q-card-section class="border-radius-inherit flex flex-center bg-grey-1">
                      <div><h4><small>$ {{ (indicatorsList.trm) ? miles(indicatorsList.trm.usd) : 0 }}</small></h4></div>
                    </q-card-section>
                  </q-card>

                  <q-card v-if="[1,2,3,4,5,11].includes(sUser.prof_id)" flat bordered class="col-md-6 col-xs-12 bg-grey-1" :class="[1,2,3,4,5,11].includes(sUser.prof_id) ? {} : 'col-md-12'">
                    <q-card-section class="text-center bg-white">
                      <h6 class="is-size-3"><small>Tasa EUR a COP</small></h6>
                    </q-card-section>
                    <q-separator />
                    <!-- notice "border-radius-inherit" below; it's important when in a QCard -->
                    <q-card-section class="border-radius-inherit flex flex-center bg-grey-1">
                      <div><h4><small>$ {{ (indicatorsList.trm) ? miles(indicatorsList.trm.eur) : 0 }}</small></h4></div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </div>
          </q-card>
          <br>
        </div>

        <div class="col-md-12 col-xs-12">
          <q-card flat bordered class="my-card" style="overflow-y: auto;">
            <q-card-section>
              <div class="text-h5 text-weight-bolder">
                Indicadores <!-- <a class="text-green" style="cursor: pointer;" @click="goToRole('admin/user/new')"> <q-icon name="add_box"/> </a> -->
              </div>
            </q-card-section>

            <div class="row">
              <!-- avatar -->
              <div bordered class="col-md-3 col-xs-12">
                <q-card flat bordered class="col-md-4 col-xs-6 bg-grey-1" style="height: 100%">
                  <q-card-section class="text-center bg-white" style="height: 100%">
                    <div style="display: flex; width: 100%; justify-content: center">
                      <div
                        class="my-card text-white"
                        style="height: 16rem; width: 16rem; justify-content: center; align-items: end; border-radius: 500px; overflow: auto; border: 1px solid grey;"
                        :style="{
                          backgroundImage: 'url(' + ((imageUrl === '') ? '' : imageUrl) + ')',
                          backgroundSize: ([4,5].includes(sUser.prof_id)) ? 'cover' : 'contain',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                          cursor: (mode == 'create' || mode == 'edit') ? 'pointer' : 'inherit'
                        }"
                      >
                      </div>
                    </div>
                    <br>
                    <h5 v-if="[4,5].includes(sUser.prof_id)">{{sUser.user_name}} {{sUser.user_surname}}</h5>
                    <h5 v-else-if="[2].includes(sUser.prof_id)">{{studioData.std_name}}</h5>
                    <h5 v-else>EL CASTILLO GROUP SAS</h5>
                  </q-card-section>
                  <!-- <q-separator /> -->
                </q-card>
              </div>
              
              <!-- indicadores -->
              <div class="col-md-9 col-xs-12">
                <q-card v-if="[6].includes(sUser.prof_id)" flat bordered class="col-md-12 col-xs-12 bg-grey-1" style="height: 100%;">
                  <q-card-section class="text-center bg-white">
                    <h6 class="is-size-3">🍰 <small>Próximos cumpleaños</small> 🍰</h6>
                  </q-card-section>
                  <q-separator />
                  <!-- notice "border-radius-inherit" below; it's important when in a QCard -->
                  <q-card-section class="border-radius-inherit flex flex-center bg-grey-1" style="height: 80%;">
                    <div style="display: flex; flex-direction: column;">
                      <table class="q-pl-md">
                        <tr v-for="(model, index) in indicatorsList.next_happy_birthdays" v-bind:key="index">
                          <td>{{model.user_birthdate}}</td>
                          <td class="q-pl-md">{{model.user_name}} {{model.user_surname}}</td>
                        </tr>
                      </table>
                    </div>
                  </q-card-section>
                </q-card>
                <div v-else class="row">
                  <q-card flat bordered class="col-md-4 col-xs-12 bg-grey-1" :class="[1,2,3,11].includes(sUser.prof_id) ? {} : 'col-md-12'">
                    <q-card-section class="text-center bg-white">
                      <h6 class="is-size-3"><small>Ganancia en (USD)</small></h6>
                    </q-card-section>
                    <q-separator />
                    <!-- notice "border-radius-inherit" below; it's important when in a QCard -->
                    <q-card-section class="border-radius-inherit flex flex-center">
                      <div><h4><small>$ {{ miles(indicatorsList.sum_earnings_usd) }}</small></h4></div>
                      <!-- <a class="text-green" style="cursor: pointer;"><q-icon size="md" name="trending_up"/></a> -->
                    </q-card-section>
                  </q-card>

                  <q-card flat bordered class="col-md-4 col-xs-12 bg-grey-1" :class="[1,2,3,11].includes(sUser.prof_id) ? {} : 'col-md-12'">
                    <q-card-section class="text-center bg-white">
                      <h6 class="is-size-3"><small>Ganancia en (EUR)</small></h6>
                    </q-card-section>
                    <q-separator />
                    <!-- notice "border-radius-inherit" below; it's important when in a QCard -->
                    <q-card-section class="border-radius-inherit flex flex-center bg-grey-1">
                      <div><h4><small>$ {{ miles(indicatorsList.sum_earnings_eur) }}</small></h4></div>
                    </q-card-section>
                  </q-card>

                  <q-card flat bordered class="col-md-4 col-xs-12 bg-grey-1" :class="[1,2,3,11].includes(sUser.prof_id) ? {} : 'col-md-12'">
                    <q-card-section class="text-center bg-white">
                      <h6 class="is-size-3"><small>Ganancia en (COP)</small></h6>
                    </q-card-section>
                    <q-separator />
                    <!-- notice "border-radius-inherit" below; it's important when in a QCard -->
                    <q-card-section class="border-radius-inherit flex flex-center bg-grey-1">
                      <div><h4><small>$ {{ miles(indicatorsList.sum_earnings_cop)  }}</small></h4></div>
                      <!-- <a class="text-green" style="cursor: pointer;"><q-icon size="md" name="trending_up"/></a> -->
                    </q-card-section>
                  </q-card>

                  <q-card v-if="[1,2,3,11].includes(sUser.prof_id)" flat bordered class="col-md-4 col-xs-12 bg-grey-1">
                    <q-card-section class="text-center bg-white">
                      <h6 class="is-size-3"><small>Estudios</small></h6>
                    </q-card-section>
                    <q-separator />
                    <!-- notice "border-radius-inherit" below; it's important when in a QCard -->
                    <q-card-section class="border-radius-inherit flex flex-center">
                      <div><h4><small>{{ miles(indicatorsList.sum_studios) }}</small></h4></div>
                    </q-card-section>
                  </q-card>

                  <q-card v-if="[1,2,3,11].includes(sUser.prof_id)" flat bordered class="col-md-4 col-xs-12 bg-grey-1">
                    <q-card-section class="text-center bg-white">
                      <h6 class="is-size-3"><small>Modelos</small></h6>
                    </q-card-section>
                    <q-separator />
                    <!-- notice "border-radius-inherit" below; it's important when in a QCard -->
                    <q-card-section class="border-radius-inherit flex flex-center bg-grey-1">
                      <div><h4><small>{{ miles(indicatorsList.sum_studio_models) }}</small></h4></div>
                    </q-card-section>
                  </q-card>

                  <q-card v-if="[1,2,3,11].includes(sUser.prof_id)" flat bordered class="col-md-4 col-xs-12 bg-grey-1">
                    <q-card-section class="text-center bg-white">
                      <h6 class="is-size-3"><small>Cuartos (% de ocupación)</small></h6>
                    </q-card-section>
                    <q-separator />
                    <!-- notice "border-radius-inherit" below; it's important when in a QCard -->
                    <q-card-section class="border-radius-inherit flex flex-center bg-grey-1">
                      <div><h4><small>{{ miles(indicatorsList.n_room) }} ({{ miles((indicatorsList.room_busy / indicatorsList.n_room) * 100) }}%)</small></h4></div>
                      <!-- <a class="text-red" style="cursor: pointer;"><q-icon size="md" name="trending_down"/></a> -->
                    </q-card-section>
                  </q-card>

                  <q-card v-if="[1,2,3,7,8,11].includes(sUser.prof_id)" flat bordered class="col-md-6 col-xs-12 bg-grey-1">
                    <q-card-section class="text-center bg-white">
                      <h6 class="is-size-3">🥇 <small>Top modelos</small> 🥇</h6>
                    </q-card-section>
                    <q-separator />
                    <!-- notice "border-radius-inherit" below; it's important when in a QCard -->
                    <q-card-section class="border-radius-inherit flex flex-center bg-grey-1">
                      <div style="display: flex; flex-direction: column;">
                        <div v-for="(model, index) in indicatorsList.top_models" v-bind:key="index">
                          <div style="display: inline-block; text-align: center; width: 30px;">
                            <b>{{index + 1}}</b>
                          </div>
                          <div style="display: inline-block;">
                            {{model.user_name}} {{model.user_surname}}
                          </div>
                        </div>
                      </div>
                    </q-card-section>
                  </q-card>

                  <q-card v-if="[1,2,3,7,8,11].includes(sUser.prof_id)" flat bordered class="col-md-6 col-xs-12 bg-grey-1">
                    <q-card-section class="text-center bg-white">
                      <h6 class="is-size-3">🍰 <small>Próximos cumpleaños</small> 🍰</h6>
                    </q-card-section>
                    <q-separator />
                    <!-- notice "border-radius-inherit" below; it's important when in a QCard -->
                    <q-card-section class="border-radius-inherit flex flex-center bg-grey-1">
                      <div style="display: flex; flex-direction: column;">
                        <table class="q-pl-md">
                          <tr v-for="(model, index) in indicatorsList.next_happy_birthdays" v-bind:key="index">
                            <td>{{model.user_birthdate}}</td>
                            <td class="q-pl-md">{{model.user_name}} {{model.user_surname}}</td>
                          </tr>
                        </table>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </div>
          </q-card>
        </div>
      </div>
      <br>

      <!-- model goals -->
      <div v-if="[4,5].includes(sUser.prof_id)" style="align-content: center; text-align: center;">
        <div class="col-md-12 col-xs-12">
          <q-card flat bordered class="my-card">
            <!-- {{modelGoalsTable.dataset}} -->
            <!-- totals -->
            <q-card-section>
              <div class="row" style="display: flex; justify-content: center; gap: 10px;">
                <q-card flat bordered class="col-md-12 col-xs-6 bg-white text-black">
                  <q-card-section class="text-center bg-primary text-white">
                    <h6 class="is-size-3">
                      <small v-if="modelGoalsTable.dataset && modelGoalsTable.dataset[0] && modelGoalsTable.dataset[0].stdmod_commission_type == 'SATELITE'">Metas</small>
                      <small v-else>Ganancia / Meta</small>
                    </h6>
                  </q-card-section>
                  <q-separator />
                  <q-card-section class="border-radius-inherit flex flex-center">
                    <div v-if="modelGoalsTable.dataset && modelGoalsTable.dataset[0] && modelGoalsTable.dataset[0].stdmod_commission_type == 'SATELITE'"><h4>
                      <small>
                        Ganancia actual: ${{ miles((modelGoalsTable.dataset && modelGoalsTable.dataset[0]) ? modelGoalsTable.dataset[0].sum_earnings : 0) }}
                        <span v-if="modelGoalsTable.dataset && modelGoalsTable.dataset[0] && modelGoalsTable.dataset[0].sum_earnings > modelGoalsTable.dataset[0].sum_goal">✅</span>
                      </small>
                    </h4></div>
                    <div v-else><h4>
                      <small>
                        ${{ miles((modelGoalsTable.dataset && modelGoalsTable.dataset[0]) ? modelGoalsTable.dataset[0].sum_earnings : 0) }}
                        / ${{ miles((modelGoalsTable.dataset && modelGoalsTable.dataset[0]) ? modelGoalsTable.dataset[0].sum_goal : 0) }}
                        <span v-if="modelGoalsTable.dataset && modelGoalsTable.dataset[0] && modelGoalsTable.dataset[0].sum_earnings > modelGoalsTable.dataset[0].sum_goal">✅</span>
                      </small>
                    </h4></div>
                  </q-card-section>

                  <!-- progress SATELITE -->
                  <q-card-section v-if="modelGoalsTable.dataset && modelGoalsTable.dataset[0] && modelGoalsTable.dataset[0].stdmod_commission_type == 'SATELITE'" class="border-radius-inherit flex flex-center">
                    <div v-if="modelGoalsTable.dataset[0].goals" class="row" style="width: 100%; display: flex; justify-content: center;">
                      <div v-for="(goal, index) in modelGoalsTable.dataset[0].goals" v-bind:key="index" class="col-sm">
                        <!-- {{goal}} -->
                        <q-card flat class="col-md-12 col-xs-6 text-black" style="border-right: 1px dotted black; border-radius: 0px;">
                          <q-card-section v-if="goal.until" class="text-right text-black">
                            {{goal.until + 1}}
                            <span v-if="(goal.until + 1) < modelGoalsTable.dataset[0].sum_earnings">✅</span>
                          </q-card-section>
                          <q-card-section v-else class="text-right text-black">
                            > {{goal.since}}
                            <span v-if="(goal.since + 1) < modelGoalsTable.dataset[0].sum_earnings">✅</span>
                          </q-card-section>
                        </q-card>
                        <!-- until -->
                        <q-linear-progress
                          v-if="goal.until"
                          size="25px"
                          :value="(goal.since < modelGoalsTable.dataset[0].sum_earnings) ? modelGoalsTable.dataset[0].sum_earnings / (goal.until + 1) : 0"
                          :color="getExecutionColor(((goal.until + 1) != 0) ? modelGoalsTable.dataset[0].sum_earnings / (goal.until + 1) * 100 : 0)"
                          stripe
                        >
                          <div class="absolute-full flex flex-center">
                            <q-badge
                              v-if="(goal.until + 1) > modelGoalsTable.dataset[0].sum_earnings && goal.since < modelGoalsTable.dataset[0].sum_earnings"
                              color="white"
                              :text-color="getExecutionColor(((goal.until + 1) != 0) ? modelGoalsTable.dataset[0].sum_earnings / (goal.until + 1) * 100 : 0)"
                              :label="((goal.until + 1) != 0) ? miles(modelGoalsTable.dataset[0].sum_earnings / (goal.until + 1) * 100) + '%' : '0%'"
                            />
                          </div>
                        </q-linear-progress>
                        <!-- greater than -->
                        <q-linear-progress
                          v-else
                          size="25px"
                          :value="(goal.since < modelGoalsTable.dataset[0].sum_earnings) ? modelGoalsTable.dataset[0].sum_earnings / (goal.since) : 0"
                          :color="getExecutionColor(((goal.since) != 0) ? modelGoalsTable.dataset[0].sum_earnings / (goal.since) * 100 : 0)"
                          stripe
                        >
                          <div class="absolute-full flex flex-center">
                            <q-badge
                              v-if="(goal.since < modelGoalsTable.dataset[0].sum_earnings)"
                              color="white"
                              :text-color="getExecutionColor(((goal.since) != 0) ? modelGoalsTable.dataset[0].sum_earnings / (goal.since) * 100 : 0)"
                              :label="((goal.since) != 0) ? miles(modelGoalsTable.dataset[0].sum_earnings / (goal.since) * 100) + '%' : '0%'"
                            />
                          </div>
                        </q-linear-progress>
                      </div>
                    </div>
                    <div v-else class="row" style="display: flex; justify-content: center; gap: 10px">
                      <div class="col-sm">
                        <q-linear-progress
                          size="25px"
                          :value="0"
                          stripe
                        >
                          <div class="absolute-full flex flex-center">
                            <q-badge color="white" :text-color="getExecutionColor(0)" :label="miles(0) + '%'" />
                          </div>
                        </q-linear-progress>
                      </div>
                    </div>
                  </q-card-section>

                  <!-- progress PRESENCIAL -->
                  <q-card-section v-else class="border-radius-inherit flex flex-center">
                    <q-linear-progress
                      v-if="modelGoalsTable.dataset && modelGoalsTable.dataset[0]"
                      size="25px"
                      :value="modelGoalsTable.dataset[0].sum_earnings / modelGoalsTable.dataset[0].sum_goal" :color="getExecutionColor((modelGoalsTable.dataset[0].sum_goal != 0) ? modelGoalsTable.dataset[0].sum_earnings / modelGoalsTable.dataset[0].sum_goal * 100 : 0)"
                      stripe
                    >
                      <div class="absolute-full flex flex-center">
                        <q-badge color="white" :text-color="getExecutionColor((modelGoalsTable.dataset[0].sum_goal != 0) ? modelGoalsTable.dataset[0].sum_earnings / modelGoalsTable.dataset[0].sum_goal * 100 : 0)" :label="(modelGoalsTable.dataset[0].sum_goal != 0) ? miles(modelGoalsTable.dataset[0].sum_earnings / modelGoalsTable.dataset[0].sum_goal * 100) + '%' : '0%'" />
                      </div>
                    </q-linear-progress>
                    <q-linear-progress
                      v-else
                      size="25px"
                      :value="0"
                      stripe
                    >
                      <div class="absolute-full flex flex-center">
                        <q-badge color="white" :text-color="getExecutionColor(0)" :label="miles(0) + '%'" />
                      </div>
                    </q-linear-progress>
                  </q-card-section>
                </q-card>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
      <br v-if="[4,5].includes(sUser.prof_id)">

      <!-- studio goals -->
      <div v-if="[2].includes(sUser.prof_id)" style="align-content: center; text-align: center;">
        <div class="col-md-12 col-xs-12">
          <q-card flat bordered class="my-card">
            <!-- {{studioGoalsTable.dataset}} -->
            <!-- totals -->
            <q-card-section>
              <div class="row" style="display: flex; justify-content: center; gap: 10px;">
                <q-card flat bordered class="col-md-12 col-xs-6 bg-white text-black">
                  <q-card-section class="text-center bg-primary text-white">
                    <h6 class="is-size-3">
                      <small>Metas</small>
                    </h6>
                  </q-card-section>
                  <q-separator />
                  <q-card-section class="border-radius-inherit flex flex-center">
                    <div v-if="studioGoalsTable.dataset && studioGoalsTable.dataset[0]"><h4>
                      <small>
                        Ganancia actual: ${{ miles((studioGoalsTable.dataset && studioGoalsTable.dataset[0]) ? studioGoalsTable.dataset[0].sum_earnings : 0) }}
                        <span v-if="studioGoalsTable.dataset && studioGoalsTable.dataset[0] && studioGoalsTable.dataset[0].sum_earnings > studioGoalsTable.dataset[0].sum_goal">✅</span>
                      </small>
                    </h4></div>
                  </q-card-section>

                  <!-- progress SATELITE -->
                  <q-card-section v-if="studioGoalsTable.dataset && studioGoalsTable.dataset[0]" class="border-radius-inherit flex flex-center">
                    <div v-if="studioGoalsTable.dataset[0].goals" class="row" style="width: 100%; display: flex; justify-content: center;">
                      <div v-for="(goal, index) in studioGoalsTable.dataset[0].goals" v-bind:key="index" class="col-sm">
                        <!-- {{goal}} -->
                        <q-card flat class="col-md-12 col-xs-6 text-black" style="border-right: 1px dotted black; border-radius: 0px;">
                          <q-card-section v-if="goal.until" class="text-right text-black">
                            {{goal.until + 1}}
                            <span v-if="(goal.until + 1) < studioGoalsTable.dataset[0].sum_earnings">✅</span>
                          </q-card-section>
                          <q-card-section v-else class="text-right text-black">
                            > {{goal.since}}
                            <span v-if="(goal.since + 1) < studioGoalsTable.dataset[0].sum_earnings">✅</span>
                          </q-card-section>
                        </q-card>
                        <!-- until -->
                        <q-linear-progress
                          v-if="goal.until"
                          size="25px"
                          :value="(goal.since < studioGoalsTable.dataset[0].sum_earnings) ? studioGoalsTable.dataset[0].sum_earnings / (goal.until + 1) : 0"
                          :color="getExecutionColor(((goal.until + 1) != 0) ? studioGoalsTable.dataset[0].sum_earnings / (goal.until + 1) * 100 : 0)"
                          stripe
                        >
                          <div class="absolute-full flex flex-center">
                            <q-badge
                              v-if="(goal.until + 1) > studioGoalsTable.dataset[0].sum_earnings && goal.since < studioGoalsTable.dataset[0].sum_earnings"
                              color="white"
                              :text-color="getExecutionColor(((goal.until + 1) != 0) ? studioGoalsTable.dataset[0].sum_earnings / (goal.until + 1) * 100 : 0)"
                              :label="((goal.until + 1) != 0) ? miles(studioGoalsTable.dataset[0].sum_earnings / (goal.until + 1) * 100) + '%' : '0%'"
                            />
                          </div>
                        </q-linear-progress>
                        <!-- greater than -->
                        <q-linear-progress
                          v-else
                          size="25px"
                          :value="(goal.since < studioGoalsTable.dataset[0].sum_earnings) ? studioGoalsTable.dataset[0].sum_earnings / (goal.since) : 0"
                          :color="getExecutionColor(((goal.since) != 0) ? studioGoalsTable.dataset[0].sum_earnings / (goal.since) * 100 : 0)"
                          stripe
                        >
                          <div class="absolute-full flex flex-center">
                            <q-badge
                              v-if="(goal.since < studioGoalsTable.dataset[0].sum_earnings)"
                              color="white"
                              :text-color="getExecutionColor(((goal.since) != 0) ? studioGoalsTable.dataset[0].sum_earnings / (goal.since) * 100 : 0)"
                              :label="((goal.since) != 0) ? miles(studioGoalsTable.dataset[0].sum_earnings / (goal.since) * 100) + '%' : '0%'"
                            />
                          </div>
                        </q-linear-progress>
                      </div>
                    </div>
                    <div v-else class="row" style="display: flex; justify-content: center; gap: 10px">
                      <div class="col-sm">
                        <q-linear-progress
                          size="25px"
                          :value="0"
                          stripe
                        >
                          <div class="absolute-full flex flex-center">
                            <q-badge color="white" :text-color="getExecutionColor(0)" :label="miles(0) + '%'" />
                          </div>
                        </q-linear-progress>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
      <br v-if="[2].includes(sUser.prof_id)">

      <!-- charts -->
      <div class="row" v-if="openGate('charts-dashboard', sUser.prof_id)">
        <div class="col-md-12 col-xs-12">
          <q-card flat bordered class="my-card">
            <q-card-section>
              <highcharts :options="chartOptsStreamEarnings"></highcharts>
            </q-card-section>
          </q-card>
        </div>
      </div>
      <br>

      <!-- <div style="align-content: center; text-align: center;">
        <q-btn class="bg-primary text-white submit1" label="Actualizar datos" @click="populateStreams" />
      </div>
      <br> -->

      <!-- goals -->
      <div v-if="[1,2,3,7,8,11].includes(sUser.prof_id)" style="align-content: center; text-align: center;">
        <q-table
          title="Metas por modelo"
          dense
          :columns="modelGoalsTable.columns"
          :rows="modelGoalsTable.dataset"
          :filter="modelGoalsTable.filter"
          :loading="modelGoalsTable.loading"
          :visible-columns="modelGoalsTable.visibleColumns"
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
          <!-- body -->
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td key="user_identification" :props="props">{{ props.row.user_identification }}</q-td>
              <q-td key="user_name" :props="props">{{ props.row.user_name }}</q-td>
              <q-td key="user_surname" :props="props">{{ props.row.user_surname }}</q-td>
              <q-td key="sum_goal" :props="props">{{ miles(props.row.sum_goal) }}</q-td>
              <q-td key="sum_earnings" :props="props">{{ miles(props.row.sum_earnings) }}</q-td>
              <q-td key="goal_indicator" :props="props">
                <q-linear-progress size="25px" :value="props.row.sum_earnings / props.row.sum_goal" :color="getExecutionColor((props.row.sum_goal != 0) ? props.row.sum_earnings / props.row.sum_goal * 100 : 0)">
                  <div class="absolute-full flex flex-center">
                    <q-badge color="white" :text-color="getExecutionColor((props.row.sum_goal != 0) ? props.row.sum_earnings / props.row.sum_goal * 100 : 0)" :label="(props.row.sum_goal != 0) ? miles(props.row.sum_earnings / props.row.sum_goal * 100) + '%' : '0%'" />
                  </div>
                </q-linear-progress>
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </div>
      <br>

      <hr style="border-color: #e9e9e9;">
      <br>

      <!-- tasks -->
      <div v-if="[1,2,3,6,11].includes(sUser.prof_id)" class="row">
        <div class="col">
        </div>
        <div class="col-md-12 col-xs-12">
          <q-card flat bordered class="my-card" style="overflow-y: auto;height: 500px;">
            <q-card-section>
              <div class="text-h5 text-weight-bolder">
                Tareas <!-- <a class="text-green" style="cursor: pointer;" @click="goToRole('admin/user/new')"> <q-icon name="add_box"/> </a> -->
              </div>
            </q-card-section>

            <q-separator inset />

            <q-list v-if="tasksList.length > 0" bordered class="rounded-borders">
              <!-- <q-item-label header>Google Inbox style</q-item-label> -->
              <div v-for="task in tasksList" :key="task.task_id">
                <q-item>
                  <q-item-section avatar>
                    <q-avatar :icon="task.task_icon" :color="task.task_icon_color" text-color="white" />
                  </q-item-section>

                  <q-item-section>
                    <q-item-label lines="1">
                      <span class="text-weight-medium" v-html="task.task_title"></span>
                      <!-- <span class="text-grey-8"> - GitHub repository</span> -->
                    </q-item-label>
                    <q-item-label caption>
                      <span v-html="task.task_description"></span>
                    </q-item-label>
                  </q-item-section>

                  <q-item-section side>
                    <div v-if="task.task_type === 'AVAILABLE_ROOM'" class="text-grey-8 q-gutter-xs">
                      <q-btn size="12px" round icon="edit" color="dark-page" text-color="dark-page" @click="goTo('studios/edit/' + task.task_key_id)"/>
                    </div>
                    <div v-if="task.task_type === 'MISSING_BANK_INFO'" class="text-grey-8 q-gutter-xs">
                      <q-btn size="12px" round icon="edit" color="dark-page" text-color="dark-page" @click="goTo('users/edit/' + task.task_key_id)"/>
                    </div>
                    <div v-if="task.task_type === 'PETITIONS'" class="text-grey-8 q-gutter-xs">
                      <q-btn size="12px" round icon="edit" color="dark-page" text-color="dark-page" @click="goTo('petitions/edit/' + task.task_key_id)"/>
                    </div>
                    <div v-if="task.task_type === 'BIRTHDAYS'" class="text-grey-8 q-gutter-xs">
                      <q-btn size="12px" round icon="edit" color="dark-page" text-color="dark-page" @click="goTo('users/edit/' + task.task_key_id)"/>
                    </div>
                    <div v-if="task.task_type === 'DOCUMENTS_MISSING'" class="text-grey-8 q-gutter-xs">
                      <q-btn size="12px" round icon="edit" color="dark-page" text-color="dark-page" @click="goTo('users/edit/' + task.task_key_id)"/>
                    </div>
                    <div v-if="task.task_type === 'CONTRACTS'" class="text-grey-8 q-gutter-xs">
                      <q-btn size="12px" round icon="edit" color="dark-page" text-color="dark-page" @click="goTo('users/edit/' + task.task_key_id)"/>
                    </div>
                  </q-item-section>
                </q-item>

                <q-separator spaced />
              </div>
            </q-list>
            <q-list v-else bordered class="rounded-borders primary">
              <!-- <q-item-label header>Tareas</q-item-label> -->
              <q-item>
                <q-item-section avatar>
                  <q-avatar icon="sentiment_very_satisfied" color="primary" text-color="white" />
                </q-item-section>

                <q-item-section>
                  <center>
                    <q-item-label lines="1">
                      <span class="text-weight-medium text-primary">¡Has finalizado todas las tareas!</span>
                      <!-- <span class="text-grey-8"> - GitHub repository</span> -->
                    </q-item-label>
                  </center>
                </q-item-section>

                <q-item-section avatar>
                  <q-avatar icon="done_all" color="primary" text-color="white" />
                </q-item-section>
              </q-item>

              <q-separator />

              <center v-if="taskCompletedImageIndex >= 0">
                <q-avatar style="height: 300px; width: 310px; margin-top: 30px;">
                  <!-- <img v-if="taskCompletedImageIndex === 0" src="~assets/task_completed/bear.png" width="100%" style="opacity: 0.6">
                  <img v-if="taskCompletedImageIndex === 1" src="~assets/task_completed/cat.png" width="100%" style="opacity: 0.6">
                  <img v-if="taskCompletedImageIndex === 2" src="~assets/task_completed/dog.png" width="100%" style="opacity: 0.6">
                  <img v-if="taskCompletedImageIndex === 3" src="~assets/task_completed/draco.png" width="100%" style="opacity: 0.6">
                  <img v-if="taskCompletedImageIndex === 4" src="~assets/task_completed/fox.png" width="100%" style="opacity: 0.6">
                  <img v-if="taskCompletedImageIndex === 5" src="~assets/task_completed/panda.png" width="100%" style="opacity: 0.6">
                  <img v-if="taskCompletedImageIndex === 6" src="~assets/task_completed/pig.png" width="100%" style="opacity: 0.6"> -->
                </q-avatar>
              </center>

            </q-list>
          </q-card>
        </div>
      </div>
      <br>
    </div>
  </div>
</template>
<script>
// ── Supabase Services ──────────────────────────────────────
import AuthSupabaseService from 'src/services/supabase/AuthSupabaseService'
import DashboardSupabaseService from 'src/services/supabase/DashboardSupabaseService'
import { StudioService, PeriodService } from 'src/services/supabase/SupabaseServices'

// ── Mixins y componentes ───────────────────────────────────
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'
import { Chart } from 'highcharts-vue'
import Highcharts from 'highcharts'

export default {
  name: 'DashboardView',
  mixins: [xMisc, sGate],
  components: {
    highcharts: Chart
  },
  props: {
    mode: {
      type: Boolean,
      default: false
    },
    modeprop: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      sUser: {
        user_name: '',
        user_surname: '',
        user_email: '',
        prof_id: '',
        user_id: null
      },
      imageUrl: '',
      loader: true,
      tasksList: [],
      indicatorsList: {},
      taskCompletedImageIndex: -1,
      report: {
        period: { value: 0, label: '' },
        std_id: null,
      },
      periods: [],
      studios: [],
      studioData: {},
      chartOptsStreamEarnings: {
        chart: { type: 'column' },
        title: { text: 'Ganancias x plataforma x periodo', align: 'center' },
        xAxis: { categories: [] },
        yAxis: {
          min: 0,
          title: { text: 'Ganancias' },
          stackLabels: { enabled: true }
        },
        legend: {
          align: 'center',
          backgroundColor: Highcharts.defaultOptions.legend.backgroundColor || 'white',
          borderColor: '#CCC',
          borderWidth: 1,
          shadow: false
        },
        tooltip: {
          headerFormat: '<b>{point.x}</b><br/>',
          pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
        },
        plotOptions: {
          column: {
            stacking: 'normal',
            dataLabels: { enabled: true }
          }
        },
        series: []
      },
      modelGoalsTable: {
        dataset: [],
        filter: '',
        visibleColumns: ['user_identification', 'user_name', 'user_surname', 'sum_goal', 'sum_earnings'],
        columns: [
          { name: 'user_identification', required: true, label: 'Identificación', align: 'left', field: row => row.users?.user_identification, sortable: true },
          { name: 'user_name', required: true, label: 'Nombre', align: 'left', field: row => row.users?.user_name, sortable: true },
          { name: 'user_surname', required: true, label: 'Apellido', align: 'left', field: row => row.users?.user_surname, sortable: true },
          { name: 'sum_goal', required: true, label: 'Meta', align: 'left', field: row => row.goal_amount, sortable: true },
          { name: 'sum_earnings', required: true, label: 'Ganancias', align: 'left', field: row => row.sum_earnings || 0, sortable: true },
          { name: 'goal_indicator', required: true, label: 'Indicador', align: 'left', field: row => (row.sum_earnings || 0) / (row.goal_amount || 1), sortable: true }
        ]
      },
      studioGoalsTable: {
        dataset: [],
        filter: '',
        visibleColumns: ['std_name', 'sum_goal', 'sum_earnings'],
        columns: [
          { name: 'std_name', required: true, label: 'Estudio', align: 'left', field: row => row.studios?.std_name, sortable: true },
          { name: 'sum_goal', required: true, label: 'Meta', align: 'left', field: row => row.goal_amount, sortable: true },
          { name: 'sum_earnings', required: true, label: 'Ganancias', align: 'left', field: row => row.sum_earnings || 0, sortable: true },
          { name: 'goal_indicator', required: true, label: 'Indicador', align: 'left', field: row => (row.sum_earnings || 0) / (row.goal_amount || 1), sortable: true }
        ]
      },
      pagination: {
        page: 1,
        rowsPerPage: 20
      },
      monitor: 0,
      monitors: []
    }
  },
  async mounted () {
    try {
      // ── Cargar sesión de Supabase ──
      const { data: sessionData } = await AuthSupabaseService.getSession()
      if (sessionData?.session?.user) {
        const { data: profile } = await AuthSupabaseService.getUserProfile(sessionData.session.user.id)
        if (profile) {
          this.sUser = profile
        }
      } else {
        this.sUser = this.decryptSession('user')
      }

      await this.getSelects()

      if (this.openGate('tasks-dashboard', this.sUser.prof_id)) {
        await this.getTasks()
        await this.getIndicators()
        if (![6].includes(this.sUser.prof_id)) {
          await this.getCharts()
        }
      } else {
        this.loader = false
      }
      this.loader = false

      // Perfil image logic
      if ([4, 5].includes(this.sUser.prof_id)) {
        this.imageUrl = this.sUser.user_photo_url || ''
      } else if ([2].includes(this.sUser.prof_id)) {
        this.imageUrl = this.studioData?.std_photo_url || ''
      } else {
        this.imageUrl = '/images/studios/STUDIO-1.png'
      }
    } catch (error) {
      console.error('Error in Dashboard mounted:', error)
      this.loader = false
    }
  },
  methods: {
    async getSelects () {
      try {
        // Periods
        const { data: periods } = await PeriodService.getAll()
        this.periods = (periods || []).map(p => ({
          label: p.per_name,
          since: p.per_start_date,
          until: p.per_end_date,
          value: p.per_id
        }))
        if (this.periods.length > 0) {
          this.report.period = this.periods[0]
        }

        // Studios
        const { data: studios } = await StudioService.getAll({ std_active: true })
        this.studios = [{ label: 'TODOS', value: '' }]
        if (studios) {
          studios.forEach(s => {
            this.studios.push({ label: s.std_name, value: s.std_id })
          })
          this.studioData = studios[0]
        }
      } catch (error) {
        console.error('Error getting selects:', error)
      }
    },
    async getTasks () {
      try {
        const { data } = await DashboardSupabaseService.getTasks(this.sUser.user_id)
        this.tasksList = data || []
        this.taskCompletedImageIndex = this.getRandomInt(0, 6)
      } catch (error) {
        console.error('Error getting tasks:', error)
      }
    },
    async getIndicators () {
      try {
        const { data } = await DashboardSupabaseService.getIndicators({
          per_id: this.report.period?.value,
          std_id: this.report.std_id?.value
        })
        this.indicatorsList = data || {}
      } catch (error) {
        console.error('Error getting indicators:', error)
      }
    },
    async getCharts () {
      try {
        const params = {
          per_id: this.report.period?.value,
          std_id: this.report.std_id?.value
        }
        const { data: charts } = await DashboardSupabaseService.getCharts(params)
        if (charts) {
          this.chartOptsStreamEarnings.series = charts.series || []
          this.chartOptsStreamEarnings.xAxis.categories = charts.categories || []
        }

        const { data: modelGoals } = await DashboardSupabaseService.getModelGoals(params)
        this.modelGoalsTable.dataset = modelGoals || []

        const { data: studioGoals } = await DashboardSupabaseService.getStudioGoals(params)
        this.studioGoalsTable.dataset = studioGoals || []
      } catch (error) {
        console.error('Error getting charts:', error)
      }
    },
    openTransactionDialog () {
      // Future implementation
    }
  }
}
</script>

<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card">
          <q-form @submit="onSubmit" class="q-gutter-md">
            <q-card-section>
              <div class="row q-col-gutter-sm">
                <div class="col-xs-12 col-sm-12">
                  <h5 class="is-size-3">Cargue de streams por archivo</h5>
                  <br>
                </div>
              </div>
              <div class="row q-col-gutter-sm">
                <div class="col-xs-12 col-sm-6">
                  <q-select
                    filled
                    v-model="period"
                    label="Periodo"
                    label-color="primary"
                    :options="periods"
                    lazy-rules
                    :rules="[
                      val => !!val.value || 'Este campo es requerido',
                    ]"
                  />
                </div>

                <div class="col-xs-12 col-sm-6">
                  <q-file
                    standout
                    bottom-slots
                    clearable
                    accept=".xlsx, .xls, .csv"
                    v-model="fileUpload"
                    label="Seleccionar archivo"
                    counter
                    :rules="[
                      (val) => !!val || 'Este campo es requerido',
                    ]"
                    :readonly="mode == 'show'"
                    @update:model-value="getTemplateByFilename"
                  >
                    <template v-slot:prepend>
                      <q-icon name="attach_file" />
                    </template>
                  </q-file>
                  <br>
                </div>
              </div>

              <!-- file types -->
              <div class="row q-col-gutter-sm">
                <div class="col-xs-12 col-sm-12">
                  <q-card flat bordered class="my-card">
                    <q-card-section>
                      <div class="row q-col-gutter-sm">
                        <div class="col-xs-12 col-sm-12">
                          <p><b>Plantillas de cargue:</b></p>
                        </div>
                        <div class="col-xs-12 col-sm-12">
                          <div style="display: flex; flex-direction: row; flex-wrap: wrap;">
                            <div v-for="(portal, index) in fileTemplates" v-bind:key="index" style="width: 120px;">
                              <q-card flat bordered class="my-card" :style="{
                                  border: (fileTemplate == portal.value) ? '1px solid #46adff' : '',
                                  backgroundColor: (fileTemplate == portal.value) ? '#4dc7cd21 !important' : ''
                                }">
                                <q-card-section style="display: flex; flex-direction: column; align-items: center; text-align: center; height: 140px; cursor: pointer; padding-bottom: 0px;" @click="fileTemplate = portal.value">
                                  <span>{{ portal.label }}</span>
                                  <q-img width="60px" height="60px" :src="portal.image" />
                                  <q-radio v-model="fileTemplate" :val="portal.value" color="blue" keep-color />
                                </q-card-section>
                                <q-separator class="q-my-none" inset />
                                <q-card-section style="display: flex; flex-direction: column; align-items: center; margin: 0px; padding: 0px;">
                                  <span v-if="portal.video">
                                    <q-btn label="Guía" class="text-blue" flat @click="dialogVideo = true; dialogVideoSrc = portal.video; dialogVideoTitle = portal.label;"/>
                                    <q-tooltip :offset="[0, 10]">Ver guía</q-tooltip>
                                  </span>
                                  <a v-else-if="portal.template" :href="getApiUrl(portal.template)" target="_blank" style="text-decoration: none;">
                                    <q-btn label="Descargar" class="text-blue" flat/>
                                    <q-tooltip :offset="[0, 10]">Descargar plantilla</q-tooltip>
                                  </a>
                                </q-card-section>
                              </q-card>
                            </div>
                          </div>
                        </div>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </q-card-section>

            <q-separator inset />

            <q-card-section>
              <div>
                <q-btn label="Cargar" type="submit" class="bg-primary text-white"/>
              </div>
            </q-card-section>
          </q-form>
        </q-card>

        <!-- Guide Dialog -->
        <q-dialog v-if="dialogVideoSrc" v-model="dialogVideo" backdrop-filter="brightness(100%)" full-width full-height>
          <q-card class="bg-black">
            <q-card-section class="row items-center q-pb-none">
              <div class="text-h6 text-white">Guía descarga de plantilla: {{ dialogVideoTitle }}</div>
              <q-space />
              <q-btn class="bg-white" icon="close" flat round dense v-close-popup />
            </q-card-section>

            <q-card-section style="height: 90%; width: 100%" >
              <q-video :src="dialogVideoSrc" style="height: 100%; width: 100%" />
            </q-card-section>
          </q-card>
        </q-dialog>

        <!-- Guide Dialog -->
        <q-dialog v-model="dialogResumen" backdrop-filter="brightness(100%)" full-width full-height>
          <q-card>
            <q-card-section class="row items-center q-pb-none">
              <div class="text-h5">Resumen de cargue:</div>
              <q-space />
              <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>

            <!-- success -->
            <q-card-section v-if="resumenData.success.data.length > 0" style="width: 100%" >
              <q-card class="bg-green-2">
                <q-card-section class="row items-center">
                  <div class="text-h6">Registros cargados:</div>
                </q-card-section>

                <q-separator />

                <q-card-section class="row items-center">
                  <!-- <span v-if="resumenData.success.data && resumenData.success.data.length > 0"> {{ resumenData.success.data[0] }} </span> -->
                  <q-table
                    :rows="resumenData.success.data"
                    :columns="[
                      { name: 'row', label: 'Fila', field: row => row.row, sortable: true, align: 'left' },
                      { name: 'app', label: 'Plataforma', field: row => row.modacc_app, sortable: true, align: 'left' },
                      { name: 'name', label: 'Nombre', field: row => row.name, sortable: true, align: 'left' },
                      { name: 'nickname', label: 'Nickname', field: row => row.nickname, sortable: true, align: 'left' },
                      { name: 'earnings_tokens', label: 'Ganancia (Tokens)', field: row => row.modstr_earnings_tokens, sortable: true, align: 'center' },
                      { name: 'earnings_usd', label: 'Ganancia (USD)', field: row => row.modstr_earnings_usd, sortable: true, align: 'center' },
                      { name: 'earnings_eur', label: 'Ganancia (EUR)', field: row => row.modstr_earnings_eur, sortable: true, align: 'center' },
                      { name: 'earnings_cop', label: 'Ganancia (COP)', field: row => row.modstr_earnings_cop, sortable: true, align: 'center' },
                      { name: 'time', label: 'Tiempo', field: row => row.modstr_time, sortable: true, align: 'center' },
                    ]"
                    :filter="resumenData.success.filter"
                    row-key="name"
                    v-model:pagination="resumenData.success.pagination"
                    style="width:100%"
                  >
                    <!-- search -->
                    <template v-slot:top-right>
                      <q-input borderless dense debounce="300" v-model="resumenData.success.filter" placeholder="Search">
                        <template v-slot:append>
                          <q-icon name="search" />
                        </template>
                      </q-input>
                    </template>
                    <template v-slot:body="props">
                      <q-tr :props="props">
                        <q-td key="row" :props="props">{{ props.row.row }}</q-td>
                        <q-td key="app" :props="props">{{ props.row.modacc_app }}</q-td>
                        <q-td key="name" :props="props">{{ props.row.name }}</q-td>
                        <q-td key="nickname" :props="props">{{ props.row.nickname }}</q-td>
                        <q-td key="earnings_tokens" :props="props">{{ miles(props.row.modstr_earnings_tokens) }}</q-td>
                        <q-td key="earnings_usd" :props="props">{{ miles(props.row.modstr_earnings_usd) }}</q-td>
                        <q-td key="earnings_eur" :props="props">{{ miles(props.row.modstr_earnings_eur) }}</q-td>
                        <q-td key="earnings_cop" :props="props">{{ miles(props.row.modstr_earnings_cop) }}</q-td>
                        <q-td key="time" :props="props">{{ miles(props.row.modstr_time) }}</q-td>
                      </q-tr>
                    </template>
                    <!-- footer -->
                    <template v-slot:bottom-row>
                      <q-tr>
                        <q-td></q-td>
                        <q-td>
                          <strong>TOTAL</strong>
                        </q-td>
                        <q-td></q-td>
                        <q-td></q-td>
                        <q-td align="center">{{ miles(resumenData.success.totalEarningsTokens) }}</q-td>
                        <q-td align="center">{{ miles(resumenData.success.totalEarningsUsd) }}</q-td>
                        <q-td align="center">{{ miles(resumenData.success.totalEarningsEur) }}</q-td>
                        <q-td align="center">{{ miles(resumenData.success.totalEarningsCop) }}</q-td>
                        <q-td align="center">{{ miles(resumenData.success.totalTime) }}</q-td>
                      </q-tr>
                    </template>
                  </q-table>
                </q-card-section>
              </q-card>
            </q-card-section>

            <!-- inactives -->
            <q-card-section v-if="resumenData.inactives.data.length > 0" style="width: 100%" >
              <q-card class="bg-orange-2">
                <q-card-section class="row items-center">
                  <div class="text-h6">Registros cargados (inactivos):</div>
                </q-card-section>

                <q-separator />

                <q-card-section class="row items-center">
                  <!-- <span v-if="resumenData.inactives.data && resumenData.inactives.data.length > 0"> {{ resumenData.inactives.data[0] }} </span> -->
                  <q-table
                    :rows="resumenData.inactives.data"
                    :columns="[
                      { name: 'row', label: 'Fila', field: row => row.row, sortable: true, align: 'left' },
                      { name: 'app', label: 'Plataforma', field: row => row.modacc_app, sortable: true, align: 'left' },
                      { name: 'name', label: 'Nombre', field: row => row.name, sortable: true, align: 'left' },
                      { name: 'nickname', label: 'Nickname', field: row => row.nickname, sortable: true, align: 'left' },
                      { name: 'earnings_tokens', label: 'Ganancia (Tokens)', field: row => row.modstr_earnings_tokens, sortable: true, align: 'center' },
                      { name: 'earnings_usd', label: 'Ganancia (USD)', field: row => row.modstr_earnings_usd, sortable: true, align: 'center' },
                      { name: 'earnings_eur', label: 'Ganancia (EUR)', field: row => row.modstr_earnings_eur, sortable: true, align: 'center' },
                      { name: 'earnings_cop', label: 'Ganancia (COP)', field: row => row.modstr_earnings_cop, sortable: true, align: 'center' },
                      { name: 'time', label: 'Tiempo', field: row => row.modstr_time, sortable: true, align: 'center' },
                      { name: 'accactive', label: 'Activar', field: row => row.modstr_time, sortable: false, align: 'center' },
                    ]"
                    :filter="resumenData.inactives.filter"
                    row-key="name"
                    v-model:pagination="resumenData.inactives.pagination"
                    style="width:100%"
                  >
                    <!-- search -->
                    <template v-slot:top-right>
                      <q-input borderless dense debounce="300" v-model="resumenData.inactives.filter" placeholder="Search">
                        <template v-slot:append>
                          <q-icon name="search" />
                        </template>
                      </q-input>
                    </template>
                    <template v-slot:body="props">
                      <q-tr :props="props">
                        <q-td key="row" :props="props">{{ props.row.row }}</q-td>
                        <q-td key="app" :props="props">{{ props.row.modacc_app }}</q-td>
                        <q-td key="name" :props="props">{{ props.row.name }}</q-td>
                        <q-td key="nickname" :props="props">{{ props.row.nickname }}</q-td>
                        <q-td key="earnings_tokens" :props="props">{{ miles(props.row.modstr_earnings_tokens) }}</q-td>
                        <q-td key="earnings_usd" :props="props">{{ miles(props.row.modstr_earnings_usd) }}</q-td>
                        <q-td key="earnings_eur" :props="props">{{ miles(props.row.modstr_earnings_eur) }}</q-td>
                        <q-td key="earnings_cop" :props="props">{{ miles(props.row.modstr_earnings_cop) }}</q-td>
                        <q-td key="time" :props="props">{{ miles(props.row.modstr_time) }}</q-td>
                        <q-td key="accactive" :props="props">
                          <q-toggle
                            v-model="props.row.toggleActive"
                            @update:model-value="toggleActive(props.row)"
                            color="green"
                            checked-icon="check"
                            unchecked-icon="clear"
                          />
                        </q-td>
                      </q-tr>
                    </template>
                    <!-- footer -->
                    <template v-slot:bottom-row>
                      <q-tr>
                        <q-td></q-td>
                        <q-td>
                          <strong>TOTAL</strong>
                        </q-td>
                        <q-td></q-td>
                        <q-td></q-td>
                        <q-td align="center">{{ miles(resumenData.inactives.totalEarningsTokens) }}</q-td>
                        <q-td align="center">{{ miles(resumenData.inactives.totalEarningsUsd) }}</q-td>
                        <q-td align="center">{{ miles(resumenData.inactives.totalEarningsEur) }}</q-td>
                        <q-td align="center">{{ miles(resumenData.inactives.totalEarningsCop) }}</q-td>
                        <q-td align="center">{{ miles(resumenData.inactives.totalTime) }}</q-td>
                      </q-tr>
                    </template>
                  </q-table>
                </q-card-section>
              </q-card>
            </q-card-section>

            <!-- errors -->
            <q-card-section v-if="resumenData.errors.data.length > 0" style="width: 100%" >
              <q-card class="bg-rqed-2">
                <q-card-section class="row items-center">
                  <div class="text-h6">Registros no cargados:</div>
                </q-card-section>

                <q-separator />

                <q-card-section class="row items-center">
                  <!-- <span v-if="resumenData.errors.data && resumenData.errors.data.length > 0"> {{ resumenData.errors.data[0] }} </span> -->
                  <q-table
                    :rows="resumenData.errors.data"
                    :columns="[
                      { name: 'row', label: 'Fila', field: row => row.row, sortable: true, align: 'left' },
                      { name: 'app', label: 'Plataforma', field: row => row.modacc_app, sortable: true, align: 'left' },
                      { name: 'name', label: 'Nombre', field: row => row.name, sortable: true, align: 'left' },
                      { name: 'nickname', label: 'Nickname', field: row => row.nickname, sortable: true, align: 'left' },
                      { name: 'error', label: 'Error', field: row => row.error.message, sortable: true, align: 'left' },
                      { name: 'earnings_tokens', label: 'Ganancia (Tokens)', field: row => row.modstr_earnings_tokens, sortable: true, align: 'center' },
                      { name: 'earnings_usd', label: 'Ganancia (USD)', field: row => row.modstr_earnings_usd, sortable: true, align: 'center' },
                      { name: 'earnings_eur', label: 'Ganancia (EUR)', field: row => row.modstr_earnings_eur, sortable: true, align: 'center' },
                      { name: 'earnings_cop', label: 'Ganancia (COP)', field: row => row.modstr_earnings_cop, sortable: true, align: 'center' },
                      { name: 'time', label: 'Tiempo', field: row => row.modstr_time, sortable: true, align: 'center' },
                    ]"
                    :filter="resumenData.errors.filter"
                    row-key="name"
                    v-model:pagination="resumenData.errors.pagination"
                    style="width:100%"
                  >
                    <!-- search -->
                    <template v-slot:top-right>
                      <q-input borderless dense debounce="300" v-model="resumenData.errors.filter" placeholder="Search">
                        <template v-slot:append>
                          <q-icon name="search" />
                        </template>
                      </q-input>
                    </template>
                    <template v-slot:body="props">
                      <q-tr :props="props">
                        <q-td key="row" :props="props">{{ props.row.row }}</q-td>
                        <q-td key="app" :props="props">{{ props.row.modacc_app }}</q-td>
                        <q-td key="name" :props="props">{{ props.row.name }}</q-td>
                        <q-td key="nickname" :props="props">{{ props.row.nickname }}</q-td>
                        <q-td key="error" :props="props">{{ props.row.error.message }}</q-td>
                        <q-td key="earnings_tokens" :props="props">{{ miles(props.row.modstr_earnings_tokens) }}</q-td>
                        <q-td key="earnings_usd" :props="props">{{ miles(props.row.modstr_earnings_usd) }}</q-td>
                        <q-td key="earnings_eur" :props="props">{{ miles(props.row.modstr_earnings_eur) }}</q-td>
                        <q-td key="earnings_cop" :props="props">{{ miles(props.row.modstr_earnings_cop) }}</q-td>
                        <q-td key="time" :props="props">{{ miles(props.row.modstr_time) }}</q-td>
                      </q-tr>
                    </template>
                    <!-- footer -->
                    <template v-slot:bottom-row>
                      <q-tr>
                        <q-td></q-td>
                        <q-td>
                          <strong>TOTAL</strong>
                        </q-td>
                        <q-td></q-td>
                        <q-td></q-td>
                        <q-td></q-td>
                        <q-td align="center">{{ miles(resumenData.errors.totalEarningsTokens) }}</q-td>
                        <q-td align="center">{{ miles(resumenData.errors.totalEarningsUsd) }}</q-td>
                        <q-td align="center">{{ miles(resumenData.errors.totalEarningsEur) }}</q-td>
                        <q-td align="center">{{ miles(resumenData.errors.totalEarningsCop) }}</q-td>
                        <q-td align="center">{{ miles(resumenData.errors.totalTime) }}</q-td>
                      </q-tr>
                    </template>
                  </q-table>
                </q-card-section>
              </q-card>
            </q-card-section>
          </q-card>
        </q-dialog>
      </div>
    </div>
    <br>
    <!-- files -->
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card">
          <ModelsStreamsFiles ref="ModelsStreamsFiles" is-subgrid="true" parent-mode="edit" parent-table="" parent-field="" parent-id="" :period="period" />
        </q-card>
      </div>
    </div>
  </div>
</template>

<script>
import StudioModelService from 'src/services/StudioModelService'
import ModelStreamService from 'src/services/ModelStreamService'
import ModelAccountService from 'src/services/ModelAccountService'
import ModelStreamFileService from 'src/services/ModelStreamFileService'
import ReportService from 'src/services/ReportService'
import ModelsStreamsFiles from 'src/pages/ModelStreamFile/ModelsStreamsFiles.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'
import { ref, onMounted } from 'vue'

export default {
  name: 'StudiosModelsList',
  mixins: [xMisc, sGate],
  components: {
    ModelsStreamsFiles
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
      // form
      period: { value: 0, label: '' },
      periods: [],
      fileTemplate: 'DEFAULT',
      fileUpload: null,
      fileTemplates: [
        {
          value: 'DEFAULT',
          label: 'Plantilla Base',
          template: '/templates/streams/cargue_streams.xlsx',
          image: '',
        },
        {
          value: 'BONGACAMS',
          label: 'BONGA',
          template: '/templates/streams/BONGA.xls',
          image: 'cam_webs_icons/bonga.jpg',
          video: 'videos/14- Bonga.mp4',
        },
        {
          value: 'CAM4',
          label: 'CAM4',
          template: '/templates/streams/CONVERSOR_CAM4_V2.xlsm',
          image: 'cam_webs_icons/cam4.jpg',
          video: 'videos/17- Cam4.mp4',
        },
        {
          value: 'CAMSODA',
          label: 'CAMSODA',
          template: '/templates/streams/CONVERSOR_CAMSODA_V5.xlsm',
          image: 'cam_webs_icons/camsoda.png',
          video: 'videos/12- Camsoda.mp4',
        },
        {
          value: 'SKYPRIVATE',
          label: 'SKYPRIVATE',
          template: '/templates/streams/SKYPRIVATE.csv',
          image: 'cam_webs_icons/skyprivate.png',
          video: 'videos/16- Skyprivate.mp4',
        },
        {
          value: 'STREAMATE',
          label: 'STREAMATE',
          template: '/templates/streams/STREAMATE.csv',
          image: 'cam_webs_icons/streamate.jpg',
          video: 'videos/03 - Streamate.mp4',
        },
        {
          value: 'STRIPCHAT',
          label: 'Stripchat',
          template: '/templates/streams/Stripchat 2024-02-26.csv',
          image: 'cam_webs_icons/stripchat.svg',
          video: 'videos/11- Stripchat.mp4',
        },
        {
          value: 'FLIRT4FREE',
          label: 'Flirt4free',
          template: '/templates/streams/Flirt4free 2024-02-26.csv',
          image: 'cam_webs_icons/flirt4free.jpg',
          video: 'videos/15- Flirt 4 Free.mp4',
        },
        {
          value: 'IMLIVE',
          label: 'IMLIVE',
          template: '/templates/streams/Flirt4free 2024-02-26.csv',
          image: 'cam_webs_icons/imlive.png',
          video: 'videos/10- Imlive.mp4',
        },
        {
          value: 'LIVEJASMIN',
          label: 'LIVEJASMIN',
          template: '/templates/streams/Flirt4free 2024-02-26.csv',
          image: 'cam_webs_icons/livejasmin.png',
          video: 'videos/07- Jasmin.mp4',
        },
        // {
        //   value: 'MYFREECAMS',
        //   label: 'MYFREECAMS',
        //   template: '/templates/streams/Flirt4free 2024-02-26.csv',
        //   image: '/src/assets/cam_webs_icons/myfreecams.jpg',
        //   video: '/src/assets/videos/18- Myfree.mp4',
        // },
        // {
        //   value: 'STREAMRAY',
        //   label: 'STREAMRAY',
        //   template: '/templates/streams/Flirt4free 2024-02-26.csv',
        //   image: '/src/assets/cam_webs_icons/streamray.jpg',
        // },
        // {
        //   value: 'XHAMSTER',
        //   label: 'XHAMSTER',
        //   template: '/templates/streams/Flirt4free 2024-02-26.csv',
        //   image: '/src/assets/cam_webs_icons/xhamster.png',
        // },
        // {
        //   value: 'XLOVECAM',
        //   label: 'XLOVECAM',
        //   template: '/templates/streams/Flirt4free 2024-02-26.csv',
        //   image: '/src/assets/cam_webs_icons/xlovecam.png',
        //   video: '/src/assets/videos/6- Xlove.mp4',
        // },
        {
          value: 'CHATURBATE',
          label: 'CHATURBATE',
          template: '/templates/streams/Flirt4free 2024-02-26.csv',
          image: 'cam_webs_icons/chaturbate.png',
          video: 'videos/09- Chaturbate.mp4',
        },
        // {
        //   value: 'MYDIRTYHOBBY',
        //   label: 'MYDIRTYHOBBY',
        //   template: '/templates/streams/Flirt4free 2024-02-26.csv',
        //   image: '/src/assets/cam_webs_icons/mydirtyhobby.png',
        // },
        // {
        //   value: 'ONLYFANS',
        //   label: 'ONLYFANS',
        //   template: '/templates/streams/Flirt4free 2024-02-26.csv',
        //   image: '/src/assets/cam_webs_icons/onlyfans.png',
        // },
      ],
      // dialogResumen
      dialogResumen: false,
      resumenData: {
        success: { data: [], filter: '' },
        errors: { data: [], filter: '' },
      },
      // dialogVideo
      dialogVideo: false,
      dialogVideoSrc: null,
      dialogVideoTitle: null
      // 
    }
  },
  mounted () {
    this.sUser = this.decryptSession('user')
    this.getSelects()
  },
  methods: {
    async getSelects () {
      var response
      this.fileTemplates.push()

      // periods
      this.periods = []
      // async
      response = await ReportService.getStudioPeriods({ token: this.decryptSession('token') })
      for (var u = 0; u < response.data.data.length; u++) {
        this.periods.push({
          label: response.data.data[u].label,
          since: response.data.data[u].since,
          until: response.data.data[u].until,
          value: response.data.data[u].since + '|' + response.data.data[u].until,
        })
      }
      if (this.periods.length > 0) {
        this.period = this.periods[0]
      }
    },
    async onSubmit () {
      try {
        this.activateLoading('Cargando')
        var data = new FormData()
        if (this.fileUpload !== '') {
          data.append('period_until', this.period.until)
          data.append('file_template', this.fileTemplate)
          data.append('files', this.fileUpload)
          this.resumenData = {
            success: { data: [], filter: '' },
            errors: { data: [], filter: '' },
          }
          var response = await ModelStreamService.importModelStream({ data: data, token: this.decryptSession('token') })
          this.resumenData = response.data.data
          this.resumenData.success.filter = ''
          this.resumenData.errors.filter = ''

          // pagination
          this.resumenData.success.pagination = {
            sortBy: 'created_at',
            descending: true,
            page: 1,
            rowsPerPage: this.resumenData.success.data.length,
            rowsNumber: this.resumenData.success.data.length
          }
          this.resumenData.inactives.pagination = {
            sortBy: 'created_at',
            descending: true,
            page: 1,
            rowsPerPage: this.resumenData.inactives.data.length,
            rowsNumber: this.resumenData.inactives.data.length
          }
          this.resumenData.errors.pagination = {
            sortBy: 'created_at',
            descending: true,
            page: 1,
            rowsPerPage: this.resumenData.errors.data.length,
            rowsNumber: this.resumenData.errors.data.length
          }

          this.alert('positive', 'Archivo cargardo con éxito')
          this.dialogResumen = true
          this.fileUpload = null

          // reload streams files
          this.$refs.ModelsStreamsFiles.getModelsStreamsFiles()
        }
        this.disableLoading()
      } catch (error) {
        this.errorsAlerts(error)
        this.disableLoading()
      }
    },
    openSubgridForm (mode, id) {
      this.dialogMode = mode
      this.dialogChildId = id
      this.dialog = true
    },
    getTemplateByFilename () {
      var filename = this.fileUpload.name
      filename = filename.replace(/(\..*)/, '')
      filename = filename.replace(/FLE4/, 'FLIRT4FREE')
      filename = filename.replace(/^JASMIN/, 'LIVEJASMIN')
      filename = filename.replace(/Informe detallado de modelo/, 'CAMSODA')

      // loop files
      for (var i = 0; i < this.fileTemplates.length; i++) {
        // Valida si el nombre del template lo contiene el nombre del archivo
        if (new RegExp(this.fileTemplates[i].label, 'i').test(filename)) {
          this.fileTemplate = this.fileTemplates[i].value
          console.log(this.fileTemplates[i].value)
        } else if (new RegExp('cargue_streams', 'i').test(filename)) {
          this.fileTemplate = 'DEFAULT'
        }
      }
    },
    async toggleActive (row) {
      var newState = row.toggleActive
      try {
        this.activateLoading(this.$t('loading'))

        // activate
        if (newState === true) {
          var response = await ModelAccountService.activateModelAccount({ id: row.modacc_id, token: this.decryptSession('token') })
          var successMessage = this.$t('activated')
        // inactivate
        } else if (newState === false) {
          var response = await ModelAccountService.inactivateModelAccount({ id: row.modacc_id, token: this.decryptSession('token') })
          var successMessage = this.$t('inactivated')
        }

        if (response.data.status === 'success') {
          this.alert('positive', successMessage)
          row.user_active = newState
          row.toggleActive = newState
        } else {
          this.alert('negative', this.$t('errorMessage'))
          row.user_active = !newState
          row.toggleActive = !newState
        }
        this.disableLoading()
      } catch (error) {
        console.log(error)
        row.user_active = !newState
        row.toggleActive = !newState
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

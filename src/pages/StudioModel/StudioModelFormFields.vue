<template>
    <q-card-section>
        <div class="row q-col-gutter-sm">
          <div v-if="mode !== 'create_stepper' && mode !== 'create'" class="col-xs-12 col-sm-6">
            <q-input
              filled
              type=""
              v-model="studioModel.contract_number"
              label="Nro de contrato"
              label-color=""
              lazy-rules
              readonly
            />
          </div>

          <div class="col-xs-12 col-sm-6">
            <q-select
              filled
              v-model="studioModel.contract_type"
              label="Tipo de contrato"
              label-color=""
              :options="[
                'APRENDIZAJE',
                'CIVIL POR PRESTACIÓN DE SERVICIOS',
                'MANDANTE - MODELO',
                'OBRA O LABOR',
                'OCASIONAL DE TRABAJO',
                'TERMINO FIJO',
                'TERMINO INDEFINIDO'
              ]"
              lazy-rules
              :rules="[val => !!val || 'Este campo es requerido']"
              :readonly="mode == 'show' || readonlyFields.contract_type"
            />
          </div>

          <div class="col-xs-12 col-sm-6">
            <q-input
              filled
              type=""
              v-model="studioModel.position"
              label="Cargo"
              label-color=""
              lazy-rules
              :rules="[]"
              :readonly="mode == 'show' || readonlyFields.position"
            />
          </div>

          <div class="col-xs-12 col-sm-6">
            <q-input
              filled
              type=""
              v-model="studioModel.area"
              label="Área"
              label-color=""
              lazy-rules
              :rules="[]"
              :readonly="mode == 'show' || readonlyFields.area"
            />
          </div>

          <div class="col-xs-12 col-sm-6">
            <q-select
              filled
              v-model="studioModel.std_id"
              label="Estudio"
              label-color="primary"
              :options="studios"
              lazy-rules
              :rules="[val => !!val.value || 'Este campo es requerido']"
              :readonly="mode == 'show' || mode == 'edit' || readonlyFields.std_id"
            />
            <!-- @update:model-value="updatedStudio" -->
          </div>
          <div v-if="mode !== 'create_stepper' && mode !== 'create'" class="col-xs-12 col-sm-6">
            <q-select
              filled
              v-model="studioModel.user_id_model"
              label="Usuario"
              label-color="primary"
              :options="usersModel"
              lazy-rules
              :rules="[val => !!val.value || 'Este campo es requerido']"
              readonly
            />
          </div>

          <!-- Cuarto - solo para modelos -->
          <div v-if="isModel" class="col-xs-12 col-sm-6">
            <q-select
              filled
              v-model="studioModel.stdroom_id"
              label="Cuarto"
              label-color=""
              :options="studiosRooms"
              lazy-rules
              :rules="[]"
              :readonly="mode == 'show' || readonlyFields.stdroom_id"
            />
            <br>
          </div>

          <div class="col-xs-12 col-sm-6">
            <q-select
              filled
              v-model="studioModel.stdshift_id"
              label="Turno"
              label-color=""
              :options="studiosShifts"
              lazy-rules
              :rules="[]"
              :readonly="mode == 'show' || readonlyFields.stdshift_id"
            />
            <br>
          </div>

          <div class="col-xs-12 col-sm-6">
            <q-input
              filled
              type=""
              v-model="studioModel.start_at"
              label="Inicio"
              label-color="primary"
              mask="date"
              :rules="[val => !!val || 'Este campo es requerido']"
              readonly
            >
              <template v-slot:append>
                <q-icon
                  name="event"
                  class="cursor-pointer"
                  v-if="!(mode == 'show' || readonlyFields.contract_type)"
                >
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="studioModel.start_at" mask="YYYY-MM-DD">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="col-xs-12 col-sm-6">
            <q-input
              filled
              type=""
              v-model="studioModel.finish_at"
              label="Fin"
              label-color="primary"
              mask="date"
              :rules="[]"
              readonly
            >
              <template v-slot:append>
                <q-icon
                  name="event"
                  class="cursor-pointer"
                  v-if="!(mode == 'show' || readonlyFields.contract_type)"
                      >
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="studioModel.finish_at" mask="YYYY-MM-DD">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="col-xs-12 col-sm-4">
            <q-select
              filled
              v-model="studioModel.country"
              label="Pais"
              label-color=""
              :options="countries"
              lazy-rules
              :rules="[val => !!val.value || 'Este campo es requerido']"
              :readonly="mode == 'show' || readonlyFields.country"
            />
          </div>

          <div class="col-xs-12 col-sm-4">
            <q-select
              filled
              v-model="studioModel.department"
              label="Departamento"
              label-color=""
              :options="departments"
              lazy-rules
              :rules="[val => !!val.value || 'Este campo es requerido']"
              :readonly="mode == 'show' || readonlyFields.department"
            />
          </div>

          <div class="col-xs-12 col-sm-4">
            <q-select
              filled
              v-model="studioModel.city_id"
              label="Ciudad"
              label-color=""
              :options="cities"
              lazy-rules
              :rules="[val => !!val.value || 'Este campo es requerido']"
              :readonly="mode == 'show' || readonlyFields.city_id"
            />
          </div>

          <!-- Configuración de Comisiones - solo para modelos -->
          <div v-if="isModel" class="col-xs-12 col-sm-12">
            <q-card flat bordered class="my-card">
              <q-card-section>
                <h6 class="is-size-3">Configuración % de ingreso</h6>
                <br>
                <div class="row q-col-gutter-sm">
                  <div class="col-xs-12 col-sm-4">
                    <q-select
                      filled
                      v-model="studioModel.commission_type"
                      label="Tipo de comisión"
                      label-color=""
                      :options="['', 'PRESENCIAL', 'SATELITE', 'FIJO']"
                      lazy-rules
                      :rules="[val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres']"
                      :readonly="mode == 'show' || readonlyFields.commission_type"
                    />
                  </div>
                  <div class="col-xs-12 col-sm-4" v-if="studioModel.commission_type == 'FIJO'">
                    <q-input
                      filled
                      type="number"
                      v-model="studioModel.percent"
                      label="Porcentaje de ingreso"
                      label-color=""
                      lazy-rules
                      step="any"
                      :rules="[]"
                      :readonly="mode == 'show'"
                    />
                    <br>
                  </div>
                  <div class="col-xs-12 col-sm-4" v-if="studioModel.commission_type == 'PRESENCIAL'">
                    <q-input
                      filled
                      type="number"
                      v-model="studioModel.goal"
                      label="Meta actual"
                      label-color=""
                      lazy-rules
                      step="any"
                      :rules="[]"
                      :readonly="mode == 'show'"
                    />
                    <br>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Configuración de Nómina - solo para empleados -->
          <div v-if="!isModel" class="col-xs-12 col-sm-12">
            <q-card flat bordered class="my-card">
              <q-card-section>
                <h6 class="is-size-3">Configuración nomina</h6>
                <br>
                <div class="row q-col-gutter-sm">
                  <div class="col-xs-12 col-sm-4">
                    <q-input
                      filled
                      type="text"
                      v-model="formattedMonthlySalary"
                      label="Salario mensual"
                      label-color="primary"
                      lazy-rules
                      :rules="[val => (parseFloat(val.replace(/[,.]/g, '')) > 0) || 'Debe ser mayor a 0']"
                      :readonly="mode == 'show'"
                      @update:model-value="updateMonthlySalary"
                    />
                  </div>
                  <div class="col-xs-12 col-sm-4">
                    <q-input
                      filled
                      type="text"
                      v-model="formattedDailySalary"
                      label="Salario diario"
                      label-color=""
                      readonly
                      hint="Este valor se calcula automáticamente"
                    />
                  </div>
                  <div class="col-xs-12 col-sm-4">
                    <q-input
                      filled
                      type="text"
                      v-model="formattedDotacionAmount"
                      label="Dotación"
                      label-color=""
                      lazy-rules
                      :rules="[]"
                      :readonly="mode == 'show'"
                      @update:model-value="updateDotacionAmount"
                    />
                  </div>
                </div>

                <div class="q-mt-md">
                  <h6 class="text-h6">Parafiscales</h6>
                  <div class="row q-col-gutter-sm">
                    <div class="col-xs-12 col-sm-4">
                      <q-checkbox
                        v-model="studioModel.has_sena"
                        label="SENA (2%)"
                        :disable="mode == 'show'"
                      />
                    </div>
                    <div class="col-xs-12 col-sm-4">
                      <q-checkbox
                        v-model="studioModel.has_caja_compensacion"
                        label="Caja de compensación (4%)"
                        :disable="mode == 'show'"
                      />
                    </div>
                    <div class="col-xs-12 col-sm-4">
                      <q-checkbox
                        v-model="studioModel.has_icbf"
                        label="ICBF (3%)"
                        :disable="mode == 'show'"
                      />
                    </div>
                  </div>
                </div>

                <div class="q-mt-md">
                  <div class="col-xs-12 col-sm-6">
                    <q-select
                      filled
                      v-model="studioModel.arl_risk_level"
                      label="Nivel de riesgo ARL"
                      label-color=""
                      :options="arlOptions"
                      lazy-rules
                      :rules="[]"
                      :readonly="mode == 'show'"
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-xs-12 col-sm-6">
            <q-input
              v-if="mode == 'show'"
              filled
              type=""
              label="¿Apllica Rte. Fte?"
              label-color=""
              readonly
            >
              <template v-slot:append>
                <q-chip v-if="studioModel.rtefte" color="green-3">SI</q-chip>
                <q-chip v-else color="red-3">NO</q-chip>
              </template>
            </q-input>
            <q-toggle
              v-else
              v-model="studioModel.rtefte"
              color="green"
              :label="'¿Apllica Rte. Fte? ' + (studioModel.rtefte ? '(SI)' : '(NO)')"
              checked-icon="check"
              unchecked-icon="clear"
            />
            <br>
          </div>

          <div class="col-xs-12 col-sm-6">
            <q-input
              v-if="mode == 'show'"
              filled
              type=""
              label="Activo"
              label-color="primary"
              readonly
            >
              <template v-slot:append>
                <q-chip v-if="studioModel.active" color="green-3">SI</q-chip>
                <q-chip v-else color="red-3">NO</q-chip>
              </template>
            </q-input>
            <q-toggle
              v-else
              v-model="studioModel.active"
              color="green"
              :label="(studioModel.active) ? 'Contrato activo' : 'Contrato inactivo'"
              checked-icon="check"
              unchecked-icon="clear"
            />
            <br>
          </div>

          <div v-if="mode == 'show' || mode == 'edit'" class="col-xs-12 col-sm-12">
            <q-card flat bordered class="my-card">
              <q-card-section>
                <h6 class="is-size-3">Documentos</h6>
                <br>
                <div class="row q-col-gutter-sm">
                  <div class="col-xs-12 col-sm-12">
                    <div style="display: flex; flex-direction: row; flex-wrap: wrap;">
                      <div style="width: 120px;">
                        <q-card flat bordered class="my-card">
                          <q-card-section
                            style="display: flex; flex-direction: column; align-items: center; text-align: center; height: 100px; cursor: pointer; padding-bottom: 0px;"
                            @click="downloadDocument('contract')"
                          >
                            <span>Contrato</span>
                            <q-icon size="xl" color="blue" name="description" />
                            <q-tooltip :delay="100" :offset="[0, 10]">Descargar Contrato</q-tooltip>
                          </q-card-section>
                        </q-card>
                      </div>
                      <div style="width: 120px;">
                        <q-card flat bordered class="my-card">
                          <q-card-section
                            style="display: flex; flex-direction: column; align-items: center; text-align: center; height: 100px; cursor: pointer; padding-bottom: 0px;"
                            @click="downloadDocument('certification')"
                          >
                            <span>Certificación</span>
                            <q-icon size="xl" color="red" name="description" />
                            <q-tooltip :delay="100" :offset="[0, 10]">Descargar Certificación</q-tooltip>
                          </q-card-section>
                        </q-card>
                      </div>
                      <div style="width: 120px;">
                        <q-card flat bordered class="my-card">
                          <q-card-section
                            style="display: flex; flex-direction: column; align-items: center; text-align: center; height: 100px; cursor: pointer; padding-bottom: 0px;"
                            @click="downloadDocument('bank_letter')"
                          >
                            <span>C. Banco</span>
                            <q-icon size="xl" color="teal" name="description" />
                            <q-tooltip :delay="100" :offset="[0, 10]">Descargar Carta Banco</q-tooltip>
                          </q-card-section>
                        </q-card>
                      </div>
                      <div style="width: 120px;">
                        <q-card flat bordered class="my-card">
                          <q-card-section
                            style="display: flex; flex-direction: column; align-items: center; text-align: center; height: 100px; cursor: pointer; padding-bottom: 0px;"
                            @click="downloadDocument('code_conduct')"
                          >
                            <span>Conducta</span>
                            <q-icon size="xl" color="orange" name="description" />
                            <q-tooltip :delay="100" :offset="[0, 10]">Descargar Código de Conducta, Manual de Convivencia y Reglamento Interno</q-tooltip>
                          </q-card-section>
                        </q-card>
                      </div>
                      <div style="width: 120px;">
                        <q-card flat bordered class="my-card">
                          <q-card-section
                            style="display: flex; flex-direction: column; align-items: center; text-align: center; height: 100px; cursor: pointer; padding-bottom: 0px;"
                            @click="downloadDocument('habeas_data')"
                          >
                            <span>H. Data</span>
                            <q-icon size="xl" color="purple" name="description" />
                            <q-tooltip :delay="100" :offset="[0, 10]">Descargar Política de Tratamiento de Datos Personales (Habeas Data)</q-tooltip>
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
</template>

  <script>
  import StudioService from 'src/services/StudioService'
  import StudioRoomService from 'src/services/StudioRoomService'
  import LocationService from 'src/services/LocationService'
  import StudioShiftService from 'src/services/StudioShiftService'
  import { xMisc } from 'src/mixins/xMisc.js'
  import { sGate } from 'src/mixins/sGate.js'

  export default {
    name: 'StudioModelForm',
    mixins: [xMisc, sGate],
    props: {
      modelValue: {
        type: Object,
        required: true
      },
      readonlyFields: {
        type: Object,
        required: false,
        default: () => {
          return {
            std_id: false,
            stdroom_id: false,
            user_id_model: false,
            start_at: false,
            finish_at: false,
            active: false,
            percent: false,
            rtefte: false,
            created_at: false,
            stdshift_id: false,
            commission_type: false,
            goal: false,
            contract_type: false,
            contract_number: false,
            position: false,
            area: false,
            country: false,
            department: false,
            city_id: false
          }
        }
      },
      mode: {
        type: String,
        default: 'create'
      },
    },
    data () {
      return {
        sUser: {},
        initTitle: 'Crear contrato',
        studios: [],
        studiosRooms: [],
        usersModel: [],
        studiosShifts: [],
        countries: [],
        departments: [],
        cities: [],
        arlOptions: [
          { label: 'Clase I (0.522%)', value: 'I' },
          { label: 'Clase II (1.044%)', value: 'II' },
          { label: 'Clase III (2.436%)', value: 'III' },
          { label: 'Clase IV (4.350%)', value: 'IV' },
          { label: 'Clase V (6.960%)', value: 'V' }
        ]
      }
    },
    computed: {
      studioModel: {
        get() {
          return this.modelValue
        },
        set(value) {
          this.$emit('update:modelValue', value)
        }
      },
      isModel() {
        return this.studioModel.contract_type === 'MANDANTE - MODELO'
      },
      formattedMonthlySalary: {
        get() {
          return this.milesFixed(this.studioModel.monthly_salary)
        },
        set(value) {
          // Este setter se maneja en updateMonthlySalary
        }
      },
      formattedDailySalary() {
        return this.milesFixed(this.studioModel.daily_salary)
      },
      formattedDotacionAmount: {
        get() {
          return this.milesFixed(this.studioModel.dotacion_amount)
        },
        set(value) {
          // Este setter se maneja en updateDotacionAmount
        }
      }
    },
    watch: {
      'studioModel.country.value': {
        handler(newValue) {
          if (newValue) {
            this.updateDepartments()
          }
        },
        immediate: false
      },
      'studioModel.department.value': {
        handler(newValue) {
          if (newValue) {
            this.updateCities()
          }
        },
        immediate: false
      },
      'studioModel.std_id.value': {
        handler(newValue) {
          if (newValue) {
            this.updatedStudio()
          }
        },
        immediate: true
      }
    },
    mounted () {
      this.sUser = this.decryptSession('user')
      this.getSelects()
    },
    methods: {
      async getSelects () {
        var response
        // studios
        this.studios = []
        this.studios.push({
          label: '',
          value: '',
        })
        response = await StudioService.getStudios({query: 'std_active=true', token: this.decryptSession('token') })
        for (var u = 0; u < response.data.data.length; u++) {
          var countryObj = { label: '', value: '' }
          var departmentObj = { label: '', value: '' }
          var cityObj = { label: '', value: '' }
          if (response.data.data[u].city !== null) {
            countryObj = { label: response.data.data[u].city.department.country.country_name, value: response.data.data[u].city.department.country.country_id }
            departmentObj = { label: response.data.data[u].city.department.dpto_name, value: response.data.data[u].city.department.dpto_id }
            cityObj = { label: response.data.data[u].city.city_name, value: response.data.data[u].city.city_id }
          }
          this.studios.push({
            label: response.data.data[u].std_name,
            value: response.data.data[u].std_id,
            country: countryObj,
            department: departmentObj,
            city: cityObj
          })
        }
        // countries
        response = await LocationService.getCountries({ token: this.decryptSession('token') })
        for (var u = 0; u < response.data.data.length; u++) {
          this.countries.push({
            label: response.data.data[u].country_name,
            value: response.data.data[u].country_id
          })
        }
      },
      async updateDepartments () {
        this.departments = []
        var response = await LocationService.getDepartments({ country_id: this.studioModel.country.value, token: this.decryptSession('token') })
        for (var u = 0; u < response.data.data.length; u++) {
          this.departments.push({
            label: response.data.data[u].dpto_name,
            value: response.data.data[u].dpto_id
          })
        }
        // solo limpiar campo si no vienen de getData()
        if (typeof this.studioModel.country?.clearfields === 'undefined' || this.studioModel.country?.clearfields === true) {
          this.studioModel.department = { label: '', value: '' }
          this.studioModel.city_id = { label: '', value: '' }
          this.cities = []
        }
      },
      async updateCities () {
        this.cities = []
        var response = await LocationService.getCities({ dpto_id: this.studioModel.department.value, token: this.decryptSession('token') })
        for (var u = 0; u < response.data.data.length; u++) {
          this.cities.push({
            label: response.data.data[u].city_name,
            value: response.data.data[u].city_id
          })
        }
        // solo limpiar campo si no vienen de getData()
        if (typeof this.studioModel.department?.clearfields === 'undefined' || this.studioModel.department?.clearfields === true) {
          this.studioModel.city_id = { label: '', value: '' }
        }
      },
      async studioSuggestLocations () {
        if (this.studioModel.std_id?.country?.value !== '') {
          let countryObj = this.studioModel.std_id.country
          countryObj.clearfields = false
          this.studioModel.country = countryObj

          let departmentObj = this.studioModel.std_id.department
          departmentObj.clearfields = false
          this.studioModel.department = departmentObj

          let cityObj = this.studioModel.std_id.city
          cityObj.clearfields = false
          this.studioModel.city_id = cityObj
        } else {
          this.studioModel.department = { label: '', value: '' }
          this.studioModel.city_id = { label: '', value: '' }
          this.departments = []
          this.cities = []
        }
      },
      async getStudioShifts () {
        // studiosShifts
        this.studiosShifts = []
        this.studiosShifts.push({
          label: '',
          value: '',
        })
        // async
        const response = await StudioShiftService.getStudiosShifts({ query: 'std_id=' + this.studioModel.std_id.value, token: this.decryptSession('token') })
        for (var u = 0; u < response.data.data.length; u++) {
          this.studiosShifts.push({
            label: response.data.data[u].stdshift_name,
            value: response.data.data[u].stdshift_id,
          })
        }
      },
      async getStudioRooms () {
        // studiosRooms
        this.studiosRooms = []
        this.studiosRooms.push({
          label: '',
          value: '',
        })
        // async
        const response = await StudioRoomService.getStudiosRooms({ query: 'std_id=' + this.studioModel.std_id.value, token: this.decryptSession('token') })
        for (var u = 0; u < response.data.data.length; u++) {
          this.studiosRooms.push({
            label: response.data.data[u].stdroom_name,
            value: response.data.data[u].stdroom_id,
          })
        }
      },
      updatedStudio () {
        if (this.mode === 'create_stepper' || this.mode === 'create') {
          this.studioSuggestLocations()
        }
        this.getStudioRooms()
        this.getStudioShifts()
      },
      downloadDocument(type) {
        var url = this.getApiUrl('/api/studios_models/pdf/' + type +'/' + this.studioModel.id + '?access_token=' + this.decryptSession('token') + '&type=' + type)
        var win = window.open(url, '_blank')
        win.focus()
      },
      calculateDailySalary() {
        if (this.studioModel.monthly_salary && this.studioModel.monthly_salary > 0) {
          const today = new Date()
          const month = today.getMonth() + 1 // JavaScript months are 0-based
          const year = today.getFullYear()
          const daysInMonth = new Date(year, month, 0).getDate()
          this.studioModel.daily_salary = Math.round((this.studioModel.monthly_salary / daysInMonth) * 100) / 100
        } else {
          this.studioModel.daily_salary = null
        }
      },

      // Función para formatear números sin ceros adelante
      milesFixed(input) {
        if (input == null || input === undefined || input === '') {
          return ''
        }

        const num = parseFloat(input)
        if (isNaN(num)) {
          return ''
        }

        return num.toLocaleString('es-CO', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        })
      },

      // Método para actualizar salario mensual desde el input formateado
      updateMonthlySalary(formattedValue) {
        // Remover formato (puntos y comas) para obtener el número
        const numericValue = parseFloat(formattedValue.replace(/[,.]/g, '')) || 0
        this.studioModel.monthly_salary = numericValue
        this.calculateDailySalary()
      },

      // Método para actualizar dotación desde el input formateado
      updateDotacionAmount(formattedValue) {
        // Remover formato (puntos y comas) para obtener el número
        const numericValue = parseFloat(formattedValue.replace(/[,.]/g, '')) || 0
        this.studioModel.dotacion_amount = numericValue
      }
    }
  }
  </script>

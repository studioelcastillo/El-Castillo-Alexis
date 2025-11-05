<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card">
          <q-form
              @submit="onSubmit"
              class="q-gutter-md"
            >
            <q-card-section v-if="!isDialog">
              <div class="q-px-md q-gutter-sm">
                <q-btn color="black" @click="goTo('studios_models')" :label="'&lt; ' + 'Regresar'" />
              </div>
            </q-card-section>

            <q-separator v-if="!isDialog" class="q-my-none" inset />

            <q-card-section v-if="isDialog" class="row items-center q-pb-none">
              <h5 class="is-size-3">{{initTitle}}</h5>
              <q-space />
              <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>

            <q-separator v-if="isDialog" inset />
            <studio-model-form-fields
              v-model="studioModel"
              :readonly-fields="readonlyFields"
              :mode="mode"
            />

            <q-separator inset />

            <q-card-section v-if="mode == 'create' || mode == 'edit'">
              <div>
                <q-btn type="submit" class="bg-primary text-white submit1" label="Enviar"/>
                <q-btn v-if="mode == 'edit'" @click="(isDialog) ? this.$emit('close') : this.mode = 'show';" label="Cancelar" />
                <q-btn v-else @click="(isDialog) ? this.$emit('close') : goTo('studios_models')" label="Cancelar" />
              </div>
            </q-card-section>
            <q-card-section v-else-if="mode == 'show' && openGate('edit-studios_models', sUser.prof_id)">
              <div>
                <q-btn v-if="openGate('edit-studios_models', sUser.prof_id)" class="bg-primary text-white submit1" label="Editar" @click="this.mode = 'edit'" />
              </div>
            </q-card-section>
          </q-form>
        </q-card>
        <!-- Secciones de modelos - solo para MANDANTE - MODELO -->
        <ModelsAccounts v-if="isModel && (this.mode == 'show' || this.mode == 'edit') && studioModel.id > 0 && openGate('menu-models_accounts', sUser.prof_id)" :is-subgrid="true" :parent-mode="mode" parent-table="studios_models" parent-field="stdmod_id" :parent-id="studioModel.id" @close="$emit('close')" />
        <ModelsGoals v-if="isModel && (this.mode == 'show' || this.mode == 'edit') && studioModel.id > 0 && openGate('menu-models_goals', sUser.prof_id)" :is-subgrid="true" :parent-mode="mode" parent-table="studios_models" parent-field="stdmod_id" :parent-id="studioModel.id" />
        <!--<ModelsTransactions v-if="(this.mode == 'show' || this.mode == 'edit') && studioModel.id > 0" :is-subgrid="true" :parent-mode="mode" parent-table="studios_models" parent-field="stdmod_id" :parent-id="studioModel.id" />-->
        <Payments v-if="isModel && (this.mode == 'show' || this.mode == 'edit') && studioModel.id > 0" :is-subgrid="true" :parent-mode="mode" parent-table="studios_models" parent-field="stdmod_id" :parent-id="studioModel.id" />
      </div>
    </div>
  </div>
</template>

<script>
import StudioModelService from 'src/services/StudioModelService'
import ModelsAccounts from 'src/pages/ModelAccount/ModelsAccounts.vue'
import ModelsGoals from 'src/pages/ModelGoal/ModelsGoals.vue'
import StudioModelFormFields from './StudioModelFormFields.vue'
import Payments from 'src/pages/Payment/Payments.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'StudioModelForm',
  mixins: [xMisc, sGate],
  components: {
    ModelsAccounts,
    ModelsGoals,
    Payments,
    StudioModelFormFields
  },
  props: {
    isDialog: {
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
    },
    dialogChildId: {
      type: Number,
      default: null
    },
    modeprop: {
      type: String,
      default: ''
    },
    userModel: {
      type: Object,
      default: function () {
        return {
          value: 0,
          label: ''
        }
      }
    }
  },
  data () {
    return {
      sUser: {},
      mode: (this.$route.params.id) ? 'edit' : 'create',
      studioModel: {
        id: 0,
        std_id: '',
        stdroom_id: '',
        user_id_model: '',
        start_at: '',
        finish_at: '',
        active: true,
        percent: '',
        rtefte: '',
        created_at: '',
        stdshift_id: '',
        commission_type: '',
        goal: '',
        contract_type: 'MANDANTE - MODELO',
        contract_number: '',
        position: '',
        area: '',
        country: { label: '', value: '' },
        department: { label: '', value: '' },
        city_id: { label: '', value: '' },
        // Campos de nómina
        monthly_salary: null,
        biweekly_salary: null,
        daily_salary: null,
        dotacion_amount: 100000,
        has_sena: false,
        has_caja_compensacion: false,
        has_icbf: false,
        arl_risk_level: 'I'
      },
      readonlyFields: {
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
      },
      initTitle: 'Crear contrato'
    }
  },
  mounted () {
    this.sUser = this.decryptSession('user')

    // if mode is sended from modeprop
    if (this.modeprop != '') {
      this.mode = this.modeprop
    // if mode is sended from subgrid
    } else if ((this.$route.params.id && !this.isDialog) || (this.isDialog && this.parentId !== null && this.dialogChildId !== null)) {
      this.mode = 'edit'
    }

    if (this.mode === 'edit' || this.mode === 'show') {
      this.studioModel.id = (this.isDialog) ? this.dialogChildId : this.$route.params.id
      this.getData()
    } else {
      this.studioModel.user_id_model = this.userModel
    }
  },
  computed: {
    isModel() {
      return this.studioModel.contract_type === 'MANDANTE - MODELO'
    }
  },
  methods: {
    async onSubmit () {
      try {
        console.log("sdfsf", this.userModel)
        this.activateLoading('Cargando')
        // var response = {}
        // POST
        if (this.mode === 'create') {
          var record = await StudioModelService.addStudioModel({
            std_id: this.studioModel.std_id.value,
            stdroom_id: this.studioModel.stdroom_id.value,
            user_id_model: this.studioModel.user_id_model.value,
            stdmod_start_at: this.studioModel.start_at,
            stdmod_finish_at: this.studioModel.finish_at,
            stdmod_active: this.studioModel.active,
            stdmod_percent: this.studioModel.percent,
            stdmod_rtefte: this.studioModel.rtefte,
            stdshift_id: this.studioModel.stdshift_id.value,
            stdmod_commission_type: this.studioModel.commission_type,
            stdmod_goal: this.studioModel.goal,
            stdmod_contract_type: this.studioModel.contract_type,
            stdmod_position: this.studioModel.position,
            stdmod_area: this.studioModel.area,
            city_id: this.studioModel.city_id.value,
            // Campos de nómina
            stdmod_monthly_salary: this.studioModel.monthly_salary,
            stdmod_biweekly_salary: this.studioModel.biweekly_salary,
            stdmod_daily_salary: this.studioModel.daily_salary,
            stdmod_dotacion_amount: this.studioModel.dotacion_amount,
            stdmod_has_sena: this.studioModel.has_sena,
            stdmod_has_caja_compensacion: this.studioModel.has_caja_compensacion,
            stdmod_has_icbf: this.studioModel.has_icbf,
            stdmod_arl_risk_level: this.studioModel.arl_risk_level,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Creado')
          this.studioModel.id = record.data.data.stdmod_id
        } else if (this.mode === 'edit') {
          var record = await StudioModelService.editStudioModel({
            id: (this.isDialog) ? this.dialogChildId : this.studioModel.id,
            std_id: this.studioModel.std_id.value,
            stdroom_id: this.studioModel.stdroom_id.value,
            user_id_model: this.studioModel.user_id_model.value,
            stdmod_start_at: this.studioModel.start_at,
            stdmod_finish_at: this.studioModel.finish_at,
            stdmod_active: this.studioModel.active,
            stdmod_percent: this.studioModel.percent,
            stdmod_rtefte: this.studioModel.rtefte,
            stdshift_id: this.studioModel.stdshift_id.value,
            stdmod_commission_type: this.studioModel.commission_type,
            stdmod_goal: this.studioModel.goal,
            stdmod_contract_type: this.studioModel.contract_type,
            stdmod_position: this.studioModel.position,
            stdmod_area: this.studioModel.area,
            city_id: this.studioModel.city_id.value,
            // Campos de nómina
            stdmod_monthly_salary: this.studioModel.monthly_salary,
            stdmod_biweekly_salary: this.studioModel.biweekly_salary,
            stdmod_daily_salary: this.studioModel.daily_salary,
            stdmod_dotacion_amount: this.studioModel.dotacion_amount,
            stdmod_has_sena: this.studioModel.has_sena,
            stdmod_has_caja_compensacion: this.studioModel.has_caja_compensacion,
            stdmod_has_icbf: this.studioModel.has_icbf,
            stdmod_arl_risk_level: this.studioModel.arl_risk_level,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Actualizado')
        }
        // if can edit >> edit, else >> show
        this.mode = (this.openGate('edit-studios_models', this.sUser.prof_id)) ? 'edit' : 'show'
        if (this.isDialog) {
          this.$emit('save')
          this.getData()
        } else {
          this.goTo('studios_models/' + this.mode + '/' + this.studioModel.id)
          this.getData()
        }
        this.disableLoading()
      } catch (error) {
        console.log(error)
        this.disableLoading()
        if (error.response && error.response.data.error && error.response.data.error.code && error.response.data.error.message) {
          if (error.response.data.error.code === 'UNEXPECTED_ERROR') {
            this.alert('negative', error.response.data.error.message)
          } else {
            this.alert('warning', error.response.data.error.message)
          }
        } else {
          this.errorsAlerts(error)
        }
      }
    },
    async getData () {
      if (this.mode === 'edit') {
        this.initTitle = 'Editar contrato'
      } else if (this.mode === 'show') {
        this.initTitle = 'Ver contrato'
      }

      try {
        this.activateLoading('Cargando')
        var response = await StudioModelService.getStudioModel({ id: this.studioModel.id, token: this.decryptSession('token') })
        this.studioModel.id = response.data.data[0].stdmod_id
        this.studioModel.start_at = response.data.data[0].stdmod_start_at
        this.studioModel.finish_at = response.data.data[0].stdmod_finish_at
        this.studioModel.active = response.data.data[0].stdmod_active
        this.studioModel.percent = response.data.data[0].stdmod_percent
        this.studioModel.rtefte = response.data.data[0].stdmod_rtefte
        this.studioModel.created_at = response.data.data[0].created_at
        this.studioModel.commission_type = response.data.data[0].stdmod_commission_type
        this.studioModel.goal = response.data.data[0].stdmod_goal
        this.studioModel.contract_type = response.data.data[0].stdmod_contract_type
        this.studioModel.contract_number = response.data.data[0].stdmod_contract_number
        this.studioModel.position = response.data.data[0].stdmod_position
        this.studioModel.area = response.data.data[0].stdmod_area

        // Cargar campos de nómina
        this.studioModel.monthly_salary = response.data.data[0].stdmod_monthly_salary
        this.studioModel.biweekly_salary = response.data.data[0].stdmod_biweekly_salary
        this.studioModel.daily_salary = response.data.data[0].stdmod_daily_salary
        this.studioModel.dotacion_amount = response.data.data[0].stdmod_dotacion_amount || 100000
        this.studioModel.has_sena = response.data.data[0].stdmod_has_sena || false
        this.studioModel.has_caja_compensacion = response.data.data[0].stdmod_has_caja_compensacion || false
        this.studioModel.has_icbf = response.data.data[0].stdmod_has_icbf || false
        this.studioModel.arl_risk_level = response.data.data[0].stdmod_arl_risk_level || 'I'
        if (response.data.data[0].studio) {
          // this.studios.push({
          //   label: response.data.data[0].studio.std_name,
          //   value: response.data.data[0].studio.std_id,
          // })
          this.studioModel.std_id = {
            label: response.data.data[0].studio.std_name,
            value: response.data.data[0].studio.std_id,
          }
        }
        if (response.data.data[0].studio_room) {
          this.studioModel.stdroom_id = {
            label: response.data.data[0].studio_room.stdroom_name,
            value: response.data.data[0].studio_room.stdroom_id,
          }
        }
        if (response.data.data[0].user_model) {
          this.studioModel.user_id_model = {
            label: response.data.data[0].user_model.user_name + ' ' + response.data.data[0].user_model.user_name2 + ' ' + response.data.data[0].user_model.user_surname + ' ' + response.data.data[0].user_model.user_surname2,
            value: response.data.data[0].user_model.user_id,
          }
        }
        if (response.data.data[0].studio_shift) {
          this.studioModel.stdshift_id = {
            label: response.data.data[0].studio_shift.stdshift_name,
            value: response.data.data[0].studio_shift.stdshift_id,
          }
        }
        if (response.data.data[0].city) {
          this.studioModel.country = { 
            label: response.data.data[0].city.department.country.country_name, 
            value: response.data.data[0].city.department.country.country_id, 
            clearfields: false 
          }
          this.studioModel.department = { 
            label: response.data.data[0].city.department.dpto_name, 
            value: response.data.data[0].city.department.dpto_id, 
            clearfields: false 
          }
          this.studioModel.city_id = { 
            label: response.data.data[0].city.city_name, 
            value: response.data.data[0].city.city_id 
          }
        }
        this.disableLoading()
      } catch (error) {
        this.errorsAlerts(error)
        this.disableLoading()
      }
    },
    downloadContrato(type) {
      var url = this.getApiUrl('/api/studios_models/contract/pdf/' + this.studioModel.id + '?access_token=' + this.decryptSession('token') + '&type=' + type)
      var win = window.open(url, '_blank')
      win.focus()
    },
    toggleInstructions () {
      // if (this.needHelp) {
      //   this.needHelp = false
      //   this.helpText = 'Ayuda'
      // } else {
      //   this.needHelp = true
      //   this.helpText = 'Cerrar ayuda'
      // }
    }
  }
}
</script>

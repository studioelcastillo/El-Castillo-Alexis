<template>
  <q-dialog :model-value="dialogShow" @update:model-value="$emit('update:dialogShow', $event)">
    <q-card style="min-width: 50%">
      <q-form @submit="onSubmit">
        <q-card-section>
          <div class="text-h6">{{ dialogTitle }}</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div class="row q-col-gutter-sm">
            <div v-if="parentId !== null || Object.keys(setToEditProps).length > 0" class="col-xs-12 col-sm-12">
              <q-radio v-model="typeRelation" :val="1" label="Usuario" />
              <q-radio v-model="typeRelation" :val="2" label="Estudio" />
              <br>
            </div>
            <div v-if="typeRelation === 2" class="col-xs-12 col-sm-12">
              <q-select
                filled
                v-model="selectedStudio"
                label="Estudio"
                label-color="primary"
                :options="studios"
                lazy-rules
                :rules="[
                  val => !!val || 'Este campo es requerido',
                ]"
              />
            </div>
            <div v-if="typeRelation === 1" class="col-xs-12 col-sm-12">
              <q-select
                filled
                v-model="selectedProfile"
                label="Perfil"
                label-color="primary"
                :options="profiles"
                lazy-rules
              /><br>
            </div>
            <div v-if="typeRelation === 1" class="col-xs-12 col-sm-12">
              <gk-select-d-b-request
                v-model="selectedUser"
                selectRequestLabel="Usuario"
                :fetchOptionsFn="getUsersByOwnerStudio"
                @update:model-value="onUpdateModelValue"
                lazy-rules
                :rules="[
                  val => !!val || 'Este campo es requerido',
                ]"
              />
              <br>
            </div>
            <div v-if="typeRelation === 1" class="col-xs-12 col-sm-12">
              <q-select
                v-if="stdmodOptions.length > 0"
                v-model="selectedStdmod"
                :options="stdmodOptions"
                label="Contrato"
                label-color="primary"
                filled
                lazy-rules
                :rules="[
                  val => !!val || 'Este campo es requerido',
                ]"
              />
            </div>
            <div v-if="typeRelation === 1" class="col-xs-12 col-sm-12">
              <q-select
                v-if="setupCommissionOptions.length > 0"
                v-model="selectedSetupCommission"
                :options="setupCommissionOptions"
                label="Setup Comisión"
                label-color="primary"
                filled
              />
            </div>
            <div class="col-xs-12 col-sm-12">
              <br>
              <q-input
                filled
                v-model="expiredDate"
                label="Fecha de expiración"
                label-color="primary"
                mask="date"
                :rules="[
                  val => this.validateDateFormat(val) || 'El formato de fecha no es válida'
                ]"
                readonly
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="expiredDate">
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Close" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
            <!-- <div v-if="typeRelation === 1" class="col-xs-12 col-sm-12">
              <q-checkbox dense v-model="selectedTrackBeyondChilds" label="Permitirle ver unicamente hijos directos" color="teal" />
            </div> -->
          </div>
        </q-card-section>
        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn flat label="Enviar" type="submit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script>
import CommissionService from 'src/services/CommissionService'
import UserService from 'src/services/UserService'
import StudioService from 'src/services/StudioService'
import ProfileService from 'src/services/ProfileService'
import SetupCommissionService from 'src/services/SetupCommissionService'
import GkSelectDBRequest from 'src/components/GkSelectDBRequest.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'DialogComissionTreeForm',
  mixins: [xMisc, sGate],
  components: { GkSelectDBRequest},
  data () {
    return {
      id: 0,
      selectedUser: null,
      selectedStudio: null,
      selectedSetupCommission: null,
      selectedStdmod: null,
      selectedProfile: null,
      selectedTrackBeyondChilds : false,
      expiredDate: '',
      stdmodOptions: [],
      setupCommissionOptions: [], 
      typeRelation: 1,
      studios: [],
      profiles: []
    }
  },
  async mounted () {
    await this.loadSetupCommissionOptions()
    await this.getProfiles()
    await this.getStudios()
  },
  props: {
    dialogShow: {
      type: Boolean,
      required: true
    },
    dialogTitle: {
      type: String,
      default: 'Crear relación'
    },
    parentId: {
      type: Number,
      default: null
    },
    setToEditProps: {
      type: Object,
      default: null
    }
  },
  watch: {
    parentId(newVal) {
      if (newVal === null) {
        this.typeRelation = (newVal === null) ? 1 : this.typeRelation;
      }
    },
    dialogShow(newVal) {
      if (!newVal) {
        this.stdmodOptions = []
        this.selectedUser = null
        this.selectedStudio = null
        this.selectedStdmod = null
        this.selectedSetupCommission = null
        this.selectedTrackBeyondChilds = false
        this.expiredDate = ''
        this.$emit('update:setToEditProps', {})
      }
    },
    setToEditProps (newVal) {
      //console.log('setToEditProps', newVal)
      if (newVal && Object.keys(newVal).length > 0) {
        if(newVal.std_id !== null) {
          this.typeRelation = 2
          this.selectedStudio = { label: newVal.std_name, value: newVal.std_id }
        } else {
          this.typeRelation = 1
          this.selectedTrackBeyondChilds = !newVal.comm_track_beyond_childs
          this.selectedUser = newVal.user_id ? { label: newVal.user_name + " (" + newVal.user_identification + ")", value: newVal.user_id, user_id: newVal.user_id } : null
          UserService.getUserStdmods({ id: newVal.user_id, token: this.decryptSession('token') }).then(res => {
            this.stdmodOptions = res.data.data.map(sm => ({
              label: `${sm.studio.std_name} con contrato ${sm.stdmod_contract_number}`,
              value: sm.stdmod_id
            }))
          }).catch(error => {
            console.error('Error al obtener usuario:', error)
          })
          this.selectedStdmod = newVal.stdmod_id ? { label: `${ newVal.std_name2 } con contrato ${newVal.stdmod_contract_number}` , value: newVal.stdmod_id } : null
          this.selectedSetupCommission = (newVal.setcomm_id) ? { label: newVal.setcomm_title + " (" + newVal.setcomm_std_name + ")", value: parseInt(newVal.setcomm_id) } : null  
        }
        this.expiredDate = newVal.comm_expire_date ? newVal.comm_expire_date : ''
        this.id = newVal.comm_id
      }
    }
  },
  methods: {
    async loadSetupCommissionOptions () {
      try {
        const res = await SetupCommissionService.getSetupCommissionOptions({ token: this.decryptSession('token') })
        this.setupCommissionOptions = res.data.data || []
        this.setupCommissionOptions.unshift({ label: '', value: null })
      } catch (e) {
        this.setupCommissionOptions = []
      }
    },
    async onSubmit () {
      try {
        this.activateLoading('Cargando')
        if (Object.keys(this.setToEditProps).length > 0) {
          await CommissionService.editRelation({
            id: this.id,
            stdmod_id: (this.typeRelation == 1) ? this.selectedStdmod.value : null,
            std_id: (this.typeRelation == 2) ? this.selectedStudio.value : null,
            setcomm_id: (this.selectedSetupCommission) ? this.selectedSetupCommission.value : null,
            comm_track_beyond_childs: !this.selectedTrackBeyondChilds,
            comm_expire_date: this.expiredDate,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Relación modificada')
        } else {
          await CommissionService.addRelation({ 
            commparent_id: this.parentId,
            stdmod_id: (this.typeRelation == 1) ? this.selectedStdmod.value : null,
            std_id: (this.typeRelation == 2) ? this.selectedStudio.value : null,
            setcomm_id: (this.selectedSetupCommission) ? this.selectedSetupCommission.value : null,
            comm_track_beyond_childs: !this.selectedTrackBeyondChilds,
            comm_expire_date: this.expiredDate,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Relación creada')
        }
        
        
        this.disableLoading()
      } catch (error) {
        this.disableLoading()
        this.errorsAlerts(error)
      }
      this.$emit('update:setToEditProps', {})
      this.$emit('update:dialogShow', false)
      this.$emit('refresh-relations')
    },
    async getUsersByOwnerStudio (val) {
      // Enviar prof_id si hay perfil seleccionado
      const prof_id = this.selectedProfile ? this.selectedProfile.value : '';
      return UserService.getUsersByOwnerStudio({ search: val, prof_id, token: this.decryptSession('token') })
    },
    async getStudios (val) {
      try {
        this.studios = []
        const response = await StudioService.getStudios({query: 'std_active=true', token: this.decryptSession('token') })
        for (var u = 0; u < response.data.data.length; u++) {
          this.studios.push({ label: response.data.data[u].std_name, value: response.data.data[u].std_id })
        }
      } catch (error) {
        this.errorsAlerts(error)
        return []
      }
    },
    async getProfiles (val) {
      try {
        this.profiles = [{ label: '', value: null }]
        const response = await ProfileService.getProfiles({ token: this.decryptSession('token') })
        for (var u = 0; u < response.data.data.length; u++) {
          this.profiles.push({ label: response.data.data[u].prof_name, value: response.data.data[u].prof_id })
        }
      } catch (error) {
        this.errorsAlerts(error)
        return []
      }
    },
    onUpdateModelValue(val) {
      if (val) {
        this.stdmodOptions = val.studio_model.map(sm => ({ label: `${sm.studio.std_name} con contrato ${sm.stdmod_contract_number}`, value: sm.stdmod_id }))
        this.selectedStdmod = this.stdmodOptions[0] || null
      } else {
        this.stdmodOptions = []
        this.selectedStdmod = null
      }
    },
  }
}
</script>

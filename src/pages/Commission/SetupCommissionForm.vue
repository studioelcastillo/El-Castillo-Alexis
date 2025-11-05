<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card">
          <q-form @submit="onSubmit" class="q-gutter-md">
            <q-card-section>
              <div class="q-px-md q-gutter-sm">
                <q-btn color="black" @click="goTo('setup_commissions')" :label="'< ' + 'Regresar'" />
              </div>
            </q-card-section>
            <q-separator class="q-my-none" inset />
            <q-card-section>
              <h5 class="is-size-3">{{initTitle}}</h5>
              <br>
              <div class="row q-col-gutter-sm">
                <div class="col-xs-12 col-sm-12">
                  <q-select
                    filled
                    v-model="commission.std_id"
                    label="Estudio"
                    label-color="primary"
                    :options="studios"
                    lazy-rules
                    :rules="[val => !!val || 'Este campo es requerido']"
                    :readonly="mode == 'show'"
                  />
                </div>
                <div class="col-xs-12 col-sm-12">
                  <q-select filled v-model="commission.setcomm_type" label="Tipo" label-color="primary" :options="typeOptions" :readonly="mode == 'show'" />
                </div>
                <div class="col-xs-12 col-sm-12">
                  <q-input filled v-model="commission.setcomm_title" label="Título" label-color="primary" lazy-rules :rules="[val => !!val || 'Este campo es requerido', val => validateMaxLength(val, 255) || 'Máximo 255 caracteres']" :readonly="mode == 'show'" />
                </div>
                <div class="col-xs-12 col-sm-12">
                  <q-input filled v-model="commission.setcomm_description" label="Descripción" label-color="primary" type="textarea" :readonly="mode == 'show'" />
                </div>
              </div>
            </q-card-section>
            <q-separator inset />
            <q-card-section v-if="mode == 'create' || mode == 'edit'">
              <div>
                <q-btn type="submit" class="bg-primary text-white submit1" label="Enviar"/>
                <q-btn v-if="mode == 'edit'" @click="mode = 'show'" label="Cancelar" />
                <q-btn v-else @click="goTo('setup_commissions')" label="Cancelar" />
              </div>
            </q-card-section>
            <q-card-section v-else-if="mode == 'show'">
              <div>
                <q-btn v-if="openGate('edit-commissions', sUser.prof_id)" class="bg-primary text-white submit1" label="Editar" @click="mode = 'edit'" />
              </div>
            </q-card-section>
          </q-form>
        </q-card>
      </div>
    </div>
    <br>
    <q-card v-if="mode !== 'create'" flat bordered class="my-card">
      <q-card-section>
        <div class="text-h5 text-weight-bolder">Información de la comisión</div>
      </q-card-section>
      <q-separator inset />
      <q-card-section>
        <q-btn v-if="mode !== 'show'" color="teal" icon="add" label="Agregar" @click="showDialog = true; titleDialog = 'Nuevo item'; modeDialog = 'create'" />
        <br v-if="mode !== 'show'">
        <commission-item-bar :segments="segments" @edit-item="editCommissionItem" />
      </q-card-section>
    </q-card>
  </div>
  
  <q-dialog v-model="showDialog">
    <q-card flat bordered class="my-card">
      <q-card-section class="row items-center q-pb-none">
        <h5 class="is-size-3">{{ titleDialog }}</h5>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>
      <br>
      <q-separator />
      
      <q-card-section>
        <q-form @submit="onCommissionItemSubmit" class="q-gutter-md">
          <div class="row q-col-gutter-sm">
            <div class="col-xs-12 col-sm-12">
              <q-input
                v-model.number="commissionItem.limit"
                :label="(commission.setcomm_type === 'Porcentaje' && false) ? 'Limite %' : 'Limite'"
                filled
                type="number"
                step="0.01"
                min="0"
                :rules="[
                  val => val !== null && val !== '' || 'Este campo es requerido',
                  val => val === null || val === '' || val >= 0 || 'Debe ser mayor o igual a 0'
                ]"  
              />
            </div>
            <div class="col-xs-12 col-sm-12">
              <q-input
                v-model.number="commissionItem.value"
                :label="(commission.setcomm_type === 'Porcentaje') ? 'Valor de la comisión %' : 'Valor de la comisión'"
                filled
                type="number"
                step="0.01"
                :rules="[
                  val => val !== null && val !== '' || 'Este campo es requerido',
                  val => commission.setcomm_type === 'Porcentaje' ? (val <= 50 || 'El límite no puede ser mayor a 50') : true,
                ]"  
              />
            </div>
          </div>
          <div class="q-mt-md" style="display: flex;">
            <q-btn type="submit" color="primary" label="Enviar" />
            <q-btn flat label="Cancelar" @click="showDialog = false; modeDialog = 'create'" />
            <!-- <q-btn flat label="sdfs" class="q-ml-auto" @click="accionDerecha" /> -->
            <a v-if="modeDialog == 'edit'" class="q-ml-auto text-red" style="cursor: pointer;" @click="deleteCommissionItem">
              <q-icon size="md" name="delete"/>
              <q-tooltip :offset="[30, 0]" anchor="center left" self="center middle">Eliminar</q-tooltip>
            </a>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import StudioService from 'src/services/StudioService'
import SetupCommissionService from 'src/services/SetupCommissionService'
import CommissionItemBar from './CommissionItemBar.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'SetupCommissionForm',
  mixins: [xMisc, sGate],
  props: {
    modeprop: {
      type: String,
      default: ''
    }
  },
  components: {
    CommissionItemBar
  },
  data () {
    return {
      sUser: {},
      mode: 'create',
      initTitle: 'Crear configuración de comisión',
      commission: {
        id: 0,
        std_id: null,
        setcomm_title: '',
        setcomm_description: '',
        setcomm_type: 'Porcentaje',
      },
      studios: [],
      typeOptions: ['Porcentaje', 'Dolares', 'Pesos colombianos'],
      //dialog and items
      showDialog: false,
      modeDialog: 'create',
      titleDialog: 'Nuevo item',
      commissionItem: {
        id: 0,
        value: 0,
        limit: 0
      },
      segments: []
    }
  },
  mounted () {
    this.sUser = this.decryptSession('user')
    if (this.modeprop) {
      this.mode = this.modeprop
    }
    if (this.mode === 'edit' || this.mode === 'show') {
      this.commission.id = this.$route.params.id
      this.getData()
    }
    this.getSelects()
  },
  methods: {
    validateMaxLength(val, max) {
      return !val || val.length <= max
    },
    async onSubmit () {
      try {
        this.activateLoading('Cargando')
        if (this.mode === 'create' && this.openGate('add-commissions', this.sUser.prof_id)) {
          const form = this.commission
          form.std_id = (form.std_id.value !== -1) ? form.std_id.value : null // Ensure std_id is set correctly
          const record = await SetupCommissionService.addCommission({ ...form, token: this.decryptSession('token') })
          this.alert('positive', 'Creado')
          this.commission.id = record.data.data.setcomm_id
        } else if (this.mode === 'edit' && this.openGate('edit-commissions', this.sUser.prof_id)) {
          const form = this.commission
          form.std_id = (form.std_id.value !== '') ? form.std_id.value : null // Ensure std_id is set correctly
          const record = await SetupCommissionService.editCommission({ ...form, token: this.decryptSession('token') })
          this.alert('positive', 'Actualizado')
        }
        this.mode = (this.openGate('edit-commissions', this.sUser.prof_id)) ? 'edit' : 'show'
        this.goTo('setup_commissions/' + this.mode + '/' + this.commission.id)
        this.getData()
        this.disableLoading()
      } catch (error) {
        this.disableLoading()
        this.errorsAlerts(error)
      }
    },
    async getData () {
      if (this.mode === 'edit') {
        this.initTitle = 'Editar configuración comisión'
      } else if (this.mode === 'show') {
        this.initTitle = 'Ver configuración comisión'
      }
      try {
        this.activateLoading('Cargando')
        const response = await SetupCommissionService.getCommission({ id: this.commission.id, token: this.decryptSession('token') })
        this.segments = response.data.items
        Object.assign(this.commission, response.data.data)
        if (response.data.data.studio) {
          this.commission.std_id = { label: response.data.data.studio.std_name, value: response.data.data.studio.std_id }
        } else {
          this.commission.std_id = { label: 'Estudio base', value: -1 }
        }
        this.disableLoading()
      } catch (error) {
        this.errorsAlerts(error)
        this.disableLoading()
      }
    },
    async onCommissionItemSubmit () {
      try {
        this.activateLoading('Cargando')
        if (this.modeDialog === 'create' && this.openGate('add-commissionsitem', this.sUser.prof_id)) {
          const record = await SetupCommissionService.addCommissionItem({
            setcomm_id: this.commission.id,
            setcommitem_value: this.commissionItem.value,
            setcommitem_limit: this.commissionItem.limit,
            token: this.decryptSession('token')
          })
        } else if (this.modeDialog === 'edit' && this.openGate('edit-commissionsitem', this.sUser.prof_id)) {
          const record = await SetupCommissionService.editCommissionItem({ 
            id: this.commissionItem.id,
            setcommitem_value: this.commissionItem.value,
            setcommitem_limit: this.commissionItem.limit,
            token: this.decryptSession('token')
          })
        }
        this.showDialog = false
        this.commissionItem = { id: 0, value: 0, limit: 0 }
        this.getData()
        this.disableLoading()
      } catch (error) {
        this.disableLoading()
        this.errorsAlerts(error)
      }
    },
    editCommissionItem (index) {
      if(this.mode === 'show') return
      this.titleDialog = 'Editar item'
      this.modeDialog = 'edit'
      this.commissionItem = { value: this.commission.items[index].setcommitem_value, limit: this.commission.items[index].setcommitem_limit, id: this.commission.items[index].setcommitem_id }
      this.showDialog = true
    },
    deleteCommissionItem () {
      this.$q.dialog({
        title: 'Eliminar item',
        message: '¿Estás seguro de eliminar este item?',
        cancel: true,
        persistent: true
      }).onOk(async () => {
        try {
          this.activateLoading('Cargando')
          if (this.openGate('delete-commissionsitem', this.sUser.prof_id)) {
            await SetupCommissionService.deleteCommissionItem({ id: this.commissionItem.id, token: this.decryptSession('token') })
            this.alert('positive', 'Item eliminado')
            this.getData()
            this.showDialog = false
            this.commissionItem = { id: 0, value: 0, limit: 0 }
          }
          this.disableLoading()
        } catch (error) {
          this.disableLoading()
          this.errorsAlerts(error)
        }
      })
    },
    async getSelects () {
      // studios
      this.studios = []
      //this.studios.push({ label: 'Estudio base', value: -1 })
      const response = await StudioService.getStudios({query: 'std_active=true', token: this.decryptSession('token') })
      console.log(response)
      for (var u = 0; u < response.data.data.length; u++) {
        this.studios.push({
          label: response.data.data[u].std_name,
          value: response.data.data[u].std_id
        })
      }
    },
  }
}
</script>

<style type="text/css">
  body {
    background: #ECF0F3;
  }
</style>

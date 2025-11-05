<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12" v-if="(this.openGate('add-studios', this.sUser.prof_id) || 
          (this.openGate('show-studios', this.sUser.prof_id)) || 
          (this.openGate('edit-studios', this.sUser.prof_id) && this.mode == 'edit')) && !disableView"
      >
        <q-card flat bordered class="my-card">
          <q-form
              @submit="onSubmit"
              class="q-gutter-md"
            >
            <q-card-section v-if="!isDialog">
              <div class="q-px-md q-gutter-sm">
                <q-btn color="black" @click="goTo('studios')" :label="'&lt; ' + 'Regresar'" />
              </div>
            </q-card-section>

            <q-separator v-if="!isDialog" class="q-my-none" inset />

            <q-card-section v-if="isDialog" class="row items-center q-pb-none">
              <h5 class="is-size-3">{{initTitle}}</h5>
              <q-space />
              <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>

            <q-separator v-if="isDialog" inset />

            <q-card-section>
              <h5 v-if="!isDialog" class="is-size-3">{{initTitle}}</h5>
              <br v-if="!isDialog">
              <div class="row q-col-gutter-sm">
                <div class="col-xs-12 col-sm-4">
                  <q-input
                    filled
                    type=""
                    v-model="studio.nit"
                    label="NIT"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.nit || (!openGate('edit-studios', sUser.prof_id) && !openGate('add-studios', sUser.prof_id))"
                  />
                </div>
                <div class="col-xs-12 col-sm-4">
                  <q-input
                    filled
                    type=""
                    v-model="studio.verification_digit"
                    label="Digito de verificación"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => this.validateMaxLength(val, 1) || 'Máximo 1 caracter',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.verification_digit || (!openGate('edit-studios', sUser.prof_id) && !openGate('add-studios', sUser.prof_id))"
                  />
                </div>

                <div class="col-xs-12 col-sm-4">
                  <q-input
                    filled
                    type=""
                    v-model="studio.name"
                    label="Nombre estudio"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.name || (!openGate('edit-studios', sUser.prof_id) && !openGate('add-studios', sUser.prof_id))"
                  />
                </div>
                <div class="col-xs-12 col-sm-4">
                  <q-input
                    filled
                    type=""
                    v-model="studio.address"
                    label="Dirección"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.address || (!openGate('edit-studios', sUser.prof_id) && !openGate('add-studios', sUser.prof_id))"
                  />
                </div>
                <div class="col-xs-12 col-sm-4">
                  <q-input
                    filled
                    type=""
                    v-model="studio.company_name"
                    label="Razón social"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.company_name || (!openGate('edit-studios', sUser.prof_id) && !openGate('add-studios', sUser.prof_id))"
                  />
                </div>
                <div class="col-xs-12 col-sm-4">
                  <q-select
                    filled
                    v-model="studio.user_id_owner"
                    label="Propietario"
                    label-color="primary"
                    use-input
                    hide-selected
                    fill-input
                    :options="users"
                    @filter="getUsers"
                    hint="Digitar al menos 3 caracteres para seleccionar usuario"
                    :readonly="mode == 'show' || readonlyFields.user_id_owner || (!openGate('edit-studios', sUser.prof_id) && !openGate('add-studios', sUser.prof_id))"
                  >
                    <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          Sin resultados
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                  <br>
                </div>

                <!--
                <div class="col-xs-12 col-sm-4">
                  <q-select
                    filled
                    v-model="studio.shifts"
                    label="Turnos"
                    label-color="primary"
                    :options="['', 'MANANA_TARDE_NOCHE', '12_HORAS', '4_HORAS']"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.shifts || (!openGate('edit-studios', sUser.prof_id) && !openGate('add-studios', sUser.prof_id))"
                  />
                </div>-->

                <div class="col-xs-12 col-sm-6">
                  <q-input
                    filled
                    type="number"
                    v-model="studio.percent"
                    label="Porcentaje de ingreso"
                    label-color=""
                    lazy-rules
                    step="any"
                    :rules="[
                    ]"
                    :readonly="mode == 'show' || readonlyFields.percent || (!openGate('edit-studios', sUser.prof_id) && !openGate('add-studios', sUser.prof_id))"
                  />
                  <br>
                </div>

                <div class="col-xs-12 col-sm-6">
                  <q-select
                    filled
                    v-model="studio.liquidation_interval"
                    label="Intervalo de Liq. (Comisiones)"
                    label-color="primary"
                    :options="['', 'SEMANAL', '14 DIAS', 'QUINCENAL', 'MENSUAL']"
                    lazy-rules
                    :rules="[
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.liquidation_interval || (!openGate('edit-studios', sUser.prof_id) && !openGate('add-studios', sUser.prof_id))"
                  />
                </div>
                <div class="col-xs-12 col-sm-6">
                  <q-select
                    filled
                    v-model="studio.payroll_liquidation_interval"
                    label="Intervalo de Nómina"
                    label-color="primary"
                    :options="payrollIntervalOptions"
                    hint="Frecuencia para generar períodos de nómina automáticamente"
                    lazy-rules
                    :readonly="mode == 'show' || readonlyFields.payroll_liquidation_interval || (!openGate('edit-studios', sUser.prof_id) && !openGate('add-studios', sUser.prof_id))"
                  />
                </div>
                <div class="col-xs-12 col-sm-4">
                  <q-select
                    filled
                    v-model="studio.country"
                    label="Pais"
                    label-color=""
                    :options="countries"
                    lazy-rules
                    :rules="[
                      val => !!val.value || 'Este campo es requerido',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.country || (!openGate('edit-studios', sUser.prof_id) && !openGate('add-studios', sUser.prof_id))"
                    @update:model-value="updateDepartments"
                  />
                </div>
                <div class="col-xs-12 col-sm-4">
                  <q-select
                    filled
                    v-model="studio.department"
                    label="Departamento"
                    label-color=""
                    :options="departments"
                    lazy-rules
                    :rules="[
                      val => !!val.value || 'Este campo es requerido',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.department || (!openGate('edit-studios', sUser.prof_id) && !openGate('add-studios', sUser.prof_id))"
                    @update:model-value="updateCities"
                  />
                </div>
                <div class="col-xs-12 col-sm-4">
                  <q-select
                    filled
                    v-model="studio.city_id"
                    label="Ciudad"
                    label-color=""
                    :options="cities"
                    lazy-rules
                    :rules="[
                      val => !!val.value || 'Este campo es requerido',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.city_id || (!openGate('edit-studios', sUser.prof_id) && !openGate('add-studios', sUser.prof_id))"
                  />
                </div>
                <div class="col-xs-12 col-sm-3">
                  <q-input
                    filled
                    type="number"
                    v-model="studio.discountstudio_eur"
                    label="Descuento estudio EUR"
                    label-color=""
                    lazy-rules
                    step="any"
                    :rules="[
                    ]"
                    :readonly="mode == 'show' || readonlyFields.discountstudio_eur || (!openGate('edit-studios', sUser.prof_id) && !openGate('add-studios', sUser.prof_id))"
                  />
                  <br>
                </div>
                <div class="col-xs-12 col-sm-3">
                  <q-input
                    filled
                    type="number"
                    v-model="studio.discountstudio_usd"
                    label="Descuento estudio USD"
                    label-color=""
                    lazy-rules
                    step="any"
                    :rules="[
                    ]"
                    :readonly="mode == 'show' || readonlyFields.discountstudio_usd || (!openGate('edit-studios', sUser.prof_id) && !openGate('add-studios', sUser.prof_id))"
                  />
                  <br>
                </div>
                <div class="col-xs-12 col-sm-3">
                  <q-input
                    filled
                    type="number"
                    v-model="studio.discountmodel_eur"
                    label="Descuento modelo EUR"
                    label-color=""
                    lazy-rules
                    step="any"
                    :rules="[
                    ]"
                    :readonly="mode == 'show' || readonlyFields.discountmodel_eur || (!openGate('edit-studios', sUser.prof_id) && !openGate('add-studios', sUser.prof_id))"
                  />
                  <br>
                </div>
                <div class="col-xs-12 col-sm-3">
                  <q-input
                    filled
                    type="number"
                    v-model="studio.discountmodel_usd"
                    label="Descuento modelo USD"
                    label-color=""
                    lazy-rules
                    step="any"
                    :rules="[
                    ]"
                    :readonly="mode == 'show' || readonlyFields.discountmodel_usd || (!openGate('edit-studios', sUser.prof_id) && !openGate('add-studios', sUser.prof_id))"
                  />
                  <br>
                </div>
                <div class="col-xs-12 col-sm-4">
                  <q-input
                    filled
                    type=""
                    v-model="studio.manager_name"
                    label="Representante legal"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracter',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.manager_name || (!openGate('edit-studios', sUser.prof_id) && !openGate('add-studios', sUser.prof_id))"
                  />
                </div>
                <div class="col-xs-12 col-sm-4">
                  <q-input
                    filled
                    type=""
                    v-model="studio.manager_id"
                    label="Nro. identificación"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 50) || 'Máximo 255 caracter',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.manager_id || (!openGate('edit-studios', sUser.prof_id) && !openGate('add-studios', sUser.prof_id))"
                  />
                </div>
                <div class="col-xs-12 col-sm-4">
                  <q-input
                    filled
                    type=""
                    v-model="studio.manager_phone"
                    label="Teléfono"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 20) || 'Máximo 255 caracter',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.manager_phone || (!openGate('edit-studios', sUser.prof_id) && !openGate('add-studios', sUser.prof_id))"
                  />
                </div>

                <!-- <div class="col-xs-12 col-sm-12">
                  <q-input v-if="mode == 'show' || (!openGate('edit-studios', sUser.prof_id) && !openGate('add-studios', sUser.prof_id))" filled type="" label="¿Estudio aliado?" label-color="" readonly>
                    <template v-slot:append>
                      <q-chip v-if="studio.ally" color="green-3">SI</q-chip>
                      <q-chip v-else  color="red-3">NO</q-chip>
                    </template>
                  </q-input>
                  <q-toggle
                    v-else
                    v-model="studio.ally"
                    color="green"
                    :label="'¿Estudio aliado? ' + (studio.ally ? '(SI)' : '(NO)')"
                    checked-icon="check"
                    unchecked-icon="clear"
                  />
                  <br>
                </div> -->
                <div class="col-xs-12 col-sm-12">
                  <q-input v-if="mode == 'show' || (!openGate('edit-studios', sUser.prof_id) && !openGate('add-studios', sUser.prof_id))" filled type="" label="¿Paga desde Master?" label-color="" readonly>
                    <template v-slot:append>
                      <q-chip v-if="studio.ally_master_pays" color="green-3">SI</q-chip>
                      <q-chip v-else  color="red-3">NO</q-chip>
                    </template>
                  </q-input>
                  <q-toggle
                    v-else
                    v-model="studio.ally_master_pays"
                    color="green"
                    :label="'¿paga desde Master? ' + (studio.ally_master_pays ? '(SI)' : '(NO)')"
                    checked-icon="check"
                    unchecked-icon="clear"
                  />
                  <br>
                </div>
                <div class="col-xs-12 col-sm-12">
                  <q-input v-if="mode == 'show' || (!openGate('edit-studios', sUser.prof_id) && !openGate('add-studios', sUser.prof_id))" filled type="" label="" label-color="" readonly>
                    <template v-slot:append>
                      <q-chip v-if="studio.active" color="green-3">Activo</q-chip>
                      <q-chip v-else  color="red-3">Inactivo</q-chip>
                    </template>
                  </q-input>
                  <q-toggle
                    v-else
                    v-model="studio.active"
                    color="green"
                    :label="(studio.active ? 'Activo' : 'Inactivo')"
                    checked-icon="check"
                    unchecked-icon="clear"
                  />
                  <br>
                </div>
                <div class="col-xs-12 col-sm-12">
                  <q-input v-if="mode == 'show' || (!openGate('edit-studios', sUser.prof_id) && !openGate('add-studios', sUser.prof_id))" filled type="" label="Aplica Rte.Fte" label-color="" readonly>
                    <template v-slot:append>
                      <q-chip v-if="studio.rtefte" color="green-3">SI</q-chip>
                      <q-chip v-else  color="red-3">NO</q-chip>
                    </template>
                  </q-input>
                  <q-toggle
                    v-else
                    v-model="studio.rtefte"
                    color="green"
                    :label="'Aplica Rte.Fte ' + (studio.rtefte ? '(SI)' : '(NO)')"
                    checked-icon="check"
                    unchecked-icon="clear"
                  />
                  <br>
                </div>
                <div class="col-xs-12 col-sm-12">
                  <q-input v-if="mode == 'show' || (!openGate('edit-studios', sUser.prof_id) && !openGate('add-studios', sUser.prof_id))" filled type="" label="¿Crear cuenta de estudios?" label-color="" readonly>
                    <template v-slot:append>
                      <q-chip v-if="studio.stdacc" color="green-3">SI</q-chip>
                      <q-chip v-else  color="red-3">NO</q-chip>
                    </template>
                  </q-input>
                  <q-toggle
                    v-else
                    v-model="studio.stdacc"
                    color="green"
                    :label="'¿Crear cuenta de estudios? ' + (studio.stdacc ? '(SI)' : '(NO)')"
                    checked-icon="check"
                    unchecked-icon="clear"
                  />
                  <br>
                </div>
                <div class="col-xs-12 col-sm-12">
                  <div>
                    <span>Logo:</span>
                    <q-icon name="question_mark" size="2rem">
                      <q-tooltip class="bg-black" anchor="center right" self="center left" max-width="35rem">
                        <div style="font-size: 14px; white-space: pre-line;">Recomendado subir imagen con una relacion de aspecto 1:1</div>
                      </q-tooltip>
                    </q-icon>
                    <br>
                    <br>
                    <q-file
                      v-show="false"
                      v-model="studio.image"
                      @update:model-value="handleImageUpload"
                      ref="image"
                    />
                    <div
                      class="my-card text-white"
                      style="display: flex; height: 16rem; width: 16rem; justify-content: center; align-items: end; border-radius: 500px; overflow: auto;"
                      :style="{
                        backgroundImage: 'url(' + ((imageUrl === '') ? '/src/assets/icons/models.png' : imageUrl) + ')',
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        backgroundColor: '#b5b5b5',
                        cursor: (mode == 'create' || mode == 'edit') ? 'pointer' : 'inherit'
                      }"
                      @click="(mode == 'create' || mode == 'edit' && (openGate('edit-studios', sUser.prof_id) || openGate('add-studios', sUser.prof_id))) ? this.$refs.image.$el.click() : false"
                    >
                      <q-btn v-if="mode == 'create' || mode == 'edit' && (openGate('edit-studios', sUser.prof_id) || openGate('add-studios', sUser.prof_id))" flat style="width: 100%; background-color: #000000;"><q-icon name="add_a_photo" style="color: #E5D18E;"/></q-btn>
                    </div>
                  </div>
                </div>
              </div>
            </q-card-section>

            <q-separator inset />

            <q-card-section v-if="mode == 'create' || mode == 'edit' && (openGate('edit-studios', sUser.prof_id) || openGate('add-studios', sUser.prof_id))">
              <div>
                <q-btn type="submit" class="bg-primary text-white submit1" label="Enviar"/>
                <q-btn v-if="mode == 'edit'" @click="(isDialog) ? this.$emit('close') : this.mode = 'show';" label="Cancelar" />
                <q-btn v-else @click="(isDialog) ? this.$emit('close') : goTo('studios')" label="Cancelar" />
              </div>
            </q-card-section>
            <q-card-section v-else-if="mode == 'show'">
              <div>
                <q-btn v-if="openGate('edit-studios', sUser.prof_id)" class="bg-primary text-white submit1" label="Editar" @click="this.mode = 'edit'" />
              </div>
            </q-card-section>
          </q-form>
        </q-card>
        <StudiosRooms v-if="(this.mode == 'show' || this.mode == 'edit') && this.openGate('menu-studios_rooms', this.sUser.prof_id) && studio.id > 0" :is-subgrid="true" :parent-mode="mode" parent-table="studios" parent-field="std_id" :parent-id="studio.id" />
        <BanksAccounts v-if="(this.mode == 'show' || this.mode == 'edit') && this.openGate('menu-banks_accounts', this.sUser.prof_id) && studio.id > 0" :is-subgrid="true" :parent-mode="mode" parent-table="studios" parent-field="std_id" :parent-id="studio.id" />
        <StudiosShifts v-if="(this.mode == 'show' || this.mode == 'edit') && this.openGate('menu-studios_shifts', this.sUser.prof_id) && studio.id > 0" :is-subgrid="true" :parent-mode="mode" parent-table="studios" parent-field="std_id" :parent-id="studio.id" />
        <Payments v-if="(this.mode == 'show' || this.mode == 'edit') && studio.id > 0" :is-subgrid="true" :parent-mode="mode" parent-table="studios" parent-field="std_id" :parent-id="studio.id" />
        <StudiosAccounts v-if="(this.mode == 'show' || this.mode == 'edit') && studio.id > 0 && this.studio.stdaccS == true" :is-subgrid="true" :parent-mode="mode" parent-table="studios" parent-field="std_id" :parent-id="studio.id" />
        <StudioPayrollPeriods
          v-if="(this.mode == 'show' || this.mode == 'edit') && studio.id > 0"
          :studio-id="studio.id"
          :liquidation-interval="studio.liquidation_interval"
          :payroll-liquidation-interval="studio.payroll_liquidation_interval"
          :parent-mode="mode"
        />
      </div>
    </div>
  </div>
</template>

<script>
import StudioService from 'src/services/StudioService'
import UserService from 'src/services/UserService'
import LocationService from 'src/services/LocationService'
import StudiosRooms from 'src/pages/StudioRoom/StudiosRooms.vue'
import BanksAccounts from 'src/pages/BankAccount/BanksAccounts.vue'
import StudiosShifts from 'src/pages/StudioShift/StudiosShifts.vue'
import Payments from 'src/pages/Payment/Payments.vue'
import StudiosAccounts from 'src/pages/StudioAccount/StudiosAccounts.vue'
import StudioPayrollPeriods from './StudioPayrollPeriods.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'StudioForm',
  mixins: [xMisc, sGate],
  components: {
    StudiosRooms,
    BanksAccounts,
    StudiosShifts,
    Payments,
    StudiosAccounts,
    StudioPayrollPeriods
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
  },
  data () {
    return {
      sUser: {},
      mode: (this.$route.params.id) ? 'edit' : 'create',
      initTitle: 'Crear estudio',
      studio: {
        id: 0,
        nit: '',
        name: '',
        address: '',
        shifts: '',
        percent: '',
        liquidation_interval: '',
        payroll_liquidation_interval: { label: 'Mensual', value: 'MENSUAL' },
        payroll_auto_generate: true,
        created_at: '',
        image: '',
        ally: false,
        ally_master_pays: false,
        active: true,
        discountstudio_eur: 0,
        discountstudio_usd: 0,
        discountmodel_eur: 0,
        discountmodel_usd: 0,
        user_id_owner: null,
        rtefte: false,
        country: { label: '', value: '' },
        department: { label: '', value: '' },
        city_id: { label: '', value: '' },
        stdacc: false,
        stdaccS: false,
        verification_digit: '',
        manager_name: '',
        manager_id: '',
        manager_phone: '',
        company_name: ''
      },
      readonlyFields: {
        nit: false,
        name: false,
        address: false,
        shifts: false,
        percent: false,
        liquidation_interval: false,
        payroll_liquidation_interval: false,
        payroll_auto_generate: false,
        created_at: false,
        image: false,
        ally: false,
        ally_master_pays: false,
        active: false,
        discountstudio_eur: false,
        discountstudio_usd: false,
        discountmodel_eur: false,
        discountmodel_usd: false,
        user_id_owner: false,
        rtefte: false,
        country: false,
        department: false,
        city_id: false,
        verification_digit: false,
        manager_name: false,
        manager_id: false,
        manager_phone: false,
        company_name: false
      },
      imageUrl: '',
      users: [],
      countries: [],
      departments: [],
      cities: [],
      payrollIntervalOptions: [
        { label: 'Semanal', value: 'SEMANAL' },
        { label: 'Quincenal', value: 'QUINCENAL' },
        { label: 'Mensual', value: 'MENSUAL' }
      ],
      disableView: false
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
      this.studio.id = (this.isDialog) ? this.dialogChildId : this.$route.params.id
      this.getData()
    } else if (this.mode === 'create' && !this.openGate('add-studios', this.sUser.prof_id)) {
      this.disableView = true
    }
    this.getSelects()
  },
  methods: {
    async onSubmit () {
      try {
        this.activateLoading('Cargando')
        // var response = {}
        // POST
        if (this.mode === 'create' && this.openGate('add-studios', this.sUser.prof_id)) {
          var record = await StudioService.addStudio({
            std_nit: this.studio.nit,
            std_name: this.studio.name,
            std_address: this.studio.address,
            std_shifts: this.studio.shifts,
            std_percent: this.studio.percent,
            std_liquidation_interval: this.studio.liquidation_interval,
            payroll_liquidation_interval: (this.studio.payroll_liquidation_interval && this.studio.payroll_liquidation_interval.value) ? this.studio.payroll_liquidation_interval.value : this.studio.payroll_liquidation_interval,
            payroll_auto_generate: this.studio.payroll_auto_generate,
            //std_ally: this.studio.ally,
            std_ally_master_pays: this.studio.ally_master_pays,
            std_active: this.studio.active,
            std_discountstudio_eur: this.studio.discountstudio_eur,
            std_discountstudio_usd: this.studio.discountstudio_usd,
            std_discountmodel_eur: this.studio.discountmodel_eur,
            std_discountmodel_usd: this.studio.discountmodel_usd,
            user_id_owner: (this.studio.user_id_owner !== null) ? this.studio.user_id_owner.value : null,
            std_rtefte: this.studio.rtefte,
            city_id: this.studio.city_id.value,
            std_stdacc: this.studio.stdacc,
            std_verification_digit: this.studio.verification_digit,
            std_manager_name: this.studio.manager_name,
            std_manager_id: this.studio.manager_id,
            std_manager_phone: this.studio.manager_phone,
            std_company_name: this.studio.company_name,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Creado')
          this.studio.id = record.data.data.std_id
        } else if (this.mode === 'edit' && this.openGate('edit-studios', this.sUser.prof_id)) {
          var record = await StudioService.editStudio({
            id: (this.isDialog) ? this.dialogChildId : this.studio.id,
            std_nit: this.studio.nit,
            std_name: this.studio.name,
            std_address: this.studio.address,
            std_shifts: this.studio.shifts,
            std_percent: this.studio.percent,
            std_liquidation_interval: this.studio.liquidation_interval,
            payroll_liquidation_interval: (this.studio.payroll_liquidation_interval && this.studio.payroll_liquidation_interval.value) ? this.studio.payroll_liquidation_interval.value : this.studio.payroll_liquidation_interval,
            payroll_auto_generate: this.studio.payroll_auto_generate,
            //std_ally: this.studio.ally,
            std_ally_master_pays: this.studio.ally_master_pays,
            std_active: this.studio.active,
            std_discountstudio_eur: this.studio.discountstudio_eur,
            std_discountstudio_usd: this.studio.discountstudio_usd,
            std_discountmodel_eur: this.studio.discountmodel_eur,
            std_discountmodel_usd: this.studio.discountmodel_usd,
            user_id_owner: (this.studio.user_id_owner !== null) ? this.studio.user_id_owner.value : null,
            std_rtefte: this.studio.rtefte,
            city_id: this.studio.city_id.value,
            std_stdacc: this.studio.stdacc,
            std_verification_digit: this.studio.verification_digit,
            std_manager_name: this.studio.manager_name,
            std_manager_id: this.studio.manager_id,
            std_manager_phone: this.studio.manager_phone,
            std_company_name: this.studio.company_name,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Actualizado')
        }
        // if can edit >> edit, else >> show
        this.mode = (this.openGate('edit-studios', this.sUser.prof_id)) ? 'edit' : 'show'
        if (this.isDialog) {
          this.$emit('save')
          this.getData()
        } else {
          this.goTo('studios/' + this.mode + '/' + this.studio.id)
          this.getData()
        }
        this.uploadImage()
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
    handleImageUpload () {
      if (this.studio.image) {
        this.imageUrl = URL.createObjectURL(this.studio.image)
      }
    },
    async uploadImage () {
      try {
        this.activateLoading('Cargando')
        // var response = {}
        var data = new FormData()
        if (this.studio.image !== '') {
          data.append('files', this.studio.image)
          await StudioService.uploadImage({ id: this.studio.id, data: data, token: this.decryptSession('token') })
          this.alert('positive', 'Imágen cargarda con éxito')
          this.studio.image = ''
        }
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
        this.initTitle = 'Editar estudio'
      } else if (this.mode === 'show') {
        this.initTitle = 'Ver estudio'
      }

      try {
        this.activateLoading('Cargando')
        if ((this.openGate('show-studios', this.sUser.prof_id)) || (this.openGate('edit-studios', this.sUser.prof_id) && this.mode == 'edit')) {
          var response = await StudioService.getStudio({ id: this.studio.id, token: this.decryptSession('token') })
          if (response.data.data.length > 0) {
            this.studio.id = response.data.data[0].std_id
            this.studio.nit = response.data.data[0].std_nit
            this.studio.name = response.data.data[0].std_name
            this.studio.address = response.data.data[0].std_address
            this.studio.shifts = response.data.data[0].std_shifts
            this.studio.percent = response.data.data[0].std_percent
            this.studio.liquidation_interval = response.data.data[0].std_liquidation_interval
            // Convert payroll interval string to object for q-select
            const payrollInterval = response.data.data[0].payroll_liquidation_interval || 'MENSUAL'
            const intervalOption = this.payrollIntervalOptions.find(opt => opt.value === payrollInterval)
            this.studio.payroll_liquidation_interval = intervalOption || { label: 'Mensual', value: 'MENSUAL' }
            this.studio.payroll_auto_generate = response.data.data[0].payroll_auto_generate !== false
            this.studio.created_at = response.data.data[0].created_at
            //this.studio.ally = response.data.data[0].std_ally
            this.studio.ally_master_pays = response.data.data[0].std_ally_master_pays
            this.studio.active = response.data.data[0].std_active
            this.studio.discountstudio_eur = response.data.data[0].std_discountstudio_eur
            this.studio.discountstudio_usd = response.data.data[0].std_discountstudio_usd
            this.studio.discountmodel_eur = response.data.data[0].std_discountmodel_eur
            this.studio.discountmodel_usd = response.data.data[0].std_discountmodel_usd

            this.studio.rtefte = response.data.data[0].std_rtefte
            this.studio.stdacc = response.data.data[0].std_stdacc
            this.studio.stdaccS = response.data.data[0].std_stdacc
            this.studio.verification_digit = response.data.data[0].std_verification_digit
            this.studio.manager_name = response.data.data[0].std_manager_name
            this.studio.manager_id = response.data.data[0].std_manager_id
            this.studio.manager_phone = response.data.data[0].std_manager_phone
            this.studio.company_name = response.data.data[0].std_company_name

            if (response.data.data[0].user_owner) {
              this.studio.user_id_owner = {
                label: response.data.data[0].user_owner.user_name + ' ' + response.data.data[0].user_owner.user_surname,
                value: response.data.data[0].user_owner.user_id,
              }
            }
            if (response.data.data[0].city) {
              this.studio.country = { label: response.data.data[0].city.department.country.country_name, value: response.data.data[0].city.department.country.country_id }
              await this.updateDepartments()
              this.studio.department = { label: response.data.data[0].city.department.dpto_name, value: response.data.data[0].city.department.dpto_id }
              await this.updateCities()
              this.studio.city_id = { label: response.data.data[0].city.city_name, value: response.data.data[0].city.city_id }
            }
            // prevent change on update
            if (!this.imageUrl) {
              this.imageUrl = (response.data.data[0].std_image) ? this.getApiUrl('/images/studios/' + response.data.data[0].std_image)  : ''
            }
          } else {
            this.disableView = true
          }
        }

        this.disableLoading()
      } catch (error) {
        this.errorsAlerts(error)
        this.disableLoading()
      }
    },
    async getSelects () {
      // pre-select from dialog parent
      if (this.isDialog) {
        for (var dp = 0; dp < this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))].length; dp++) {
          if (parseInt(this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))][dp].value) === parseInt(this.parentId)) {
            this.studio[this.parentField] = {
              label: this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))][dp].label,
              value: this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))][dp].value,
            }
            this.readonlyFields[this.parentField] = true
          }
        }
      }
      if (this.openGate('add-studios', this.sUser.prof_id) || this.openGate('edit-studios', this.sUser.prof_id)) {
        // var response = await UserService.getUsers({ query: 'prof_id=2', token: this.decryptSession('token') })
        // for (var u = 0; u < response.data.data.length; u++) {
        //   this.users.push({
        //     label: response.data.data[u].user_name + ' ' + response.data.data[u].user_surname,
        //     value: response.data.data[u].user_id,
        //   })
        // }
        const response = await LocationService.getCountries({ token: this.decryptSession('token') })
        for (var u = 0; u < response.data.data.length; u++) {
          this.countries.push({
            label: response.data.data[u].country_name,
            value: response.data.data[u].country_id
          })
        }
      }
    },
    async updateDepartments () {
      this.departments = []
      var response = await LocationService.getDepartments({ country_id: this.studio.country.value, token: this.decryptSession('token') })
      for (var u = 0; u < response.data.data.length; u++) {
        this.departments.push({
          label: response.data.data[u].dpto_name,
          value: response.data.data[u].dpto_id
        })
      }
      this.studio.department = { label: '', value: '' }
      this.studio.city_id = { label: '', value: '' }
      this.cities = []
    },
    async updateCities () {
      this.cities = []
      var response = await LocationService.getCities({ dpto_id: this.studio.department.value, token: this.decryptSession('token') })
      for (var u = 0; u < response.data.data.length; u++) {
        this.cities.push({
          label: response.data.data[u].city_name,
          value: response.data.data[u].city_id
        })
      }
      this.studio.city_id = { label: '', value: '' }
    },
    async getUsers (val, update, abort) {
      if (val.length < 3) {
        abort()
        return
      }
      try {
        var response = await UserService.getModelsByOwnerStudio({ search: val, prof_ids: [], token: this.decryptSession('token') })
        update(() => {
          this.users = response.data.data
        })
      } catch (error) {
        this.errorsAlerts(error)
      }
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

<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card" v-if="this.openGate('add-transactions_types', this.sUser.prof_id) || 
          (this.openGate('show-transactions_types', this.sUser.prof_id) && this.mode == 'show') || 
          (this.openGate('edit-transactions_types', this.sUser.prof_id) && this.mode == 'edit')"
        >
          <q-form
              @submit="onSubmit"
              class="q-gutter-md"
            >
            <q-card-section v-if="!isDialog">
              <div class="q-px-md q-gutter-sm">
                <q-btn color="black" @click="goTo('transactions_types')" :label="'&lt; ' + 'Regresar'" />
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
                <div class="col-xs-12 col-sm-12">
                  <q-select
                    filled
                    v-model="transactionType.group"
                    label="Grupo"
                    label-color="primary"
                    :options="['INGRESOS', 'EGRESOS']"
                    lazy-rules
                    :rules="[
                    val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres'
                    ]"
                    :readonly="mode == 'show' || readonlyFields.group"
                    @update:model-value="onGroupChange"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="transactionType.name"
                    label="Nombre"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.name"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-select
                    filled
                    v-model="transactionType.behavior"
                    label="Comportamiento"
                    label-color=""
                    :options="transactionType.group === 'INGRESOS' ? ['ESTANDAR', 'TIENDA', 'SALDO PENDIENTE', 'COMISION'] : ['ESTANDAR', 'TIENDA', 'SALDO PENDIENTE']"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres'
                    ]"
                    :readonly="mode == 'show' || readonlyFields.behavior"
                  />
                </div>
                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type="number"
                    v-model="transactionType.value"
                    label="Valor"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => val !== '' && !isNaN(parseInt(val)) || 'Este campo es requerido',
                      val => val >= 0 || 'Debe ser un numero positivo'
                    ]"
                    :readonly="mode == 'show' || readonlyFields.value"
                    step="any"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input v-if="mode == 'show'" filled type="" label="¿Apllica Rte. Fte?" label-color="primary" readonly>
                    <template v-slot:append>
                      <q-chip v-if="transactionType.rtefte" color="green-3">SI</q-chip>
                      <q-chip v-else  color="red-3">NO</q-chip>
                    </template>
                  </q-input>
                  <q-toggle
                    v-else
                    v-model="transactionType.rtefte"
                    color="green"
                    :label="'¿Apllica Rte. Fte? ' + (transactionType.rtefte ? '(SI)' : '(NO)')"
                    checked-icon="check"
                    unchecked-icon="clear"
                  />
                  <br>
                </div>

              </div>
            </q-card-section>

            <q-separator inset />

            <q-card-section v-if="mode == 'create' || mode == 'edit'">
              <div>
                <q-btn type="submit" class="bg-primary text-white submit1" label="Enviar"/>
                <q-btn v-if="mode == 'edit'" @click="(isDialog) ? this.$emit('close') : this.mode = 'show';" label="Cancelar" />
                <q-btn v-else @click="(isDialog) ? this.$emit('close') : goTo('transactions_types')" label="Cancelar" />
              </div>
            </q-card-section>
            <q-card-section v-else-if="mode == 'show'">
              <div>
                <q-btn v-if="openGate('edit-transactions_types', sUser.prof_id)" class="bg-primary text-white submit1" label="Editar" @click="this.mode = 'edit'" />
              </div>
            </q-card-section>
          </q-form>
        </q-card>
        <!--<ModelsTransactions v-if="(this.mode == 'show' || this.mode == 'edit') && transactionType.id > 0" :is-subgrid="true" :parent-mode="mode" parent-table="transactions_types" parent-field="transtype_id" :parent-id="transactionType.id" />-->
      </div>
    </div>
  </div>
</template>

<script>
import TransactionTypeService from 'src/services/TransactionTypeService'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'TransactionTypeForm',
  mixins: [xMisc, sGate],
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
      initTitle: 'Crear tipo de transferencia',
      transactionType: {
        id: 0,
        group: '',
        name: '',
        behavior: '',
        rtefte: false,
        created_at: '',
        value: 0
      },
      readonlyFields: {
        group: false,
        name: false,
        behavior: false,
        rtefte: false,
        created_at: false,
        value: false
      }
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
      this.transactionType.id = (this.isDialog) ? this.dialogChildId : this.$route.params.id
      this.getData()
    }
    this.getSelects()
  },
  methods: {
    onGroupChange(val) {
      this.transactionType.group = val
      this.transactionType.behavior = ''
    },
    async onSubmit () {
      try {
        this.activateLoading('Cargando')
        // var response = {}
        // POST
        if (this.mode === 'create' && this.openGate('add-transactions_types', this.sUser.prof_id)) {
          var record = await TransactionTypeService.addTransactionType({
            transtype_group: this.transactionType.group,
            transtype_name: this.transactionType.name,
            transtype_behavior: this.transactionType.behavior,
            transtype_rtefte: this.transactionType.rtefte,
            transtype_value: this.transactionType.value,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Creado')
          this.transactionType.id = record.data.data.transtype_id
        } else if (this.mode === 'edit' && this.openGate('edit-transactions_types', this.sUser.prof_id)) {
          var record = await TransactionTypeService.editTransactionType({
            id: (this.isDialog) ? this.dialogChildId : this.transactionType.id,
            transtype_group: this.transactionType.group,
            transtype_name: this.transactionType.name,
            transtype_behavior: this.transactionType.behavior,
            transtype_rtefte: this.transactionType.rtefte,
            transtype_value: this.transactionType.value,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Actualizado')
        }
        // if can edit >> edit, else >> show
        this.mode = (this.openGate('edit-transactions_types', this.sUser.prof_id)) ? 'edit' : 'show'
        if (this.isDialog) {
          this.$emit('save')
          this.getData()
        } else {
          this.goTo('transactions_types/' + this.mode + '/' + this.transactionType.id)
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
        this.initTitle = 'Editar tipo de transferencia'
      } else if (this.mode === 'show') {
        this.initTitle = 'Ver tipo de transferencia'
      }

      try {
        this.activateLoading('Cargando')
        if ((this.openGate('show-transactions_types', this.sUser.prof_id) && this.mode == 'show') || (this.openGate('edit-transactions_types', this.sUser.prof_id) && this.mode == 'edit')) {
          var response = await TransactionTypeService.getTransactionType({ id: this.transactionType.id, token: this.decryptSession('token') })
          this.transactionType.id = response.data.data[0].transtype_id
          this.transactionType.group = response.data.data[0].transtype_group
          this.transactionType.name = response.data.data[0].transtype_name
          this.transactionType.behavior = response.data.data[0].transtype_behavior
          this.transactionType.rtefte = response.data.data[0].transtype_rtefte
          this.transactionType.value = response.data.data[0].transtype_value
          this.transactionType.created_at = response.data.data[0].created_at
        }
        this.disableLoading()
      } catch (error) {
        this.errorsAlerts(error)
        this.disableLoading()
      }
    },
    async getSelects () {
      var response
      // pre-select from dialog parent
      if (this.isDialog) {
        for (var dp = 0; dp < this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))].length; dp++) {
          if (parseInt(this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))][dp].value) === parseInt(this.parentId)) {
            this.transactionType[this.parentField] = {
              label: this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))][dp].label,
              value: this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))][dp].value,
            }
            this.readonlyFields[this.parentField] = true
          }
        }
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

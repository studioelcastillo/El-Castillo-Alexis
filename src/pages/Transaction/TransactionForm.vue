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
                <q-btn color="black" @click="goTo('transactions')" :label="'&lt; ' + 'Regresar'" />
              </div>
            </q-card-section>

            <q-separator v-if="!isDialog" class="q-my-none" inset />

            <q-card-section v-if="isDialog" class="row items-center q-pb-none">
              <h5 class="is-size-3">{{initTitle}} ({{transferGroup}})</h5>
              <q-space />
              <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>

            <q-separator v-if="isDialog" inset />

            <q-card-section>
              <h5 v-if="!isDialog" class="is-size-3">{{initTitle}} ({{transferGroup}})</h5>
              <br v-if="!isDialog">
              <div class="row q-col-gutter-sm">
                <div class="col-xs-12 col-sm-12" v-if="isModel && (mode == 'create' || mode == 'show' || mode == 'edit')">
                  <q-select
                    filled
                    v-model="transaction.stdmod_id"
                    label="Contrato"
                    label-color="primary"
                    :options="studios_models"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido'
                    ]"
                    :readonly="mode == 'show' || mode == 'edit' || readonlyFields.stdmod_id"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-select
                    clearable
                    filled
                    v-model="transaction.transtype_id"
                    label="Tipo de transferencia"
                    label-color="primary"
                    use-input
                    hide-selected
                    fill-input
                    :options="transactionsTypes"
                    @filter="getTransactionsTypes"
                    hint="Digitar al menos 3 caracteres para seleccionar"
                    :rules="[
                      val => val != null && !!val.value || 'Este campo es requerido',
                    ]"
                    :readonly="mode == 'show'"
                    @update:model-value="updatedTransferType"
                  >
                    <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          Sin resultados
                        </q-item-section>
                      </q-item>
                    </template>
                    <template v-if="mode !== 'show'" v-slot:after>
                      <q-btn @click="loadAllTransactionsTypes = true" flat icon="refresh" />
                    </template>
                  </q-select>
                </div>
                <div v-if="transferGroup == 'EGRESOS' && (transaction.transtype_id == null || transaction.transtype_id == '' || transaction.transtype_id.behavior == 'TIENDA')" class="col-xs-12 col-sm-12">
                  <q-select
                    filled
                    v-model="transaction.prod_id"
                    label="Producto"
                    label-color="primary"
                    use-input
                    hide-selected
                    fill-input
                    :options="products"
                    @filter="getProducts"
                    hint="Digitar al menos 2 caracter para seleccionar"
                    :rules="[
                      val => !!val.value || 'Este campo es requerido',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.prod_id"
                    @update:model-value="updatedProducts"
                  >
                    <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          Sin resultados
                        </q-item-section>
                      </q-item>
                    </template>
                    <template v-if="mode !== 'show'" v-slot:after>
                      <q-btn @click="loadAllProducts = true" flat icon="refresh" />
                    </template>
                  </q-select>
                </div>

                <div v-if="transaction.transtype_id != null" class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="transaction.description"
                    label="Descripción"
                    label-color=""
                    lazy-rules
                    :rules="[
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.description"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type="number"
                    v-model="transaction.amount"
                    label="Monto"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.amount"
                  />
                </div>
                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type="number"
                    v-model="transaction.quantity"
                    label="Cantidad"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => val !== '' && !isNaN(parseInt(val)) || 'Este campo es requerido',
                      val => val >= 0 || 'Debe ser un numero positivo'
                    ]"
                    :readonly="mode == 'show' || readonlyFields.quantity"
                    step="any"
                  />
                </div>
                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    v-model="transaction.date"
                    label="Fecha"
                    label-color="primary"
                    mask="date"
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateDateFormat(val) || 'El formato de fecha no es válida',
                    ]"
                    readonly
                  >
                    <template v-if="!(mode == 'show' || readonlyFields.date)" v-slot:append>
                      <q-icon name="event" class="cursor-pointer">
                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                          <q-date v-model="transaction.date" :options="dateOptions">
                            <div class="row items-center justify-end">
                              <q-btn v-close-popup label="Close" color="primary" flat />
                            </div>
                          </q-date>
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                </div>
                <div class="col-xs-12 col-sm-12">
                  <q-input v-if="mode == 'show'" filled type="" label="Aplica Rte.Fte" label-color="" readonly>
                    <template v-slot:append>
                      <q-chip v-if="transaction.rtefte" color="green-3">SI</q-chip>
                      <q-chip v-else  color="red-3">NO</q-chip>
                    </template>
                  </q-input>
                  <q-toggle
                    v-else
                    v-model="transaction.rtefte"
                    color="green"
                    :label="'Aplica Rte.Fte ' + (transaction.rtefte ? '(SI)' : '(NO)')"
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
                <q-btn v-else @click="(isDialog) ? this.$emit('close') : goTo('transactions')" label="Cancelar" />
              </div>
            </q-card-section>
            <!-- <q-card-section v-else-if="mode == 'show' && !disableEdit">
              <div>
                <q-btn v-if="openGate('edit-transactions', sUser.prof_id)" class="bg-primary text-white submit1" label="Editar" @click="this.mode = 'edit'" />
              </div>
            </q-card-section> -->
          </q-form>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script>
import TransactionService from 'src/services/TransactionService'
import PetitionService from 'src/services/PetitionService'
import ProductService from 'src/services/ProductService'
import TransactionTypeService from 'src/services/TransactionTypeService'
import PeriodService from 'src/services/PeriodService'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'TransactionForm',
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
    transferGroupProp: {
      type: String,
      default: null
    },
    modeprop: {
      type: String,
      default: ''
    },
    isModel: {
      type: Boolean,
      default: false
    },
  },
  data () {
    return {
      sUser: {},
      mode: (this.$route.params.id) ? 'edit' : 'create',
      initTitle: 'Crear transacción',
      transaction: {
        id: 0,
        user_id: '',
        transtype_id: '',
        date: '',
        description: '',
        amount: '',
        prod_id: '',
        created_at: '',
        quantity: 1,
        rtefte: false,
        stdmod_id: ''
      },
      readonlyFields: {
        user_id: false,
        transtype_id: false,
        date: false,
        description: false,
        amount: false,
        prod_id: false,
        created_at: false,
        quantity: false,
        stdmod_id: false
      },
      studios_models: [],
      products: [],
      transactionsTypes: [],
      transferGroup: 'INGRESOS',
      disableEdit: false,
      loadAllTransactionsTypes: false,
      loadAllProducts: false,
      closedPeriods: []
    }
  },
  mounted () {
    this.sUser = this.decryptSession('user')
    this.getClosedPeriods()
    this.transferGroup = this.transferGroupProp
    this.transaction.user_id = this.parentId
    // if mode is sended from modeprop
    if (this.modeprop != '') {
      this.mode = this.modeprop
    // if mode is sended from subgrid
    } else if ((this.$route.params.id && !this.isDialog) || (this.isDialog && this.parentId !== null && this.dialogChildId !== null)) {
      this.mode = 'edit'
    }
    
    if (this.mode === 'create') {
      // Set default date to today in 'YYYY-MM-DD' format
      const today = new Date()
      const yyyy = today.getFullYear()
      const mm = String(today.getMonth() + 1).padStart(2, '0')
      const dd = String(today.getDate()).padStart(2, '0')
      this.transaction.date = `${yyyy}-${mm}-${dd}`
    }
    
    if (this.mode === 'edit' || this.mode === 'show') {
      this.transaction.id = (this.isDialog) ? this.dialogChildId : this.$route.params.id
      this.getData()
    } else {
      this.getStudiosModelsByModel()
    }
    if (this.mode !== 'show') {
      this.getClosedPeriods()  
    }
  },
  methods: {
    async onSubmit () {
      try {
        this.activateLoading('Cargando')
        // var response = {}
        // POST
        if (this.mode === 'create') {
          var record = await TransactionService.addTransaction({
            user_id: this.transaction.user_id,
            transtype_id: this.transaction.transtype_id.value,
            trans_date: this.transaction.date,
            trans_description: this.transaction.description,
            trans_amount: this.transaction.amount,
            prod_id: this.transaction.prod_id.value,
            trans_quantity: this.transaction.quantity,
            trans_rtefte: this.transaction.rtefte,
            stdmod_id: this.transaction.stdmod_id.value,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Creado')
          this.transaction.id = record.data.data.trans_id
        } else if (this.mode === 'edit') {
          var record = await TransactionService.editTransaction({
            id: (this.isDialog) ? this.dialogChildId : this.transaction.id,
            user_id: this.transaction.user_id,
            transtype_id: this.transaction.transtype_id.value,
            trans_date: this.transaction.date,
            trans_description: this.transaction.description,
            trans_amount: this.transaction.amount,
            prod_id: this.transaction.prod_id.value,
            trans_quantity: this.transaction.quantity,
            trans_rtefte: this.transaction.rtefte,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Actualizado')
        }
        // if can edit >> edit, else >> show
        this.mode = (this.openGate('edit-transactions', this.sUser.prof_id)) ? 'edit' : 'show'
        if (this.isDialog) {
          this.$emit('save')
          this.$emit('close')
        } else {
          this.goTo('transactions/' + this.mode + '/' + this.transaction.id)
          this.getData()
        }
        this.disableLoading()
      } catch (error) {
        // console.log(error)
        this.disableLoading()
        if (error.response && error.response.data.code && error.response.data.message) {
          this.alert('warning', error.response.data.message)
        }
        else if (error.response && error.response.data.error && error.response.data.error.code && error.response.data.error.message) {
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
        this.initTitle = 'Editar transacción'
      } else if (this.mode === 'show') {
        this.initTitle = 'Ver transacción'
      }

      try {
        this.activateLoading('Cargando')
        var response = await TransactionService.getTransaction({ id: this.transaction.id, token: this.decryptSession('token') })
        this.getStudiosModelsByModel(response.data.data[0].stdmod_id)
        this.transaction.id = response.data.data[0].trans_id
        this.transaction.date = response.data.data[0].trans_date
        this.transaction.description = response.data.data[0].trans_description
        this.transaction.amount = response.data.data[0].trans_amount
        this.transaction.quantity = response.data.data[0].trans_quantity
        this.transaction.rtefte = response.data.data[0].trans_rtefte
        this.transaction.created_at = response.data.data[0].created_at
        if (response.data.data[0].product) {
          this.disableEdit = true
          this.mode = 'show'
          this.transaction.prod_id = {
            label: response.data.data[0].product.prod_name,
            value: response.data.data[0].product.prod_id,
            amount: response.data.data[0].product.prod_sale_price
          }
        }
        if (response.data.data[0].transaction_type) {
          this.transaction.transtype_id = {
            label: response.data.data[0].transaction_type.transtype_name,
            value: response.data.data[0].transaction_type.transtype_id,
            behavior: response.data.data[0].transaction_type.transtype_behavior
          }
          this.transferGroup = response.data.data[0].transaction_type.transtype_group
        }
        this.disableLoading()
      } catch (error) {
        this.errorsAlerts(error)
        this.disableLoading()
      }
    },
    async getStudiosModelsByModel (stdmod_id=null) {
      try {
        var response = await PetitionService.getStudiosModelsByModel({ user_id: this.transaction.user_id, token: this.decryptSession('token') })
        this.studios_models = response.data.data
        if (stdmod_id) {
          for (var i = 0; i < this.studios_models.length; i++) {
            if (this.studios_models[i].value === stdmod_id) {
              this.transaction.stdmod_id = this.studios_models[i]
            }
          }
        }
        else {
          this.transaction.stdmod_id = this.studios_models[0]
        }
      } 
      catch (error) {
        this.disableLoading()
        if (error.response && error.response.data && error.response.data.code && error.response.data.message) {
          if (error.response.data.code === 'UNEXPECTED_ERROR') {
            this.alert('negative', error.response.data.message)
          } else {
            this.alert('warning', error.response.data.message)
          }
        } else {
          this.errorsAlerts(error)
        }
      }
    },
    async getTransactionsTypes (val, update, abort) {
      if (val.length < 3 && !this.loadAllTransactionsTypes) {
        abort()
        return
      }
      try {
        var response = await TransactionTypeService.getTransactionsTypes({ query: 'transtype_group=' + this.transferGroup + '&transtype_name=' + val, token: this.decryptSession('token') })
        update(() => {
          this.transactionsTypes = []
          for (var u = 0; u < response.data.data.length; u++) {
            this.transactionsTypes.push({
              label: response.data.data[u].transtype_name,
              value: response.data.data[u].transtype_id,
              behavior: response.data.data[u].transtype_behavior,
              amount_transtype: response.data.data[u].transtype_value
            })
          }

        })
      } catch (error) {
        this.errorsAlerts(error)
      }
    },
    async getProducts (val, update, abort) {
      if (val.length < 2 && !this.loadAllProducts) {
        abort()
        return
      }
      try {
        var query = 'prod_name=' + val
        query += '&transtype_group=' + this.transferGroup
        if (this.transaction.transtype_id != null && typeof this.transaction.transtype_id.value !== 'undefined') {
          query += '&transtype_id=' + this.transaction.transtype_id.value
        }
        var response = await ProductService.getProducts({ query: query, token: this.decryptSession('token') })
        update(() => {
          this.products = []
          for (var u = 0; u < response.data.data.length; u++) {
            this.products.push({
              label: response.data.data[u].prod_name,
              value: response.data.data[u].prod_id,
              amount: response.data.data[u].prod_sale_price,
              label_trans_type: response.data.data[u].transaction_type.transtype_name,
              value_trans_type: response.data.data[u].transaction_type.transtype_id,
              behavior_trans_type: response.data.data[u].transaction_type.transtype_behavior
            })
          }
        })
      } catch (error) {
        this.errorsAlerts(error)
      }
    },
    updatedProducts () {
      this.transaction.amount = this.transaction.prod_id.amount
      this.transaction.transtype_id = {
        label: this.transaction.prod_id.label_trans_type,
        value: this.transaction.prod_id.value_trans_type,
        behavior: this.transaction.prod_id.behavior_trans_type,
      }
    },
    updateProducts () {
      this.transaction.prod_id = ''
    },
    updatedTransferType () {
      this.transaction.prod_id = ''
      if (this.transaction.transtype_id == null || this.transaction.transtype_id.behavior == 'TIENDA') {
        this.transaction.description = ''
      }
      if (this.transaction.transtype_id != null) {
        this.transaction.amount = (this.transaction.transtype_id.amount_transtype != null) ? this.transaction.transtype_id.amount_transtype : ''
      }
    },
    async getClosedPeriods () {
      try {
        this.activateLoading('Cargando')
        const response = await PeriodService.getPeriodsClosed({ token: this.decryptSession('token') })
        this.closedPeriods = response.data.data
        this.disableLoading()
      } catch (error) {
        this.errorsAlerts(error)
        this.disableLoading()
      }
    },
    dateOptions (date) {
      for (var u = 0; u < this.closedPeriods.length; u++) {
        if (date >= this.closedPeriods[u].period_start_date && date <= this.closedPeriods[u].period_end_date) {
          return false
        }
      }
      return true // retorna true si la fecha no pertenece a un periodo cerrado
    }
  }
}
</script>

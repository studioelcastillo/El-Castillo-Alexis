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
                <q-btn color="black" @click="goTo('models_transactions')" :label="'&lt; ' + 'Regresar'" />
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
                    v-model="modelTransaction.stdmod_id"
                    label="Modelo"
                    label-color="primary"
                    :options="studiosModels"
                    lazy-rules
                    :rules="[
                      val => !!val.value || 'Este campo es requerido',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.stdmod_id"
                  />
                </div>
                <div class="col-xs-12 col-sm-12">
                  <q-select
                    filled
                    v-model="transferGroup"
                    label="Grupo transferencia"
                    label-color="primary"
                    :options="['INGRESOS', 'EGRESOS']"
                    lazy-rules
                    :readonly="mode == 'show'"
                    @update:model-value="updateTransactionsTypes"
                  />
                  <br>
                </div>
                <div class="col-xs-12 col-sm-12">
                  <q-select
                    filled
                    v-model="modelTransaction.transtype_id"
                    label="Tipo de transferencia"
                    label-color="primary"
                    use-input
                    hide-selected
                    fill-input
                    :options="transactionsTypes"
                    @filter="getTransactionsTypes"
                    hint="Digitar al menos 3 caracteres para seleccionar"
                    :rules="[
                      val => !!val.value || 'Este campo es requerido',
                    ]"
                    :readonly="mode == 'show'"
                    @update:model-value="updateDescription"
                  >
                    <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          Sin resultados
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
                <div v-if="modelTransaction.transtype_id.behavior == 'TIENDA'" class="col-xs-12 col-sm-12">
                  <q-select
                    filled
                    v-model="selectedCategory"
                    label="Categoria"
                    label-color="primary"
                    use-input
                    hide-selected
                    fill-input
                    :options="categories"
                    @filter="getCategories"
                    hint="Digitar al menos 3 caracteres para seleccionar"
                    :rules="[
                      val => !!val.value || 'Este campo es requerido',
                    ]"
                    :readonly="mode == 'show'"
                    @update:model-value="updateProducts"
                  >
                    <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          Sin resultados
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
                <div v-if="modelTransaction.transtype_id.behavior == 'TIENDA'" class="col-xs-12 col-sm-12">
                  <q-select
                    filled
                    v-model="modelTransaction.prod_id"
                    label="Producto"
                    label-color="primary"
                    use-input
                    hide-selected
                    fill-input
                    :options="products"
                    @filter="getProducts"
                    hint="Digitar al menos 3 caracteres para seleccionar"
                    :rules="[
                      val => !!val.value || 'Este campo es requerido',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.prod_id"
                    @update:model-value="updateAmount"
                  >
                    <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          Sin resultados
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>

                <div v-if="modelTransaction.transtype_id.behavior != 'TIENDA'" class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="modelTransaction.description"
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
                    v-model="modelTransaction.amount"
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
                    v-model="modelTransaction.quantity"
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
                    v-model="modelTransaction.date"
                    label="Fecha"
                    label-color="primary"
                    mask="date"
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                    val => this.validateDateFormat(val) || 'El formato de fecha no es válida',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.date"
                  >
                    <template v-if="!(mode == 'show' || readonlyFields.date)" v-slot:append>
                      <q-icon name="event" class="cursor-pointer">
                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                          <q-date v-model="modelTransaction.date">
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
                      <q-chip v-if="modelTransaction.rtefte" color="green-3">SI</q-chip>
                      <q-chip v-else  color="red-3">NO</q-chip>
                    </template>
                  </q-input>
                  <q-toggle
                    v-else
                    v-model="modelTransaction.rtefte"
                    color="green"
                    :label="'Aplica Rte.Fte ' + (modelTransaction.rtefte ? '(SI)' : '(NO)')"
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
                <q-btn v-else @click="(isDialog) ? this.$emit('close') : goTo('models_transactions')" label="Cancelar" />
              </div>
            </q-card-section>
            <q-card-section v-else-if="mode == 'show' && !disableEdit">
              <div>
                <q-btn v-if="openGate('edit-models_transactions', sUser.prof_id)" class="bg-primary text-white submit1" label="Editar" @click="this.mode = 'edit'" />
              </div>
            </q-card-section>
          </q-form>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script>
import ModelTransactionService from 'src/services/ModelTransactionService'
import ProductService from 'src/services/ProductService'
import StudioModelService from 'src/services/StudioModelService'
import CategoryService from 'src/services/CategoryService'
import TransactionTypeService from 'src/services/TransactionTypeService'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'ModelTransactionForm',
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
     initTitle: 'Crear transacción',
      modelTransaction: {
        id: 0,
        stdmod_id: '',
        transtype_id: '',
        date: '',
        description: '',
        amount: '',
        prod_id: '',
        created_at: '',
        quantity: 0,
        rtefte: false
      },
      readonlyFields: {
        stdmod_id: false,
        transtype_id: false,
        date: false,
        description: false,
        amount: false,
        prod_id: false,
        created_at: false,
        quantity: false
      },
      selectedCategory: { value: '', label: ''},
      categories: [],
      products: [],
      studiosModels: [],
      transactionsTypes: [],
      transferGroup: 'INGRESOS',
      disableEdit: false
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
      this.modelTransaction.id = (this.isDialog) ? this.dialogChildId : this.$route.params.id
      this.getData()
    }
    this.getSelects()
  },
  methods: {
    async onSubmit () {
      try {
        this.activateLoading('Cargando')
        // var response = {}
        // POST
        if (this.mode === 'create') {
          var record = await ModelTransactionService.addModelTransaction({
            stdmod_id: this.modelTransaction.stdmod_id.value,
            transtype_id: this.modelTransaction.transtype_id.value,
            modtrans_date: this.modelTransaction.date,
            modtrans_description: this.modelTransaction.description,
            modtrans_amount: this.modelTransaction.amount,
            prod_id: this.modelTransaction.prod_id.value,
            modtrans_quantity: this.modelTransaction.quantity,
            modtrans_rtefte: this.modelTransaction.rtefte,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Creado')
          this.modelTransaction.id = record.data.data.modtrans_id
        } else if (this.mode === 'edit') {
          var record = await ModelTransactionService.editModelTransaction({
            id: (this.isDialog) ? this.dialogChildId : this.modelTransaction.id,
            stdmod_id: this.modelTransaction.stdmod_id.value,
            transtype_id: this.modelTransaction.transtype_id.value,
            modtrans_date: this.modelTransaction.date,
            modtrans_description: this.modelTransaction.description,
            modtrans_amount: this.modelTransaction.amount,
            prod_id: this.modelTransaction.prod_id.value,
            modtrans_quantity: this.modelTransaction.quantity,
            modtrans_rtefte: this.modelTransaction.rtefte,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Actualizado')
        }
        // if can edit >> edit, else >> show
        this.mode = (this.openGate('edit-models_transactions', this.sUser.prof_id)) ? 'edit' : 'show'
        if (this.isDialog) {
          this.$emit('save')
          this.$emit('close')
        } else {
          this.goTo('models_transactions/' + this.mode + '/' + this.modelTransaction.id)
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
        this.initTitle = 'Editar transacción'
      } else if (this.mode === 'show') {
        this.initTitle = 'Ver transacción'
      }

      try {
        this.activateLoading('Cargando')
        var response = await ModelTransactionService.getModelTransaction({ id: this.modelTransaction.id, token: this.decryptSession('token') })
        this.modelTransaction.id = response.data.data[0].modtrans_id
        this.modelTransaction.date = response.data.data[0].modtrans_date
        this.modelTransaction.description = response.data.data[0].modtrans_description
        this.modelTransaction.amount = response.data.data[0].modtrans_amount
        this.modelTransaction.quantity = response.data.data[0].modtrans_quantity
        this.modelTransaction.rtefte = response.data.data[0].modtrans_rtefte
        this.modelTransaction.created_at = response.data.data[0].created_at
        if (response.data.data[0].product) {
          this.disableEdit = true
          this.mode = 'show'
          this.modelTransaction.prod_id = {
            label: response.data.data[0].product.prod_name,
            value: response.data.data[0].product.prod_id,
            amount: response.data.data[0].product.prod_sale_price
          }
          this.selectedCategory = {
            label: response.data.data[0].product.category.cate_name,
            value: response.data.data[0].product.category.cate_id,
          }
        }
        if (response.data.data[0].studio_model) {
          this.modelTransaction.stdmod_id = {
            label: response.data.data[0].studio_model.stdmod_id,
            value: response.data.data[0].studio_model.stdmod_id,
          }
        }
        if (response.data.data[0].transaction_type) {
          this.modelTransaction.transtype_id = {
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
    async getSelects () {
      var response
      // studiosModels
      this.studiosModels = []
      this.studiosModels.push({
        label: '',
        value: '',
      })
      // async
      response = await StudioModelService.getStudiosModels({ token: this.decryptSession('token') })
      for (var u = 0; u < response.data.data.length; u++) {
        this.studiosModels.push({
          label: response.data.data[u].stdmod_id,
          value: response.data.data[u].stdmod_id,
        })
      }

      // pre-select from dialog parent
      if (this.isDialog) {
        for (var dp = 0; dp < this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))].length; dp++) {
          if (parseInt(this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))][dp].value) === parseInt(this.parentId)) {
            this.modelTransaction[this.parentField] = {
              label: this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))][dp].label,
              value: this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))][dp].value,
            }
            this.readonlyFields[this.parentField] = true
          }
        }
      }
    },
    async getTransactionsTypes (val, update, abort) {
      if (val.length < 3) {
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
              behavior: response.data.data[u].transtype_behavior
            })
          }

        })
      } catch (error) {
        this.errorsAlerts(error)
      }
    },
    async getCategories (val, update, abort) {
      if (val.length < 3) {
        abort()
        return
      }
      try {
        var response = await CategoryService.getCategories({ query: 'cate_name=' + val, token: this.decryptSession('token') })
        update(() => {
          this.categories = []
          for (var u = 0; u < response.data.data.length; u++) {
            this.categories.push({
              label: response.data.data[u].cate_name,
              value: response.data.data[u].cate_id,
            })
          }
        })
      } catch (error) {
        this.errorsAlerts(error)
      }
    },
    async getProducts (val, update, abort) {
      if (val.length < 3) {
        abort()
        return
      }
      try {
        var response = await ProductService.getProducts({ query: 'prod_name=' + val + '&cate_id=' + this.selectedCategory.value, token: this.decryptSession('token') })
        update(() => {
          this.products = []
          for (var u = 0; u < response.data.data.length; u++) {
            this.products.push({
              label: response.data.data[u].prod_name,
              value: response.data.data[u].prod_id,
              amount: response.data.data[u].prod_sale_price
            })
          }
        })
      } catch (error) {
        this.errorsAlerts(error)
      }
    },
    updateAmount () {
      this.modelTransaction.amount = this.modelTransaction.prod_id.amount
    },
    updateTransactionsTypes () {
      this.modelTransaction.transtype_id = ''

    },
    updateProducts () {
      this.modelTransaction.prod_id = ''
    },
    updateDescription () {
      if (this.modelTransaction.transtype_id.behavior == 'TIENDA') {
        this.modelTransaction.description = ''
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

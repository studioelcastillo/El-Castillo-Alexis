<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12"
        v-if="this.openGate('add-products', this.sUser.prof_id) || 
        (this.openGate('show-products', this.sUser.prof_id) && this.mode == 'show') || 
        (this.openGate('edit-products', this.sUser.prof_id) && this.mode == 'edit')"
      >
        <q-card flat bordered class="my-card">
          <q-form
              @submit="onSubmit"
              class="q-gutter-md"
            >
            <q-card-section v-if="!isDialog">
              <div class="q-px-md q-gutter-sm">
                <q-btn color="black" @click="goTo('products')" :label="'&lt; ' + 'Regresar'" />
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
                    v-model="product.cate_id"
                    label="Categoría"
                    label-color="primary"
                    :options="categories"
                    lazy-rules
                    :rules="[
                      val => !!val.value || 'Este campo es requerido',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.cate_id"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-select
                    filled
                    v-model="product.transtype_id"
                    label="Tipo de transferencia"
                    label-color="primary"
                    use-input
                    hide-selected
                    fill-input
                    :options="transactionsTypesOptions"
                    @filter="filterTransactionsTypes"
                    :rules="[
                      val => !!val.value || 'Este campo es requerido',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.transtype_id"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="product.code"
                    label="Código"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.code"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="product.name"
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
                  <q-input
                    filled
                    type="number"
                    v-model="product.purchase_price"
                    label="Precio de compra"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => val !== '' && !isNaN(parseInt(val)) || 'Este campo es requerido',
                      val => val >= 0 || 'Debe ser un numero positivo'
                    ]"
                    :readonly="mode == 'show' || readonlyFields.purchase_price"
                    step="any"
                  />
                </div>
                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type="number"
                    v-model="product.wholesaler_price"
                    label="Precio de venta mayorista"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => val !== '' && !isNaN(parseInt(val)) || 'Este campo es requerido',
                      val => val >= 0 || 'Debe ser un numero positivo'
                    ]"
                    :readonly="mode == 'show' || readonlyFields.wholesaler_price"
                    step="any"
                  />
                </div>
                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type="number"
                    v-model="product.sale_price"
                    label="Precio de venta modelo/valor"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => val !== '' && !isNaN(parseInt(val)) || 'Este campo es requerido',
                      val => val >= 0 || 'Debe ser un numero positivo'
                    ]"
                    :readonly="mode == 'show' || readonlyFields.sale_price"
                    step="any"
                  />
                </div>
                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type="number"
                    v-model="product.stock"
                    label="Stock"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => val !== '' && !isNaN(parseInt(val)) || 'Este campo es requerido',
                      val => val >= 0 || 'Debe ser un numero positivo'
                    ]"
                    :readonly="mode == 'show' || readonlyFields.stock"
                    step="any"
                  />
                </div>

              </div>
            </q-card-section>

            <q-separator inset />

            <q-card-section v-if="mode == 'create' || mode == 'edit'">
              <div>
                <q-btn type="submit" class="bg-primary text-white submit1" label="Enviar"/>
                <q-btn v-if="mode == 'edit'" @click="(isDialog) ? this.$emit('close') : this.mode = 'show';" label="Cancelar" />
                <q-btn v-else @click="(isDialog) ? this.$emit('close') : goTo('products')" label="Cancelar" />
              </div>
            </q-card-section>
            <q-card-section v-else-if="mode == 'show'">
              <div>
                <q-btn v-if="openGate('edit-products', sUser.prof_id)" class="bg-primary text-white submit1" label="Editar" @click="this.mode = 'edit'" />
              </div>
            </q-card-section>
          </q-form>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script>
import ProductService from 'src/services/ProductService'
import CategoryService from 'src/services/CategoryService'
import TransactionTypeService from 'src/services/TransactionTypeService'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'ProductForm',
  mixins: [xMisc, sGate],
  components: {
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
      initTitle: 'Crear producto',
      product: {
        id: 0,
        cate_id: '',
        transtype_id: '',
        code: '',
        name: '',
        purchase_price: 0,
        wholesaler_price: 0,
        sale_price: 0,
        stock: 0,
        created_at: '',
      },
      readonlyFields: {
        cate_id: false,
        transtype_id: false,
        code: false,
        name: false,
        created_at: false,
      },
      categories: [],
      transactionsTypes: [],
      transactionsTypesOptions: []
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
      this.product.id = (this.isDialog) ? this.dialogChildId : this.$route.params.id
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
        if (this.mode === 'create' && this.openGate('add-products', this.sUser.prof_id)) {
          var record = await ProductService.addProduct({
            cate_id: this.product.cate_id.value,
            transtype_id: this.product.transtype_id.value,
            prod_code: this.product.code,
            prod_name: this.product.name,
            prod_purchase_price: this.product.purchase_price,
            prod_wholesaler_price: this.product.wholesaler_price,
            prod_sale_price: this.product.sale_price,
            prod_stock: this.product.stock,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Creado')
          this.product.id = record.data.data.prod_id
        } else if (this.mode === 'edit' && this.openGate('edit-products', this.sUser.prof_id)) {
          var record = await ProductService.editProduct({
            id: (this.isDialog) ? this.dialogChildId : this.product.id,
            cate_id: this.product.cate_id.value,
            transtype_id: this.product.transtype_id.value,
            prod_code: this.product.code,
            prod_name: this.product.name,
            prod_purchase_price: this.product.purchase_price,
            prod_wholesaler_price: this.product.wholesaler_price,
            prod_sale_price: this.product.sale_price,
            prod_stock: this.product.stock,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Actualizado')
        }
        // if can edit >> edit, else >> show
        this.mode = (this.openGate('edit-products', this.sUser.prof_id)) ? 'edit' : 'show'
        if (this.isDialog) {
          this.$emit('save')
          this.getData()
        } else {
          this.goTo('products/' + this.mode + '/' + this.product.id)
          this.getData()
        }
        this.disableLoading()
      } catch (error) {
        console.log(error)
        console.log(error.response)
        this.disableLoading()
        if (error.response && error.response.data.error && error.response.data.error.code && error.response.data.error.message) {
          if (error.response.data.error.code === 'UNEXPECTED_ERROR') {
            this.alert('negative', error.response.data.error.message)
          } else {
            this.alert('warning', error.response.data.error.message)
          }
        } else if (error.response && error.response.data && error.response.data.message) {
          if (error.response.data.message === 'The prod code has already been taken.') {
            this.alert('warning', 'Ya existe un producto con ese codigo de producto.')
          }
        } else {
          this.errorsAlerts(error)
        }
      }
    },
    async getData () {
      if (this.mode === 'edit') {
        this.initTitle = 'Editar producto'
      } else if (this.mode === 'show') {
        this.initTitle = 'Ver producto'
      }

      try {
        this.activateLoading('Cargando')
        if ((this.openGate('show-products', this.sUser.prof_id) && this.mode == 'show') || (this.openGate('edit-products', this.sUser.prof_id) && this.mode == 'edit')) {
          var response = await ProductService.getProduct({ id: this.product.id, token: this.decryptSession('token') })
          this.product.id = response.data.data[0].prod_id
          this.product.code = response.data.data[0].prod_code
          this.product.name = response.data.data[0].prod_name
          this.product.purchase_price = response.data.data[0].prod_purchase_price
          this.product.wholesaler_price = response.data.data[0].prod_wholesaler_price
          this.product.sale_price = response.data.data[0].prod_sale_price
          this.product.stock = response.data.data[0].prod_stock
          this.product.created_at = response.data.data[0].created_at
          if (response.data.data[0].category) {
            this.product.cate_id = {
              label: response.data.data[0].category.cate_name,
              value: response.data.data[0].category.cate_id,
            }
          }

          if (response.data.data[0].transaction_type) {
            this.product.transtype_id = {
              label: response.data.data[0].transaction_type.transtype_name,
              value: response.data.data[0].transaction_type.transtype_id,
            }
          }
        }
        this.disableLoading()
      } catch (error) {
        this.errorsAlerts(error)
        this.disableLoading()
      }
    },
    async getSelects () {
      var response
      // categories
      this.categories = []
      this.categories.push({
        label: '',
        value: '',
      })
      if (this.openGate('add-products', this.sUser.prof_id) || (this.openGate('show-products', this.sUser.prof_id) && this.mode == 'show') || (this.openGate('edit-products', this.sUser.prof_id) && this.mode == 'edit')) {
        // async
        response = await CategoryService.getCategories({ token: this.decryptSession('token') })
        for (var u = 0; u < response.data.data.length; u++) {
          this.categories.push({
            label: response.data.data[u].cate_name,
            value: response.data.data[u].cate_id,
          })
        }

        response = await TransactionTypeService.getTransactionsTypes({ token: this.decryptSession('token') })
        for (var u = 0; u < response.data.data.length; u++) {
          this.transactionsTypes.push({
            label: response.data.data[u].transtype_name,
            value: response.data.data[u].transtype_id,
          })
        }

        // pre-select from dialog parent
        if (this.isDialog) {
          for (var dp = 0; dp < this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))].length; dp++) {
            if (parseInt(this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))][dp].value) === parseInt(this.parentId)) {
              this.product[this.parentField] = {
                label: this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))][dp].label,
                value: this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))][dp].value,
              }
              this.readonlyFields[this.parentField] = true
            }
          }
        }
      }
    },
    filterTransactionsTypes (val, update, abort) {
      update(() => {
        const needle = val.toLowerCase()
        this.transactionsTypesOptions = this.transactionsTypes.filter(v => v.label.toLowerCase().indexOf(needle) > -1)
      })
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

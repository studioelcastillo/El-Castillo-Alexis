<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12" v-if="this.openGate('add-categories', this.sUser.prof_id) || 
        (this.openGate('show-categories', this.sUser.prof_id) && this.mode == 'show') || 
        (this.openGate('edit-categories', this.sUser.prof_id) && this.mode == 'edit')"
      >
        <q-card flat bordered class="my-card">
          <q-form
              @submit="onSubmit"
              class="q-gutter-md"
            >
            <q-card-section v-if="!isDialog">
              <div class="q-px-md q-gutter-sm">
                <q-btn color="black" @click="goTo('categories')" :label="'&lt; ' + 'Regresar'" />
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
                  <q-input
                    filled
                    type=""
                    v-model="category.name"
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

              </div>
            </q-card-section>

            <q-separator inset />

            <q-card-section v-if="mode == 'create' || mode == 'edit'">
              <div>
                <q-btn type="submit" class="bg-primary text-white submit1" label="Enviar"/>
                <q-btn v-if="mode == 'edit'" @click="(isDialog) ? this.$emit('close') : this.mode = 'show';" label="Cancelar" />
                <q-btn v-else @click="(isDialog) ? this.$emit('close') : goTo('categories')" label="Cancelar" />
              </div>
            </q-card-section>
            <q-card-section v-else-if="mode == 'show'">
              <div>
                <q-btn v-if="openGate('edit-categories', sUser.prof_id)" class="bg-primary text-white submit1" label="Editar" @click="this.mode = 'edit'" />
              </div>
            </q-card-section>
          </q-form>
        </q-card>
        <Products v-if="(this.mode == 'show' || this.mode == 'edit') && category.id > 0" :is-subgrid="true" :parent-mode="mode" parent-table="categories" parent-field="cate_id" :parent-id="category.id" />
      </div>
    </div>
  </div>
</template>

<script>
import CategoryService from 'src/services/CategoryService'
import Products from 'src/pages/Product/Products.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'CategoryForm',
  mixins: [xMisc, sGate],
  components: {
    Products,
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
      initTitle: 'Crear categoría',
      category: {
        id: 0,
        name: '',
        created_at: '',
      },
      readonlyFields: {
        name: false,
        created_at: false,
      },
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
      this.category.id = (this.isDialog) ? this.dialogChildId : this.$route.params.id
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
          var record = await CategoryService.addCategory({
            cate_name: this.category.name,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Creado')
          this.category.id = record.data.data.cate_id
        } else if (this.mode === 'edit') {
          var record = await CategoryService.editCategory({
            id: (this.isDialog) ? this.dialogChildId : this.category.id,
            cate_name: this.category.name,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Actualizado')
        }
        // if can edit >> edit, else >> show
        this.mode = (this.openGate('edit-categories', this.sUser.prof_id)) ? 'edit' : 'show'
        if (this.isDialog) {
          this.$emit('save')
          this.getData()
        } else {
          this.goTo('categories/' + this.mode + '/' + this.category.id)
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
        this.initTitle = 'Editar categoría'
      } else if (this.mode === 'show') {
        this.initTitle = 'Ver categoría'
      }

      try {
        this.activateLoading('Cargando')
        if ((this.openGate('show-categories', this.sUser.prof_id) && this.mode == 'show') || (this.openGate('edit-categories', this.sUser.prof_id) && this.mode == 'edit')) {
          var response = await CategoryService.getCategory({ id: this.category.id, token: this.decryptSession('token') })
          this.category.id = response.data.data[0].cate_id
          this.category.name = response.data.data[0].cate_name
          this.category.created_at = response.data.data[0].created_at
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
            this.category[this.parentField] = {
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

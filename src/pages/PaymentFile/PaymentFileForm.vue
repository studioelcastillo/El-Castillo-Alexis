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
                <q-btn color="black" @click="goTo('payments_files')" :label="'&lt; ' + 'Regresar'" />
              </div>
            </q-card-section>

            <q-separator v-if="!isDialog" class="q-my-none" inset />

            <q-card-section v-if="isDialog" class="row items-center q-pb-none">
              <h5 class="is-size-3">{{initTitle}} # {{paymentFile.id}}</h5>
              <q-space />
              <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>

            <q-separator v-if="isDialog" inset />

            <q-card-section>
              <h5 v-if="!isDialog" class="is-size-3">{{initTitle}}</h5>
              <br v-if="!isDialog">
              <div class="row q-col-gutter-sm">
                <div class="col-xs-12 col-sm-3">
                  <q-input
                    filled
                    type=""
                    v-model="paymentFile.description"
                    label="Descripción"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.description"
                  />
                </div>

                <div class="col-xs-12 col-sm-3">
                  <q-input
                    filled
                    type=""
                    v-model="paymentFile.filename"
                    label="Nombre de archivo"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.filename"
                  />
                </div>

                <div class="col-xs-12 col-sm-3">
                  <q-input
                    filled
                    type=""
                    v-model="paymentFile.template"
                    label="Plantilla"
                    label-color="primary"
                    lazy-rules
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                      val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.template"
                  />
                </div>

                <div class="col-xs-12 col-sm-3">
                  <q-input
                    filled
                    type="number"
                    v-model="paymentFile.total"
                    label="Total"
                    label-color="primary"
                    lazy-rules
                    step="any"
                    :rules="[
                      val => !!val || 'Este campo es requerido',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.total"
                  />
                </div>

              </div>
            </q-card-section>

            <q-separator inset />

            <!-- <q-card-section v-if="mode == 'create' || mode == 'edit'">
              <div>
                <q-btn type="submit" class="bg-primary text-white submit1" label="Enviar"/>
                <q-btn v-if="mode == 'edit'" @click="(isDialog) ? this.$emit('close') : this.mode = 'show';" label="Cancelar" />
                <q-btn v-else @click="(isDialog) ? this.$emit('close') : goTo('payments_files')" label="Cancelar" />
              </div>
            </q-card-section>
            <q-card-section v-else-if="mode == 'show'">
              <div>
                <q-btn v-if="openGate('edit-payments_files', sUser.prof_id)" class="bg-primary text-white submit1" label="Editar" @click="this.mode = 'edit'" />
              </div>
            </q-card-section> -->
            <q-card-section style="display: flex; justify-content: center; gap: 10px;">
              <q-btn v-if="openGate('edit-payments_files', sUser.prof_id)" class="bg-primary text-white submit1" label="Descargar archivo de pagos" @click="downloadFile(paymentFile.id)">
                <q-icon class="text-yellow q-ml-sm" name="move_to_inbox"/>
              </q-btn>
              <q-btn v-if="openGate('edit-payments_files', sUser.prof_id)" class="bg-red-7 text-white submit1" label="Eliminar archivo de pagos" @click="deleteDialog(paymentFile.id)">
                <q-icon class="text-white q-ml-sm" name="delete"/>
              </q-btn>
            </q-card-section>
          </q-form>
        </q-card>
        <Payments v-if="(this.mode == 'show' || this.mode == 'edit') && paymentFile.id > 0" :is-subgrid="true" :parent-mode="mode" parent-table="payments_files" parent-field="payfile_id" :parent-id="paymentFile.id" />
      </div>
    </div>
  </div>
</template>

<script>
import PaymentFileService from 'src/services/PaymentFileService'
import Payments from 'src/pages/Payment/Payments.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'PaymentFileForm',
  mixins: [xMisc, sGate],
  components: {
    Payments,
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
      initTitle: 'Crear cargue de pagos',
      paymentFile: {
        id: 0,
        description: '',
        filename: '',
        template: '',
        total: '',
        created_by: '',
        created_at: '',
      },
      readonlyFields: {
        description: false,
        filename: false,
        template: false,
        total: false,
        created_by: false,
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
      this.paymentFile.id = (this.isDialog) ? this.dialogChildId : this.$route.params.id
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
          var record = await PaymentFileService.addPaymentFile({
            payfile_description: this.paymentFile.description,
            payfile_filename: this.paymentFile.filename,
            payfile_template: this.paymentFile.template,
            payfile_total: this.paymentFile.total,
            created_by: this.paymentFile.created_by.value,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Creado')
          this.paymentFile.id = record.data.data.payfile_id
        } else if (this.mode === 'edit') {
          var record = await PaymentFileService.editPaymentFile({
            id: (this.isDialog) ? this.dialogChildId : this.paymentFile.id,
            payfile_description: this.paymentFile.description,
            payfile_filename: this.paymentFile.filename,
            payfile_template: this.paymentFile.template,
            payfile_total: this.paymentFile.total,
            created_by: this.paymentFile.created_by.value,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Actualizado')
        }
        // if can edit >> edit, else >> show
        this.mode = (this.openGate('edit-payments_files', this.sUser.prof_id)) ? 'edit' : 'show'
        if (this.isDialog) {
          this.$emit('save')
          this.getData()
        } else {
          this.goTo('payments_files/' + this.mode + '/' + this.paymentFile.id)
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
        this.initTitle = 'Editar cargue de pagos'
      } else if (this.mode === 'show') {
        this.initTitle = 'Ver cargue de pagos'
      }

      try {
        this.activateLoading('Cargando')
        var response = await PaymentFileService.getPaymentFile({ id: this.paymentFile.id, token: this.decryptSession('token') })
        this.paymentFile.id = response.data.data[0].payfile_id
        this.paymentFile.description = response.data.data[0].payfile_description
        this.paymentFile.filename = response.data.data[0].payfile_filename
        this.paymentFile.template = response.data.data[0].payfile_template
        this.paymentFile.total = response.data.data[0].payfile_total
        this.paymentFile.created_at = response.data.data[0].created_at

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
        if (this.parentTable && this.parentField) {
          for (var dp = 0; dp < this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))].length; dp++) {
            if (parseInt(this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))][dp].value) === parseInt(this.parentId)) {
              this.paymentFile[this.parentField] = {
                label: this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))][dp].label,
                value: this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))][dp].value,
              }
              this.readonlyFields[this.parentField] = true
            }
          }
        }
      }
    },
    downloadFile (id) {
      // url
      var url = this.getApiUrl('/api/payments_files/download/' + id + '?access_token=' + this.decryptSession('token'))
      var win = window.open(url, '_blank')
      win.focus()
    },
    deleteDialog (id) {
      this.$q.dialog({
        title: 'Confirmar',
        message: '¿Estás seguro de eliminar este registro?',
        cancel: 'Cancelar',
        ok: 'Aceptar',
        persistent: true
      }).onOk(() => {
        this.deleteData(id)
      }).onCancel(() => {
        // console.log('>>>> Cancel')
      })
    },
    async deleteData (id) {
      try {
        this.activateLoading('Cargando')
        var response = await PaymentFileService.delPaymentFile({ id: id, token: this.decryptSession('token') })
        if (response.data.status === 'success') {
          this.alert('positive', 'Eliminado')
          this.$emit('save')
          this.$emit('close')
        } else {
          this.alert('negative', 'Error')
        }
        this.disableLoading()
      } catch (error) {
        console.log(error)
        this.disableLoading()

        var resError = { code: null, message: null }
        resError.code = error?.response?.data?.error?.code || error?.response?.data?.code || null
        resError.message = error?.response?.data?.error?.message || error?.response?.data?.message || null

        if (resError.code && resError.message) {
          if (resError.code === 'UNEXPECTED_ERROR') {
            this.alert('negative', resError.message)
          } else {
            this.alert('warning', resError.message)
          }
        } else {
          this.errorsAlerts(error)
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

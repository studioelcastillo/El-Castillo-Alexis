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
                <q-btn color="black" @click="goTo('models_streams_files')" :label="'&lt; ' + 'Regresar'" />
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
                    v-model="modelStreamFile.description"
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

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="modelStreamFile.filename"
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

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="modelStreamFile.template"
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

              </div>
            </q-card-section>

            <!-- <q-separator inset /> -->

            <!-- <q-card-section v-if="mode == 'create' || mode == 'edit'">
              <div>
                <q-btn type="submit" class="bg-primary text-white submit1" label="Enviar"/>
                <q-btn v-if="mode == 'edit'" @click="(isDialog) ? this.$emit('close') : this.mode = 'show';" label="Cancelar" />
                <q-btn v-else @click="(isDialog) ? this.$emit('close') : goTo('models_streams_files')" label="Cancelar" />
              </div>
            </q-card-section>
            <q-card-section v-else-if="mode == 'show'">
              <div>
                <q-btn v-if="openGate('edit-models_streams_files', sUser.prof_id)" class="bg-primary text-white submit1" label="Editar" @click="this.mode = 'edit'" />
              </div>
            </q-card-section> -->
          </q-form>
        </q-card>
        <ModelsStreams v-if="(this.mode == 'show' || this.mode == 'edit') && modelStreamFile.id > 0" :is-subgrid="true" :parent-mode="mode" parent-table="models_streams_files" parent-field="modstrfile_id" :parent-id="modelStreamFile.id" />
      </div>
    </div>
  </div>
</template>

<script>
import ModelStreamFileService from 'src/services/ModelStreamFileService'
import ModelsStreams from 'src/pages/ModelStream/ModelsStreams.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'ModelStreamFileForm',
  mixins: [xMisc, sGate],
  components: {
    ModelsStreams,
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
      initTitle: 'Crear cargue de streams',
      modelStreamFile: {
        id: 0,
        description: '',
        filename: '',
        template: '',
        created_by: '',
        created_at: '',
      },
      readonlyFields: {
        description: false,
        filename: false,
        template: false,
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
      this.modelStreamFile.id = (this.isDialog) ? this.dialogChildId : this.$route.params.id
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
          var record = await ModelStreamFileService.addModelStreamFile({
            modstrfile_description: this.modelStreamFile.description,
            modstrfile_filename: this.modelStreamFile.filename,
            modstrfile_template: this.modelStreamFile.template,
            created_by: this.modelStreamFile.created_by.value,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Creado')
          this.modelStreamFile.id = record.data.data.modstrfile_id
        } else if (this.mode === 'edit') {
          var record = await ModelStreamFileService.editModelStreamFile({
            id: (this.isDialog) ? this.dialogChildId : this.modelStreamFile.id,
            modstrfile_description: this.modelStreamFile.description,
            modstrfile_filename: this.modelStreamFile.filename,
            modstrfile_template: this.modelStreamFile.template,
            created_by: this.modelStreamFile.created_by.value,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Actualizado')
        }
        // if can edit >> edit, else >> show
        this.mode = (this.openGate('edit-models_streams_files', this.sUser.prof_id)) ? 'edit' : 'show'
        if (this.isDialog) {
          this.$emit('save')
          this.getData()
        } else {
          this.goTo('models_streams_files/' + this.mode + '/' + this.modelStreamFile.id)
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
        this.initTitle = 'Editar cargue de streams'
      } else if (this.mode === 'show') {
        this.initTitle = 'Ver cargue de streams'
      }

      try {
        this.activateLoading('Cargando')
        var response = await ModelStreamFileService.getModelStreamFile({ id: this.modelStreamFile.id, token: this.decryptSession('token') })
        this.modelStreamFile.id = response.data.data[0].modstrfile_id
        this.modelStreamFile.description = response.data.data[0].modstrfile_description
        this.modelStreamFile.filename = response.data.data[0].modstrfile_filename
        this.modelStreamFile.template = response.data.data[0].modstrfile_template
        this.modelStreamFile.created_at = response.data.data[0].created_at

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
              this.modelStreamFile[this.parentField] = {
                label: this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))][dp].label,
                value: this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))][dp].value,
              }
              this.readonlyFields[this.parentField] = true
            }
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

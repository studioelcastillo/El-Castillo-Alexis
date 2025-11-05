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
                <q-btn color="black" @click="goTo('studios_rooms')" :label="'&lt; ' + 'Regresar'" />
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
                    v-model="studioRoom.std_id"
                    label="Estudio"
                    label-color="primary"
                    :options="studios"
                    lazy-rules
                    :rules="[
                      val => !!val.value || 'Este campo es requerido',
                    ]"
                    :readonly="mode == 'show' || readonlyFields.std_id"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    type=""
                    v-model="studioRoom.name"
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
                <q-btn v-else @click="(isDialog) ? this.$emit('close') : goTo('studios_rooms')" label="Cancelar" />
                <q-btn v-if="mode == 'edit'" class="bg-green text-white" @click="mode = 'create'; studioRoom.id = null; onSubmit()" label="Crear nuevo" />
              </div>
            </q-card-section>
            <q-card-section v-else-if="mode == 'show'">
              <div>
                <q-btn v-if="openGate('edit-studios_rooms', sUser.prof_id)" class="bg-primary text-white submit1" label="Editar" @click="this.mode = 'edit'" />
              </div>
            </q-card-section>
          </q-form>
        </q-card>
        <!-- <StudiosModels v-if="(this.mode == 'show' || this.mode == 'edit') && studioRoom.id > 0" :is-subgrid="true" :parent-mode="mode" parent-table="studios_rooms" parent-field="stdroom_id" :parent-id="studioRoom.id" /> -->
      </div>
    </div>
  </div>
</template>

<script>
import StudioRoomService from 'src/services/StudioRoomService'
import StudioService from 'src/services/StudioService'
import StudiosModels from 'src/pages/StudioModel/StudiosModels.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'StudioRoomForm',
  mixins: [xMisc, sGate],
  components: {
    // StudiosModels,
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
      initTitle: 'Crear cuarto',
      studioRoom: {
        id: 0,
        std_id: '',
        name: '',
        created_at: '',
      },
      readonlyFields: {
        std_id: false,
        name: false,
        created_at: false,
      },
      studios: [],
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
      this.studioRoom.id = (this.isDialog) ? this.dialogChildId : this.$route.params.id
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
          var record = await StudioRoomService.addStudioRoom({
            std_id: this.studioRoom.std_id.value,
            stdroom_name: this.studioRoom.name,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Creado')
          this.studioRoom.id = record.data.data.stdroom_id
        } else if (this.mode === 'edit') {
          var record = await StudioRoomService.editStudioRoom({
            id: (this.isDialog && this.dialogChildId) ? this.dialogChildId : this.studioRoom.id,
            std_id: this.studioRoom.std_id.value,
            stdroom_name: this.studioRoom.name,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Actualizado')
        }
        // if can edit >> edit, else >> show
        this.mode = (this.openGate('edit-studios_rooms', this.sUser.prof_id)) ? 'edit' : 'show'
        if (this.isDialog) {
          this.$emit('save')
          this.getData()
        } else {
          this.goTo('studios_rooms/' + this.mode + '/' + this.studioRoom.id)
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
        this.initTitle = 'Editar cuarto'
      } else if (this.mode === 'show') {
        this.initTitle = 'Ver cuarto'
      }

      try {
        this.activateLoading('Cargando')
        var response = await StudioRoomService.getStudioRoom({ id: this.studioRoom.id, token: this.decryptSession('token') })
        this.studioRoom.id = response.data.data[0].stdroom_id
        this.studioRoom.name = response.data.data[0].stdroom_name
        this.studioRoom.created_at = response.data.data[0].created_at
        if (response.data.data[0].studio) {
          this.studioRoom.std_id = {
            label: response.data.data[0].studio.std_name,
            value: response.data.data[0].studio.std_id,
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
      // studios
      this.studios = []
      this.studios.push({
        label: '',
        value: '',
      })
      // async
      response = await StudioService.getStudios({ token: this.decryptSession('token') })
      for (var u = 0; u < response.data.data.length; u++) {
        this.studios.push({
          label: response.data.data[u].std_name,
          value: response.data.data[u].std_id,
        })
      }

      // pre-select from dialog parent
      if (this.isDialog) {
        for (var dp = 0; dp < this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))].length; dp++) {
          if (parseInt(this[this.cammelCase(this.getRelName(this.parentTable, this.parentField))][dp].value) === parseInt(this.parentId)) {
            this.studioRoom[this.parentField] = {
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

<template>
  <div>
    <div class="row q-col-gutter-sm">
      <div class="col-xs-12 col-sm-12">
        <q-uploader
          v-if="showInputFile"
          ref="FileUploader"
          style="width: 100%;"
          :multiple="multiple"
          auto-upload
          :accept="accept"
          :hide-upload-btn="true"
          :max-total-size="maxTotalFilesize"
          :factory="uploadFile"
          @failed="onFileUploadedFailed"
          @uploaded="onFileUploaded"
          @removed="onFileRemoved"
        >
          <!-- header -->
          <template v-slot:header="scope">
            <div class="row no-wrap items-center q-pa-sm q-gutter-xs">
              <q-btn v-if="scope.queuedFiles.length > 0" icon="clear_all" @click="scope.removeQueuedFiles" round dense flat >
                <q-tooltip>Vaciar</q-tooltip>
              </q-btn>
              <q-btn v-if="scope.uploadedFiles.length > 0" icon="done_all" @click="scope.removeUploadedFiles" round dense flat >
                <q-tooltip>Remove Uploaded Files</q-tooltip>
              </q-btn>
              <q-spinner v-if="scope.isUploading" class="q-uploader__spinner" />
              <div class="col">
                <div class="q-uploader__title">{{ multiple ? 'Peso máximo total entre todos los archivos:' : 'Peso máximo:' }} {{parseInt(maxTotalFilesize / 1024 / 1024)}}M</div>
                <div class="q-uploader__subtitle">{{ scope.uploadSizeLabel }}</div>
              </div>
              <q-btn v-if="scope.canAddFiles" type="a" icon="add_box" @click="scope.pickFiles" round dense flat>
                <q-uploader-add-trigger />
                <q-tooltip>Pick Files</q-tooltip>
              </q-btn>

              <q-btn v-if="scope.canUpload" icon="cloud_upload" @click="scope.upload" round dense flat >
                <q-tooltip>Cargar archivos</q-tooltip>
              </q-btn>

              <q-btn v-if="scope.isUploading" icon="clear" @click="scope.abort" round dense flat >
                <q-tooltip>Cancelar Carga</q-tooltip>
              </q-btn>
            </div>
          </template>
        </q-uploader>
        <br>
        <br>
        <q-separator inset />
      </div>

      <div v-if="filesUploaded.length > 0" class="col-xs-12 col-sm-12">
        <h6 class="is-size-3">{{ multiple ? 'Archivos Cargados' : 'Archivo Cargado' }}</h6>
        <br>
        <q-card v-for="(file, index) in filesUploaded" :key="index" flat bordered class="my-card" >
          <q-card-section v-if="desing === 1" class="row items-center q-gutter-x-sm">
            <div class="col text-caption text-grey q-pr-sm" style="overflow-wrap: break-word;">
              {{ file.filename }}
            </div>
            <div class="col-auto">
              <div class="col-auto text-subtitle1">
                <q-avatar rounded :color="getFileData(file.filename).color" text-color="white" :icon="getFileData(file.filename).icon" />
              </div>
              <br>
              <q-space/>
              <q-btn round color="green" @click="downloadFile(file.filename)">
                <q-avatar size="28px" color="green" text-color="white" icon="file_download"/>
              </q-btn>
              <q-btn v-if="canDelete" round color="red" @click="deleteFile(file.id, index)" class="q-ml-sm">
                <q-avatar size="28px" color="red" text-color="white" icon="delete_forever"/>
              </q-btn>
            </div>
          </q-card-section>
          <q-card-section v-else class="row items-center q-gutter-x-sm">
            <div class="col-auto text-subtitle1">
              <q-avatar rounded :color="getFileData(file.filename).color" text-color="white" :icon="getFileData(file.filename).icon" />
            </div>
            <div class="col text-caption text-grey q-pr-sm" style="overflow-wrap: break-word;">
              {{ file.filename }}
            </div>
            <div class="col-auto">
              <q-space/>
              <q-btn round color="green" @click="downloadFile(file.filename)">
                <q-avatar size="28px" color="green" text-color="white" icon="file_download"/>
              </q-btn>
              <q-btn v-if="canDelete" round color="red" @click="deleteFile(file.id, index)" class="q-ml-sm">
                <q-avatar size="28px" color="red" text-color="white" icon="delete_forever"/>
              </q-btn>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { api } from 'src/boot/axios'
import { xMisc } from '../mixins/xMisc.js'

export default defineComponent({
  name: 'GkUploaderForm',
  mixins: [xMisc],
  props: {
    showInputFile: {
      type: Boolean,
      default: true
    },
    multiple: {
      type: Boolean,
      default: false
    },
    accept: {
      type: String,
      default: "*"
    },
    filesUploaded: {
      type: Array,
      default: () => []
    },
    canDelete: {
      type: Boolean,
      default: false
    },
    uploadUrl: {
      type: String,
      default: ''
    },
    downloadUrl: {
      type: String,
      default: ''
    },
    value: {
      type: Array,
      default: () => []
    },
    desing: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      sUser: {},
      extensions: {
        'DOCX': { color: 'blue', icon: 'description' },
        'DOC': { color: 'blue', icon: 'description' },
        'PDF': { color: 'red', icon: 'picture_as_pdf' },
        'XLS': { color: 'green', icon: 'table_view' },
        'XLSX': { color: 'green', icon: 'table_view' },
        'CVS': { color: 'green', icon: 'table_view' },
        'PPTX': { color: 'orange', icon: 'pie_chart' },
        'PPT': { color: 'orange', icon: 'pie_chart' },
        'TIFF': { color: 'green', icon: 'image' },
        'JPG': { color: 'green', icon: 'image' },
        'JPEG': { color: 'green', icon: 'image' },
        'PNG': { color: 'green', icon: 'image' },
        'ZIP': { color: 'pink', icon: 'folder_zip' },
        'RAR': { color: 'pink', icon: 'folder_zip' },
        'DEFAULT': { color: 'black', icon: 'quiz' }
      },
      files: this.value,
      maxTotalFilesize: 1
    }
  },
  created () {
    this.sUser = this.decryptSession('user')
    this.getMaxSize();
  },
  methods: {
    async getMaxSize () {
      var response = await api.get('api/php/file-upload-max-size')
      this.maxTotalFilesize = response.data
    },
    getFileData (filename) {
      let ext = filename.split('.').pop();
      var response = this.extensions['DEFAULT']
      if (Object.prototype.hasOwnProperty.call(this.extensions, ext.toUpperCase())) {
        response = this.extensions[ext.toUpperCase()]
      }

      return response
    },
    uploadFile (files) {
      return new Promise((resolve) => {
        resolve({
          url: this.getApiUrl(this.uploadUrl),
          method: 'POST',
          fieldName: 'file',
        })
      })
    },
    // file upload
    onFileUploaded ({ files, xhr }) {
      if (xhr.response && /description/.test(xhr.response)) {
        var res = JSON.parse(xhr.response)
        this.files.push(res.data)
        this.$emit('update:modelValue', this.files)
        this.$emit('fileUploaded')
      }
    },
    onFileUploadedFailed (info) {
      if (info.xhr.response && /error/.test(info.xhr.response)) {
        var error = { response: { data: JSON.parse(info.xhr.response) }}
        this.errorsAlerts(error)
      }
    },
    onFileRemoved (files) {
      // loop removed files
      for (var rf = 0; rf < files.length; rf++) {
        // loop rfp files to upload
        for (var fu = 0; fu < this.files.length; fu++) {
          // remove file from list
          if (this.files[fu].description == files[rf].name) {
            this.files.splice(fu, 1)
          }
        }
      }
      this.$emit('update:modelValue', this.files)
    },
    downloadFile (filename) {
      var url = this.getApiUrl(this.downloadUrl + filename)
      var win = window.open(url, '_blank')
      win.focus()
    },
    deleteFile(id, index) {
      this.$emit('deleteFile', id, index)
    }
  }
})
</script>

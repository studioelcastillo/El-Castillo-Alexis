<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12" v-if="openGate('show-all-users', sUser.prof_id) || openGate('show-owned-contract-users', sUser.prof_id) || openGate('show-owned-hierarchy-users', sUser.prof_id)">
        <q-card flat bordered class="my-card">
          <q-card-section>
            <div class="text-h5 text-weight-bolder">
              Usuarios
              <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('add-users', sUser.prof_id)" class="text-green" style="cursor: pointer;" @click="(isSubgrid) ? openSubgridForm('create') : goTo('users/new')"> <q-icon name="add_box"/> </a>
              <q-btn v-if="openGate('download-accounts-users', sUser.prof_id)" class="q-ml-xs" rounded color="blue" @click="downloadExcel()">
                <q-icon name="move_to_inbox"/><div class="q-ml-xs">Descargar cuentas</div>
                <q-tooltip :delay="100" :offset="[0, 10]">Inactiva las cuentas que no posean ingresos en los últimos 3 meses</q-tooltip>
              </q-btn>
              <q-btn v-if="openGate('massive-inactivate-users', sUser.prof_id)" class="q-ml-xs" rounded color="red-5" @click="inactivateMassive()">
                <q-icon name="cancel"/><div class="q-ml-xs">Inactivación masiva</div>
                <q-tooltip :delay="100" :offset="[0, 10]">Inactiva las cuentas que no posean ingresos en los últimos 3 meses. <br> Tambien inactiva las modelos que no posean cuentas activas</q-tooltip>
              </q-btn>
            </div>
          </q-card-section>

          <q-separator inset />

          <q-card-section>
            <q-table
              v-if="openGate('show-all-users', sUser.prof_id) || openGate('show-owned-contract-users', sUser.prof_id) || openGate('show-owned-hierarchy-users', sUser.prof_id)"
              title="Usuarios"
              dense
              :columns="columns"
              :rows="dataset"
              :filter="filter"
              :loading="loading"
              :visible-columns="visibleColumns"
              rows-per-page-label="Registros por página"
              no-data-label="No hay registros disponibles"
              v-model:pagination="pagination"
              @request="onRequest"
              binary-state-sort
            >
              <!-- header -->
              <template v-slot:top="props">
                <div class="row q-col-gutter-sm"  style="max-width: 70%; min-width: 70%;">
                  <div class="col-xs-6 col-sm-6">
                    <gk-select-multiple
                      filled
                      v-model="studiosSelected"
                      label="Estudios"
                      label-color=""
                      use-input
                      hide-selected
                      fill-input
                      :options="studiosOptions"
                      :min-selection="0"
                      all-items-label="TODOS"
                      margin-bottom="18px"
                      @update:model-value="updateSelectMultiple"
                    />
                  </div>
                  <div class="col-xs-6 col-sm-6">
                    <gk-select-multiple
                      filled
                      v-model="profilesSelected"
                      label="Perfiles"
                      label-color=""
                      use-input
                      hide-selected
                      fill-input
                      :options="profilesOptions"
                      :min-selection="0"
                      all-items-label="TODOS"
                      margin-bottom="18px"
                      @update:model-value="updateSelectMultiple"
                    />
                  </div>
                </div>
                <q-space />
                <q-input borderless dense debounce="300" v-model="filter" placeholder="Buscar">
                  <template v-slot:append>
                    <q-icon name="search" />
                  </template>
                </q-input>
                <!-- fullscreen -->
                <q-btn
                  flat round dense
                  :icon="props.inFullscreen ? 'fullscreen_exit' : 'fullscreen'"
                  @click="props.toggleFullscreen"
                  class="q-ml-md"
                />
                <!-- another buttons -->
                <q-btn v-if="openGate('export-users', sUser.prof_id)" round size="sm" color="primary" icon="archive" @click="exportUsers()">
                  <q-tooltip :offset="[0, 10]">{{$t('export')}}</q-tooltip>
                </q-btn>
                <br>
                <q-toggle
                  v-model="filterToggleActive"
                  @update:model-value="onRequest({ pagination: pagination, filter: filter })"
                  color="green"
                  checked-icon="check"
                  unchecked-icon="clear"
                  :label="filterToggleActiveLabel"
                />
              </template>
              <!-- body -->
              <template v-slot:body="props">
                <q-tr :props="props">
                  <q-td key="user_id" :props="props">{{ props.row.user_id }}</q-td>
                  <q-td v-if="openGate('activate-inactivate-users', sUser.prof_id)" key="user_active" :props="props">
                    <q-toggle
                        v-model="props.row.toggleActive"
                        :value="props.row.toggleActive !== undefined ? props.row.toggleActive : false"
                      @update:model-value="toggleActive(props.row)"
                      color="green"
                      checked-icon="check"
                      unchecked-icon="clear"
                    />
                  </q-td>
                  <q-td key="user_image" :props="props">
                    <div
                      class="my-card text-white"
                      style="display: flex; height: 4rem; width: 4rem; justify-content: center; align-items: end; border-radius: 500px; overflow: auto;"
                      :style="{
                        backgroundImage: 'url(' + this.getApiUrl('/images/models/' + (((props.row.prof_id === 4 || props.row.prof_id === 5) && props.row.profile_picture_document) ? 'documents/' + props.row.profile_picture_document.doc_url : props.row.user_image)) + ')',
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        backgroundColor: '#b5b5b5'
                      }"
                    >
                    </div>
                  </q-td>
                  <q-td key="user_identification" :props="props">{{ props.row.user_identification }}</q-td>
                  <q-td key="user_name" :props="props">{{ props.row.user_name }}</q-td>
                  <q-td key="user_surname" :props="props">{{ props.row.user_surname }}</q-td>
                  <q-td key="user_age" :props="props">{{ props.row.user_age }}</q-td>
                  <q-td key="std_name" :props="props">
                    <template v-if="props.row.studios != null">
                      <template v-for="(studio, key) in props.row.studios.split(';')">
                        <q-chip v-if="studio != null" :key="key">{{ studio }}</q-chip>
                      </template>
                    </template>
                  </q-td>
                  <q-td key="user_email" :props="props">{{ props.row.user_email }}</q-td>
                  <q-td key="profile.prof_name" :props="props"><q-chip>{{ props.row.profile.prof_name }}</q-chip></q-td>
                  <q-td key="user_telephone" :props="props">{{ props.row.user_telephone }}</q-td>
                  <q-td key="user_address" :props="props">{{ props.row.user_address }}</q-td>
                  <q-td key="created_at" :props="props">{{ convertUTCDateToLocalDate(props.row.created_at, 'DD/MM/YYYY hh:mm:ss') }}</q-td>
                  <q-td key="action" :props="props">
                    <a v-if="openGate('show-dashboard-as-user', sUser.prof_id)" style="cursor: pointer; padding: 5px;" @click="goTo('home/as/' + props.row.user_id, '_blank')"> <q-icon size="md" name="preview"/>
                      <q-tooltip :offset="[0, 10]">Ver inicio como usuario</q-tooltip>
                    </a>
                    <a v-if="openGate('show-users', sUser.prof_id)" class="text-blue-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('show', props.row.user_id) : goTo('users/show/' + props.row.user_id)"> <q-icon size="md" name="visibility"/>
                      <q-tooltip :offset="[0, 10]">Ver</q-tooltip>
                    </a>
                    <a v-if="(!isSubgrid || parentMode == 'edit') && (openGate('edit-users', sUser.prof_id) || openGate('edit-users-bank-data', sUser.prof_id))" class="text-blue-grey-8" style="cursor: pointer; padding: 5px;" @click="(isSubgrid) ? openSubgridForm('edit', props.row.user_id) : goTo('users/edit/' + props.row.user_id)"> <q-icon size="md" name="edit"/>
                      <q-tooltip :offset="[0, 10]">Editar</q-tooltip>
                    </a>
                    <a v-if="env.change_users_password === 'true' && (!isSubgrid || parentMode == 'edit') && openGate('change-password-users', sUser.prof_id) && ![1].includes(props.row.profile.prof_id)" class="text-yellow-9" style="cursor: pointer; padding: 5px;" @click="chosedUser.id = props.row.user_id, changePasswordDialog = true"> <q-icon size="md" name="key"/>
                      <q-tooltip :offset="[0, 10]">Cambiar contraseña</q-tooltip>
                    </a>
                    <!-- <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('delete-users', sUser.prof_id)" class="text-red" style="cursor: pointer;" @click="deleteDialog(props.row.user_id)"> <q-icon size="md" name="delete"/>
                      <q-tooltip :offset="[0, 10]">Eliminar</q-tooltip>
                    </a> -->
                  </q-td>
                </q-tr>
              </template>
            </q-table>
          </q-card-section>
        </q-card>

        <q-dialog v-if="isSubgrid" v-model="dialog">
          <q-card style="width: 100%;">
            <UserForm :is-dialog="true" :parent-table="parentTable" :parent-field="parentField" :parent-id="parentId" :dialog-child-id="dialogChildId" :modeprop="dialogMode" @save="onRequest(); dialog = false" @close="dialogChildId = null; dialog = false"/>
          </q-card>
        </q-dialog>

        <q-dialog v-model="changePasswordDialog">
          <q-card style="width: 100%;">
            <q-form @submit="onChangePassword" class="q-gutter-md">
              <q-separator v-if="!isDialog" class="q-my-none" inset />

              <q-card-section class="row items-center q-pb-none">
                <h5 class="is-size-3">Cambiar contraseña</h5>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup />
              </q-card-section>

              <q-separator inset />

              <q-card-section>
                <div class="row q-col-gutter-sm">
                  <div class="col-xs-12 col-sm-12">
                    <q-input
                      filled
                      type="password"
                      v-model="chosedUser.password"
                      label="Contraseña"
                      label-color=""
                      lazy-rules
                      :rules="[
                        val => !!val || 'Este campo es requerido',
                      ]"
                    />
                  </div>
                </div>
              </q-card-section>

              <q-separator inset />

              <q-card-section>
                <div>
                  <q-btn type="submit" class="bg-primary text-white submit1" label="Enviar"/>
                  <q-btn @click="changePasswordDialog = false" label="Cancelar" />
                </div>
              </q-card-section>
            </q-form>

          </q-card>
        </q-dialog>
      </div>
    </div>
  </div>
</template>

<script>
import GkSelectMultiple from 'src/components/GkSelectMultiple.vue'
import UserService from 'src/services/UserService'
import ModelAccountService from 'src/services/ModelAccountService'
import ProfileService from 'src/services/ProfileService'
import StudioService from 'src/services/StudioService'
import UserForm from 'src/pages/User/UserForm.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'UsersList',
  mixins: [xMisc, sGate],
  components: {
    UserForm,
    GkSelectMultiple
  },
  props: {
    isSubgrid: {
      type: Boolean,
      default: false
    },
    parentMode: {
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
    }
  },
  setup () {
    return {
      env: { change_users_password: process.env.CHANGE_USERS_PASSWORD },
    }
  },
  data () {
    return {
      sUser: {},
      loading: false,
      changePasswordDialog: false,
      chosedUser: {
        id: '',
        password: ''
      },
      dialog: false,
      dialogMode: 'create',
      dialogChildId: null,
      dataset: [],
      filter: '',
      pagination: {
        sortBy: 'created_at',
        descending: true,
        page: 1,
        rowsPerPage: 20,
        rowsNumber: 14
      },
      visibleColumns: ['user_id', 'user_name', 'profile.prof_name' ],
      columns: [
        {
          name: 'user_id',
          required: true,
          label: 'Id',
          align: 'left',
          field: row => row.user_id,
          sortable: true
        },
        {
          name: 'user_active',
          required: this.openGate('activate-inactivate-users', this.decryptSession('user').prof_id),
          label: 'Activo',
          align: 'left',
          field: row => row.user_active,
          sortable: false
        },
        {
          name: 'user_image',
          required: true,
          label: 'Imagen',
          align: 'left',
          field: row => row.user_image,
          sortable: false
        },
        {
          name: 'user_identification',
          required: true,
          label: 'Identificación',
          align: 'left',
          field: row => row.user_identification,
          sortable: false
        },
        {
          name: 'modacc_username',
          required: false,
          label: 'Nick',
          align: 'left',
          field: row => row.studio_model,
          sortable: false
        },
        {
          name: 'user_name',
          required: true,
          label: 'Nombre',
          align: 'left',
          field: row => row.user_name,
          sortable: true
        },
        {
          name: 'user_surname',
          required: true,
          label: 'Apellido',
          align: 'left',
          field: row => row.user_surname,
          sortable: true
        },
        {
          name: 'user_age',
          required: true,
          label: 'Edad',
          align: 'left',
          field: row => row.user_age,
          sortable: false
        },
        {
          name: 'std_name',
          required: true,
          label: 'Estudios',
          align: 'left',
          field: row => row.studio_model,
          sortable: false
        },
        {
          name: 'user_email',
          required: false,
          label: 'Email',
          align: 'left',
          field: row => row.user_email,
          sortable: true
        },
        {
          name: 'profile.prof_name',
          required: true,
          label: 'Perfil',
          align: 'left',
          field: row => row.profile.prof_name,
          sortable: false
        },
        {
          name: 'created_at',
          required: true,
          label: 'Fecha creación',
          align: 'left',
          field: row => row.created_at,
          sortable: true
        },
        {
          name: 'action',
          required: true,
          label: 'Acciones',
          align: 'left',
          sortable: false
        }
      ],
      repeatedStudios: [],
      profilesOptions: [],
      profilesSelected: [],
      studiosOptions: [],
      studiosSelected: [],
      filterToggleActive: true
    }
  },
  computed: {
    filterToggleActiveLabel () {
      return (this.filterToggleActive) ? 'Usuarios activos' : 'Usuarios inactivos'
    }
  },
  created () {
    this.sUser = this.decryptSession('user')
    this.getSelects()
    this.onRequest({
      pagination: this.pagination,
      filter: this.filter
    })
  },
  methods: {
    openSubgridForm (mode, id) {
      this.dialogMode = mode
      this.dialogChildId = id
      this.dialog = true
    },
    deleteq (id) {
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
        var response = await UserService.delUser({ id: id, token: this.decryptSession('token') })
        if (response.data.status === 'success') {
          this.alert('positive', 'Eliminado')
          this.onRequest()
        } else {
          this.alert('negative', 'Error')
        }
        this.disableLoading()
      } catch (error) {
        this.errorsAlerts(error)
        this.disableLoading()
      }
    },
    downloadExcel() {
      // query
      var query = ''
      if (this.isSubgrid) {
        query = '&' + this.parentField + '=' + this.parentId
      }
      const boolModacc = (this.filterToggleActive) ? 'true' : 'false'
      query += '&modacc_active=' + boolModacc
      // url
      var url = this.getApiUrl('/api/models_accounts/export?access_token=' + this.decryptSession('token') + query)
      // console.log(query)
      // console.log(url)
      var win = window.open(url, '_blank')
      win.focus()      
    },
    inactivateMassive() {
      const _this = this
      this.$q.dialog({
        title: 'Confirmar',
        message: '¿Estás seguro de iniciar la inactivación masiva?',
        cancel: 'Cancelar',
        ok: 'Aceptar',
        persistent: true
      }).onOk(async () => {
        try {
          _this.activateLoading('Cargando')
          var response = await ModelAccountService.inactivateMassiveModelAccount({ token: _this.decryptSession('token') })
          if (response.data.status === 'success') {
            _this.alert('positive', 'Proceso terminado')
            _this.onRequest()
          } else {
            _this.alert('negative', 'Error')
          }
          _this.disableLoading()
        } catch (error) {
          _this.errorsAlerts(error)
          _this.disableLoading()
        }
      }).onCancel(() => {
        // console.log('>>>> Cancel')
      })
    },
    async toggleActive (row) {
      var newState = row.toggleActive
      try {
        this.activateLoading(this.$t('loading'))

        // activate
        if (newState === true) {
          var response = await UserService.activateUser({ id: row.user_id, token: this.decryptSession('token') })
          var successMessage = this.$t('activated')
        // inactivate
        } else if (newState === false) {
          var response = await UserService.inactivateUser({ id: row.user_id, token: this.decryptSession('token') })
          var successMessage = this.$t('inactivated')
        }

        if (response.data.status === 'success') {
          this.alert('positive', successMessage)
          row.user_active = newState
          row.toggleActive = newState
        } else {
          this.alert('negative', this.$t('errorMessage'))
          row.user_active = !newState
          row.toggleActive = !newState
        }
        this.onRequest({
          pagination: this.pagination,
          filter: this.filter
        })
        this.disableLoading()
      } catch (error) {
        console.log(error)
        row.user_active = !newState
        row.toggleActive = !newState
        this.errorsAlerts(error)
        this.disableLoading()
      }
    },
    exportUsers () {
      this.activateLoading(this.$t('loading'))
      var url = this.getApiUrl('/api/users/export?access_token=' + this.decryptSession('token') + '&tz=' + (Intl.DateTimeFormat().resolvedOptions().timeZone) + '&tzo=' + new Date().getTimezoneOffset())
      var win = window.open(url, '_blank')
      win.focus()
      this.disableLoading()
    },
    async onChangePassword () {
      try {
        this.activateLoading('Cargando')
        // var response = {}
        // POST
        var record = await UserService.changePassword({
          id: this.chosedUser.id,
          user_password: this.chosedUser.password,
          token: this.decryptSession('token')
        })
        this.alert('positive', 'Contraseña actualizado')
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
    async fetchFromServer (start, length, filter, sortBy, descending) {
      var columns = []
      var prefix = 'users.'
      for (var u = 0; u < this.columns.length; u++) {
        if (this.columns[u].name !== 'action' && this.columns[u].name !== 'profile.prof_name' && this.columns[u].name !== 'std_name' && this.columns[u].name !== 'user_age') {
          prefix = (this.columns[u].name == 'modacc_username') ? 'ma.': 'users.'
          columns.push(prefix + this.columns[u].name)
        }
      }
      const studiosSelected = this.studiosSelected.map(std => std.value)
      const profilesSelected = this.profilesSelected.map(prof => prof.value)
      let query = ''
      query += 'start=' + start
      query += '&length=' + length
      query += '&sortby=users.' + sortBy
      query += '&dir=' + ((descending) ? 'DESC' : 'ASC')
      query += '&filter=' + filter
      query += '&columns=' + columns.join()
      query += '&studios=' + studiosSelected
      query += '&profiles=' + profilesSelected
      query += '&activeusers=' + this.filterToggleActive
      //query += (this.openGate('show-owned-contract-users', this.sUser.prof_id)) ? '&filterownedstudiosusers=true' : ''
      var response = await UserService.getUsersDatatable({ query: query, token: this.decryptSession('token') }) //await PetitionService.getPetitions({ query: query, token: this.decryptSession('token') })
      return response.data
    },
    async onRequest (props) {
      // default
      if (props == undefined) {
        props = { pagination: null, filter: null }
      }

      if (!props.pagination) {
        props.pagination = {
          page: this.pagination.page,
          rowsPerPage: this.pagination.rowsPerPage,
          sortBy: this.pagination.sortBy,
          descending: this.pagination.descending,
        }
      }

      if (!props.filter) {
        props.filter = this.filter
      }

      // args
      const { page, rowsPerPage, sortBy, descending } = props.pagination
      const filter = props.filter
      this.loading = true

      const startRow = (page - 1) * rowsPerPage
      const data = await this.fetchFromServer(startRow, rowsPerPage, filter, sortBy, descending)
      this.dataset = data.data
      this.pagination.rowsNumber = data.recordsTotal
      this.pagination.page = page
      this.pagination.rowsPerPage = rowsPerPage
      this.pagination.sortBy = sortBy
      this.pagination.descending = descending

      this.loading = false
    },
    async getSelects () {
      this.profilesOptions = []
      this.studiosOptions = []
      const response = await ProfileService.getProfiles({ token: this.decryptSession('token') })
      for (var u = 0; u < response.data.data.length; u++) {
        this.profilesOptions.push({
          label: response.data.data[u].prof_name,
          value: response.data.data[u].prof_id
        })
      }
      const response2 = await StudioService.getStudios({ query: '', token: this.decryptSession('token') })
      for (var u = 0; u < response2.data.data.length; u++) {
        this.studiosOptions.push({
          label: response2.data.data[u].std_name,
          value: response2.data.data[u].std_id
        })
      }
    },
    updateSelectMultiple () {
      this.onRequest({
        pagination: this.pagination,
        filter: this.filter
      })
    }
  }
}
</script>
<style type="text/css">
  body {
    background: #ECF0F3;
  }
  .q-table__top {
    align-items: start;
  }
</style>

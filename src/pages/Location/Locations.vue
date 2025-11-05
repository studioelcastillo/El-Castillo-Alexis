<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12" v-if="this.openGate('menu-locations', this.sUser.prof_id)">
        <q-card flat bordered class="my-card">
          <q-card-section>
            <div class="text-h5 text-weight-bolder">
              Localizaciones
              <a v-if="(!isSubgrid || parentMode == 'edit') && openGate('add-location', sUser.prof_id)" class="text-green" style="cursor: pointer;" @click="addCountry()"> <q-icon name="add_box"/> </a>
            </div>
          </q-card-section>

          <q-separator inset />

          <q-card-section>
            <q-table
              title="Localizaciones"
              dense
              :columns="columns"
              :rows="dataset"
              :filter="filter"
              :loading="loading"
              :visible-columns="visibleColumns"
              rows-per-page-label="Registros por página"
              no-data-label="No hay registros disponibles"
              v-model:pagination="pagination"
            >
              <template v-slot:top-right="props">
                <q-input borderless dense debounce="300" v-model="filter" placeholder="Buscar">
                  <template v-slot:append>
                    <q-icon name="search" />
                  </template>
                </q-input>
                <q-btn
                  flat round dense
                  :icon="props.inFullscreen ? 'fullscreen_exit' : 'fullscreen'"
                  @click="props.toggleFullscreen"
                  class="q-ml-md"
                />
              </template>
              <template v-slot:body="props">
                <q-tr :props="props">
                  <q-td key="expand" auto-width>
                    <q-btn v-if="props.row.departments.length > 0" size="sm" color="black" round dense @click="countryToggleExpand(props.row.country_id)" :icon="countryIsExpanded(props.row.country_id) ? 'remove' : 'add'" />
                  </q-td>
                  <q-td key="country_name" :props="props">{{ props.row.country_name }}</q-td>
                  <q-td key="dpto_name" :props="props"></q-td>
                  <q-td key="city_name" :props="props"></q-td>
                  <q-td key="action" :props="props">
                    <a v-if="openGate('add-location', sUser.prof_id)" class="text-green" style="cursor: pointer; padding: 5px;" @click="addDepartment(props.row.country_id)"> <q-icon size="md" name="add_box"/>
                      <q-tooltip :offset="[0, 10]">Crear departamento</q-tooltip>
                    </a>
                    <a v-if="openGate('edit-locations', sUser.prof_id)" class="text-blue-grey-8" style="cursor: pointer; padding: 5px;" @click="editCountry(props.row.country_id, props.row.country_name)"> <q-icon size="md" name="edit"/>
                      <q-tooltip :offset="[0, 10]">Editar</q-tooltip>
                    </a>
                    <a v-if="openGate('delete-locations', sUser.prof_id)" class="text-red" style="cursor: pointer;" @click="deleteDialog(props.row.country_id, 1)"> <q-icon size="md" name="delete"/>
                      <q-tooltip :offset="[0, 10]">Eliminar</q-tooltip>
                    </a>
                  </q-td>
                </q-tr>
                <template v-for="(department, index) in props.row.departments" :key="department.dpto_name + index">
                  <q-tr v-if="countryIsExpanded(props.row.country_id)" :props="props">
                    <q-td key="expand" auto-width></q-td>
                    <q-td key="country_name" :props="props">
                      <q-btn v-if="department.cities.length > 0" size="sm" color="black" round dense @click="departmentToggleExpand(props.row.country_id, department.dpto_id)" :icon="departmentIsExpanded(props.row.country_id, department.dpto_id) ? 'remove' : 'add'" />
                    </q-td>
                    <q-td key="dpto_name" :props="props">{{ department.dpto_name }}</q-td>
                    <q-td key="city_name" :props="props"></q-td>
                    <q-td key="action" :props="props">
                      <a v-if="openGate('add-location', sUser.prof_id)" class="text-green" style="cursor: pointer; padding: 5px;" @click="addCity(department.dpto_id)"> <q-icon size="md" name="add_box"/>
                        <q-tooltip :offset="[0, 10]">Crear ciudad</q-tooltip>
                      </a>
                      <a v-if="openGate('edit-locations', sUser.prof_id)" class="text-blue-grey-8" style="cursor: pointer; padding: 5px;" @click="editDepartment(department.dpto_id, department.dpto_name)"> <q-icon size="md" name="edit"/>
                        <q-tooltip :offset="[0, 10]">Editar</q-tooltip>
                      </a>
                      <a v-if="openGate('delete-locations', sUser.prof_id)" class="text-red" style="cursor: pointer;" @click="deleteDialog(department.dpto_id, 2)"> <q-icon size="md" name="delete"/>
                        <q-tooltip :offset="[0, 10]">Eliminar</q-tooltip>
                      </a>
                    </q-td>
                  </q-tr>
                  <template v-for="(city, index2) in department.cities" :key="index2">
                    <q-tr v-if="departmentIsExpanded(props.row.country_id, department.dpto_id) && countryIsExpanded(props.row.country_id)" :props="props" style="background-color: #ececec;" >
                      <q-td key="expand" auto-width></q-td>
                      <q-td key="country_name" :props="props"></q-td>
                      <q-td key="dpto_name" :props="props"></q-td>
                      <q-td key="city_name" :props="props">{{ city.city_name }}</q-td>
                      <q-td key="action" :props="props">
                        <a v-if="openGate('edit-locations', sUser.prof_id)" class="text-blue-grey-8" style="cursor: pointer; padding: 5px;" @click="editCity(city.city_id, city.city_name)"> <q-icon size="md" name="edit"/>
                          <q-tooltip :offset="[0, 10]">Editar</q-tooltip>
                        </a>
                        <a v-if="openGate('delete-locations', sUser.prof_id)" class="text-red" style="cursor: pointer;" @click="deleteDialog(city.city_id, 3)"> <q-icon size="md" name="delete"/>
                          <q-tooltip :offset="[0, 10]">Eliminar</q-tooltip>
                        </a>
                      </q-td>
                    </q-tr>
                  </template>
                </template>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
        <q-dialog v-model="dialogShow">
          <q-card style="min-width: 350px">
            <q-card-section>
              <div class="text-h6">{{ dialogTitle }}</div>
            </q-card-section>

            <q-card-section class="q-pt-none">
              <q-input dense v-model="dialogInput" autofocus/>
            </q-card-section>

            <q-card-actions align="right" class="text-primary">
              <q-btn flat label="Cancel" v-close-popup />
              <q-btn flat label="Enviar" @click="onSubmit"/>
            </q-card-actions>
          </q-card>
        </q-dialog>
      </div>
    </div>
  </div>
</template>

<script>
import LocationService from 'src/services/LocationService'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'LocationsList',
  mixins: [xMisc, sGate],
  data () {
    return {
      sUser: {},
      loading: false,
      dialog: false,
      dialogMode: 'create',
      dialogChildId: null,
      dataset: [],
      filter: '',
      visibleColumns: ['cate_id', 'prod_code', 'prod_name', 'created_at'],
      columns: [
        {
          name: 'prod_id',
          required: true,
          label: '',
          align: 'left',
          field: row => row.prod_id,
          sortable: true
        },
        {
          name: 'country_name',
          required: true,
          label: 'País',
          align: 'left',
          field: row => (row.country_name) ? row.country_name : null,
          sortable: true
        },
        {
          name: 'dpto_name',
          required: true,
          label: 'Departmento',
          align: 'left',
          field: row => (row.dpto_name) ? row.dpto_name : null,
          sortable: true
        },
        {
          name: 'city_name',
          required: true,
          label: 'Municipio',
          align: 'left',
          field: row => (row.city_name) ? row.city_name : null,
          sortable: true
        },
        {
          name: 'action',
          required: true,
          label: 'Acciones',
          align: 'left',
          sortable: true
        }
      ],
      countryExpandedRows: {},
      departmentExpandedRows: [],
      dialogShow: false,
      dialogId: 0,
      dialogInput: '',
      dialogTitle: 'Agregar país',
      dialogAction: 0,
      pagination: {
        sortBy: 'prod_i',
        descending: true,
        page: 1,
        rowsPerPage: 20
      }
    }
  },
  created () {
    this.sUser = this.decryptSession('user')
    this.getLocations()
  },
  methods: {
    async onSubmit () { 
      try {
        this.activateLoading('Cargando')
        // var response = {}
        // POST
        var record = null
        if (this.dialogAction === 1) {
          record = await LocationService.addCountry({
            country_name: this.dialogInput,
            token: this.decryptSession('token')
          })
        }
        else if (this.dialogAction === 2) {
          record = await LocationService.editCountry({
            id: this.dialogId,
            country_name: this.dialogInput,
            token: this.decryptSession('token')
          })
        }
        else if (this.dialogAction === 3) {
          record = await LocationService.addDepartment({
            country_id: this.dialogId,
            dpto_name: this.dialogInput,
            token: this.decryptSession('token')
          })
        }
        else if (this.dialogAction === 4) {
          record = await LocationService.editDepartment({
            id: this.dialogId,
            dpto_name: this.dialogInput,
            token: this.decryptSession('token')
          })
        }
        else if (this.dialogAction === 5) {
          record = await LocationService.addCity({
            dpto_id: this.dialogId,
            city_name: this.dialogInput,
            token: this.decryptSession('token')
          })
        }
        else if (this.dialogAction === 6) {
          record = await LocationService.editCity({
            id: this.dialogId,
            city_name: this.dialogInput,
            token: this.decryptSession('token')
          })
        }
        this.alert('positive', 'Creado')
        this.getLocations()
        this.dialogShow = false
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
    async getLocations () {
      try {
        this.loading = true
        if (this.openGate('menu-locations', this.sUser.prof_id)) {
          var response = await LocationService.getLocations({ token: this.decryptSession('token') })
          this.dataset = response.data.data
        }
        this.loading = false
      } catch (error) {
        this.errorsAlerts(error)
        this.loading = false
      }
    },
    deleteDialog (id, action) {
      this.$q.dialog({
        title: 'Confirmar',
        message: '¿Estás seguro de eliminar este registro?',
        cancel: 'Cancelar',
        ok: 'Aceptar',
        persistent: true
      }).onOk(() => {
        this.deleteData(id, action)
      }).onCancel(() => {
        // console.log('>>>> Cancel')
      })
    },
    async deleteData (id, action) {
      try {
        this.activateLoading('Cargando')
        var response = null
        if (action === 1) {
          response = await LocationService.delCountry({ id: id, token: this.decryptSession('token') })
        } else if (action === 2) {
          response = await LocationService.delDepartment({ id: id, token: this.decryptSession('token') })
        } else if (action === 3) {
          response = await LocationService.delCity({ id: id, token: this.decryptSession('token') })
        }
        // var response = await ProductService.delProduct({ id: id, token: this.decryptSession('token') })
        if (response.data.status === 'success') {
          this.alert('positive', 'Eliminado')
          this.getLocations()
        } else {
          this.alert('negative', 'Error')
        }
        this.disableLoading()
      } catch (error) {
        this.errorsAlerts(error)
        this.disableLoading()
      }
    },
    countryToggleExpand (countryId) {
      this.countryExpandedRows[countryId] = !this.countryExpandedRows[countryId]
    },
    // Verificar si una fila está expandida
    countryIsExpanded (countryId) {
      return this.countryExpandedRows[countryId] === true
    },
    departmentToggleExpand (countryId, dptoId) {
      if (typeof this.departmentExpandedRows[countryId] === 'undefined') {
        this.departmentExpandedRows[countryId] = {}
      }
      this.departmentExpandedRows[countryId][dptoId] = !this.departmentExpandedRows[countryId][dptoId]
    },
    // Verificar si una fila está expandida
    departmentIsExpanded (countryId, dptoId) {
      if (typeof this.departmentExpandedRows[countryId] !== 'undefined') {
        return this.departmentExpandedRows[countryId][dptoId] === true
      }
      return false
    },
    addCountry () {
      this.dialogAction = 1
      this.dialogId = 0
      this.dialogInput = ''
      this.dialogTitle = 'Agregar país'
      this.dialogShow = true
    },
    editCountry (countryId, countryName) {
      this.dialogAction = 2
      this.dialogId = countryId
      this.dialogInput = countryName
      this.dialogTitle = 'Editar país'
      this.dialogShow = true
    },
    addDepartment (countryId) {
      this.dialogAction = 3
      this.dialogId = countryId
      this.dialogInput = ''
      this.dialogTitle = 'Agregar departamento'
      this.dialogShow = true
    },
    editDepartment (dptoId, dptoName) {
      this.dialogAction = 4
      this.dialogId = dptoId
      this.dialogInput = dptoName
      this.dialogTitle = 'Editar departamento'
      this.dialogShow = true
    },
    addCity (dptoId) {
      this.dialogAction = 5
      this.dialogId = dptoId
      this.dialogInput = ''
      this.dialogTitle = 'Agregar ciudad'
      this.dialogShow = true
    },
    editCity (cityId, cityName) {
      this.dialogAction = 6
      this.dialogId = cityId
      this.dialogInput = cityName
      this.dialogTitle = 'Editar ciudad'
      this.dialogShow = true
    }
  }
}
</script>
<style type="text/css">
  body {
    background: #ECF0F3;
  }
</style>

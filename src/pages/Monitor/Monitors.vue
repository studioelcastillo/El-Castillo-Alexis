<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12" v-if="this.openGate('menu-monitors', this.sUser.prof_id)">
        <q-card flat bordered class="my-card">
          <q-card-section>
            <div class="text-h5 text-weight-bolder">Monitores</div>
          </q-card-section>
          <q-separator inset />
          <q-card-section>
            
            <q-table
              title="Monitores"
              dense
              :columns="columns"
              :visible-columns="visibleColumns"
              :rows="dataset"
              :loading="loading"
              rows-per-page-label="Registros por página"
              no-data-label="No hay registros disponibles"
              v-model:pagination="pagination"
            >
              <template v-slot:top-right="props">
                <q-btn
                  flat round dense
                  :icon="props.inFullscreen ? 'fullscreen_exit' : 'fullscreen'"
                  @click="props.toggleFullscreen"
                  class="q-ml-md"
                />
              </template>
              <template v-slot:body="props">
                <hierarchy-row
                  :props="props"
                  :expanded-rows="expandedRows"
                  :s-user="sUser"
                  @toggle-expand="toggleExpanded"
                  @create-dialog="createDialog"
                  @delete-dialog="deleteDialog"
                />
              </template>
            </q-table>
          </q-card-section>
        </q-card>
        <q-dialog v-model="dialogShow">
          <q-card style="min-width: 50%">
            <q-card-section>
              <div class="text-h6">{{ dialogTitle }}</div>
            </q-card-section>

            <q-card-section class="q-pt-none">
              <!-- <gk-autocomplete
                filled
                v-model="dialogUserChild"
                :label="dialogUserLabel"
                label-color=""
                :options="users"
              /> -->
              <q-select
                filled
                v-model="dialogUserChild"
                :label="dialogUserLabel"
                label-color="primary"
                use-input
                hide-selected
                fill-input
                :options="users"
                @filter="getUsers"
                :hint="'Digitar al menos 3 caracteres para seleccionar ' + dialogUserLabel"
              >
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      Sin resultados
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
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
import MonitorService from 'src/services/MonitorService'
import HierarchyRow from './HierarchyRow.vue'
import UserService from 'src/services/UserService'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'MonitorsList',
  mixins: [xMisc, sGate],
  components: { HierarchyRow},
  data () {
    return {
      sUser: {},
      loading: false,
      dataset: [],
      filter: '',
      visibleColumns: ['chief_monitor', 'monitor', 'model', 'action'],
      columns: [
        {
          name: 'expand',
          required: true,
          label: '',
          align: 'left',
          field: row => row.user_id,
          sortable: true
        },
        {
          name: 'chief_monitor',
          required: true,
          label: 'Jefe Monitor',
          align: 'left',
          field: row => (row.user_name) ? row.user_name : null,
          sortable: true
        },
        {
          name: 'monitor',
          required: true,
          label: 'Monitor',
          align: 'left',
          field: row => (row.user_name) ? row.user_name : null,
          sortable: true
        },
        {
          name: 'model',
          required: true,
          label: 'Modelo',
          align: 'left',
          field: row => (row.user_name) ? row.user_name : null,
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
      expandedRows: {},
      pagination: {
        sortBy: 'monitor',
        descending: true,
        page: 1,
        rowsPerPage: 20
      },
      dialogShow: false,
      dialogTitle: '',
      dialogUserLabel: 'Monitor',
      dialogUserParent: 0,
      dialogUserChild: 0,
      dialogUserProfIds: [],
      users: []
    }
  },
  created () {
    this.sUser = this.decryptSession('user')
    this.getRelations()
    //this.getUsers()
  },
  methods: {

    async onSubmit () { 
      try {
        this.activateLoading('Cargando')
        if (!this.dialogUserChild.value || !this.dialogUserParent) {
          this.alert('warning', 'Debe seleccionar un modelo')
          this.disableLoading()
          return
        }
        const record = await MonitorService.addRelation({
          userchild_id: this.dialogUserChild.value,
          userparent_id: this.dialogUserParent,
          token: this.decryptSession('token')
        })
        this.alert('positive', 'Creado')
        this.dialogUserChild = ''
        this.getRelations()
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
    async getRelations () {
      try {
        this.loading = true
        if (this.openGate('menu-monitors', this.sUser.prof_id)) {
          const response = await MonitorService.getChiefMonitorsRelations({ token: this.decryptSession('token') })
          const arrayRows = Object.values(response.data.data)
          this.dataset = arrayRows
        }
        this.loading = false
      } catch (error) {
        this.errorsAlerts(error)
        this.loading = false
      }
    },
    async getUsers (val, update, abort) {
      if (val.length < 3) {
        abort()
        return
      }
      try {
        var response = await UserService.getModelsByOwnerStudio({ search: val, prof_ids: this.dialogUserProfIds, user_id: this.dialogUserParent, token: this.decryptSession('token') })
        update(() => {
          this.users = response.data.data
        })
      } catch (error) {
        this.errorsAlerts(error)
      }
    },
    deleteDialog (userParentId, userChidlId) {
      this.$q.dialog({
        title: 'Confirmar',
        message: '¿Estás seguro de eliminar esta relación?',
        cancel: 'Cancelar',
        ok: 'Aceptar',
        persistent: true
      }).onOk(() => {
        this.deleteRelation(userParentId, userChidlId)
      }).onCancel(() => {
        // console.log('>>>> Cancel')
      })
    },
    async deleteRelation (userParentId, userChidlId) {
      try {
        this.activateLoading('Cargando')
        const response = await MonitorService.delRelation({userParentId: userParentId, userChidlId: userChidlId, token: this.decryptSession('token')})
        if (response.data.status === 'success') {
          this.alert('positive', 'Eliminado')
          this.getRelations()
        } else {
          this.alert('negative', 'Error')
        }
        this.disableLoading()
      } catch (error) {
        this.errorsAlerts(error)
        this.disableLoading()
      }
    },
    toggleExpanded (userId) {
      this.expandedRows[userId] = !this.expandedRows[userId]
    },
    createDialog (userId, dialogTitle, dialogUserLabel, dialogUserProfIds) {
      this.dialogUserProfIds = dialogUserProfIds
      this.dialogUserLabel = dialogUserLabel
      this.dialogUserParent = userId
      this.dialogTitle = dialogTitle
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

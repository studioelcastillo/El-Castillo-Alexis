<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card">
          <q-card-section>
            <div class="text-h5 text-weight-bolder">Cuentas</div>
          </q-card-section>
          <q-separator inset />
          <q-card-section>
            <q-table
              title="Cuentas"
              dense
              :columns="columns"
              :rows="dataset"
              :filter="filter"
              :loading="loading"
              rows-per-page-label="Registros por página"
              no-data-label="No hay registros disponibles"
              :pagination="pagination"
            >
              <!-- header -->
              <template>
                <!-- filter -->
                <q-input borderless dense debounce="300" v-model="filter" placeholder="Buscar">
                  <template v-slot:append>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </template>
              <!-- body -->
              <template v-slot:body="props">
                <q-tr :props="props">
                  <q-td key="accacc_name" :props="props">{{ props.row.accacc_name }}</q-td>
                  <q-td key="accacc_number" :props="props">{{ props.row.accacc_number }}</q-td>
                  <q-td key="action" :props="props">
                    <a v-if="openGate('edit-accounts', sUser.prof_id)" class="text-blue-grey-8" style="cursor: pointer; padding: 5px;" @click="editAccount(props.row.accacc_id, props.row.accacc_name, props.row.accacc_number)">
                      <q-icon size="md" name="edit"/>
                      <q-tooltip :offset="[0, 10]">Editar</q-tooltip>
                    </a>
                  </q-td>
                </q-tr>
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
import AccountService from 'src/services/AccountService'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'AccountsList',
  mixins: [xMisc, sGate],
  setup () {
    return {
    }
  },
  data () {
    return {
      sUser: {},
      loading: false,
      dialog: false,
      dialogMode: 'create',
      dialogChildId: null,
      dataset: [],
      filter: '',
      pagination: {
        rowsPerPage: 0
      },
      columns: [
        {
          name: 'accacc_name',
          required: true,
          label: 'Nombre',
          align: 'left',
          field: row => row.accacc_entity,
          sortable: true
        },
        {
          name: 'accacc_number',
          required: true,
          label: 'Nro. de cuenta',
          align: 'left',
          field: row => row.accacc_number,
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
      dialogShow: false,
      dialogId: 0,
      dialogInput: '',
      dialogTitle: 'Editar cuenta'
    }
  },
  created () {
    this.sUser = this.decryptSession('user')
    this.getAccounts()
  },
  methods: {
    async getAccounts () {
      try {
        this.loading = true
        var response = await AccountService.getAccounts({ token: this.decryptSession('token') })
        this.dataset = response.data.data
        this.loading = false
      } catch (error) {
        this.errorsAlerts(error)
        this.loading = false
      }
    },
    async onSubmit () { 
      try {
        this.activateLoading('Cargando')
        // var response = {}
        // POST
        var record = null
        record = await AccountService.editAccount({
          id: this.dialogId,
          accacc_number: this.dialogInput,
          token: this.decryptSession('token')
        })
        this.alert('positive', 'Creado')
        this.getAccounts()
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
    editAccount (account_id, account_name, account_number) {
      this.dialogId = account_id
      this.dialogInput = account_number
      this.dialogTitle = 'Editar numero de cuenta de ' + account_name 
      this.dialogShow = true
    },
  }
}
</script>
<style type="text/css">
  body {
    background: #ECF0F3;
  }
</style>

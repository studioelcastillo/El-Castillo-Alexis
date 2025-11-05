<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12" v-if="this.openGate('menu-commission_tree', this.sUser.prof_id)">
        <q-card flat bordered class="my-card">
          <q-card-section>
            <div class="text-h5 text-weight-bolder">
              Comisiones
              <a
                v-if="openGate('add-commission_tree', sUser.prof_id)"
                class="text-green"
                style="cursor: pointer;"
                @click="toCreateCommission(null)"
              > 
                <q-icon name="add_box"/> 
              </a>
            </div>
          </q-card-section>
          <q-separator inset />
          <q-card-section>
            <div
              class="commission-row"
              @dragover.prevent="onRootDragOver"
              @dragenter="onRootDragEnter"
              @dragleave="onRootDragLeave"
              @drop="onRootDrop"
              :class="{ 'drag-over': dragOverNode === 'root' }"
            >
              <span>Soltar aquí para mover al nivel raíz</span>
            </div>
            <q-tree
              v-model:expanded="treeExpanded"
              :nodes="dataset"
              node-key="comm_id"
              label-key="user_name"
              children-key="childs"
            >
              <template v-slot:default-header="prop">
                <div
                  draggable="true"
                  @dragstart="onDragStart($event, prop.node)"
                  @dragover="onDragOver($event, prop.node)"
                  @drop="onDrop($event, prop.node)"
                  @dragenter="onDragEnter($event, prop.node)"
                  @dragleave="onDragLeave($event, prop.node)"
                  :class="{ 'drag-over': dragOverNode === prop.node.comm_id }"
                  style="width: 100%; padding: 4px; border-radius: 4px; transition: background-color 0.2s; display: flex; align-items: center; gap: 4px;"
                >
                  <a
                    v-if="openGate('add-commission_tree', sUser.prof_id) && prop.node.std_id === null"
                    class="text-green"
                    style="cursor: pointer; padding: 5px;"
                    @click.stop="toCreateCommission(prop.node)"
                  > 
                    <q-icon size="md" name="add_box"/>
                    <q-tooltip :offset="[0, 10]">Crear relacion</q-tooltip>
                  </a>
                  <a 
                    v-if="openGate('edit-commission_tree', sUser.prof_id) && prop.node.std_id === null"
                    class="text-blue-grey-8"
                    style="cursor: pointer; padding: 5px;"
                    @click.stop="toEditCommission(prop.node)"
                  >
                    <q-icon size="md" name="edit"/>
                    <q-tooltip :offset="[0, 10]">Editar relacion</q-tooltip>
                  </a>
                  <a
                    v-if="openGate('delete-commission_tree', sUser.prof_id) && prop.node.std_id === null"
                    class="text-red"
                    style="cursor: pointer; padding: 5px;"
                    @click.stop="deleteCommissionItem(prop.node.comm_id)"
                  > 
                    <q-icon size="md" name="delete"/>
                    <q-tooltip :offset="[0, 10]">Borrar relacion</q-tooltip>
                  </a>
                  <div v-if="prop.node.std_id === null">
                    {{ prop.node.user_name }} (<b>{{ prop.node.prof_name }}</b>) &nbsp; | &nbsp;
                    {{ prop.node.std_name2 }} &nbsp;
                    ({{ prop.node.stdmod_contract_number }}) &nbsp; | &nbsp;
                    <b :class="{ 'text-blue': prop.node.setcomm_title, 'text-red': !prop.node.setcomm_title }">
                      {{ (prop.node.setcomm_title) ? prop.node.setcomm_title : 'Sin comision' }}
                      <q-tooltip :offset="[0, 10]">
                        <span style="font-size: 16px;" v-html="prop.node.setcomm_str.replace(/\n/g, '<br>')"></span>
                      </q-tooltip>
                    </b>
                  </div>
                  <div v-else>
                    <a 
                      v-if="openGate('edit-commission_tree', sUser.prof_id) && prop.node.std_id2 === null"
                      class="text-blue-grey-8"
                      style="cursor: pointer; padding: 5px;"
                      @click.stop="toEditCommission(prop.node)"
                    >
                      <q-icon size="md" name="edit"/>
                      <q-tooltip :offset="[0, 10]">Editar relacion</q-tooltip>
                    </a>
                    <a
                      v-if="openGate('delete-commission_tree', sUser.prof_id) && prop.node.std_id2 === null"
                      class="text-red"
                      style="cursor: pointer; padding: 5px;"
                      @click.stop="deleteCommissionItem(prop.node.comm_id)"
                    > 
                      <q-icon size="md" name="delete"/>
                      <q-tooltip :offset="[0, 10]">Borrar relacion</q-tooltip>
                    </a>
                    {{ prop.node.std_name }}
                  </div>
                </div>
              </template>
            </q-tree>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
  <dialog-comission-tree-form
    v-if="this.openGate('menu-commission_tree', this.sUser.prof_id)"
    v-model:dialogShow="dialogShow"
    :dialogTitle="dialogLabel"
    :parentId="dialogParentId"
    v-model:setToEditProps="dialogToEdit"
    @refresh-relations="getRelations"
  />
</template>

<script>
import CommissionService from 'src/services/CommissionService'
import DialogComissionTreeForm from './DialogComissionTreeForm.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'AssignCommission',
  mixins: [xMisc, sGate],
  components: { DialogComissionTreeForm },
  data () {
    return {
      sUser: {},
      loading: false,
      dataset: [],
      users: [],
      treeExpanded: [],
      dialogShow: false,
      dialogParentId: null,
      dialogLabel: 'Crear relación',
      dialogToEdit: {},
      draggedNode: null,
      dragOverNode: null,
      dragOverNodeLast: null,
      autoScrollInterval: null,
      scrollSpeed: 0,
      scrollZone: 50 // Pixels desde el borde para activar auto-scroll
    }
  },
  created () {
    this.sUser = this.decryptSession('user')
    this.getRelations()
  },
  
  beforeUnmount() {
    // Limpiar listeners y intervalos al destruir el componente
    this.stopAutoScroll()
  },
  methods: {
    async getRelations () {
      try {
        this.loading = true
        if (this.openGate('menu-commissions_tree', this.sUser.prof_id)) {
          const response = await CommissionService.getCommisssionsTree({ token: this.decryptSession('token') })
          const arrayRows = Object.values(response.data.data)
          this.dataset = arrayRows
        }
        this.loading = false
      } catch (error) {
        this.errorsAlerts(error)
        this.loading = false
      }
    },
    deleteCommissionItem (commissionId) {
      this.$q.dialog({
        title: 'Eliminar relacion',
        message: '¿Estás seguro de eliminar este relacion y todos sus relaciones dependientes?',
        cancel: true,
        persistent: true
      }).onOk(async () => {
        try {
          this.activateLoading('Cargando')
          if (this.openGate('delete-commissions_tree', this.sUser.prof_id)) {
            await CommissionService.delRelation({ id: commissionId, token: this.decryptSession('token') })
            this.alert('positive', 'Relacion eliminada')
            this.getRelations()
          }
          this.disableLoading()
        } catch (error) {
          this.disableLoading()
          this.errorsAlerts(error)
        }
      })
    },
    toCreateCommission (node) {
      const comm_id = (node) ? node.comm_id : null
      console.log("toCreateCommission",comm_id)
      const label = (node) ? 'Crear relación asociada a ' + node.user_name : 'Crear relación'
      this.dialogShow = true
      this.dialogLabel = label
      this.dialogParentId = comm_id
      this.dialogToEdit = {}
    },
    toEditCommission (node) {
      this.dialogParentId = null
      this.dialogLabel = 'Editar relación asociada a ' + node.user_name
      this.dialogToEdit = node
      this.dialogShow = true
    },
    
    // Drag and Drop methods
    onDragStart(event, node) {
      this.draggedNode = node
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/html', node.comm_id)
      
      // Iniciar el listener de auto-scroll
      document.addEventListener('dragover', this.handleAutoScroll)
    },
    
    onDragOver(event, node) {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
    },
    
    onDragEnter(event, node) {
      if (this.canDrop(node)) {
        this.dragOverNode = node.comm_id
        if (this.dragOverNodeLast !== this.dragOverNode) {
          this.dragOverNodeLast = this.dragOverNode
        }
      }
    },
    
    onDragLeave(event, node) {
      if(event.target.draggable && this.dragOverNodeLast !== this.dragOverNode) {
        this.dragOverNode = null
        this.dragOverNodeLast = null
      }
    },
    
    onDrop(event, node) {
      event.preventDefault()
      this.dragOverNode = null
      
      // Limpiar auto-scroll
      this.stopAutoScroll()
      
      if (!this.draggedNode || !this.canDrop(node)) {
        return
      }
      
      // Ejecutar el método solicitado
      this.handleDropCommission(this.draggedNode.comm_id, node.comm_id)
      
      this.draggedNode = null
    },
    
    canDrop(targetNode) {
      // No se puede soltar sobre un nodo estudio
      if (targetNode.std_id !== null) {
        return false
      }
      //No se puede soltar sobre sí mismo
      if (!this.draggedNode || this.draggedNode.comm_id === targetNode.comm_id) {
        return false
      }
      // No se puede soltar sobre un padre directo
      if (this.draggedNode.commparent_id === targetNode.comm_id) {
        return false
      }
      
      // No se puede soltar un padre sobre cualquier elemento de su descendencia
      if (this.isDescendant(targetNode, this.draggedNode)) {
        return false
      }
      
      return true
    },
    
    isDescendant(node, ancestorNode) {
      // Buscar si node es descendiente de ancestorNode
      const findInChildren = (children, targetId) => {
        if (!children) return false
        
        for (const child of children) {
          if (child.comm_id === targetId) {
            return true
          }
          if (findInChildren(child.childs, targetId)) {
            return true
          }
        }
        return false
      }
      
      return findInChildren(ancestorNode.childs, node.comm_id)
    },
    
    handleDropCommission(draggedCommId, targetCommId) {
      this.$q.dialog({
        title: 'Mover relación',
        message: '¿Está seguro que desea cambiar la relación?',
        cancel: true,
        persistent: true
      }).onOk(async () => {
        try {
          this.activateLoading('Moviendo relación...')
          await CommissionService.editRelationParent({
            id: draggedCommId,
            commparent_id: targetCommId,
            token: this.decryptSession('token')
          })
          this.alert('positive', 'Relación movida correctamente')
          this.getRelations()
          this.disableLoading()
        } catch (error) {
          this.disableLoading()
          this.errorsAlerts(error)
        }
      })
    },

    // Root drop zone handlers
    onRootDragOver(event) {
      event.preventDefault()
      // Optionally, set dropEffect
      if (this.draggedNode && this.canDropRoot()) {
        event.dataTransfer.dropEffect = 'move'
      }
    },
    onRootDragEnter(event) {
      if (this.canDropRoot()) {
        this.dragOverNode = 'root'
      }
    },
    onRootDragLeave(event) {
      this.dragOverNode = null
    },
    onRootDrop(event) {
      event.preventDefault()
      this.dragOverNode = null
      
      // Limpiar auto-scroll
      this.stopAutoScroll()
      
      if (!this.draggedNode || !this.canDropRoot()) {
        return
      }
      this.handleDropCommission(this.draggedNode.comm_id, null)
      this.draggedNode = null
    },
    canDropRoot() {
      // No se puede soltar un nodo estudio sobre el root
      if (this.draggedNode.std_id !== null) {
        return false
      }
      // No puede soltar si ya está en el root
      if (!this.draggedNode || this.draggedNode.commparent_id === null) {
        return false
      }
      // No puede soltar si es descendiente de sí mismo (no aplica en root, pero por consistencia)
      return true
    },
    
    // Auto-scroll functionality
    handleAutoScroll(event) {
      const viewportHeight = window.innerHeight
      const mouseY = event.clientY
      const scrollContainer = document.documentElement || document.body
      
      // Calcular velocidad basada en la proximidad al borde
      if (mouseY < this.scrollZone) {
        // Cerca del borde superior
        const intensity = (this.scrollZone - mouseY) / this.scrollZone
        this.scrollSpeed = -intensity * 20 // Scroll hacia arriba
      } else if (mouseY > viewportHeight - this.scrollZone) {
        // Cerca del borde inferior
        const intensity = (mouseY - (viewportHeight - this.scrollZone)) / this.scrollZone
        this.scrollSpeed = intensity * 20 // Scroll hacia abajo
      } else {
        this.scrollSpeed = 0
      }
      
      // Iniciar o detener el auto-scroll
      if (this.scrollSpeed !== 0 && !this.autoScrollInterval) {
        this.startAutoScroll()
      } else if (this.scrollSpeed === 0 && this.autoScrollInterval) {
        this.stopAutoScroll()
      }
    },
    
    startAutoScroll() {
      this.autoScrollInterval = setInterval(() => {
        if (this.scrollSpeed !== 0) {
          window.scrollBy(0, this.scrollSpeed)
        }
      }, 16) // ~60fps
    },
    
    stopAutoScroll() {
      if (this.autoScrollInterval) {
        clearInterval(this.autoScrollInterval)
        this.autoScrollInterval = null
      }
      this.scrollSpeed = 0
      document.removeEventListener('dragover', this.handleAutoScroll)
    }
  }
}
</script>
<style type="text/css">
  body {
    background: #ECF0F3;
  }
  
  .drag-over {
    background-color: #e3f2fd !important;
    border: 2px dashed #2196f3 !important;
  }
  .commission-row {
    width: 100%;
    min-height: 70px;
    background: #f8fafc;
    border: 1.5px solid #e0e0e0;
    border-radius: 6px;
    padding: 8px 16px;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
    box-sizing: border-box;
    transition: background 0.2s, border 0.2s;
  }
</style>

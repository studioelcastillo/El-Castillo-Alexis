<template>
  <q-tr :props="props">
    <q-td key="expand" auto-width>
      <q-btn 
        v-if="Object.keys(props.row.users).length > 0" 
        size="sm" 
        color="black" 
        round dense 
        @click="toggleExpanded(props.row.user_id)" 
        :icon="isExpanded(props.row.user_id) ? 'remove' : 'add'" 
      />
    </q-td>
    <q-td key="chief_monitor" :props="props">{{ props.row.user_name }}</q-td>
    <q-td key="monitor" :props="props"></q-td>
    <q-td key="model" :props="props"></q-td>
    <q-td key="action" :props="props">
      <a v-if="openGate('add-hierarchy', sUser.prof_id)" class="text-green" style="cursor: pointer; padding: 5px;" @click="createDialog(props.row.user_id, 'monitor')"> <q-icon size="md" name="add_box"/>
        <q-tooltip :offset="[0, 10]">Asociar monitor</q-tooltip>
      </a>
    </q-td>
  </q-tr>
  <template v-for="(monitor, index) in props.row.users" :key="monitor.user_name + index">
    <q-tr v-if="isExpanded(props.row.user_id)" :props="props">
      <q-td key="expand" auto-width></q-td>
      <q-td key="chief_monitor" :props="props">
        <q-btn
          v-if="Object.keys(monitor.users).length > 0"
          size="sm"
          color="black"
          round dense
          @click="toggleExpanded(monitor.user_id)"
          :icon="isExpanded(monitor.user_id) ? 'remove' : 'add'"
        />
      </q-td>
      <q-td key="monitor" :props="props">{{ monitor.user_name }}</q-td>
      <q-td key="model" :props="props"></q-td>
      <q-td key="action" :props="props">
        <a v-if="openGate('add-hierarchy', sUser.prof_id)" class="text-green" style="cursor: pointer; padding: 5px;" @click="createDialog(monitor.user_id, 'model')">
          <q-icon size="md" name="add_box"/>
          <q-tooltip :offset="[0, 10]">Asociar Modelo</q-tooltip>
        </a>
        <a v-if="openGate('delete-hierarchy', sUser.prof_id)" class="text-red" style="cursor: pointer;" @click="deleteDialog(props.row.user_id, monitor.user_id)">
          <q-icon size="md" name="person_off"/>
          <q-tooltip :offset="[0, 10]">Eliminar relacion</q-tooltip>
        </a>
      </q-td>
    </q-tr>
    <template v-for="(model, index2) in monitor.users" :key="model.user_name + index2">
      <q-tr 
        v-if="isExpanded(props.row.user_id) && isExpanded(monitor.user_id)" 
        :props="props" 
        style="background-color: #ececec;" 
      >
        <q-td key="expand" auto-width></q-td>
        <q-td key="chief_monitor" :props="props"></q-td>
        <q-td key="monitor" :props="props"></q-td>
        <q-td key="model" :props="props">{{ model.user_name }}</q-td>
        <q-td key="action" :props="props">
          <a v-if="openGate('delete-hierarchy', sUser.prof_id)" class="text-red" style="cursor: pointer;" @click="deleteDialog(monitor.user_id, model.user_id)">
            <q-icon size="md" name="person_off"/>
            <q-tooltip :offset="[0, 10]">Eliminar relacion</q-tooltip>
          </a>
        </q-td>
      </q-tr>
    </template>
  </template>
</template>
<script>
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'
export default {
  name: 'HierarchyRow',
  mixins: [xMisc, sGate],
  props: {
    props: Object,
    expandedRows: {
      type: Object,
      default: () => {}
    },
    sUser: {
      type: Object,
      default: () => {}
    }
  },
  methods: {
    toggleExpanded (userId) {
      this.$emit('toggle-expand', userId)
    },
    createDialog (userId, action) {
      let dialogTitle = ""
      let dialogUserLabel = ""
      let dialogUserProfIds = []
      if (action === 'monitor') {
        dialogTitle = "Asociar monitor"
        dialogUserLabel = "Monitor"
        dialogUserProfIds = [8]
      } else if (action === 'model') {
        dialogTitle = "Asociar modelo"
        dialogUserLabel = "Modelo"
        dialogUserProfIds = [4, 5]
      }
      this.$emit('create-dialog', userId, dialogTitle, dialogUserLabel, dialogUserProfIds)
    },
    deleteDialog (userParentId, userChildId) {
      this.$emit('delete-dialog', userParentId, userChildId)
    },
    isExpanded (userId) {
      return this.expandedRows[userId]
    }
  }
}
</script>
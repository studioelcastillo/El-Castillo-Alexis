<template>
  <q-page padding>
    <div class="row q-mb-md items-center justify-between">
      <div class="text-h5 text-weight-bold">
        <q-icon name="api" class="q-mr-sm" />
        Módulos API y Permisos
      </div>
      <div class="row q-gutter-sm">
        <q-btn
          v-if="hasChanges"
          label="Guardar Cambios"
          icon="save"
          color="positive"
          :loading="saving"
          @click="saveAllChanges"
        />
        <q-btn
          label="Nuevo Módulo"
          icon="add"
          color="primary"
          @click="
            showModuleDialog = true;
            moduleForm = {
              module_key: '',
              module_name: '',
              module_group: 'GENERAL',
              module_icon: 'widgets',
              module_description: '',
            };
          "
          v-if="openGate('edit-api_modules', sUser.prof_id)"
        />
      </div>
    </div>

    <!-- Filtro por grupo -->
    <div class="row q-mb-md q-gutter-sm">
      <q-btn
        v-for="group in moduleGroups"
        :key="group"
        :label="group"
        :color="selectedGroup === group ? 'primary' : 'grey-4'"
        :text-color="selectedGroup === group ? 'white' : 'dark'"
        rounded
        dense
        no-caps
        class="q-px-md"
        @click="selectedGroup = selectedGroup === group ? null : group"
      />
    </div>

    <!-- Tabla de permisos -->
    <q-card flat bordered>
      <q-card-section class="q-pa-none">
        <div style="overflow-x: auto">
          <table class="permissions-table full-width">
            <thead>
              <tr>
                <th class="sticky-col" style="min-width: 200px">Módulo</th>
                <th class="text-center" style="min-width: 50px">Grupo</th>
                <th
                  v-for="profile in profiles"
                  :key="profile.prof_id"
                  class="text-center profile-header"
                  style="min-width: 90px"
                >
                  <div class="text-caption text-weight-bold">
                    {{ profile.prof_name }}
                  </div>
                  <div class="text-caption text-grey-6">
                    ID: {{ profile.prof_id }}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <template v-for="mod in filteredModules" :key="mod.module_id">
                <tr
                  class="module-row"
                  @click="toggleModuleExpand(mod.module_id)"
                >
                  <td class="sticky-col">
                    <div class="row items-center no-wrap q-gutter-sm">
                      <q-icon
                        :name="mod.module_icon || 'widgets'"
                        size="sm"
                        color="primary"
                      />
                      <div>
                        <div class="text-weight-medium">
                          {{ mod.module_name }}
                        </div>
                        <div class="text-caption text-grey-6">
                          {{ mod.module_key }}
                        </div>
                      </div>
                      <q-icon
                        :name="
                          expandedModules.includes(mod.module_id)
                            ? 'expand_less'
                            : 'expand_more'
                        "
                        size="xs"
                        color="grey-5"
                      />
                    </div>
                  </td>
                  <td class="text-center">
                    <q-badge
                      :color="getGroupColor(mod.module_group)"
                      :label="mod.module_group"
                    />
                  </td>
                  <td
                    v-for="profile in profiles"
                    :key="'quick-' + profile.prof_id"
                    class="text-center"
                  >
                    <q-toggle
                      :model-value="
                        hasAnyPermission(mod.module_id, profile.prof_id)
                      "
                      @update:model-value="
                        toggleAllPermissions(
                          mod.module_id,
                          profile.prof_id,
                          $event
                        )
                      "
                      color="primary"
                      dense
                    />
                  </td>
                </tr>
                <!-- Detalle expandido -->
                <tr
                  v-if="expandedModules.includes(mod.module_id)"
                  class="detail-row"
                >
                  <td :colspan="2 + profiles.length">
                    <div class="q-pa-sm" style="background: #f8f9fa">
                      <div class="text-caption text-grey-7 q-mb-sm">
                        {{ mod.module_description }}
                      </div>
                      <table class="inner-table full-width">
                        <thead>
                          <tr>
                            <th style="width: 120px">Acción</th>
                            <th
                              v-for="profile in profiles"
                              :key="'action-header-' + profile.prof_id"
                              class="text-center"
                              style="min-width: 80px"
                            >
                              {{ profile.prof_name }}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="action in [
                              'menu',
                              'show',
                              'add',
                              'edit',
                              'delete',
                            ]"
                            :key="action"
                          >
                            <td>
                              <q-icon
                                :name="actionIcon(action)"
                                size="xs"
                                class="q-mr-xs"
                              />
                              {{ actionLabel(action) }}
                            </td>
                            <td
                              v-for="profile in profiles"
                              :key="'perm-' + action + '-' + profile.prof_id"
                              class="text-center"
                            >
                              <q-checkbox
                                :model-value="
                                  getPermValue(
                                    mod.module_id,
                                    profile.prof_id,
                                    action
                                  )
                                "
                                @update:model-value="
                                  setPermValue(
                                    mod.module_id,
                                    profile.prof_id,
                                    action,
                                    $event
                                  )
                                "
                                dense
                                color="primary"
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </q-card-section>
    </q-card>

    <!-- Dialog: Nuevo módulo -->
    <q-dialog v-model="showModuleDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Nuevo Módulo</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="moduleForm.module_key"
            label="Key (ej: mi_modulo)"
            dense
            outlined
            class="q-mb-sm"
          />
          <q-input
            v-model="moduleForm.module_name"
            label="Nombre (ej: Mi Módulo)"
            dense
            outlined
            class="q-mb-sm"
          />
          <q-select
            v-model="moduleForm.module_group"
            :options="[
              'GENERAL',
              'ADMIN',
              'OPERACIONES',
              'FINANCIERO',
              'CONFIGURACIÓN',
              'COMISIONES',
              'REPORTES',
              'NÓMINA',
            ]"
            label="Grupo"
            dense
            outlined
            class="q-mb-sm"
          />
          <q-input
            v-model="moduleForm.module_icon"
            label="Ícono Material (ej: people)"
            dense
            outlined
            class="q-mb-sm"
          />
          <q-input
            v-model="moduleForm.module_description"
            label="Descripción"
            type="textarea"
            dense
            outlined
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" @click="showModuleDialog = false" />
          <q-btn
            color="primary"
            label="Crear"
            @click="createModule"
            :loading="saving"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import ApiModuleService from "src/services/ApiModuleService";
import ProfileService from "src/services/ProfileService";
import { sGate } from "src/mixins/sGate";

export default {
  name: "ApiModulesPage",
  mixins: [sGate],
  data() {
    return {
      modules: [],
      profiles: [],
      permissionsMap: {}, // { module_id: { prof_id: { can_menu, can_show, ... } } }
      pendingChanges: {}, // Track changes before saving
      expandedModules: [],
      selectedGroup: null,
      saving: false,
      showModuleDialog: false,
      moduleForm: {
        module_key: "",
        module_name: "",
        module_group: "GENERAL",
        module_icon: "widgets",
        module_description: "",
      },
    };
  },
  computed: {
    sUser() {
      try {
        return JSON.parse(localStorage.getItem("user") || "{}");
      } catch {
        return {};
      }
    },
    moduleGroups() {
      return [
        ...new Set(this.modules.map((m) => m.module_group).filter(Boolean)),
      ].sort();
    },
    filteredModules() {
      if (!this.selectedGroup) return this.modules;
      return this.modules.filter((m) => m.module_group === this.selectedGroup);
    },
    hasChanges() {
      return Object.keys(this.pendingChanges).length > 0;
    },
  },
  async created() {
    await this.loadData();
  },
  methods: {
    async loadData() {
      try {
        // Cargar perfiles
        const profResponse = await ProfileService.getProfiles();
        this.profiles = profResponse?.data?.data || [];

        // Cargar matriz de permisos
        const matrixResponse = await ApiModuleService.getPermissionsMatrix();
        const matrixData = matrixResponse?.data?.data || [];

        this.modules = matrixData.map((m) => {
          const { permissions, ...modData } = m;
          return modData;
        });

        // Construir mapa de permisos
        this.permissionsMap = {};
        matrixData.forEach((m) => {
          this.permissionsMap[m.module_id] = m.permissions || {};
        });
      } catch (e) {
        this.$q.notify({
          type: "negative",
          message: "Error al cargar datos: " + e.message,
        });
      }
    },

    getPermValue(moduleId, profId, action) {
      // Primero check pendingChanges
      const changeKey = `${moduleId}_${profId}`;
      if (
        this.pendingChanges[changeKey] &&
        this.pendingChanges[changeKey][`can_${action}`] !== undefined
      ) {
        return this.pendingChanges[changeKey][`can_${action}`];
      }
      // Luego check saved data
      const modPerms = this.permissionsMap[moduleId];
      if (!modPerms || !modPerms[profId]) return false;
      return !!modPerms[profId][`can_${action}`];
    },

    setPermValue(moduleId, profId, action, value) {
      const changeKey = `${moduleId}_${profId}`;
      if (!this.pendingChanges[changeKey]) {
        // Initialize with current values
        const current = this.permissionsMap[moduleId]?.[profId] || {};
        this.pendingChanges[changeKey] = {
          prof_id: profId,
          module_id: moduleId,
          can_menu: !!current.can_menu,
          can_show: !!current.can_show,
          can_add: !!current.can_add,
          can_edit: !!current.can_edit,
          can_delete: !!current.can_delete,
        };
      }
      this.pendingChanges[changeKey][`can_${action}`] = value;
      // Force reactivity
      this.pendingChanges = { ...this.pendingChanges };
    },

    hasAnyPermission(moduleId, profId) {
      const actions = ["menu", "show", "add", "edit", "delete"];
      return actions.some((a) => this.getPermValue(moduleId, profId, a));
    },

    toggleAllPermissions(moduleId, profId, enable) {
      const actions = ["menu", "show", "add", "edit", "delete"];
      actions.forEach((a) => this.setPermValue(moduleId, profId, a, enable));
    },

    toggleModuleExpand(moduleId) {
      const idx = this.expandedModules.indexOf(moduleId);
      if (idx >= 0) {
        this.expandedModules.splice(idx, 1);
      } else {
        this.expandedModules.push(moduleId);
      }
    },

    async saveAllChanges() {
      this.saving = true;
      try {
        const batch = Object.values(this.pendingChanges);
        if (batch.length === 0) return;

        const { error } = await ApiModuleService.savePermissionsBatch(batch);
        if (error) throw error;

        this.$q.notify({
          type: "positive",
          message: `${batch.length} permisos actualizados correctamente`,
        });
        this.pendingChanges = {};
        await this.loadData(); // Reload
      } catch (e) {
        this.$q.notify({
          type: "negative",
          message: "Error al guardar: " + e.message,
        });
      } finally {
        this.saving = false;
      }
    },

    async createModule() {
      this.saving = true;
      try {
        const { error } = await ApiModuleService.addModule(this.moduleForm);
        if (error) throw error;

        this.$q.notify({
          type: "positive",
          message: "Módulo creado correctamente",
        });
        this.showModuleDialog = false;
        await this.loadData();
      } catch (e) {
        this.$q.notify({
          type: "negative",
          message: "Error al crear: " + e.message,
        });
      } finally {
        this.saving = false;
      }
    },

    getGroupColor(group) {
      const colors = {
        GENERAL: "blue-grey",
        ADMIN: "red",
        OPERACIONES: "teal",
        FINANCIERO: "amber-9",
        CONFIGURACIÓN: "deep-purple",
        COMISIONES: "cyan",
        REPORTES: "indigo",
        NÓMINA: "orange",
      };
      return colors[group] || "grey";
    },

    actionIcon(action) {
      const icons = {
        menu: "menu",
        show: "visibility",
        add: "add_circle",
        edit: "edit",
        delete: "delete",
      };
      return icons[action] || "circle";
    },

    actionLabel(action) {
      const labels = {
        menu: "Menú",
        show: "Ver",
        add: "Crear",
        edit: "Editar",
        delete: "Eliminar",
      };
      return labels[action] || action;
    },
  },
};
</script>

<style scoped>
.permissions-table {
  border-collapse: collapse;
}
.permissions-table th,
.permissions-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #e0e0e0;
}
.permissions-table thead th {
  background: #f5f5f5;
  position: sticky;
  top: 0;
  z-index: 1;
}
.sticky-col {
  position: sticky;
  left: 0;
  background: white;
  z-index: 2;
}
.module-row {
  cursor: pointer;
}
.module-row:hover {
  background: #f0f7ff;
}
.detail-row td {
  padding: 0 !important;
}
.inner-table {
  border-collapse: collapse;
}
.inner-table th,
.inner-table td {
  padding: 4px 8px;
  border-bottom: 1px solid #eee;
  font-size: 0.85em;
}
.inner-table thead th {
  background: #eef2f7;
}
.profile-header {
  font-size: 0.75em;
}
</style>

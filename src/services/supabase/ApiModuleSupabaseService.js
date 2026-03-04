import { supabase } from "../../supabaseClient";

export default {
  // ── MÓDULOS ─────────────────────────────────────────

  /**
   * Listar todos los módulos del sistema
   */
  async getModules() {
    const { data, error } = await supabase
      .from("api_modules")
      .select("*")
      .order("sort_order", { ascending: true });

    return { data: { data: data || [] }, error };
  },

  /**
   * Obtener un módulo por ID
   */
  async getModule(params) {
    const { data, error } = await supabase
      .from("api_modules")
      .select("*")
      .eq("module_id", params.id)
      .single();

    return { data: { data: data ? [data] : [] }, error };
  },

  /**
   * Crear un nuevo módulo
   */
  async addModule(params) {
    const { data, error } = await supabase
      .from("api_modules")
      .insert([params])
      .select()
      .single();

    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  /**
   * Editar un módulo
   */
  async editModule(params) {
    const { id, ...updateData } = params;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("api_modules")
      .update(updateData)
      .eq("module_id", id)
      .select()
      .single();

    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  /**
   * Eliminar un módulo
   */
  async delModule(params) {
    const { error } = await supabase
      .from("api_modules")
      .delete()
      .eq("module_id", params.id);

    return { data: { status: error ? "Error" : "Success" }, error };
  },

  // ── PERMISOS POR PERFIL ─────────────────────────────

  /**
   * Obtener toda la matriz de permisos (módulos × perfiles)
   * Retorna los módulos con sus permisos por perfil
   */
  async getPermissionsMatrix() {
    const { data: modules, error: modError } = await supabase
      .from("api_modules")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (modError) return { data: null, error: modError };

    const { data: permissions, error: permError } = await supabase
      .from("api_permissions")
      .select("*");

    if (permError) return { data: null, error: permError };

    // Construir mapa: module_id → { prof_id → permisos }
    const permMap = {};
    (permissions || []).forEach((p) => {
      if (!permMap[p.module_id]) permMap[p.module_id] = {};
      permMap[p.module_id][p.prof_id] = p;
    });

    const matrix = (modules || []).map((mod) => ({
      ...mod,
      permissions: permMap[mod.module_id] || {},
    }));

    return { data: { data: matrix }, error: null };
  },

  /**
   * Obtener permisos de un perfil específico
   */
  async getPermissionsByProfile(profId) {
    const { data, error } = await supabase
      .from("api_permissions")
      .select("*, api_modules(*)")
      .eq("prof_id", profId);

    return { data: { data: data || [] }, error };
  },

  /**
   * Guardar/actualizar un permiso (upsert)
   */
  async savePermission(params) {
    const { prof_id, module_id, ...permData } = params;
    permData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("api_permissions")
      .upsert(
        { prof_id, module_id, ...permData },
        { onConflict: "prof_id,module_id" }
      )
      .select()
      .single();

    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  /**
   * Guardar múltiples permisos de una vez (batch)
   */
  async savePermissionsBatch(permissionsList) {
    const records = permissionsList.map((p) => ({
      ...p,
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from("api_permissions")
      .upsert(records, { onConflict: "prof_id,module_id" })
      .select();

    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  /**
   * Eliminar un permiso
   */
  async delPermission(params) {
    const { error } = await supabase
      .from("api_permissions")
      .delete()
      .eq("perm_id", params.id);

    return { data: { status: error ? "Error" : "Success" }, error };
  },

  // ── OVERRIDES POR USUARIO ───────────────────────────

  /**
   * Obtener overrides de un usuario
   */
  async getUserOverrides(userId) {
    const { data, error } = await supabase
      .from("api_user_overrides")
      .select("*, api_modules(*)")
      .eq("user_id", userId);

    return { data: { data: data || [] }, error };
  },

  /**
   * Guardar/actualizar un override de usuario
   */
  async saveUserOverride(params) {
    const { user_id, module_id, ...overrideData } = params;

    const { data, error } = await supabase
      .from("api_user_overrides")
      .upsert(
        { user_id, module_id, ...overrideData },
        { onConflict: "user_id,module_id" }
      )
      .select()
      .single();

    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  /**
   * Eliminar un override
   */
  async delUserOverride(params) {
    const { error } = await supabase
      .from("api_user_overrides")
      .delete()
      .eq("override_id", params.id);

    return { data: { status: error ? "Error" : "Success" }, error };
  },

  // ── CARGA DE PERMISOS PARA SESIÓN ───────────────────

  /**
   * Cargar los permisos efectivos de un usuario.
   * Combina: permisos del perfil + overrides del usuario.
   * Retorna un objeto: { module_key: { can_menu, can_show, can_add, can_edit, can_delete, custom_actions } }
   */
  async loadUserPermissions(userId, profId) {
    // 1. Obtener permisos del perfil
    const { data: profilePerms } = await supabase
      .from("api_permissions")
      .select("*, api_modules!inner(module_key, is_active)")
      .eq("prof_id", profId)
      .eq("api_modules.is_active", true);

    // 2. Obtener overrides del usuario
    const { data: userOverrides } = await supabase
      .from("api_user_overrides")
      .select("*, api_modules!inner(module_key)")
      .eq("user_id", userId)
      .or("expires_at.is.null,expires_at.gt." + new Date().toISOString());

    // 3. Construir permisos efectivos
    const effective = {};

    // Base: permisos del perfil
    (profilePerms || []).forEach((p) => {
      const key = p.api_modules.module_key;
      effective[key] = {
        can_menu: p.can_menu,
        can_show: p.can_show,
        can_add: p.can_add,
        can_edit: p.can_edit,
        can_delete: p.can_delete,
        custom_actions: p.custom_actions || {},
      };
    });

    // Override: excepciones del usuario (sobreescribe solo los campos no-null)
    (userOverrides || []).forEach((o) => {
      const key = o.api_modules.module_key;
      if (!effective[key]) {
        effective[key] = {
          can_menu: false,
          can_show: false,
          can_add: false,
          can_edit: false,
          can_delete: false,
          custom_actions: {},
        };
      }
      if (o.can_menu !== null) effective[key].can_menu = o.can_menu;
      if (o.can_show !== null) effective[key].can_show = o.can_show;
      if (o.can_add !== null) effective[key].can_add = o.can_add;
      if (o.can_edit !== null) effective[key].can_edit = o.can_edit;
      if (o.can_delete !== null) effective[key].can_delete = o.can_delete;
      if (o.custom_actions) {
        effective[key].custom_actions = {
          ...effective[key].custom_actions,
          ...o.custom_actions,
        };
      }
    });

    return { data: effective, error: null };
  },
};

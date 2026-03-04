/* IMPORTANT */
// //////////////////////////////////////////////////////// //
// SPACE GATE - Permisson validator 🚀🦎                   //
// Not use on any component in the BEFORECREATED statement  //
// Order ALPHABETICALLLY                                    //
// Ahora con soporte dinámico desde Supabase (api_modules)  //
// //////////////////////////////////////////////////////// //
import ApiModuleService from "src/services/ApiModuleService";

export const sGate = {
  data() {
    return {
      // multi-role example  >> { user: { roles: { rt:true, ad:true, ag:true, cl:true } } }
      // unique-role example >> { user: { roleId: rt } }
      multiRole: false,
      xCompany: "",
      dynamicPermissionsLoaded: false,
    };
  },
  methods: {
    /**
     * LOAD DYNAMIC PERMISSIONS
     * Carga los permisos desde Supabase y los guarda en sessionStorage.
     * Llamar al hacer login o cuando se necesiten refrescar.
     */
    async loadDynamicPermissions(userId, profId) {
      try {
        const { data, error } = await ApiModuleService.loadUserPermissions(
          userId,
          profId
        );
        if (!error && data) {
          sessionStorage.setItem("api_permissions", JSON.stringify(data));
          this.dynamicPermissionsLoaded = true;
          return data;
        }
      } catch (e) {
        console.warn(
          "[sGate] No se pudieron cargar permisos dinámicos, usando fallback:",
          e.message
        );
      }
      return null;
    },

    /**
     * GET DYNAMIC PERMISSIONS
     * Obtiene los permisos dinámicos desde sessionStorage (cache)
     */
    getDynamicPermissions() {
      try {
        const cached = sessionStorage.getItem("api_permissions");
        if (cached) return JSON.parse(cached);
      } catch (e) {
        // ignore parse errors
      }
      return null;
    },

    /**
     * CHECK DYNAMIC GATE
     * Verifica un gate contra los permisos dinámicos de Supabase.
     * Retorna: true/false si encontró el gate, null si no lo encontró (fallback a hardcoded)
     *
     * Formato de gate esperado: "accion-modulo" (ej: "menu-users", "add-studios", "edit-payments")
     */
    checkDynamicGate(gate) {
      const perms = this.getDynamicPermissions();
      if (!perms) return null; // no hay permisos dinámicos → usar fallback

      // Mapear el formato del gate a la estructura de permisos
      // Formato: "accion-modulo" o solo "modulo" (para acceso general)
      const parts = gate.split("-");
      let action = null;
      let moduleKey = null;

      if (parts.length >= 2) {
        action = parts[0]; // menu, show, add, edit, delete
        moduleKey = parts.slice(1).join("-"); // el resto es el module_key (puede contener guiones)
      } else {
        moduleKey = gate;
        action = "menu";
      }

      // Buscar en los permisos dinámicos
      if (perms[moduleKey]) {
        const modPerm = perms[moduleKey];
        switch (action) {
          case "menu":
            return !!modPerm.can_menu;
          case "show":
            return !!modPerm.can_show;
          case "add":
          case "new":
          case "create":
            return !!modPerm.can_add;
          case "edit":
          case "update":
            return !!modPerm.can_edit;
          case "delete":
          case "remove":
            return !!modPerm.can_delete;
          default:
            // Acciones custom
            if (
              modPerm.custom_actions &&
              modPerm.custom_actions[action] !== undefined
            ) {
              return !!modPerm.custom_actions[action];
            }
            return !!modPerm.can_show; // default: si tiene show, puede ver
        }
      }

      return null; // módulo no encontrado en dinámicos → fallback
    },
    /**
     * GET GATES
     * Se parametrizan los roles de manera fija en esta funcion,
     * mas adelante se piensa que estos roles sean parametrizables.
     *
     * @return boolean gates list
     * @author gk-thresh
     **/
    getGates() {
      // roles
      var rt = 1; // ROOT/ADMIN
      var ad = 2; // STUDIO
      var ag = 3; // GESTOR
      var cl = 4; // MODEL
      var mdst = 5; // MODEL SATELLITE
      var cacc = 6; // CREADOR CUENTAS
      var jmon = 7; // JEFE MONITOR
      var mon = 8; // MONITOR
      var jfot = 9; //JEFE FOTOGRAFO
      var fot = 10; //FOTOGRAFO
      var cont = 11; //CONTABILIDAD
      var aud = 12; //AUDIOVISUALES
      var entr = 13; // ENTREVISTAS

      // gates
      // create only necesary gates (if core-bussiness require)
      return [
        {
          gate: "indicators-dashboard",
          roles: [rt, ad, cl, mdst, cont, cacc, jmon, mon],
        }, // comment what function does only if its necessary
        {
          gate: "charts-dashboard",
          roles: [rt, ad, cl, mdst, cont, jmon, mon],
        }, // comment what function does only if its necessary
        { gate: "tasks-dashboard", roles: [rt, ad, cl, mdst, cont, cacc] }, // comment what function does only if its necessary
        //petitions
        { gate: "petitions", roles: [rt, ad, cl, mdst, cacc, entr] }, // access to petitions
        { gate: "create-petition-own", roles: [mdst] }, // create petition for yourself on studio associated through contracts
        { gate: "create-petitions", roles: [rt, ad, cacc, entr] }, // create petition of models asociated to studios of user being owner
        { gate: "show-petitions", roles: [rt, ad, cl, mdst, cacc, entr] }, // access detailed view of petitions
        { gate: "edit-petitions", roles: [rt, cacc, entr] }, // add other states to petitions
        //users
        { gate: "models-fields-users-create", roles: [cl, mdst] }, // show extra fields when creating a users of this profile
        { gate: "myprofile", roles: [cl, mdst] }, // allow to modify your own profile
        { gate: "menu-users", roles: [rt, ad, cacc, cont, entr, jmon, mon] }, // comment what function does only if its necessary
        { gate: "show-all-users", roles: [rt, cacc, cont, entr] }, // show detailed user fields
        { gate: "show-owned-contract-users", roles: [ad] }, // show detailed user fields
        { gate: "show-owned-hierarchy-users", roles: [jmon, mon] }, // show detailed user fields
        { gate: "add-users", roles: [rt, cacc, ad, cont] }, // comment what function does only if its necessary
        { gate: "add-users-with-contract", roles: [ad] }, // comment what function does only if its necessary
        { gate: "show-users", roles: [rt, ad, cacc, cont, entr, jmon, mon] }, // show detailed user fields
        { gate: "edit-users", roles: [rt, cacc, cont] }, // comment what function does only if its necessary
        { gate: "edit-users-bank-data", roles: [rt, ad, mdst, cacc, cont] }, // comment what function does only if its necessary
        { gate: "activate-inactivate-users", roles: [rt, cacc, cont] }, // comment what function does only if its necessary
        { gate: "massive-inactivate-users", roles: [rt] }, // comment what function does only if its necessary
        { gate: "export-users", roles: [rt] }, // comment what function does only if its necessary
        { gate: "download-accounts-users", roles: [rt, ad, cacc, cont] }, // comment what function does only if its necessary
        { gate: "user-coincidence", roles: [rt, cont, ad, ag, cacc] }, // comment what function does, only if its necessary
        { gate: "user-coincidence-unify", roles: [rt, cacc, cont] }, // comment what function does only if its necessary
        // { gate: 'delete-users', roles: [rt, ad] }, // comment what function does only if its necessary
        { gate: "change-password-users", roles: [rt, cacc, cont] }, // comment what function does only if its necessary
        { gate: "menu-logs", roles: [rt] }, // comment what function does only if its necessary
        { gate: "add-multimedia", roles: [rt, cacc, cont, ad] }, // comment what function does only if its necessary
        { gate: "delete-multimedia", roles: [rt, cacc, cont, ad] }, // comment what function does only if its necessary
        //exchange-rates
        { gate: "menu-exchanges_rates", roles: [rt, cont] }, // comment what function does, only if its necessary
        { gate: "show-exchanges_rates", roles: [rt, cont] },
        { gate: "add-exchanges_rates", roles: [rt, cont] }, // comment what function does, only if its necessary
        { gate: "edit-exchanges_rates", roles: [rt, cont] }, // comment what function does, only if its necessary
        { gate: "delete-exchanges_rates", roles: [rt, cont] }, // comment what function does, only if its necessary
        //transactions_typees
        { gate: "menu-transactions_types", roles: [rt, cont] }, // comment what function does, only if its necessary
        { gate: "show-transactions_types", roles: [rt, cont] },
        { gate: "add-transactions_types", roles: [rt, cont] }, // comment what function does, only if its necessary
        { gate: "edit-transactions_types", roles: [rt, cont] }, // comment what function does, only if its necessary
        { gate: "delete-transactions_types", roles: [rt, cont] }, // comment what function does, only if its necessary
        //categories
        { gate: "menu-categories", roles: [rt, cont] }, // comment what function does, only if its necessary
        { gate: "show-categories", roles: [rt, cont] },
        { gate: "add-categories", roles: [rt, cont] }, // comment what function does, only if its necessary
        { gate: "edit-categories", roles: [rt, cont] }, // comment what function does, only if its necessary
        { gate: "delete-categories", roles: [rt, cont] }, // comment what function does, only if its necessary
        //products
        { gate: "menu-products", roles: [rt, ad, cont] }, // comment what function does, only if its necessary
        { gate: "show-products", roles: [rt, ad, cont] }, // comment what function does, only if its necessary
        { gate: "add-products", roles: [rt, ad, cont] }, // comment what function does, only if its necessary
        { gate: "edit-products", roles: [rt, ad, cont] }, // comment what function does, only if its necessary
        { gate: "delete-products", roles: [rt, ad, cont] }, // comment what function does, only if its necessary
        //studios
        { gate: "menu-studios", roles: [rt, ad, cont] }, // comment what function does, only if its necessary
        { gate: "show-studios", roles: [rt, ad, cont] }, // comment what function does, only if its necessary
        { gate: "add-studios", roles: [rt, cont] }, // comment what function does, only if its necessary
        { gate: "edit-studios", roles: [rt, cont] }, // comment what function does, only if its necessary
        { gate: "delete-studios", roles: [rt, cont] }, // comment what function does, only if its necessary
        //rooms
        { gate: "menu-studios_rooms", roles: [rt, ad] }, // comment what function does, only if its necessary
        { gate: "add-studios_rooms", roles: [rt, ad] }, // comment what function does, only if its necessary
        { gate: "edit-studios_rooms", roles: [rt, ad] }, // comment what function does, only if its necessary
        { gate: "delete-studios_rooms", roles: [rt, ad] }, // comment what function does, only if its necessary
        //banks_accounts
        { gate: "menu-banks_accounts", roles: [rt, ad, cont] }, // comment what function does, only if its necessary
        { gate: "add-banks_accounts", roles: [rt, ad, cont] }, // comment what function does, only if its necessary
        { gate: "edit-banks_accounts", roles: [rt, ad, cont] }, // comment what function does, only if its necessary
        { gate: "delete-banks_accounts", roles: [rt, ad, cont] }, // comment what function does, only if its necessary
        //studio shifts
        { gate: "menu-studios_shifts", roles: [rt, ad] }, // comment what function does, only if its necessary
        { gate: "add-studios_shifts", roles: [rt, ad] }, // comment what function does, only if its necessary
        { gate: "edit-studios_shifts", roles: [rt, ad] }, // comment what function does, only if its necessary
        { gate: "delete-studios_shifts", roles: [rt, ad] }, // comment what function does, only if its necessary
        //contracts (studios_models)
        {
          gate: "menu-studios_models",
          roles: [rt, ad, mdst, cont, cacc, entr, jmon, mon],
        }, // comment what function does, only if its necessary
        {
          gate: "show-studios_models",
          roles: [rt, ad, mdst, cont, cacc, entr, jmon, mon],
        }, // comment what function does, only if its necessary
        { gate: "activate-inactivate-studios_models", roles: [rt, cacc, cont] }, // comment what function does, only if its necessary
        { gate: "add-studios_models", roles: [rt, ad, cont, entr, cacc] }, // comment what function does, only if its necessary
        { gate: "edit-studios_models", roles: [rt, ad, cont, entr, cacc] }, // comment what function does, only if its necessary
        { gate: "delete-studios_models", roles: [rt, ad, cont, entr, cacc] }, // comment what function does, only if its necessary
        //models_accounts
        {
          gate: "menu-models_accounts",
          roles: [rt, ad, mdst, cacc, cont, jmon, mon],
        }, // comment what function does, only if its necessary
        {
          gate: "show-models_accounts",
          roles: [rt, ad, mdst, cacc, cont, jmon, mon],
        }, // comment what function does, only if its necessary
        { gate: "transfer-models_accounts", roles: [rt, cacc, cont] }, // comment what function does, only if its necessary
        { gate: "add-models_accounts", roles: [rt, cacc, cont] }, // comment what function does, only if its necessary
        { gate: "edit-models_accounts", roles: [rt, cacc, cont] }, // comment what function does, only if its necessary
        { gate: "delete-models_accounts", roles: [rt, cacc, cont] }, // comment what function does, only if its necessary
        { gate: "modify_payment_username", roles: [rt, cacc, cont] }, // comment what function does, only if its necessary
        { gate: "edit-mail-models_accounts", roles: [rt, cacc, cont] }, // comment what function does, only if its necessary
        //models_goals
        { gate: "menu-models_goals", roles: [rt, ad, cont, jmon, mon] }, // comment what function does, only if its necessary
        { gate: "show-models_goals", roles: [rt, ad, cont, jmon, mon] }, // comment what function does, only if its necessary
        { gate: "add-models_goals", roles: [rt, ad, cont] }, // comment what function does, only if its necessary
        { gate: "edit-models_goals", roles: [rt, ad, cont] }, // comment what function does, only if its necessary
        { gate: "delete-models_goals", roles: [rt, ad, cont] }, // comment what function does, only if its necessary
        //transactions
        { gate: "menu-transactions", roles: [rt, ad, cont, jmon, mon] }, // comment what function does, only if its necessary
        { gate: "show-transactions", roles: [rt, ad, cont, jmon, mon] }, // comment what function does, only if its necessary
        { gate: "add-transactions_income", roles: [rt, ad, cont, jmon, mon] }, // comment what function does, only if its necessary
        { gate: "add-transactions_expenses", roles: [rt, ad, cont, jmon, mon] }, // comment what function does, only if its necessary
        { gate: "edit-transactions", roles: [rt, cont] }, // comment what function does, only if its necessary
        { gate: "delete-transactions", roles: [rt, cont] }, // comment what function does, only if its necessary
        //clients
        { gate: "menu-models_streams_customers", roles: [rt, ad, cl, mdst] }, // comment what function does, only if its necessary
        { gate: "show-models_streams_customers", roles: [rt, ad, cl, mdst] }, // comment what function does, only if its necessary
        { gate: "add-models_streams_customers", roles: [rt] }, // comment what function does, only if its necessary
        { gate: "edit-models_streams_customers", roles: [rt] }, // comment what function does, only if its necessary
        { gate: "delete-models_streams_customers", roles: [rt] }, // comment what function does, only if its necessary
        //streams
        { gate: "menu-models_streams", roles: [rt, cont, jmon, mon] }, // comment what function does, only if its necessary
        { gate: "add-models_streams", roles: [rt, cont, jmon, mon] }, // comment what function does, only if its necessary
        { gate: "edit-models_streams", roles: [rt, cont] }, // comment what function does, only if its necessary
        { gate: "delete-models_streams", roles: [rt, cont] }, // comment what function does, only if its necessary
        //stream files
        { gate: "menu-models_streams_files", roles: [rt] }, // comment what function does, only if its necessary
        { gate: "add-models_streams_files", roles: [rt] }, // comment what function does, only if its necessary
        { gate: "edit-models_streams_files", roles: [rt] }, // comment what function does, only if its necessary
        { gate: "delete-models_streams_files", roles: [rt, cont] }, // comment what function does, only if its necessary
        //
        { gate: "menu-payments", roles: [rt, ad] }, // comment what function does, only if its necessary
        { gate: "add-payments", roles: [rt, ad] }, // comment what function does, only if its necessary
        { gate: "edit-payments", roles: [rt, ad] }, // comment what function does, only if its necessary
        { gate: "delete-payments", roles: [rt, ad] }, // comment what function does, only if its necessary
        { gate: "menu-payments_files", roles: [rt, ad] }, // comment what function does, only if its necessary
        { gate: "add-payments_files", roles: [rt, ad] }, // comment what function does, only if its necessary
        { gate: "edit-payments_files", roles: [rt, ad, cont] }, // comment what function does, only if its necessary
        { gate: "delete-payments_files", roles: [rt, ad] }, // comment what function does, only if its necessary
        //studios account
        { gate: "menu-studios_accounts", roles: [rt, ad] }, // comment what function does, only if its necessary
        { gate: "add-studios_accounts", roles: [rt, ad] }, // comment what function does, only if its necessary
        { gate: "edit-studios_accounts", roles: [rt, ad] }, // comment what function does, only if its necessary
        { gate: "delete-studios_accounts", roles: [rt, ad] }, // comment what function does, only if its necessary
        //cargue streams
        { gate: "menu-massive_liquidation", roles: [rt, cont] }, // comment what function does, only if its necessary
        //models liquidation
        {
          gate: "menu-models_liquidation",
          roles: [rt, ad, cl, mdst, cont, jmon, mon],
        }, // comment what function does, only if its necessary
        { gate: "generate_file-models_liquidation", roles: [rt, ad, cont] }, // comment what function does, only if its necessary
        //studios liquidation
        { gate: "menu-studios_liquidation", roles: [rt, ad, cont] }, // comment what function does, only if its necessary
        { gate: "generate_file-studios_liquidation", roles: [rt, cont] }, // comment what function does, only if its necessary

        // profiles
        { gate: "is-model", roles: [cl, mdst] }, // comment what function does, only if its necessary
        { gate: "is-studio", roles: [ad] }, // comment what function does, only if its necessary

        // Periods (terms)
        { gate: "menu-periods", roles: [rt, cont] }, // comment what function does, only if its necessary
        { gate: "close-period", roles: [rt, cont] }, // comment what function does, only if its necessary
        //Locations
        { gate: "locations", roles: [rt, cont] }, // comment what function does, only if its necessary
        { gate: "menu-locations", roles: [rt, cont] }, // comment what function does, only if its necessary
        { gate: "add-location", roles: [rt, cont] }, // comment what function does, only if its necessary
        { gate: "edit-locations", roles: [rt, cont] }, // comment what function does, only if its necessary
        { gate: "delete-locations", roles: [rt, cont] }, // comment what function does, only if its necessary

        { gate: "accounts", roles: [rt, cont] }, // comment what function does, only if its necessary
        { gate: "add-accounts", roles: [rt, cont] }, // comment what function does, only if its necessary
        { gate: "edit-accounts", roles: [rt, cont] }, // comment what function does, only if its necessary
        { gate: "download-models-reports", roles: [rt, cont] }, // comment what function does, only if its necessary
        { gate: "download-studios-reports", roles: [rt, cont] }, // comment what function does, only if its necessary
        { gate: "show-dashboard-as-user", roles: [rt, cont] }, // comment what function does, only if its necessary

        { gate: "login_history", roles: [rt, cont] }, // comment what function does, only if its necessary
        { gate: "liquidation-summary_per_source", roles: [rt, cont] }, // comment what function does, only if its necessary

        // Monitors
        { gate: "menu-monitors", roles: [rt, ad, cont, ag] }, // comment what function does, only if its necessary
        { gate: "add-hierarchy", roles: [rt, ad, cont, ag] }, // comment what function does, only if its necessary
        { gate: "delete-hierarchy", roles: [rt, ad, cont, ag] }, // comment what function does, only if its necessary

        //commissions gates (rt, cont)
        { gate: "studio-setup_commissions", roles: [rt, cont] }, // acceder a escoger estudios para configurar comisiones
        { gate: "menu-setup_commissions", roles: [rt, cont, ad] }, // acceso al menú de configuración de comisiones
        { gate: "add-commissions", roles: [rt, cont, ad] }, // agregar comisión
        { gate: "edit-commissions", roles: [rt, cont, ad] }, // editar comisión
        { gate: "show-commissions", roles: [rt, cont, ad] }, // ver comisión
        { gate: "delete-commissions", roles: [rt, cont, ad] }, // eliminar comisión
        // commissions items
        { gate: "add-commissionsitem", roles: [rt, cont, ad] }, // agregar item de comisión
        { gate: "edit-commissionsitem", roles: [rt, cont, ad] }, // editar item de comisión
        { gate: "delete-commissionsitem", roles: [rt, cont, ad] }, // eliminar item de comisión
        // commissions tree
        { gate: "menu-commission_tree", roles: [rt, cont, ad] }, // acceder al árbol de comisiones
        { gate: "add-commission_tree", roles: [rt, cont, ad] }, // acceder al árbol de comisiones
        { gate: "edit-commission_tree", roles: [rt, cont, ad] }, // acceder al árbol de comisiones
        { gate: "delete-commission_tree", roles: [rt, cont, ad] }, // acceder al árbol de comisiones
      ];
    },
    /**
     * OPEN GATE
     * Request access to an especific functionality.
     *
     * @param string   gate keyword
     * @param object   gatekey role
     * @return boolean had access
     * @example        openGate('change-tikket-type', 'rt')
     * @author gk-thresh
     **/
    openGate(gate, gatekey) {
      this.multiRole = false;
      // Primero: verificar contra permisos dinámicos de Supabase
      const dynamicResult = this.checkDynamicGate(gate);
      if (dynamicResult !== null) {
        return dynamicResult; // true o false desde Supabase
      }
      // Fallback: gates hardcodeadas
      // return true
      if (gate !== "" && gatekey != null) {
        // loop gates
        var gates = this.getGates();
        for (var g = 0; g < gates.length; g++) {
          if (gate === gates[g].gate) {
            return this.vGateKey(gatekey, gates[g].roles);
          }
        }
      }
      // si no existe la puerta retorna true
      return true;
    },
    /**
     * OPEN GATE MULTI-ROLE
     * Request access to an especific functionality.
     *
     * @param string   gate keyword
     * @param object   gatekeys roles
     * @return boolean had access
     * @author gk-thresh
     * @example        openGate('change-tikket-type', $parent.user.roles)
     * @example        openGate('change-tikket-type', {rt:false, ad:true, ag:true, cl:false})
     **/
    openGateMultiple(gate, gatekeys) {
      this.multiRole = true;
      // return true
      if (gate !== "" && gatekeys != null) {
        // loop gates
        var gates = this.getGates();
        for (var g = 0; g < gates.length; g++) {
          if (gate === gates[g].gate) {
            return this.vGateKey(gatekeys, gates[g].roles);
          }
        }
      }
      // si no existe la puerta retorna true
      return true;
    },
    /**
     * VALIDATE ACCESS
     * cross the gatelock vs the role.
     *
     * @param object   gatekeys roles ej. {rt:false, ad:true, ag:true, cl:false}
     * @param array    gatelock enable permissons ej. [rt, ad, ag, cl]
     * @return boolean had access
     * @author gk-thresh
     **/
    vGateKey(gatekeys, gatelock) {
      // multi-role example  >> { user: { roles: { rt:true, ad:true, ag:true, cl:true } } }
      if (this.multiRole === true) {
        // loop gatelocks
        for (var i = 0; i < gatelock.length; i++) {
          // if have the key
          if (gatekeys[gatelock[i]] != null && gatekeys[gatelock[i]] === true) {
            return true;
          }
        }
      }
      // unique-role example >> { user: { roleId: rt } }
      else if (this.multiRole === false) {
        // loop gatelocks
        for (var i = 0; i < gatelock.length; i++) {
          // if have the key
          if (gatelock[i] == gatekeys) {
            return true;
          }
        }
      }
      return false;
    },
  },
};

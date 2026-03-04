import { supabase } from "../../supabaseClient";

const buildSetcommString = (items, setcommType) => {
  if (!items || !items.length) return "";
  const sorted = [...items].sort(
    (a, b) => (a.setcommitem_limit || 0) - (b.setcommitem_limit || 0)
  );
  return sorted
    .map((item) => {
      const limit = item.setcommitem_limit ?? 0;
      const value = item.setcommitem_value ?? 0;
      const suffix = setcommType === "Porcentaje" ? "%" : "";
      return `${limit}: ${value}${suffix}`;
    })
    .join("\n");
};

const buildTree = (nodes) => {
  const map = new Map();
  const roots = [];

  (nodes || []).forEach((node) => {
    map.set(node.comm_id, { ...node, childs: [] });
  });

  map.forEach((node) => {
    if (node.commparent_id && map.has(node.commparent_id)) {
      map.get(node.commparent_id).childs.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
};

export default {
  async getCommisssionsTree(params) {
    const { data: relations, error } = await supabase
      .from("commissions_relations")
      .select("comm_id, commparent_id, stdmod_id, std_id, setcomm_id, comm_track_beyond_childs, comm_expire_date");

    if (error) return { data: { data: [] }, error };

    const stdmodIds = [...new Set((relations || []).map((row) => row.stdmod_id).filter(Boolean))];
    const stdIds = [...new Set((relations || []).map((row) => row.std_id).filter(Boolean))];
    const setcommIds = [...new Set((relations || []).map((row) => row.setcomm_id).filter(Boolean))];

    const { data: stdmods } = stdmodIds.length
      ? await supabase
          .from("studios_models")
          .select(
            "stdmod_id, stdmod_contract_number, std_id, user_id_model, studios(std_name), users!user_id_model(user_id, user_name, user_surname, user_identification, prof_id, profiles(prof_name))"
          )
          .in("stdmod_id", stdmodIds)
      : { data: [] };

    const { data: studios } = stdIds.length
      ? await supabase
          .from("studios")
          .select("std_id, std_name")
          .in("std_id", stdIds)
      : { data: [] };

    const { data: setupCommissions } = setcommIds.length
      ? await supabase
          .from("setup_commissions")
          .select("setcomm_id, setcomm_title, setcomm_type, std_id, studios(std_name), setup_commissions_item(*)")
          .in("setcomm_id", setcommIds)
      : { data: [] };

    const stdmodMap = new Map();
    (stdmods || []).forEach((row) => {
      stdmodMap.set(row.stdmod_id, {
        stdmod_id: row.stdmod_id,
        stdmod_contract_number: row.stdmod_contract_number,
        std_name2: row.studios?.std_name || null,
        user_id: row.users?.user_id || null,
        user_name: row.users
          ? `${row.users.user_name || ""} ${row.users.user_surname || ""}`.trim()
          : null,
        user_identification: row.users?.user_identification || null,
        prof_name: row.users?.profiles?.prof_name || null,
      });
    });

    const studioMap = new Map();
    (studios || []).forEach((row) => {
      studioMap.set(row.std_id, row.std_name);
    });

    const setcommMap = new Map();
    (setupCommissions || []).forEach((row) => {
      setcommMap.set(row.setcomm_id, {
        setcomm_id: row.setcomm_id,
        setcomm_title: row.setcomm_title,
        setcomm_std_name: row.studios?.std_name || null,
        setcomm_str: buildSetcommString(row.setup_commissions_item || [], row.setcomm_type),
      });
    });

    const nodes = (relations || []).map((row) => {
      const stdmod = row.stdmod_id ? stdmodMap.get(row.stdmod_id) : null;
      const setcomm = row.setcomm_id ? setcommMap.get(row.setcomm_id) : null;
      const studioName = row.std_id ? studioMap.get(row.std_id) : null;

      return {
        comm_id: row.comm_id,
        commparent_id: row.commparent_id,
        stdmod_id: row.stdmod_id || null,
        std_id: row.std_id || null,
        std_id2: null,
        std_name: studioName || null,
        std_name2: stdmod?.std_name2 || null,
        stdmod_contract_number: stdmod?.stdmod_contract_number || null,
        user_id: stdmod?.user_id || null,
        user_name: stdmod?.user_name || null,
        user_identification: stdmod?.user_identification || null,
        prof_name: stdmod?.prof_name || null,
        setcomm_id: row.setcomm_id || null,
        setcomm_title: setcomm?.setcomm_title || null,
        setcomm_std_name: setcomm?.setcomm_std_name || null,
        setcomm_str: setcomm?.setcomm_str || "",
        comm_track_beyond_childs: row.comm_track_beyond_childs,
        comm_expire_date: row.comm_expire_date,
      };
    });

    const tree = buildTree(nodes);
    return { data: { data: tree }, error: null };
  },

  async addRelation(params) {
    const { data, error } = await supabase
      .from("commissions_relations")
      .insert([params])
      .select()
      .single();
    return { data: { data: data, status: error ? "error" : "success" }, error };
  },

  async delRelation(params) {
    const { error } = await supabase
      .from("commissions_relations")
      .delete()
      .eq("comm_id", params.id);
    return { data: { status: error ? "error" : "success" }, error };
  },

  async editRelation(params) {
    const { id, ...updateData } = params;
    const { data, error } = await supabase
      .from("commissions_relations")
      .update(updateData)
      .eq("comm_id", id)
      .select()
      .single();
    return { data: { data: data, status: error ? "error" : "success" }, error };
  },

  async editRelationParent(params) {
    const { data, error } = await supabase
      .from("commissions_relations")
      .update({ commparent_id: params.commparent_id })
      .eq("comm_id", params.id)
      .select()
      .single();
    return { data: { data: data, status: error ? "error" : "success" }, error };
  },

  async getCommissionsOfChiefCommission(params) {
    const { data, error } = await supabase
      .from("commissions_relations")
      .select("*")
      .eq("commparent_id", params.id);
    return { data: { data: data || [] }, error };
  },
};

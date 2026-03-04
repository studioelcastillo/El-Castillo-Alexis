import { supabase } from "../../supabaseClient";

const buildTree = (relations, usersMap) => {
  const childrenMap = new Map();
  const childIds = new Set();

  (relations || []).forEach((rel) => {
    const parentId = rel.user_parent_id;
    const childId = rel.user_child_id;
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    childrenMap.get(parentId).push(childId);
    childIds.add(childId);
  });

  const buildNode = (userId, visited = new Set()) => {
    if (visited.has(userId)) return null;
    visited.add(userId);

    const user = usersMap.get(userId);
    const children = (childrenMap.get(userId) || [])
      .map((childId) => buildNode(childId, new Set(visited)))
      .filter(Boolean);

    return {
      user_id: userId,
      user_name: user ? `${user.user_name || ""} ${user.user_surname || ""}`.trim() : null,
      users: children,
    };
  };

  const rootIds = Array.from(childrenMap.keys()).filter(
    (parentId) => !childIds.has(parentId)
  );

  return rootIds.map((id) => buildNode(id)).filter(Boolean);
};

export default {
  async getChiefMonitorsRelations(params) {
    const { data: relations, error } = await supabase
      .from("monitors_relations")
      .select("user_parent_id, user_child_id");

    if (error) return { data: { data: [] }, error };

    const userIds = Array.from(
      new Set(
        (relations || []).flatMap((row) => [row.user_parent_id, row.user_child_id])
      )
    ).filter(Boolean);

    const { data: users } = await supabase
      .from("users")
      .select("user_id, user_name, user_surname")
      .in("user_id", userIds);

    const usersMap = new Map();
    (users || []).forEach((user) => {
      usersMap.set(user.user_id, user);
    });

    const tree = buildTree(relations, usersMap);
    return { data: { data: tree }, error: null };
  },

  async addRelation(params) {
    const { data, error } = await supabase
      .from("monitors_relations")
      .insert([
        {
          user_parent_id: params.userparent_id,
          user_child_id: params.userchild_id,
        },
      ])
      .select()
      .single();
    return { data: { data: data, status: error ? "error" : "success" }, error };
  },

  async delRelation(params) {
    const { error } = await supabase
      .from("monitors_relations")
      .delete()
      .eq("user_parent_id", params.userParentId)
      .eq("user_child_id", params.userChidlId);
    return { data: { status: error ? "error" : "success" }, error };
  },

  async getMonitorsOfChiefMonitor(params) {
    const { data, error } = await supabase
      .from("monitors_relations")
      .select("user_parent_id, user_child_id")
      .eq("user_parent_id", params.id);
    return { data: { data: data || [] }, error };
  },
};

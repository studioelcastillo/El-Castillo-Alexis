import { supabase } from "../../supabaseClient";

const SETTINGS_PREFIX = "chat_settings:";

const DEFAULT_CHAT_SETTINGS = {
  sound_incoming: true,
  sound_outgoing: true,
  sound_mentions: true,
  glow_on_new: true,
  toast_on_new: true,
  show_online_status: true,
  quiet_hours_enabled: false,
  quiet_hours_start: "22:00",
  quiet_hours_end: "08:00",
};

const buildFullName = (row) =>
  [row.user_name, row.user_name2, row.user_surname, row.user_surname2].filter(Boolean).join(" ").trim();

const mapProfile = (row) => ({
  id: String(row.chat_profile_id || row.user_id),
  user_id: row.user_id,
  display_name: row.display_name || buildFullName(row) || "Usuario",
  role_name: row.role_name || row.profiles?.prof_name || undefined,
  role_id: row.role_id ?? row.prof_id ?? row.profiles?.prof_id ?? 0,
  presence_status: row.presence_status || "offline",
  avatar_url: row.avatar_url || row.user_photo_url || undefined,
  avatar_version: row.avatar_version || undefined,
  is_online: row.is_online ?? false,
});

const mapMessage = (row) => ({
  id: String(row.message_id),
  conversation_id: String(row.conversation_id),
  sender_id: row.sender_id,
  sender_name: row.sender_name || "Usuario",
  sender_avatar_url: row.sender_avatar_url || undefined,
  type: row.message_type || "text",
  content_text: row.content_text || "",
  status: row.status || "sent",
  created_at: row.created_at || new Date().toISOString(),
});

const mapTemplate = (row) => ({
  id: String(row.template_id),
  name: row.name,
  category: row.category || "General",
  body_text: row.body_text || "",
  variables_json: row.variables_json || [],
  attachments_json: row.attachments_json || [],
  scope: row.scope || "global",
  role_id: row.role_id || undefined,
  is_active: row.is_active !== false,
  created_by: row.created_by || 0,
  created_at: row.created_at || new Date().toISOString(),
  updated_at: row.updated_at || row.created_at || new Date().toISOString(),
});

const mapBroadcastJob = (row) => ({
  id: String(row.broadcast_job_id),
  created_by: row.created_by || 0,
  mode: row.mode || "DM_MASS",
  audience_snapshot_json: row.audience_snapshot_json || {},
  message_payload_json: row.message_payload_json || {},
  reason: row.reason || "",
  status: row.status || "running",
  total_targets: row.total_targets || 0,
  sent_count: row.sent_count || 0,
  delivered_count: row.delivered_count || 0,
  read_count: row.read_count || 0,
  failed_count: row.failed_count || 0,
  skipped_count: row.skipped_count || 0,
  created_at: row.created_at || new Date().toISOString(),
  finished_at: row.finished_at || undefined,
});

const mapAutomation = (row) => ({
  id: String(row.automation_id),
  trigger_type: row.trigger_type,
  trigger_event: row.trigger_event || undefined,
  schedule_cron: row.schedule_cron || undefined,
  conditions_json: row.conditions_json || {},
  target_json: row.target_json || {},
  template_id: row.template_id ? String(row.template_id) : "",
  is_enabled: row.is_enabled !== false,
  created_by: row.created_by || 0,
  created_at: row.created_at || new Date().toISOString(),
  updated_at: row.updated_at || row.created_at || new Date().toISOString(),
});

const mapAutomationJob = (row) => ({
  id: String(row.automation_job_id),
  rule_id: String(row.automation_id),
  status: row.status || "running",
});

export default {
  async getPolicies() {
    const { data, error } = await supabase
      .from("chat_policies")
      .select("from_role_id, to_role_id, can_initiate, can_receive")
      .order("from_role_id", { ascending: true })
      .order("to_role_id", { ascending: true });

    return { data: { data: data || [] }, error };
  },

  async updatePolicies(policies) {
    const { error: deleteError } = await supabase
      .from("chat_policies")
      .delete()
      .gte("from_role_id", 0);

    if (deleteError) {
      return { data: { data: null, status: "Error" }, error: deleteError };
    }

    if (!policies || policies.length === 0) {
      return { data: { data: [], status: "Success" }, error: null };
    }

    const payload = policies.map((policy) => ({
      from_role_id: policy.from_role_id,
      to_role_id: policy.to_role_id,
      can_initiate: policy.can_initiate ?? false,
      can_receive: policy.can_receive ?? false,
    }));

    const { data, error } = await supabase
      .from("chat_policies")
      .insert(payload)
      .select("from_role_id, to_role_id, can_initiate, can_receive");

    return { data: { data: data || [], status: error ? "Error" : "Success" }, error };
  },

  async getProfiles() {
    const { data, error } = await supabase
      .from("chat_profiles")
      .select("*")
      .order("display_name", { ascending: true });

    return { data: { data: (data || []).map(mapProfile) }, error };
  },

  async upsertProfile(profile) {
    const { data: existing } = await supabase
      .from("chat_profiles")
      .select("chat_profile_id")
      .eq("user_id", profile.user_id)
      .maybeSingle();

    const payload = {
      user_id: profile.user_id,
      display_name: profile.display_name,
      role_id: profile.role_id,
      role_name: profile.role_name || null,
      presence_status: profile.presence_status || "available",
      avatar_url: profile.avatar_url || null,
      is_online: true,
      updated_at: new Date().toISOString(),
    };

    if (existing?.chat_profile_id) {
      const { data, error } = await supabase
        .from("chat_profiles")
        .update(payload)
        .eq("chat_profile_id", existing.chat_profile_id)
        .select("*")
        .single();
      return { data: { data: data ? mapProfile(data) : null, status: error ? "Error" : "Success" }, error };
    }

    const { data, error } = await supabase
      .from("chat_profiles")
      .insert([payload])
      .select("*")
      .single();

    return { data: { data: data ? mapProfile(data) : null, status: error ? "Error" : "Success" }, error };
  },

  async updatePresence(params) {
    const userId = params?.userId ?? params?.user_id ?? params?.id;
    const presence_status = params?.presence_status;
    const is_online = params?.is_online;
    const { error } = await supabase
      .from("chat_profiles")
      .update({ presence_status, is_online, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    return { data: { status: error ? "Error" : "Success" }, error };
  },

  async getConversations(params) {
    const userId = params?.userId ?? params?.user_id ?? params;
    const { data: memberships, error } = await supabase
      .from("chat_conversation_members")
      .select("conversation_id, last_read_at")
      .eq("user_id", userId);

    if (error || !memberships || memberships.length === 0) {
      return { data: { data: [] }, error };
    }

    const conversationIds = memberships.map((m) => m.conversation_id);

    const { data: convRows } = await supabase
      .from("chat_conversations")
      .select("*")
      .in("conversation_id", conversationIds);

    const { data: memberRows } = await supabase
      .from("chat_conversation_members")
      .select("conversation_id, user_id")
      .in("conversation_id", conversationIds);

    const memberIds = [...new Set((memberRows || []).map((m) => m.user_id).filter(Boolean))];
    const { data: profileRows } = memberIds.length
      ? await supabase.from("chat_profiles").select("*").in("user_id", memberIds)
      : { data: [] };

    const profileMap = new Map();
    (profileRows || []).forEach((row) => {
      profileMap.set(row.user_id, mapProfile(row));
    });

    const missingIds = memberIds.filter((id) => !profileMap.has(id));
    if (missingIds.length) {
      const { data: users } = await supabase
        .from("users")
        .select("user_id, user_name, user_name2, user_surname, user_surname2, user_photo_url, prof_id, profiles(prof_name)")
        .in("user_id", missingIds);
      (users || []).forEach((row) => {
        profileMap.set(row.user_id, mapProfile(row));
      });
    }

    const { data: messageRows } = await supabase
      .from("chat_messages")
      .select("*")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false });

    const lastMessageMap = new Map();
    (messageRows || []).forEach((row) => {
      if (!lastMessageMap.has(row.conversation_id)) {
        lastMessageMap.set(row.conversation_id, mapMessage(row));
      }
    });

    const membershipMap = new Map();
    memberships.forEach((m) => membershipMap.set(m.conversation_id, m));

    const conversations = (convRows || []).map((row) => {
      const convId = row.conversation_id;
      const members = (memberRows || [])
        .filter((m) => m.conversation_id === convId)
        .map((m) => profileMap.get(m.user_id))
        .filter(Boolean);

      const lastMessage = lastMessageMap.get(convId);
      const lastReadAt = membershipMap.get(convId)?.last_read_at;
      let unread = 0;
      if (lastMessage && lastMessage.sender_id !== userId) {
        if (!lastReadAt || new Date(lastReadAt) < new Date(lastMessage.created_at)) {
          unread = 1;
        }
      }

      return {
        id: String(convId),
        type: row.conversation_type === "group" ? "group" : "direct",
        name: row.conversation_name || undefined,
        unread_count: unread,
        created_at: row.created_at || new Date().toISOString(),
        members,
        last_message: lastMessage,
        avatar_url: row.avatar_url || undefined,
      };
    });

    return { data: { data: conversations }, error: null };
  },

  async getMessages(params) {
    const conversationId = params?.conversationId || params?.conversation_id || params;
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", Number(conversationId))
      .order("created_at", { ascending: true });

    return { data: { data: (data || []).map(mapMessage) }, error };
  },

  async sendMessage(params) {
    const payload = params || {};
    const { data, error } = await supabase
      .from("chat_messages")
      .insert([
        {
          conversation_id: Number(payload.conversationId),
          sender_id: payload.senderId,
          sender_name: payload.senderName,
          sender_avatar_url: payload.senderAvatarUrl || null,
          message_type: payload.type || "text",
          content_text: payload.contentText,
          status: "sent",
        },
      ])
      .select("*")
      .single();

    if (!data) {
      return { data: { status: "Error", message: "No se pudo enviar el mensaje" }, error: error || new Error("No se pudo enviar el mensaje") };
    }

    return { data: { data: mapMessage(data), status: error ? "Error" : "Success" }, error };
  },

  async markConversationRead(params) {
    const conversationId = params?.conversationId || params?.conversation_id;
    const userId = params?.userId || params?.user_id;
    const { error } = await supabase
      .from("chat_conversation_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", Number(conversationId))
      .eq("user_id", userId);
    return { data: { status: error ? "Error" : "Success" }, error };
  },

  async createDirectConversation(params) {
    const userId = params?.userId || params?.user_id;
    const targetUserId = params?.targetUserId || params?.target_user_id;

    const { data: myMemberships } = await supabase
      .from("chat_conversation_members")
      .select("conversation_id")
      .eq("user_id", userId);

    const myConvIds = (myMemberships || []).map((m) => m.conversation_id);
    if (myConvIds.length) {
      const { data: shared } = await supabase
        .from("chat_conversation_members")
        .select("conversation_id")
        .eq("user_id", targetUserId)
        .in("conversation_id", myConvIds);

      const sharedIds = (shared || []).map((m) => m.conversation_id);
      if (sharedIds.length) {
        const { data: convRow } = await supabase
          .from("chat_conversations")
          .select("conversation_id, conversation_type")
          .in("conversation_id", sharedIds);

        const direct = (convRow || []).find((row) => row.conversation_type === "direct");
        if (direct) {
          return { data: { data: String(direct.conversation_id), status: "Success" }, error: null };
        }
      }
    }

    const { data: conv, error } = await supabase
      .from("chat_conversations")
      .insert([{ conversation_type: "direct" }])
      .select("*")
      .single();

    if (!conv) {
      return { data: { status: "Error", message: "No se pudo crear la conversacion" }, error: error || new Error("No se pudo crear la conversacion") };
    }

    await supabase.from("chat_conversation_members").insert([
      { conversation_id: conv.conversation_id, user_id: userId, is_admin: true },
      { conversation_id: conv.conversation_id, user_id: targetUserId, is_admin: false },
    ]);

    return { data: { data: String(conv.conversation_id), status: "Success" }, error: null };
  },

  async getTemplates() {
    const { data, error } = await supabase
      .from("chat_templates")
      .select("*")
      .order("created_at", { ascending: false });

    return { data: { data: (data || []).map(mapTemplate) }, error };
  },

  async createTemplate(params) {
    const template = params || {};
    const { data, error } = await supabase
      .from("chat_templates")
      .insert([
        {
          name: template.name,
          category: template.category,
          body_text: template.body_text,
          variables_json: template.variables_json || [],
          attachments_json: template.attachments_json || [],
          scope: template.scope || "global",
          role_id: template.role_id || null,
          is_active: template.is_active !== false,
          created_by: template.created_by || null,
        },
      ])
      .select("*")
      .single();

    return { data: { data: data ? mapTemplate(data) : null, status: error ? "Error" : "Success" }, error };
  },

  async updateTemplate(params) {
    const id = params?.id || params?.template_id;
    const template = params || {};
    const { data, error } = await supabase
      .from("chat_templates")
      .update({
        name: template.name,
        category: template.category,
        body_text: template.body_text,
        variables_json: template.variables_json || [],
        attachments_json: template.attachments_json || [],
        scope: template.scope || "global",
        role_id: template.role_id || null,
        is_active: template.is_active !== false,
        updated_at: new Date().toISOString(),
      })
      .eq("template_id", Number(id))
      .select("*")
      .single();

    return { data: { data: data ? mapTemplate(data) : null, status: error ? "Error" : "Success" }, error };
  },

  async deleteTemplate(params) {
    const id = params?.id || params?.template_id || params;
    const { error } = await supabase.from("chat_templates").delete().eq("template_id", Number(id));
    return { data: { status: error ? "Error" : "Success" }, error };
  },

  async getBroadcastJobs() {
    const { data, error } = await supabase
      .from("chat_broadcast_jobs")
      .select("*")
      .order("created_at", { ascending: false });

    return { data: { data: (data || []).map(mapBroadcastJob) }, error };
  },

  async createBroadcastJob(params) {
    const payload = params || {};
    const { data, error } = await supabase
      .from("chat_broadcast_jobs")
      .insert([
        {
          created_by: payload.created_by || null,
          mode: payload.mode || "DM_MASS",
          audience_snapshot_json: payload.audience_snapshot_json || {},
          message_payload_json: payload.message_payload_json || {},
          reason: payload.reason || null,
          status: payload.status || "running",
          total_targets: payload.total_targets || 0,
          sent_count: payload.sent_count || 0,
          delivered_count: payload.delivered_count || 0,
          read_count: payload.read_count || 0,
          failed_count: payload.failed_count || 0,
          skipped_count: payload.skipped_count || 0,
        },
      ])
      .select("*")
      .single();

    return { data: { data: data ? mapBroadcastJob(data) : null, status: error ? "Error" : "Success" }, error };
  },

  async getBroadcastLists() {
    const { data, error } = await supabase
      .from("chat_broadcast_lists")
      .select("*")
      .order("created_at", { ascending: false });

    const rows = (data || []).map((row) => ({
      id: String(row.broadcast_list_id),
      name: row.name,
      audience_rules_json: row.audience_rules_json || {},
    }));

    return { data: { data: rows }, error };
  },

  async getAutomations() {
    const { data, error } = await supabase
      .from("chat_automations")
      .select("*")
      .order("created_at", { ascending: false });

    return { data: { data: (data || []).map(mapAutomation) }, error };
  },

  async createAutomation(params) {
    const rule = params || {};
    const { data, error } = await supabase
      .from("chat_automations")
      .insert([
        {
          trigger_type: rule.trigger_type,
          trigger_event: rule.trigger_event || null,
          schedule_cron: rule.schedule_cron || null,
          conditions_json: rule.conditions_json || {},
          target_json: rule.target_json || {},
          template_id: rule.template_id ? Number(rule.template_id) : null,
          is_enabled: rule.is_enabled !== false,
          created_by: rule.created_by || null,
        },
      ])
      .select("*")
      .single();

    return { data: { data: data ? mapAutomation(data) : null, status: error ? "Error" : "Success" }, error };
  },

  async updateAutomation(params) {
    const id = params?.id || params?.automation_id;
    const updates = params || {};
    const { data, error } = await supabase
      .from("chat_automations")
      .update({
        trigger_type: updates.trigger_type,
        trigger_event: updates.trigger_event || null,
        schedule_cron: updates.schedule_cron || null,
        conditions_json: updates.conditions_json || {},
        target_json: updates.target_json || {},
        template_id: updates.template_id ? Number(updates.template_id) : null,
        is_enabled: updates.is_enabled !== false,
        updated_at: new Date().toISOString(),
      })
      .eq("automation_id", Number(id))
      .select("*")
      .single();

    return { data: { data: data ? mapAutomation(data) : null, status: error ? "Error" : "Success" }, error };
  },

  async deleteAutomation(params) {
    const id = params?.id || params?.automation_id || params;
    const { error } = await supabase.from("chat_automations").delete().eq("automation_id", Number(id));
    return { data: { status: error ? "Error" : "Success" }, error };
  },

  async getAutomationJobs() {
    const { data, error } = await supabase
      .from("chat_automation_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    return { data: { data: (data || []).map(mapAutomationJob) }, error };
  },

  async getUserSettings(params) {
    const userId = params?.userId ?? params?.user_id ?? params;
    const key = `${SETTINGS_PREFIX}${userId}`;
    const { data, error } = await supabase
      .from("settings")
      .select("set_value")
      .eq("set_key", key)
      .maybeSingle();

    if (data?.set_value) {
      try {
        const parsed = JSON.parse(data.set_value);
        return { data: { data: { ...DEFAULT_CHAT_SETTINGS, ...parsed } }, error };
      } catch (parseError) {
        return { data: { data: { ...DEFAULT_CHAT_SETTINGS } }, error: parseError };
      }
    }

    return { data: { data: { ...DEFAULT_CHAT_SETTINGS } }, error };
  },

  async saveUserSettings(params) {
    const userId = params?.userId ?? params?.user_id;
    const settings = params?.settings || params;
    const key = `${SETTINGS_PREFIX}${userId}`;
    const { error } = await supabase
      .from("settings")
      .upsert(
        [
          {
            set_key: key,
            set_value: JSON.stringify(settings),
            set_description: "Chat user settings",
          },
        ],
        { onConflict: "set_key" }
      );

    return { data: { data: settings, status: error ? "Error" : "Success" }, error };
  },
};

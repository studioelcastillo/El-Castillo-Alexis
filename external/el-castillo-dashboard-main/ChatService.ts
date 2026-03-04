
import { api } from './api';
import { ChatMessage, Conversation, RoleChatPolicy, MessageTemplate, BroadcastList, BroadcastJob, AutomationRule, AutomationJob, ChatSettings, PresenceStatus, ChatProfile, RoleDefaults } from './types';

// --- MOCK STATE FOR ADMIN (Persistent during SPA session) ---
// Inicializamos con null para saber si ya se ha cargado o guardado algo
let localPolicies: Partial<RoleChatPolicy>[] | null = null;

const ChatService = {
  // --- Conversations ---
  getConversations: () => {
    return api.get<Conversation[]>('/chat/conversations');
  },

  createDirectConversation: (targetUserId: number) => {
    return api.post<Conversation>('/chat/conversations/direct', { targetUserId });
  },

  createGroupConversation: (params: { name: string, memberIds: number[], description?: string }) => {
    return api.post<Conversation>('/chat/conversations/group', params);
  },

  // --- Messages ---
  getMessages: (conversationId: string, limit: number = 50, cursor?: string) => {
    const query = new URLSearchParams({ limit: limit.toString() });
    if (cursor) query.append('cursor', cursor);
    return api.get<ChatMessage[]>(`/chat/conversations/${conversationId}/messages?${query.toString()}`);
  },

  sendMessage: (conversationId: string, params: { type: string, content_text?: string, media_id?: string, reply_to_id?: string }) => {
    return api.post<ChatMessage>(`/chat/conversations/${conversationId}/messages`, params);
  },

  editMessage: (messageId: string, content_text: string) => {
    return api.patch(`/chat/messages/${messageId}`, { content_text });
  },

  deleteMessage: (messageId: string, scope: 'me' | 'all' = 'me') => {
    return api.delete(`/chat/messages/${messageId}?scope=${scope}`);
  },

  // --- Profile & Settings ---
  getMyProfile: () => {
    return api.get<ChatProfile>('/chat/me/profile');
  },

  updateMyProfile: (data: Partial<ChatProfile>) => {
    return api.patch<ChatProfile>('/chat/me/profile', data);
  },

  updatePresence: (status: PresenceStatus) => {
    return api.patch('/chat/me/presence', { presence_status: status });
  },

  getSettings: () => {
    return api.get<ChatSettings>('/chat/me/settings');
  },

  updateSettings: (settings: Partial<ChatSettings>) => {
    return api.patch('/chat/me/settings', { settings });
  },

  getOnlineUsers: () => {
    return api.get<ChatProfile[]>('/chat/presence/online');
  },

  // --- Policies & Admin (MOCKED TO PREVENT 404 AND PERSIST CHANGES) ---
  getPolicies: async () => {
    // Simulamos retraso de red
    await new Promise(resolve => setTimeout(resolve, 500));
    return Promise.resolve({ data: localPolicies });
  },

  updatePolicies: async (policies: Partial<RoleChatPolicy>[]) => {
    // Simulamos retraso de red
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Persistimos en la variable local del módulo
    localPolicies = policies;
    return Promise.resolve({ status: 'success', message: 'Policies updated locally' });
  },

  blockUser: (targetUserId: number) => {
    return api.post('/chat/blocks', { targetUserId });
  },

  unblockUser: (targetUserId: number) => {
    return api.delete(`/chat/blocks/${targetUserId}`);
  },

  getRoleDefaults: (roleId: number) => {
    return api.get<RoleDefaults>(`/roles/${roleId}/defaults`);
  },

  updateRoleDefaults: (roleId: number, defaults: Partial<RoleDefaults>) => {
    return api.patch<RoleDefaults>(`/roles/${roleId}/defaults`, defaults);
  },

  // --- 1. Broadcasts ---
  getBroadcastLists: () => {
    return api.get<BroadcastList[]>('/chat/broadcast/lists');
  },

  saveBroadcastList: (data: Partial<BroadcastList>) => {
    return api.post<BroadcastList>('/chat/broadcast/lists', data);
  },

  sendBroadcast: (params: { mode: string, audience_rules_json: any, message_payload: any, reason: string, list_id?: string }) => {
    return api.post<BroadcastJob>('/chat/broadcast/send', params);
  },

  getBroadcastJobs: (cursor?: string) => {
    return api.get<BroadcastJob[]>(`/chat/broadcast/jobs${cursor ? `?cursor=${cursor}` : ''}`);
  },

  cancelBroadcastJob: (jobId: string) => {
    return api.post(`/chat/broadcast/jobs/${jobId}/cancel`);
  },

  // --- 2. Templates ---
  getTemplates: () => {
    return api.get<MessageTemplate[]>('/chat/templates');
  },

  saveTemplate: (data: Partial<MessageTemplate>) => {
    if (data.id) return api.patch<MessageTemplate>(`/chat/templates/${data.id}`, data);
    return api.post<MessageTemplate>('/chat/templates', data);
  },

  deleteTemplate: (id: string) => {
    return api.delete(`/chat/templates/${id}`);
  },

  // --- 3. Automations ---
  getAutomations: () => {
    return api.get<AutomationRule[]>('/chat/automations');
  },

  saveAutomation: (data: Partial<AutomationRule>) => {
    if (data.id) return api.patch<AutomationRule>(`/chat/automations/${data.id}`, data);
    return api.post<AutomationRule>('/chat/automations', data);
  },

  deleteAutomation: (id: string) => {
    return api.delete(`/chat/automations/${id}`);
  },

  getAutomationJobs: (cursor?: string) => {
    return api.get<AutomationJob[]>(`/chat/automations/jobs${cursor ? `?cursor=${cursor}` : ''}`);
  }
};

export default ChatService;

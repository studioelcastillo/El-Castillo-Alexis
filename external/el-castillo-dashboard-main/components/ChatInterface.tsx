import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Send, Paperclip, Smile, Phone, Video, Info, Check, CheckCheck, 
  ChevronLeft, Trash2, Reply, SmilePlus, BellOff, UserPlus, ShieldAlert,
  Users, Settings, Circle, RefreshCw
} from 'lucide-react';
import { ChatMessage, Conversation, PresenceStatus, ChatProfile, ChatSettings } from '../types';
import ChatSettingsModal from './ChatSettingsModal';
import ChatService from '../ChatService';
import Avatar from './Avatar';

// Mock Data Updated with Avatars
const MOCK_ONLINE_USERS: ChatProfile[] = [
  { id: 'u1', user_id: 3990, display_name: 'Jennifer Zuluaga', role_name: 'MODELO', presence_status: 'available', role_id: 3, avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', avatar_version: 1 },
  { id: 'u2', user_id: 3989, display_name: 'Ana Acero', role_name: 'MODELO', presence_status: 'busy', role_id: 3, avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', avatar_version: 2 },
  { id: 'u3', user_id: 3988, display_name: 'Sofia Mosquera', role_name: 'MONITOR', presence_status: 'available', role_id: 2, avatar_version: 1 }, // No avatar test
  { id: 'u4', user_id: 1001, display_name: 'Admin Principal', role_name: 'ADMINISTRADOR', presence_status: 'away', role_id: 1, avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80', avatar_version: 5 },
  { id: 'u5', user_id: 2002, display_name: 'Soporte Técnico', role_name: 'SOPORTE', presence_status: 'busy', role_id: 5, avatar_version: 1 }
];

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1', type: 'direct', unread_count: 2, created_at: '2025-05-20',
    members: [{ id: 'p1', user_id: 3988, display_name: 'Sofia Mosquera', role_id: 2, role_name: 'MONITOR', is_online: true, presence_status: 'available', avatar_version: 1 }],
    last_message: { id: 'm1', conversation_id: 'c1', sender_id: 3988, sender_name: 'Sofia', type: 'text', content_text: '¿Ya terminaste?', status: 'delivered', created_at: '2025-05-20T14:30:00Z' }
  },
  {
    id: 'group1', type: 'group', name: 'Operativo Red Dreams', unread_count: 0, created_at: '2025-05-18', members: [], avatar_url: 'https://ui-avatars.com/api/?name=Red+Dreams&background=random',
    last_message: { id: 'm2', conversation_id: 'group1', sender_id: 3990, sender_name: 'Jennifer', type: 'text', content_text: 'Entendido.', status: 'read', created_at: '2025-05-20T12:00:00Z' }
  }
];

const DEFAULT_SETTINGS: ChatSettings = {
  sound_incoming: true, sound_outgoing: true, sound_mentions: true,
  glow_on_new: true, toast_on_new: true, show_online_status: true,
  quiet_hours_enabled: false, quiet_hours_start: '22:00', quiet_hours_end: '08:00'
};

const ChatInterface: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chats' | 'connected'>('chats');
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchConv, setSearchConv] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [presence, setPresence] = useState<PresenceStatus>('available');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Group online users by role
  const groupedOnlineUsers = MOCK_ONLINE_USERS.reduce((acc, user) => {
    const role = user.role_name || 'OTROS';
    if (!acc[role]) acc[role] = [];
    acc[role].push(user);
    return acc;
  }, {} as Record<string, ChatProfile[]>);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeConv]);

  // Load initial mock messages when switching conv
  useEffect(() => {
      if (activeConv) {
          // Initialize with some mock data if empty
          if (messages.length === 0) {
              setMessages([
                  { id: 'hist1', conversation_id: activeConv.id, sender_id: activeConv.members[0]?.user_id || 999, sender_name: activeConv.members[0]?.display_name || 'User', type: 'text', content_text: 'Hola, ¿cómo estás?', status: 'read', created_at: new Date(Date.now() - 86400000).toISOString() },
                  ...(activeConv.last_message ? [activeConv.last_message] : [])
              ]);
          }
      }
  }, [activeConv]);

  // Fake current user for message bubbles
  const currentUser = {
    id: 0,
    name: 'Yo',
    avatar_url: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80',
    version: 1
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    // 1. Add User Message
    const newMessage: ChatMessage = {
      id: Date.now().toString(), conversation_id: activeConv?.id || '',
      sender_id: currentUser.id, sender_name: currentUser.name, 
      sender_avatar_url: currentUser.avatar_url, 
      type: 'text', content_text: inputText,
      status: 'sent', created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    // 2. Simulate Reply (Echo)
    if (activeConv?.type === 'direct') {
        setTimeout(() => {
            const reply: ChatMessage = {
                id: (Date.now() + 1).toString(),
                conversation_id: activeConv.id,
                sender_id: activeConv.members[0].user_id,
                sender_name: activeConv.members[0].display_name,
                sender_avatar_url: activeConv.members[0].avatar_url,
                type: 'text',
                content_text: `Recibido: "${newMessage.content_text}". (Respuesta automática)`,
                status: 'read',
                created_at: new Date().toISOString()
            };
            setMessages(prev => [...prev, reply]);
        }, 1500);
    }
  };

  return (
    <div className="flex h-full bg-white overflow-hidden relative">
      
      {/* LEFT SIDEBAR (Chats / Connected) */}
      <div className={`
        ${activeConv ? 'hidden md:flex' : 'flex'} 
        w-full md:w-80 lg:w-96 flex-col border-r border-slate-100 bg-slate-50/30
      `}>
        
        {/* Header User Status */}
        <div className="p-4 border-b border-slate-100 bg-white">
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                 <Avatar 
                    src={currentUser.avatar_url} 
                    name={currentUser.name} 
                    size="sm" 
                    status={presence}
                    version={currentUser.version}
                 />
                 <div>
                    <h4 className="text-sm font-black text-slate-900 leading-none">Mi Estado</h4>
                    <select 
                      className="text-[10px] font-bold text-slate-500 bg-transparent outline-none uppercase tracking-wide cursor-pointer hover:text-amber-600 transition-colors mt-0.5"
                      value={presence}
                      onChange={(e) => setPresence(e.target.value as PresenceStatus)}
                    >
                       <option value="available">Disponible</option>
                       <option value="busy">Ocupado</option>
                       <option value="away">Ausente</option>
                       <option value="offline">Desconectado</option>
                    </select>
                 </div>
              </div>
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
              >
                 <Settings size={18} />
              </button>
           </div>

           {/* Tabs */}
           <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
              <button 
                onClick={() => setActiveTab('chats')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'chats' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Chats
              </button>
              <button 
                onClick={() => setActiveTab('connected')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'connected' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Conectados
              </button>
           </div>

           <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder={activeTab === 'chats' ? "Buscar conversación..." : "Buscar usuario..."}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/10 transition-all"
              value={searchConv}
              onChange={(e) => setSearchConv(e.target.value)}
            />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
           {activeTab === 'chats' ? (
              MOCK_CONVERSATIONS.filter(c => (c.name || c.members[0].display_name).toLowerCase().includes(searchConv.toLowerCase())).map(conv => {
                const isDirect = conv.type === 'direct';
                const target = isDirect ? conv.members[0] : null;
                const name = isDirect ? target?.display_name : conv.name;
                const avatarUrl = isDirect ? target?.avatar_url : conv.avatar_url;
                const status = isDirect ? target?.presence_status : undefined;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConv(conv)}
                    className={`
                      w-full flex items-center gap-4 p-3 rounded-2xl transition-all
                      ${activeConv?.id === conv.id ? 'bg-white shadow-md shadow-slate-200/50 ring-1 ring-slate-100' : 'hover:bg-slate-100/50'}
                    `}
                  >
                    <Avatar 
                      src={avatarUrl} 
                      name={name || 'Unknown'} 
                      size="md" 
                      status={status}
                      isGroup={!isDirect}
                      version={target?.avatar_version}
                    />
                    
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <h4 className="font-bold text-slate-900 truncate text-sm">{name}</h4>
                        <span className="text-[10px] text-slate-400 font-medium">14:30</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-[11px] text-slate-500 truncate leading-none">{conv.last_message?.content_text}</p>
                        {conv.unread_count > 0 && (
                            <span className="bg-amber-500 text-[#0B1120] text-[9px] font-black px-1.5 py-0.5 rounded-full">{conv.unread_count}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
           ) : (
              // Connected Users List Grouped by Role
              <div className="space-y-4 pt-2">
                 {(Object.entries(groupedOnlineUsers) as [string, ChatProfile[]][]).map(([role, users]) => (
                    <div key={role}>
                       <h5 className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 sticky top-0 bg-slate-50/95 backdrop-blur-sm py-1 z-10">{role}</h5>
                       <div className="space-y-1">
                          {users.filter(u => u.display_name.toLowerCase().includes(searchConv.toLowerCase())).map(user => (
                             <button 
                               key={user.id}
                               onClick={() => {/* Mock open chat logic: create conv if not exists */}}
                               className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all"
                             >
                                <Avatar 
                                  src={user.avatar_url} 
                                  name={user.display_name} 
                                  size="sm" 
                                  status={user.presence_status}
                                  version={user.avatar_version}
                                />
                                <span className="text-xs font-bold text-slate-700">{user.display_name}</span>
                             </button>
                          ))}
                       </div>
                    </div>
                 ))}
              </div>
           )}
        </div>
      </div>

      {/* RIGHT MAIN CHAT AREA */}
      {activeConv ? (
        <div className="flex-1 flex flex-col relative bg-[#F8FAFC] w-full h-full absolute md:relative z-20 md:z-auto">
          
          {/* Header */}
          <div className="h-20 shrink-0 border-b border-slate-100 bg-white px-4 flex items-center justify-between z-10 shadow-sm">
            <div className="flex items-center gap-4">
              <button onClick={() => setActiveConv(null)} className="md:hidden p-2 text-slate-400 hover:bg-slate-50 rounded-full active:scale-95"><ChevronLeft size={24} /></button>
              <div className="flex items-center gap-3">
                <Avatar 
                  src={activeConv.type === 'direct' ? activeConv.members[0].avatar_url : activeConv.avatar_url} 
                  name={activeConv.type === 'direct' ? activeConv.members[0].display_name : activeConv.name || 'Group'} 
                  size="md" 
                  status={activeConv.type === 'direct' ? activeConv.members[0].presence_status : undefined}
                  isGroup={activeConv.type === 'group'}
                  version={activeConv.type === 'direct' ? activeConv.members[0].avatar_version : 1}
                />
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-none">
                    {activeConv.type === 'direct' ? activeConv.members[0].display_name : activeConv.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       {activeConv.type === 'direct' ? (activeConv.members[0].role_name || 'Usuario') : `${activeConv.members.length} Miembros`}
                     </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
               <button className="hidden md:flex p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><Phone size={20} /></button>
               <button className="hidden md:flex p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><Video size={20} /></button>
               <button onClick={() => setShowInfo(!showInfo)} className={`p-2.5 rounded-xl transition-all ${showInfo ? 'bg-amber-50 text-amber-600' : 'text-slate-400 hover:bg-slate-50'}`}><Info size={20} /></button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-95">
            {messages.map((msg) => {
                const isMe = msg.sender_id === currentUser.id;
                return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300 group`}>
                        <div className={`flex gap-3 max-w-[85%] md:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Message Avatar (Only for group chats or inbound) */}
                            {!isMe && (
                              <div className="shrink-0 self-end mb-1">
                                <Avatar 
                                  src={msg.sender_avatar_url} // Use snapshot url if available
                                  name={msg.sender_name} 
                                  size="xs"
                                  className="shadow-sm"
                                />
                              </div>
                            )}

                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                {!isMe && activeConv.type === 'group' && (
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-2">{msg.sender_name}</span>
                                )}
                                <div className={`p-4 rounded-2xl shadow-sm relative ${isMe ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}`}>
                                    <p className="text-sm leading-relaxed">{msg.content_text}</p>
                                    <div className="flex items-center justify-end gap-1.5 mt-2">
                                        <span className="text-[9px] font-medium opacity-50">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        {isMe && <span className="text-amber-400"><CheckCheck size={12} /></span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 md:p-6 bg-white border-t border-slate-100">
            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-end gap-3">
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-[24px] p-2 flex items-end gap-2 focus-within:bg-white focus-within:border-amber-500/50 focus-within:ring-4 focus-within:ring-amber-500/5 transition-all">
                <button type="button" className="hidden md:block p-2.5 text-slate-400 hover:text-amber-500"><Paperclip size={20} /></button>
                <textarea 
                  rows={1} placeholder="Escribe un mensaje..."
                  className="flex-1 bg-transparent border-none outline-none text-sm py-2.5 resize-none max-h-32 text-slate-700 font-medium placeholder:text-slate-400"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }}}
                />
                <button type="button" className="hidden md:block p-2.5 text-slate-400 hover:text-amber-500"><Smile size={20} /></button>
              </div>
              <button type="submit" className="w-12 h-12 bg-slate-900 text-amber-400 rounded-full flex items-center justify-center hover:bg-black transition-all shadow-lg active:scale-95 shrink-0">
                <Send size={20} />
              </button>
            </form>
          </div>

          {/* Info Sidebar */}
          {showInfo && (
            <div className="absolute right-0 top-20 bottom-0 w-full md:w-80 bg-white border-l border-slate-100 shadow-2xl z-20 animate-in slide-in-from-right duration-300 flex flex-col">
               <div className="p-8 flex flex-col items-center text-center border-b border-slate-50 relative">
                  <button onClick={() => setShowInfo(false)} className="absolute top-4 left-4 p-2 bg-slate-50 rounded-full md:hidden"><ChevronLeft size={20}/></button>
                  <Avatar 
                    src={activeConv.type === 'direct' ? activeConv.members[0].avatar_url : activeConv.avatar_url} 
                    name={activeConv.type === 'direct' ? activeConv.members[0].display_name : activeConv.name || 'Group'} 
                    size="lg" 
                    className="mb-4 shadow-xl"
                    version={activeConv.type === 'direct' ? activeConv.members[0].avatar_version : 1}
                  />
                  <h4 className="text-lg font-black text-slate-900 tracking-tight">{activeConv.type === 'direct' ? activeConv.members[0].display_name : activeConv.name}</h4>
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mt-1">{activeConv.type === 'direct' ? activeConv.members[0].role_name : 'Chat de Grupo'}</p>
               </div>
               <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div>
                     <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Ajustes</h5>
                     <div className="space-y-2">
                        <button className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl text-slate-600 transition-all"><BellOff size={18} className="text-slate-400" /><span className="text-xs font-bold">Silenciar</span></button>
                        <button className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-xl text-red-500 transition-all"><ShieldAlert size={18} /><span className="text-xs font-bold">Bloquear</span></button>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 p-8 text-center hidden md:flex">
            <div className="w-20 h-20 bg-white rounded-[32px] border border-slate-100 flex items-center justify-center text-slate-300 mb-6 shadow-sm"><Users size={32} /></div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Selecciona un Chat</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-xs leading-relaxed font-medium">O inicia una conversación desde la lista de conectados.</p>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <ChatSettingsModal settings={settings} onClose={() => setShowSettings(false)} onSave={setSettings} />
      )}
    </div>
  );
};

export default ChatInterface;

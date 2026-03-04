
import React, { useState, useEffect, useRef } from 'react';
import { 
  Monitor, Wifi, WifiOff, Lock, Mic, MicOff, MousePointer2, 
  Power, Settings, ShieldCheck, Clock, Search, MoreVertical, 
  Terminal, RefreshCw, X, Maximize2, Minimize2, Video, 
  Volume2, VolumeX, Keyboard, FileText, AlertTriangle, CheckCircle2,
  LogOut, Command, Laptop, Server, Smartphone, Plus
} from 'lucide-react';
import RemoteDesktopService, { RemoteDevice, AuditLog, AccessPolicy } from '../RemoteDesktopService';

// --- COMPONENTS ---

const PoliciesList: React.FC<{ policies: AccessPolicy[] }> = ({ policies }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {policies.map(policy => (
            <div key={policy.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h4 className="font-black text-slate-900 text-sm">{policy.name}</h4>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {policy.allowed_roles.map(role => (
                                <span key={role} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase">{role}</span>
                            ))}
                        </div>
                    </div>
                    <ShieldCheck className="text-emerald-500" size={20} />
                </div>
                <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium">Acceso No Asistido</span>
                        <span className={`font-bold ${policy.allow_unattended ? 'text-emerald-600' : 'text-red-500'}`}>{policy.allow_unattended ? 'Permitido' : 'Bloqueado'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium">Requiere Consentimiento</span>
                        <span className={`font-bold ${policy.require_consent ? 'text-amber-600' : 'text-slate-600'}`}>{policy.require_consent ? 'Sí' : 'No'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium">Audio Remoto</span>
                        <span className={`font-bold ${policy.allow_audio ? 'text-emerald-600' : 'text-slate-400'}`}>{policy.allow_audio ? 'Habilitado' : 'Deshabilitado'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium">Control Input</span>
                        <span className={`font-bold ${policy.allow_control ? 'text-emerald-600' : 'text-slate-400'}`}>{policy.allow_control ? 'Habilitado' : 'Solo Vista'}</span>
                    </div>
                </div>
            </div>
        ))}
        <button className="flex flex-col items-center justify-center p-6 rounded-[32px] border-2 border-dashed border-slate-200 text-slate-400 hover:border-emerald-400 hover:text-emerald-500 transition-all bg-slate-50/50">
            <Plus size={32} />
            <span className="text-xs font-black uppercase tracking-widest mt-2">Nueva Política</span>
        </button>
    </div>
);

const DeviceDetailsModal: React.FC<{ 
    device: RemoteDevice, 
    existingGroups: string[],
    onClose: () => void, 
    onRotateKey: () => void,
    onUpdate: (deviceId: string, data: Partial<RemoteDevice>) => Promise<void>
}> = ({ device, existingGroups, onClose, onRotateKey, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [formData, setFormData] = useState({
        name: device.name,
        groups: [...device.groups],
        tags: device.tags.join(', ')
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onUpdate(device.id, {
                name: formData.name,
                groups: formData.groups,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
            });
            setIsEditing(false);
            setIsCreatingGroup(false);
        } catch (e) {
            alert("Error al guardar: " + e);
        } finally {
            setSaving(false);
        }
    };

    const toggleGroup = (group: string) => {
        if (formData.groups.includes(group)) {
            setFormData({ ...formData, groups: formData.groups.filter(g => g !== group) });
        } else {
            setFormData({ ...formData, groups: [...formData.groups, group] });
        }
    };

    const handleAddNewGroup = () => {
        if (newGroupName.trim() && !formData.groups.includes(newGroupName.trim())) {
            setFormData({ ...formData, groups: [...formData.groups, newGroupName.trim()] });
            setNewGroupName('');
            setIsCreatingGroup(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl p-10 animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-start mb-8">
                    <div className="flex-1 mr-4">
                        {isEditing ? (
                            <input 
                                className="text-2xl font-black text-slate-900 border-b-2 border-emerald-500 outline-none w-full bg-transparent"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder="Nombre del Dispositivo"
                            />
                        ) : (
                            <h3 className="text-2xl font-black text-slate-900">{device.name}</h3>
                        )}
                        <p className="text-sm text-slate-500 font-medium mt-1">Detalles y configuración de seguridad</p>
                    </div>
                    <div className="flex gap-2">
                        {!isEditing ? (
                            <button onClick={() => setIsEditing(true)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-all" title="Editar">
                                <Settings size={20} />
                            </button>
                        ) : (
                            <button onClick={handleSave} disabled={saving} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all" title="Guardar">
                                {saving ? <RefreshCw size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-all">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Información General</h4>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Estado</p>
                                <p className={`text-sm font-black ${device.status === 'ONLINE' ? 'text-emerald-600' : 'text-slate-500'}`}>{device.status}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Grupos / Sedes</p>
                                {isEditing ? (
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap gap-2">
                                            {existingGroups.map(g => (
                                                <button 
                                                    key={g} 
                                                    onClick={() => toggleGroup(g)}
                                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                        formData.groups.includes(g) 
                                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    {g}
                                                </button>
                                            ))}
                                        </div>
                                        
                                        {isCreatingGroup ? (
                                            <div className="flex gap-2">
                                                <input 
                                                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all"
                                                    value={newGroupName}
                                                    onChange={e => setNewGroupName(e.target.value)}
                                                    placeholder="Nuevo grupo..."
                                                    autoFocus
                                                    onKeyDown={e => e.key === 'Enter' && handleAddNewGroup()}
                                                />
                                                <button 
                                                    onClick={handleAddNewGroup}
                                                    className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600"
                                                >
                                                    <CheckCircle2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => setIsCreatingGroup(false)}
                                                    className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => setIsCreatingGroup(true)}
                                                className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1 hover:text-emerald-700"
                                            >
                                                <Plus size={14} /> Crear Nuevo Grupo
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-1">
                                        {device.groups.map(g => (
                                            <span key={g} className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase">{g}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Etiquetas (Separadas por coma)</p>
                                {isEditing ? (
                                    <input 
                                        className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all"
                                        value={formData.tags}
                                        onChange={e => setFormData({...formData, tags: e.target.value})}
                                        placeholder="Ej: Principal, Caja, VIP..."
                                    />
                                ) : (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {device.tags.map(tag => (
                                            <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase">{tag}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">OS / Versión</p>
                                    <p className="text-sm font-bold text-slate-700">{device.os} {device.version}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">IP Address</p>
                                    <p className="text-sm font-mono font-bold text-slate-700">{device.ip_address}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Seguridad & Acceso</h4>
                        
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-700">Acceso No Asistido</span>
                                {device.unattended_enabled ? (
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-black uppercase">Activo</span>
                                ) : (
                                    <span className="px-2 py-0.5 bg-slate-200 text-slate-500 rounded text-[9px] font-black uppercase">Inactivo</span>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
                                Permite conectar sin aprobación manual del usuario remoto. Requiere clave segura.
                            </p>
                            <button 
                                onClick={onRotateKey}
                                className="w-full py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-amber-500 hover:text-amber-600 transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                                <RefreshCw size={12} /> Rotar Clave de Acceso
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
                    <button className="px-6 py-3 bg-red-50 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-all">
                        Revocar Acceso
                    </button>
                    <button onClick={onClose} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-900/20">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

const DeviceCard: React.FC<{ device: RemoteDevice, onConnect: () => void, onManage: () => void }> = ({ device, onConnect, onManage }) => {
    const isOnline = device.status === 'ONLINE' || device.status === 'BUSY';
    const isBusy = device.status === 'BUSY';

    return (
        <div className={`relative bg-white rounded-2xl border ${isOnline ? 'border-slate-200' : 'border-slate-100 bg-slate-50/50'} p-0 shadow-sm hover:shadow-md transition-all group overflow-hidden`}>
            {/* Preview Image Area */}
            <div className="relative h-32 bg-slate-100 border-b border-slate-100 group-hover:opacity-90 transition-opacity">
                {isOnline && device.preview_url ? (
                    <>
                        <img 
                            src={device.preview_url} 
                            alt={`Preview ${device.name}`} 
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-[9px] font-bold text-white flex items-center gap-1">
                            <Clock size={10} />
                            {device.preview_updated_at ? Math.floor((Date.now() - new Date(device.preview_updated_at).getTime()) / 1000) + 's' : 'Now'}
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Monitor size={48} strokeWidth={1} />
                    </div>
                )}
                
                {/* Status Badge Overlay */}
                <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 shadow-sm backdrop-blur-md ${
                    device.status === 'ONLINE' ? 'bg-emerald-500/90 text-white' : 
                    device.status === 'BUSY' ? 'bg-amber-500/90 text-white' : 
                    'bg-slate-500/90 text-white'
                }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                        device.status === 'ONLINE' ? 'bg-white animate-pulse' : 
                        device.status === 'BUSY' ? 'bg-white' : 
                        'bg-slate-300'
                    }`} />
                    {device.status}
                </div>
            </div>

            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${isOnline ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                            {device.os === 'WINDOWS' ? <Monitor size={20} /> : device.os === 'MAC' ? <Laptop size={20} /> : <Server size={20} />}
                        </div>
                        <div>
                            <h3 className={`font-black text-sm ${isOnline ? 'text-slate-900' : 'text-slate-400'}`}>{device.name}</h3>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {device.groups.map(g => (
                                    <span key={g} className="text-[9px] font-black text-slate-400 uppercase tracking-tight bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{g}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {device.unattended_enabled && (
                    <div className="mb-4 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                        <div className="p-1 bg-white rounded-lg shadow-sm text-slate-400"><Lock size={12} /></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Acceso No Asistido Activo</span>
                    </div>
                )}

                <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-medium">IP Address</span>
                        <span className="text-slate-600 font-mono font-bold">{device.ip_address}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-medium">Versión Agente</span>
                        <span className="text-slate-600 font-bold">{device.version}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-medium">Última vez</span>
                        <span className="text-slate-600">{new Date(device.last_seen).toLocaleTimeString()}</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={onConnect}
                        disabled={!isOnline}
                        className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
                    >
                        <Power size={14} /> Conectar
                    </button>
                    <button 
                        onClick={onManage}
                        className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:border-slate-300 hover:text-slate-900 transition-all"
                    >
                        <Settings size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const RemoteSessionView: React.FC<{ 
    device: RemoteDevice, 
    options: any, 
    onClose: () => void 
}> = ({ device, options, onClose }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [micActive, setMicActive] = useState(options.audio === 'MIC' || options.audio === 'BOTH');
    const [sysAudioActive, setSysAudioActive] = useState(options.audio === 'SYS' || options.audio === 'BOTH');
    const [controlActive, setControlActive] = useState(options.control);
    const [showToolbar, setShowToolbar] = useState(true);
    const [sessionTime, setSessionTime] = useState(0);
    const [activeMenu, setActiveMenu] = useState<'NONE' | 'MONITORS' | 'CHAT' | 'ACTIONS'>('NONE');
    const [chatMessages, setChatMessages] = useState<{sender: string, text: string}[]>([]);
    const [chatInput, setChatInput] = useState('');

    useEffect(() => {
        const timer = setInterval(() => setSessionTime(p => p + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSendMessage = () => {
        if (!chatInput.trim()) return;
        setChatMessages([...chatMessages, { sender: 'Yo', text: chatInput }]);
        setChatInput('');
        // Simulate reply
        setTimeout(() => {
            setChatMessages(prev => [...prev, { sender: 'Remoto', text: 'Recibido.' }]);
        }, 1000);
    };

    return (
        <div className={`fixed inset-0 z-[300] bg-slate-950 flex flex-col transition-all duration-300 ${isFullscreen ? '' : 'p-4'}`}>
            {/* Toolbar */}
            <div 
                className={`absolute top-0 left-1/2 -translate-x-1/2 transition-all duration-300 z-[310] ${
                    showToolbar ? 'translate-y-4' : '-translate-y-full'
                }`}
            >
                <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 text-slate-200 px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 relative">
                    <div className="flex items-center gap-3 border-r border-slate-700 pr-6">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <div>
                            <p className="text-xs font-black text-white leading-none">{device.name}</p>
                            <p className="text-[9px] font-mono text-slate-400 mt-0.5">{formatTime(sessionTime)}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setControlActive(!controlActive)}
                            className={`p-2 rounded-lg transition-all ${controlActive ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/10 text-slate-400'}`}
                            title="Control Remoto"
                        >
                            <MousePointer2 size={18} />
                        </button>
                        <button 
                            onClick={() => setSysAudioActive(!sysAudioActive)}
                            className={`p-2 rounded-lg transition-all ${sysAudioActive ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/10 text-slate-400'}`}
                            title="Audio del Sistema"
                        >
                            <Volume2 size={18} />
                        </button>
                        <button 
                            onClick={() => setMicActive(!micActive)}
                            className={`p-2 rounded-lg transition-all ${micActive ? 'bg-amber-500/20 text-amber-400' : 'hover:bg-white/10 text-slate-400'}`}
                            title="Micrófono Remoto"
                        >
                            {micActive ? <Mic size={18} /> : <MicOff size={18} />}
                        </button>
                        <div className="w-px h-4 bg-slate-700 mx-2" />
                        
                        {/* Monitors Button */}
                        <div className="relative">
                            <button 
                                onClick={() => setActiveMenu(activeMenu === 'MONITORS' ? 'NONE' : 'MONITORS')}
                                className={`p-2 rounded-lg transition-all ${activeMenu === 'MONITORS' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-slate-400'}`}
                                title="Monitores"
                            >
                                <Monitor size={18} />
                            </button>
                            {activeMenu === 'MONITORS' && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden py-1">
                                    <button className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                                        <Monitor size={14} /> Todas las pantallas
                                    </button>
                                    <button className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                                        <Monitor size={14} /> Pantalla 1 (Principal)
                                    </button>
                                    <button className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                                        <Monitor size={14} /> Pantalla 2
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Chat Button */}
                        <div className="relative">
                            <button 
                                onClick={() => setActiveMenu(activeMenu === 'CHAT' ? 'NONE' : 'CHAT')}
                                className={`p-2 rounded-lg transition-all ${activeMenu === 'CHAT' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-slate-400'}`}
                                title="Chat"
                            >
                                <FileText size={18} />
                            </button>
                            {/* Chat Window */}
                            {activeMenu === 'CHAT' && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden flex flex-col">
                                    <div className="p-3 bg-slate-900 border-b border-slate-700 text-xs font-bold text-slate-300">Chat con {device.name}</div>
                                    <div className="h-48 overflow-y-auto p-3 space-y-2 bg-slate-800/50">
                                        {chatMessages.length === 0 && <p className="text-[10px] text-slate-500 text-center italic mt-4">Inicio del chat...</p>}
                                        {chatMessages.map((msg, i) => (
                                            <div key={i} className={`flex flex-col ${msg.sender === 'Yo' ? 'items-end' : 'items-start'}`}>
                                                <span className={`px-2 py-1 rounded-lg text-[10px] max-w-[80%] ${msg.sender === 'Yo' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                                                    {msg.text}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-2 border-t border-slate-700 flex gap-2">
                                        <input 
                                            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-emerald-500"
                                            placeholder="Escribir..."
                                            value={chatInput}
                                            onChange={e => setChatInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                        />
                                        <button onClick={handleSendMessage} className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"><Command size={12}/></button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions Button */}
                        <div className="relative">
                            <button 
                                onClick={() => setActiveMenu(activeMenu === 'ACTIONS' ? 'NONE' : 'ACTIONS')}
                                className={`p-2 rounded-lg transition-all ${activeMenu === 'ACTIONS' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-slate-400'}`}
                                title="Acciones"
                            >
                                <Command size={18} />
                            </button>
                            {activeMenu === 'ACTIONS' && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden py-1">
                                    <button className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                                        <Keyboard size={14} /> Enviar Ctrl+Alt+Del
                                    </button>
                                    <button className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                                        <Lock size={14} /> Bloquear Sesión
                                    </button>
                                    <button className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-900/30 hover:text-red-300 flex items-center gap-2">
                                        <Power size={14} /> Reiniciar Remoto
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 border-l border-slate-700 pl-6">
                        <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400">
                            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        </button>
                        <button onClick={onClose} className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all">
                            <X size={18} />
                        </button>
                    </div>
                </div>
                
                {/* Toggle Handle */}
                <div 
                    className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-12 h-6 flex justify-center cursor-pointer group"
                    onClick={() => setShowToolbar(!showToolbar)}
                >
                    <div className="w-8 h-1 bg-slate-700 rounded-full group-hover:bg-slate-500 transition-colors" />
                </div>
            </div>

            {/* Remote Screen Area */}
            <div className={`flex-1 bg-black relative overflow-hidden flex items-center justify-center ${isFullscreen ? '' : 'rounded-2xl border border-slate-800 shadow-2xl'}`}>
                {/* Simulated Desktop Content */}
                <div className="relative w-full h-full max-w-[1920px] max-h-[1080px] bg-slate-900 flex items-center justify-center group cursor-none">
                    <img 
                        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
                        alt="Remote Desktop" 
                        className="w-full h-full object-cover opacity-80"
                    />
                    
                    {/* Simulated Remote Cursor */}
                    {controlActive && (
                        <div className="absolute top-1/2 left-1/2 pointer-events-none drop-shadow-lg">
                            <MousePointer2 size={24} className="text-white fill-black" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- MAIN PAGE ---

const RemoteDesktopPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'DEVICES' | 'AUDIT' | 'POLICIES'>('DEVICES');
    const [devices, setDevices] = useState<RemoteDevice[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [policies, setPolicies] = useState<AccessPolicy[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showOffline, setShowOffline] = useState(false);

    // Session State
    const [connectModal, setConnectModal] = useState<{ isOpen: boolean, device?: RemoteDevice }>({ isOpen: false });
    const [detailsModal, setDetailsModal] = useState<{ isOpen: boolean, device?: RemoteDevice }>({ isOpen: false });
    const [activeSession, setActiveSession] = useState<{ device: RemoteDevice, options: any } | null>(null);
    const [sessionOptions, setSessionOptions] = useState({
        control: false,
        audio: 'NONE' as 'NONE'|'SYS'|'MIC'|'BOTH',
        monitor: 'ALL'
    });

    useEffect(() => {
        loadData();
        // Periodic refresh for previews (every 15s)
        const interval = setInterval(() => {
            if (activeTab === 'DEVICES') {
                loadData(true); // Silent reload
            }
        }, 15000);
        return () => clearInterval(interval);
    }, [activeTab]);

    const loadData = async (silent = false) => {
        if (!silent) setLoading(true);
        const [devs, logs, pols] = await Promise.all([
            RemoteDesktopService.getDevices(),
            RemoteDesktopService.getAuditLogs(),
            RemoteDesktopService.getPolicies()
        ]);
        setDevices(devs);
        setAuditLogs(logs);
        setPolicies(pols);
        if (!silent) setLoading(false);
    };

    const handleAutoEnroll = async () => {
        const newDevice = await RemoteDesktopService.autoEnroll({
            device_uuid: crypto.randomUUID(),
            hostname: `NEW-PC-${Math.floor(Math.random() * 1000)}`,
            os: 'WINDOWS',
            version: '1.5.0',
            monitors: 2
        });
        alert(`Dispositivo auto-enrolado: ${newDevice.name}`);
        loadData();
    };

    const handleConnect = async () => {
        if (!connectModal.device) return;
        try {
            await RemoteDesktopService.connect(connectModal.device.id, sessionOptions);
            setActiveSession({ device: connectModal.device, options: sessionOptions });
            setConnectModal({ isOpen: false });
        } catch (e) {
            alert("Error al conectar: " + e);
        }
    };

    const handleDisconnect = async () => {
        if (activeSession) {
            // In real app, get session ID
            setActiveSession(null);
            loadData(); // Refresh status
        }
    };

    const handleRotateKey = async (deviceId: string) => {
        if (!confirm("¿Rotar clave de acceso no asistido? Esto desconectará sesiones activas.")) return;
        await RemoteDesktopService.rotateKey(deviceId);
        alert("Clave rotada exitosamente. Nueva clave generada y almacenada en bóveda.");
        loadData();
    };

    const handleUpdateDevice = async (deviceId: string, data: Partial<RemoteDevice>) => {
        await RemoteDesktopService.updateDevice(deviceId, data);
        // Update local state to reflect changes immediately without full reload if possible, or just reload
        setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, ...data } : d));
        // Also update the modal device data if it's open
        if (detailsModal.device && detailsModal.device.id === deviceId) {
            setDetailsModal(prev => ({ ...prev, device: { ...prev.device!, ...data } }));
        }
    };

    const filteredDevices = devices.filter(d => 
        (showOffline || d.status !== 'OFFLINE') &&
        (d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        d.groups.some(g => g.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    const uniqueGroups = Array.from(new Set(devices.flatMap(d => d.groups))).sort();

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2.5 bg-slate-900 text-emerald-400 rounded-2xl shadow-xl shadow-slate-900/20"><Monitor size={32} /></div>
                        Acceso Remoto
                    </h1>
                    <p className="text-sm text-slate-500 mt-2 font-medium">Gestión de flota, soporte remoto y acceso no asistido seguro.</p>
                </div>
                
                <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                    <button 
                        onClick={() => setShowOffline(!showOffline)}
                        className={`px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wide transition-all ${showOffline ? 'bg-slate-200 text-slate-700' : 'bg-white border border-slate-200 text-slate-400'}`}
                    >
                        {showOffline ? 'Ocultar Offline' : 'Mostrar Offline'}
                    </button>
                    
                    <button 
                        onClick={handleAutoEnroll}
                        className="px-4 py-3 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl text-xs font-bold uppercase tracking-wide hover:bg-indigo-100 transition-all"
                    >
                        + Simular Auto-Enroll
                    </button>

                    <button onClick={() => loadData()} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 shadow-sm transition-all">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <div className="relative flex-1 md:w-64">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar dispositivo..." 
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-white/50 backdrop-blur-md p-1.5 rounded-[28px] border border-slate-200/60 w-full md:w-fit shadow-sm gap-1">
                {[
                    { id: 'DEVICES', label: 'Dispositivos', icon: Monitor },
                    { id: 'AUDIT', label: 'Auditoría & Logs', icon: FileText },
                    { id: 'POLICIES', label: 'Políticas de Acceso', icon: ShieldCheck },
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2.5 px-6 py-3.5 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-900 text-emerald-400 shadow-xl shadow-slate-900/30' : 'text-slate-500 hover:text-slate-900 hover:bg-white'}`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* CONTENT */}
            <div className="min-h-[500px]">
                
                {/* DEVICES TAB */}
                {activeTab === 'DEVICES' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredDevices.map(device => (
                            <DeviceCard 
                                key={device.id} 
                                device={device} 
                                onConnect={() => setConnectModal({ isOpen: true, device })}
                                onManage={() => setDetailsModal({ isOpen: true, device })}
                            />
                        ))}
                        
                        {/* Add Device Placeholder */}
                        <button className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-emerald-400 hover:text-emerald-500 transition-all bg-slate-50/50 group h-full min-h-[200px]">
                            <div className="p-4 bg-white rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                <Plus size={24} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest">Enrolar Nuevo PC</span>
                        </button>
                    </div>
                )}

                {/* AUDIT TAB */}
                {activeTab === 'AUDIT' && (
                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha/Hora</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actor</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acción</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Objetivo</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalles</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {auditLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-4 text-xs font-mono text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                                            <td className="px-8 py-4 text-xs font-bold text-slate-700">{log.actor}</td>
                                            <td className="px-8 py-4">
                                                <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                                                    log.action === 'CONNECT' ? 'bg-emerald-50 text-emerald-600' :
                                                    log.action === 'KEY_ROTATE' ? 'bg-amber-50 text-amber-600' :
                                                    'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4 text-xs font-bold text-slate-700">{log.target}</td>
                                            <td className="px-8 py-4 text-xs text-slate-500">{log.details}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {/* POLICIES TAB */}
                {activeTab === 'POLICIES' && (
                    <PoliciesList policies={policies} />
                )}
            </div>

            {/* DETAILS MODAL */}
            {detailsModal.isOpen && detailsModal.device && (
                <DeviceDetailsModal 
                    device={detailsModal.device} 
                    existingGroups={uniqueGroups}
                    onClose={() => setDetailsModal({ isOpen: false })} 
                    onRotateKey={() => handleRotateKey(detailsModal.device!.id)}
                    onUpdate={handleUpdateDevice}
                />
            )}

            {/* CONNECT MODAL */}
            {connectModal.isOpen && connectModal.device && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={() => setConnectModal({ isOpen: false })} />
                    <div className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                <Monitor size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Conectar a {connectModal.device.name}</h3>
                                <p className="text-xs text-slate-500 font-medium">Configura los parámetros de la sesión remota.</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            {/* Control Toggle */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-xl text-slate-400 shadow-sm"><MousePointer2 size={18} /></div>
                                    <div>
                                        <p className="text-xs font-black text-slate-900 uppercase">Control Remoto</p>
                                        <p className="text-[10px] text-slate-400">Permitir input de mouse y teclado</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={sessionOptions.control} onChange={e => setSessionOptions({...sessionOptions, control: e.target.checked})} />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>

                            {/* Audio Selector */}
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-white rounded-xl text-slate-400 shadow-sm"><Volume2 size={18} /></div>
                                    <div>
                                        <p className="text-xs font-black text-slate-900 uppercase">Audio Remoto</p>
                                        <p className="text-[10px] text-slate-400">Selecciona la fuente de audio</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {['NONE', 'SYS', 'MIC', 'BOTH'].map(opt => (
                                        <button 
                                            key={opt}
                                            onClick={() => setSessionOptions({...sessionOptions, audio: opt as any})}
                                            className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all ${sessionOptions.audio === opt ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-400 hover:bg-slate-100'}`}
                                        >
                                            {opt === 'NONE' ? 'Off' : opt === 'SYS' ? 'Sistema' : opt === 'MIC' ? 'Mic' : 'Ambos'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Unattended Warning */}
                            {connectModal.device.unattended_enabled && (
                                <div className="flex items-start gap-3 p-4 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100">
                                    <Lock size={16} className="shrink-0 mt-0.5" />
                                    <p className="text-[10px] font-medium leading-relaxed">
                                        <strong>Acceso No Asistido Habilitado.</strong> No se requerirá confirmación del usuario remoto. La sesión será auditada y se mostrará una notificación en el equipo remoto.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setConnectModal({ isOpen: false })} className="flex-1 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Cancelar</button>
                            <button onClick={handleConnect} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">Iniciar Sesión</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ACTIVE SESSION OVERLAY */}
            {activeSession && (
                <RemoteSessionView 
                    device={activeSession.device} 
                    options={activeSession.options} 
                    onClose={handleDisconnect} 
                />
            )}

        </div>
    );
};

export default RemoteDesktopPage;

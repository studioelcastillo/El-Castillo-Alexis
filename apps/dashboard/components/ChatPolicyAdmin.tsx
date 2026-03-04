
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Info, Check, X, ShieldAlert, Megaphone, Zap, BookOpen, Settings, CheckCheck, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { MOCK_CHAT_ROLES } from '../constants';
import ChatTemplatesAdmin from './ChatTemplatesAdmin';
import ChatBroadcastAdmin from './ChatBroadcastAdmin';
import ChatAutomationsAdmin from './ChatAutomationsAdmin';
import ChatService from '../ChatService';
import { RoleChatPolicy } from '../types';

const ChatPolicyAdmin: React.FC = () => {
  const roles = MOCK_CHAT_ROLES;
  const [activeMainTab, setActiveMainTab] = useState<'politicas' | 'broadcast' | 'plantillas' | 'automatizaciones' | 'defaults'>('politicas');
  const [activePolicySubTab, setActivePolicySubTab] = useState<'matriz' | 'excepciones'>('matriz');
  const [selectedRoleForDefaults, setSelectedRoleForDefaults] = useState<number | null>(null);
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // Matrix State for Policies
  const [matrix, setMatrix] = useState<Record<number, Record<number, {initiate: boolean, receive: boolean}>>>(() => {
    // Default initial state (admin only)
    const initial: any = {};
    roles.forEach(r => {
        initial[r.id] = {};
        roles.forEach(r2 => {
            const isAdmin = r.id === 1;
            initial[r.id][r2.id] = { initiate: isAdmin, receive: isAdmin || r2.id === 1 };
        });
    });
    return initial;
  });

  // --- PERSISTENCE LOGIC: Fetch on mount ---
  useEffect(() => {
    const loadSavedPolicies = async () => {
      setIsLoadingData(true);
      try {
        const savedData = await ChatService.getPolicies();

        if (savedData && savedData.length > 0) {
          // Reconstruct matrix from flat array
          const newMatrix: any = {};
          roles.forEach(rFrom => {
            newMatrix[rFrom.id] = {};
            roles.forEach(rTo => {
              newMatrix[rFrom.id][rTo.id] = { initiate: false, receive: false };
            });
          });

          // Fill from saved data
          savedData.forEach((policy: any) => {
            if (newMatrix[policy.from_role_id]) {
              newMatrix[policy.from_role_id][policy.to_role_id] = {
                initiate: policy.can_initiate,
                receive: policy.can_receive
              };
            }
          });

          setMatrix(newMatrix);
        }
      } catch (error) {
        console.error("Error loading policies:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadSavedPolicies();
  }, []);

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const togglePolicy = (fromId: number, toId: number, type: 'initiate' | 'receive') => {
    setMatrix(prev => ({
        ...prev,
        [fromId]: {
            ...prev[fromId],
            [toId]: {
                ...prev[fromId][toId],
                [type]: !prev[fromId][toId][type]
            }
        }
    }));
  };

  const toggleAllInRow = (fromId: number, type: 'initiate' | 'receive') => {
    setMatrix(prev => {
      const newMatrix = { ...prev };
      const currentRow = { ...newMatrix[fromId] };
      const currentlyAllOn = roles.every(rTo => currentRow[rTo.id][type]);
      const newValue = !currentlyAllOn;
      roles.forEach(rTo => {
        currentRow[rTo.id] = { ...currentRow[rTo.id], [type]: newValue };
      });
      newMatrix[fromId] = currentRow;
      return newMatrix;
    });
  };

  const toggleGlobalType = (type: 'initiate' | 'receive') => {
    setMatrix(prev => {
      const newMatrix = { ...prev };
      let allOn = true;
      roles.forEach(rFrom => {
        roles.forEach(rTo => {
          if (!newMatrix[rFrom.id][rTo.id][type]) allOn = false;
        });
      });
      const newValue = !allOn;
      roles.forEach(rFrom => {
        const updatedRow = { ...newMatrix[rFrom.id] };
        roles.forEach(rTo => {
          updatedRow[rTo.id] = { ...updatedRow[rTo.id], [type]: newValue };
        });
        newMatrix[rFrom.id] = updatedRow;
      });
      return newMatrix;
    });
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setNotification(null);

    try {
      // Transform matrix to API format
      const policies: Partial<RoleChatPolicy>[] = [];
      roles.forEach(rFrom => {
        roles.forEach(rTo => {
          policies.push({
            from_role_id: rFrom.id,
            to_role_id: rTo.id,
            can_initiate: matrix[rFrom.id][rTo.id].initiate,
            can_receive: matrix[rFrom.id][rTo.id].receive
          });
        });
      });

       await ChatService.updatePolicies(policies);
      
      setNotification({
        type: 'success',
        message: 'Cambios guardados exitosamente'
      });
    } catch (error: any) {
      console.error("Error saving policies:", error);
      setNotification({
        type: 'error',
        message: `Error al guardar: ${error.message || 'La sesión expiró o el servidor no responde.'}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderPolicies = () => (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
        <div className="flex bg-slate-200/50 p-1 rounded-2xl w-fit">
            <button 
                onClick={() => setActivePolicySubTab('matriz')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activePolicySubTab === 'matriz' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
                Matriz de Roles
            </button>
            <button 
                onClick={() => setActivePolicySubTab('excepciones')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activePolicySubTab === 'excepciones' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
                Excepciones de Usuario
            </button>
        </div>

        {activePolicySubTab === 'matriz' ? (
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden relative">
                
                {/* LOADING OVERLAY FOR INITIAL FETCH */}
                {isLoadingData && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center">
                    <RefreshCw className="animate-spin text-amber-500 mb-4" size={32} />
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Sincronizando Políticas...</p>
                  </div>
                )}

                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-500 text-slate-900 rounded-xl"><Info size={20} /></div>
                        <div>
                            <h3 className="font-bold text-slate-900">Matriz de Comunicación</h3>
                            <p className="text-xs text-slate-500">Define permisos globales por perfil operativo.</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleSaveChanges}
                        disabled={isSaving || isLoadingData}
                        className={`px-6 py-3 bg-slate-900 text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-black transition-all flex items-center gap-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isSaving ? (
                          <div className="w-3 h-3 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"></div>
                        ) : null}
                        GUARDAR CAMBIOS GLOBALES
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 min-w-[200px]">
                                    <div className="flex flex-col gap-2">
                                        <span>DESDE (ROL) \ HACIA</span>
                                        <div className="flex gap-2 mt-2">
                                            <button 
                                                onClick={() => toggleGlobalType('initiate')}
                                                className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md border border-emerald-200 hover:bg-emerald-200 transition-all text-[8px] font-black"
                                            >
                                                <CheckCheck size={10} /> INICIAR TODO
                                            </button>
                                            <button 
                                                onClick={() => toggleGlobalType('receive')}
                                                className="flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md border border-indigo-200 hover:bg-indigo-200 transition-all text-[8px] font-black"
                                            >
                                                <CheckCheck size={10} /> RECIBIR TODO
                                            </button>
                                        </div>
                                    </div>
                                </th>
                                {roles.map(r => (
                                    <th key={r.id} className="px-6 py-6 text-center text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                        {r.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {roles.map(rFrom => (
                                <tr key={rFrom.id} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="px-6 py-5 border-r border-slate-100 bg-slate-50/20">
                                        <div className="flex flex-col gap-2">
                                            <span className="font-black text-slate-900 text-xs uppercase">{rFrom.name}</span>
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                <button 
                                                    onClick={() => toggleAllInRow(rFrom.id, 'initiate')}
                                                    className="px-2 py-1 bg-white border border-emerald-200 text-emerald-600 rounded-lg text-[8px] font-black hover:bg-emerald-50 transition-colors uppercase tracking-tighter"
                                                >
                                                    Iniciar Fila
                                                </button>
                                                <button 
                                                    onClick={() => toggleAllInRow(rFrom.id, 'receive')}
                                                    className="px-2 py-1 bg-white border border-indigo-200 text-indigo-600 rounded-lg text-[8px] font-black hover:bg-indigo-50 transition-colors uppercase tracking-tighter"
                                                >
                                                    Recibir Fila
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                    {roles.map(rTo => (
                                        <td key={rTo.id} className="px-6 py-5">
                                            <div className="flex flex-col gap-2 items-center">
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <div 
                                                        onClick={() => togglePolicy(rFrom.id, rTo.id, 'initiate')}
                                                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all border ${matrix[rFrom.id][rTo.id].initiate ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-50 border-slate-200 text-transparent'}`}
                                                    >
                                                        <Check size={12} strokeWidth={4} />
                                                    </div>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter group-hover:text-slate-900 transition-colors">Iniciar</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <div 
                                                        onClick={() => togglePolicy(rFrom.id, rTo.id, 'receive')}
                                                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all border ${matrix[rFrom.id][rTo.id].receive ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-slate-50 border-slate-200 text-transparent'}`}
                                                    >
                                                        <Check size={12} strokeWidth={4} />
                                                    </div>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter group-hover:text-slate-900 transition-colors">Recibir</span>
                                                </label>
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        ) : (
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl p-12 text-center text-slate-300">
                <ShieldAlert size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm font-bold">No hay excepciones registradas aún.</p>
            </div>
        )}
    </div>
  );

  const renderDefaults = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Seleccionar Rol</h3>
            <div className="space-y-2">
                {roles.map(role => (
                    <button 
                        key={role.id}
                        onClick={() => setSelectedRoleForDefaults(role.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                            selectedRoleForDefaults === role.id ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                    >
                        {role.name}
                    </button>
                ))}
            </div>
        </div>
        <div className="md:col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-xl p-8 flex flex-col justify-center items-center text-center">
            {selectedRoleForDefaults ? (
                <div className="space-y-6 w-full max-w-md">
                    <div className="w-16 h-16 bg-slate-900 text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                        <Settings size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                        Configuración por Defecto: {roles.find(r => r.id === selectedRoleForDefaults)?.name}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">
                        Estos ajustes se aplicarán automáticamente a todos los nuevos usuarios creados bajo este rol.
                    </p>
                    <button className="px-8 py-3 bg-white border-2 border-slate-100 rounded-xl text-xs font-black uppercase tracking-widest hover:border-amber-500 hover:text-amber-600 transition-all">
                        Editar Defaults
                    </button>
                </div>
            ) : (
                <div className="text-slate-300">
                    <Settings size={64} strokeWidth={1} className="mx-auto mb-4 opacity-20" />
                    <p className="text-sm font-bold uppercase tracking-widest">Selecciona un rol para configurar</p>
                </div>
            )}
        </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* NOTIFICATION TOAST */}
      {notification && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border animate-in slide-in-from-top-4 duration-300 min-w-[320px] ${
          notification.type === 'success' 
          ? 'bg-emerald-100 border-emerald-200 text-slate-900' 
          : 'bg-red-100 border-red-200 text-slate-900'
        }`}>
          <div className={`p-2 rounded-xl ${notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
             {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          </div>
          <p className="flex-1 text-sm font-black tracking-tight">{notification.message}</p>
          <button onClick={() => setNotification(null)} className="p-1 hover:bg-black/5 rounded-full transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Centralized Hub Header */}
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <ShieldCheck className="text-amber-500" size={32} />
             Centro de Administración de Chat
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Gestión integral de comunicación, reglas, masivos y automatizaciones.</p>
        </div>

        {/* Main Hub Navigation */}
        <div className="flex flex-wrap bg-white p-2 rounded-[24px] border border-slate-100 shadow-sm gap-2">
           {[
             { id: 'politicas', label: 'Políticas de Rol', icon: ShieldCheck },
             { id: 'defaults', label: 'Defaults por Rol', icon: Settings },
             { id: 'broadcast', label: 'Broadcast Masivos', icon: Megaphone },
             { id: 'plantillas', label: 'Plantillas de Mensaje', icon: BookOpen },
             { id: 'automatizaciones', label: 'Automatizaciones', icon: Zap }
           ].map(tab => (
             <button 
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeMainTab === tab.id 
                ? 'bg-slate-900 text-amber-400 shadow-xl shadow-slate-900/20' 
                : 'text-slate-500 hover:bg-slate-50'
              }`}
             >
               <tab.icon size={16} />
               {tab.label}
             </button>
           ))}
        </div>
      </div>

      {/* Render selected Administrative Module */}
      <div className="transition-all duration-300">
        {activeMainTab === 'politicas' && renderPolicies()}
        {activeMainTab === 'defaults' && renderDefaults()}
        {activeMainTab === 'broadcast' && <ChatBroadcastAdmin />}
        {activeMainTab === 'plantillas' && <ChatTemplatesAdmin />}
        {activeMainTab === 'automatizaciones' && <ChatAutomationsAdmin />}
      </div>

    </div>
  );
};

export default ChatPolicyAdmin;

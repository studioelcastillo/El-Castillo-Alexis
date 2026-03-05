
import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, UserPlus, Download, Trash2, ChevronDown,
  User as UserIcon, Monitor, Edit2, Eye, History, CheckCircle2,
  RefreshCw, AlertCircle, ChevronLeft, ChevronRight
} from 'lucide-react';
import UserProfile from './UserProfile';
import { User, UserProfileData, StudioApiResponse } from '../types';
import UserService from '../UserService';
import ProfileService from '../ProfileService';
import { studioService } from '../api';
import { getStoredUser } from '../session';

interface UsersPageProps {
  targetUserId?: number | null;
  onClearTarget?: () => void;
}

const UsersPage: React.FC<UsersPageProps> = ({ targetUserId, onClearTarget }) => {
  // --- State ---
  // Data
  const [users, setUsers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState<UserProfileData[]>([]);
  const [studiosList, setStudiosList] = useState<StudioApiResponse[]>([]);

  // Pagination & Loading
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10); // Length

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ACTIVOS'); // Default: mostrar activos (igual que Vue)
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [selectedStudioId, setSelectedStudioId] = useState<string>('');

  // UI
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Constants ---
  // Columnas requeridas por el backend para construir el query de búsqueda
  // (misma lógica que Users.vue: excluye action, profile.prof_name, std_name, user_age)
  const DATATABLE_COLUMNS = [
    'users.user_id',
    'users.user_active',
    'users.user_image',
    'users.user_identification',
    'ma.modacc_username',
    'users.user_name',
    'users.user_surname',
    'users.user_email',
    'users.created_at'
  ].join(',');

  // --- Helpers ---
  const getProfileBadge = (profileName?: string) => {
    const p = profileName?.toUpperCase() || '';
    if (p.includes('ADMIN')) return 'bg-slate-900 text-amber-400 border-slate-800';
    if (p.includes('MONITOR')) return 'bg-amber-50 text-amber-700 border-amber-100';
    if (p.includes('MODELO')) return 'bg-blue-50 text-blue-700 border-blue-100';
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  const isUserActive = (active: boolean | number) => {
      return active === true || active === 1;
  };

  // --- Fetching ---

  const loadFiltersData = async () => {
    try {
      const [profRes, stdRes] = await Promise.all([
        ProfileService.getProfiles(),
        studioService.getAll()
      ]);
      setProfiles(profRes.data.data || []);
      // El API devuelve { status: "success", data: [...] }
      setStudiosList(stdRes.data?.data || []);
    } catch (err) {
      console.error("Error loading filters", err);
      setStudiosList([]);
    }
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Mapeo de Tab a valor API
    // Vue legacy envía: true (activos) o false (inactivos)
    const activeusersParam = activeTab === 'ACTIVOS' ? 'true' : 'false';

    try {
      const response = await UserService.getUsersDatatable({
        start: (page - 1) * pageSize,
        length: pageSize,
        filter: searchTerm,
        columns: DATATABLE_COLUMNS,
        activeusers: activeusersParam,
        profiles: selectedProfileId || undefined,
        studios: selectedStudioId || undefined,
        dir: 'DESC',
        sortby: 'users.created_at'
      });

      setUsers(response.data.data);
      setTotalRecords(response.data.recordsFiltered);
    } catch (err: any) {
      console.error(err);
      setError("No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm, activeTab, selectedProfileId, selectedStudioId]);

  // Initial Load (Filters)
  useEffect(() => {
    loadFiltersData();
  }, []);

  // Data Load (Users)
  useEffect(() => {
    const timer = setTimeout(() => {
        fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  // Handle Deep Linking / Target ID
  useEffect(() => {
    if (targetUserId) {
      // Check if target user is current user as fallback
      const currentUser = getStoredUser();
      if (currentUser && currentUser.user_id === targetUserId) {
          setSelectedUser(currentUser);
          return;
      }
 else {
         // Fallback: try to find in currently loaded table
         const foundInState = users.find(u => u.user_id === targetUserId);
         if (foundInState) {
            setSelectedUser(foundInState);
         } else {
            // Last resort: search term
            setSearchTerm(targetUserId.toString());
         }
      }

      // Clear target to prevent re-opening if user goes back
      if (onClearTarget) onClearTarget();
    }
  }, [targetUserId, users, onClearTarget]);


  // --- Render ---

  if (isCreating) {
      return (
        <UserProfile
          user={{} as User}
          isCreating={true}
          onBack={() => setIsCreating(false)}
          onUpdate={(newUser) => {
            setIsCreating(false);
            setSelectedUser(newUser);
            fetchUsers();
          }}
        />
      );
  }

  if (selectedUser) {
      return (
        <UserProfile
          user={selectedUser}
          onBack={() => setSelectedUser(null)}
          onUpdate={(updatedUser) => {
            setSelectedUser(updatedUser);
            // Refrescar lista para reflejar cambios
            fetchUsers();
          }}
        />
      );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">

      {/* 1. Header & Primary Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Usuarios</h1>
            <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 text-[10px] font-bold uppercase tracking-widest">
              {totalRecords} Registros
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">Panel de administración de personal y perfiles.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => fetchUsers()}
            className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-xl transition-all"
            title="Recargar"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-[#0B1120] font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95 text-xs uppercase tracking-widest"
          >
            <UserPlus size={16} />
            NUEVO USUARIO
          </button>
          <button className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-900 rounded-xl transition-all hidden md:block" title="Exportar Reporte">
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* 2. Unified Toolbelt (Search + Filters) */}
      <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm space-y-2">
        <div className="flex flex-col xl:flex-row gap-2">
           <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o cédula..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>

           <div className="flex bg-slate-100 p-1 rounded-xl gap-1 overflow-x-auto no-scrollbar">
              {['ACTIVOS', 'INACTIVOS'].map(tab => (
                 <button
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest transition-all whitespace-nowrap ${
                     activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                   }`}
                 >
                   {tab}
                 </button>
              ))}
           </div>

           <div className="flex gap-2 overflow-x-auto no-scrollbar">
              <div className="relative min-w-[150px]">
                 <select
                   className="w-full appearance-none bg-white border border-slate-100 rounded-xl px-4 py-2.5 pr-8 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all outline-none"
                   value={selectedProfileId}
                   onChange={(e) => setSelectedProfileId(e.target.value)}
                 >
                    <option value="">Todos los Perfiles</option>
                    {profiles.map(p => <option key={p.prof_id} value={p.prof_id}>{p.prof_name}</option>)}
                 </select>
                 <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              <div className="relative min-w-[150px]">
                 <select
                   className="w-full appearance-none bg-white border border-slate-100 rounded-xl px-4 py-2.5 pr-8 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all outline-none"
                   value={selectedStudioId}
                   onChange={(e) => setSelectedStudioId(e.target.value)}
                 >
                    <option value="">Todos los Estudios</option>
                    {studiosList.map(s => <option key={s.std_id} value={s.std_id}>{s.std_name}</option>)}
                 </select>
                 <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
           </div>
        </div>
      </div>

      {/* 3. Users Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
         <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[800px]">
               <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                     <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario</th>
                     <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol / Perfil</th>
                     <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudio</th>
                     <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                     <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {loading ? (
                     [1,2,3,4,5].map(i => (
                        <tr key={i} className="animate-pulse">
                           <td colSpan={5} className="px-6 py-4">
                              <div className="h-12 bg-slate-50 rounded-xl"></div>
                           </td>
                        </tr>
                     ))
                  ) : users.length === 0 ? (
                     <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                           <div className="flex flex-col items-center gap-2">
                              <UserIcon size={32} className="opacity-20" />
                              <span className="text-sm font-bold">No se encontraron usuarios</span>
                           </div>
                        </td>
                     </tr>
                  ) : (
                     users.map(user => (
                        <tr key={user.user_id} className="hover:bg-slate-50/50 transition-all group">
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold overflow-hidden">
                                    {user.image ? <img src={user.image} alt={user.user_name} className="w-full h-full object-cover" /> : user.user_name[0]}
                                 </div>
                                 <div>
                                    <p className="text-sm font-bold text-slate-900">{user.user_name} {user.user_surname}</p>
                                    <p className="text-xs text-slate-500">{user.user_email}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getProfileBadge(user.profile?.prof_name)}`}>
                                 {user.profile?.prof_name || 'Sin Perfil'}
                              </span>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                                 <Monitor size={14} className="text-slate-400" />
                                 {user.studios || '---'}
                              </div>
                           </td>
                           <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isUserActive(user.user_active) ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'}`}>
                                 {isUserActive(user.user_active) ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                 {isUserActive(user.user_active) ? 'Activo' : 'Inactivo'}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                 <button onClick={() => setSelectedUser(user)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all" title="Ver Perfil">
                                    <Eye size={16} />
                                 </button>
                                 <button className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Editar">
                                    <Edit2 size={16} />
                                 </button>
                              </div>
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>

         {/* Pagination */}
         {totalRecords > pageSize && (
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
               <span className="text-xs font-bold text-slate-500">Página {page} de {Math.ceil(totalRecords / pageSize)}</span>
               <div className="flex gap-2">
                  <button
                     onClick={() => setPage(p => Math.max(1, p - 1))}
                     disabled={page === 1}
                     className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 disabled:opacity-50"
                  >
                     <ChevronLeft size={16} />
                  </button>
                  <button
                     onClick={() => setPage(p => Math.min(Math.ceil(totalRecords / pageSize), p + 1))}
                     disabled={page >= Math.ceil(totalRecords / pageSize)}
                     className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 disabled:opacity-50"
                  >
                     <ChevronRight size={16} />
                  </button>
               </div>
            </div>
         )}
      </div>

    </div>
  );
};

export default UsersPage;

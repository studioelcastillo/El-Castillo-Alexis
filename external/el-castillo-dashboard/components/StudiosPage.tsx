
import React, { useState, useEffect } from 'react';
import { 
  Monitor, Plus, Search, ChevronRight, MapPin, 
  Users, ArrowLeft, Edit2, Upload, HelpCircle,
  Building2, CreditCard, Clock, DollarSign, Calendar,
  Maximize2, Globe, Shield, Wallet, Settings, Briefcase,
  CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import { studioService } from '../api';
import { Studio } from '../types';

// --- Sub-components for Detail View ---

const SectionHeader: React.FC<{ title: string; icon: any; className?: string }> = ({ title, icon: Icon, className }) => (
    <div className={`flex items-center gap-2 mb-4 pb-2 border-b border-slate-50 ${className}`}>
        <Icon size={16} className="text-amber-500" />
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{title}</h3>
    </div>
);

const InfoField: React.FC<{ label: string; value: string | React.ReactNode; icon?: any }> = ({ label, value, icon: Icon }) => (
    <div className="mb-3 last:mb-0">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mb-1">
            {Icon && <Icon size={10} />} {label}
        </label>
        <div className="text-sm font-bold text-slate-700 break-words">{value || <span className="text-slate-300 italic">No registrado</span>}</div>
    </div>
);

const MoneyField: React.FC<{ label: string; value: string; currency?: string }> = ({ label, value, currency = 'USD' }) => (
    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center group hover:border-amber-200 transition-colors">
        <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
        <span className="text-sm font-mono font-bold text-slate-800 group-hover:text-amber-600">
             {currency === 'EUR' ? '€' : '$'} {value}
        </span>
    </div>
);

const SwitchRow: React.FC<{ label: string; active: boolean }> = ({ label, active }) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <div className={`w-10 h-5 rounded-full relative transition-colors ${active ? 'bg-emerald-500' : 'bg-slate-200'}`}>
            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${active ? 'left-6' : 'left-1'}`}></div>
        </div>
    </div>
);

const DetailTableSection: React.FC<{ title: string; icon: any }> = ({ title, icon: Icon }) => (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <Icon size={18} className="text-slate-400" />
                {title}
            </h3>
            <button className="text-slate-400 hover:text-amber-500 transition-colors">
                 <Maximize2 size={16} />
            </button>
        </div>
        <div className="p-6">
            <div className="flex flex-col items-center justify-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50/30">
                <div className="p-3 bg-slate-50 rounded-full mb-2">
                    <Icon size={20} className="opacity-50" />
                </div>
                <span>No hay registros de {title.toLowerCase()}</span>
            </div>
        </div>
    </div>
);

// --- Main Page Component ---

const StudiosPage: React.FC = () => {
    const [studios, setStudios] = useState<Studio[]>([]);
    const [selectedStudio, setSelectedStudio] = useState<Studio | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStudios = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await studioService.getAll();
            const mappedStudios: Studio[] = response.data.data.map(apiStudio => ({
                id: String(apiStudio.std_id),
                name: apiStudio.std_name,
                nit: apiStudio.std_nit,
                city: 'N/A', // Default value
                address: apiStudio.std_address || '',
                activeModels: 0, // Default value
                rooms: 0, // Default value
                isActive: Boolean(apiStudio.std_active),
                owner: 'N/A' // Default value
            }));
            setStudios(mappedStudios);
        } catch (err: any) {
            setError(err.message || 'Error al conectar con el servidor');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStudios();
    }, []);

    const filteredStudios = studios.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // LIST VIEW
    if (!selectedStudio) {
        return (
            <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Estudios</h1>
                        <p className="text-sm text-slate-500 mt-1 font-medium">Gestión de sedes y configuraciones operativas.</p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={fetchStudios}
                            className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-xl transition-all"
                        >
                            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                        <button className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-[#0B1120] font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95 text-xs uppercase tracking-widest">
                            <Plus size={16} /> Nuevo Estudio
                        </button>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-100 p-6 rounded-3xl flex items-center gap-4 text-red-600">
                        <AlertCircle size={24} />
                        <div className="flex-1">
                            <p className="font-bold">Error de conexión</p>
                            <p className="text-sm opacity-80">{error}</p>
                        </div>
                        <button 
                            onClick={fetchStudios}
                            className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-all"
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                {/* Search Bar */}
                <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar estudio por nombre..." 
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 transition-all font-medium"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* List Table */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden min-h-[400px]">
                    <div className="overflow-x-auto w-full">
                        {isLoading ? (
                            <div className="p-12 space-y-4">
                                {[1,2,3,4,5].map(i => (
                                    <div key={i} className="flex gap-4 animate-pulse">
                                        <div className="w-12 h-12 bg-slate-100 rounded-xl"></div>
                                        <div className="flex-1 space-y-2 py-1">
                                            <div className="h-4 bg-slate-100 rounded w-1/4"></div>
                                            <div className="h-3 bg-slate-50 rounded w-1/6"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredStudios.length > 0 ? (
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre Estudio</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">NIT</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ubicación</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Capacidad</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredStudios.map(studio => (
                                        <tr key={studio.id} onClick={() => setSelectedStudio(studio)} className="hover:bg-amber-50/10 cursor-pointer group transition-all">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold border border-slate-200 group-hover:bg-white group-hover:border-amber-200 group-hover:text-amber-600 transition-all">
                                                        <Monitor size={18} />
                                                    </div>
                                                    <span className="font-bold text-slate-800 text-sm group-hover:text-amber-600 transition-colors">{studio.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-sm font-mono text-slate-600">{studio.nit}</td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                                                    <MapPin size={14} className="text-slate-400" />
                                                    {studio.city}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600">
                                                    <Users size={12} /> {studio.activeModels}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${studio.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                                    {studio.isActive ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button className="p-2 text-slate-400 hover:text-slate-900 bg-transparent hover:bg-slate-100 rounded-lg transition-all">
                                                    <ChevronRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-sm">
                                <Monitor size={48} className="mb-4 opacity-20" />
                                <p>No se encontraron estudios registrados.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // DETAIL VIEW
    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in slide-in-from-right-8 duration-300">
            
            {/* Header / Nav */}
            <div className="flex items-center justify-between">
                <button 
                    onClick={() => setSelectedStudio(null)}
                    className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
                >
                    <div className="p-2 bg-white border border-slate-200 rounded-xl group-hover:border-slate-300 transition-all shadow-sm">
                         <ArrowLeft size={16} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">Volver al listado</span>
                </button>
                <div className="flex gap-2">
                     <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-widest hover:border-amber-500 hover:text-amber-600 transition-all">
                        <Edit2 size={16} className="inline mr-2" /> Editar
                     </button>
                </div>
            </div>

            {/* 1. HERO IDENTITY CARD */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full blur-3xl opacity-50 -mr-16 -mt-16 pointer-events-none"></div>
                
                {/* Logo Section */}
                <div className="relative group shrink-0">
                     <div className="w-32 h-32 rounded-full bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                         <div className="w-full h-full bg-slate-900 flex items-center justify-center text-amber-500">
                             <span className="text-4xl font-black">{selectedStudio.name.substring(0,2)}</span>
                         </div>
                     </div>
                     <button className="absolute bottom-0 right-0 p-2 bg-slate-900 text-white rounded-full border-4 border-white hover:bg-amber-500 transition-colors shadow-lg">
                        <Upload size={14} />
                     </button>
                </div>

                {/* Core Info */}
                <div className="flex-1 text-center md:text-left space-y-4">
                    <div>
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-3 mb-2">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">{selectedStudio.name}</h2>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${selectedStudio.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                {selectedStudio.isActive ? 'Operativo' : 'Inactivo'}
                            </span>
                        </div>
                        <p className="text-slate-500 font-medium text-sm flex items-center justify-center md:justify-start gap-2">
                            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">NIT: {selectedStudio.nit}-8</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span>{selectedStudio.owner}</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-2">
                         <div className="flex items-center gap-2">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                <Users size={18} />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Modelos</p>
                                <p className="font-bold text-slate-800">{selectedStudio.activeModels} Activas</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                                <Building2 size={18} />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instalaciones</p>
                                <p className="font-bold text-slate-800">{selectedStudio.rooms} Habitaciones</p>
                            </div>
                         </div>
                    </div>
                </div>
            </div>

            {/* 2. THREE-COLUMN INFO GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Col 1: General Info & Location */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <SectionHeader title="Información General" icon={Globe} />
                    <div className="space-y-4">
                        <InfoField label="Razón Social" value={selectedStudio.owner} icon={Briefcase} />
                        <InfoField label="Representante Legal" value={selectedStudio.name} icon={Shield} />
                        <div className="grid grid-cols-2 gap-4">
                            <InfoField label="Ciudad" value={selectedStudio.city} icon={MapPin} />
                            <InfoField label="País" value="COLOMBIA" />
                        </div>
                        <InfoField label="Dirección Física" value={selectedStudio.address} />
                        <InfoField label="Teléfono Contacto" value="3150310149" />
                    </div>
                </div>

                {/* Col 2: Financial Config */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <SectionHeader title="Configuración Financiera" icon={Wallet} />
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 p-3 rounded-xl text-center">
                                <span className="block text-[10px] font-black text-slate-400 uppercase mb-1">Ingreso</span>
                                <span className="text-xl font-black text-slate-900">90%</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl text-center">
                                <span className="block text-[10px] font-black text-slate-400 uppercase mb-1">Nómina</span>
                                <span className="text-xs font-bold text-slate-700 uppercase">Mensual</span>
                            </div>
                        </div>
                        
                        <div className="pt-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Descuentos Aplicables</p>
                            <div className="grid grid-cols-2 gap-2">
                                <MoneyField label="Estudio" value="60" currency="EUR" />
                                <MoneyField label="Estudio" value="60" currency="USD" />
                                <MoneyField label="Modelo" value="160" currency="EUR" />
                                <MoneyField label="Modelo" value="160" currency="USD" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Col 3: Operational Settings */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                     <SectionHeader title="Ajustes Operativos" icon={Settings} />
                     <div className="space-y-1">
                        <SwitchRow label="¿Paga desde Master?" active={true} />
                        <SwitchRow label="Aplica Retención Fuente" active={true} />
                        <SwitchRow label="Generar cuenta bancaria auto." active={false} />
                        <SwitchRow label="Notificaciones de pago" active={true} />
                        <SwitchRow label="Acceso al portal de modelos" active={true} />
                     </div>
                     
                     <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3 items-start">
                        <AlertCircle size={16} className="text-amber-600 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-amber-800">Nota del Sistema</p>
                            <p className="text-[10px] text-amber-700 leading-relaxed mt-1">
                                Los cambios en los intervalos de nómina afectarán el próximo ciclo de facturación.
                            </p>
                        </div>
                     </div>
                </div>
            </div>

            {/* 3. DETAILS TABS / SECTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailTableSection title="Cuartos / Habitaciones" icon={Building2} />
                <DetailTableSection title="Cuentas Bancarias Asociadas" icon={CreditCard} />
                <DetailTableSection title="Configuración de Turnos" icon={Clock} />
                <DetailTableSection title="Historial de Pagos" icon={DollarSign} />
            </div>

        </div>
    );
};

export default StudiosPage;

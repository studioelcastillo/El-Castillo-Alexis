
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Camera, Calendar as CalIcon, Plus, Filter, Clock, MapPin, 
  User, CheckCircle2, XCircle, AlertTriangle, UploadCloud, 
  Download, Star, BarChart3, Image as ImageIcon, Video, 
  MoreVertical, RefreshCw, X, Save, Search, ChevronRight,
  ChevronLeft, Users, Settings2, ShieldCheck, Zap
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import PhotoService from '../PhotoService';
import { PhotoRequest, PhotoRequestStatus, PhotoAsset, PhotoCalendarEvent, PhotoDashboardKPI, PhotoRating } from '../types';
import Avatar from './Avatar';

// Mock User Context (In real app, comes from Auth)
const CURRENT_USER = {
    id: 3990, 
    name: 'Jennifer Zuluaga',
    role: 'MODELO' 
};

const TEAM_MOCK = [
    { id: 101, name: 'Carlos Foto', role: 'FOTOGRAFO', active: true },
    { id: 102, name: 'Laura Video', role: 'FOTOGRAFO', active: true },
    { id: 3988, name: 'Sofia MUA', role: 'MAQUILLADORA', active: true },
];

// --- SUB-COMPONENTS ---

const StatusBadge: React.FC<{ status: PhotoRequestStatus }> = ({ status }) => {
    const styles = {
        'SENT': 'bg-slate-100 text-slate-500',
        'PENDING_CONFIRMATION': 'bg-blue-50 text-blue-600 animate-pulse',
        'ACCEPTED': 'bg-indigo-50 text-indigo-600',
        'CONFIRMED': 'bg-emerald-50 text-emerald-600 border-emerald-200',
        'IN_PROGRESS': 'bg-amber-50 text-amber-600 border-amber-200',
        'DELIVERED': 'bg-purple-50 text-purple-600 border-purple-200',
        'RATED': 'bg-pink-50 text-pink-600',
        'CLOSED': 'bg-slate-200 text-slate-600',
        'RESCHEDULE_PROPOSED': 'bg-orange-50 text-orange-600',
        'REJECTED': 'bg-red-50 text-red-600',
        'CANCELLED': 'bg-slate-100 text-slate-400 line-through',
    };
    return (
        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-transparent ${styles[status] || styles['SENT']}`}>
            {status.replace('_', ' ')}
        </span>
    );
};

// --- NEW ENHANCED CALENDAR ---

const PhotoCalendar: React.FC<{ events: PhotoCalendarEvent[] }> = ({ events }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

    const dayEvents = useMemo(() => {
        return events.filter(e => e.start.startsWith(selectedDate));
    }, [events, selectedDate]);

    const getEventStyle = (status?: string, type?: string) => {
        if (type === 'BLOCK') return 'bg-slate-100 border-slate-200 text-slate-500';
        switch (status) {
            case 'CONFIRMED': return 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm';
            case 'IN_PROGRESS': return 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm';
            case 'SENT': return 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm';
            default: return 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm';
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
            {/* Left Column: Date Picker & Resources Config */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <CalIcon size={14} /> Seleccionar Fecha
                    </h4>
                    <input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-black outline-none focus:ring-4 focus:ring-amber-500/5 transition-all mb-4"
                    />
                    
                    <div className="grid grid-cols-7 gap-1">
                        {/* Simplified mini-calendar view could go here */}
                    </div>
                </div>

                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Users size={14} /> Equipo Operativo
                        </h4>
                        <button className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-all"><Settings2 size={16} /></button>
                    </div>
                    <div className="space-y-4">
                        {TEAM_MOCK.map(member => (
                            <div key={member.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <Avatar name={member.name} size="xs" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-700 group-hover:text-slate-900">{member.name}</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase">{member.role}</p>
                                    </div>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${member.active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-300'}`}></div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-6 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all">
                        Configurar Horarios
                    </button>
                </div>
            </div>

            {/* Right Column: Hourly Timeline */}
            <div className="lg:col-span-3 bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col h-[750px]">
                <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-900 text-white rounded-2xl shadow-lg"><Clock size={24} /></div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Agenda Diaria</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => {
                            const d = new Date(selectedDate);
                            d.setDate(d.getDate() - 1);
                            setSelectedDate(d.toISOString().split('T')[0]);
                        }} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 shadow-sm transition-all"><ChevronLeft size={20} /></button>
                        <button onClick={() => {
                            const d = new Date(selectedDate);
                            d.setDate(d.getDate() + 1);
                            setSelectedDate(d.toISOString().split('T')[0]);
                        }} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 shadow-sm transition-all"><ChevronRight size={20} /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar relative p-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-95">
                    <div className="relative min-h-full">
                        {/* Hour Rows */}
                        {hours.map(hour => (
                            <div key={hour} className="h-20 border-b border-slate-100 flex items-start gap-4 group">
                                <span className="text-[10px] font-black text-slate-400 w-12 text-right pt-1 group-hover:text-amber-500 transition-colors">
                                    {hour.toString().padStart(2, '0')}:00
                                </span>
                                <div className="flex-1 h-full relative group-hover:bg-slate-50/50 transition-colors cursor-pointer rounded-lg">
                                    {/* Slot action indicator */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Plus size={20} className="text-slate-300" />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Event Blocks (Absolute Positioned) */}
                        {dayEvents.map(event => {
                            const startTime = new Date(event.start);
                            const startHour = startTime.getHours() + startTime.getMinutes() / 60;
                            const duration = (new Date(event.end).getTime() - startTime.getTime()) / (1000 * 60 * 60);
                            
                            const top = (startHour - 8) * 80; // 80px per hour
                            const height = duration * 80;

                            return (
                                <div 
                                    key={event.id}
                                    className={`absolute left-16 right-4 rounded-2xl border-l-4 p-4 transition-all hover:scale-[1.02] cursor-pointer z-10 animate-in zoom-in-95 duration-500 ${getEventStyle(event.status, event.type)}`}
                                    style={{ top: `${top}px`, height: `${height}px` }}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="overflow-hidden">
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">
                                                {startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(event.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </p>
                                            <h5 className="font-bold text-sm truncate leading-tight">{event.title}</h5>
                                        </div>
                                        {event.status === 'CONFIRMED' && <ShieldCheck size={16} className="shrink-0" />}
                                    </div>
                                    {height > 60 && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <Avatar name={event.title} size="xs" />
                                            <span className="text-[9px] font-black uppercase tracking-tighter opacity-70">Shoot Confirmado</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MODALS ---

const RequestForm: React.FC<{ onClose: () => void, onSubmit: (data: any) => void }> = ({ onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        type: 'FOTO', objective: 'CONTENIDO', location: 'Sede Principal',
        proposed_date: '', proposed_time: '', duration_minutes: 60,
        style_references: '', requires_makeup: false, makeup_pref: ''
    });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
            <div className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="font-black text-xl text-slate-900 tracking-tight">Nueva Solicitud</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Crea un nuevo shoot fotográfico</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400"><X size={20} /></button>
                </div>
                <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Tipo de Servicio</label>
                            <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-amber-500/5 transition-all" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                <option value="FOTO">Fotografía</option>
                                <option value="VIDEO">Video</option>
                                <option value="FOTO_VIDEO">Foto + Video</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Objetivo</label>
                            <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-amber-500/5 transition-all" value={formData.objective} onChange={e => setFormData({...formData, objective: e.target.value})}>
                                <option value="CATALOGO">Catálogo</option>
                                <option value="CONTENIDO">Contenido Diario</option>
                                <option value="REDES">Redes Sociales</option>
                                <option value="PERFIL">Perfil Web</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Fecha y Hora Preferida</label>
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <input type="date" className="w-full p-4 bg-white rounded-2xl text-sm font-bold border border-slate-100 outline-none focus:border-amber-400 transition-all" value={formData.proposed_date} onChange={e => setFormData({...formData, proposed_date: e.target.value})} />
                            </div>
                            <div className="w-32">
                                <input type="time" className="w-full p-4 bg-white rounded-2xl text-sm font-bold border border-slate-100 outline-none focus:border-amber-400 transition-all" value={formData.proposed_time} onChange={e => setFormData({...formData, proposed_time: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Referencias / Estilo</label>
                        <textarea className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[24px] text-sm font-medium h-32 resize-none outline-none focus:ring-4 focus:ring-amber-500/5 transition-all" placeholder="Pega links de Pinterest, IG o describe el mood..." value={formData.style_references} onChange={e => setFormData({...formData, style_references: e.target.value})} />
                    </div>

                    <div className="p-6 bg-indigo-50/50 rounded-[32px] border border-indigo-100 flex flex-col gap-4">
                        <label className="flex items-center justify-between cursor-pointer group">
                            <span className="text-xs font-black text-indigo-900 uppercase tracking-widest">¿Requiere Maquilladora?</span>
                            <div className={`w-12 h-6 rounded-full relative transition-all ${formData.requires_makeup ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${formData.requires_makeup ? 'left-7' : 'left-1'}`}></div>
                                <input type="checkbox" className="hidden" checked={formData.requires_makeup} onChange={e => setFormData({...formData, requires_makeup: e.target.checked})} />
                            </div>
                        </label>
                        {formData.requires_makeup && (
                            <div className="animate-in slide-in-from-top-2 duration-300">
                                <input type="text" placeholder="Preferencia de maquilladora (Opcional)" className="w-full p-3 bg-white rounded-xl text-xs font-bold border border-indigo-100 outline-none focus:ring-2 focus:ring-indigo-500/10" value={formData.makeup_pref} onChange={e => setFormData({...formData, makeup_pref: e.target.value})} />
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-8 border-t border-slate-100 bg-slate-50 flex gap-4">
                    <button onClick={onClose} className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Descartar</button>
                    <button onClick={() => onSubmit(formData)} className="flex-[2] py-4 bg-slate-900 text-amber-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                        <Zap size={16} /> Enviar Solicitud
                    </button>
                </div>
            </div>
        </div>
    );
};

const RatingsModal: React.FC<{ isOpen: boolean, onClose: () => void, request: PhotoRequest, onSubmit: (r: any) => void }> = ({ isOpen, onClose, request, onSubmit }) => {
    if (!isOpen) return null;
    const [score, setScore] = useState(5);
    const [comment, setComment] = useState('');

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
            <div className="relative bg-white w-full max-w-sm rounded-[40px] shadow-2xl p-8 animate-in zoom-in-95 duration-300 flex flex-col items-center">
                <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-[28px] flex items-center justify-center mb-6 shadow-inner">
                    <Star size={40} fill="currentColor" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Calificar Servicio</h3>
                <p className="text-center text-xs text-slate-500 mb-8 font-medium leading-relaxed">Tu opinión nos ayuda a mantener los estándares de calidad del Castillo.</p>
                
                <div className="flex justify-center gap-3 mb-8">
                    {[1,2,3,4,5].map(s => (
                        <button key={s} onClick={() => setScore(s)} className={`p-2 rounded-2xl transition-all hover:scale-110 active:scale-90 ${score >= s ? 'text-amber-400' : 'text-slate-100'}`}>
                            <Star size={36} fill="currentColor" strokeWidth={1} />
                        </button>
                    ))}
                </div>
                
                <textarea className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium mb-6 resize-none outline-none focus:ring-4 focus:ring-amber-500/5 transition-all" rows={4} placeholder="Cuéntanos más sobre tu experiencia..." value={comment} onChange={e => setComment(e.target.value)} />
                
                <button onClick={() => onSubmit({ score, comment })} className="w-full py-4 bg-slate-900 text-amber-400 font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black active:scale-95 transition-all">Enviar Calificación</button>
            </div>
        </div>
    );
};

// --- MAIN PAGE ---

const PhotographyPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'BANDEJA' | 'CALENDARIO' | 'DASHBOARD'>('BANDEJA');
    const [requests, setRequests] = useState<PhotoRequest[]>([]);
    const [events, setEvents] = useState<PhotoCalendarEvent[]>([]);
    const [stats, setStats] = useState<PhotoDashboardKPI | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<PhotoRequest | null>(null);
    const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
    const [isRatingOpen, setIsRatingOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Initial Load
    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = async () => {
        setLoading(true);
        const [reqs, evs, kpis] = await Promise.all([
            PhotoService.getRequests({ studioId: '1', role: CURRENT_USER.role, userId: CURRENT_USER.id }),
            PhotoService.getCalendarEvents(),
            PhotoService.getDashboardStats()
        ]);
        setRequests(reqs);
        setEvents(evs);
        setStats(kpis);
        setLoading(false);
    };

    const handleCreateRequest = async (data: any) => {
        await PhotoService.createRequest({
            ...data,
            requester_id: CURRENT_USER.id,
            requester_name: CURRENT_USER.name
        });
        setIsRequestFormOpen(false);
        refreshData();
    };

    const handleStatusChange = async (id: string, status: PhotoRequestStatus) => {
        await PhotoService.updateStatus(id, status, CURRENT_USER.name);
        refreshData();
        if(selectedRequest && selectedRequest.id === id) setSelectedRequest(null);
    };

    const handleUpload = async (file: File) => {
        if (!selectedRequest) return;
        await PhotoService.uploadAsset(selectedRequest.id, file);
        refreshData();
        alert('Archivo subido a Drive (Simulado)');
    };

    const handleRating = async (ratingData: any) => {
        if (!selectedRequest) return;
        await PhotoService.submitRating({
            request_id: selectedRequest.id,
            from_user_id: CURRENT_USER.id,
            to_user_id: 0, 
            role_target: 'FOTOGRAFO', 
            score: ratingData.score,
            aspects: {},
            comment: ratingData.comment
        });
        setIsRatingOpen(false);
        refreshData();
    };

    // --- RENDERERS ---

    const renderInbox = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {requests.map(req => (
                <div key={req.id} onClick={() => setSelectedRequest(req)} className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all cursor-pointer group relative overflow-hidden flex flex-col h-full border-b-4 border-b-transparent hover:border-b-amber-400">
                    {req.priority === 'HIGH' && <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-bl-xl shadow-sm"></div>}
                    
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            <Avatar name={req.requester_name} size="md" />
                            <div>
                                <h4 className="font-black text-slate-900 text-base tracking-tight">{req.requester_name}</h4>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5 mt-1">
                                    <MapPin size={10} className="text-amber-500" /> {req.location}
                                </p>
                            </div>
                        </div>
                        <StatusBadge status={req.status} />
                    </div>

                    <div className="flex gap-3 mb-6 flex-1">
                        <div className="p-4 bg-slate-50 rounded-2xl flex-1 text-center border border-slate-100 group-hover:bg-white transition-colors">
                            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fecha Shoout</span>
                            <span className="text-xs font-black text-slate-700 flex items-center justify-center gap-2">
                                <CalIcon size={14} className="text-amber-500" />
                                {req.confirmed_date ? req.confirmed_date.split('T')[0] : req.proposed_date}
                            </span>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl flex-1 text-center border border-slate-100 group-hover:bg-white transition-colors">
                            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Categoría</span>
                            <span className="text-xs font-black text-slate-700 flex items-center justify-center gap-2">
                                {req.type === 'VIDEO' ? <Video size={14} className="text-indigo-500" /> : <ImageIcon size={14} className="text-indigo-500" />} {req.type}
                            </span>
                        </div>
                    </div>

                    {req.status === 'DELIVERED' && (
                        <div className="mb-6 bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 animate-pulse">
                            <div className="p-2 bg-emerald-500 text-white rounded-lg"><CheckCircle2 size={16} /></div>
                            <div>
                                <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none">Entregables Listos</p>
                                <p className="text-[9px] text-emerald-600 font-bold mt-1">Material disponible para descarga</p>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-50 opacity-60 group-hover:opacity-100 transition-all">
                        <div className="flex -space-x-2">
                             {/* Small indicators for MUA / Photo if confirmed */}
                             {req.makeup_artist_name && <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center" title="MUA Asignada"><Users size={10} className="text-slate-400"/></div>}
                        </div>
                        <button className="text-[10px] font-black text-slate-500 hover:text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                            Gestionar Solicitud <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderDetailModal = () => {
        if (!selectedRequest) return null;
        const isPhotographer = CURRENT_USER.role !== 'MODELO';
        const canRate = selectedRequest.status === 'DELIVERED';

        return (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedRequest(null)} />
                <div className="relative bg-white w-full max-w-5xl h-full md:h-[85vh] rounded-[40px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-300">
                    
                    {/* Left: Info */}
                    <div className="w-full md:w-1/3 bg-slate-50 p-10 border-r border-slate-100 overflow-y-auto custom-scrollbar flex flex-col">
                        <div className="mb-10">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="px-3 py-1 bg-slate-900 text-amber-400 rounded-lg text-[9px] font-black uppercase tracking-[0.2em]">Ficha Operativa</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">#{selectedRequest.id}</span>
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">Detalles del Shoot</h2>
                        </div>
                        
                        <div className="space-y-8 flex-1">
                            <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Modelo / Solicitante</p>
                                <div className="flex items-center gap-4">
                                    <Avatar name={selectedRequest.requester_name} size="md" />
                                    <div>
                                        <span className="font-black text-slate-800 text-base block">{selectedRequest.requester_name}</span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase">Sede Bogotá</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Estado de Producción</p>
                                <div className="flex">
                                    <StatusBadge status={selectedRequest.status} />
                                </div>
                            </div>

                            <div className="bg-amber-50/50 p-6 rounded-[32px] border border-amber-100/50">
                                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <ImageIcon size={12} /> Concepto Creativo
                                </p>
                                <p className="text-xs text-slate-700 font-medium leading-relaxed italic">
                                    "{selectedRequest.style_references || 'Sin referencias especificadas'}"
                                </p>
                            </div>
                            
                            {/* Actions Group */}
                            <div className="pt-4 space-y-3 mt-auto">
                                {isPhotographer && selectedRequest.status === 'SENT' && (
                                    <>
                                        <button onClick={() => handleStatusChange(selectedRequest.id, 'ACCEPTED')} className="w-full py-4 bg-slate-900 text-amber-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">Aceptar Solicitud</button>
                                        <button onClick={() => handleStatusChange(selectedRequest.id, 'RESCHEDULE_PROPOSED')} className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Sugerir Reprogramación</button>
                                    </>
                                )}
                                {isPhotographer && selectedRequest.status === 'ACCEPTED' && (
                                    <button onClick={() => handleStatusChange(selectedRequest.id, 'CONFIRMED')} className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">Confirmar Bloque de Hora</button>
                                )}
                                {isPhotographer && selectedRequest.status === 'IN_PROGRESS' && (
                                    <button onClick={() => handleStatusChange(selectedRequest.id, 'DELIVERED')} className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">Finalizar & Entregar</button>
                                )}
                                {canRate && (
                                    <button onClick={() => setIsRatingOpen(true)} className="w-full py-4 bg-amber-400 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                                        <Star size={16} fill="currentColor" /> Calificar Experiencia
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Assets & Delivery */}
                    <div className="flex-1 p-10 flex flex-col bg-white">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Repositorio de Entrega</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                                    <ShieldCheck size={12} className="text-emerald-500" /> Sincronizado con Google Drive
                                </p>
                            </div>
                            <button onClick={() => setSelectedRequest(null)} className="p-3 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-full transition-all text-slate-400 shadow-sm active:scale-90"><X size={24} /></button>
                        </div>

                        <div className="flex-1 bg-slate-50/50 rounded-[40px] border border-slate-200/60 p-8 overflow-y-auto custom-scrollbar shadow-inner">
                            {selectedRequest.assets.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                    <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                                        <UploadCloud size={32} className="opacity-20" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Esperando material...</p>
                                    <p className="text-xs font-medium text-slate-400 mt-2 max-w-[200px] text-center leading-relaxed">Los archivos aparecerán aquí una vez que el fotógrafo los suba.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                    {selectedRequest.assets.map(asset => (
                                        <div key={asset.id} className="group relative aspect-square bg-slate-200 rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                            <img src={asset.preview_url} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                <a href={asset.drive_url} target="_blank" rel="noreferrer" className="p-3 bg-white rounded-2xl text-slate-900 hover:scale-110 active:scale-95 transition-all shadow-xl">
                                                    <Download size={20} />
                                                </a>
                                                <button className="p-3 bg-white/10 backdrop-blur rounded-2xl text-white hover:bg-white hover:text-slate-900 transition-all shadow-xl">
                                                    <Maximize2 size={20} />
                                                </button>
                                            </div>
                                            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center pointer-events-none">
                                                <div className="px-2 py-0.5 bg-black/60 backdrop-blur text-white text-[8px] font-black uppercase rounded-lg">
                                                    {asset.type}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Upload Zone (Only Photographer) */}
                        {isPhotographer && (
                            <div className="mt-8 pt-8 border-t border-slate-100">
                                <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-[32px] cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group shadow-sm bg-slate-50/20">
                                    <div className="text-center">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                                            <UploadCloud size={24} className="text-slate-300 group-hover:text-indigo-500" />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Subir Material al Castillo Drive</span>
                                    </div>
                                    <input type="file" className="hidden" multiple onChange={(e) => { if(e.target.files?.[0]) handleUpload(e.target.files[0]) }} />
                                </label>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderDashboard = () => (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Solicitudes Totales</p>
                    <p className="text-4xl font-black text-slate-900 mt-3 tracking-tighter">{stats?.total_requests}</p>
                    <div className="mt-4 flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase">
                        <Zap size={12} /> +12% este mes
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rating Promedio</p>
                    <p className="text-4xl font-black text-amber-500 mt-3 tracking-tighter flex items-center gap-2">
                        {stats?.rating_photographer_avg} <Star size={24} fill="currentColor" strokeWidth={1} />
                    </p>
                    <p className="mt-4 text-slate-400 text-[10px] font-black uppercase">Basado en 45 opiniones</p>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">SLA de Entrega</p>
                    <p className="text-4xl font-black text-indigo-600 mt-3 tracking-tighter">{stats?.avg_delivery_time_hours}h</p>
                    <div className="mt-4 flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase">
                        <Clock size={12} /> Objetivo: 48h
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Eficiencia Agenda</p>
                    <p className="text-4xl font-black text-emerald-500 mt-3 tracking-tighter">85%</p>
                    <div className="mt-4 flex items-center gap-2 text-red-400 text-[10px] font-black uppercase">
                        <AlertTriangle size={12} /> {stats?.reschedule_rate}% Reprogramaciones
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm h-96 flex flex-col">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-8">Embudo de Producción</h4>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={stats?.status_distribution} 
                                    innerRadius={75} 
                                    outerRadius={100} 
                                    paddingAngle={8} 
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {stats?.status_distribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#10B981', '#F59E0B', '#6366F1', '#EF4444', '#8B5CF6'][index % 5]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{borderRadius: '24px', border:'none', boxShadow:'0 10px 30px rgba(0,0,0,0.1)'}} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm h-96 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center mb-8">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Ranking de Fotógrafos</h4>
                        <button className="text-[10px] font-black text-indigo-500 hover:underline">VER REPORTE COMPLETO</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-50">
                                    <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                                    <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Shoots</th>
                                    <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Rating</th>
                                    <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Tendencia</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {stats?.top_photographers.map((p, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar name={p.name} size="xs" />
                                                <span className="text-sm font-bold text-slate-700">{p.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 text-center text-xs font-black text-slate-900">{p.jobs}</td>
                                        <td className="py-4 text-center">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-black">
                                                {p.rating} <Star size={10} fill="currentColor" />
                                            </span>
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 text-emerald-500">
                                                <TrendingUp size={14} />
                                                <span className="text-[10px] font-black">+5.4%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 relative">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-900 text-amber-400 rounded-2xl shadow-xl shadow-slate-900/20"><Camera size={32} /></div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Módulo de Fotografía</h1>
                            <p className="text-sm text-slate-500 font-medium">Coordinación estética y operativa de la marca El Castillo.</p>
                        </div>
                    </div>
                </div>
                {CURRENT_USER.role === 'MODELO' && (
                    <button 
                        onClick={() => setIsRequestFormOpen(true)}
                        className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-amber-400 font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:bg-black transition-all shadow-2xl shadow-slate-900/10 active:scale-95 border-b-4 border-slate-800"
                    >
                        <Plus size={18} /> AGENDAR SESIÓN
                    </button>
                )}
            </div>

            {/* Navigation & Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-2 rounded-[28px] border border-slate-100 shadow-sm gap-4">
                <div className="flex bg-slate-100 p-1 rounded-[22px] w-full md:w-auto">
                    {[
                        { id: 'BANDEJA', label: 'Gestión Solicitudes', icon: ImageIcon },
                        { id: 'CALENDARIO', label: 'Vista de Agenda', icon: CalIcon }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            <tab.icon size={16} className={`${activeTab === tab.id ? 'text-amber-500' : 'text-slate-400'}`} />
                            {tab.label}
                        </button>
                    ))}
                    {['ADMINISTRADOR', 'MONITOR'].includes(CURRENT_USER.role) && (
                        <button 
                            onClick={() => setActiveTab('DASHBOARD')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'DASHBOARD' ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            <BarChart3 size={16} className={`${activeTab === 'DASHBOARD' ? 'text-amber-500' : 'text-slate-400'}`} />
                            Análisis
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-3 px-4 py-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                         <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                         <input type="text" placeholder="Buscar por modelo o ID..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-amber-500/5 transition-all" />
                    </div>
                    <button onClick={refreshData} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all active:scale-90"><RefreshCw size={20} className={loading ? 'animate-spin' : ''} /></button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="min-h-[600px] transition-all duration-500">
                {loading && !requests.length ? (
                    <div className="flex flex-col items-center justify-center py-40 text-slate-200">
                        <RefreshCw className="animate-spin mb-6" size={64} />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Cargando plataforma de medios...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'BANDEJA' && renderInbox()}
                        {activeTab === 'CALENDARIO' && <PhotoCalendar events={events} />}
                        {activeTab === 'DASHBOARD' && renderDashboard()}
                    </>
                )}
            </div>

            {/* Modals & Overlays */}
            {isRequestFormOpen && <RequestForm onClose={() => setIsRequestFormOpen(false)} onSubmit={handleCreateRequest} />}
            {selectedRequest && renderDetailModal()}
            {selectedRequest && isRatingOpen && <RatingsModal isOpen={isRatingOpen} onClose={() => setIsRatingOpen(false)} request={selectedRequest} onSubmit={handleRating} />}

        </div>
    );
};

// Placeholder for Maximize icon which wasn't imported in initial block but used in DetailPane
const Maximize2: React.FC<{ size?: number, className?: string }> = ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
    </svg>
);

const TrendingUp: React.FC<{ size?: number, className?: string }> = ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
);

export default PhotographyPage;


import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, Globe, Building2, Map, 
  Edit3, Trash2, ChevronRight, MoreVertical,
  MapPin, Check, Filter, X, Save
} from 'lucide-react';
import { MOCK_LOCATIONS } from '../constants';
import { LocationCountry, LocationState, LocationCity } from '../types';

interface ModalConfig {
  type: 'country' | 'state' | 'city';
  mode: 'add' | 'edit';
  data?: any;
  isOpen: boolean;
}

const LocationsPage: React.FC = () => {
  // Main Data State
  const [locations, setLocations] = useState<LocationCountry[]>(MOCK_LOCATIONS);
  
  // Selection State
  const [selectedCountryId, setSelectedCountryId] = useState<string>(locations[0]?.id || '');
  const [selectedStateId, setSelectedStateId] = useState<string>(locations[0]?.states[0]?.id || '');
  
  // Search states
  const [searchCountry, setSearchCountry] = useState('');
  const [searchState, setSearchState] = useState('');
  const [searchCity, setSearchCity] = useState('');

  // Modal State
  const [modal, setModal] = useState<ModalConfig>({ type: 'country', mode: 'add', isOpen: false });
  const [formData, setFormData] = useState({ id: '', name: '' });

  // --- Selectors ---
  const filteredCountries = useMemo(() => 
    locations.filter(c => c.name.toLowerCase().includes(searchCountry.toLowerCase())),
  [locations, searchCountry]);

  const selectedCountry = useMemo(() => 
    locations.find(c => c.id === selectedCountryId), 
  [locations, selectedCountryId]);

  const filteredStates = useMemo(() => 
    selectedCountry?.states.filter(s => s.name.toLowerCase().includes(searchState.toLowerCase())) || [],
  [selectedCountry, searchState]);

  const selectedState = useMemo(() => 
    selectedCountry?.states.find(s => s.id === selectedStateId), 
  [selectedCountry, selectedStateId]);

  const filteredCities = useMemo(() => 
    selectedState?.cities.filter(city => city.name.toLowerCase().includes(searchCity.toLowerCase())) || [],
  [selectedState, searchCity]);

  // --- CRUD Handlers ---

  const openModal = (type: 'country' | 'state' | 'city', mode: 'add' | 'edit', data?: any) => {
    setModal({ type, mode, data, isOpen: true });
    setFormData(mode === 'edit' ? { id: data.id, name: data.name } : { id: '', name: '' });
  };

  const closeModal = () => setModal({ ...modal, isOpen: false });

  const handleSave = () => {
    if (!formData.id || !formData.name) return alert("Por favor completa todos los campos.");

    const newLocations = [...locations];

    if (modal.type === 'country') {
      if (modal.mode === 'add') {
        newLocations.push({ id: formData.id.toLowerCase(), name: formData.name.toUpperCase(), states: [] });
      } else {
        const idx = newLocations.findIndex(c => c.id === modal.data.id);
        newLocations[idx] = { ...newLocations[idx], name: formData.name.toUpperCase() };
      }
    } else if (modal.type === 'state') {
      const cIdx = newLocations.findIndex(c => c.id === selectedCountryId);
      if (modal.mode === 'add') {
        newLocations[cIdx].states.push({ id: formData.id.toLowerCase(), name: formData.name.toUpperCase(), cities: [] });
      } else {
        const sIdx = newLocations[cIdx].states.findIndex(s => s.id === modal.data.id);
        newLocations[cIdx].states[sIdx] = { ...newLocations[cIdx].states[sIdx], name: formData.name.toUpperCase() };
      }
    } else if (modal.type === 'city') {
      const cIdx = newLocations.findIndex(c => c.id === selectedCountryId);
      const sIdx = newLocations[cIdx].states.findIndex(s => s.id === selectedStateId);
      if (modal.mode === 'add') {
        newLocations[cIdx].states[sIdx].cities.push({ id: formData.id.toLowerCase(), name: formData.name.toUpperCase() });
      } else {
        const ciIdx = newLocations[cIdx].states[sIdx].cities.findIndex(ci => ci.id === modal.data.id);
        newLocations[cIdx].states[sIdx].cities[ciIdx] = { ...newLocations[cIdx].states[sIdx].cities[ciIdx], name: formData.name.toUpperCase() };
      }
    }

    setLocations(newLocations);
    closeModal();
  };

  const handleDelete = (type: 'country' | 'state' | 'city', id: string) => {
    if (!confirm(`¿Estás seguro de eliminar este registro?`)) return;

    let newLocations = [...locations];
    if (type === 'country') {
      newLocations = newLocations.filter(c => c.id !== id);
      if (selectedCountryId === id) {
        setSelectedCountryId(newLocations[0]?.id || '');
        setSelectedStateId(newLocations[0]?.states[0]?.id || '');
      }
    } else if (type === 'state') {
      const cIdx = newLocations.findIndex(c => c.id === selectedCountryId);
      newLocations[cIdx].states = newLocations[cIdx].states.filter(s => s.id !== id);
      if (selectedStateId === id) setSelectedStateId(newLocations[cIdx].states[0]?.id || '');
    } else if (type === 'city') {
      const cIdx = newLocations.findIndex(c => c.id === selectedCountryId);
      const sIdx = newLocations[cIdx].states.findIndex(s => s.id === selectedStateId);
      newLocations[cIdx].states[sIdx].cities = newLocations[cIdx].states[sIdx].cities.filter(ci => ci.id !== id);
    }
    setLocations(newLocations);
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen lg:h-[calc(100vh-140px)] flex flex-col space-y-6">
      
      {/* Header */}
      <div className="shrink-0 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Estructura Geográfica</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Navega y gestiona la jerarquía de ubicaciones del sistema.</p>
        </div>
        <div className="hidden md:block">
           <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
             <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
             {locations.length} Países Registrados
           </div>
        </div>
      </div>

      {/* Main Triple Panel Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        
        {/* PANEL 1: PAÍSES */}
        <div className="w-full lg:w-1/4 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-80 lg:h-auto">
          <div className="p-4 border-b border-slate-50 bg-slate-50/50">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
              <Globe size={14} /> Países
            </h3>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Buscar país..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 transition-all font-medium"
                value={searchCountry}
                onChange={(e) => setSearchCountry(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {filteredCountries.map(country => (
              <div key={country.id} className="group relative">
                <button
                  onClick={() => {
                    setSelectedCountryId(country.id);
                    setSelectedStateId(country.states[0]?.id || '');
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                    selectedCountryId === country.id 
                    ? 'bg-slate-900 text-white shadow-lg' 
                    : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                      selectedCountryId === country.id ? 'bg-amber-500 text-slate-900' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {country.id.toUpperCase()}
                    </div>
                    <span className="font-bold text-xs tracking-tight">{country.name}</span>
                  </div>
                  {selectedCountryId === country.id ? <Check size={14} className="text-amber-500" /> : <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                </button>
                <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${selectedCountryId === country.id ? 'hidden' : ''}`}>
                   <button onClick={(e) => { e.stopPropagation(); openModal('country', 'edit', country); }} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400"><Edit3 size={12} /></button>
                   <button onClick={(e) => { e.stopPropagation(); handleDelete('country', country.id); }} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-2 bg-slate-50/50 border-t border-slate-100">
             <button 
               onClick={() => openModal('country', 'add')}
               className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-amber-600 hover:border-amber-500 transition-all"
             >
               <Plus size={14} /> Añadir País
             </button>
          </div>
        </div>

        {/* PANEL 2: DEPARTAMENTOS */}
        <div className="w-full lg:w-1/3 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-80 lg:h-auto">
          <div className="p-4 border-b border-slate-50 bg-slate-50/50">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
              <Building2 size={14} /> Departamentos de {selectedCountry?.name || '---'}
            </h3>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Buscar departamento..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 transition-all font-medium"
                value={searchState}
                onChange={(e) => setSearchState(e.target.value)}
                disabled={!selectedCountry}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {filteredStates.map(state => (
              <div key={state.id} className="group relative">
                <button
                  onClick={() => setSelectedStateId(state.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                    selectedStateId === state.id 
                    ? 'bg-amber-50 border border-amber-200 text-amber-900' 
                    : 'hover:bg-slate-50 text-slate-600 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${selectedStateId === state.id ? 'bg-amber-500' : 'bg-slate-300'}`}></div>
                    <span className="font-bold text-xs tracking-tight">{state.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                      selectedStateId === state.id ? 'bg-amber-200 text-amber-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {state.cities.length}
                    </span>
                    <ChevronRight size={14} className={selectedStateId === state.id ? 'text-amber-500' : 'text-slate-300'} />
                  </div>
                </button>
                <div className="absolute right-12 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={(e) => { e.stopPropagation(); openModal('state', 'edit', state); }} className="p-1.5 hover:bg-white rounded-lg text-slate-400"><Edit3 size={12} /></button>
                   <button onClick={(e) => { e.stopPropagation(); handleDelete('state', state.id); }} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
            {!selectedCountry && (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-300">
                <MapPin size={40} className="mb-2 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">Selecciona un País</p>
              </div>
            )}
          </div>

          <div className="p-2 bg-slate-50/50 border-t border-slate-100">
             <button 
                disabled={!selectedCountry}
                onClick={() => openModal('state', 'add')}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-amber-600 hover:border-amber-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <Plus size={14} /> Añadir Estado
             </button>
          </div>
        </div>

        {/* PANEL 3: CIUDADES / MUNICIPIOS */}
        <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden h-96 lg:h-auto">
          <div className="p-4 border-b border-slate-50 bg-slate-50/50">
             <div className="flex justify-between items-center mb-3">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Map size={14} /> Municipios en {selectedState?.name || '---'}
                </h3>
                <div className="flex items-center gap-2 text-[9px] font-black text-slate-400">
                   {selectedCountry?.id.toUpperCase()} <ChevronRight size={8} /> {selectedState?.name}
                </div>
             </div>
             <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Filtrar ciudades..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 transition-all font-medium"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  disabled={!selectedState}
                />
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {selectedState ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredCities.map(city => (
                  <div key={city.id} className="group flex items-center justify-between p-3.5 bg-white border border-slate-100 rounded-2xl hover:border-amber-200 hover:shadow-md hover:shadow-amber-500/5 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-all">
                        <Map size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 tracking-tight leading-none">{city.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{city.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal('city', 'edit', city)} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"><Edit3 size={12} /></button>
                      <button onClick={() => handleDelete('city', city.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
                {filteredCities.length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <div className="bg-slate-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <MapPin size={24} />
                    </div>
                    <p className="text-sm font-bold text-slate-400">No se encontraron municipios</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <Map size={48} strokeWidth={1} className="mb-2 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">Selecciona un Departamento</p>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
             <button 
                disabled={!selectedState}
                onClick={() => openModal('city', 'add')}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 text-amber-400 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-900/10"
             >
               <Plus size={14} /> Añadir Ciudad
             </button>
             <button className="px-5 py-3 text-[10px] font-black text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest">
                Exportar CSV
             </button>
          </div>
        </div>
      </div>

      {/* MODAL SYSTEM */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  {modal.mode === 'add' ? 'Nuevo' : 'Editar'} {modal.type === 'country' ? 'País' : modal.type === 'state' ? 'Estado/Depto' : 'Ciudad/Municipio'}
                </h3>
                <p className="text-xs text-slate-400 font-medium">Completa la información requerida.</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Código / ID</label>
                <input 
                  type="text"
                  placeholder="Ej: COL, ANT, MED..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 transition-all disabled:opacity-50"
                  value={formData.id}
                  onChange={e => setFormData({ ...formData, id: e.target.value })}
                  disabled={modal.mode === 'edit'}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nombre</label>
                <input 
                  type="text"
                  placeholder="Ingresa el nombre..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 transition-all"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  autoFocus
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button onClick={closeModal} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all">
                Cancelar
              </button>
              <button onClick={handleSave} className="flex-1 py-3 bg-slate-900 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2">
                <Save size={14} /> Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationsPage;

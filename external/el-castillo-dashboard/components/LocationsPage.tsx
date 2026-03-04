
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronRight, ChevronDown, MapPin, Globe, Map, Building2, Search, AlertCircle, Loader2, X } from 'lucide-react';
import LocationService from '../LocationService';
import { LocationCountry, LocationDepartment, LocationCity } from '../types';


type DialogAction = 
  | { type: 'ADD_COUNTRY' }
  | { type: 'EDIT_COUNTRY'; countryId: number; countryName: string }
  | { type: 'ADD_DEPARTMENT'; countryId: number }
  | { type: 'EDIT_DEPARTMENT'; dptoId: number; dptoName: string }
  | { type: 'ADD_CITY'; dptoId: number }
  | { type: 'EDIT_CITY'; cityId: number; cityName: string };

interface DialogState {
  isOpen: boolean;
  title: string;
  inputValue: string;
  action: DialogAction | null;
}

const LocationsPage: React.FC = () => {
  const [locations, setLocations] = useState<LocationCountry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [expandedCountries, setExpandedCountries] = useState<Set<number>>(new Set());
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
  
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    title: '',
    inputValue: '',
    action: null
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    id: number;
    type: 'country' | 'department' | 'city';
  }>({
    isOpen: false,
    id: 0,
    type: 'country'
  });

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const response = await LocationService.getLocations();
      setLocations(response.data.data);
    } catch (error) {
      console.error('Error loading locations:', error);
      alert('Error al cargar las localizaciones');
    } finally {
      setLoading(false);
    }
  };

  const toggleCountry = (countryId: number) => {
    setExpandedCountries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(countryId)) {
        newSet.delete(countryId);
      } else {
        newSet.add(countryId);
      }
      return newSet;
    });
  };

  const toggleDepartment = (countryId: number, dptoId: number) => {
    const key = `${countryId}-${dptoId}`;
    setExpandedDepartments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const openDialog = (action: DialogAction, title: string, initialValue: string = '') => {
    setDialog({
      isOpen: true,
      title,
      inputValue: initialValue,
      action
    });
  };

  const closeDialog = () => {
    setDialog({
      isOpen: false,
      title: '',
      inputValue: '',
      action: null
    });
  };

  const handleDialogSubmit = async () => {
    if (!dialog.action || !dialog.inputValue.trim()) {
      alert('Por favor ingresa un valor');
      return;
    }

    try {
      setLoading(true);
      let successMessage = '';
      
      switch (dialog.action.type) {
        case 'ADD_COUNTRY':
          await LocationService.addCountry({ country_name: dialog.inputValue });
          successMessage = 'País creado exitosamente';
          break;
        case 'EDIT_COUNTRY':
          await LocationService.editCountry({ 
            id: dialog.action.countryId, 
            country_name: dialog.inputValue 
          });
          successMessage = 'País actualizado exitosamente';
          break;
        case 'ADD_DEPARTMENT':
          await LocationService.addDepartment({ 
            country_id: dialog.action.countryId, 
            dpto_name: dialog.inputValue 
          });
          successMessage = 'Departamento creado exitosamente';
          break;
        case 'EDIT_DEPARTMENT':
          await LocationService.editDepartment({ 
            id: dialog.action.dptoId, 
            dpto_name: dialog.inputValue 
          });
          successMessage = 'Departamento actualizado exitosamente';
          break;
        case 'ADD_CITY':
          await LocationService.addCity({ 
            dpto_id: dialog.action.dptoId, 
            city_name: dialog.inputValue 
          });
          successMessage = 'Ciudad creada exitosamente';
          break;
        case 'EDIT_CITY':
          await LocationService.editCity({ 
            id: dialog.action.cityId, 
            city_name: dialog.inputValue 
          });
          successMessage = 'Ciudad actualizada exitosamente';
          break;
      }

      await loadLocations();
      closeDialog();
      //alert(successMessage);
    } catch (error: any) {
      console.error('Error in dialog submit:', error);
      if (error.response?.data?.error?.message) {
        alert(error.response.data.error.message);
      } else {
        alert('Error al procesar la solicitud');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      let successMessage = '';
      
      switch (deleteDialog.type) {
        case 'country':
          await LocationService.delCountry({ id: deleteDialog.id });
          successMessage = 'País eliminado exitosamente';
          break;
        case 'department':
          await LocationService.delDepartment({ id: deleteDialog.id });
          successMessage = 'Departamento eliminado exitosamente';
          break;
        case 'city':
          await LocationService.delCity({ id: deleteDialog.id });
          successMessage = 'Ciudad eliminada exitosamente';
          break;
      }

      await loadLocations();
      setDeleteDialog({ isOpen: false, id: 0, type: 'country' });
      alert(successMessage);
    } catch (error: any) {
      console.error('Error deleting:', error);
      if (error.response?.data?.error?.message) {
        alert(error.response.data.error.message);
      } else {
        alert('Error al eliminar el registro');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredLocations = locations.filter(country => {
    if (!searchFilter) return true;
    const filter = searchFilter.toLowerCase();
    
    // Buscar en país
    if (country.country_name.toLowerCase().includes(filter)) return true;
    
    // Buscar en departamentos
    for (const dept of country.departments) {
      if (dept.dpto_name.toLowerCase().includes(filter)) return true;
      
      // Buscar en ciudades
      for (const city of dept.cities) {
        if (city.city_name.toLowerCase().includes(filter)) return true;
      }
    }
    
    return false;
  });


  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Globe className="text-blue-600" size={32} />
            Localizaciones
          </h1>
          <p className="text-slate-600 mt-1">Gestiona países, departamentos y ciudades</p>
        </div>
        <button
          onClick={() => openDialog({ type: 'ADD_COUNTRY' }, 'Agregar País')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
        >
          <Plus size={20} />
          Agregar País
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar país, departamento o ciudad..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Locations Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : filteredLocations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <AlertCircle size={48} className="mb-3" />
            <p>No hay localizaciones disponibles</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="w-12 px-4 py-3"></th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">País</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Departamento</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Ciudad</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredLocations.map((country) => (
                  <React.Fragment key={country.country_id}>
                    {/* Country Row */}
                    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        {country.departments.length > 0 && (
                          <button
                            onClick={() => toggleCountry(country.country_id)}
                            className="p-1 hover:bg-slate-200 rounded transition-colors"
                          >
                            {expandedCountries.has(country.country_id) ? (
                              <ChevronDown size={18} className="text-slate-600" />
                            ) : (
                              <ChevronRight size={18} className="text-slate-600" />
                            )}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Globe size={18} className="text-blue-600" />
                          <span className="font-medium text-slate-800">{country.country_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openDialog(
                              { type: 'ADD_DEPARTMENT', countryId: country.country_id },
                              'Agregar Departamento'
                            )}
                            className="p-1.5 hover:bg-green-100 text-green-600 rounded transition-colors"
                            title="Agregar departamento"
                          >
                            <Plus size={18} />
                          </button>
                          <button
                            onClick={() => openDialog(
                              { type: 'EDIT_COUNTRY', countryId: country.country_id, countryName: country.country_name },
                              'Editar País',
                              country.country_name
                            )}
                            className="p-1.5 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                            title="Editar país"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => setDeleteDialog({ isOpen: true, id: country.country_id, type: 'country' })}
                            className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors"
                            title="Eliminar país"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Department Rows */}
                    {expandedCountries.has(country.country_id) && country.departments.map((dept) => (
                      <React.Fragment key={dept.dpto_id}>
                        <tr className="border-b border-slate-100 bg-slate-50/50 hover:bg-slate-100 transition-colors">
                          <td className="px-4 py-3"></td>
                          <td className="px-4 py-3">
                            {dept.cities.length > 0 && (
                              <button
                                onClick={() => toggleDepartment(country.country_id, dept.dpto_id)}
                                className="p-1 hover:bg-slate-200 rounded transition-colors"
                              >
                                {expandedDepartments.has(`${country.country_id}-${dept.dpto_id}`) ? (
                                  <ChevronDown size={18} className="text-slate-600" />
                                ) : (
                                  <ChevronRight size={18} className="text-slate-600" />
                                )}
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Map size={18} className="text-indigo-600" />
                              <span className="font-medium text-slate-700">{dept.dpto_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3"></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openDialog(
                                  { type: 'ADD_CITY', dptoId: dept.dpto_id },
                                  'Agregar Ciudad'
                                )}
                                className="p-1.5 hover:bg-green-100 text-green-600 rounded transition-colors"
                                title="Agregar ciudad"
                              >
                                <Plus size={18} />
                              </button>
                              <button
                                onClick={() => openDialog(
                                  { type: 'EDIT_DEPARTMENT', dptoId: dept.dpto_id, dptoName: dept.dpto_name },
                                  'Editar Departamento',
                                  dept.dpto_name
                                )}
                                className="p-1.5 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                                title="Editar departamento"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => setDeleteDialog({ isOpen: true, id: dept.dpto_id, type: 'department' })}
                                className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors"
                                title="Eliminar departamento"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* City Rows */}
                        {expandedDepartments.has(`${country.country_id}-${dept.dpto_id}`) && dept.cities.map((city) => (
                          <tr key={city.city_id} className="border-b border-slate-100 bg-slate-100/50 hover:bg-slate-200/50 transition-colors">
                            <td className="px-4 py-3"></td>
                            <td className="px-4 py-3"></td>
                            <td className="px-4 py-3"></td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Building2 size={18} className="text-teal-600" />
                                <span className="text-slate-700">{city.city_name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openDialog(
                                    { type: 'EDIT_CITY', cityId: city.city_id, cityName: city.city_name },
                                    'Editar Ciudad',
                                    city.city_name
                                  )}
                                  className="p-1.5 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                                  title="Editar ciudad"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button
                                  onClick={() => setDeleteDialog({ isOpen: true, id: city.city_id, type: 'city' })}
                                  className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors"
                                  title="Eliminar ciudad"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      {dialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">{dialog.title}</h3>
              <button
                onClick={closeDialog}
                className="p-1 hover:bg-slate-100 rounded transition-colors"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>
            
            <input
              type="text"
              value={dialog.inputValue}
              onChange={(e) => setDialog({ ...dialog, inputValue: e.target.value })}
              placeholder="Ingresa el nombre..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              onKeyDown={(e) => e.key === 'Enter' && handleDialogSubmit()}
              autoFocus
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={closeDialog}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDialogSubmit}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Confirmar Eliminación</h3>
            </div>
            
            <p className="text-slate-600 mb-6">
              ¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteDialog({ isOpen: false, id: 0, type: 'country' })}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationsPage;

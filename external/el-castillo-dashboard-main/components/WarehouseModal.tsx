
import React, { useState, useEffect } from 'react';
import { X, Package, Plus, Search, Filter, History, Box, Edit2, TrendingUp, TrendingDown, Clipboard, Save, ArrowRightLeft, DollarSign, Tag, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import RoomControlService from '../RoomControlService';
import { WarehouseItem, WarehouseMovement, StockMovementType } from '../types';

interface WarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WarehouseModal: React.FC<WarehouseModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'ITEMS' | 'MOVEMENTS'>('ITEMS');
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Editing State
  const [editingItem, setEditingItem] = useState<Partial<WarehouseItem> | null>(null); // For Create/Edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Stock Adjustment State
  const [adjustingItem, setAdjustingItem] = useState<WarehouseItem | null>(null);
  const [adjustmentData, setAdjustmentData] = useState<{type: StockMovementType, qty: number, notes: string, cost?: number}>({
      type: 'PURCHASE_IN', qty: 1, notes: '', cost: 0
  });
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);

  // History State
  const [viewingHistoryItem, setViewingHistoryItem] = useState<WarehouseItem | null>(null);
  const [movements, setMovements] = useState<WarehouseMovement[]>([]);

  // --- ACTIONS ---

  const loadItems = async () => {
    setLoading(true);
    const data = await RoomControlService.getWarehouseItems();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.category.toLowerCase().includes(search.toLowerCase()) ||
    i.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveItem = async () => {
      if (!editingItem?.name || !editingItem?.unit_cost) return alert("Nombre y Costo son obligatorios");
      
      try {
          if (editingItem.id) {
              await RoomControlService.updateWarehouseItem(editingItem.id, editingItem);
          } else {
              await RoomControlService.createWarehouseItem(editingItem);
          }
          await loadItems();
          setIsEditModalOpen(false);
          setEditingItem(null);
      } catch (e: any) {
          alert(e.message);
      }
  };

  const handleAdjustStock = async () => {
      if (!adjustingItem) return;
      if (adjustmentData.qty <= 0) return alert("La cantidad debe ser mayor a 0");
      if (!adjustmentData.notes) return alert("El motivo es obligatorio para auditoría");

      try {
          await RoomControlService.adjustStock(adjustingItem.id, {
              type: adjustmentData.type,
              qty: adjustmentData.qty,
              notes: adjustmentData.notes,
              unit_cost: adjustmentData.cost || adjustingItem.unit_cost
          });
          await loadItems();
          setIsStockModalOpen(false);
          setAdjustingItem(null);
          alert("Stock ajustado correctamente");
      } catch (e: any) {
          alert(e.message);
      }
  };

  const handleViewHistory = async (item: WarehouseItem) => {
      setViewingHistoryItem(item);
      const hist = await RoomControlService.getItemMovements(item.id);
      setMovements(hist);
      setActiveTab('MOVEMENTS');
  };

  // --- UI COMPONENTS ---

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-6xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        
        {/* MAIN HEADER */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div>
             <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-500/20"><Package size={24} /></div>
                Almacén Central
             </h3>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Maestro de Ítems & Gestión de Kardex</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X size={24} /></button>
        </div>

        {/* TABS & TOOLS */}
        <div className="px-8 py-4 border-b border-slate-100 bg-white flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                    onClick={() => { setActiveTab('ITEMS'); setViewingHistoryItem(null); }} 
                    className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'ITEMS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Box size={14} /> Ítems Maestro
                </button>
                <button 
                    onClick={() => setActiveTab('MOVEMENTS')} 
                    className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'MOVEMENTS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <History size={14} /> Historial {viewingHistoryItem ? `(${viewingHistoryItem.name})` : ''}
                </button>
            </div>

            {activeTab === 'ITEMS' && (
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar ítem, marca..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => { setEditingItem({ category: 'General', currency: 'COP', is_active: true, serial_required: false }); setIsEditModalOpen(true); }}
                        className="px-5 py-2.5 bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                    >
                        <Plus size={16} /> Nuevo Ítem
                    </button>
                </div>
            )}
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#F8FAFC]">
            
            {activeTab === 'ITEMS' && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ítem / Marca</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Costo Unit.</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Stock</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredItems.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-slate-200">
                                                <Box size={18} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                                                {item.brand && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{item.brand} {item.model}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                                            <Tag size={10} className="mr-1.5" /> {item.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-sm font-bold text-slate-600">
                                        <span className="text-[10px] text-slate-400 mr-1">{item.currency}</span>
                                        ${item.unit_cost.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${item.stock_qty > 5 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : item.stock_qty > 0 ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                            <span className="font-black text-sm">{item.stock_qty}</span>
                                            <span className="text-[9px] font-bold uppercase">Unds</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {item.is_active ? (
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" title="Activo"></span>
                                        ) : (
                                            <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" title="Inactivo"></span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingItem(item); setIsEditModalOpen(true); }} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all" title="Editar">
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => { setAdjustingItem(item); setAdjustmentData({ ...adjustmentData, cost: item.unit_cost }); setIsStockModalOpen(true); }}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Ajustar Stock"
                                            >
                                                <ArrowRightLeft size={16} />
                                            </button>
                                            <button onClick={() => handleViewHistory(item)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all" title="Ver Movimientos">
                                                <History size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'MOVEMENTS' && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    {viewingHistoryItem && (
                        <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
                            <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                                <Box size={14} /> Kardex: {viewingHistoryItem.name}
                            </h4>
                            <button onClick={() => setViewingHistoryItem(null)} className="text-[10px] font-bold text-indigo-500 hover:underline">Ver todo</button>
                        </div>
                    )}
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha / Hora</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo Movimiento</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ítem</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Cantidad</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario / Notas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {movements.map((mov) => (
                                <tr key={mov.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                        {new Date(mov.date).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${
                                            ['PURCHASE_IN', 'RETURN'].includes(mov.type) ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                            ['ASSIGN', 'LOST', 'DAMAGED'].includes(mov.type) ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                            'bg-blue-50 text-blue-600 border-blue-100'
                                        }`}>
                                            {mov.type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{mov.item_name}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`font-mono font-bold ${['PURCHASE_IN', 'RETURN'].includes(mov.type) ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {['PURCHASE_IN', 'RETURN'].includes(mov.type) ? '+' : '-'}{mov.qty}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-bold text-slate-700">{mov.user}</p>
                                        <p className="text-[10px] text-slate-400 italic">{mov.notes}</p>
                                    </td>
                                </tr>
                            ))}
                            {movements.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-400 text-xs font-medium">No hay movimientos registrados</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

        {/* --- MODALS OVERLAY --- */}

        {/* 1. EDIT / CREATE ITEM MODAL */}
        {isEditModalOpen && (
            <div className="absolute inset-0 z-20 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl p-0 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-black text-lg text-slate-900">{editingItem?.id ? 'Editar Ítem Maestro' : 'Crear Nuevo Ítem'}</h3>
                        <button onClick={() => setIsEditModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-900" /></button>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nombre del Ítem</label>
                                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500" autoFocus value={editingItem?.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Categoría</label>
                                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500" value={editingItem?.category} onChange={e => setEditingItem({...editingItem, category: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Marca / Modelo</label>
                                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500" value={editingItem?.brand} onChange={e => setEditingItem({...editingItem, brand: e.target.value})} placeholder="Opcional" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Costo Unitario</label>
                                <div className="relative">
                                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="number" className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500" value={editingItem?.unit_cost} onChange={e => setEditingItem({...editingItem, unit_cost: Number(e.target.value)})} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Moneda</label>
                                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none" value={editingItem?.currency} onChange={e => setEditingItem({...editingItem, currency: e.target.value})}>
                                    <option value="COP">COP (Pesos)</option>
                                    <option value="USD">USD (Dólares)</option>
                                    <option value="EUR">EUR (Euros)</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="flex gap-6 pt-4 border-t border-slate-100">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" checked={editingItem?.serial_required} onChange={e => setEditingItem({...editingItem, serial_required: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500" />
                                <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">Requiere Serial (Activos Fijos)</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" checked={editingItem?.is_active} onChange={e => setEditingItem({...editingItem, is_active: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500" />
                                <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">Ítem Activo</span>
                            </label>
                        </div>
                    </div>
                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
                        <button onClick={() => setIsEditModalOpen(false)} className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase hover:bg-slate-100">Cancelar</button>
                        <button onClick={handleSaveItem} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase hover:bg-black flex items-center gap-2"><Save size={14} /> Guardar</button>
                    </div>
                </div>
            </div>
        )}

        {/* 2. ADJUST STOCK MODAL */}
        {isStockModalOpen && adjustingItem && (
            <div className="absolute inset-0 z-20 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg p-0 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <div>
                            <h3 className="font-black text-lg text-slate-900">Ajustar Stock</h3>
                            <p className="text-xs text-slate-500 font-bold">{adjustingItem.name}</p>
                        </div>
                        <button onClick={() => setIsStockModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-900" /></button>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex justify-between items-center">
                            <span className="text-xs font-bold text-indigo-800 uppercase">Stock Actual</span>
                            <span className="text-2xl font-black text-indigo-900">{adjustingItem.stock_qty}</span>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Tipo de Movimiento</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'PURCHASE_IN', label: 'Compra / Entrada', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                                    { id: 'ADJUSTMENT', label: 'Ajuste Inventario', color: 'bg-slate-50 text-slate-700 border-slate-200' },
                                    { id: 'ASSIGN', label: 'Asignación / Salida', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                                    { id: 'DAMAGED', label: 'Baja por Daño', color: 'bg-red-50 text-red-700 border-red-200' },
                                    { id: 'LOST', label: 'Pérdida', color: 'bg-red-50 text-red-700 border-red-200' },
                                    { id: 'RETURN', label: 'Devolución', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                                ].map(t => (
                                    <button 
                                        key={t.id} 
                                        onClick={() => setAdjustmentData({...adjustmentData, type: t.id as StockMovementType})}
                                        className={`px-3 py-3 border rounded-xl text-xs font-bold transition-all ${adjustmentData.type === t.id ? t.color + ' ring-2 ring-offset-1' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Cantidad</label>
                                <input type="number" min="1" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black outline-none focus:border-indigo-500 text-center" value={adjustmentData.qty} onChange={e => setAdjustmentData({...adjustmentData, qty: Number(e.target.value)})} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Costo Unit. (Snapshot)</label>
                                <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 text-right" value={adjustmentData.cost} onChange={e => setAdjustmentData({...adjustmentData, cost: Number(e.target.value)})} />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Motivo / Notas (Obligatorio)</label>
                            <textarea className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 resize-none" rows={2} placeholder="Justificación del movimiento..." value={adjustmentData.notes} onChange={e => setAdjustmentData({...adjustmentData, notes: e.target.value})} />
                        </div>
                    </div>
                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
                        <button onClick={() => setIsStockModalOpen(false)} className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase hover:bg-slate-100">Cancelar</button>
                        <button onClick={handleAdjustStock} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-500/30">
                            <CheckCircle2 size={14} /> Confirmar Movimiento
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default WarehouseModal;

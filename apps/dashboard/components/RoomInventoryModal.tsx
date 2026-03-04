
import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, DollarSign, Package, BoxSelect } from 'lucide-react';
import { Room, InventoryItem, WarehouseItem } from '../types';
import RoomControlService from '../RoomControlService';

interface RoomInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  onUpdate: (updatedInventory: InventoryItem[]) => void;
}

const RoomInventoryModal: React.FC<RoomInventoryModalProps> = ({ isOpen, onClose, room, onUpdate }) => {
  if (!isOpen) return null;

  const [items, setItems] = useState<InventoryItem[]>(room.inventory || []);
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemCost, setNewItemCost] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    // Load warehouse items for selection
    RoomControlService.getWarehouseItems().then(setWarehouseItems);
  }, []);

  const handleAddItemManual = () => {
    if (!newItemName) return;
    const newItem: InventoryItem = {
      id: `inv_${Date.now()}`,
      name: newItemName,
      qty: newItemQty,
      unit_cost: newItemCost,
      condition: 'OK'
    };
    setItems([...items, newItem]);
    setNewItemName('');
    setNewItemQty(1);
    setNewItemCost(0);
  };

  const handleAssignFromWarehouse = async (wItem: WarehouseItem) => {
    try {
        await RoomControlService.assignToRoom(room.id, wItem.id, 1);
        const newItem: InventoryItem = {
            id: `inv_${Date.now()}`,
            warehouse_item_id: wItem.id,
            name: wItem.name,
            qty: 1,
            unit_cost: wItem.unit_cost,
            condition: 'OK'
        };
        // Refresh local items from service/backend ideally, but appending for instant feedback
        setItems(prev => {
            const existing = prev.find(i => i.warehouse_item_id === wItem.id);
            if(existing) {
                return prev.map(i => i.id === existing.id ? {...i, qty: i.qty + 1} : i);
            }
            return [...prev, newItem];
        });
        alert(`Asignado ${wItem.name} a la habitación.`);
    } catch (error: any) {
        alert(error.message);
    }
  };

  const handleRemoveItem = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este ítem? La acción es inmediata.')) return;
    setDeletingId(id);
    try {
        await RoomControlService.removeItemFromRoom(room.id, id);
        setItems(prev => prev.filter(i => i.id !== id));
        // Also trigger parent update if needed, but the main page usually reloads on modal close or we can rely on local state consistency
        onUpdate(items.filter(i => i.id !== id)); 
    } catch (e) {
        console.error("Error deleting item", e);
        alert("No se pudo eliminar el ítem.");
    } finally {
        setDeletingId(null);
    }
  };

  const handleSave = () => {
    onUpdate(items);
    onClose();
  };

  const totalValue = items.reduce((acc, item) => acc + (item.qty * item.unit_cost), 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
             <h3 className="text-lg font-black text-slate-900 tracking-tight">Inventario: {room.code}</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
               Valor Total: <span className="text-emerald-600">${totalValue.toLocaleString()}</span>
             </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Manual Add */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Agregar Manualmente</h4>
                    <div className="space-y-3">
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold outline-none"
                            placeholder="Nombre Ítem"
                            value={newItemName}
                            onChange={e => setNewItemName(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <input 
                                type="number" 
                                className="w-20 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold outline-none"
                                placeholder="Qty"
                                value={newItemQty}
                                onChange={e => setNewItemQty(Number(e.target.value))}
                            />
                            <input 
                                type="number" 
                                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold outline-none"
                                placeholder="Costo"
                                value={newItemCost}
                                onChange={e => setNewItemCost(Number(e.target.value))}
                            />
                        </div>
                        <button onClick={handleAddItemManual} className="w-full py-2 bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase hover:bg-slate-300">
                            + Agregar Suelto
                        </button>
                    </div>
                </div>

                {/* Warehouse Picker */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <BoxSelect size={14} /> Desde Almacén
                    </h4>
                    <div className="h-32 overflow-y-auto custom-scrollbar space-y-2">
                        {warehouseItems.map(w => (
                            <button 
                                key={w.id} 
                                onClick={() => handleAssignFromWarehouse(w)}
                                className="w-full flex justify-between items-center p-2 bg-white border border-slate-100 rounded-lg hover:border-amber-400 transition-all text-left group"
                            >
                                <span className="text-xs font-bold text-slate-700 group-hover:text-amber-700">{w.name}</span>
                                <span className="text-[9px] font-black bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">Stock: {w.stock_qty}</span>
                            </button>
                        ))}
                    </div>
                </div>
           </div>

           {/* Inventory List */}
           <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                       <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ítem</th>
                       <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Cant</th>
                       <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Costo Unit.</th>
                       <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                       <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Acción</th>
                    </tr>
                 </thead>
                 <tbody className="text-sm">
                    {items.length > 0 ? items.map(item => (
                       <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-700">
                              {item.name}
                              {item.warehouse_item_id && <span className="ml-2 text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase font-black">Almacén</span>}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600">{item.qty}</td>
                          <td className="px-4 py-3 text-right font-mono text-slate-500">${item.unit_cost.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">${(item.qty * item.unit_cost).toLocaleString()}</td>
                          <td className="px-4 py-3 text-center">
                             <button 
                                onClick={() => handleRemoveItem(item.id)} 
                                disabled={deletingId === item.id}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                             >
                                {deletingId === item.id ? <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div> : <Trash2 size={16} />}
                             </button>
                          </td>
                       </tr>
                    )) : (
                       <tr>
                          <td colSpan={5} className="py-10 text-center text-slate-400 flex flex-col items-center">
                             <Package size={32} className="mb-2 opacity-20" />
                             <span className="text-xs">No hay ítems en el inventario.</span>
                          </td>
                       </tr>
                    )}
                 </tbody>
              </table>
           </div>

        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
           <button onClick={onClose} className="px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-100">
              Cerrar
           </button>
           <button onClick={handleSave} className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 flex items-center gap-2">
              <Save size={16} /> Guardar Cambios (Lote)
           </button>
        </div>

      </div>
    </div>
  );
};

export default RoomInventoryModal;

import { api } from './api';
import { Room, RoomAssignment, RoomTicket, RoomAlert, UserRanking, WarehouseItem, WarehouseMovement, RoomType, InventoryItem, SystemAlert, RankingFilterParams, StockMovementType } from './types';
import { MOCK_ROOMS, MOCK_USERS } from './constants';

// --- LOCAL MOCK STATE (Simulating DB) ---
let localRooms = [...MOCK_ROOMS];
let localTickets: RoomTicket[] = [];
let localAlerts: SystemAlert[] = [];
let localWarehouseItems: WarehouseItem[] = [
  { id: 'w1', name: 'PC Gamer HighEnd', category: 'Tecnología', brand: 'Asus', model: 'ROG Strix', unit_cost: 4500000, currency: 'COP', stock_qty: 5, is_active: true, serial_required: true, updated_at: new Date().toISOString() },
  { id: 'w2', name: 'Aro de Luz 18"', category: 'Iluminación', brand: 'Neewer', unit_cost: 250000, currency: 'COP', stock_qty: 12, is_active: true, serial_required: false, updated_at: new Date().toISOString() },
  { id: 'w3', name: 'Silla Ergonómica', category: 'Mobiliario', brand: 'Herman Miller', unit_cost: 1200000, currency: 'COP', stock_qty: 3, is_active: true, serial_required: false, updated_at: new Date().toISOString() },
  { id: 'w4', name: 'Logitech Brio 4K', category: 'Tecnología', brand: 'Logitech', unit_cost: 800000, currency: 'COP', stock_qty: 8, is_active: true, serial_required: true, updated_at: new Date().toISOString() },
  { id: 'w5', name: 'Juego de Sábanas King', category: 'Lencería', unit_cost: 150000, currency: 'COP', stock_qty: 20, is_active: true, serial_required: false, updated_at: new Date().toISOString() },
];
let localMovements: WarehouseMovement[] = [
    { id: 'mov_1', item_id: 'w1', item_name: 'PC Gamer HighEnd', type: 'PURCHASE_IN', qty: 5, unit_cost_snapshot: 4500000, date: new Date(Date.now() - 10000000).toISOString(), user: 'Admin', notes: 'Compra inicial Factura #123' },
    { id: 'mov_2', item_id: 'w2', item_name: 'Aro de Luz 18"', type: 'PURCHASE_IN', qty: 15, unit_cost_snapshot: 250000, date: new Date(Date.now() - 9000000).toISOString(), user: 'Admin', notes: 'Compra inicial' },
    { id: 'mov_3', item_id: 'w2', item_name: 'Aro de Luz 18"', type: 'ASSIGN', qty: 3, unit_cost_snapshot: 250000, date: new Date(Date.now() - 5000000).toISOString(), user: 'Monitor Sofia', related_room_code: 'H-101', notes: 'Asignación a cuarto' },
];
let localRoomTypes: RoomType[] = [
  { id: 'rt1', name: 'Standard', description: 'Habitación básica', is_active: true },
  { id: 'rt2', name: 'Premium', description: 'Mejor iluminación y PC', is_active: true },
  { id: 'rt3', name: 'Suite', description: 'Cama King y decoración temática', is_active: true },
  { id: 'rt4', name: 'Streaming', description: 'Insonorizada', is_active: true },
];

// --- STREAK ENGINE HELPER ---
const checkPerformanceStreak = (userId: number, role: 'MODELO' | 'MONITOR') => {
  const userTickets = localTickets.filter(t => {
    return true; // Simplified for mock
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Logic: >2 bad tickets in mock triggers alert
  const streakCount = Math.floor(Math.random() * 5); 
  
  if (streakCount >= 3) {
    const existingAlert = localAlerts.find(a => a.subject_user_id === userId && a.status === 'OPEN');
    if (!existingAlert) {
        const newAlert: SystemAlert = {
            id: `alert_${Date.now()}`,
            alert_type: role === 'MODELO' ? 'BAD_STREAK_MODEL' : 'BAD_STREAK_MONITOR',
            subject_user_id: userId,
            subject_name: MOCK_USERS.find(u => u.user_id === userId)?.user_name || 'Usuario',
            subject_role: role,
            severity: 'WARNING',
            status: 'OPEN',
            streak_count: streakCount,
            message: `${streakCount} entregas/recibos deficientes consecutivos.`,
            metadata_json: { last_tickets: ['TK-101', 'TK-102', 'TK-103'] },
            created_at: new Date().toISOString()
        };
        localAlerts.unshift(newAlert);
    }
  }
};

const RoomControlService = {
  // --- Rooms ---
  getRooms: async (filters: { date: string, shift: string, studioId: string }) => {
    return Promise.resolve([...localRooms]);
  },

  getRoomDetails: async (roomId: string) => {
    return Promise.resolve(localRooms.find(r => r.id === roomId));
  },

  createRoom: async (roomData: Partial<Room>) => {
    const newRoom: Room = { 
      ...roomData, 
      id: `room_${Date.now()}`, 
      status: 'ACTIVE', 
      inventory: [],
      incidents_count: 0
    } as Room;
    localRooms.push(newRoom);
    return Promise.resolve(newRoom);
  },

  updateRoom: async (roomId: string, updates: Partial<Room>) => {
    localRooms = localRooms.map(r => r.id === roomId ? { ...r, ...updates } : r);
    return Promise.resolve(localRooms.find(r => r.id === roomId));
  },

  // --- Inventory & Stock Management ---
  removeItemFromRoom: async (roomId: string, itemId: string) => {
    const room = localRooms.find(r => r.id === roomId);
    if (room) {
      room.inventory = room.inventory.filter(i => i.id !== itemId);
    }
    return Promise.resolve(true);
  },

  getWarehouseItems: async () => {
    return Promise.resolve([...localWarehouseItems]);
  },

  createWarehouseItem: async (item: Partial<WarehouseItem>) => {
    const newItem = { 
        ...item, 
        id: `w_${Date.now()}`, 
        is_active: true, 
        currency: item.currency || 'COP',
        stock_qty: item.stock_qty || 0,
        updated_at: new Date().toISOString()
    } as WarehouseItem;
    
    localWarehouseItems.push(newItem);
    
    // Create initial stock movement if quantity > 0
    if (newItem.stock_qty > 0) {
        localMovements.push({
            id: `mov_init_${Date.now()}`,
            item_id: newItem.id,
            item_name: newItem.name,
            type: 'PURCHASE_IN',
            qty: newItem.stock_qty,
            unit_cost_snapshot: newItem.unit_cost,
            date: new Date().toISOString(),
            user: 'System',
            notes: 'Stock inicial al crear ítem'
        });
    }
    
    return Promise.resolve(newItem);
  },

  updateWarehouseItem: async (id: string, data: Partial<WarehouseItem>) => {
      const idx = localWarehouseItems.findIndex(i => i.id === id);
      if (idx === -1) throw new Error("Item no encontrado");
      
      // Prevent manual stock update via edit
      const { stock_qty, ...safeData } = data;
      
      localWarehouseItems[idx] = { 
          ...localWarehouseItems[idx], 
          ...safeData,
          updated_at: new Date().toISOString()
      };
      
      return Promise.resolve(localWarehouseItems[idx]);
  },

  adjustStock: async (itemId: string, movement: { type: StockMovementType, qty: number, notes: string, unit_cost?: number }) => {
      const idx = localWarehouseItems.findIndex(i => i.id === itemId);
      if (idx === -1) throw new Error("Item no encontrado");
      
      const item = localWarehouseItems[idx];
      let newStock = item.stock_qty;
      const qty = Math.abs(movement.qty); // Ensure positive for calculation

      // Validation logic
      if (['ASSIGN', 'LOST', 'DAMAGED', 'RETURN'].includes(movement.type)) {
          if (movement.type === 'PURCHASE_IN' || movement.type === 'RETURN') { // Return here means 'Return from Room' -> Stock Up
              newStock += qty;
          } else { // ASSIGN, LOST, DAMAGED -> Stock Down
              if (item.stock_qty < qty) throw new Error(`Stock insuficiente (${item.stock_qty}) para realizar esta operación.`);
              newStock -= qty;
          }
      } else if (movement.type === 'ADJUSTMENT') {
          if (item.stock_qty + movement.qty < 0) throw new Error("El ajuste resultaría en stock negativo.");
          newStock += movement.qty;
      }

      // Update Item
      localWarehouseItems[idx] = { ...item, stock_qty: newStock, updated_at: new Date().toISOString() };

      // Record Movement
      const newMovement: WarehouseMovement = {
          id: `mov_${Date.now()}`,
          item_id: item.id,
          item_name: item.name,
          type: movement.type,
          qty: qty, // Log absolute quantity magnitude
          unit_cost_snapshot: movement.unit_cost || item.unit_cost,
          date: new Date().toISOString(),
          user: 'Admin', // In real app, get from context
          notes: movement.notes
      };
      localMovements.unshift(newMovement); // Add to top

      return Promise.resolve({ item: localWarehouseItems[idx], movement: newMovement });
  },

  getItemMovements: async (itemId: string) => {
      return Promise.resolve(localMovements.filter(m => m.item_id === itemId));
  },

  assignToRoom: async (roomId: string, itemId: string, qty: number) => {
    const wItem = localWarehouseItems.find(i => i.id === itemId);
    if (!wItem || wItem.stock_qty < qty) throw new Error("Stock insuficiente en almacén");
    
    // Update Warehouse Stock
    wItem.stock_qty -= qty;
    
    // Add Movement Log
    // FIX: Added required unit_cost_snapshot property to satisfy WarehouseMovement interface
    localMovements.unshift({ 
        id: `mov_${Date.now()}`, 
        item_id: itemId, 
        item_name: wItem.name, 
        type: 'ASSIGN', 
        qty, 
        unit_cost_snapshot: wItem.unit_cost,
        related_room_code: localRooms.find(r => r.id === roomId)?.code, 
        date: new Date().toISOString(), 
        user: 'Admin',
        notes: `Asignado a habitación` 
    });

    // Update Room Inventory
    const roomIndex = localRooms.findIndex(r => r.id === roomId);
    if (roomIndex >= 0) {
      const room = localRooms[roomIndex];
      const existingInv = room.inventory.find(i => i.warehouse_item_id === itemId || i.name === wItem.name);
      if (existingInv) { existingInv.qty += qty; } 
      else {
        room.inventory.push({ 
            id: `inv_${Date.now()}`, 
            warehouse_item_id: itemId, 
            name: wItem.name, 
            qty: qty, 
            unit_cost: wItem.unit_cost, 
            condition: 'OK' 
        });
      }
    }
    return Promise.resolve(true);
  },

  // --- Assignments ---
  createAssignment: async (data: Partial<RoomAssignment>) => {
    const assignment = { ...data, id: 'assign_' + Date.now(), status: 'SCHEDULED' } as RoomAssignment;
    localRooms = localRooms.map(r => {
        if(r.id === data.room_id) {
            return { ...r, current_assignment: assignment };
        }
        return r;
    });
    return Promise.resolve(assignment);
  },

  // --- Tickets ---
  createTicket: async (data: Partial<RoomTicket>) => {
    const newTicket: RoomTicket = {
      ...data,
      id: data.id || `ticket_${Date.now()}`,
      status: data.status || 'DRAFT',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      signed_by_model: data.signed_by_model || false,
      signed_by_monitor: data.signed_by_monitor || false,
      checklist: data.checklist || [],
    } as RoomTicket;

    const existingIndex = localTickets.findIndex(t => t.id === newTicket.id);
    if (existingIndex >= 0) {
      localTickets[existingIndex] = newTicket;
    } else {
      localTickets.push(newTicket);
    }
    
    if (newTicket.status === 'SUBMITTED') {
        const room = localRooms.find(r => r.id === newTicket.room_id);
        if (room && room.current_assignment) {
            checkPerformanceStreak(room.current_assignment.model_id, 'MODELO');
        }
    }
    
    return Promise.resolve(newTicket);
  },

  getTicketsByAssignment: async (assignmentId: string) => {
    return Promise.resolve(localTickets.filter(t => t.assignment_id === assignmentId));
  },

  // --- History & Alerts ---
  getRoomHistory: async (roomId: string) => {
    const history = [
      { id: 1, type: 'ASSIGNMENT', description: 'Asignado a Jennifer Zuluaga', date: '2025-05-20 08:00', user: 'Monitor Sofia' },
      { id: 2, type: 'TICKET', description: 'Ticket Entrega Creado', date: '2025-05-20 08:15', user: 'Monitor Sofia' },
      { id: 3, type: 'INVENTORY', description: 'Agregado 1x Aro de Luz', date: '2025-05-18 14:00', user: 'Admin' },
      { id: 4, type: 'INCIDENT', description: 'Reporte daño silla', date: '2025-05-15 09:30', user: 'Modelo Ana' },
    ];
    return Promise.resolve(history);
  },

  getAlerts: async () => {
    const alerts: RoomAlert[] = [
      { id: 'al1', severity: 'CRITICAL', message: 'H-103 tiene un incidente abierto por daño en cama.', timestamp: '10 min' },
      { id: 'al2', severity: 'WARNING', message: 'Monitor Sofia tiene 2 tickets de recibo pendientes.', timestamp: '30 min' }
    ];
    return Promise.resolve(alerts);
  },

  getSystemAlerts: async (status: 'OPEN' | 'RESOLVED' | 'ALL' = 'OPEN') => {
    if (localAlerts.length === 0) {
        localAlerts = [
            {
                id: 'sys_al_1',
                alert_type: 'BAD_STREAK_MODEL',
                subject_user_id: 3989,
                subject_name: 'Ana Acero',
                subject_role: 'MODELO',
                severity: 'WARNING',
                status: 'OPEN',
                streak_count: 3,
                message: '3 entregas con ítems faltantes consecutivas.',
                created_at: new Date(Date.now() - 3600000).toISOString()
            },
            {
                id: 'sys_al_2',
                alert_type: 'CRITICAL_INCIDENT',
                subject_user_id: 3990,
                subject_name: 'Jennifer Zuluaga',
                subject_role: 'MODELO',
                severity: 'CRITICAL',
                status: 'OPEN',
                streak_count: 1,
                message: 'Daño reportado en equipo de cómputo.',
                created_at: new Date(Date.now() - 7200000).toISOString()
            }
        ];
    }
    return Promise.resolve(localAlerts.filter(a => status === 'ALL' || a.status === status));
  },

  resolveSystemAlert: async (alertId: string, resolution: string) => {
    localAlerts = localAlerts.map(a => a.id === alertId ? { ...a, status: 'RESOLVED', resolved_at: new Date().toISOString(), resolved_by: 'Admin' } : a);
    return Promise.resolve(true);
  },

  getOccupancyStats: async (date: string, shift: string) => {
    const validRooms = localRooms.filter(r => r.status !== 'INACTIVE');
    const total_active = validRooms.length;
    const maintenance = validRooms.filter(r => r.status === 'MAINTENANCE').length;
    const occupied = validRooms.filter(r => r.status === 'ACTIVE' && r.current_assignment?.status === 'ACTIVE').length;
    const available = total_active - occupied - maintenance;
    const percentage = (total_active - maintenance) > 0 ? Math.round((occupied / (total_active - maintenance)) * 100) : 0;
    
    return Promise.resolve({ total_active, occupied, available, maintenance, percentage });
  },

  getOperationalRankings: async (params: RankingFilterParams) => {
    let rankings: UserRanking[] = [
      { user_id: 3988, name: 'Sofia Mosquera', role: 'MONITOR', score: 98, tickets_count: 45, disputes_count: 0, avg_rating: 4.9, incidents_count: 0, trend: 'up', bad_streak_current: 0 },
      { user_id: 102, name: 'Carlos Perez', role: 'MONITOR', score: 85, tickets_count: 32, disputes_count: 2, avg_rating: 4.2, incidents_count: 1, trend: 'down', bad_streak_current: 1 },
      { user_id: 3990, name: 'Jennifer Zuluaga', role: 'MODELO', score: 92, tickets_count: 20, disputes_count: 0, avg_rating: 4.8, incidents_count: 0, trend: 'neutral', bad_streak_current: 0 },
      { user_id: 3989, name: 'Ana Acero', role: 'MODELO', score: 75, tickets_count: 18, disputes_count: 3, avg_rating: 3.5, incidents_count: 2, trend: 'down', bad_streak_current: 3 },
      { user_id: 3995, name: 'Luisa Fernanda', role: 'MODELO', score: 88, tickets_count: 15, disputes_count: 1, avg_rating: 4.5, incidents_count: 0, trend: 'up', bad_streak_current: 0 },
    ];
    rankings = rankings.filter(r => r.role === params.role);
    if (params.startDate) {
        rankings = rankings.map(r => ({ ...r, score: Math.min(100, Math.max(0, r.score + (Math.random() > 0.5 ? 2 : -2))), tickets_count: Math.floor(r.tickets_count * (Math.random() * 0.5 + 0.5)) }));
    }
    if (params.shift && params.shift !== 'ALL') {
         rankings = rankings.filter(() => Math.random() > 0.3);
    }
    rankings.sort((a, b) => b.score - a.score);
    return Promise.resolve(rankings);
  },

  // --- Room Types ---
  getRoomTypes: async () => {
    return Promise.resolve([...localRoomTypes]);
  },
  
  createRoomType: async (data: Partial<RoomType>) => {
    const newType = { ...data, id: `rt_${Date.now()}`, is_active: true } as RoomType;
    localRoomTypes.push(newType);
    return Promise.resolve(newType);
  },

  updateRoomType: async (id: string, data: Partial<RoomType>) => {
    localRoomTypes = localRoomTypes.map(rt => rt.id === id ? { ...rt, ...data } : rt);
    return Promise.resolve(localRoomTypes.find(rt => rt.id === id));
  },

  deleteRoomType: async (id: string) => {
    localRoomTypes = localRoomTypes.filter(rt => rt.id !== id);
    return Promise.resolve(true);
  }
};

export default RoomControlService;
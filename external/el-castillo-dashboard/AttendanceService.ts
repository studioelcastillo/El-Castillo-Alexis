
import { 
  AttendanceDay, OnSitePresence, ZKTransaction, ZKDevice, 
  ZKEmployee, WorkShift, TimeValuationSettings, AttendanceStatus 
} from './types';
import { MOCK_USERS } from './constants';

const AttendanceService = {
  // 1. Sync & Data Fetching
  getDailyAttendance: async (date: string): Promise<AttendanceDay[]> => {
    await new Promise(r => setTimeout(r, 800));
    // Mock Logic: Transform raw punches to AttendanceDay
    return MOCK_USERS.filter(u => u.profile?.prof_name !== 'ADMINISTRADOR').map(user => {
        const hasPunch = Math.random() > 0.2;
        const worked = hasPunch ? 480 + (Math.random() * 60 - 30) : 0;
        const expected = 480;
        const late = hasPunch && Math.random() > 0.7 ? Math.floor(Math.random() * 20) : 0;
        
        return {
            id: `att_${user.user_id}_${date}`,
            user_id: user.user_id,
            full_name: `${user.user_name} ${user.user_surname}`,
            role: user.profile?.prof_name || 'MODELO',
            date: date,
            shift_name: 'Mañana (08:00 - 16:00)',
            check_in: hasPunch ? `${date}T08:${late.toString().padStart(2, '0')}:00` : undefined,
            check_out: hasPunch ? `${date}T16:${Math.floor(Math.random()*15).toString().padStart(2, '0')}:00` : undefined,
            worked_minutes: Math.floor(worked),
            expected_minutes: expected,
            late_minutes: late,
            early_leave_minutes: 0,
            overtime_minutes: worked > expected ? Math.floor(worked - expected) : 0,
            debt_minutes: worked < expected ? Math.floor(expected - worked) : 0,
            status: !hasPunch ? 'ABSENT' : late > 0 ? 'LATE' : 'PRESENT'
        };
    });
  },

  getOnSitePresence: async (): Promise<OnSitePresence[]> => {
    // Count people currently "In" with real mock photos
    return [
      { 
        user_id: 3990, 
        full_name: 'Jennifer Zuluaga', 
        role: 'MODELO', 
        check_in_time: '08:05 AM', 
        location: 'Sede Principal',
        photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
      },
      { 
        user_id: 3988, 
        full_name: 'Sofia Mosquera', 
        role: 'MONITOR', 
        check_in_time: '07:55 AM', 
        location: 'Sede Principal',
        photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
      },
      { 
        user_id: 3989, 
        full_name: 'Ana Acero', 
        role: 'MODELO', 
        check_in_time: '08:15 AM', 
        location: 'Sede Norte',
        photo_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80'
      },
    ];
  },

  getDevices: async (): Promise<ZKDevice[]> => {
    return [
      { id: '1', studio_id: '1', sn: 'CIK7210001', alias: 'Entrada Principal', status: 'ONLINE', area_name: 'Recepción', last_sync_at: new Date().toISOString() },
      { id: '2', studio_id: '1', sn: 'CIK7210002', alias: 'Salida Personal', status: 'OFFLINE', area_name: 'Pasillo A' }
    ];
  },

  getValuationSettings: async (): Promise<TimeValuationSettings> => {
      return {
          minute_debt_price: 200,
          hour_debt_price: 12000,
          overtime_hour_price: 15000,
          currency: 'COP'
      };
  },

  syncTransactions: async () => {
      await new Promise(r => setTimeout(r, 2000));
      return { success: true, count: 142 };
  }
};

export default AttendanceService;

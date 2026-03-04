import { api } from './api';
import UserService from './UserService';

export interface ShiftAssignmentParams {
  startDate: string;
  endDate: string;
}

const ShiftService = {
  // Fetch active users and categorize them into Monitors and Models
  getActiveStaff: async () => {
    try {
      // Fetch active users using the datatable endpoint
      const response = await UserService.getUsersDatatable({
        start: 0,
        length: 1000,
        activeusers: 'true',
        columns: 'users.user_id,users.user_image,users.user_identification,ma.modacc_username,users.user_name,users.user_surname,users.user_email,users.created_at,profiles.prof_name'
      });
      
      const users = response.data?.data || [];
      
      // Categorize based on profile name or ID
      // Assuming 'MONITOR' and 'MODELO' are the profile names
      const monitors = users.filter((u: any) => 
        u.profile?.prof_name?.toUpperCase().includes('MONITOR') || 
        u.prof_id === 3 // Fallback ID if name check fails
      ).map((u: any) => ({
        id: u.user_id.toString(),
        name: `${u.user_name} ${u.user_surname}`,
        currentShift: 's1', // Default mock shift
        modelsCount: 0,
        targetSum: 0,
        schedule: {} as Record<string, string | null>
      }));

      const models = users.filter((u: any) => 
        u.profile?.prof_name?.toUpperCase().includes('MODELO') || 
        u.prof_id === 4 // Fallback ID
      ).map((u: any) => ({
        id: u.user_id.toString(),
        name: `${u.user_name} ${u.user_surname}`,
        monitorId: null, // Default unassigned
        secondaryMonitorId: null,
        target: 500, // Mock target
        currentSales: Math.floor(Math.random() * 500), // Mock sales
        status: 'ACTIVE'
      }));

      if (monitors.length === 0 && models.length === 0) {
        throw new Error("No staff found, falling back to mock data");
      }

      return { monitors, models };
    } catch (error) {
      console.error("Error fetching staff for shifts, using mock data:", error);
      
      const mockMonitors = [
        { id: 'm1', name: 'Sofia Mosquera', currentShift: 's2', modelsCount: 5, targetSum: 2500, schedule: {} as Record<string, string | null> },
        { id: 'm2', name: 'Carlos Ruiz', currentShift: 's1', modelsCount: 4, targetSum: 2000, schedule: {} as Record<string, string | null> },
        { id: 'm3', name: 'Andrea Valencia', currentShift: 's3', modelsCount: 0, targetSum: 0, schedule: {} as Record<string, string | null> },
        { id: 'm4', name: 'Juan Perez', currentShift: 's1', modelsCount: 0, targetSum: 0, schedule: {} as Record<string, string | null> },
      ];

      const mockModels = [
        { id: 'mod1', name: 'Jennifer Zuluaga', monitorId: 'm1', secondaryMonitorId: null, target: 500, currentSales: 350, status: 'ACTIVE' },
        { id: 'mod2', name: 'Ana Acero', monitorId: 'm1', secondaryMonitorId: null, target: 600, currentSales: 620, status: 'ACTIVE' },
        { id: 'mod3', name: 'Laura Gómez', monitorId: 'm2', secondaryMonitorId: null, target: 450, currentSales: 100, status: 'ACTIVE' },
        { id: 'mod4', name: 'Camila Rojas', monitorId: null, secondaryMonitorId: null, target: 400, currentSales: 0, status: 'ACTIVE' },
        { id: 'mod5', name: 'Diana Silva', monitorId: null, secondaryMonitorId: null, target: 550, currentSales: 0, status: 'ACTIVE' },
        { id: 'mod6', name: 'Valentina Castro', monitorId: null, secondaryMonitorId: null, target: 500, currentSales: 0, status: 'ACTIVE' },
        { id: 'mod7', name: 'Isabella Muñoz', monitorId: null, secondaryMonitorId: null, target: 450, currentSales: 0, status: 'ACTIVE' },
      ];

      return { monitors: mockMonitors, models: mockModels };
    }
  },

  // Fetch shifts from the API
  getShifts: async (studioId: string = '1') => {
    try {
      const response = await api.get(`/studios_shifts?std_id=${studioId}`);
      const data = response.data?.data || [];
      return data.map((shift: any) => ({
        id: shift.stdshift_id.toString(),
        name: shift.stdshift_name,
        startTime: shift.start_time || '00:00',
        endTime: shift.end_time || '23:59',
        duration: 480, // Mock duration if not provided
        type: shift.stdshift_name.toLowerCase(),
        active: shift.active !== false
      }));
    } catch (error) {
      console.error("Error fetching shifts:", error);
      // Fallback to mock data if endpoint fails
      return [
        { id: 's1', name: 'Mañana', startTime: '06:00', endTime: '14:00', duration: 480, type: 'mañana', active: true },
        { id: 's2', name: 'Tarde', startTime: '14:00', endTime: '22:00', duration: 480, type: 'tarde', active: true },
        { id: 's3', name: 'Noche', startTime: '22:00', endTime: '06:00', duration: 480, type: 'noche', active: true },
        { id: 's4', name: 'Satélite', startTime: '00:00', endTime: '23:59', duration: 480, type: 'satelite', active: true },
        { id: 's5', name: '12 Horas', startTime: '08:00', endTime: '20:00', duration: 720, type: '12horas', active: true },
        { id: 's6', name: '4 Horas', startTime: '08:00', endTime: '12:00', duration: 240, type: '4horas', active: true },
      ];
    }
  }
};

export default ShiftService;

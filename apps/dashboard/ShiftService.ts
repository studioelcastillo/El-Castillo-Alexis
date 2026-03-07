import { supabase } from './supabaseClient';
import UserService from './UserService';
import { getCurrentStudioId } from './tenant';

export interface ShiftAssignmentParams {
  startDate: string;
  endDate: string;
}

export interface ShiftTemplate {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: string;
  active: boolean;
}

export interface ShiftSettings {
  dailyMinutes: number;
  tolerance: number;
  penaltyAmount: number;
  doubleLate: boolean;
  doubleMissing: boolean;
  notAccumulative: boolean;
}

const formatTimeField = (value: any) => {
  if (!value) return '00:00';
  if (typeof value === 'string') {
    if (value.length >= 5) return value.slice(0, 5);
    return value;
  }
  return '00:00';
};

const getDurationMinutes = (startTime: string, endTime: string) => {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if (!Number.isFinite(sh) || !Number.isFinite(sm) || !Number.isFinite(eh) || !Number.isFinite(em)) {
    return 0;
  }
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  if (end >= start) return end - start;
  return 24 * 60 - start + end;
};

const getStudioId = () => getCurrentStudioId();

const ShiftService = {
  // Fetch active users and categorize them into Monitors and Models
  getActiveStaff: async () => {
    try {
      const response = await UserService.getUsersDatatable({
        start: 0,
        length: 1000,
        activeusers: 'true',
        columns:
          'users.user_id,users.user_image,users.user_identification,ma.modacc_username,users.user_name,users.user_surname,users.user_email,users.created_at,profiles.prof_name',
      });

      const users = response.data?.data || [];

      const monitors = users
        .filter(
          (u: any) => u.profile?.prof_name?.toUpperCase().includes('MONITOR') || u.prof_id === 3
        )
        .map((u: any) => ({
          id: u.user_id.toString(),
          name: `${u.user_name} ${u.user_surname}`,
          currentShift: null,
          modelsCount: 0,
          targetSum: 0,
          schedule: {} as Record<string, string | null>,
        }));

      const models = users
        .filter((u: any) => u.profile?.prof_name?.toUpperCase().includes('MODELO') || u.prof_id === 4)
        .map((u: any) => ({
          id: u.user_id.toString(),
          name: `${u.user_name} ${u.user_surname}`,
          monitorId: null,
          secondaryMonitorId: null,
          target: 0,
          currentSales: 0,
          status: 'ACTIVE',
        }));

      return { monitors, models };
    } catch (error) {
      console.error('Error fetching staff for shifts:', error);
      return { monitors: [], models: [] };
    }
  },

  getShifts: async (): Promise<ShiftTemplate[]> => {
    const { data, error } = await supabase.from('studios_shifts').select('*').order('stdshift_id');

    if (error) {
      console.error('Error fetching shifts:', error);
      return [];
    }

    return (data || []).map((shift: any) => {
      const startTime = formatTimeField(shift.start_time);
      const endTime = formatTimeField(shift.end_time);
      return {
        id: shift.stdshift_id.toString(),
        name: shift.stdshift_name,
        startTime,
        endTime,
        duration: getDurationMinutes(startTime, endTime),
        type: shift.stdshift_name?.toLowerCase() || 'shift',
        active: shift.active !== false,
      } as ShiftTemplate;
    });
  },

  createShift: async (shift: Omit<ShiftTemplate, 'id' | 'duration' | 'type'>): Promise<ShiftTemplate> => {
    const { data, error } = await supabase
      .from('studios_shifts')
      .insert([
        {
          stdshift_name: shift.name,
          start_time: shift.startTime,
          end_time: shift.endTime,
          active: shift.active,
        },
      ])
      .select('*')
      .single();

    if (error || !data) {
      throw new Error('No se pudo crear el turno');
    }

    const startTime = formatTimeField(data.start_time);
    const endTime = formatTimeField(data.end_time);
    return {
      id: data.stdshift_id.toString(),
      name: data.stdshift_name,
      startTime,
      endTime,
      duration: getDurationMinutes(startTime, endTime),
      type: data.stdshift_name?.toLowerCase() || 'shift',
      active: data.active !== false,
    } as ShiftTemplate;
  },

  updateShift: async (shift: ShiftTemplate): Promise<ShiftTemplate> => {
    const { data, error } = await supabase
      .from('studios_shifts')
      .update({
        stdshift_name: shift.name,
        start_time: shift.startTime,
        end_time: shift.endTime,
        active: shift.active,
      })
      .eq('stdshift_id', Number(shift.id))
      .select('*')
      .single();

    if (error || !data) {
      throw new Error('No se pudo actualizar el turno');
    }

    const startTime = formatTimeField(data.start_time);
    const endTime = formatTimeField(data.end_time);
    return {
      id: data.stdshift_id.toString(),
      name: data.stdshift_name,
      startTime,
      endTime,
      duration: getDurationMinutes(startTime, endTime),
      type: data.stdshift_name?.toLowerCase() || 'shift',
      active: data.active !== false,
    } as ShiftTemplate;
  },

  getMonitorSchedules: async (params: ShiftAssignmentParams) => {
    const stdId = getStudioId();
    let query = supabase
      .from('shift_monitor_schedules')
      .select('monitor_user_id,schedule_date,shift_id,is_day_off')
      .gte('schedule_date', params.startDate)
      .lte('schedule_date', params.endDate);

    if (stdId) {
      query = query.eq('std_id', stdId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching monitor schedules:', error);
      return {} as Record<string, Record<string, string | null>>;
    }

    const scheduleMap: Record<string, Record<string, string | null>> = {};
    (data || []).forEach((row: any) => {
      const monitorId = row.monitor_user_id?.toString();
      if (!monitorId) return;
      if (!scheduleMap[monitorId]) scheduleMap[monitorId] = {};
      scheduleMap[monitorId][row.schedule_date] = row.is_day_off ? null : row.shift_id?.toString() || null;
    });

    return scheduleMap;
  },

  saveMonitorSchedule: async (payload: { monitorId: string; date: string; shiftId: string | null }) => {
    const stdId = getStudioId();
    const { error } = await supabase
      .from('shift_monitor_schedules')
      .upsert(
        [
          {
            std_id: stdId,
            monitor_user_id: Number(payload.monitorId),
            schedule_date: payload.date,
            shift_id: payload.shiftId ? Number(payload.shiftId) : null,
            is_day_off: payload.shiftId ? false : true,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'monitor_user_id,schedule_date' }
      );

    if (error) {
      throw new Error('No se pudo actualizar el horario');
    }
  },

  saveMonitorScheduleBatch: async (payload: { monitorId: string; dates: string[]; shiftId: string | null }) => {
    if (payload.dates.length === 0) return;
    const stdId = getStudioId();
    const records = payload.dates.map((date) => ({
      std_id: stdId,
      monitor_user_id: Number(payload.monitorId),
      schedule_date: date,
      shift_id: payload.shiftId ? Number(payload.shiftId) : null,
      is_day_off: payload.shiftId ? false : true,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('shift_monitor_schedules')
      .upsert(records, { onConflict: 'monitor_user_id,schedule_date' });

    if (error) {
      throw new Error('No se pudieron guardar los horarios');
    }
  },

  getModelAssignments: async () => {
    const stdId = getStudioId();
    let query = supabase
      .from('shift_model_assignments')
      .select(
        'model_user_id,monitor_user_id,secondary_monitor_user_id,start_date,end_date,is_active,weekly_target,current_sales'
      );

    if (stdId) {
      query = query.eq('std_id', stdId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching model assignments:', error);
      return {} as Record<
        string,
        {
          monitorId: string | null;
          secondaryMonitorId: string | null;
          weeklyTarget: number;
          currentSales: number;
          isActive: boolean;
        }
      >;
    }

    const assignmentMap: Record<
      string,
      {
        monitorId: string | null;
        secondaryMonitorId: string | null;
        weeklyTarget: number;
        currentSales: number;
        isActive: boolean;
      }
    > = {};

    (data || []).forEach((row: any) => {
      if (!row.model_user_id) return;
      assignmentMap[row.model_user_id.toString()] = {
        monitorId: row.monitor_user_id ? row.monitor_user_id.toString() : null,
        secondaryMonitorId: row.secondary_monitor_user_id ? row.secondary_monitor_user_id.toString() : null,
        weeklyTarget: Number(row.weekly_target || 0),
        currentSales: Number(row.current_sales || 0),
        isActive: row.is_active !== false,
      };
    });

    return assignmentMap;
  },

  saveModelAssignment: async (payload: {
    modelId: string;
    monitorId: string | null;
    secondaryMonitorId: string | null;
    startDate: string;
    endDate: string;
    weeklyTarget?: number;
    currentSales?: number;
  }) => {
    const stdId = getStudioId();
    const { error } = await supabase
      .from('shift_model_assignments')
      .upsert(
        [
          {
            std_id: stdId,
            model_user_id: Number(payload.modelId),
            monitor_user_id: payload.monitorId ? Number(payload.monitorId) : null,
            secondary_monitor_user_id: payload.secondaryMonitorId ? Number(payload.secondaryMonitorId) : null,
            start_date: payload.startDate,
            end_date: payload.endDate,
            is_active: payload.monitorId ? true : false,
            weekly_target: payload.weeklyTarget ?? 0,
            current_sales: payload.currentSales ?? 0,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'model_user_id' }
      );

    if (error) {
      throw new Error('No se pudo guardar la asignacion del modelo');
    }
  },

  getAttendanceDaily: async (date: string) => {
    const stdId = getStudioId();
    let query = supabase
      .from('attendance_daily')
      .select(
        'att_day_id,user_id,full_name,att_date,work_shift_id,shift_name,check_in,check_out,worked_minutes,late_minutes,early_leave_minutes,debt_minutes,penalty_paid,penalty_applied,penalty_amount'
      )
      .eq('att_date', date)
      .order('full_name', { ascending: true });

    if (stdId) {
      query = query.eq('std_id', stdId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching attendance:', error);
      return [] as any[];
    }

    return (data || []).map((row: any) => ({
      id: row.att_day_id?.toString(),
      modelId: row.user_id?.toString(),
      fullName: row.full_name,
      date: row.att_date,
      shiftId: row.work_shift_id?.toString() || null,
      shiftName: row.shift_name || '-',
      checkin: row.check_in,
      checkout: row.check_out,
      workedMinutes: Number(row.worked_minutes || 0),
      lateMinutes: Number(row.late_minutes || 0),
      missingMinutes: Number(row.debt_minutes || row.early_leave_minutes || 0),
      minutesToPay: Number(row.debt_minutes || 0),
      paid: row.penalty_paid === true,
      penaltyApplied: row.penalty_applied === true,
      penaltyAmount: Number(row.penalty_amount || 0),
    }));
  },

  updateAttendancePenalty: async (payload: { recordId: string; action: 'pay' | 'waive' }) => {
    const stdId = getStudioId();
    const update: any = {};
    if (payload.action === 'pay') {
      update.penalty_paid = true;
      update.penalty_applied = false;
    }
    if (payload.action === 'waive') {
      update.penalty_applied = false;
    }

    const { error } = await supabase
      .from('attendance_daily')
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq('std_id', stdId)
      .eq('att_day_id', Number(payload.recordId));

    if (error) {
      throw new Error('No se pudo actualizar la penalizacion');
    }
  },

  getShiftSettings: async (): Promise<ShiftSettings> => {
    const stdId = getStudioId();
    let query = supabase
      .from('shift_settings')
      .select('*')
      .eq('settings_key', 'default');

    if (stdId) {
      query = query.eq('std_id', stdId);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      return {
        dailyMinutes: 480,
        tolerance: 0,
        penaltyAmount: 0,
        doubleLate: true,
        doubleMissing: true,
        notAccumulative: true,
      };
    }

    return {
      dailyMinutes: Number(data.daily_minutes || 0),
      tolerance: Number(data.tolerance_minutes || 0),
      penaltyAmount: Number(data.penalty_amount || 0),
      doubleLate: data.double_late === true,
      doubleMissing: data.double_missing === true,
      notAccumulative: data.not_accumulative === true,
    };
  },

  saveShiftSettings: async (settings: ShiftSettings) => {
    const stdId = getStudioId();
    const { error } = await supabase
      .from('shift_settings')
      .upsert(
        [
          {
            settings_key: 'default',
            std_id: stdId,
            daily_minutes: settings.dailyMinutes,
            tolerance_minutes: settings.tolerance,
            penalty_amount: settings.penaltyAmount,
            double_late: settings.doubleLate,
            double_missing: settings.doubleMissing,
            not_accumulative: settings.notAccumulative,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'settings_key,std_id' }
      );

    if (error) {
      throw new Error('No se pudo guardar la configuracion');
    }
  },
};

export default ShiftService;

import { supabase } from './supabaseClient';
import {
  AttendanceDay,
  OnSitePresence,
  ZKDevice,
  ZKEmployee,
  ZKTransaction,
  TimeValuationSettings,
} from './types';

const toNumber = (value: any) => (Number.isFinite(Number(value)) ? Number(value) : 0);

const AttendanceService = {
  async getDailyAttendance(date: string): Promise<AttendanceDay[]> {
    const { data, error } = await supabase
      .from('attendance_daily')
      .select('*')
      .eq('att_date', date)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Attendance daily error', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: String(row.att_day_id),
      user_id: row.user_id,
      full_name: row.full_name || 'Usuario',
      role: row.role_name || 'MODELO',
      date: row.att_date,
      shift_name: row.shift_name || '',
      check_in: row.check_in || undefined,
      check_out: row.check_out || undefined,
      worked_minutes: toNumber(row.worked_minutes),
      expected_minutes: toNumber(row.expected_minutes),
      late_minutes: toNumber(row.late_minutes),
      early_leave_minutes: toNumber(row.early_leave_minutes),
      overtime_minutes: toNumber(row.overtime_minutes),
      debt_minutes: toNumber(row.debt_minutes),
      status: row.status || 'PRESENT',
    }));
  },

  async getOnSitePresence(): Promise<OnSitePresence[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('attendance_daily')
      .select('user_id, full_name, role_name, check_in, check_out')
      .eq('att_date', today)
      .is('check_out', null);

    if (error) {
      console.error('Attendance presence error', error);
      return [];
    }

    const userIds = (data || []).map((row: any) => row.user_id).filter(Boolean);
    const { data: users } = userIds.length
      ? await supabase
          .from('users')
          .select('user_id, user_photo_url, std_id')
          .in('user_id', userIds)
      : { data: [] };

    const studioIds = [...new Set((users || []).map((u: any) => u.std_id).filter(Boolean))];
    const { data: studios } = studioIds.length
      ? await supabase
          .from('studios')
          .select('std_id, std_name')
          .in('std_id', studioIds)
      : { data: [] };

    const studioMap = new Map((studios || []).map((row: any) => [row.std_id, row.std_name]));
    const userMap = new Map((users || []).map((row: any) => [row.user_id, row]));

    return (data || []).map((row: any) => {
      const user = userMap.get(row.user_id);
      return {
        user_id: row.user_id,
        full_name: row.full_name || 'Usuario',
        role: row.role_name || 'MODELO',
        check_in_time: row.check_in ? new Date(row.check_in).toLocaleTimeString() : '--',
        location: user?.std_id ? studioMap.get(user.std_id) || 'Sede' : 'Sede',
        photo_url: user?.user_photo_url || undefined,
      };
    });
  },

  async getDevices(): Promise<ZKDevice[]> {
    const { data, error } = await supabase
      .from('attendance_devices')
      .select('*')
      .order('device_alias', { ascending: true });

    if (error) {
      console.error('Attendance devices error', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: String(row.att_device_id),
      studio_id: String(row.std_id || ''),
      sn: row.device_sn,
      alias: row.device_alias || row.device_sn,
      ip_address: row.device_ip || undefined,
      area_name: row.device_area_name || undefined,
      last_sync_at: row.last_sync_at || undefined,
      status: row.device_status || 'OFFLINE',
    }));
  },

  async getEmployees(): Promise<ZKEmployee[]> {
    const { data, error } = await supabase
      .from('attendance_employees')
      .select(
        'att_emp_id, std_id, emp_code, first_name, last_name, department, linked_user_id, is_active, users(user_id, user_name, user_surname, user_photo_url, prof_id, profiles(prof_name))'
      )
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Attendance employees error', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: String(row.att_emp_id),
      studio_id: String(row.std_id || ''),
      emp_code: row.emp_code,
      first_name: row.first_name,
      last_name: row.last_name,
      department: row.department || undefined,
      linked_user_id: row.linked_user_id || undefined,
      is_active: row.is_active !== false,
      user_name: row.users?.user_name,
      user_surname: row.users?.user_surname,
      user_photo_url: row.users?.user_photo_url,
      profile_name: row.users?.profiles?.prof_name,
    }));
  },

  async getTransactions(limit = 200): Promise<ZKTransaction[]> {
    const { data, error } = await supabase
      .from('attendance_transactions')
      .select('att_tran_id, std_id, emp_code, punch_time, punch_state, terminal_sn, verify_type')
      .order('punch_time', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Attendance transactions error', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: String(row.att_tran_id),
      studio_id: String(row.std_id || ''),
      emp_code: row.emp_code,
      punch_time: row.punch_time,
      punch_state: row.punch_state,
      terminal_sn: row.terminal_sn,
      verify_type: row.verify_type,
    }));
  },

  async getValuationSettings(): Promise<TimeValuationSettings> {
    const { data, error } = await supabase
      .from('settings')
      .select('set_value')
      .eq('set_key', 'attendance_valuation')
      .maybeSingle();

    if (error) {
      console.error('Attendance valuation error', error);
    }

    if (data?.set_value) {
      try {
        const parsed = JSON.parse(data.set_value);
        return {
          minute_debt_price: toNumber(parsed.minute_debt_price),
          hour_debt_price: toNumber(parsed.hour_debt_price),
          overtime_hour_price: toNumber(parsed.overtime_hour_price),
          currency: parsed.currency || 'COP',
        };
      } catch (parseError) {
        console.error('Attendance valuation parse error', parseError);
      }
    }

    return {
      minute_debt_price: 200,
      hour_debt_price: 12000,
      overtime_hour_price: 15000,
      currency: 'COP',
    };
  },

  async syncTransactions() {
    return { success: true, count: 0 };
  },
};

export default AttendanceService;

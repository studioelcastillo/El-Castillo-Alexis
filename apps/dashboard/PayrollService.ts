import { supabase } from './supabaseClient';

const toNumber = (value: any) => (Number.isFinite(Number(value)) ? Number(value) : 0);

const buildFullName = (row: any) =>
  [row.user_name, row.user_name2, row.user_surname, row.user_surname2].filter(Boolean).join(' ').trim();

const PayrollService = {
  async getPayrollPeriods(params: { std_id?: number } = {}) {
    let query = supabase
      .from('payroll_periods')
      .select('*')
      .order('payroll_period_start_date', { ascending: false });

    if (params.std_id) query = query.eq('std_id', params.std_id);

    const { data, error } = await query;
    return { data: data || [], error };
  },

  async autoGeneratePeriod(params: { std_id: number; target_date?: string }) {
    const targetDate = params.target_date || new Date().toISOString().split('T')[0];

    const { data: studio } = await supabase
      .from('studios')
      .select('payroll_liquidation_interval')
      .eq('std_id', params.std_id)
      .single();

    const interval = studio?.payroll_liquidation_interval || 'MENSUAL';
    const startDate = new Date(targetDate);
    let endDate = new Date(targetDate);

    if (interval === 'SEMANAL') {
      const day = startDate.getDay();
      startDate.setDate(startDate.getDate() - (day === 0 ? 6 : day - 1));
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
    } else if (interval === 'QUINCENAL') {
      if (startDate.getDate() <= 15) {
        startDate.setDate(1);
        endDate.setDate(15);
      } else {
        startDate.setDate(16);
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      }
    } else {
      startDate.setDate(1);
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    }

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const { data: existing } = await supabase
      .from('payroll_periods')
      .select('payroll_period_id')
      .eq('std_id', params.std_id)
      .eq('payroll_period_start_date', formatDate(startDate))
      .eq('payroll_period_end_date', formatDate(endDate));

    if (existing && existing.length > 0) {
      return { data: existing[0], error: null };
    }

    const { data, error } = await supabase
      .from('payroll_periods')
      .insert([
        {
          std_id: params.std_id,
          payroll_period_start_date: formatDate(startDate),
          payroll_period_end_date: formatDate(endDate),
          payroll_period_state: 'ABIERTO',
          payroll_period_interval: interval,
          is_auto_generated: true,
        },
      ])
      .select()
      .single();

    return { data, error };
  },

  async closePeriod(periodId: number) {
    const { data, error } = await supabase
      .from('payroll_periods')
      .update({ payroll_period_state: 'CERRADO' })
      .eq('payroll_period_id', periodId)
      .select()
      .single();
    return { data, error };
  },

  async openPeriod(periodId: number) {
    const { data, error } = await supabase
      .from('payroll_periods')
      .update({ payroll_period_state: 'ABIERTO' })
      .eq('payroll_period_id', periodId)
      .select()
      .single();
    return { data, error };
  },

  async deletePeriod(periodId: number) {
    const { error } = await supabase
      .from('payroll_periods')
      .delete()
      .eq('payroll_period_id', periodId);
    return { error };
  },

  async getPayrollTransactions(params: { payroll_period_id: number; std_id?: number }) {
    let stdmodIds: number[] | null = null;

    if (params.std_id) {
      const { data: stdmods } = await supabase
        .from('studios_models')
        .select('stdmod_id')
        .eq('std_id', params.std_id);
      stdmodIds = (stdmods || []).map((row: any) => row.stdmod_id).filter(Boolean);
      if (!stdmodIds.length) return { data: [], error: null };
    }

    let query = supabase
      .from('payroll_transactions')
      .select(
        '*, payroll_period:payroll_periods(payroll_period_state), studios_models(stdmod_id, std_id, studios(std_name)), users(user_name, user_surname)'
      )
      .eq('payroll_period_id', params.payroll_period_id);

    if (stdmodIds) {
      query = query.in('stdmod_id', stdmodIds);
    }

    const { data, error } = await query;
    return { data: data || [], error };
  },

  async getPaymentPlainData(params: { payroll_period_id: number; std_id?: number; bank?: string }) {
    let stdmodIds: number[] | null = null;

    if (params.std_id) {
      const { data: stdmods } = await supabase
        .from('studios_models')
        .select('stdmod_id')
        .eq('std_id', params.std_id);
      stdmodIds = (stdmods || []).map((row: any) => row.stdmod_id).filter(Boolean);
      if (!stdmodIds.length) return { data: [], error: null };
    }

    let query = supabase
      .from('payroll_transactions')
      .select(
        'payroll_trans_id, payroll_period_id, stdmod_id, employee_id, total_salary, commissions, total_deducciones, total_neto, users(user_id, user_name, user_name2, user_surname, user_surname2, user_identification, user_bank_entity, user_bank_account, user_bank_account_type, user_beneficiary_name, user_beneficiary_document), studios_models(std_id, studios(std_name))'
      )
      .eq('payroll_period_id', params.payroll_period_id);

    if (stdmodIds) {
      query = query.in('stdmod_id', stdmodIds);
    }

    const { data, error } = await query;
    const bankFilter = params.bank ? params.bank.toUpperCase() : null;

    const mapped = (data || []).map((row: any) => {
      const user = row.users || {};
      const amount =
        toNumber(row.total_neto) ||
        toNumber(row.total_salary) + toNumber(row.commissions) - toNumber(row.total_deducciones);
      const ownerName = (user.user_beneficiary_name || buildFullName(user) || '').trim();
      const ownerDocument = user.user_beneficiary_document || user.user_identification || '';

      return {
        payroll_trans_id: row.payroll_trans_id,
        payroll_period_id: row.payroll_period_id,
        std_id: row.studios_models?.std_id || null,
        studio_name: row.studios_models?.studios?.std_name || '',
        user_id: row.employee_id || user.user_id || null,
        user_name: buildFullName(user),
        bank_entity: user.user_bank_entity || '',
        bank_account: user.user_bank_account || '',
        bank_account_type: user.user_bank_account_type || '',
        owner_name: ownerName,
        owner_document: ownerDocument,
        amount: toNumber(amount),
      };
    });

    const filtered = bankFilter
      ? mapped.filter((row: any) => (row.bank_entity || '').toUpperCase() === bankFilter)
      : mapped;

    return { data: filtered, error };
  },

  async previewPayroll(params: { std_id: number; payroll_period_id: number; commission_period_ids?: number[] }) {
    const { std_id, payroll_period_id, commission_period_ids } = params;

    const { data: studioModels } = await supabase
      .from('studios_models')
      .select('*, users(user_id, user_name, user_surname, user_identification)')
      .eq('std_id', std_id)
      .eq('stdmod_active', true)
      .eq('stdmod_contract_type', 'LABORAL');

    const employees = studioModels || [];
    const payrollData: any[] = [];

    for (const sm of employees) {
      const user = sm.users || {};
      const baseSalary = toNumber(sm.stdmod_monthly_salary || 0);

      let commissions = 0;
      const commissionDetails: any[] = [];

      if (commission_period_ids && commission_period_ids.length > 0) {
        const { data: streams } = await supabase
          .from('models_streams')
          .select(
            'modstr_earnings_cop, modacc_id, models_accounts(stdmod_id, studios_models(user_id_model, users(user_name, user_surname)))'
          )
          .eq('std_id', std_id)
          .in('period_id', commission_period_ids);

        const commPercent = toNumber(sm.stdmod_percent || 0);
        const earningsByModel: Record<string, number> = {};
        (streams || []).forEach((s: any) => {
          const modelName = s.models_accounts?.studios_models?.users
            ? `${s.models_accounts.studios_models.users.user_name} ${s.models_accounts.studios_models.users.user_surname}`
            : 'Desconocido';
          if (!earningsByModel[modelName]) earningsByModel[modelName] = 0;
          earningsByModel[modelName] += toNumber(s.modstr_earnings_cop || 0);
        });

        Object.entries(earningsByModel).forEach(([modelName, totalEarnings]) => {
          const commission = totalEarnings * (commPercent / 100);
          commissions += commission;
          commissionDetails.push({
            model_name: modelName,
            commission_percentage: commPercent,
            total_earnings: totalEarnings,
            commission_amount: commission,
          });
        });
      }

      const { data: concepts } = await supabase
        .from('payroll_concepts')
        .select('*')
        .eq('payroll_period_id', payroll_period_id)
        .eq('stdmod_id', sm.stdmod_id);

      let extraHoursTotal = 0;
      const salaryComposition: any[] = [
        {
          concepto: 'Salario base',
          porcentaje: '100.00',
          valor: baseSalary,
          isEditable: false,
        },
      ];

      (concepts || []).forEach((c: any) => {
        extraHoursTotal += toNumber(c.concept_total || 0);
        salaryComposition.push({
          concepto: c.concept_description || c.concept_type,
          porcentaje: c.concept_surcharge_percentage,
          valor: toNumber(c.concept_total || 0),
          isEditable: true,
          concept_id: c.payroll_concept_id,
        });
      });

      const totalSalary = baseSalary + extraHoursTotal;

      const prestaciones = {
        prima: totalSalary * 0.0833,
        cesantias: totalSalary * 0.0833,
        intereses_cesantias: totalSalary * 0.0833 * 0.12,
        vacaciones: totalSalary * 0.0417,
      };

      const socialSecurity = {
        salud_empleador: totalSalary * 0.085,
        pension_empleador: totalSalary * 0.12,
        arl: totalSalary * 0.00522,
        salud_empleado: totalSalary * 0.04,
        pension_empleado: totalSalary * 0.04,
      };

      const parafiscales = {
        sena: sm.stdmod_has_sena ? totalSalary * 0.02 : 0,
        icbf: sm.stdmod_has_icbf ? totalSalary * 0.03 : 0,
        caja: sm.stdmod_has_caja_compensacion ? totalSalary * 0.04 : 0,
      };

      const totalDeducciones = socialSecurity.salud_empleado + socialSecurity.pension_empleado;
      const totalNeto = totalSalary + commissions - totalDeducciones;

      payrollData.push({
        employee_id: user.user_id,
        employee_name: `${user.user_name || ''} ${user.user_surname || ''}`.trim(),
        stdmod_id: sm.stdmod_id,
        total_salary: totalSalary,
        commissions,
        total_deducciones: totalDeducciones,
        total_neto: totalNeto,
        prestaciones,
        social_security: socialSecurity,
        parafiscales,
        salary_composition: salaryComposition,
        commission_details: commissionDetails,
      });
    }

    return { data: payrollData, error: null };
  },

  async processPayroll(params: { std_id: number; payroll_period_id: number; commission_period_ids?: number[] }) {
    const { std_id, payroll_period_id, commission_period_ids } = params;
    const preview = await PayrollService.previewPayroll(params);
    const payrollData = preview.data || [];

    if (payrollData.length === 0) {
      return { data: [], error: new Error('No hay empleados para liquidar') };
    }

    const records = payrollData.map((emp: any) => ({
      payroll_period_id,
      stdmod_id: emp.stdmod_id,
      employee_id: emp.employee_id,
      employee_name: emp.employee_name,
      total_salary: emp.total_salary,
      commissions: emp.commissions,
      total_deducciones: emp.total_deducciones,
      total_neto: emp.total_neto,
      prestaciones: emp.prestaciones,
      social_security: emp.social_security,
      parafiscales: emp.parafiscales,
      salary_composition: emp.salary_composition,
      commission_details: emp.commission_details,
      commission_periods: commission_period_ids || [],
    }));

    const { data, error } = await supabase
      .from('payroll_transactions')
      .insert(records)
      .select();

    if (error) return { data: [], error };

    await supabase
      .from('payroll_periods')
      .update({ payroll_period_state: 'LIQUIDADO' })
      .eq('payroll_period_id', payroll_period_id);

    return { data: data || [], error: null };
  },
};

export default PayrollService;

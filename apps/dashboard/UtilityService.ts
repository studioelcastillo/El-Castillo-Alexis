import {
  TenantCompany,
  Sede,
  CostCenter,
  Area,
  IncomeLine,
  UtilityPeriod,
  IncomeRecord,
  ExpenseCatalog,
  ExpenseRecord,
  AssignmentRule,
  ThirdParty,
  AccountPayable,
  EmployeeLoan,
  FinancialMovement,
  CompanyFinanceParams,
  Partner,
  UtilityKPIs,
  UtilityAuditLog,
} from './types';
import { supabase } from './supabaseClient';
import { getStoredUser } from './session';

const toNumber = (value: any) => (Number.isFinite(Number(value)) ? Number(value) : 0);

const logAudit = async (payload: {
  companyId: string;
  userId?: string;
  entity: string;
  entityId: string;
  action: string;
  before?: any;
  after?: any;
}) => {
  const { companyId, userId, entity, entityId, action, before, after } = payload;
  await supabase.from('utility_audit_logs').insert([
    {
      utility_company_id: Number(companyId),
      user_id: userId || getStoredUser()?.user_id?.toString() || null,
      entity,
      entity_id: entityId,
      action,
      before_json: before || null,
      after_json: after || null,
    },
  ]);
};

const UtilityService = {
  async getCompanies(): Promise<TenantCompany[]> {
    const { data, error } = await supabase
      .from('utility_companies')
      .select('*')
      .order('company_name', { ascending: true });

    if (error) {
      console.error('Utility getCompanies error', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: String(row.utility_company_id),
      name: row.company_name,
      active: row.is_active !== false,
      demo: row.is_demo === true,
    }));
  },

  async getSedes(companyId: string): Promise<Sede[]> {
    const { data, error } = await supabase
      .from('utility_sedes')
      .select('*')
      .eq('utility_company_id', Number(companyId))
      .order('sede_name', { ascending: true });

    if (error) {
      console.error('Utility getSedes error', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: String(row.utility_sede_id),
      company_id: String(row.utility_company_id),
      name: row.sede_name,
      active: row.is_active !== false,
    }));
  },

  async getCostCenters(sedeId: string): Promise<CostCenter[]> {
    const { data, error } = await supabase
      .from('utility_cost_centers')
      .select('*')
      .eq('utility_sede_id', Number(sedeId))
      .order('center_name', { ascending: true });

    if (error) {
      console.error('Utility getCostCenters error', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: String(row.utility_cost_center_id),
      sede_id: String(row.utility_sede_id),
      code: row.center_code,
      name: row.center_name,
      active: row.is_active !== false,
    }));
  },

  async getAreas(sedeId: string): Promise<Area[]> {
    const { data, error } = await supabase
      .from('utility_areas')
      .select('*')
      .eq('utility_sede_id', Number(sedeId))
      .order('area_name', { ascending: true });

    if (error) {
      console.error('Utility getAreas error', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: String(row.utility_area_id),
      sede_id: String(row.utility_sede_id),
      name: row.area_name,
      active: row.is_active !== false,
    }));
  },

  async getIncomeLines(companyId: string): Promise<IncomeLine[]> {
    const { data, error } = await supabase
      .from('utility_income_lines')
      .select('*')
      .eq('utility_company_id', Number(companyId))
      .eq('is_active', true)
      .order('line_name', { ascending: true });

    if (error) {
      console.error('Utility getIncomeLines error', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: String(row.utility_income_line_id),
      company_id: String(row.utility_company_id),
      name: row.line_name,
      category: row.line_category,
      active: row.is_active !== false,
    }));
  },

  async addIncomeLine(line: Omit<IncomeLine, 'id'>): Promise<IncomeLine> {
    const payload = {
      utility_company_id: Number(line.company_id),
      line_name: line.name,
      line_category: line.category,
      is_active: line.active !== false,
    };

    const { data, error } = await supabase
      .from('utility_income_lines')
      .insert([payload])
      .select('*')
      .single();

    if (error || !data) {
      throw new Error('No se pudo crear la linea de ingreso');
    }

    return {
      id: String(data.utility_income_line_id),
      company_id: String(data.utility_company_id),
      name: data.line_name,
      category: data.line_category,
      active: data.is_active !== false,
    };
  },

  async deleteIncomeLine(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('utility_income_lines')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('utility_income_line_id', Number(id));

    if (error) {
      throw new Error('No se pudo eliminar la linea de ingreso');
    }
    return true;
  },

  async getExpenseCatalog(companyId: string): Promise<ExpenseCatalog[]> {
    const { data, error } = await supabase
      .from('utility_expense_catalog')
      .select('*')
      .eq('utility_company_id', Number(companyId))
      .eq('is_active', true)
      .order('catalog_name', { ascending: true });

    if (error) {
      console.error('Utility getExpenseCatalog error', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: String(row.utility_expense_catalog_id),
      company_id: String(row.utility_company_id),
      name: row.catalog_name,
      category: row.catalog_category,
      subcategory: row.catalog_subcategory || undefined,
      type: row.expense_type || 'OPERATIVO',
      recurrent: row.recurrent === true,
      frequency: row.frequency || 'MENSUAL',
      every_n_months: row.every_n_months || undefined,
      fixed_value: row.fixed_value === true,
      base_value: row.base_value ? toNumber(row.base_value) : undefined,
      currency: row.currency || 'COP',
      default_scope: row.default_scope || 'COMPANY',
      scope_id: row.scope_id || undefined,
      provider_id: row.provider_id || undefined,
      requires_assignment: row.requires_assignment === true,
      active: row.is_active !== false,
    }));
  },

  async addExpenseCatalogItem(item: Omit<ExpenseCatalog, 'id'>): Promise<ExpenseCatalog> {
    const payload = {
      utility_company_id: Number(item.company_id),
      catalog_name: item.name,
      catalog_category: item.category,
      catalog_subcategory: item.subcategory || null,
      expense_type: item.type || 'OPERATIVO',
      recurrent: item.recurrent === true,
      frequency: item.frequency || 'MENSUAL',
      every_n_months: item.every_n_months || null,
      fixed_value: item.fixed_value === true,
      base_value: item.base_value || null,
      currency: item.currency || 'COP',
      default_scope: item.default_scope || 'COMPANY',
      scope_id: item.scope_id || null,
      provider_id: item.provider_id || null,
      requires_assignment: item.requires_assignment === true,
      is_active: item.active !== false,
    };

    const { data, error } = await supabase
      .from('utility_expense_catalog')
      .insert([payload])
      .select('*')
      .single();

    if (error || !data) {
      throw new Error('No se pudo crear el catalogo de gastos');
    }

    return {
      id: String(data.utility_expense_catalog_id),
      company_id: String(data.utility_company_id),
      name: data.catalog_name,
      category: data.catalog_category,
      subcategory: data.catalog_subcategory || undefined,
      type: data.expense_type || 'OPERATIVO',
      recurrent: data.recurrent === true,
      frequency: data.frequency || 'MENSUAL',
      every_n_months: data.every_n_months || undefined,
      fixed_value: data.fixed_value === true,
      base_value: data.base_value ? toNumber(data.base_value) : undefined,
      currency: data.currency || 'COP',
      default_scope: data.default_scope || 'COMPANY',
      scope_id: data.scope_id || undefined,
      provider_id: data.provider_id || undefined,
      requires_assignment: data.requires_assignment === true,
      active: data.is_active !== false,
    };
  },

  async deleteExpenseCatalogItem(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('utility_expense_catalog')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('utility_expense_catalog_id', Number(id));

    if (error) {
      throw new Error('No se pudo eliminar el catalogo de gastos');
    }
    return true;
  },

  async getPartners(companyId: string): Promise<Partner[]> {
    const { data, error } = await supabase
      .from('utility_partners')
      .select('*')
      .eq('utility_company_id', Number(companyId))
      .order('partner_name', { ascending: true });

    if (error) {
      console.error('Utility getPartners error', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: String(row.utility_partner_id),
      company_id: String(row.utility_company_id),
      name: row.partner_name,
      percentage: toNumber(row.percentage),
      active: row.is_active !== false,
    }));
  },

  async getPeriods(companyId: string): Promise<UtilityPeriod[]> {
    const { data, error } = await supabase
      .from('utility_periods')
      .select('*')
      .eq('utility_company_id', Number(companyId))
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false });

    if (error) {
      console.error('Utility getPeriods error', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: String(row.utility_period_id),
      company_id: String(row.utility_company_id),
      year: row.period_year,
      month: row.period_month,
      status: row.period_status || 'OPEN',
      closed_by: row.closed_by || undefined,
      closed_at: row.closed_at || undefined,
    }));
  },

  async closePeriod(periodId: string, userId: string) {
    const { data: period, error } = await supabase
      .from('utility_periods')
      .update({
        period_status: 'CLOSED',
        closed_by: userId,
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('utility_period_id', Number(periodId))
      .select('*')
      .single();

    if (error || !period) {
      throw new Error('No se pudo cerrar el periodo');
    }

    await logAudit({
      companyId: String(period.utility_company_id),
      userId,
      entity: 'Periodo',
      entityId: String(periodId),
      action: 'CLOSE_PERIOD',
      after: period,
    });

    return { success: true };
  },

  async getIncomeRecords(periodId: string): Promise<IncomeRecord[]> {
    const { data, error } = await supabase
      .from('utility_income_records')
      .select('*')
      .eq('utility_period_id', Number(periodId))
      .order('record_date', { ascending: false });

    if (error) {
      console.error('Utility getIncomeRecords error', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: String(row.utility_income_id),
      period_id: String(row.utility_period_id),
      line_id: row.utility_income_line_id ? String(row.utility_income_line_id) : '',
      value: toNumber(row.value),
      currency: row.currency || 'COP',
      date: row.record_date,
      sede_id: row.utility_sede_id ? String(row.utility_sede_id) : undefined,
      center_id: row.utility_cost_center_id ? String(row.utility_cost_center_id) : undefined,
      area_id: row.utility_area_id ? String(row.utility_area_id) : undefined,
      notes: row.notes || undefined,
      metadata: row.metadata_json || undefined,
    }));
  },

  async addIncomeRecord(record: Omit<IncomeRecord, 'id'>): Promise<IncomeRecord> {
    const payload = {
      utility_period_id: Number(record.period_id),
      utility_income_line_id: Number(record.line_id),
      value: record.value,
      currency: record.currency || 'COP',
      record_date: record.date,
      utility_sede_id: record.sede_id ? Number(record.sede_id) : null,
      utility_cost_center_id: record.center_id ? Number(record.center_id) : null,
      utility_area_id: record.area_id ? Number(record.area_id) : null,
      notes: record.notes || null,
      metadata_json: record.metadata || null,
    };

    const { data, error } = await supabase
      .from('utility_income_records')
      .insert([payload])
      .select('*')
      .single();

    if (error || !data) {
      throw new Error('No se pudo crear el ingreso');
    }

    const companyId = await this.getCompanyIdByPeriod(record.period_id);
    if (companyId) {
      await logAudit({
        companyId,
        entity: 'Ingreso',
        entityId: String(data.utility_income_id),
        action: 'CREATE',
        after: data,
      });
    }

    return {
      id: String(data.utility_income_id),
      period_id: String(data.utility_period_id),
      line_id: data.utility_income_line_id ? String(data.utility_income_line_id) : '',
      value: toNumber(data.value),
      currency: data.currency || 'COP',
      date: data.record_date,
      sede_id: data.utility_sede_id ? String(data.utility_sede_id) : undefined,
      center_id: data.utility_cost_center_id ? String(data.utility_cost_center_id) : undefined,
      area_id: data.utility_area_id ? String(data.utility_area_id) : undefined,
      notes: data.notes || undefined,
      metadata: data.metadata_json || undefined,
    };
  },

  async getExpenseRecords(periodId: string): Promise<ExpenseRecord[]> {
    const { data, error } = await supabase
      .from('utility_expense_records')
      .select('*')
      .eq('utility_period_id', Number(periodId))
      .order('record_date', { ascending: false });

    if (error) {
      console.error('Utility getExpenseRecords error', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: String(row.utility_expense_id),
      period_id: String(row.utility_period_id),
      catalog_id: row.utility_expense_catalog_id ? String(row.utility_expense_catalog_id) : '',
      value: toNumber(row.value),
      currency: row.currency || 'COP',
      date: row.record_date,
      sede_id: row.utility_sede_id ? String(row.utility_sede_id) : undefined,
      center_id: row.utility_cost_center_id ? String(row.utility_cost_center_id) : undefined,
      area_id: row.utility_area_id ? String(row.utility_area_id) : undefined,
      provider_id: row.provider_id || undefined,
      notes: row.notes || undefined,
      status: row.status || 'DRAFT',
    }));
  },

  async addExpenseRecord(record: Omit<ExpenseRecord, 'id'>): Promise<ExpenseRecord> {
    const payload = {
      utility_period_id: Number(record.period_id),
      utility_expense_catalog_id: Number(record.catalog_id),
      value: record.value,
      currency: record.currency || 'COP',
      record_date: record.date,
      utility_sede_id: record.sede_id ? Number(record.sede_id) : null,
      utility_cost_center_id: record.center_id ? Number(record.center_id) : null,
      utility_area_id: record.area_id ? Number(record.area_id) : null,
      provider_id: record.provider_id || null,
      notes: record.notes || null,
      status: record.status || 'DRAFT',
    };

    const { data, error } = await supabase
      .from('utility_expense_records')
      .insert([payload])
      .select('*')
      .single();

    if (error || !data) {
      throw new Error('No se pudo crear el gasto');
    }

    const companyId = await this.getCompanyIdByPeriod(record.period_id);
    if (companyId) {
      await logAudit({
        companyId,
        entity: 'Egreso',
        entityId: String(data.utility_expense_id),
        action: 'CREATE',
        after: data,
      });
    }

    return {
      id: String(data.utility_expense_id),
      period_id: String(data.utility_period_id),
      catalog_id: data.utility_expense_catalog_id ? String(data.utility_expense_catalog_id) : '',
      value: toNumber(data.value),
      currency: data.currency || 'COP',
      date: data.record_date,
      sede_id: data.utility_sede_id ? String(data.utility_sede_id) : undefined,
      center_id: data.utility_cost_center_id ? String(data.utility_cost_center_id) : undefined,
      area_id: data.utility_area_id ? String(data.utility_area_id) : undefined,
      provider_id: data.provider_id || undefined,
      notes: data.notes || undefined,
      status: data.status || 'DRAFT',
    };
  },

  async getAssignmentRules(companyId: string): Promise<AssignmentRule[]> {
    const { data, error } = await supabase
      .from('utility_assignment_rules')
      .select('*')
      .eq('utility_company_id', Number(companyId))
      .eq('is_active', true)
      .order('utility_rule_id', { ascending: false });

    if (error) {
      console.error('Utility getAssignmentRules error', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: String(row.utility_rule_id),
      company_id: String(row.utility_company_id),
      catalog_id: row.utility_expense_catalog_id ? String(row.utility_expense_catalog_id) : '',
      mode: row.assign_mode || 'PERCENTAGE',
      details: row.details_json || {},
      active: row.is_active !== false,
    }));
  },

  async getAuditLogs(companyId: string): Promise<UtilityAuditLog[]> {
    const { data, error } = await supabase
      .from('utility_audit_logs')
      .select('*')
      .eq('utility_company_id', Number(companyId))
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Utility getAuditLogs error', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: String(row.utility_audit_id),
      company_id: String(row.utility_company_id),
      user_id: row.user_id || '',
      entity: row.entity,
      entity_id: row.entity_id,
      action: row.action,
      before: row.before_json || undefined,
      after: row.after_json || undefined,
      timestamp: row.created_at || new Date().toISOString(),
    }));
  },

  async getLoans(companyId: string): Promise<EmployeeLoan[]> {
    const { data, error } = await supabase
      .from('utility_employee_loans')
      .select('*')
      .eq('utility_company_id', Number(companyId))
      .order('loan_date', { ascending: false });

    if (error) {
      console.error('Utility getLoans error', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: String(row.utility_loan_id),
      company_id: String(row.utility_company_id),
      employee_id: row.employee_id,
      sede_id: row.utility_sede_id ? String(row.utility_sede_id) : undefined,
      area_id: row.utility_area_id ? String(row.utility_area_id) : undefined,
      date: row.loan_date,
      principal: toNumber(row.principal),
      interest_rate: toNumber(row.interest_rate),
      installments: row.installments || 1,
      status: row.status || 'ACTIVE',
      balance: toNumber(row.balance),
    }));
  },

  async addLoan(loan: Omit<EmployeeLoan, 'id' | 'balance'>): Promise<EmployeeLoan> {
    const balance = loan.principal;
    const payload = {
      utility_company_id: Number(loan.company_id),
      employee_id: loan.employee_id,
      utility_sede_id: loan.sede_id ? Number(loan.sede_id) : null,
      utility_area_id: loan.area_id ? Number(loan.area_id) : null,
      loan_date: loan.date,
      principal: loan.principal,
      interest_rate: loan.interest_rate || 0,
      installments: loan.installments || 1,
      status: loan.status || 'ACTIVE',
      balance,
    };

    const { data, error } = await supabase
      .from('utility_employee_loans')
      .insert([payload])
      .select('*')
      .single();

    if (error || !data) {
      throw new Error('No se pudo crear el prestamo');
    }

    return {
      id: String(data.utility_loan_id),
      company_id: String(data.utility_company_id),
      employee_id: data.employee_id,
      sede_id: data.utility_sede_id ? String(data.utility_sede_id) : undefined,
      area_id: data.utility_area_id ? String(data.utility_area_id) : undefined,
      date: data.loan_date,
      principal: toNumber(data.principal),
      interest_rate: toNumber(data.interest_rate),
      installments: data.installments || 1,
      status: data.status || 'ACTIVE',
      balance: toNumber(data.balance),
    };
  },

  async getKPIs(periodId: string): Promise<UtilityKPIs> {
    const [incomeRows, expenseRows] = await Promise.all([
      this.getIncomeRecords(periodId),
      this.getExpenseRecords(periodId),
    ]);

    const total_income = incomeRows.reduce((sum, r) => sum + r.value, 0);
    const total_expenses = expenseRows.reduce((sum, r) => sum + r.value, 0);
    const ug = total_income - total_expenses;
    const pi = ug > 0 ? ug * 0.35 : 0;
    const ud = ug - pi;
    const margin_ud = total_income > 0 ? (ud / total_income) * 100 : 0;

    return {
      total_income,
      total_expenses,
      ug,
      pi,
      ud,
      margin_ud,
      variation_mom: 0,
    };
  },

  async getIncomeByLine(periodId: string) {
    const [records, lines] = await Promise.all([
      this.getIncomeRecords(periodId),
      this.getIncomeLines(await this.getCompanyIdByPeriod(periodId) || ''),
    ]);

    return lines.map((line) => ({
      name: line.name,
      value: records.filter((r) => r.line_id === line.id).reduce((sum, r) => sum + r.value, 0),
    }));
  },

  async getExpensesByCategory(periodId: string) {
    const [records, catalog] = await Promise.all([
      this.getExpenseRecords(periodId),
      this.getExpenseCatalog(await this.getCompanyIdByPeriod(periodId) || ''),
    ]);

    const categories: Record<string, number> = {};
    records.forEach((record) => {
      const item = catalog.find((c) => c.id === record.catalog_id);
      if (!item) return;
      categories[item.category] = (categories[item.category] || 0) + record.value;
    });

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  },

  async deleteDemoData(): Promise<boolean> {
    const { data: demos } = await supabase
      .from('utility_companies')
      .select('utility_company_id')
      .eq('is_demo', true);

    const demoIds = (demos || []).map((row: any) => row.utility_company_id);
    if (demoIds.length === 0) return true;

    await supabase.from('utility_income_records').delete().in('utility_period_id',
      (await supabase.from('utility_periods').select('utility_period_id').in('utility_company_id', demoIds)).data?.map((row: any) => row.utility_period_id) || []
    );
    await supabase.from('utility_expense_records').delete().in('utility_period_id',
      (await supabase.from('utility_periods').select('utility_period_id').in('utility_company_id', demoIds)).data?.map((row: any) => row.utility_period_id) || []
    );
    await supabase.from('utility_periods').delete().in('utility_company_id', demoIds);
    return true;
  },

  async getCompanyIdByPeriod(periodId: string): Promise<string | null> {
    if (!periodId) return null;
    const { data } = await supabase
      .from('utility_periods')
      .select('utility_company_id')
      .eq('utility_period_id', Number(periodId))
      .maybeSingle();
    return data?.utility_company_id ? String(data.utility_company_id) : null;
  },

  // Placeholders for unused types to keep interface compatible
  async getThirdParties(_companyId: string): Promise<ThirdParty[]> {
    return [];
  },
  async getAccountsPayable(_companyId: string): Promise<AccountPayable[]> {
    return [];
  },
  async getFinancialMovements(_companyId: string): Promise<FinancialMovement[]> {
    return [];
  },
  async getCompanyFinanceParams(_companyId: string): Promise<CompanyFinanceParams | null> {
    return null;
  },
};

export default UtilityService;

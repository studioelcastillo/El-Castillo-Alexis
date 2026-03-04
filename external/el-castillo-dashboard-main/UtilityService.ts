
import { 
  TenantCompany, Sede, CostCenter, Area, IncomeLine, UtilityPeriod, 
  IncomeRecord, ExpenseCatalog, ExpenseRecord, AssignmentRule, 
  ThirdParty, AccountPayable, EmployeeLoan, FinancialMovement, 
  CompanyFinanceParams, Partner, UtilityKPIs, UtilityAuditLog 
} from './types';

// --- MOCK DATA ---

const MOCK_COMPANIES: TenantCompany[] = [
  { id: 'comp-1', name: 'El Castillo Group', active: true },
  { id: 'comp-2', name: 'Satelite Bogotá', active: true },
  { id: 'demo-1', name: 'DEMO_SINPROD', active: true }
];

const MOCK_SEDES: Sede[] = [
  { id: 'sede-1', company_id: 'comp-1', name: 'Sede Principal', active: true },
  { id: 'sede-2', company_id: 'comp-1', name: 'Sede Norte', active: true },
  { id: 'sede-demo-a', company_id: 'demo-1', name: 'Sede A', active: true },
  { id: 'sede-demo-b', company_id: 'demo-1', name: 'Sede B', active: true }
];

const MOCK_COST_CENTERS: CostCenter[] = [
  { id: 'cc-1', sede_id: 'sede-1', code: 'GEN', name: 'General', active: true },
  { id: 'cc-2', sede_id: 'sede-1', code: 'OPE', name: 'Operación', active: true },
  { id: 'cc-demo-a1', sede_id: 'sede-demo-a', code: 'DGEN', name: 'General', active: true },
  { id: 'cc-demo-a2', sede_id: 'sede-demo-a', code: 'DOPE', name: 'Operación', active: true }
];

const MOCK_AREAS: Area[] = [
  { id: 'area-1', sede_id: 'sede-1', name: 'Administración', active: true },
  { id: 'area-2', sede_id: 'sede-1', name: 'Monitoreo', active: true },
  { id: 'area-3', sede_id: 'sede-1', name: 'Fotografía', active: true },
  { id: 'area-4', sede_id: 'sede-1', name: 'Maquillaje', active: true },
  { id: 'area-5', sede_id: 'sede-1', name: 'Venta de contenido', active: true },
  { id: 'area-6', sede_id: 'sede-1', name: 'Aliados y satélites', active: true },
  { id: 'area-7', sede_id: 'sede-1', name: 'Creación de cuentas', active: true },
  { id: 'area-8', sede_id: 'sede-1', name: 'Soporte técnico', active: true },
  { id: 'area-9', sede_id: 'sede-1', name: 'Contabilidad', active: true },
  { id: 'area-10', sede_id: 'sede-1', name: 'Aseo', active: true },
  { id: 'area-11', sede_id: 'sede-1', name: 'Recursos humanos', active: true },
  { id: 'area-12', sede_id: 'sede-1', name: 'Reclutamiento', active: true },
  { id: 'area-13', sede_id: 'sede-1', name: 'Abogado', active: true }
];

const MOCK_INCOME_LINES: IncomeLine[] = [
  { id: 'line-1', company_id: 'comp-1', name: 'Modelos', category: 'Operativo', active: true },
  { id: 'line-2', company_id: 'comp-1', name: 'Modelos satélites', category: 'Operativo', active: true },
  { id: 'line-3', company_id: 'comp-1', name: 'Aliados', category: 'Operativo', active: true },
  { id: 'line-4', company_id: 'comp-1', name: 'Monetización', category: 'Operativo', active: true },
  { id: 'line-5', company_id: 'comp-1', name: 'Retefuente modelos', category: 'Retenciones', active: true },
  { id: 'line-6', company_id: 'comp-1', name: 'Retefuente aliados', category: 'Retenciones', active: true },
  { id: 'line-7', company_id: 'comp-1', name: 'Asesoría contable', category: 'Otros', active: true },
  { id: 'line-8', company_id: 'comp-1', name: 'Máquina dispensadora', category: 'Otros', active: true },
  { id: 'line-9', company_id: 'comp-1', name: 'Intereses de préstamos', category: 'Financiero', active: true },
  { id: 'line-10', company_id: 'comp-1', name: 'Diferencia en cambio (TRM)', category: 'Financiero', active: true }
];

const MOCK_EXPENSE_CATALOG: ExpenseCatalog[] = [
  { 
    id: 'exp-1', company_id: 'comp-1', name: 'Nómina Administrativa', category: 'Nómina y prestaciones', 
    type: 'OPERATIVO', recurrent: true, frequency: 'MENSUAL', fixed_value: false, currency: 'COP', 
    default_scope: 'COMPANY', requires_assignment: true, active: true 
  },
  { 
    id: 'exp-2', company_id: 'comp-1', name: 'Arriendo Sede Principal', category: 'Administración', 
    type: 'OPERATIVO', recurrent: true, frequency: 'MENSUAL', fixed_value: true, base_value: 5000000, 
    currency: 'COP', default_scope: 'SEDE', scope_id: 'sede-1', requires_assignment: true, active: true 
  },
  { 
    id: 'exp-3', company_id: 'comp-1', name: 'Vigilancia y Aseo', category: 'Operación', 
    type: 'OPERATIVO', recurrent: true, frequency: 'MENSUAL', fixed_value: true, base_value: 1200000, 
    currency: 'COP', default_scope: 'SEDE', scope_id: 'sede-1', requires_assignment: true, active: true 
  },
  { 
    id: 'exp-4', company_id: 'comp-1', name: 'Servicios Públicos (Energía)', category: 'Operación', 
    type: 'OPERATIVO', recurrent: true, frequency: 'MENSUAL', fixed_value: false, 
    currency: 'COP', default_scope: 'SEDE', scope_id: 'sede-1', requires_assignment: true, active: true 
  },
  { 
    id: 'exp-5', company_id: 'comp-1', name: 'Honorarios Abogado Externo', category: 'Honorarios profesionales', 
    type: 'OPERATIVO', recurrent: false, frequency: 'MENSUAL', fixed_value: false, 
    currency: 'COP', default_scope: 'COMPANY', requires_assignment: true, active: true 
  },
  { 
    id: 'exp-6', company_id: 'comp-1', name: 'Suscripción Software', category: 'Tecnología', 
    type: 'OPERATIVO', recurrent: true, frequency: 'MENSUAL', fixed_value: true, base_value: 150000, 
    currency: 'COP', default_scope: 'COMPANY', requires_assignment: true, active: true 
  }
];

let incomeRecords: IncomeRecord[] = [
  { id: 'inc-1', period_id: 'per-2026-02', line_id: 'line-1', value: 150000000, currency: 'COP', date: '2026-02-15', sede_id: 'sede-1' },
  { id: 'inc-2', period_id: 'per-2026-02', line_id: 'line-2', value: 45000000, currency: 'COP', date: '2026-02-20', sede_id: 'sede-2' },
  { id: 'inc-3', period_id: 'per-2026-02', line_id: 'line-9', value: 500000, currency: 'COP', date: '2026-02-28', sede_id: 'sede-1' }
];

let expenseRecords: ExpenseRecord[] = [
  { id: 'erec-1', period_id: 'per-2026-02', catalog_id: 'exp-2', value: 5000000, currency: 'COP', date: '2026-02-01', sede_id: 'sede-1', status: 'CONFIRMED' },
  { id: 'erec-2', period_id: 'per-2026-02', catalog_id: 'exp-3', value: 1200000, currency: 'COP', date: '2026-02-05', sede_id: 'sede-1', status: 'CONFIRMED' },
  { id: 'erec-3', period_id: 'per-2026-02', catalog_id: 'exp-4', value: 850000, currency: 'COP', date: '2026-02-10', sede_id: 'sede-1', status: 'CONFIRMED' },
  { id: 'erec-4', period_id: 'per-2026-02', catalog_id: 'exp-1', value: 25000000, currency: 'COP', date: '2026-02-28', sede_id: 'sede-1', status: 'CONFIRMED' },
  { id: 'erec-5', period_id: 'per-2026-02', catalog_id: 'exp-6', value: 150000, currency: 'COP', date: '2026-02-15', sede_id: 'sede-1', status: 'CONFIRMED' }
];

let employeeLoans: EmployeeLoan[] = [
  { id: 'loan-1', company_id: 'comp-1', employee_id: 'emp-101', date: '2026-01-10', principal: 2000000, interest_rate: 0.02, installments: 4, status: 'ACTIVE', balance: 1500000 }
];

let partners: Partner[] = [
  { id: 'part-1', company_id: 'comp-1', name: 'Socio Alexis', percentage: 40, active: true },
  { id: 'part-2', company_id: 'comp-1', name: 'Socio Merly', percentage: 30, active: true },
  { id: 'part-3', company_id: 'comp-1', name: 'Socio Landa', percentage: 30, active: true }
];

let assignmentRules: AssignmentRule[] = [
  { 
    id: 'rule-1', company_id: 'comp-1', catalog_id: 'exp-2', mode: 'PERCENTAGE', 
    details: { lines: [{ line_id: 'line-1', value: 60 }, { line_id: 'line-2', value: 40 }] }, 
    active: true 
  }
];

let utilityAuditLogs: UtilityAuditLog[] = [
  { id: 'log-1', company_id: 'comp-1', user_id: '3990', entity: 'Periodo', entity_id: 'per-2026-01', action: 'CLOSE_PERIOD', timestamp: new Date().toISOString() }
];

const UtilityService = {
  // --- MASTER DATA ---
  getCompanies: async () => Promise.resolve(MOCK_COMPANIES),
  getSedes: async (companyId: string) => Promise.resolve(MOCK_SEDES.filter(s => s.company_id === companyId)),
  getCostCenters: async (sedeId: string) => Promise.resolve(MOCK_COST_CENTERS.filter(cc => cc.sede_id === sedeId)),
  getAreas: async (sedeId: string) => Promise.resolve(MOCK_AREAS.filter(a => a.sede_id === sedeId)),
  getIncomeLines: async (companyId: string) => Promise.resolve(MOCK_INCOME_LINES.filter(l => l.company_id === companyId && l.active)),
  addIncomeLine: async (line: Omit<IncomeLine, 'id'>) => {
    const newLine = { ...line, id: `line-${Date.now()}` };
    MOCK_INCOME_LINES.push(newLine);
    return Promise.resolve(newLine);
  },
  deleteIncomeLine: async (id: string) => {
    const index = MOCK_INCOME_LINES.findIndex(l => l.id === id);
    if (index !== -1) MOCK_INCOME_LINES[index].active = false;
    return Promise.resolve(true);
  },
  getExpenseCatalog: async (companyId: string) => Promise.resolve(MOCK_EXPENSE_CATALOG.filter(e => e.company_id === companyId && e.active)),
  addExpenseCatalogItem: async (item: Omit<ExpenseCatalog, 'id'>) => {
    const newItem = { ...item, id: `exp-${Date.now()}` };
    MOCK_EXPENSE_CATALOG.push(newItem);
    return Promise.resolve(newItem);
  },
  deleteExpenseCatalogItem: async (id: string) => {
    const index = MOCK_EXPENSE_CATALOG.findIndex(e => e.id === id);
    if (index !== -1) MOCK_EXPENSE_CATALOG[index].active = false;
    return Promise.resolve(true);
  },
  getPartners: async (companyId: string) => Promise.resolve(partners.filter(p => p.company_id === companyId)),

  // --- PERIODS ---
  getPeriods: async (companyId: string) => {
    return Promise.resolve([
      { id: 'per-2026-01', company_id: companyId, year: 2026, month: 1, status: 'CLOSED' },
      { id: 'per-2026-02', company_id: companyId, year: 2026, month: 2, status: 'OPEN' },
      { id: 'per-2026-03', company_id: companyId, year: 2026, month: 3, status: 'OPEN' }
    ] as UtilityPeriod[]);
  },

  closePeriod: async (periodId: string, userId: string) => {
    // Validation: Check if all expenses have assignments
    const expenses = expenseRecords.filter(r => r.period_id === periodId);
    // In a real app, we'd check if each expense has a corresponding entry in ExpenseLineAssignment
    // For now, we simulate success
    utilityAuditLogs.unshift({
      id: `log-${Date.now()}`,
      company_id: 'comp-1',
      user_id: userId,
      entity: 'Periodo',
      entity_id: periodId,
      action: 'CLOSE_PERIOD',
      timestamp: new Date().toISOString()
    });
    return Promise.resolve({ success: true });
  },

  // --- INCOME ---
  getIncomeRecords: async (periodId: string) => Promise.resolve(incomeRecords.filter(r => r.period_id === periodId)),
  addIncomeRecord: async (record: Omit<IncomeRecord, 'id'>) => {
    const newRecord = { ...record, id: `inc-${Date.now()}` };
    incomeRecords.push(newRecord);
    utilityAuditLogs.unshift({
      id: `log-${Date.now()}`,
      company_id: 'comp-1',
      user_id: '3990',
      entity: 'Ingreso',
      entity_id: newRecord.id,
      action: 'CREATE',
      after: newRecord,
      timestamp: new Date().toISOString()
    });
    return Promise.resolve(newRecord);
  },

  // --- EXPENSES ---
  getExpenseRecords: async (periodId: string) => Promise.resolve(expenseRecords.filter(r => r.period_id === periodId)),
  addExpenseRecord: async (record: Omit<ExpenseRecord, 'id'>) => {
    const newRecord = { ...record, id: `erec-${Date.now()}` };
    expenseRecords.push(newRecord);
    
    // Auto-apply assignment rule if exists
    const rule = assignmentRules.find(r => r.catalog_id === record.catalog_id && r.active);
    if (rule) {
      // In a real app, we'd create ExpenseLineAssignment entries here
      console.log(`Auto-assigned expense ${newRecord.id} using rule ${rule.id}`);
    }

    utilityAuditLogs.unshift({
      id: `log-${Date.now()}`,
      company_id: 'comp-1',
      user_id: '3990',
      entity: 'Egreso',
      entity_id: newRecord.id,
      action: 'CREATE',
      after: newRecord,
      timestamp: new Date().toISOString()
    });
    return Promise.resolve(newRecord);
  },

  // --- RULES ---
  getAssignmentRules: async (companyId: string) => Promise.resolve(assignmentRules.filter(r => r.company_id === companyId)),
  
  // --- AUDIT ---
  getAuditLogs: async (companyId: string) => Promise.resolve(utilityAuditLogs.filter(l => l.company_id === companyId)),

  // --- LOANS ---
  getLoans: async (companyId: string) => Promise.resolve(employeeLoans.filter(l => l.company_id === companyId)),
  addLoan: async (loan: Omit<EmployeeLoan, 'id' | 'balance'>) => {
    const newLoan = { ...loan, id: `loan-${Date.now()}`, balance: loan.principal };
    employeeLoans.push(newLoan);
    return Promise.resolve(newLoan);
  },

  // --- CALCULATIONS ---
  getKPIs: async (periodId: string): Promise<UtilityKPIs> => {
    const periodIncome = incomeRecords.filter(r => r.period_id === periodId).reduce((sum, r) => sum + r.value, 0);
    const periodExpenses = expenseRecords.filter(r => r.period_id === periodId).reduce((sum, r) => sum + r.value, 0);
    
    const ug = periodIncome - periodExpenses;
    const pi = ug > 0 ? ug * 0.35 : 0; // 35% tax provision mock
    const ud = ug - pi;
    const margin = periodIncome > 0 ? (ud / periodIncome) * 100 : 0;

    return Promise.resolve({
      total_income: periodIncome,
      total_expenses: periodExpenses,
      ug,
      pi,
      ud,
      margin_ud: margin,
      variation_mom: 5.4
    });
  },

  getIncomeByLine: async (periodId: string) => {
    const records = incomeRecords.filter(r => r.period_id === periodId);
    const lines = MOCK_INCOME_LINES;
    return Promise.resolve(lines.map(l => ({
      name: l.name,
      value: records.filter(r => r.line_id === l.id).reduce((sum, r) => sum + r.value, 0)
    })));
  },

  getExpensesByCategory: async (periodId: string) => {
    const records = expenseRecords.filter(r => r.period_id === periodId);
    const categories: Record<string, number> = {};
    
    records.forEach(r => {
      const catalog = MOCK_EXPENSE_CATALOG.find(c => c.id === r.catalog_id);
      if (catalog) {
        categories[catalog.category] = (categories[catalog.category] || 0) + r.value;
      }
    });

    return Promise.resolve(Object.entries(categories).map(([name, value]) => ({ name, value })));
  },

  // --- DEMO ---
  deleteDemoData: async () => {
    incomeRecords = incomeRecords.filter(r => !r.period_id.includes('demo'));
    expenseRecords = expenseRecords.filter(r => !r.period_id.includes('demo'));
    return Promise.resolve(true);
  }
};

export default UtilityService;

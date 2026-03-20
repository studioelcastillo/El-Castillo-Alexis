export const CORE_PERMISSION_CATALOG = {
  auth: ['view'],
  catalogs: ['view', 'create', 'edit'],
  companies: ['view', 'create', 'edit'],
  branches: ['view', 'create', 'edit'],
  people: ['view', 'create', 'edit'],
  models: ['view', 'create', 'edit'],
  staff: ['view', 'create', 'edit'],
  operations: ['view', 'create', 'edit'],
  attendance: ['view', 'create', 'edit'],
  absences: ['view', 'create', 'edit'],
  goals: ['view', 'create', 'edit'],
  online_time: ['view', 'create', 'edit'],
  payroll: ['view', 'create', 'edit', 'calculate', 'close', 'reopen', 'export'],
  payroll_novelties: ['view', 'create', 'edit'],
  hr: ['view', 'create', 'edit'],
  finance: ['view', 'create', 'edit'],
  users: ['view', 'create', 'edit', 'activate', 'deactivate', 'reset_password'],
  roles: ['view', 'create', 'edit', 'manage_permissions'],
  permissions: ['view'],
  audit: ['view', 'export'],
} as const;

export type CoreModuleKey = keyof typeof CORE_PERMISSION_CATALOG;

export const CORE_PERMISSION_SEEDS = Object.entries(CORE_PERMISSION_CATALOG).flatMap(
  ([moduleKey, actions]) =>
    actions.map((actionKey) => ({
      moduleKey,
      actionKey,
      description: `${moduleKey}.${actionKey}`,
    })),
);

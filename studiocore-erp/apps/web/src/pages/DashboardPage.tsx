import type {
  AuditLogRecord,
  BranchRecord,
  CompanyRecord,
  PaginatedResponse,
  PersonRecord,
  RoleRecord,
  UserManagementRecord,
} from '@studiocore/contracts';
import { EmptyState, KpiCard, PageHero, Panel, StatusBadge } from '@studiocore/ui';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { healthRequest } from '../lib/api';
import { useApiClient, useAuth } from '../lib/auth';
import { formatDateTime, pluralize } from '../lib/format';
import { navItems } from '../routes';

export function DashboardPage() {
  const api = useApiClient();
  const { session, hasPermission } = useAuth();

  const healthQuery = useQuery({
    queryKey: ['dashboard', 'health'],
    queryFn: healthRequest,
  });

  const companiesQuery = useQuery({
    queryKey: ['dashboard', 'companies'],
    queryFn: () => api.get<PaginatedResponse<CompanyRecord>>('/companies'),
    enabled: hasPermission('companies.view'),
  });

  const branchesQuery = useQuery({
    queryKey: ['dashboard', 'branches'],
    queryFn: () => api.get<PaginatedResponse<BranchRecord>>('/branches?page=1&pageSize=50'),
    enabled: hasPermission('branches.view'),
  });

  const peopleQuery = useQuery({
    queryKey: ['dashboard', 'people'],
    queryFn: () => api.get<PaginatedResponse<PersonRecord>>('/people?page=1&pageSize=50'),
    enabled: hasPermission('people.view'),
  });

  const usersQuery = useQuery({
    queryKey: ['dashboard', 'users'],
    queryFn: () => api.get<PaginatedResponse<UserManagementRecord>>('/users?page=1&pageSize=50'),
    enabled: hasPermission('users.view'),
  });

  const rolesQuery = useQuery({
    queryKey: ['dashboard', 'roles'],
    queryFn: () => api.get<PaginatedResponse<RoleRecord>>('/roles?page=1&pageSize=50'),
    enabled: hasPermission('roles.view'),
  });

  const auditQuery = useQuery({
    queryKey: ['dashboard', 'audit'],
    queryFn: () => api.get<PaginatedResponse<AuditLogRecord>>('/audit-logs?page=1&pageSize=5'),
    enabled: hasPermission('audit.view'),
  });

  const visibleModules = navItems.filter((item) => item.to !== '/dashboard' && hasPermission(item.permission));

  return (
    <>
      <PageHero
        eyebrow="Cockpit de fundacion"
        title="Panel inicial del nuevo ERP vertical"
        description="Esta vista ya usa datos reales del backend nuevo para comprobar auth, permisos, tenant activo y recursos base del dominio organizacional."
      />

      <section className="kpi-grid">
        <KpiCard
          label="Estado API"
          value={<StatusBadge value={healthQuery.data?.status || 'checking'} />}
          hint={healthQuery.data?.service || 'Conectando con el backend nuevo...'}
        />
        <KpiCard
          label="Empresa activa"
          value={`#${session?.user.companyId}`}
          hint={session?.user.hasCompanyWideAccess ? 'Scope global habilitado' : 'Scope limitado por sedes'}
        />
        <KpiCard
          label="Sedes visibles"
          value={branchesQuery.data?.total ?? session?.user.branchIds.length ?? 0}
          hint={pluralize(session?.user.branchIds.length || 0, 'sede en sesion', 'sedes en sesion')}
        />
        {hasPermission('people.view') ? (
          <KpiCard
            label="Personas visibles"
            value={peopleQuery.data?.total ?? 0}
            hint="Epic `people` ya abierta con CRUD canonico inicial."
          />
        ) : null}
        <KpiCard
          label="Permisos cargados"
          value={session?.user.permissions.length || 0}
          hint={pluralize(session?.user.roles.length || 0, 'rol activo', 'roles activos')}
        />
      </section>

      <section className="two-column-grid">
        <Panel>
          <span className="eyebrow">Cobertura fase 0</span>
          <h2>Modulos navegables hoy</h2>
          {visibleModules.length ? (
            <div className="module-grid">
              {visibleModules.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.to} to={item.to} className="module-card">
                    <div className="module-card-title">
                      <Icon size={18} />
                      <strong>{item.label}</strong>
                    </div>
                    <p>{item.description}</p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Sin modulos adicionales"
              description="La sesion actual no expone modulos navegables adicionales."
              compact
            />
          )}
        </Panel>

        <Panel>
          <span className="eyebrow">Contexto de sesion</span>
          <h2>Tenant y alcance actual</h2>
          <div className="detail-list">
            <div>
              <span>Usuario</span>
              <strong>
                {session?.user.firstName} {session?.user.lastName}
              </strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{session?.user.email}</strong>
            </div>
            <div>
              <span>Sede activa</span>
              <strong>{session?.user.activeBranchId ? `#${session.user.activeBranchId}` : 'Global'}</strong>
            </div>
            <div>
              <span>Roles</span>
              <strong>{session?.user.roles.join(', ') || 'Sin roles'}</strong>
            </div>
          </div>
        </Panel>
      </section>

      <section className="kpi-grid compact-kpi-grid">
        {hasPermission('companies.view') ? (
          <KpiCard
            label="Empresas visibles"
            value={companiesQuery.data?.total ?? 0}
            hint="La empresa seed queda aislada por tenant desde el backend nuevo."
          />
        ) : null}
        {hasPermission('users.view') ? (
          <KpiCard
            label="Usuarios visibles"
            value={usersQuery.data?.total ?? 0}
            hint="Usuarios ya serializados con roles, permisos y scope tenant."
          />
        ) : null}
        {hasPermission('roles.view') ? (
          <KpiCard
            label="Roles visibles"
            value={rolesQuery.data?.total ?? 0}
            hint="Roles versionados por empresa y enlazados a permisos semilla."
          />
        ) : null}
      </section>

      <Panel>
        <span className="eyebrow">Auditoria reciente</span>
        <h2>Ultimos eventos sensibles</h2>
        {auditQuery.isSuccess && auditQuery.data.items.length ? (
          <div className="timeline-list">
            {auditQuery.data.items.map((item) => (
              <article key={item.id} className="timeline-item">
                <div>
                  <strong>
                    {item.module}.{item.action}
                  </strong>
                  <p>
                    {item.entityType}
                    {item.entityId ? ` #${item.entityId}` : ''}
                  </p>
                </div>
                <div className="timeline-meta">
                  <span>{formatDateTime(item.createdAt)}</span>
                  <StatusBadge value={item.branchId ? `sede ${item.branchId}` : 'global'} />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin trazas recientes"
            description={
              hasPermission('audit.view')
                ? 'Todavia no hay trazas visibles para esta empresa.'
                : 'Tu sesion no incluye lectura de auditoria.'
            }
            compact
          />
        )}
      </Panel>
    </>
  );
}

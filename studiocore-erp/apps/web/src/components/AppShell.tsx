import type { BranchRecord, CompanyRecord, EnvelopeResponse, PaginatedResponse } from '@studiocore/contracts';
import { ActionButton, Field, InlineMessage, Panel, SelectInput } from '@studiocore/ui';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, LoaderCircle, LogOut, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useApiClient, useAuth } from '../lib/auth';
import { getActiveNavItem, navSections } from '../routes';

export function AppShell() {
  const api = useApiClient();
  const { session, hasPermission, logout, switchBranch } = useAuth();
  const location = useLocation();
  const [isSwitchingBranch, setIsSwitchingBranch] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);
  const currentUser = session?.user ?? null;

  const canViewCompanies = hasPermission('companies.view');
  const canViewBranches = hasPermission('branches.view');
  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => hasPermission(item.permission)),
    }))
    .filter((section) => section.items.length > 0);

  const branchesQuery = useQuery({
    queryKey: ['shell-branch-selector'],
    queryFn: () => api.get<PaginatedResponse<BranchRecord>>('/branches?page=1&pageSize=100'),
    enabled: Boolean(session) && canViewBranches,
  });

  const companyQuery = useQuery({
    queryKey: ['shell-company-context', currentUser?.companyId],
    queryFn: () => api.get<EnvelopeResponse<CompanyRecord>>(`/companies/${currentUser?.companyId}`),
    enabled: Boolean(currentUser?.companyId) && canViewCompanies,
  });

  const activeItem = getActiveNavItem(location.pathname);
  const branchOptions = useMemo(() => {
    const options = new Map<number, string>();

    for (const branch of branchesQuery.data?.items ?? []) {
      options.set(branch.id, `${branch.name} (${branch.code})`);
    }

    for (const branchId of currentUser?.branchIds ?? []) {
      if (!options.has(branchId)) {
        options.set(branchId, `Sede #${branchId}`);
      }
    }

    if (
      currentUser?.activeBranchId
      && !options.has(currentUser.activeBranchId)
    ) {
      options.set(currentUser.activeBranchId, `Sede #${currentUser.activeBranchId}`);
    }

    return Array.from(options.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((left, right) => left.label.localeCompare(right.label, 'es'));
  }, [branchesQuery.data?.items, currentUser?.activeBranchId, currentUser?.branchIds]);

  const branchSelectorValue = currentUser?.activeBranchId === null
    ? 'global'
    : String(currentUser?.activeBranchId ?? 'global');
  const companyLabel = companyQuery.data?.data.name ?? (currentUser ? `Empresa #${currentUser.companyId}` : '--');
  const activeBranchLabel = currentUser?.activeBranchId === null
    ? 'Global de empresa'
    : branchOptions.find((branch) => branch.id === currentUser?.activeBranchId)?.label
      ?? (currentUser?.activeBranchId ? `Sede #${currentUser.activeBranchId}` : '--');

  const canSwitchBranch = currentUser
    ? currentUser.hasCompanyWideAccess || currentUser.branchIds.length > 1
    : false;

  async function handleBranchChange(value: string) {
    const nextBranchId = value === 'global' ? null : Number(value);
    if (!currentUser || nextBranchId === currentUser.activeBranchId) {
      return;
    }

    setBranchError(null);
    setIsSwitchingBranch(true);

    try {
      await switchBranch(nextBranchId);
    } catch (error) {
      setBranchError(error instanceof Error ? error.message : 'No fue posible cambiar la sede activa.');
    } finally {
      setIsSwitchingBranch(false);
    }
  }

  return (
    <div className="shell-root">
      <Panel className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">SC</div>
          <div>
            <p className="eyebrow">StudioCore ERP</p>
            <h1>Fase 0 operativa</h1>
          </div>
        </div>

        <div className="sidebar-context card-outline">
          <span className="mini-label">Tenant activo</span>
          <strong>{companyLabel}</strong>
          <span>{activeBranchLabel}</span>

          <div className="tenant-selector">
            <Field
              label="Contexto de sede"
              htmlFor="shell-branch-selector"
              hint={
                currentUser?.hasCompanyWideAccess
                  ? 'Puedes alternar entre contexto global y sedes visibles sin relogin.'
                  : 'La sesion queda acotada a las sedes asignadas a tu usuario.'
              }
            >
              <SelectInput
                id="shell-branch-selector"
                value={branchSelectorValue}
                onChange={(event) => void handleBranchChange(event.target.value)}
                disabled={isSwitchingBranch || !canSwitchBranch}
              >
                {currentUser?.hasCompanyWideAccess ? <option value="global">Global de empresa</option> : null}
                {branchOptions.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.label}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <div className="tenant-selector__meta">
              {isSwitchingBranch ? (
                <span className="tenant-selector__status">
                  <LoaderCircle size={14} className="spin" />
                  Actualizando contexto...
                </span>
              ) : (
                <span>
                  {canSwitchBranch
                    ? `${branchOptions.length || 1} sedes disponibles en esta sesion.`
                    : 'La sesion actual no necesita cambio de sede.'}
                </span>
              )}
            </div>

            {branchError ? <InlineMessage tone="error">{branchError}</InlineMessage> : null}
            {companyQuery.isError && canViewCompanies ? (
              <InlineMessage tone="info">
                No fue posible resolver el nombre comercial de la empresa; se muestra el identificador de respaldo.
              </InlineMessage>
            ) : null}
            {branchesQuery.isError && canViewBranches ? (
              <InlineMessage tone="info">
                No fue posible cargar el catalogo completo de sedes; se usan etiquetas de respaldo por ID.
              </InlineMessage>
            ) : null}
          </div>
        </div>

        <nav className="nav-stack">
          {visibleSections.map((section) => (
            <div key={section.title} className="nav-section">
              <p className="mini-label">{section.title}</p>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
                  >
                    <span className="nav-link-main">
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </span>
                    <ArrowUpRight size={16} className="nav-link-arrow" />
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer card-outline">
          <div>
            <span className="mini-label">Sesion actual</span>
            <strong>
              {session?.user.firstName} {session?.user.lastName}
            </strong>
            <span>{session?.user.roles.join(' / ') || 'Sin roles'}</span>
          </div>
          <ActionButton type="button" variant="secondary" fullWidth onClick={() => void logout()}>
            <LogOut size={16} />
            Cerrar sesion
          </ActionButton>
        </div>
      </Panel>

      <div className="shell-main">
        <Panel className="topbar">
          <div>
            <span className="eyebrow">{activeItem?.label || 'Workspace'}</span>
            <h2>{activeItem?.description || 'Shell base del nuevo ERP multiempresa.'}</h2>
          </div>
          <div className="topbar-chip">
            <Sparkles size={16} />
            <span>{companyLabel} · {activeBranchLabel}</span>
          </div>
        </Panel>

        <main className="content-stack">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

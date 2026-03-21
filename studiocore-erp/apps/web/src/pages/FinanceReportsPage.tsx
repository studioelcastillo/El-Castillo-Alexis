import type {
  BranchRecord,
  EnvelopeResponse,
  FinanceReportSummaryRecord,
  FinancialAccountRecord,
  PaginatedResponse,
} from '@studiocore/contracts';
import {
  ActionButton,
  EmptyState,
  Field,
  InlineMessage,
  KpiCard,
  PageHero,
  Panel,
  SectionHeading,
  SelectInput,
  StatusBadge,
  TextInput,
} from '@studiocore/ui';
import { useQuery } from '@tanstack/react-query';
import { RefreshCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '../components/PermissionGuard';
import { useApiClient, useAuth } from '../lib/auth';
import { formatCurrency, formatDate } from '../lib/format';

type ReportFiltersState = {
  branchId: string;
  accountId: string;
  from: string;
  to: string;
};

function buildDefaultFilters(): ReportFiltersState {
  const today = new Date();
  const to = today.toISOString().slice(0, 10);
  const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);

  return {
    branchId: '',
    accountId: '',
    from,
    to,
  };
}

export function FinanceReportsPage() {
  const api = useApiClient();
  const { hasPermission, session } = useAuth();
  const canViewBranches = hasPermission('branches.view');
  const hasCompanyWideAccess = session?.user.hasCompanyWideAccess ?? false;
  const activeBranchId = session?.user.activeBranchId ?? null;
  const [filters, setFilters] = useState<ReportFiltersState>(() => {
    const defaults = buildDefaultFilters();
    return !hasCompanyWideAccess && activeBranchId ? { ...defaults, branchId: String(activeBranchId) } : defaults;
  });

  const branchesQuery = useQuery({
    queryKey: ['finance-report-branches'],
    queryFn: () => api.get<PaginatedResponse<BranchRecord>>('/branches?page=1&pageSize=100'),
    enabled: canViewBranches,
  });

  const accountsQuery = useQuery({
    queryKey: ['finance-report-accounts', filters.branchId],
    queryFn: () => {
      const params = new URLSearchParams({ page: '1', pageSize: '100' });
      if (filters.branchId) {
        params.set('branchId', filters.branchId);
      }
      return api.get<PaginatedResponse<FinancialAccountRecord>>(`/finance/accounts?${params.toString()}`);
    },
  });

  useEffect(() => {
    if (!hasCompanyWideAccess && activeBranchId) {
      setFilters((current) => ({ ...current, branchId: String(activeBranchId) }));
    }
  }, [activeBranchId, hasCompanyWideAccess]);

  useEffect(() => {
    const accounts = accountsQuery.data?.items ?? [];
    if (filters.accountId && !accounts.some((account) => String(account.id) === filters.accountId)) {
      setFilters((current) => ({ ...current, accountId: '' }));
    }
  }, [accountsQuery.data?.items, filters.accountId]);

  const reportQuery = useQuery({
    queryKey: ['finance-report-summary', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.branchId) {
        params.set('branchId', filters.branchId);
      }
      if (filters.accountId) {
        params.set('accountId', filters.accountId);
      }
      if (filters.from) {
        params.set('from', filters.from);
      }
      if (filters.to) {
        params.set('to', filters.to);
      }

      const suffix = params.toString();
      return api.get<EnvelopeResponse<FinanceReportSummaryRecord>>(`/finance/reports/summary${suffix ? `?${suffix}` : ''}`);
    },
  });

  const branches = branchesQuery.data?.items ?? [];
  const accounts = accountsQuery.data?.items ?? [];
  const summary = reportQuery.data?.data ?? null;
  const accountNameById = useMemo(() => new Map(accounts.map((account) => [account.id, account.name])), [accounts]);

  async function refreshAll() {
    await Promise.all([reportQuery.refetch(), accountsQuery.refetch(), canViewBranches ? branchesQuery.refetch() : Promise.resolve()]);
  }

  return (
    <PermissionGuard permission="finance.view">
      <div className="page-stack">
        <PageHero
          eyebrow="Finanzas"
          title="Reportes y conciliacion"
          description="Consolida balances, flujo operativo y transferencias internas para revisar cierres y alertas del tenant activo."
          actions={
            <ActionButton variant="secondary" onClick={() => void refreshAll()}>
              <RefreshCcw size={16} className={reportQuery.isFetching ? 'spin' : ''} />
              Recargar
            </ActionButton>
          }
        />

        <Panel>
          <SectionHeading
            eyebrow="Filtro"
            title="Rango y alcance"
            description="Ajusta sede, cuenta y fechas para revisar balances, flujo operativo y actividad anulada."
          />

          {!canViewBranches ? (
            <InlineMessage tone="info">Tu sesion no incluye `branches.view`; la conciliacion queda restringida al contexto activo.</InlineMessage>
          ) : null}

          <div className="field-grid two-columns">
            <Field label="Sede" htmlFor="finance-report-branch">
              <SelectInput
                id="finance-report-branch"
                value={filters.branchId}
                onChange={(event) => setFilters((current) => ({ ...current, branchId: event.target.value, accountId: '' }))}
                disabled={!hasCompanyWideAccess && activeBranchId !== null}
              >
                <option value="">Todas las sedes visibles</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} ({branch.code})
                  </option>
                ))}
              </SelectInput>
            </Field>

            <Field label="Cuenta" htmlFor="finance-report-account">
              <SelectInput
                id="finance-report-account"
                value={filters.accountId}
                onChange={(event) => setFilters((current) => ({ ...current, accountId: event.target.value }))}
              >
                <option value="">Todas las cuentas visibles</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </option>
                ))}
              </SelectInput>
            </Field>

            <Field label="Desde" htmlFor="finance-report-from">
              <TextInput
                id="finance-report-from"
                type="date"
                value={filters.from}
                onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
              />
            </Field>

            <Field label="Hasta" htmlFor="finance-report-to">
              <TextInput
                id="finance-report-to"
                type="date"
                value={filters.to}
                onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
              />
            </Field>
          </div>
        </Panel>

        {reportQuery.error instanceof Error ? <InlineMessage tone="error">{reportQuery.error.message}</InlineMessage> : null}

        {summary ? (
          <>
            <div className="kpi-grid">
              <KpiCard label="Balance total" value={formatCurrency(Number(summary.totals.totalBalance))} hint={`${summary.totals.accountCount} cuentas visibles`} />
              <KpiCard label="Ingresos operativos" value={formatCurrency(Number(summary.totals.operationalIncomeAmount))} hint={`${summary.totals.postedTransactionCount} movimientos contabilizados`} />
              <KpiCard label="Egresos operativos" value={formatCurrency(Number(summary.totals.operationalExpenseAmount))} hint="Salidas distintas de transferencias internas" />
              <KpiCard label="Neto operativo" value={formatCurrency(Number(summary.totals.netOperationalAmount))} hint="Ingresos menos egresos operativos" />
              <KpiCard label="Transferencias" value={formatCurrency(Number(summary.totals.transferVolumeAmount))} hint="Flujo interno entre cuentas visibles" />
              <KpiCard label="Anulados" value={summary.totals.voidedTransactionCount} hint={`${summary.totals.negativeBalanceCount} cuentas en negativo`} />
            </div>

            {summary.alerts.length ? (
              <Panel>
                <SectionHeading
                  eyebrow="Alertas"
                  title="Hallazgos de conciliacion"
                  description="Lectura rapida de condiciones que merecen revision antes de cierre o reporte formal."
                />
                <div className="page-stack">
                  {summary.alerts.map((alert) => (
                    <InlineMessage key={alert} tone="info">
                      {alert}
                    </InlineMessage>
                  ))}
                </div>
              </Panel>
            ) : null}

            <Panel>
              <SectionHeading
                eyebrow="Cuentas"
                title="Balance y flujo por cuenta"
                description="Compara saldo actual con ingresos, egresos y transferencias internas del rango consultado."
              />
              {summary.accountSummaries.length ? (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Cuenta</th>
                        <th>Moneda</th>
                        <th className="text-right">Balance</th>
                        <th className="text-right">Ingresos</th>
                        <th className="text-right">Egresos</th>
                        <th className="text-right">Neto</th>
                        <th className="text-right">Transfer In</th>
                        <th className="text-right">Transfer Out</th>
                        <th className="text-right">Posteados</th>
                        <th className="text-right">Anulados</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.accountSummaries.map((item) => (
                        <tr key={item.accountId}>
                          <td>{item.name}</td>
                          <td><StatusBadge value={item.currency} /></td>
                          <td className="text-right">{formatCurrency(Number(item.balance), item.currency)}</td>
                          <td className="text-right">{formatCurrency(Number(item.operationalIncomeAmount), item.currency)}</td>
                          <td className="text-right">{formatCurrency(Number(item.operationalExpenseAmount), item.currency)}</td>
                          <td className="text-right">{formatCurrency(Number(item.netOperationalAmount), item.currency)}</td>
                          <td className="text-right">{formatCurrency(Number(item.transferInAmount), item.currency)}</td>
                          <td className="text-right">{formatCurrency(Number(item.transferOutAmount), item.currency)}</td>
                          <td className="text-right">{item.postedTransactionCount}</td>
                          <td className="text-right">{item.voidedTransactionCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="Sin cuentas resumidas" description="No hay balances visibles para el filtro activo." compact />
              )}
            </Panel>

            <div className="two-column-grid">
              <Panel>
                <SectionHeading
                  eyebrow="Diario"
                  title="Actividad por fecha"
                  description="Sirve como conciliacion operativa rapida del flujo neto y de los movimientos internos." 
                />
                {summary.dailySummaries.length ? (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th className="text-right">Ingresos</th>
                          <th className="text-right">Egresos</th>
                          <th className="text-right">Neto</th>
                          <th className="text-right">Transferencias</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.dailySummaries.map((item) => (
                          <tr key={item.date}>
                            <td>{formatDate(item.date)}</td>
                            <td className="text-right">{formatCurrency(Number(item.operationalIncomeAmount))}</td>
                            <td className="text-right">{formatCurrency(Number(item.operationalExpenseAmount))}</td>
                            <td className="text-right">{formatCurrency(Number(item.netOperationalAmount))}</td>
                            <td className="text-right">{formatCurrency(Number(item.transferVolumeAmount))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState title="Sin actividad diaria" description="El rango actual no arroja movimientos contabilizados." compact />
                )}
              </Panel>

              <Panel>
                <SectionHeading
                  eyebrow="Recientes"
                  title="Ultimos movimientos dentro del filtro"
                  description="Referencia rapida para revisar anulaciones, transferencias y conceptos antes de ir al detalle operativo." 
                />
                {summary.recentTransactions.length ? (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Cuenta</th>
                          <th>Concepto</th>
                          <th>Tipo</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.recentTransactions.map((transaction) => (
                          <tr key={transaction.id}>
                            <td>{formatDate(transaction.transactionDate)}</td>
                            <td>{accountNameById.get(transaction.accountId) ?? `Cuenta #${transaction.accountId}`}</td>
                            <td>{transaction.description}</td>
                            <td><StatusBadge value={transaction.relatedEntityType === 'finance_transfer' ? 'transfer' : transaction.type} /></td>
                            <td><StatusBadge value={transaction.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState title="Sin movimientos recientes" description="No hay movimientos para mostrar con el filtro activo." compact />
                )}
              </Panel>
            </div>
          </>
        ) : reportQuery.isPending ? (
          <Panel>
            <SectionHeading eyebrow="Reporte" title="Cargando conciliacion" description="Consultando balances, flujos y alertas para el tenant activo." />
          </Panel>
        ) : (
          <EmptyState title="Sin reporte disponible" description="Ajusta los filtros o recarga la consulta para construir el resumen financiero." />
        )}
      </div>
    </PermissionGuard>
  );
}

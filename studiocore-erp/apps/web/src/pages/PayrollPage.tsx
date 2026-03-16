import type {
  BranchRecord,
  CreatePayrollPeriodInput,
  EnvelopeResponse,
  PaginatedResponse,
  PayrollPeriodDetailRecord,
  PayrollPeriodRecord,
  UpdatePayrollPeriodInput,
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
  TextAreaInput,
  TextInput,
} from '@studiocore/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Calculator, Download, Lock, LockOpen, Plus, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EntitySelectionList } from '../components/EntitySelectionList';
import { PermissionGuard } from '../components/PermissionGuard';
import { useApiClient, useAuth } from '../lib/auth';
import { toNullableString } from '../lib/forms';
import { formatDate, formatDateTime } from '../lib/format';

type PayrollFormState = {
  branchId: string;
  code: string;
  label: string;
  periodStart: string;
  periodEnd: string;
  notes: string;
};

const emptyForm: PayrollFormState = {
  branchId: '',
  code: '',
  label: '',
  periodStart: '',
  periodEnd: '',
  notes: '',
};

function toFormState(period?: PayrollPeriodRecord | null): PayrollFormState {
  if (!period) {
    return emptyForm;
  }

  return {
    branchId: String(period.branchId),
    code: period.code,
    label: period.label,
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
    notes: period.notes ?? '',
  };
}

export function PayrollPage() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { hasPermission, session } = useAuth();
  const hasCompanyWideAccess = session?.user.hasCompanyWideAccess ?? false;
  const activeBranchId = session?.user.activeBranchId ?? null;
  const canCreate = hasPermission('payroll.create');
  const canEdit = hasPermission('payroll.edit');
  const canCalculate = hasPermission('payroll.calculate');
  const canClose = hasPermission('payroll.close');
  const canReopen = hasPermission('payroll.reopen');
  const canExport = hasPermission('payroll.export');
  const canViewBranches = hasPermission('branches.view');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('edit');
  const [form, setForm] = useState<PayrollFormState>(emptyForm);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunningAction, setIsRunningAction] = useState(false);

  const periodsQuery = useQuery({
    queryKey: ['payroll-periods', search],
    queryFn: () => {
      const params = new URLSearchParams({ page: '1', pageSize: '100' });
      if (search.trim()) {
        params.set('search', search.trim());
      }
      return api.get<PaginatedResponse<PayrollPeriodRecord>>(`/payroll/periods?${params.toString()}`);
    },
  });

  const branchesQuery = useQuery({
    queryKey: ['payroll-branches'],
    queryFn: () => api.get<PaginatedResponse<BranchRecord>>('/branches?page=1&pageSize=100'),
    enabled: canViewBranches,
  });

  const detailQuery = useQuery({
    queryKey: ['payroll-period-detail', selectedId],
    queryFn: () => api.get<EnvelopeResponse<PayrollPeriodDetailRecord>>(`/payroll/periods/${selectedId}`),
    enabled: selectedId !== null,
  });

  const periods = periodsQuery.data?.items ?? [];
  const branches = branchesQuery.data?.items ?? [];
  const selectedPeriod = periods.find((item) => item.id === selectedId) ?? null;
  const periodDetail = detailQuery.data?.data ?? null;
  const latestRun = periodDetail?.latestRun ?? null;
  const branchNameById = useMemo(() => new Map(branches.map((branch) => [branch.id, `${branch.name} (${branch.code})`])), [branches]);

  useEffect(() => {
    if (mode === 'create') {
      return;
    }

    if (!periods.length) {
      setSelectedId(null);
      setForm(emptyForm);
      return;
    }

    if (!selectedId || !periods.some((period) => period.id === selectedId)) {
      const first = periods[0];
      setSelectedId(first.id);
      setForm(toFormState(first));
      return;
    }

    setForm(toFormState(selectedPeriod));
  }, [mode, periods, selectedId, selectedPeriod]);

  async function refreshPeriods() {
    setFeedback(null);
    const tasks: Array<Promise<unknown>> = [periodsQuery.refetch()];
    if (selectedId !== null) {
      tasks.push(detailQuery.refetch());
    }
    if (canViewBranches) {
      tasks.push(branchesQuery.refetch());
    }
    await Promise.all(tasks);
  }

  function startCreate() {
    setMode('create');
    setSelectedId(null);
    setForm({
      ...emptyForm,
      branchId: !hasCompanyWideAccess && activeBranchId ? String(activeBranchId) : '',
    });
    setFeedback(null);
  }

  async function syncPeriod(periodId?: number | null, successMessage?: string) {
    await queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
    const refreshed = await periodsQuery.refetch();
    const nextPeriods = refreshed.data?.items ?? [];
    const nextId = periodId && nextPeriods.some((item) => item.id === periodId) ? periodId : nextPeriods[0]?.id ?? null;
    setMode('edit');
    setSelectedId(nextId);
    setForm(toFormState(nextPeriods.find((item) => item.id === nextId) ?? null));
    if (nextId !== null) {
      await queryClient.invalidateQueries({ queryKey: ['payroll-period-detail', nextId] });
    }
    setFeedback(successMessage ? { tone: 'success', message: successMessage } : null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsSaving(true);

    try {
      if (mode === 'create') {
        const payload: CreatePayrollPeriodInput = {
          branchId: Number(form.branchId),
          code: form.code.trim(),
          label: form.label.trim(),
          periodStart: form.periodStart,
          periodEnd: form.periodEnd,
          ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
        };

        const response = await api.post<EnvelopeResponse<PayrollPeriodDetailRecord>>('/payroll/periods', payload);
        await syncPeriod(response.data.id, `Periodo \`${response.data.code}\` creado correctamente.`);
      } else if (selectedPeriod) {
        const payload: UpdatePayrollPeriodInput = {
          branchId: Number(form.branchId),
          code: form.code.trim(),
          label: form.label.trim(),
          periodStart: form.periodStart,
          periodEnd: form.periodEnd,
          notes: toNullableString(form.notes),
        };

        const response = await api.patch<EnvelopeResponse<PayrollPeriodDetailRecord>>(`/payroll/periods/${selectedPeriod.id}`, payload);
        await syncPeriod(response.data.id, `Periodo \`${response.data.code}\` actualizado.`);
      }
    } catch (error) {
      setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'No fue posible guardar el periodo.' });
    } finally {
      setIsSaving(false);
    }
  }

  async function runPeriodAction(action: 'calculate' | 'close' | 'reopen', successMessage: string) {
    if (!selectedPeriod) {
      return;
    }

    setFeedback(null);
    setIsRunningAction(true);
    try {
      await api.post<EnvelopeResponse<PayrollPeriodDetailRecord>>(`/payroll/periods/${selectedPeriod.id}/${action}`, {});
      await syncPeriod(selectedPeriod.id, successMessage);
    } catch (error) {
      setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'No fue posible ejecutar la accion.' });
    } finally {
      setIsRunningAction(false);
    }
  }

  async function exportPeriod() {
    if (!selectedPeriod) {
      return;
    }

    setFeedback(null);
    setIsRunningAction(true);
    try {
      const csv = await api.get<string>(`/payroll/periods/${selectedPeriod.id}/export`);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedPeriod.code.toLowerCase()}-snapshot.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setFeedback({ tone: 'success', message: `Exportacion CSV generada para \`${selectedPeriod.code}\`.` });
    } catch (error) {
      setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'No fue posible exportar el periodo.' });
    } finally {
      setIsRunningAction(false);
    }
  }

  return (
    <PermissionGuard permission="payroll.view">
      <div className="page-stack">
        <PageHero
          eyebrow="Nomina"
          title="Periodos de nomina"
          description="Crea periodos, consolida la operacion ya capturada y valida cierres o reaperturas con un snapshot base sobre contratos, asistencia, ausencias, metas y tiempo en linea."
          actions={canCreate ? <ActionButton onClick={startCreate}><Plus size={16} />Nuevo periodo</ActionButton> : null}
        />

        <div className="workspace-grid">
          <Panel>
            <EntitySelectionList
              eyebrow="Listado"
              title="Periodos visibles"
              description="Gestiona periodos por sede y revisa su ultimo estado de calculo." 
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar por codigo, nombre o notas"
              items={periods}
              selectedId={selectedId}
              getId={(item) => item.id}
              renderTitle={(item) => <><strong>{item.label}</strong><StatusBadge value={item.status} /></>}
              renderDescription={(item) => <><p>{item.code}</p><p>{formatDate(item.periodStart)} - {formatDate(item.periodEnd)}</p></>}
              renderMeta={(item) => <><span>{item.branchName ?? `Sede #${item.branchId}`}</span><span>{item.lastCalculatedAt ? formatDateTime(item.lastCalculatedAt) : 'Sin calculo'}</span></>}
              emptyTitle="Sin periodos visibles"
              emptyDescription="Todavia no hay periodos de nomina para el filtro actual."
              loading={periodsQuery.isPending}
              error={periodsQuery.error instanceof Error ? periodsQuery.error.message : null}
              onRefresh={() => void refreshPeriods()}
              onSelect={(item) => {
                setMode('edit');
                setSelectedId(item.id);
                setForm(toFormState(item));
                setFeedback(null);
              }}
              action={canCreate ? <ActionButton variant="secondary" className="small-button" onClick={startCreate}><Plus size={16} />Alta</ActionButton> : null}
            />
          </Panel>

          <Panel>
            <SectionHeading
              eyebrow="Editor"
              title={mode === 'create' ? 'Crear periodo' : 'Editar periodo'}
              description={mode === 'create' ? 'Define el rango y la sede antes de congelar el primer snapshot.' : 'Ajusta metadata del periodo o ejecuta calculo, cierre y reapertura.'}
              actions={
                mode === 'edit' && selectedPeriod ? (
                  <div className="detail-chip-row wrap-row">
                    {canCalculate ? <ActionButton variant="secondary" className="small-button" onClick={() => void runPeriodAction('calculate', 'Periodo recalculado correctamente.')} disabled={isRunningAction || selectedPeriod.status === 'closed'}><Calculator size={16} />Calcular</ActionButton> : null}
                    {canClose ? <ActionButton variant="secondary" className="small-button" onClick={() => void runPeriodAction('close', 'Periodo cerrado correctamente.')} disabled={isRunningAction || selectedPeriod.status !== 'calculated'}><Lock size={16} />Cerrar</ActionButton> : null}
                    {canReopen ? <ActionButton variant="secondary" className="small-button" onClick={() => void runPeriodAction('reopen', 'Periodo reabierto correctamente.')} disabled={isRunningAction || selectedPeriod.status !== 'closed'}><LockOpen size={16} />Reabrir</ActionButton> : null}
                    {canExport ? <ActionButton variant="secondary" className="small-button" onClick={() => void exportPeriod()} disabled={isRunningAction || !latestRun}><Download size={16} />Exportar</ActionButton> : null}
                  </div>
                ) : null
              }
            />

            {feedback ? <InlineMessage tone={feedback.tone}>{feedback.message}</InlineMessage> : null}
            {!canViewBranches ? <InlineMessage tone="info">Tu sesion no incluye `branches.view`; la sede queda restringida al contexto activo.</InlineMessage> : null}

            <form className="editor-form" onSubmit={handleSubmit}>
              <div className="field-grid two-columns">
                <Field label="Sede" htmlFor="payroll-branch-id">
                  <SelectInput id="payroll-branch-id" value={form.branchId} onChange={(event) => setForm((current) => ({ ...current, branchId: event.target.value }))} disabled={(!canCreate && !canEdit) || !hasCompanyWideAccess} required>
                    <option value="">Selecciona</option>
                    {!hasCompanyWideAccess && activeBranchId && !branches.some((branch) => branch.id === activeBranchId) ? <option value={activeBranchId}>{`Sede activa #${activeBranchId}`}</option> : null}
                    {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name} ({branch.code})</option>)}
                  </SelectInput>
                </Field>

                <Field label="Codigo" htmlFor="payroll-code">
                  <TextInput id="payroll-code" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} disabled={!canCreate && !canEdit} required />
                </Field>

                <Field label="Nombre" htmlFor="payroll-label">
                  <TextInput id="payroll-label" value={form.label} onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))} disabled={!canCreate && !canEdit} required />
                </Field>

                <Field label="Estado actual">
                  <div className="detail-chip-row wrap-row">
                    <StatusBadge value={selectedPeriod?.status ?? (mode === 'create' ? 'draft' : '--')} />
                    <span>{selectedPeriod?.lastCalculatedAt ? `Calculado ${formatDateTime(selectedPeriod.lastCalculatedAt)}` : 'Sin calculo'}</span>
                    <span>{selectedPeriod?.closedAt ? `Cerrado ${formatDateTime(selectedPeriod.closedAt)}` : 'Abierto'}</span>
                  </div>
                </Field>

                <Field label="Inicio" htmlFor="payroll-period-start">
                  <TextInput id="payroll-period-start" type="date" value={form.periodStart} onChange={(event) => setForm((current) => ({ ...current, periodStart: event.target.value }))} disabled={!canCreate && !canEdit} required />
                </Field>

                <Field label="Fin" htmlFor="payroll-period-end">
                  <TextInput id="payroll-period-end" type="date" value={form.periodEnd} onChange={(event) => setForm((current) => ({ ...current, periodEnd: event.target.value }))} disabled={!canCreate && !canEdit} required />
                </Field>
              </div>

              <Field label="Notas" htmlFor="payroll-notes">
                <TextAreaInput id="payroll-notes" rows={3} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} disabled={!canCreate && !canEdit} />
              </Field>

              {canCreate || canEdit ? (
                <div className="form-actions-row">
                  <ActionButton type="submit" disabled={isSaving || (mode === 'edit' && !selectedPeriod)}>
                    <Save size={16} />
                    {isSaving ? 'Guardando...' : mode === 'create' ? 'Crear periodo' : 'Guardar cambios'}
                  </ActionButton>
                  {mode === 'create' && periods.length ? <ActionButton variant="secondary" onClick={() => {
                    const first = periods[0];
                    setMode('edit');
                    setSelectedId(first.id);
                    setForm(toFormState(first));
                    setFeedback(null);
                  }}>Cancelar</ActionButton> : null}
                </div>
              ) : null}
            </form>

            <SectionHeading eyebrow="Snapshot" title="Ultimo calculo" description="El resumen integra contratos, asistencia, ausencias, tiempo en linea y metas cerradas dentro del periodo." />

            {detailQuery.isPending && selectedId !== null ? (
              <div className="table-skeleton">
                {Array.from({ length: 4 }).map((_, index) => <div key={index} className="skeleton-line" />)}
              </div>
            ) : latestRun ? (
              <div className="page-stack">
                <div className="content-grid four-columns">
                  <KpiCard label="Personas" value={latestRun.totals.peopleCount} hint="Con actividad o contrato aplicable" />
                  <KpiCard label="Asistencia" value={latestRun.totals.attendanceCount} hint={`${latestRun.totals.lateCount} tardanzas`} />
                  <KpiCard label="Novedades" value={latestRun.totals.noveltyAmount} hint={`${latestRun.totals.pendingCriticalNoveltyCount} criticas pendientes`} />
                  <KpiCard label="Online" value={latestRun.totals.onlineMinutes} hint={`${latestRun.totals.onlineSessionCount} sesiones`} />
                  <KpiCard label="Proyeccion" value={latestRun.totals.projectedCompensationAmount} hint="Fijo + bono de metas cerradas" />
                </div>

                <div className="table-wrap compact-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Persona</th>
                        <th>Fijo</th>
                        <th>Asistencia</th>
                        <th>Ausencias</th>
                        <th>Novedades</th>
                        <th>Online</th>
                        <th>Metas</th>
                        <th>Proyeccion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestRun.items.map((item) => (
                        <tr key={`payroll-item-${item.personId}`}>
                          <td>
                            <strong>{item.personName}</strong>
                            <div>{item.personType}</div>
                          </td>
                          <td>{item.fixedCompensationAmount ?? '--'}</td>
                          <td>
                            <strong>{item.attendanceCount}</strong>
                            <div>{item.lateCount} tardanzas</div>
                          </td>
                          <td>
                            <strong>{item.absenceCount}</strong>
                            <div>{item.pendingAbsenceCount} pendientes / {item.approvedAbsenceCount} aprobadas</div>
                          </td>
                          <td>
                            <strong>{item.noveltyAmount}</strong>
                            <div>{item.approvedNoveltyCount} aprobadas / {item.pendingCriticalNoveltyCount} criticas pendientes</div>
                          </td>
                          <td>
                            <strong>{item.onlineMinutes} min</strong>
                            <div>{item.tokenCount} tokens / {item.grossAmount}</div>
                          </td>
                          <td>
                            <strong>{item.goalBonusAmount}</strong>
                            <div>{item.goalAchievedAmount} de {item.goalTargetAmount}</div>
                          </td>
                          <td>{item.projectedCompensationAmount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <SectionHeading
                  eyebrow="Items"
                  title="Desglose por persona"
                  description="Cada item resume componentes monetarios y alertas operativas congeladas dentro del ultimo snapshot calculado."
                />

                <div className="permission-grid">
                  {latestRun.items.map((item) => (
                    <article key={`payroll-card-${item.personId}`} className="permission-card payroll-item-card">
                      <div className="module-card-title">
                        <strong>{item.personName}</strong>
                        <StatusBadge value={item.personType} />
                      </div>

                      <div className="detail-list">
                        <div>
                          <span>Proyeccion</span>
                          <strong>{item.projectedCompensationAmount}</strong>
                        </div>
                        <div>
                          <span>Novedades</span>
                          <strong>{item.noveltyAmount}</strong>
                        </div>
                        <div>
                          <span>Asistencia / online</span>
                          <strong>{item.attendanceCount} asist. / {item.onlineMinutes} min</strong>
                        </div>
                      </div>

                      {item.components.length ? (
                        <div className="component-list">
                          {item.components.map((component, index) => (
                            <div key={`payroll-component-${item.personId}-${component.code}-${component.sourceId ?? index}`} className="component-row">
                              <div>
                                <strong>{component.label}</strong>
                                <small>{component.detail ?? component.sourceType}</small>
                              </div>
                              <strong>{component.amount}</strong>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>Sin componentes monetarios congelados en este snapshot.</p>
                      )}

                      {item.alerts.length ? (
                        <div className="alert-list">
                          {item.alerts.map((alert, index) => (
                            <span key={`payroll-alert-${item.personId}-${alert.code}-${alert.sourceId ?? index}`} className="status-badge neutral">
                              {alert.label}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title="Sin calculo todavia" description="Ejecuta el calculo del periodo para congelar el primer snapshot operativo de nomina." compact />
            )}
          </Panel>
        </div>
      </div>
    </PermissionGuard>
  );
}

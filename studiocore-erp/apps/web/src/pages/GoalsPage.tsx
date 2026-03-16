import type {
  BranchRecord,
  CreateGoalInput,
  EnvelopeResponse,
  GoalRecord,
  OperationShiftRecord,
  PaginatedResponse,
  PersonRecord,
  UpdateGoalInput,
} from '@studiocore/contracts';
import {
  ActionButton,
  Field,
  InlineMessage,
  PageHero,
  Panel,
  SectionHeading,
  SelectInput,
  StatusBadge,
  TextAreaInput,
  TextInput,
} from '@studiocore/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EntitySelectionList } from '../components/EntitySelectionList';
import { PermissionGuard } from '../components/PermissionGuard';
import { useApiClient, useAuth } from '../lib/auth';
import { toNullableString, toOptionalString } from '../lib/forms';
import { formatDate, formatDateTime, shortText } from '../lib/format';

type GoalFormState = {
  branchId: string;
  personId: string;
  shiftId: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  targetAmount: string;
  achievedAmount: string;
  bonusAmount: string;
  status: 'draft' | 'active' | 'closed';
  notes: string;
};

const emptyForm: GoalFormState = {
  branchId: '',
  personId: '',
  shiftId: '',
  title: '',
  periodStart: '',
  periodEnd: '',
  targetAmount: '',
  achievedAmount: '',
  bonusAmount: '',
  status: 'draft',
  notes: '',
};

function toFormState(record?: GoalRecord | null): GoalFormState {
  if (!record) {
    return emptyForm;
  }

  return {
    branchId: String(record.branchId),
    personId: String(record.personId),
    shiftId: record.shiftId ? String(record.shiftId) : '',
    title: record.title,
    periodStart: record.periodStart,
    periodEnd: record.periodEnd,
    targetAmount: record.targetAmount,
    achievedAmount: record.achievedAmount ?? '',
    bonusAmount: record.bonusAmount ?? '',
    status: record.status,
    notes: record.notes ?? '',
  };
}

export function GoalsPage() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { hasPermission, session } = useAuth();
  const hasCompanyWideAccess = session?.user.hasCompanyWideAccess ?? false;
  const activeBranchId = session?.user.activeBranchId ?? null;
  const canCreate = hasPermission('goals.create');
  const canEdit = hasPermission('goals.edit');
  const canViewBranches = hasPermission('branches.view');
  const canViewPeople = hasPermission('people.view');
  const canViewOperations = hasPermission('operations.view');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('edit');
  const [form, setForm] = useState<GoalFormState>(emptyForm);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const goalsQuery = useQuery({
    queryKey: ['goal-records', search],
    queryFn: () => {
      const params = new URLSearchParams({ page: '1', pageSize: '100' });
      if (search.trim()) {
        params.set('search', search.trim());
      }
      return api.get<PaginatedResponse<GoalRecord>>(`/goals?${params.toString()}`);
    },
  });

  const branchesQuery = useQuery({
    queryKey: ['goal-branches'],
    queryFn: () => api.get<PaginatedResponse<BranchRecord>>('/branches?page=1&pageSize=100'),
    enabled: canViewBranches,
  });

  const peopleQuery = useQuery({
    queryKey: ['goal-people'],
    queryFn: () => api.get<PaginatedResponse<PersonRecord>>('/people?page=1&pageSize=200'),
    enabled: canViewPeople,
  });

  const shiftsQuery = useQuery({
    queryKey: ['goal-shifts'],
    queryFn: () => api.get<PaginatedResponse<OperationShiftRecord>>('/operations/shifts?page=1&pageSize=200'),
    enabled: canViewOperations,
  });

  const records = goalsQuery.data?.items ?? [];
  const branches = branchesQuery.data?.items ?? [];
  const people = peopleQuery.data?.items ?? [];
  const shifts = shiftsQuery.data?.items ?? [];
  const selectedRecord = records.find((record) => record.id === selectedId) ?? null;
  const branchNameById = useMemo(() => new Map(branches.map((branch) => [branch.id, `${branch.name} (${branch.code})`])), [branches]);
  const shiftOptions = useMemo(
    () =>
      shifts.filter((shift) => {
        const matchesBranch = !form.branchId || shift.branchId === Number(form.branchId);
        const matchesPerson = !form.personId || shift.personId === Number(form.personId);
        return matchesBranch && matchesPerson;
      }),
    [form.branchId, form.personId, shifts],
  );

  useEffect(() => {
    if (mode === 'create') {
      return;
    }

    if (!records.length) {
      setSelectedId(null);
      setForm(emptyForm);
      return;
    }

    if (!selectedId || !records.some((record) => record.id === selectedId)) {
      const first = records[0];
      setSelectedId(first.id);
      setForm(toFormState(first));
      return;
    }

    setForm(toFormState(selectedRecord));
  }, [mode, records, selectedId, selectedRecord]);

  async function refreshGoals() {
    setFeedback(null);
    const tasks: Array<Promise<unknown>> = [goalsQuery.refetch()];
    if (canViewBranches) {
      tasks.push(branchesQuery.refetch());
    }
    if (canViewPeople) {
      tasks.push(peopleQuery.refetch());
    }
    if (canViewOperations) {
      tasks.push(shiftsQuery.refetch());
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsSaving(true);

    try {
      if (mode === 'create') {
        const payload: CreateGoalInput = {
          branchId: Number(form.branchId),
          personId: Number(form.personId),
          ...(form.shiftId ? { shiftId: Number(form.shiftId) } : {}),
          title: form.title.trim(),
          periodStart: form.periodStart,
          periodEnd: form.periodEnd,
          targetAmount: form.targetAmount.trim(),
          ...(toOptionalString(form.achievedAmount) ? { achievedAmount: toOptionalString(form.achievedAmount) } : {}),
          ...(toOptionalString(form.bonusAmount) ? { bonusAmount: toOptionalString(form.bonusAmount) } : {}),
          status: form.status,
          ...(toOptionalString(form.notes) ? { notes: toOptionalString(form.notes) } : {}),
        };

        const response = await api.post<EnvelopeResponse<GoalRecord>>('/goals', payload);
        await queryClient.invalidateQueries({ queryKey: ['goal-records'] });
        setMode('edit');
        setSelectedId(response.data.id);
        setForm(toFormState(response.data));
        setFeedback({ tone: 'success', message: `Meta #${response.data.id} creada correctamente.` });
      } else if (selectedRecord) {
        const payload: UpdateGoalInput = {
          branchId: Number(form.branchId),
          personId: Number(form.personId),
          shiftId: form.shiftId ? Number(form.shiftId) : null,
          title: form.title.trim(),
          periodStart: form.periodStart,
          periodEnd: form.periodEnd,
          targetAmount: form.targetAmount.trim(),
          achievedAmount: toNullableString(form.achievedAmount),
          bonusAmount: toNullableString(form.bonusAmount),
          status: form.status,
          notes: toNullableString(form.notes),
        };

        const response = await api.patch<EnvelopeResponse<GoalRecord>>(`/goals/${selectedRecord.id}`, payload);
        await queryClient.invalidateQueries({ queryKey: ['goal-records'] });
        setForm(toFormState(response.data));
        setFeedback({ tone: 'success', message: `Meta #${response.data.id} actualizada.` });
      }
    } catch (error) {
      setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'No fue posible guardar la meta.' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PermissionGuard permission="goals.view">
      <div className="page-stack">
        <PageHero
          eyebrow="Operacion"
          title="Metas"
          description="Define metas y bonos base por persona, turno o periodo para preparar la capa comercial y el posterior enlace con nomina."
          actions={canCreate ? <ActionButton onClick={startCreate}><Plus size={16} />Nueva meta</ActionButton> : null}
        />

        <div className="workspace-grid">
          <Panel>
            <EntitySelectionList
              eyebrow="Seguimiento"
              title="Metas registradas"
              description="Consulta objetivos, avance y bono base por sede, persona o turno." 
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar por titulo, persona o turno"
              items={records}
              selectedId={selectedId}
              getId={(item) => item.id}
              renderTitle={(item) => <><strong>{item.title}</strong><StatusBadge value={item.status} /></>}
              renderDescription={(item) => <><p>{item.personName}</p><p>{formatDate(item.periodStart)} - {formatDate(item.periodEnd)}</p></>}
              renderMeta={(item) => <><span>{item.branchName ?? `Sede #${item.branchId}`}</span><span>{shortText(item.targetAmount, '0')}</span></>}
              emptyTitle="Sin metas visibles"
              emptyDescription="Todavia no hay metas para el filtro actual."
              loading={goalsQuery.isPending}
              error={goalsQuery.error instanceof Error ? goalsQuery.error.message : null}
              onRefresh={() => void refreshGoals()}
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
              title={mode === 'create' ? 'Crear meta' : 'Editar meta'}
              description={mode === 'create' ? 'Define objetivo, ventana operativa y bono base del periodo.' : 'Ajusta avance, cierre y compensacion variable del objetivo seleccionado.'}
            />

            {feedback ? <InlineMessage tone={feedback.tone}>{feedback.message}</InlineMessage> : null}
            {!canViewPeople ? <InlineMessage tone="info">Tu sesion no incluye `people.view`; no podras reasignar personas desde esta vista.</InlineMessage> : null}
            {!canViewOperations ? <InlineMessage tone="info">Tu sesion no incluye `operations.view`; el selector de turno queda deshabilitado.</InlineMessage> : null}

            <form className="editor-form" onSubmit={handleSubmit}>
              <div className="field-grid two-columns">
                <Field label="Sede" htmlFor="goal-branch-id">
                  <SelectInput id="goal-branch-id" value={form.branchId} onChange={(event) => setForm((current) => ({ ...current, branchId: event.target.value, shiftId: '' }))} disabled={(!canCreate && !canEdit) || !hasCompanyWideAccess} required>
                    <option value="">Selecciona</option>
                    {!hasCompanyWideAccess && activeBranchId && !branches.some((branch) => branch.id === activeBranchId) ? <option value={activeBranchId}>{`Sede activa #${activeBranchId}`}</option> : null}
                    {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name} ({branch.code})</option>)}
                  </SelectInput>
                </Field>

                <Field label="Persona" htmlFor="goal-person-id">
                  <SelectInput id="goal-person-id" value={form.personId} onChange={(event) => setForm((current) => ({ ...current, personId: event.target.value, shiftId: '' }))} disabled={(!canCreate && !canEdit) || !canViewPeople} required>
                    <option value="">Selecciona</option>
                    {people.map((person) => <option key={person.id} value={person.id}>{person.firstName} {person.lastName}</option>)}
                  </SelectInput>
                </Field>

                <Field label="Turno asociado" htmlFor="goal-shift-id">
                  <SelectInput id="goal-shift-id" value={form.shiftId} onChange={(event) => setForm((current) => ({ ...current, shiftId: event.target.value }))} disabled={(!canCreate && !canEdit) || !canViewOperations}>
                    <option value="">Sin turno asociado</option>
                    {shiftOptions.map((shift) => <option key={shift.id} value={shift.id}>{shift.title} - {shift.personName}</option>)}
                  </SelectInput>
                </Field>

                <Field label="Estado" htmlFor="goal-status">
                  <SelectInput id="goal-status" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as GoalFormState['status'] }))} disabled={!canCreate && !canEdit}>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </SelectInput>
                </Field>
              </div>

              <Field label="Titulo" htmlFor="goal-title">
                <TextInput id="goal-title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} disabled={!canCreate && !canEdit} required />
              </Field>

              <div className="field-grid two-columns">
                <Field label="Periodo inicio" htmlFor="goal-period-start">
                  <TextInput id="goal-period-start" type="date" value={form.periodStart} onChange={(event) => setForm((current) => ({ ...current, periodStart: event.target.value }))} disabled={!canCreate && !canEdit} required />
                </Field>

                <Field label="Periodo fin" htmlFor="goal-period-end">
                  <TextInput id="goal-period-end" type="date" value={form.periodEnd} onChange={(event) => setForm((current) => ({ ...current, periodEnd: event.target.value }))} disabled={!canCreate && !canEdit} required />
                </Field>

                <Field label="Meta objetivo" htmlFor="goal-target-amount">
                  <TextInput id="goal-target-amount" value={form.targetAmount} onChange={(event) => setForm((current) => ({ ...current, targetAmount: event.target.value }))} disabled={!canCreate && !canEdit} required />
                </Field>

                <Field label="Monto logrado" htmlFor="goal-achieved-amount">
                  <TextInput id="goal-achieved-amount" value={form.achievedAmount} onChange={(event) => setForm((current) => ({ ...current, achievedAmount: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>

                <Field label="Bono base" htmlFor="goal-bonus-amount">
                  <TextInput id="goal-bonus-amount" value={form.bonusAmount} onChange={(event) => setForm((current) => ({ ...current, bonusAmount: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>

                <Field label="Resumen actual">
                  <div className="detail-chip-row wrap-row">
                    <StatusBadge value={selectedRecord?.status ?? (mode === 'create' ? 'draft' : '--')} />
                    <span>{selectedRecord?.personName ?? 'Sin persona seleccionada'}</span>
                    <span>{selectedRecord ? shortText(selectedRecord.targetAmount, '0') : 'Nueva meta'}</span>
                  </div>
                </Field>
              </div>

              <Field label="Notas" htmlFor="goal-notes">
                <TextAreaInput id="goal-notes" rows={4} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} disabled={!canCreate && !canEdit} />
              </Field>

              {selectedRecord ? (
                <div className="detail-list">
                  <div><span>Sede</span><strong>{branchNameById.get(selectedRecord.branchId) ?? selectedRecord.branchName ?? `Sede #${selectedRecord.branchId}`}</strong></div>
                  <div><span>Turno asociado</span><strong>{selectedRecord.shiftTitle ?? 'Sin turno asociado'}</strong></div>
                  <div><span>Periodo</span><strong>{formatDate(selectedRecord.periodStart)} - {formatDate(selectedRecord.periodEnd)}</strong></div>
                  <div><span>Actualizado</span><strong>{formatDateTime(selectedRecord.updatedAt)}</strong></div>
                </div>
              ) : null}

              {canCreate || canEdit ? (
                <div className="form-actions-row">
                  <ActionButton type="submit" disabled={isSaving || (mode === 'edit' && !selectedRecord)}>
                    <Save size={16} />
                    {isSaving ? 'Guardando...' : mode === 'create' ? 'Crear meta' : 'Guardar cambios'}
                  </ActionButton>
                  {mode === 'create' && records.length ? <ActionButton variant="secondary" onClick={() => {
                    const first = records[0];
                    setMode('edit');
                    setSelectedId(first.id);
                    setForm(toFormState(first));
                    setFeedback(null);
                  }}>Cancelar</ActionButton> : null}
                </div>
              ) : null}
            </form>
          </Panel>
        </div>
      </div>
    </PermissionGuard>
  );
}

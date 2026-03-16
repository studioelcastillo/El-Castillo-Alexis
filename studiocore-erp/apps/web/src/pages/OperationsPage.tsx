import type {
  BranchRecord,
  CreateOperationShiftInput,
  EnvelopeResponse,
  OperationShiftRecord,
  PaginatedResponse,
  PersonRecord,
  UpdateOperationShiftInput,
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
import { formatDateTime, shortText } from '../lib/format';

type ShiftFormState = {
  branchId: string;
  personId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  platformName: string;
  roomLabel: string;
  goalAmount: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string;
};

const emptyForm: ShiftFormState = {
  branchId: '',
  personId: '',
  title: '',
  startsAt: '',
  endsAt: '',
  platformName: '',
  roomLabel: '',
  goalAmount: '',
  status: 'scheduled',
  notes: '',
};

function toDateTimeLocalInput(value?: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function toIsoDateTime(value: string) {
  return value ? new Date(value).toISOString() : '';
}

function toFormState(shift?: OperationShiftRecord | null): ShiftFormState {
  if (!shift) {
    return emptyForm;
  }

  return {
    branchId: String(shift.branchId),
    personId: String(shift.personId),
    title: shift.title,
    startsAt: toDateTimeLocalInput(shift.startsAt),
    endsAt: toDateTimeLocalInput(shift.endsAt),
    platformName: shift.platformName ?? '',
    roomLabel: shift.roomLabel ?? '',
    goalAmount: shift.goalAmount ?? '',
    status: shift.status,
    notes: shift.notes ?? '',
  };
}

export function OperationsPage() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { hasPermission, session } = useAuth();
  const hasCompanyWideAccess = session?.user.hasCompanyWideAccess ?? false;
  const activeBranchId = session?.user.activeBranchId ?? null;
  const canCreate = hasPermission('operations.create');
  const canEdit = hasPermission('operations.edit');
  const canViewBranches = hasPermission('branches.view');
  const canViewPeople = hasPermission('people.view');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('edit');
  const [form, setForm] = useState<ShiftFormState>(emptyForm);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const shiftsQuery = useQuery({
    queryKey: ['operations-shifts', search],
    queryFn: () => {
      const params = new URLSearchParams({ page: '1', pageSize: '100' });
      if (search.trim()) {
        params.set('search', search.trim());
      }
      return api.get<PaginatedResponse<OperationShiftRecord>>(`/operations/shifts?${params.toString()}`);
    },
  });

  const branchesQuery = useQuery({
    queryKey: ['operations-branches'],
    queryFn: () => api.get<PaginatedResponse<BranchRecord>>('/branches?page=1&pageSize=100'),
    enabled: canViewBranches,
  });

  const peopleQuery = useQuery({
    queryKey: ['operations-people'],
    queryFn: () => api.get<PaginatedResponse<PersonRecord>>('/people?page=1&pageSize=200'),
    enabled: canViewPeople,
  });

  const shifts = shiftsQuery.data?.items ?? [];
  const branches = branchesQuery.data?.items ?? [];
  const people = peopleQuery.data?.items ?? [];
  const selectedShift = shifts.find((shift) => shift.id === selectedId) ?? null;
  const branchNameById = useMemo(() => new Map(branches.map((branch) => [branch.id, `${branch.name} (${branch.code})`])), [branches]);

  useEffect(() => {
    if (mode === 'create') {
      return;
    }

    if (!shifts.length) {
      setSelectedId(null);
      setForm(emptyForm);
      return;
    }

    if (!selectedId || !shifts.some((shift) => shift.id === selectedId)) {
      const first = shifts[0];
      setSelectedId(first.id);
      setForm(toFormState(first));
      return;
    }

    setForm(toFormState(selectedShift));
  }, [mode, selectedId, selectedShift, shifts]);

  async function refreshShifts() {
    setFeedback(null);
    const tasks: Array<Promise<unknown>> = [shiftsQuery.refetch()];
    if (canViewBranches) {
      tasks.push(branchesQuery.refetch());
    }
    if (canViewPeople) {
      tasks.push(peopleQuery.refetch());
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
        const payload: CreateOperationShiftInput = {
          branchId: Number(form.branchId),
          personId: Number(form.personId),
          title: form.title.trim(),
          startsAt: toIsoDateTime(form.startsAt),
          endsAt: toIsoDateTime(form.endsAt),
          ...(toOptionalString(form.platformName) ? { platformName: toOptionalString(form.platformName) } : {}),
          ...(toOptionalString(form.roomLabel) ? { roomLabel: toOptionalString(form.roomLabel) } : {}),
          ...(toOptionalString(form.goalAmount) ? { goalAmount: toOptionalString(form.goalAmount) } : {}),
          status: form.status,
          ...(toOptionalString(form.notes) ? { notes: toOptionalString(form.notes) } : {}),
        };

        const response = await api.post<EnvelopeResponse<OperationShiftRecord>>('/operations/shifts', payload);
        await queryClient.invalidateQueries({ queryKey: ['operations-shifts'] });
        setMode('edit');
        setSelectedId(response.data.id);
        setForm(toFormState(response.data));
        setFeedback({ tone: 'success', message: `Turno #${response.data.id} creado correctamente.` });
      } else if (selectedShift) {
        const payload: UpdateOperationShiftInput = {
          branchId: Number(form.branchId),
          personId: Number(form.personId),
          title: form.title.trim(),
          startsAt: toIsoDateTime(form.startsAt),
          endsAt: toIsoDateTime(form.endsAt),
          platformName: toNullableString(form.platformName),
          roomLabel: toNullableString(form.roomLabel),
          goalAmount: toNullableString(form.goalAmount),
          status: form.status,
          notes: toNullableString(form.notes),
        };

        const response = await api.patch<EnvelopeResponse<OperationShiftRecord>>(`/operations/shifts/${selectedShift.id}`, payload);
        await queryClient.invalidateQueries({ queryKey: ['operations-shifts'] });
        setForm(toFormState(response.data));
        setFeedback({ tone: 'success', message: `Turno #${response.data.id} actualizado.` });
      }
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'No fue posible guardar el turno.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PermissionGuard permission="operations.view">
      <div className="page-stack">
        <PageHero
          eyebrow="Operacion"
          title="Turnos"
          description="Planifica turnos por sede, persona y ventana horaria para preparar la siguiente fase de asistencia y metas operativas."
          actions={
            canCreate ? (
              <ActionButton onClick={startCreate}>
                <Plus size={16} />
                Nuevo turno
              </ActionButton>
            ) : null
          }
        />

        <div className="workspace-grid">
          <Panel>
            <EntitySelectionList
              eyebrow="Agenda"
              title="Turnos programados"
              description="Gestiona agenda operativa por sede y persona dentro del tenant activo."
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar por titulo, persona o plataforma"
              items={shifts}
              selectedId={selectedId}
              getId={(item) => item.id}
              renderTitle={(item) => (
                <>
                  <strong>{item.title}</strong>
                  <StatusBadge value={item.status} />
                </>
              )}
              renderDescription={(item) => (
                <>
                  <p>{item.personName}</p>
                  <p>{formatDateTime(item.startsAt)}</p>
                </>
              )}
              renderMeta={(item) => (
                <>
                  <span>{item.branchName ?? `Sede #${item.branchId}`}</span>
                  <span>{shortText(item.platformName || item.roomLabel || 'Sin plataforma')}</span>
                </>
              )}
              emptyTitle="Sin turnos visibles"
              emptyDescription="Todavia no hay turnos para el filtro actual."
              loading={shiftsQuery.isPending}
              error={shiftsQuery.error instanceof Error ? shiftsQuery.error.message : null}
              onRefresh={() => void refreshShifts()}
              onSelect={(item) => {
                setMode('edit');
                setSelectedId(item.id);
                setForm(toFormState(item));
                setFeedback(null);
              }}
              action={
                canCreate ? (
                  <ActionButton variant="secondary" className="small-button" onClick={startCreate}>
                    <Plus size={16} />
                    Alta
                  </ActionButton>
                ) : null
              }
            />
          </Panel>

          <Panel>
            <SectionHeading
              eyebrow="Editor"
              title={mode === 'create' ? 'Crear turno' : 'Editar turno'}
              description={mode === 'create' ? 'Define la ventana operativa, persona asignada y meta base del turno.' : 'Ajusta horario, plataforma y estado del turno seleccionado.'}
            />

            {feedback ? <InlineMessage tone={feedback.tone}>{feedback.message}</InlineMessage> : null}
            {!canViewPeople ? (
              <InlineMessage tone="info">Tu sesion no incluye `people.view`; solo podras revisar turnos existentes, no reasignar personas desde esta vista.</InlineMessage>
            ) : null}

            <form className="editor-form" onSubmit={handleSubmit}>
              <div className="field-grid two-columns">
                <Field label="Sede" htmlFor="operation-branch-id">
                  <SelectInput id="operation-branch-id" value={form.branchId} onChange={(event) => setForm((current) => ({ ...current, branchId: event.target.value }))} disabled={(!canCreate && !canEdit) || !hasCompanyWideAccess} required>
                    <option value="">Selecciona</option>
                    {!hasCompanyWideAccess && activeBranchId && !branches.some((branch) => branch.id === activeBranchId) ? <option value={activeBranchId}>{`Sede activa #${activeBranchId}`}</option> : null}
                    {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name} ({branch.code})</option>)}
                  </SelectInput>
                </Field>

                <Field label="Persona" htmlFor="operation-person-id">
                  <SelectInput id="operation-person-id" value={form.personId} onChange={(event) => setForm((current) => ({ ...current, personId: event.target.value }))} disabled={(!canCreate && !canEdit) || !canViewPeople} required>
                    <option value="">Selecciona</option>
                    {people.map((person) => <option key={person.id} value={person.id}>{person.firstName} {person.lastName}</option>)}
                  </SelectInput>
                </Field>

                <Field label="Titulo" htmlFor="operation-title">
                  <TextInput id="operation-title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} disabled={!canCreate && !canEdit} required />
                </Field>

                <Field label="Estado" htmlFor="operation-status">
                  <SelectInput id="operation-status" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ShiftFormState['status'] }))} disabled={!canCreate && !canEdit}>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </SelectInput>
                </Field>

                <Field label="Inicio" htmlFor="operation-starts-at">
                  <TextInput id="operation-starts-at" type="datetime-local" value={form.startsAt} onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))} disabled={!canCreate && !canEdit} required />
                </Field>

                <Field label="Fin" htmlFor="operation-ends-at">
                  <TextInput id="operation-ends-at" type="datetime-local" value={form.endsAt} onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))} disabled={!canCreate && !canEdit} required />
                </Field>

                <Field label="Plataforma" htmlFor="operation-platform-name">
                  <TextInput id="operation-platform-name" value={form.platformName} onChange={(event) => setForm((current) => ({ ...current, platformName: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>

                <Field label="Cabina / sala" htmlFor="operation-room-label">
                  <TextInput id="operation-room-label" value={form.roomLabel} onChange={(event) => setForm((current) => ({ ...current, roomLabel: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>

                <Field label="Meta base" htmlFor="operation-goal-amount">
                  <TextInput id="operation-goal-amount" value={form.goalAmount} onChange={(event) => setForm((current) => ({ ...current, goalAmount: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>

                <Field label="Resumen actual">
                  <div className="detail-chip-row wrap-row">
                    <StatusBadge value={selectedShift?.status ?? (mode === 'create' ? 'draft' : '--')} />
                    <span>{selectedShift?.personName ?? 'Sin persona seleccionada'}</span>
                    <span>{selectedShift ? shortText(selectedShift.platformName || selectedShift.roomLabel || 'Sin plataforma') : 'Nuevo turno'}</span>
                  </div>
                </Field>
              </div>

              <Field label="Notas" htmlFor="operation-notes">
                <TextAreaInput id="operation-notes" rows={4} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} disabled={!canCreate && !canEdit} />
              </Field>

              {selectedShift ? (
                <div className="detail-list">
                  <div>
                    <span>Sede</span>
                    <strong>{branchNameById.get(selectedShift.branchId) ?? selectedShift.branchName ?? `Sede #${selectedShift.branchId}`}</strong>
                  </div>
                  <div>
                    <span>Inicio programado</span>
                    <strong>{formatDateTime(selectedShift.startsAt)}</strong>
                  </div>
                  <div>
                    <span>Fin programado</span>
                    <strong>{formatDateTime(selectedShift.endsAt)}</strong>
                  </div>
                  <div>
                    <span>Actualizado</span>
                    <strong>{formatDateTime(selectedShift.updatedAt)}</strong>
                  </div>
                </div>
              ) : null}

              {canCreate || canEdit ? (
                <div className="form-actions-row">
                  <ActionButton type="submit" disabled={isSaving || (mode === 'edit' && !selectedShift)}>
                    <Save size={16} />
                    {isSaving ? 'Guardando...' : mode === 'create' ? 'Crear turno' : 'Guardar cambios'}
                  </ActionButton>
                  {mode === 'create' && shifts.length ? (
                    <ActionButton variant="secondary" onClick={() => {
                      const first = shifts[0];
                      setMode('edit');
                      setSelectedId(first.id);
                      setForm(toFormState(first));
                      setFeedback(null);
                    }}>
                      Cancelar
                    </ActionButton>
                  ) : null}
                </div>
              ) : null}
            </form>
          </Panel>
        </div>
      </div>
    </PermissionGuard>
  );
}

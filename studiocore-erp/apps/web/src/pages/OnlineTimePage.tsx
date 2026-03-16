import type {
  BranchRecord,
  CreateOnlineSessionInput,
  EnvelopeResponse,
  OnlineSessionRecord,
  OperationShiftRecord,
  PaginatedResponse,
  PersonRecord,
  UpdateOnlineSessionInput,
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

type OnlineTimeFormState = {
  branchId: string;
  personId: string;
  shiftId: string;
  label: string;
  platformName: string;
  startedAt: string;
  endedAt: string;
  tokenCount: string;
  grossAmount: string;
  status: 'open' | 'closed' | 'cancelled';
  notes: string;
};

const emptyForm: OnlineTimeFormState = {
  branchId: '',
  personId: '',
  shiftId: '',
  label: '',
  platformName: '',
  startedAt: '',
  endedAt: '',
  tokenCount: '',
  grossAmount: '',
  status: 'open',
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

function toFormState(record?: OnlineSessionRecord | null): OnlineTimeFormState {
  if (!record) {
    return emptyForm;
  }

  return {
    branchId: String(record.branchId),
    personId: String(record.personId),
    shiftId: record.shiftId ? String(record.shiftId) : '',
    label: record.label,
    platformName: record.platformName ?? '',
    startedAt: toDateTimeLocalInput(record.startedAt),
    endedAt: toDateTimeLocalInput(record.endedAt),
    tokenCount: record.tokenCount === null ? '' : String(record.tokenCount),
    grossAmount: record.grossAmount ?? '',
    status: record.status,
    notes: record.notes ?? '',
  };
}

function formatDurationMinutes(value: number | null) {
  if (value === null) {
    return 'En curso';
  }

  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${hours}h ${minutes}m`;
}

export function OnlineTimePage() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { hasPermission, session } = useAuth();
  const hasCompanyWideAccess = session?.user.hasCompanyWideAccess ?? false;
  const activeBranchId = session?.user.activeBranchId ?? null;
  const canCreate = hasPermission('online_time.create');
  const canEdit = hasPermission('online_time.edit');
  const canViewBranches = hasPermission('branches.view');
  const canViewPeople = hasPermission('people.view');
  const canViewOperations = hasPermission('operations.view');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('edit');
  const [form, setForm] = useState<OnlineTimeFormState>(emptyForm);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const sessionsQuery = useQuery({
    queryKey: ['online-time-records', search],
    queryFn: () => {
      const params = new URLSearchParams({ page: '1', pageSize: '100' });
      if (search.trim()) {
        params.set('search', search.trim());
      }
      return api.get<PaginatedResponse<OnlineSessionRecord>>(`/online-time?${params.toString()}`);
    },
  });

  const branchesQuery = useQuery({
    queryKey: ['online-time-branches'],
    queryFn: () => api.get<PaginatedResponse<BranchRecord>>('/branches?page=1&pageSize=100'),
    enabled: canViewBranches,
  });

  const peopleQuery = useQuery({
    queryKey: ['online-time-people'],
    queryFn: () => api.get<PaginatedResponse<PersonRecord>>('/people?page=1&pageSize=200'),
    enabled: canViewPeople,
  });

  const shiftsQuery = useQuery({
    queryKey: ['online-time-shifts'],
    queryFn: () => api.get<PaginatedResponse<OperationShiftRecord>>('/operations/shifts?page=1&pageSize=200'),
    enabled: canViewOperations,
  });

  const records = sessionsQuery.data?.items ?? [];
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

  async function refreshSessions() {
    setFeedback(null);
    const tasks: Array<Promise<unknown>> = [sessionsQuery.refetch()];
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
        const payload: CreateOnlineSessionInput = {
          branchId: Number(form.branchId),
          personId: Number(form.personId),
          ...(form.shiftId ? { shiftId: Number(form.shiftId) } : {}),
          label: form.label.trim(),
          ...(toOptionalString(form.platformName) ? { platformName: toOptionalString(form.platformName) } : {}),
          startedAt: toIsoDateTime(form.startedAt),
          ...(toOptionalString(form.endedAt) ? { endedAt: toIsoDateTime(form.endedAt) } : {}),
          ...(toOptionalString(form.tokenCount) ? { tokenCount: Number(form.tokenCount) } : {}),
          ...(toOptionalString(form.grossAmount) ? { grossAmount: toOptionalString(form.grossAmount) } : {}),
          status: form.status,
          ...(toOptionalString(form.notes) ? { notes: toOptionalString(form.notes) } : {}),
        };

        const response = await api.post<EnvelopeResponse<OnlineSessionRecord>>('/online-time', payload);
        await queryClient.invalidateQueries({ queryKey: ['online-time-records'] });
        setMode('edit');
        setSelectedId(response.data.id);
        setForm(toFormState(response.data));
        setFeedback({ tone: 'success', message: `Sesion #${response.data.id} registrada correctamente.` });
      } else if (selectedRecord) {
        const payload: UpdateOnlineSessionInput = {
          branchId: Number(form.branchId),
          personId: Number(form.personId),
          shiftId: form.shiftId ? Number(form.shiftId) : null,
          label: form.label.trim(),
          platformName: toNullableString(form.platformName),
          startedAt: toIsoDateTime(form.startedAt),
          endedAt: toNullableString(form.endedAt) ? toIsoDateTime(form.endedAt) : null,
          tokenCount: toNullableString(form.tokenCount) ? Number(form.tokenCount) : null,
          grossAmount: toNullableString(form.grossAmount),
          status: form.status,
          notes: toNullableString(form.notes),
        };

        const response = await api.patch<EnvelopeResponse<OnlineSessionRecord>>(`/online-time/${selectedRecord.id}`, payload);
        await queryClient.invalidateQueries({ queryKey: ['online-time-records'] });
        setForm(toFormState(response.data));
        setFeedback({ tone: 'success', message: `Sesion #${response.data.id} actualizada.` });
      }
    } catch (error) {
      setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'No fue posible guardar la sesion.' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PermissionGuard permission="online_time.view">
      <div className="page-stack">
        <PageHero
          eyebrow="Operacion"
          title="Tiempo en linea"
          description="Registra sesiones online por persona, turno y plataforma para completar el dominio operativo antes de integrar calculos comerciales y nomina."
          actions={canCreate ? <ActionButton onClick={startCreate}><Plus size={16} />Nueva sesion</ActionButton> : null}
        />

        <div className="workspace-grid">
          <Panel>
            <EntitySelectionList
              eyebrow="Streaming"
              title="Sesiones online"
              description="Consulta sesiones abiertas, cerradas o canceladas por sede, persona y plataforma."
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar por etiqueta, persona o plataforma"
              items={records}
              selectedId={selectedId}
              getId={(item) => item.id}
              renderTitle={(item) => <><strong>{item.label}</strong><StatusBadge value={item.status} /></>}
              renderDescription={(item) => <><p>{item.personName}</p><p>{formatDateTime(item.startedAt)}</p></>}
              renderMeta={(item) => <><span>{item.branchName ?? `Sede #${item.branchId}`}</span><span>{shortText(item.platformName || 'Sin plataforma')}</span></>}
              emptyTitle="Sin sesiones visibles"
              emptyDescription="Todavia no hay sesiones online para el filtro actual."
              loading={sessionsQuery.isPending}
              error={sessionsQuery.error instanceof Error ? sessionsQuery.error.message : null}
              onRefresh={() => void refreshSessions()}
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
              title={mode === 'create' ? 'Registrar sesion online' : 'Editar sesion online'}
              description={mode === 'create' ? 'Captura la sesion, plataforma y metricas base del bloque online.' : 'Ajusta cierre, tokens, monto bruto y notas de la sesion seleccionada.'}
            />

            {feedback ? <InlineMessage tone={feedback.tone}>{feedback.message}</InlineMessage> : null}
            {!canViewPeople ? <InlineMessage tone="info">Tu sesion no incluye `people.view`; no podras reasignar personas desde esta vista.</InlineMessage> : null}
            {!canViewOperations ? <InlineMessage tone="info">Tu sesion no incluye `operations.view`; el selector de turno queda deshabilitado.</InlineMessage> : null}

            <form className="editor-form" onSubmit={handleSubmit}>
              <div className="field-grid two-columns">
                <Field label="Sede" htmlFor="online-time-branch-id">
                  <SelectInput id="online-time-branch-id" value={form.branchId} onChange={(event) => setForm((current) => ({ ...current, branchId: event.target.value, shiftId: '' }))} disabled={(!canCreate && !canEdit) || !hasCompanyWideAccess} required>
                    <option value="">Selecciona</option>
                    {!hasCompanyWideAccess && activeBranchId && !branches.some((branch) => branch.id === activeBranchId) ? <option value={activeBranchId}>{`Sede activa #${activeBranchId}`}</option> : null}
                    {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name} ({branch.code})</option>)}
                  </SelectInput>
                </Field>

                <Field label="Persona" htmlFor="online-time-person-id">
                  <SelectInput id="online-time-person-id" value={form.personId} onChange={(event) => setForm((current) => ({ ...current, personId: event.target.value, shiftId: '' }))} disabled={(!canCreate && !canEdit) || !canViewPeople} required>
                    <option value="">Selecciona</option>
                    {people.map((person) => <option key={person.id} value={person.id}>{person.firstName} {person.lastName}</option>)}
                  </SelectInput>
                </Field>

                <Field label="Turno asociado" htmlFor="online-time-shift-id">
                  <SelectInput id="online-time-shift-id" value={form.shiftId} onChange={(event) => setForm((current) => ({ ...current, shiftId: event.target.value }))} disabled={(!canCreate && !canEdit) || !canViewOperations}>
                    <option value="">Sin turno asociado</option>
                    {shiftOptions.map((shift) => <option key={shift.id} value={shift.id}>{shift.title} - {shift.personName}</option>)}
                  </SelectInput>
                </Field>

                <Field label="Estado" htmlFor="online-time-status">
                  <SelectInput id="online-time-status" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as OnlineTimeFormState['status'] }))} disabled={!canCreate && !canEdit}>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="cancelled">Cancelled</option>
                  </SelectInput>
                </Field>
              </div>

              <Field label="Etiqueta" htmlFor="online-time-label">
                <TextInput id="online-time-label" value={form.label} onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))} disabled={!canCreate && !canEdit} required />
              </Field>

              <div className="field-grid two-columns">
                <Field label="Plataforma" htmlFor="online-time-platform-name">
                  <TextInput id="online-time-platform-name" value={form.platformName} onChange={(event) => setForm((current) => ({ ...current, platformName: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>

                <Field label="Tokens" htmlFor="online-time-token-count">
                  <TextInput id="online-time-token-count" type="number" min="0" value={form.tokenCount} onChange={(event) => setForm((current) => ({ ...current, tokenCount: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>

                <Field label="Inicio" htmlFor="online-time-started-at">
                  <TextInput id="online-time-started-at" type="datetime-local" value={form.startedAt} onChange={(event) => setForm((current) => ({ ...current, startedAt: event.target.value }))} disabled={!canCreate && !canEdit} required />
                </Field>

                <Field label="Fin" htmlFor="online-time-ended-at">
                  <TextInput id="online-time-ended-at" type="datetime-local" value={form.endedAt} onChange={(event) => setForm((current) => ({ ...current, endedAt: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>

                <Field label="Monto bruto" htmlFor="online-time-gross-amount">
                  <TextInput id="online-time-gross-amount" value={form.grossAmount} onChange={(event) => setForm((current) => ({ ...current, grossAmount: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>

                <Field label="Resumen actual">
                  <div className="detail-chip-row wrap-row">
                    <StatusBadge value={selectedRecord?.status ?? (mode === 'create' ? 'draft' : '--')} />
                    <span>{selectedRecord?.personName ?? 'Sin persona seleccionada'}</span>
                    <span>{selectedRecord ? formatDurationMinutes(selectedRecord.durationMinutes) : 'Nueva sesion'}</span>
                  </div>
                </Field>
              </div>

              <Field label="Notas" htmlFor="online-time-notes">
                <TextAreaInput id="online-time-notes" rows={4} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} disabled={!canCreate && !canEdit} />
              </Field>

              {selectedRecord ? (
                <div className="detail-list">
                  <div><span>Sede</span><strong>{branchNameById.get(selectedRecord.branchId) ?? selectedRecord.branchName ?? `Sede #${selectedRecord.branchId}`}</strong></div>
                  <div><span>Turno asociado</span><strong>{selectedRecord.shiftTitle ?? 'Sin turno asociado'}</strong></div>
                  <div><span>Duracion</span><strong>{formatDurationMinutes(selectedRecord.durationMinutes)}</strong></div>
                  <div><span>Monto bruto</span><strong>{shortText(selectedRecord.grossAmount, 'Sin monto')}</strong></div>
                </div>
              ) : null}

              {canCreate || canEdit ? (
                <div className="form-actions-row">
                  <ActionButton type="submit" disabled={isSaving || (mode === 'edit' && !selectedRecord)}>
                    <Save size={16} />
                    {isSaving ? 'Guardando...' : mode === 'create' ? 'Registrar sesion' : 'Guardar cambios'}
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

import type {
  AbsenceRecord,
  BranchRecord,
  CreateAbsenceInput,
  EnvelopeResponse,
  OperationShiftRecord,
  PaginatedResponse,
  PersonRecord,
  UpdateAbsenceInput,
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

type AbsenceFormState = {
  branchId: string;
  personId: string;
  shiftId: string;
  startsAt: string;
  endsAt: string;
  reason: string;
  status: 'reported' | 'approved' | 'rejected';
  supportUrl: string;
  notes: string;
};

const emptyForm: AbsenceFormState = {
  branchId: '',
  personId: '',
  shiftId: '',
  startsAt: '',
  endsAt: '',
  reason: '',
  status: 'reported',
  supportUrl: '',
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

function toFormState(record?: AbsenceRecord | null): AbsenceFormState {
  if (!record) {
    return emptyForm;
  }

  return {
    branchId: String(record.branchId),
    personId: String(record.personId),
    shiftId: record.shiftId ? String(record.shiftId) : '',
    startsAt: toDateTimeLocalInput(record.startsAt),
    endsAt: toDateTimeLocalInput(record.endsAt),
    reason: record.reason,
    status: record.status,
    supportUrl: record.supportUrl ?? '',
    notes: record.notes ?? '',
  };
}

export function AbsencesPage() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { hasPermission, session } = useAuth();
  const hasCompanyWideAccess = session?.user.hasCompanyWideAccess ?? false;
  const activeBranchId = session?.user.activeBranchId ?? null;
  const canCreate = hasPermission('absences.create');
  const canEdit = hasPermission('absences.edit');
  const canViewBranches = hasPermission('branches.view');
  const canViewPeople = hasPermission('people.view');
  const canViewOperations = hasPermission('operations.view');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('edit');
  const [form, setForm] = useState<AbsenceFormState>(emptyForm);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const absencesQuery = useQuery({
    queryKey: ['absence-records', search],
    queryFn: () => {
      const params = new URLSearchParams({ page: '1', pageSize: '100' });
      if (search.trim()) {
        params.set('search', search.trim());
      }
      return api.get<PaginatedResponse<AbsenceRecord>>(`/absences?${params.toString()}`);
    },
  });

  const branchesQuery = useQuery({
    queryKey: ['absence-branches'],
    queryFn: () => api.get<PaginatedResponse<BranchRecord>>('/branches?page=1&pageSize=100'),
    enabled: canViewBranches,
  });

  const peopleQuery = useQuery({
    queryKey: ['absence-people'],
    queryFn: () => api.get<PaginatedResponse<PersonRecord>>('/people?page=1&pageSize=200'),
    enabled: canViewPeople,
  });

  const shiftsQuery = useQuery({
    queryKey: ['absence-shifts'],
    queryFn: () => api.get<PaginatedResponse<OperationShiftRecord>>('/operations/shifts?page=1&pageSize=200'),
    enabled: canViewOperations,
  });

  const records = absencesQuery.data?.items ?? [];
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

  async function refreshAbsences() {
    setFeedback(null);
    const tasks: Array<Promise<unknown>> = [absencesQuery.refetch()];
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
        const payload: CreateAbsenceInput = {
          branchId: Number(form.branchId),
          personId: Number(form.personId),
          ...(form.shiftId ? { shiftId: Number(form.shiftId) } : {}),
          startsAt: toIsoDateTime(form.startsAt),
          ...(toOptionalString(form.endsAt) ? { endsAt: toIsoDateTime(form.endsAt) } : {}),
          reason: form.reason.trim(),
          status: form.status,
          ...(toOptionalString(form.supportUrl) ? { supportUrl: toOptionalString(form.supportUrl) } : {}),
          ...(toOptionalString(form.notes) ? { notes: toOptionalString(form.notes) } : {}),
        };

        const response = await api.post<EnvelopeResponse<AbsenceRecord>>('/absences', payload);
        await queryClient.invalidateQueries({ queryKey: ['absence-records'] });
        setMode('edit');
        setSelectedId(response.data.id);
        setForm(toFormState(response.data));
        setFeedback({ tone: 'success', message: `Inasistencia #${response.data.id} registrada correctamente.` });
      } else if (selectedRecord) {
        const payload: UpdateAbsenceInput = {
          branchId: Number(form.branchId),
          personId: Number(form.personId),
          shiftId: form.shiftId ? Number(form.shiftId) : null,
          startsAt: toIsoDateTime(form.startsAt),
          endsAt: toNullableString(form.endsAt) ? toIsoDateTime(form.endsAt) : null,
          reason: form.reason.trim(),
          status: form.status,
          supportUrl: toNullableString(form.supportUrl),
          notes: toNullableString(form.notes),
        };

        const response = await api.patch<EnvelopeResponse<AbsenceRecord>>(`/absences/${selectedRecord.id}`, payload);
        await queryClient.invalidateQueries({ queryKey: ['absence-records'] });
        setForm(toFormState(response.data));
        setFeedback({ tone: 'success', message: `Inasistencia #${response.data.id} actualizada.` });
      }
    } catch (error) {
      setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'No fue posible guardar la inasistencia.' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PermissionGuard permission="absences.view">
      <div className="page-stack">
        <PageHero
          eyebrow="Operacion"
          title="Inasistencias"
          description="Registra ausencias reportadas, aprobadas o rechazadas por persona, sede y turno para completar el dominio operativo antes de RRHH y nomina."
          actions={canCreate ? <ActionButton onClick={startCreate}><Plus size={16} />Registrar inasistencia</ActionButton> : null}
        />

        <div className="workspace-grid">
          <Panel>
            <EntitySelectionList
              eyebrow="Bitacora"
              title="Ausencias registradas"
              description="Consulta inasistencias por persona, turno y ventana horaria dentro del tenant activo."
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar por razon, persona o turno"
              items={records}
              selectedId={selectedId}
              getId={(item) => item.id}
              renderTitle={(item) => <><strong>{item.personName}</strong><StatusBadge value={item.status} /></>}
              renderDescription={(item) => <><p>{item.reason}</p><p>{formatDateTime(item.startsAt)}</p></>}
              renderMeta={(item) => <><span>{item.branchName ?? `Sede #${item.branchId}`}</span><span>{shortText(item.shiftTitle || 'Sin turno')}</span></>}
              emptyTitle="Sin inasistencias visibles"
              emptyDescription="Todavia no hay ausencias para el filtro actual."
              loading={absencesQuery.isPending}
              error={absencesQuery.error instanceof Error ? absencesQuery.error.message : null}
              onRefresh={() => void refreshAbsences()}
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
              title={mode === 'create' ? 'Registrar inasistencia' : 'Editar inasistencia'}
              description={mode === 'create' ? 'Captura la ausencia, su causa y el soporte asociado.' : 'Ajusta aprobacion, rango horario y documentacion de la ausencia.'}
            />

            {feedback ? <InlineMessage tone={feedback.tone}>{feedback.message}</InlineMessage> : null}
            {!canViewPeople ? <InlineMessage tone="info">Tu sesion no incluye `people.view`; no podras reasignar personas desde esta vista.</InlineMessage> : null}
            {!canViewOperations ? <InlineMessage tone="info">Tu sesion no incluye `operations.view`; el selector de turno queda deshabilitado.</InlineMessage> : null}

            <form className="editor-form" onSubmit={handleSubmit}>
              <div className="field-grid two-columns">
                <Field label="Sede" htmlFor="absence-branch-id">
                  <SelectInput id="absence-branch-id" value={form.branchId} onChange={(event) => setForm((current) => ({ ...current, branchId: event.target.value, shiftId: '' }))} disabled={(!canCreate && !canEdit) || !hasCompanyWideAccess} required>
                    <option value="">Selecciona</option>
                    {!hasCompanyWideAccess && activeBranchId && !branches.some((branch) => branch.id === activeBranchId) ? <option value={activeBranchId}>{`Sede activa #${activeBranchId}`}</option> : null}
                    {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name} ({branch.code})</option>)}
                  </SelectInput>
                </Field>

                <Field label="Persona" htmlFor="absence-person-id">
                  <SelectInput id="absence-person-id" value={form.personId} onChange={(event) => setForm((current) => ({ ...current, personId: event.target.value, shiftId: '' }))} disabled={(!canCreate && !canEdit) || !canViewPeople} required>
                    <option value="">Selecciona</option>
                    {people.map((person) => <option key={person.id} value={person.id}>{person.firstName} {person.lastName}</option>)}
                  </SelectInput>
                </Field>

                <Field label="Turno asociado" htmlFor="absence-shift-id">
                  <SelectInput id="absence-shift-id" value={form.shiftId} onChange={(event) => setForm((current) => ({ ...current, shiftId: event.target.value }))} disabled={(!canCreate && !canEdit) || !canViewOperations}>
                    <option value="">Sin turno asociado</option>
                    {shiftOptions.map((shift) => <option key={shift.id} value={shift.id}>{shift.title} - {shift.personName}</option>)}
                  </SelectInput>
                </Field>

                <Field label="Estado" htmlFor="absence-status">
                  <SelectInput id="absence-status" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as AbsenceFormState['status'] }))} disabled={!canCreate && !canEdit}>
                    <option value="reported">Reported</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </SelectInput>
                </Field>

                <Field label="Inicio" htmlFor="absence-starts-at">
                  <TextInput id="absence-starts-at" type="datetime-local" value={form.startsAt} onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))} disabled={!canCreate && !canEdit} required />
                </Field>

                <Field label="Fin" htmlFor="absence-ends-at">
                  <TextInput id="absence-ends-at" type="datetime-local" value={form.endsAt} onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>
              </div>

              <Field label="Motivo" htmlFor="absence-reason">
                <TextInput id="absence-reason" value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} disabled={!canCreate && !canEdit} required />
              </Field>

              <Field label="Soporte / URL" htmlFor="absence-support-url">
                <TextInput id="absence-support-url" value={form.supportUrl} onChange={(event) => setForm((current) => ({ ...current, supportUrl: event.target.value }))} disabled={!canCreate && !canEdit} />
              </Field>

              <Field label="Notas" htmlFor="absence-notes">
                <TextAreaInput id="absence-notes" rows={4} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} disabled={!canCreate && !canEdit} />
              </Field>

              {selectedRecord ? (
                <div className="detail-list">
                  <div><span>Sede</span><strong>{branchNameById.get(selectedRecord.branchId) ?? selectedRecord.branchName ?? `Sede #${selectedRecord.branchId}`}</strong></div>
                  <div><span>Turno asociado</span><strong>{selectedRecord.shiftTitle ?? 'Sin turno asociado'}</strong></div>
                  <div><span>Inicio registrado</span><strong>{formatDateTime(selectedRecord.startsAt)}</strong></div>
                  <div><span>Fin registrado</span><strong>{selectedRecord.endsAt ? formatDateTime(selectedRecord.endsAt) : 'No definido'}</strong></div>
                </div>
              ) : null}

              {canCreate || canEdit ? (
                <div className="form-actions-row">
                  <ActionButton type="submit" disabled={isSaving || (mode === 'edit' && !selectedRecord)}>
                    <Save size={16} />
                    {isSaving ? 'Guardando...' : mode === 'create' ? 'Registrar inasistencia' : 'Guardar cambios'}
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

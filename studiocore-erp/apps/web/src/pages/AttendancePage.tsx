import type {
  AttendanceRecord,
  BranchRecord,
  CreateAttendanceInput,
  EnvelopeResponse,
  OperationShiftRecord,
  PaginatedResponse,
  PersonRecord,
  UpdateAttendanceInput,
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

type AttendanceFormState = {
  branchId: string;
  personId: string;
  shiftId: string;
  attendanceDate: string;
  status: 'present' | 'late' | 'absent' | 'excused';
  checkInAt: string;
  checkOutAt: string;
  notes: string;
};

const emptyForm: AttendanceFormState = {
  branchId: '',
  personId: '',
  shiftId: '',
  attendanceDate: '',
  status: 'present',
  checkInAt: '',
  checkOutAt: '',
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

function toFormState(record?: AttendanceRecord | null): AttendanceFormState {
  if (!record) {
    return emptyForm;
  }

  return {
    branchId: String(record.branchId),
    personId: String(record.personId),
    shiftId: record.shiftId ? String(record.shiftId) : '',
    attendanceDate: record.attendanceDate,
    status: record.status,
    checkInAt: toDateTimeLocalInput(record.checkInAt),
    checkOutAt: toDateTimeLocalInput(record.checkOutAt),
    notes: record.notes ?? '',
  };
}

export function AttendancePage() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { hasPermission, session } = useAuth();
  const hasCompanyWideAccess = session?.user.hasCompanyWideAccess ?? false;
  const activeBranchId = session?.user.activeBranchId ?? null;
  const canCreate = hasPermission('attendance.create');
  const canEdit = hasPermission('attendance.edit');
  const canViewBranches = hasPermission('branches.view');
  const canViewPeople = hasPermission('people.view');
  const canViewOperations = hasPermission('operations.view');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('edit');
  const [form, setForm] = useState<AttendanceFormState>(emptyForm);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const attendanceQuery = useQuery({
    queryKey: ['attendance-records', search],
    queryFn: () => {
      const params = new URLSearchParams({ page: '1', pageSize: '100' });
      if (search.trim()) {
        params.set('search', search.trim());
      }
      return api.get<PaginatedResponse<AttendanceRecord>>(`/attendance?${params.toString()}`);
    },
  });

  const branchesQuery = useQuery({
    queryKey: ['attendance-branches'],
    queryFn: () => api.get<PaginatedResponse<BranchRecord>>('/branches?page=1&pageSize=100'),
    enabled: canViewBranches,
  });

  const peopleQuery = useQuery({
    queryKey: ['attendance-people'],
    queryFn: () => api.get<PaginatedResponse<PersonRecord>>('/people?page=1&pageSize=200'),
    enabled: canViewPeople,
  });

  const shiftsQuery = useQuery({
    queryKey: ['attendance-shifts'],
    queryFn: () => api.get<PaginatedResponse<OperationShiftRecord>>('/operations/shifts?page=1&pageSize=200'),
    enabled: canViewOperations,
  });

  const records = attendanceQuery.data?.items ?? [];
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

  async function refreshAttendance() {
    setFeedback(null);
    const tasks: Array<Promise<unknown>> = [attendanceQuery.refetch()];
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
      attendanceDate: new Date().toISOString().slice(0, 10),
    });
    setFeedback(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsSaving(true);

    try {
      if (mode === 'create') {
        const payload: CreateAttendanceInput = {
          branchId: Number(form.branchId),
          personId: Number(form.personId),
          ...(form.shiftId ? { shiftId: Number(form.shiftId) } : {}),
          attendanceDate: form.attendanceDate,
          status: form.status,
          ...(toOptionalString(form.checkInAt) ? { checkInAt: toIsoDateTime(form.checkInAt) } : {}),
          ...(toOptionalString(form.checkOutAt) ? { checkOutAt: toIsoDateTime(form.checkOutAt) } : {}),
          ...(toOptionalString(form.notes) ? { notes: toOptionalString(form.notes) } : {}),
        };

        const response = await api.post<EnvelopeResponse<AttendanceRecord>>('/attendance', payload);
        await queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
        setMode('edit');
        setSelectedId(response.data.id);
        setForm(toFormState(response.data));
        setFeedback({ tone: 'success', message: `Asistencia #${response.data.id} registrada correctamente.` });
      } else if (selectedRecord) {
        const payload: UpdateAttendanceInput = {
          branchId: Number(form.branchId),
          personId: Number(form.personId),
          shiftId: form.shiftId ? Number(form.shiftId) : null,
          attendanceDate: form.attendanceDate,
          status: form.status,
          checkInAt: toNullableString(form.checkInAt) ? toIsoDateTime(form.checkInAt) : null,
          checkOutAt: toNullableString(form.checkOutAt) ? toIsoDateTime(form.checkOutAt) : null,
          notes: toNullableString(form.notes),
        };

        const response = await api.patch<EnvelopeResponse<AttendanceRecord>>(`/attendance/${selectedRecord.id}`, payload);
        await queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
        setForm(toFormState(response.data));
        setFeedback({ tone: 'success', message: `Asistencia #${response.data.id} actualizada.` });
      }
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'No fue posible guardar la asistencia.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PermissionGuard permission="attendance.view">
      <div className="page-stack">
        <PageHero
          eyebrow="Operacion"
          title="Asistencia"
          description="Registra asistencia manual ligada a turnos o como evento independiente para preparar ausencias, tiempos en linea y nomina."
          actions={
            canCreate ? (
              <ActionButton onClick={startCreate}>
                <Plus size={16} />
                Registrar asistencia
              </ActionButton>
            ) : null
          }
        />

        <div className="workspace-grid">
          <Panel>
            <EntitySelectionList
              eyebrow="Bitacora"
              title="Registros de asistencia"
              description="Consulta el cumplimiento diario por persona, sede y turno asociado."
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar por persona, turno o notas"
              items={records}
              selectedId={selectedId}
              getId={(item) => item.id}
              renderTitle={(item) => (
                <>
                  <strong>{item.personName}</strong>
                  <StatusBadge value={item.status} />
                </>
              )}
              renderDescription={(item) => (
                <>
                  <p>{item.shiftTitle ?? 'Sin turno asociado'}</p>
                  <p>{item.attendanceDate}</p>
                </>
              )}
              renderMeta={(item) => (
                <>
                  <span>{item.branchName ?? `Sede #${item.branchId}`}</span>
                  <span>{shortText(item.notes || 'Sin notas')}</span>
                </>
              )}
              emptyTitle="Sin asistencias visibles"
              emptyDescription="Todavia no hay asistencias para el filtro actual."
              loading={attendanceQuery.isPending}
              error={attendanceQuery.error instanceof Error ? attendanceQuery.error.message : null}
              onRefresh={() => void refreshAttendance()}
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
              title={mode === 'create' ? 'Registrar asistencia' : 'Editar asistencia'}
              description={mode === 'create' ? 'Captura un evento manual y vincularlo opcionalmente a un turno existente.' : 'Ajusta estado, check-in/check-out y observaciones del registro seleccionado.'}
            />

            {feedback ? <InlineMessage tone={feedback.tone}>{feedback.message}</InlineMessage> : null}
            {!canViewPeople ? (
              <InlineMessage tone="info">Tu sesion no incluye `people.view`; no podras reasignar personas desde esta vista.</InlineMessage>
            ) : null}
            {!canViewOperations ? (
              <InlineMessage tone="info">Tu sesion no incluye `operations.view`; el registro seguira siendo manual y sin selector de turno.</InlineMessage>
            ) : null}

            <form className="editor-form" onSubmit={handleSubmit}>
              <div className="field-grid two-columns">
                <Field label="Sede" htmlFor="attendance-branch-id">
                  <SelectInput id="attendance-branch-id" value={form.branchId} onChange={(event) => setForm((current) => ({ ...current, branchId: event.target.value, shiftId: '' }))} disabled={(!canCreate && !canEdit) || !hasCompanyWideAccess} required>
                    <option value="">Selecciona</option>
                    {!hasCompanyWideAccess && activeBranchId && !branches.some((branch) => branch.id === activeBranchId) ? <option value={activeBranchId}>{`Sede activa #${activeBranchId}`}</option> : null}
                    {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name} ({branch.code})</option>)}
                  </SelectInput>
                </Field>

                <Field label="Persona" htmlFor="attendance-person-id">
                  <SelectInput id="attendance-person-id" value={form.personId} onChange={(event) => setForm((current) => ({ ...current, personId: event.target.value, shiftId: '' }))} disabled={(!canCreate && !canEdit) || !canViewPeople} required>
                    <option value="">Selecciona</option>
                    {people.map((person) => <option key={person.id} value={person.id}>{person.firstName} {person.lastName}</option>)}
                  </SelectInput>
                </Field>

                <Field label="Turno asociado" htmlFor="attendance-shift-id" hint="Opcional; si no existe turno, puedes dejar el registro como manual.">
                  <SelectInput id="attendance-shift-id" value={form.shiftId} onChange={(event) => setForm((current) => ({ ...current, shiftId: event.target.value }))} disabled={(!canCreate && !canEdit) || !canViewOperations}>
                    <option value="">Sin turno asociado</option>
                    {shiftOptions.map((shift) => <option key={shift.id} value={shift.id}>{shift.title} - {shift.personName}</option>)}
                  </SelectInput>
                </Field>

                <Field label="Fecha" htmlFor="attendance-date">
                  <TextInput id="attendance-date" type="date" value={form.attendanceDate} onChange={(event) => setForm((current) => ({ ...current, attendanceDate: event.target.value }))} disabled={!canCreate && !canEdit} required />
                </Field>

                <Field label="Estado" htmlFor="attendance-status">
                  <SelectInput id="attendance-status" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as AttendanceFormState['status'] }))} disabled={!canCreate && !canEdit}>
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="absent">Absent</option>
                    <option value="excused">Excused</option>
                  </SelectInput>
                </Field>

                <Field label="Check-in" htmlFor="attendance-check-in">
                  <TextInput id="attendance-check-in" type="datetime-local" value={form.checkInAt} onChange={(event) => setForm((current) => ({ ...current, checkInAt: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>

                <Field label="Check-out" htmlFor="attendance-check-out">
                  <TextInput id="attendance-check-out" type="datetime-local" value={form.checkOutAt} onChange={(event) => setForm((current) => ({ ...current, checkOutAt: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>

                <Field label="Resumen actual">
                  <div className="detail-chip-row wrap-row">
                    <StatusBadge value={selectedRecord?.status ?? (mode === 'create' ? 'draft' : '--')} />
                    <span>{selectedRecord?.personName ?? 'Sin persona seleccionada'}</span>
                    <span>{selectedRecord?.shiftTitle ?? 'Manual'}</span>
                  </div>
                </Field>
              </div>

              <Field label="Notas" htmlFor="attendance-notes">
                <TextAreaInput id="attendance-notes" rows={4} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} disabled={!canCreate && !canEdit} />
              </Field>

              {selectedRecord ? (
                <div className="detail-list">
                  <div>
                    <span>Sede</span>
                    <strong>{branchNameById.get(selectedRecord.branchId) ?? selectedRecord.branchName ?? `Sede #${selectedRecord.branchId}`}</strong>
                  </div>
                  <div>
                    <span>Turno asociado</span>
                    <strong>{selectedRecord.shiftTitle ?? 'Sin turno asociado'}</strong>
                  </div>
                  <div>
                    <span>Check-in</span>
                    <strong>{selectedRecord.checkInAt ? formatDateTime(selectedRecord.checkInAt) : 'Sin registro'}</strong>
                  </div>
                  <div>
                    <span>Check-out</span>
                    <strong>{selectedRecord.checkOutAt ? formatDateTime(selectedRecord.checkOutAt) : 'Sin registro'}</strong>
                  </div>
                </div>
              ) : null}

              {canCreate || canEdit ? (
                <div className="form-actions-row">
                  <ActionButton type="submit" disabled={isSaving || (mode === 'edit' && !selectedRecord)}>
                    <Save size={16} />
                    {isSaving ? 'Guardando...' : mode === 'create' ? 'Registrar asistencia' : 'Guardar cambios'}
                  </ActionButton>
                  {mode === 'create' && records.length ? (
                    <ActionButton variant="secondary" onClick={() => {
                      const first = records[0];
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

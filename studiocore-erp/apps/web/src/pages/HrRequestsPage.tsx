import type {
  BranchRecord,
  CreateHrIncapacityInput,
  CreateHrVacationInput,
  EnvelopeResponse,
  HrIncapacityRecord,
  HrVacationRecord,
  PaginatedResponse,
  PersonRecord,
  UpdateHrIncapacityInput,
  UpdateHrVacationInput,
} from '@studiocore/contracts';
import {
  ActionButton,
  CheckboxField,
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
import { formatDate, formatDateTime } from '../lib/format';

type HrRecord = HrIncapacityRecord | HrVacationRecord;

type HrFormState = {
  branchId: string;
  personId: string;
  reason: string;
  startsAt: string;
  endsAt: string;
  supportUrl: string;
  status: 'requested' | 'approved' | 'rejected';
  isPaid: boolean;
  notes: string;
};

type HrRequestConfig = {
  endpoint: '/hr/incapacities' | '/hr/vacations';
  title: string;
  description: string;
  singularLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  showSupportUrl?: boolean;
  showIsPaid?: boolean;
};

const emptyForm: HrFormState = {
  branchId: '',
  personId: '',
  reason: '',
  startsAt: '',
  endsAt: '',
  supportUrl: '',
  status: 'requested',
  isPaid: true,
  notes: '',
};

function toFormState(record?: HrRecord | null): HrFormState {
  if (!record) {
    return emptyForm;
  }

  return {
    branchId: String(record.branchId),
    personId: String(record.personId),
    reason: record.reason,
    startsAt: record.startsAt,
    endsAt: record.endsAt,
    supportUrl: 'supportUrl' in record ? (record.supportUrl ?? '') : '',
    status: record.status,
    isPaid: 'isPaid' in record ? record.isPaid : true,
    notes: record.notes ?? '',
  };
}

export function HrRequestsPage(config: HrRequestConfig) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { hasPermission, session } = useAuth();
  const hasCompanyWideAccess = session?.user.hasCompanyWideAccess ?? false;
  const activeBranchId = session?.user.activeBranchId ?? null;
  const canCreate = hasPermission('hr.create');
  const canEdit = hasPermission('hr.edit');
  const canViewBranches = hasPermission('branches.view');
  const canViewPeople = hasPermission('people.view');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('edit');
  const [form, setForm] = useState<HrFormState>(emptyForm);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const recordsQuery = useQuery({
    queryKey: [config.endpoint, search],
    queryFn: () => {
      const params = new URLSearchParams({ page: '1', pageSize: '100' });
      if (search.trim()) {
        params.set('search', search.trim());
      }
      return api.get<PaginatedResponse<HrRecord>>(`${config.endpoint}?${params.toString()}`);
    },
  });

  const branchesQuery = useQuery({
    queryKey: [`${config.endpoint}-branches`],
    queryFn: () => api.get<PaginatedResponse<BranchRecord>>('/branches?page=1&pageSize=100'),
    enabled: canViewBranches,
  });

  const peopleQuery = useQuery({
    queryKey: [`${config.endpoint}-people`],
    queryFn: () => api.get<PaginatedResponse<PersonRecord>>('/people?page=1&pageSize=200'),
    enabled: canViewPeople,
  });

  const records = recordsQuery.data?.items ?? [];
  const branches = branchesQuery.data?.items ?? [];
  const people = peopleQuery.data?.items ?? [];
  const selectedRecord = records.find((item) => item.id === selectedId) ?? null;
  const branchNameById = useMemo(() => new Map(branches.map((branch) => [branch.id, `${branch.name} (${branch.code})`])), [branches]);

  useEffect(() => {
    if (mode === 'create') {
      return;
    }

    if (!records.length) {
      setSelectedId(null);
      setForm(emptyForm);
      return;
    }

    if (!selectedId || !records.some((item) => item.id === selectedId)) {
      const first = records[0];
      setSelectedId(first.id);
      setForm(toFormState(first));
      return;
    }

    setForm(toFormState(selectedRecord));
  }, [mode, records, selectedId, selectedRecord]);

  async function refreshRecords() {
    setFeedback(null);
    await Promise.all([recordsQuery.refetch(), canViewBranches ? branchesQuery.refetch() : Promise.resolve(), canViewPeople ? peopleQuery.refetch() : Promise.resolve()]);
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
        const payload = config.showIsPaid
          ? ({
              branchId: Number(form.branchId),
              personId: Number(form.personId),
              reason: form.reason.trim(),
              startsAt: form.startsAt,
              endsAt: form.endsAt,
              isPaid: form.isPaid,
              status: form.status,
              ...(toOptionalString(form.notes) ? { notes: toOptionalString(form.notes) } : {}),
            } satisfies CreateHrVacationInput)
          : ({
              branchId: Number(form.branchId),
              personId: Number(form.personId),
              reason: form.reason.trim(),
              startsAt: form.startsAt,
              endsAt: form.endsAt,
              ...(toOptionalString(form.supportUrl) ? { supportUrl: toOptionalString(form.supportUrl) } : {}),
              status: form.status,
              ...(toOptionalString(form.notes) ? { notes: toOptionalString(form.notes) } : {}),
            } satisfies CreateHrIncapacityInput);

        const response = await api.post<EnvelopeResponse<HrRecord>>(config.endpoint, payload);
        await queryClient.invalidateQueries({ queryKey: [config.endpoint] });
        setMode('edit');
        setSelectedId(response.data.id);
        setForm(toFormState(response.data));
        setFeedback({ tone: 'success', message: `${config.singularLabel} #${response.data.id} creada correctamente.` });
      } else if (selectedRecord) {
        const payload = config.showIsPaid
          ? ({
              branchId: Number(form.branchId),
              personId: Number(form.personId),
              reason: form.reason.trim(),
              startsAt: form.startsAt,
              endsAt: form.endsAt,
              isPaid: form.isPaid,
              status: form.status,
              notes: toNullableString(form.notes),
            } satisfies UpdateHrVacationInput)
          : ({
              branchId: Number(form.branchId),
              personId: Number(form.personId),
              reason: form.reason.trim(),
              startsAt: form.startsAt,
              endsAt: form.endsAt,
              supportUrl: toNullableString(form.supportUrl),
              status: form.status,
              notes: toNullableString(form.notes),
            } satisfies UpdateHrIncapacityInput);

        const response = await api.patch<EnvelopeResponse<HrRecord>>(`${config.endpoint}/${selectedRecord.id}`, payload);
        await queryClient.invalidateQueries({ queryKey: [config.endpoint] });
        setForm(toFormState(response.data));
        setFeedback({ tone: 'success', message: `${config.singularLabel} #${response.data.id} actualizada.` });
      }
    } catch (error) {
      setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'No fue posible guardar el registro.' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PermissionGuard permission="hr.view">
      <div className="page-stack">
        <PageHero
          eyebrow="RRHH"
          title={config.title}
          description={config.description}
          actions={canCreate ? <ActionButton onClick={startCreate}><Plus size={16} />Nuevo registro</ActionButton> : null}
        />

        <div className="workspace-grid">
          <Panel>
            <EntitySelectionList
              eyebrow="Listado"
              title={config.title}
              description="Consulta solicitudes, aprobaciones y sincronizacion a nomina del dominio seleccionado."
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar por motivo, persona o notas"
              items={records}
              selectedId={selectedId}
              getId={(item) => item.id}
              renderTitle={(item) => <><strong>{item.personName}</strong><StatusBadge value={item.status} /></>}
              renderDescription={(item) => <><p>{item.reason}</p><p>{formatDate(item.startsAt)} - {formatDate(item.endsAt)}</p></>}
              renderMeta={(item) => <><span>{item.payrollPeriodLabel ?? 'Sin sync a nomina'}</span><span>{item.dayCount} dias</span></>}
              emptyTitle={config.emptyTitle}
              emptyDescription={config.emptyDescription}
              loading={recordsQuery.isPending}
              error={recordsQuery.error instanceof Error ? recordsQuery.error.message : null}
              onRefresh={() => void refreshRecords()}
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
              title={mode === 'create' ? `Crear ${config.singularLabel.toLowerCase()}` : `Editar ${config.singularLabel.toLowerCase()}`}
              description={mode === 'create' ? 'Registra el rango, estado y persona afectada.' : 'Ajusta aprobacion y revisa la sincronizacion hacia nomina.'}
            />

            {feedback ? <InlineMessage tone={feedback.tone}>{feedback.message}</InlineMessage> : null}
            {!canViewPeople ? <InlineMessage tone="info">Tu sesion no incluye `people.view`; no podras reasignar personas desde esta vista.</InlineMessage> : null}

            <form className="editor-form" onSubmit={handleSubmit}>
              <div className="field-grid two-columns">
                <Field label="Sede" htmlFor={`${config.endpoint}-branch-id`}>
                  <SelectInput id={`${config.endpoint}-branch-id`} value={form.branchId} onChange={(event) => setForm((current) => ({ ...current, branchId: event.target.value }))} disabled={(!canCreate && !canEdit) || !hasCompanyWideAccess} required>
                    <option value="">Selecciona</option>
                    {!hasCompanyWideAccess && activeBranchId && !branches.some((branch) => branch.id === activeBranchId) ? <option value={activeBranchId}>{`Sede activa #${activeBranchId}`}</option> : null}
                    {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name} ({branch.code})</option>)}
                  </SelectInput>
                </Field>

                <Field label="Persona" htmlFor={`${config.endpoint}-person-id`}>
                  <SelectInput id={`${config.endpoint}-person-id`} value={form.personId} onChange={(event) => setForm((current) => ({ ...current, personId: event.target.value }))} disabled={(!canCreate && !canEdit) || !canViewPeople} required>
                    <option value="">Selecciona</option>
                    {people.map((person) => <option key={person.id} value={person.id}>{person.firstName} {person.lastName}</option>)}
                  </SelectInput>
                </Field>

                <Field label="Inicio" htmlFor={`${config.endpoint}-starts-at`}>
                  <TextInput id={`${config.endpoint}-starts-at`} type="date" value={form.startsAt} onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))} disabled={!canCreate && !canEdit} required />
                </Field>

                <Field label="Fin" htmlFor={`${config.endpoint}-ends-at`}>
                  <TextInput id={`${config.endpoint}-ends-at`} type="date" value={form.endsAt} onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))} disabled={!canCreate && !canEdit} required />
                </Field>

                <Field label="Estado" htmlFor={`${config.endpoint}-status`}>
                  <SelectInput id={`${config.endpoint}-status`} value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as HrFormState['status'] }))} disabled={!canCreate && !canEdit}>
                    <option value="requested">Requested</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </SelectInput>
                </Field>

                <Field label="Dias estimados">
                  <div className="detail-chip-row wrap-row">
                    <StatusBadge value={selectedRecord?.status ?? (mode === 'create' ? 'draft' : '--')} />
                    <span>{selectedRecord ? `${selectedRecord.dayCount} dias` : 'Sin calcular'}</span>
                    <span>{selectedRecord?.payrollPeriodLabel ?? 'Sin sync a nomina'}</span>
                  </div>
                </Field>
              </div>

              <Field label="Motivo" htmlFor={`${config.endpoint}-reason`}>
                <TextInput id={`${config.endpoint}-reason`} value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} disabled={!canCreate && !canEdit} required />
              </Field>

              {config.showSupportUrl ? (
                <Field label="Soporte / URL" htmlFor={`${config.endpoint}-support-url`}>
                  <TextInput id={`${config.endpoint}-support-url`} value={form.supportUrl} onChange={(event) => setForm((current) => ({ ...current, supportUrl: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>
              ) : null}

              {config.showIsPaid ? (
                <CheckboxField
                  checked={form.isPaid}
                  onChange={(checked) => setForm((current) => ({ ...current, isPaid: checked }))}
                  label="Vacacion paga"
                  hint="Si se desmarca, la sincronizacion crea una novedad tipo deduction en nomina."
                  disabled={!canCreate && !canEdit}
                />
              ) : null}

              <Field label="Notas" htmlFor={`${config.endpoint}-notes`}>
                <TextAreaInput id={`${config.endpoint}-notes`} rows={4} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} disabled={!canCreate && !canEdit} />
              </Field>

              {selectedRecord ? (
                <div className="detail-list">
                  <div><span>Sede</span><strong>{branchNameById.get(selectedRecord.branchId) ?? selectedRecord.branchName ?? `Sede #${selectedRecord.branchId}`}</strong></div>
                  <div><span>Sincronizacion payroll</span><strong>{selectedRecord.payrollPeriodLabel ?? 'Sin periodo asociado'}</strong></div>
                  <div><span>Novedad enlazada</span><strong>{selectedRecord.payrollNoveltyId ?? '--'}</strong></div>
                  <div><span>Actualizado</span><strong>{formatDateTime(selectedRecord.updatedAt)}</strong></div>
                </div>
              ) : null}

              {canCreate || canEdit ? (
                <div className="form-actions-row">
                  <ActionButton type="submit" disabled={isSaving || (mode === 'edit' && !selectedRecord)}>
                    <Save size={16} />
                    {isSaving ? 'Guardando...' : mode === 'create' ? `Crear ${config.singularLabel.toLowerCase()}` : 'Guardar cambios'}
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

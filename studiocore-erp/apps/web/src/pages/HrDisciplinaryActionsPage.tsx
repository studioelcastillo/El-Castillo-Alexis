import type {
  BranchRecord,
  CreateHrDisciplinaryActionInput,
  EnvelopeResponse,
  HrDisciplinaryActionRecord,
  PaginatedResponse,
  PersonRecord,
  UpdateHrDisciplinaryActionInput,
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
import { formatDate, formatDateTime } from '../lib/format';

type DisciplineFormState = {
  branchId: string;
  personId: string;
  actionType: 'warning' | 'sanction';
  title: string;
  effectiveDate: string;
  supportUrl: string;
  payrollImpactAmount: string;
  status: 'requested' | 'approved' | 'rejected';
  notes: string;
};

const emptyForm: DisciplineFormState = {
  branchId: '',
  personId: '',
  actionType: 'warning',
  title: '',
  effectiveDate: '',
  supportUrl: '',
  payrollImpactAmount: '',
  status: 'requested',
  notes: '',
};

function toFormState(record?: HrDisciplinaryActionRecord | null): DisciplineFormState {
  if (!record) {
    return emptyForm;
  }

  return {
    branchId: String(record.branchId),
    personId: String(record.personId),
    actionType: record.actionType,
    title: record.title,
    effectiveDate: record.effectiveDate,
    supportUrl: record.supportUrl ?? '',
    payrollImpactAmount: record.payrollImpactAmount ?? '',
    status: record.status,
    notes: record.notes ?? '',
  };
}

export function HrDisciplinaryActionsPage() {
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
  const [form, setForm] = useState<DisciplineFormState>(emptyForm);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const actionsQuery = useQuery({
    queryKey: ['hr-disciplinary-actions', search],
    queryFn: () => {
      const params = new URLSearchParams({ page: '1', pageSize: '100' });
      if (search.trim()) {
        params.set('search', search.trim());
      }
      return api.get<PaginatedResponse<HrDisciplinaryActionRecord>>(`/hr/disciplinary-actions?${params.toString()}`);
    },
  });

  const branchesQuery = useQuery({
    queryKey: ['hr-disciplinary-branches'],
    queryFn: () => api.get<PaginatedResponse<BranchRecord>>('/branches?page=1&pageSize=100'),
    enabled: canViewBranches,
  });

  const peopleQuery = useQuery({
    queryKey: ['hr-disciplinary-people'],
    queryFn: () => api.get<PaginatedResponse<PersonRecord>>('/people?page=1&pageSize=200'),
    enabled: canViewPeople,
  });

  const actions = actionsQuery.data?.items ?? [];
  const branches = branchesQuery.data?.items ?? [];
  const people = peopleQuery.data?.items ?? [];
  const selectedRecord = actions.find((item) => item.id === selectedId) ?? null;
  const branchNameById = useMemo(() => new Map(branches.map((branch) => [branch.id, `${branch.name} (${branch.code})`])), [branches]);

  useEffect(() => {
    if (mode === 'create') {
      return;
    }
    if (!actions.length) {
      setSelectedId(null);
      setForm(emptyForm);
      return;
    }
    if (!selectedId || !actions.some((item) => item.id === selectedId)) {
      const first = actions[0];
      setSelectedId(first.id);
      setForm(toFormState(first));
      return;
    }
    setForm(toFormState(selectedRecord));
  }, [mode, actions, selectedId, selectedRecord]);

  async function refreshActions() {
    setFeedback(null);
    await Promise.all([actionsQuery.refetch(), canViewBranches ? branchesQuery.refetch() : Promise.resolve(), canViewPeople ? peopleQuery.refetch() : Promise.resolve()]);
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
        const payload: CreateHrDisciplinaryActionInput = {
          branchId: Number(form.branchId),
          personId: Number(form.personId),
          actionType: form.actionType,
          title: form.title.trim(),
          effectiveDate: form.effectiveDate,
          ...(toOptionalString(form.supportUrl) ? { supportUrl: toOptionalString(form.supportUrl) } : {}),
          ...(toOptionalString(form.payrollImpactAmount) ? { payrollImpactAmount: toOptionalString(form.payrollImpactAmount) } : {}),
          status: form.status,
          ...(toOptionalString(form.notes) ? { notes: toOptionalString(form.notes) } : {}),
        };
        const response = await api.post<EnvelopeResponse<HrDisciplinaryActionRecord>>('/hr/disciplinary-actions', payload);
        await queryClient.invalidateQueries({ queryKey: ['hr-disciplinary-actions'] });
        setMode('edit');
        setSelectedId(response.data.id);
        setForm(toFormState(response.data));
        setFeedback({ tone: 'success', message: `Caso disciplinario #${response.data.id} creado correctamente.` });
      } else if (selectedRecord) {
        const payload: UpdateHrDisciplinaryActionInput = {
          branchId: Number(form.branchId),
          personId: Number(form.personId),
          actionType: form.actionType,
          title: form.title.trim(),
          effectiveDate: form.effectiveDate,
          supportUrl: toNullableString(form.supportUrl),
          payrollImpactAmount: toNullableString(form.payrollImpactAmount),
          status: form.status,
          notes: toNullableString(form.notes),
        };
        const response = await api.patch<EnvelopeResponse<HrDisciplinaryActionRecord>>(`/hr/disciplinary-actions/${selectedRecord.id}`, payload);
        await queryClient.invalidateQueries({ queryKey: ['hr-disciplinary-actions'] });
        setForm(toFormState(response.data));
        setFeedback({ tone: 'success', message: `Caso disciplinario #${response.data.id} actualizado.` });
      }
    } catch (error) {
      setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'No fue posible guardar el caso disciplinario.' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PermissionGuard permission="hr.view">
      <div className="page-stack">
        <PageHero
          eyebrow="RRHH"
          title="Disciplina"
          description="Gestiona llamados y sanciones con soporte, aprobacion y eventual impacto en nomina cuando el caso lo requiera."
          actions={canCreate ? <ActionButton onClick={startCreate}><Plus size={16} />Nuevo caso</ActionButton> : null}
        />

        <div className="workspace-grid">
          <Panel>
            <EntitySelectionList
              eyebrow="Listado"
              title="Casos disciplinarios"
              description="Consulta llamados y sanciones por persona, estado y enlace a nomina."
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar por titulo, persona o notas"
              items={actions}
              selectedId={selectedId}
              getId={(item) => item.id}
              renderTitle={(item) => <><strong>{item.title}</strong><StatusBadge value={item.status} /></>}
              renderDescription={(item) => <><p>{item.personName}</p><p>{formatDate(item.effectiveDate)}</p></>}
              renderMeta={(item) => <><span>{item.payrollPeriodLabel ?? 'Sin sync a nomina'}</span><span>{item.payrollImpactAmount ?? 'Sin impacto'}</span></>}
              emptyTitle="Sin casos visibles"
              emptyDescription="Todavia no hay casos disciplinarios para el filtro actual."
              loading={actionsQuery.isPending}
              error={actionsQuery.error instanceof Error ? actionsQuery.error.message : null}
              onRefresh={() => void refreshActions()}
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
              title={mode === 'create' ? 'Crear caso disciplinario' : 'Editar caso disciplinario'}
              description={mode === 'create' ? 'Registra el tipo, soporte y posible impacto a nomina.' : 'Ajusta aprobacion, monto de impacto y revisa la sincronizacion del caso.'}
            />

            {feedback ? <InlineMessage tone={feedback.tone}>{feedback.message}</InlineMessage> : null}
            {!canViewPeople ? <InlineMessage tone="info">Tu sesion no incluye `people.view`; no podras reasignar personas desde esta vista.</InlineMessage> : null}

            <form className="editor-form" onSubmit={handleSubmit}>
              <div className="field-grid two-columns">
                <Field label="Sede" htmlFor="discipline-branch-id">
                  <SelectInput id="discipline-branch-id" value={form.branchId} onChange={(event) => setForm((current) => ({ ...current, branchId: event.target.value }))} disabled={(!canCreate && !canEdit) || !hasCompanyWideAccess} required>
                    <option value="">Selecciona</option>
                    {!hasCompanyWideAccess && activeBranchId && !branches.some((branch) => branch.id === activeBranchId) ? <option value={activeBranchId}>{`Sede activa #${activeBranchId}`}</option> : null}
                    {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name} ({branch.code})</option>)}
                  </SelectInput>
                </Field>

                <Field label="Persona" htmlFor="discipline-person-id">
                  <SelectInput id="discipline-person-id" value={form.personId} onChange={(event) => setForm((current) => ({ ...current, personId: event.target.value }))} disabled={(!canCreate && !canEdit) || !canViewPeople} required>
                    <option value="">Selecciona</option>
                    {people.map((person) => <option key={person.id} value={person.id}>{person.firstName} {person.lastName}</option>)}
                  </SelectInput>
                </Field>

                <Field label="Tipo" htmlFor="discipline-type">
                  <SelectInput id="discipline-type" value={form.actionType} onChange={(event) => setForm((current) => ({ ...current, actionType: event.target.value as DisciplineFormState['actionType'] }))} disabled={!canCreate && !canEdit}>
                    <option value="warning">Warning</option>
                    <option value="sanction">Sanction</option>
                  </SelectInput>
                </Field>

                <Field label="Estado" htmlFor="discipline-status">
                  <SelectInput id="discipline-status" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as DisciplineFormState['status'] }))} disabled={!canCreate && !canEdit}>
                    <option value="requested">Requested</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </SelectInput>
                </Field>

                <Field label="Fecha efectiva" htmlFor="discipline-effective-date">
                  <TextInput id="discipline-effective-date" type="date" value={form.effectiveDate} onChange={(event) => setForm((current) => ({ ...current, effectiveDate: event.target.value }))} disabled={!canCreate && !canEdit} required />
                </Field>

                <Field label="Impacto a nomina" htmlFor="discipline-payroll-impact">
                  <TextInput id="discipline-payroll-impact" value={form.payrollImpactAmount} onChange={(event) => setForm((current) => ({ ...current, payrollImpactAmount: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>
              </div>

              <Field label="Titulo" htmlFor="discipline-title">
                <TextInput id="discipline-title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} disabled={!canCreate && !canEdit} required />
              </Field>

              <Field label="Soporte / URL" htmlFor="discipline-support-url">
                <TextInput id="discipline-support-url" value={form.supportUrl} onChange={(event) => setForm((current) => ({ ...current, supportUrl: event.target.value }))} disabled={!canCreate && !canEdit} />
              </Field>

              <Field label="Notas" htmlFor="discipline-notes">
                <TextAreaInput id="discipline-notes" rows={4} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} disabled={!canCreate && !canEdit} />
              </Field>

              {selectedRecord ? (
                <div className="detail-list">
                  <div><span>Sede</span><strong>{branchNameById.get(selectedRecord.branchId) ?? selectedRecord.branchName ?? `Sede #${selectedRecord.branchId}`}</strong></div>
                  <div><span>Sync payroll</span><strong>{selectedRecord.payrollPeriodLabel ?? 'Sin periodo asociado'}</strong></div>
                  <div><span>Novedad enlazada</span><strong>{selectedRecord.payrollNoveltyId ?? '--'}</strong></div>
                  <div><span>Actualizado</span><strong>{formatDateTime(selectedRecord.updatedAt)}</strong></div>
                </div>
              ) : null}

              {canCreate || canEdit ? (
                <div className="form-actions-row">
                  <ActionButton type="submit" disabled={isSaving || (mode === 'edit' && !selectedRecord)}>
                    <Save size={16} />
                    {isSaving ? 'Guardando...' : mode === 'create' ? 'Crear caso' : 'Guardar cambios'}
                  </ActionButton>
                  {mode === 'create' && actions.length ? <ActionButton variant="secondary" onClick={() => {
                    const first = actions[0];
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

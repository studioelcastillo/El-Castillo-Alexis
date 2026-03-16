import type {
  CreatePayrollNoveltyInput,
  EnvelopeResponse,
  PaginatedResponse,
  PayrollNoveltyRecord,
  PayrollPeriodRecord,
  PersonRecord,
  UpdatePayrollNoveltyInput,
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
import { useEffect, useState } from 'react';
import { EntitySelectionList } from '../components/EntitySelectionList';
import { PermissionGuard } from '../components/PermissionGuard';
import { useApiClient, useAuth } from '../lib/auth';
import { toNullableString, toOptionalString } from '../lib/forms';
import { formatDate, formatDateTime, shortText } from '../lib/format';

type PayrollNoveltyFormState = {
  periodId: string;
  personId: string;
  noveltyType: 'bonus' | 'deduction' | 'allowance' | 'incident';
  title: string;
  amount: string;
  effectiveDate: string;
  status: 'pending' | 'approved' | 'rejected';
  isCritical: boolean;
  notes: string;
};

const emptyForm: PayrollNoveltyFormState = {
  periodId: '',
  personId: '',
  noveltyType: 'bonus',
  title: '',
  amount: '',
  effectiveDate: '',
  status: 'pending',
  isCritical: false,
  notes: '',
};

function toFormState(record?: PayrollNoveltyRecord | null): PayrollNoveltyFormState {
  if (!record) {
    return emptyForm;
  }

  return {
    periodId: String(record.periodId),
    personId: String(record.personId),
    noveltyType: record.noveltyType,
    title: record.title,
    amount: record.amount,
    effectiveDate: record.effectiveDate,
    status: record.status,
    isCritical: record.isCritical,
    notes: record.notes ?? '',
  };
}

export function PayrollNoveltiesPage() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('payroll_novelties.create');
  const canEdit = hasPermission('payroll_novelties.edit');
  const canViewPeople = hasPermission('people.view');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('edit');
  const [form, setForm] = useState<PayrollNoveltyFormState>(emptyForm);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const noveltiesQuery = useQuery({
    queryKey: ['payroll-novelties', search],
    queryFn: () => {
      const params = new URLSearchParams({ page: '1', pageSize: '100' });
      if (search.trim()) {
        params.set('search', search.trim());
      }
      return api.get<PaginatedResponse<PayrollNoveltyRecord>>(`/payroll/novelties?${params.toString()}`);
    },
  });

  const periodsQuery = useQuery({
    queryKey: ['payroll-periods-options'],
    queryFn: () => api.get<PaginatedResponse<PayrollPeriodRecord>>('/payroll/periods?page=1&pageSize=100'),
  });

  const peopleQuery = useQuery({
    queryKey: ['payroll-novelties-people'],
    queryFn: () => api.get<PaginatedResponse<PersonRecord>>('/people?page=1&pageSize=200'),
    enabled: canViewPeople,
  });

  const novelties = noveltiesQuery.data?.items ?? [];
  const periods = periodsQuery.data?.items ?? [];
  const people = peopleQuery.data?.items ?? [];
  const selectedNovelty = novelties.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    if (mode === 'create') {
      return;
    }

    if (!novelties.length) {
      setSelectedId(null);
      setForm(emptyForm);
      return;
    }

    if (!selectedId || !novelties.some((item) => item.id === selectedId)) {
      const first = novelties[0];
      setSelectedId(first.id);
      setForm(toFormState(first));
      return;
    }

    setForm(toFormState(selectedNovelty));
  }, [mode, novelties, selectedId, selectedNovelty]);

  async function refreshNovelties() {
    setFeedback(null);
    await Promise.all([noveltiesQuery.refetch(), periodsQuery.refetch(), canViewPeople ? peopleQuery.refetch() : Promise.resolve()]);
  }

  function startCreate() {
    setMode('create');
    setSelectedId(null);
    setForm(emptyForm);
    setFeedback(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsSaving(true);

    try {
      if (mode === 'create') {
        const payload: CreatePayrollNoveltyInput = {
          periodId: Number(form.periodId),
          personId: Number(form.personId),
          noveltyType: form.noveltyType,
          title: form.title.trim(),
          amount: form.amount.trim(),
          effectiveDate: form.effectiveDate,
          status: form.status,
          isCritical: form.isCritical,
          ...(toOptionalString(form.notes) ? { notes: toOptionalString(form.notes) } : {}),
        };
        const response = await api.post<EnvelopeResponse<PayrollNoveltyRecord>>('/payroll/novelties', payload);
        await queryClient.invalidateQueries({ queryKey: ['payroll-novelties'] });
        setMode('edit');
        setSelectedId(response.data.id);
        setForm(toFormState(response.data));
        setFeedback({ tone: 'success', message: `Novedad #${response.data.id} creada correctamente.` });
      } else if (selectedNovelty) {
        const payload: UpdatePayrollNoveltyInput = {
          periodId: Number(form.periodId),
          personId: Number(form.personId),
          noveltyType: form.noveltyType,
          title: form.title.trim(),
          amount: form.amount.trim(),
          effectiveDate: form.effectiveDate,
          status: form.status,
          isCritical: form.isCritical,
          notes: toNullableString(form.notes),
        };
        const response = await api.patch<EnvelopeResponse<PayrollNoveltyRecord>>(`/payroll/novelties/${selectedNovelty.id}`, payload);
        await queryClient.invalidateQueries({ queryKey: ['payroll-novelties'] });
        setForm(toFormState(response.data));
        setFeedback({ tone: 'success', message: `Novedad #${response.data.id} actualizada.` });
      }
    } catch (error) {
      setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'No fue posible guardar la novedad.' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PermissionGuard permission="payroll_novelties.view">
      <div className="page-stack">
        <PageHero
          eyebrow="Nomina"
          title="Novedades de nomina"
          description="Registra bonos, deducciones y eventos criticos vinculados a periodos de nomina antes del cierre operativo."
          actions={canCreate ? <ActionButton onClick={startCreate}><Plus size={16} />Nueva novedad</ActionButton> : null}
        />

        <div className="workspace-grid">
          <Panel>
            <EntitySelectionList
              eyebrow="Listado"
              title="Novedades visibles"
              description="Consulta novedades por periodo, persona y estado de aprobacion."
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar por titulo, periodo o persona"
              items={novelties}
              selectedId={selectedId}
              getId={(item) => item.id}
              renderTitle={(item) => <><strong>{item.title}</strong><StatusBadge value={item.status} /></>}
              renderDescription={(item) => <><p>{item.personName}</p><p>{item.periodLabel ?? 'Sin periodo'}</p></>}
              renderMeta={(item) => <><span>{item.signedAmount}</span><span>{item.isCritical ? 'Critica' : shortText(item.noveltyType)}</span></>}
              emptyTitle="Sin novedades visibles"
              emptyDescription="Todavia no hay novedades para el filtro actual."
              loading={noveltiesQuery.isPending}
              error={noveltiesQuery.error instanceof Error ? noveltiesQuery.error.message : null}
              onRefresh={() => void refreshNovelties()}
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
              title={mode === 'create' ? 'Crear novedad' : 'Editar novedad'}
              description={mode === 'create' ? 'Asocia la novedad a un periodo, persona y monto para que afecte el snapshot de nomina.' : 'Ajusta aprobacion, criticidad o valor de la novedad seleccionada.'}
            />

            {feedback ? <InlineMessage tone={feedback.tone}>{feedback.message}</InlineMessage> : null}
            {!canViewPeople ? <InlineMessage tone="info">Tu sesion no incluye `people.view`; no podras reasignar personas desde esta vista.</InlineMessage> : null}

            <form className="editor-form" onSubmit={handleSubmit}>
              <div className="field-grid two-columns">
                <Field label="Periodo" htmlFor="payroll-novelty-period-id">
                  <SelectInput id="payroll-novelty-period-id" value={form.periodId} onChange={(event) => setForm((current) => ({ ...current, periodId: event.target.value }))} disabled={!canCreate && !canEdit} required>
                    <option value="">Selecciona</option>
                    {periods.map((period) => <option key={period.id} value={period.id}>{period.label} ({period.code})</option>)}
                  </SelectInput>
                </Field>

                <Field label="Persona" htmlFor="payroll-novelty-person-id">
                  <SelectInput id="payroll-novelty-person-id" value={form.personId} onChange={(event) => setForm((current) => ({ ...current, personId: event.target.value }))} disabled={(!canCreate && !canEdit) || !canViewPeople} required>
                    <option value="">Selecciona</option>
                    {people.map((person) => <option key={person.id} value={person.id}>{person.firstName} {person.lastName}</option>)}
                  </SelectInput>
                </Field>

                <Field label="Tipo" htmlFor="payroll-novelty-type">
                  <SelectInput id="payroll-novelty-type" value={form.noveltyType} onChange={(event) => setForm((current) => ({ ...current, noveltyType: event.target.value as PayrollNoveltyFormState['noveltyType'] }))} disabled={!canCreate && !canEdit}>
                    <option value="bonus">Bonus</option>
                    <option value="deduction">Deduction</option>
                    <option value="allowance">Allowance</option>
                    <option value="incident">Incident</option>
                  </SelectInput>
                </Field>

                <Field label="Estado" htmlFor="payroll-novelty-status">
                  <SelectInput id="payroll-novelty-status" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as PayrollNoveltyFormState['status'] }))} disabled={!canCreate && !canEdit}>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </SelectInput>
                </Field>
              </div>

              <Field label="Titulo" htmlFor="payroll-novelty-title">
                <TextInput id="payroll-novelty-title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} disabled={!canCreate && !canEdit} required />
              </Field>

              <div className="field-grid two-columns">
                <Field label="Monto" htmlFor="payroll-novelty-amount" hint="Para deducciones usa un valor positivo; el sistema las proyecta en negativo.">
                  <TextInput id="payroll-novelty-amount" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} disabled={!canCreate && !canEdit} required />
                </Field>

                <Field label="Fecha efectiva" htmlFor="payroll-novelty-effective-date">
                  <TextInput id="payroll-novelty-effective-date" type="date" value={form.effectiveDate} onChange={(event) => setForm((current) => ({ ...current, effectiveDate: event.target.value }))} disabled={!canCreate && !canEdit} required />
                </Field>
              </div>

              <CheckboxField
                checked={form.isCritical}
                onChange={(checked) => setForm((current) => ({ ...current, isCritical: checked }))}
                label="Novedad critica"
                hint="Si queda pendiente, bloquea el cierre del periodo asociado."
                disabled={!canCreate && !canEdit}
              />

              <Field label="Notas" htmlFor="payroll-novelty-notes">
                <TextAreaInput id="payroll-novelty-notes" rows={4} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} disabled={!canCreate && !canEdit} />
              </Field>

              {selectedNovelty ? (
                <div className="detail-list">
                  <div><span>Periodo</span><strong>{selectedNovelty.periodLabel ?? 'Sin periodo'}</strong></div>
                  <div><span>Monto firmado</span><strong>{selectedNovelty.signedAmount}</strong></div>
                  <div><span>Fecha efectiva</span><strong>{formatDate(selectedNovelty.effectiveDate)}</strong></div>
                  <div><span>Actualizado</span><strong>{formatDateTime(selectedNovelty.updatedAt)}</strong></div>
                </div>
              ) : null}

              {canCreate || canEdit ? (
                <div className="form-actions-row">
                  <ActionButton type="submit" disabled={isSaving || (mode === 'edit' && !selectedNovelty)}>
                    <Save size={16} />
                    {isSaving ? 'Guardando...' : mode === 'create' ? 'Crear novedad' : 'Guardar cambios'}
                  </ActionButton>
                  {mode === 'create' && novelties.length ? <ActionButton variant="secondary" onClick={() => {
                    const first = novelties[0];
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

import type {
  BranchRecord,
  CatalogListResponse,
  CreatePersonInput,
  EnvelopeResponse,
  PaginatedResponse,
  PersonDetailRecord,
  PersonRecord,
  PersonType,
  UpdatePersonInput,
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
import { fallbackCatalogGroups, resolveCatalogOptions } from '../lib/catalogs';
import { toNullableString, toOptionalNumber, toOptionalString } from '../lib/forms';
import { formatDateTime, shortText } from '../lib/format';

type TalentFormState = {
  firstName: string;
  lastName: string;
  branchId: string;
  documentType: string;
  documentNumber: string;
  issuedIn: string;
  email: string;
  personalEmail: string;
  phone: string;
  address: string;
  birthDate: string;
  sex: string;
  bloodType: string;
  modelCategory: string;
  photoUrl: string;
  bankEntity: string;
  bankAccountType: string;
  bankAccountNumber: string;
  status: 'active' | 'inactive';
  notes: string;
};

type TalentPageConfig = {
  personType: PersonType;
  endpoint: '/models' | '/staff';
  permissionBase: 'models' | 'staff';
  eyebrow: string;
  title: string;
  description: string;
  listTitle: string;
  listDescription: string;
  emptyTitle: string;
  emptyDescription: string;
  formDescription: string;
  detailDescription: string;
  highlightLabel: string;
  showModelCategory?: boolean;
};

const emptyForm: TalentFormState = {
  firstName: '',
  lastName: '',
  branchId: '',
  documentType: '',
  documentNumber: '',
  issuedIn: '',
  email: '',
  personalEmail: '',
  phone: '',
  address: '',
  birthDate: '',
  sex: '',
  bloodType: '',
  modelCategory: '',
  photoUrl: '',
  bankEntity: '',
  bankAccountType: '',
  bankAccountNumber: '',
  status: 'active',
  notes: '',
};

function toFormState(person?: PersonRecord | null): TalentFormState {
  if (!person) {
    return emptyForm;
  }

  return {
    firstName: person.firstName,
    lastName: person.lastName,
    branchId: person.branchId ? String(person.branchId) : '',
    documentType: person.documentType ?? '',
    documentNumber: person.documentNumber ?? '',
    issuedIn: person.issuedIn ?? '',
    email: person.email ?? '',
    personalEmail: person.personalEmail ?? '',
    phone: person.phone ?? '',
    address: person.address ?? '',
    birthDate: person.birthDate ?? '',
    sex: person.sex ?? '',
    bloodType: person.bloodType ?? '',
    modelCategory: person.modelCategory ?? '',
    photoUrl: person.photoUrl ?? '',
    bankEntity: person.bankEntity ?? '',
    bankAccountType: person.bankAccountType ?? '',
    bankAccountNumber: person.bankAccountNumber ?? '',
    status: person.status,
    notes: person.notes ?? '',
  };
}

export function TalentPage(config: TalentPageConfig) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { hasPermission, session } = useAuth();
  const hasCompanyWideAccess = session?.user.hasCompanyWideAccess ?? false;
  const activeBranchId = session?.user.activeBranchId ?? null;
  const canCreate = hasPermission(`${config.permissionBase}.create`);
  const canEdit = hasPermission(`${config.permissionBase}.edit`);
  const canViewBranches = hasPermission('branches.view');
  const canViewCatalogs = hasPermission('catalogs.view');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('edit');
  const [form, setForm] = useState<TalentFormState>(emptyForm);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const peopleQuery = useQuery({
    queryKey: [config.endpoint, search],
    queryFn: () => {
      const params = new URLSearchParams({ page: '1', pageSize: '100' });
      if (search.trim()) {
        params.set('search', search.trim());
      }
      return api.get<PaginatedResponse<PersonRecord>>(`${config.endpoint}?${params.toString()}`);
    },
  });

  const personDetailQuery = useQuery({
    queryKey: [config.endpoint, 'detail', selectedId],
    queryFn: () => api.get<EnvelopeResponse<PersonDetailRecord>>(`${config.endpoint}/${selectedId}`),
    enabled: mode === 'edit' && selectedId !== null,
  });

  const branchesQuery = useQuery({
    queryKey: [`${config.permissionBase}-branches`],
    queryFn: () => api.get<PaginatedResponse<BranchRecord>>('/branches?page=1&pageSize=100'),
    enabled: canViewBranches,
  });

  const catalogsQuery = useQuery({
    queryKey: ['catalogs-base'],
    queryFn: () => api.get<CatalogListResponse>('/catalogs'),
    enabled: canViewCatalogs,
  });

  const people = peopleQuery.data?.items ?? [];
  const selectedPerson = people.find((person) => person.id === selectedId) ?? null;
  const selectedPersonDetail = personDetailQuery.data?.data ?? null;
  const latestContract = selectedPersonDetail?.contracts[0] ?? null;
  const branches = branchesQuery.data?.items ?? [];
  const catalogGroups = catalogsQuery.data?.items?.length ? catalogsQuery.data.items : fallbackCatalogGroups;
  const usingCatalogFallback = Boolean(!canViewCatalogs || catalogsQuery.isError || (catalogsQuery.data && !catalogsQuery.data.items.length));
  const branchNameById = useMemo(
    () => new Map(branches.map((branch) => [branch.id, `${branch.name} (${branch.code})`])),
    [branches],
  );
  const identificationTypeOptions = resolveCatalogOptions(catalogGroups, 'person_identification_types');
  const sexOptions = resolveCatalogOptions(catalogGroups, 'person_sexes');
  const bloodTypeOptions = resolveCatalogOptions(catalogGroups, 'person_blood_types');
  const modelCategoryOptions = resolveCatalogOptions(catalogGroups, 'person_model_categories');
  const bankAccountTypeOptions = resolveCatalogOptions(catalogGroups, 'bank_account_types');

  useEffect(() => {
    if (mode === 'create') {
      return;
    }

    if (!people.length) {
      setSelectedId(null);
      setForm(emptyForm);
      return;
    }

    if (!selectedId || !people.some((person) => person.id === selectedId)) {
      const first = people[0];
      setSelectedId(first.id);
      setForm(toFormState(first));
      return;
    }

    setForm(toFormState(selectedPerson));
  }, [mode, people, selectedId, selectedPerson]);

  async function refreshPeople() {
    setFeedback(null);
    const tasks: Array<Promise<unknown>> = [peopleQuery.refetch()];
    if (mode === 'edit' && selectedId !== null) {
      tasks.push(personDetailQuery.refetch());
    }
    if (canViewBranches) {
      tasks.push(branchesQuery.refetch());
    }
    if (canViewCatalogs) {
      tasks.push(catalogsQuery.refetch());
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
        const payload: CreatePersonInput = {
          personType: config.personType,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          ...(toOptionalNumber(form.branchId) ? { branchId: toOptionalNumber(form.branchId) } : {}),
          ...(toOptionalString(form.documentType) ? { documentType: toOptionalString(form.documentType) } : {}),
          ...(toOptionalString(form.documentNumber) ? { documentNumber: toOptionalString(form.documentNumber) } : {}),
          ...(toOptionalString(form.issuedIn) ? { issuedIn: toOptionalString(form.issuedIn) } : {}),
          ...(toOptionalString(form.email) ? { email: toOptionalString(form.email) } : {}),
          ...(toOptionalString(form.personalEmail) ? { personalEmail: toOptionalString(form.personalEmail) } : {}),
          ...(toOptionalString(form.phone) ? { phone: toOptionalString(form.phone) } : {}),
          ...(toOptionalString(form.address) ? { address: toOptionalString(form.address) } : {}),
          ...(toOptionalString(form.birthDate) ? { birthDate: toOptionalString(form.birthDate) } : {}),
          ...(toOptionalString(form.sex) ? { sex: toOptionalString(form.sex) } : {}),
          ...(toOptionalString(form.bloodType) ? { bloodType: toOptionalString(form.bloodType) } : {}),
          ...(config.showModelCategory && toOptionalString(form.modelCategory) ? { modelCategory: toOptionalString(form.modelCategory) } : {}),
          ...(toOptionalString(form.photoUrl) ? { photoUrl: toOptionalString(form.photoUrl) } : {}),
          ...(toOptionalString(form.bankEntity) ? { bankEntity: toOptionalString(form.bankEntity) } : {}),
          ...(toOptionalString(form.bankAccountType) ? { bankAccountType: toOptionalString(form.bankAccountType) } : {}),
          ...(toOptionalString(form.bankAccountNumber) ? { bankAccountNumber: toOptionalString(form.bankAccountNumber) } : {}),
          ...(toOptionalString(form.notes) ? { notes: toOptionalString(form.notes) } : {}),
        };

        const response = await api.post<EnvelopeResponse<PersonDetailRecord>>(config.endpoint, payload);
        await queryClient.invalidateQueries({ queryKey: [config.endpoint] });
        setMode('edit');
        setSelectedId(response.data.id);
        setForm(toFormState(response.data));
        setFeedback({ tone: 'success', message: `${config.highlightLabel} #${response.data.id} creado correctamente.` });
      } else if (selectedPerson) {
        const payload: UpdatePersonInput = {
          personType: config.personType,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          branchId: form.branchId ? Number(form.branchId) : null,
          documentType: toNullableString(form.documentType),
          documentNumber: toNullableString(form.documentNumber),
          issuedIn: toNullableString(form.issuedIn),
          email: toNullableString(form.email),
          personalEmail: toNullableString(form.personalEmail),
          phone: toNullableString(form.phone),
          address: toNullableString(form.address),
          birthDate: toNullableString(form.birthDate),
          sex: toNullableString(form.sex),
          bloodType: toNullableString(form.bloodType),
          modelCategory: config.showModelCategory ? toNullableString(form.modelCategory) : null,
          photoUrl: toNullableString(form.photoUrl),
          bankEntity: toNullableString(form.bankEntity),
          bankAccountType: toNullableString(form.bankAccountType),
          bankAccountNumber: toNullableString(form.bankAccountNumber),
          status: form.status,
          notes: toNullableString(form.notes),
        };

        const response = await api.patch<EnvelopeResponse<PersonDetailRecord>>(`${config.endpoint}/${selectedPerson.id}`, payload);
        await queryClient.invalidateQueries({ queryKey: [config.endpoint] });
        await queryClient.invalidateQueries({ queryKey: [config.endpoint, 'detail', selectedPerson.id] });
        setForm(toFormState(response.data));
        setFeedback({ tone: 'success', message: `${config.highlightLabel} #${response.data.id} actualizado.` });
      }
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : `No fue posible guardar ${config.title.toLowerCase()}.`,
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PermissionGuard permission={`${config.permissionBase}.view`}>
      <div className="page-stack">
        <PageHero
          eyebrow={config.eyebrow}
          title={config.title}
          description={config.description}
          actions={
            canCreate ? (
              <ActionButton onClick={startCreate}>
                <Plus size={16} />
                Nuevo registro
              </ActionButton>
            ) : null
          }
        />

        <div className="workspace-grid">
          <Panel>
            <EntitySelectionList
              eyebrow="Listado"
              title={config.listTitle}
              description={config.listDescription}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar por nombre, documento o email"
              items={people}
              selectedId={selectedId}
              getId={(item) => item.id}
              renderTitle={(item) => (
                <>
                  <strong>{item.firstName} {item.lastName}</strong>
                  <StatusBadge value={item.status} />
                </>
              )}
              renderDescription={(item) => (
                <>
                  <p>{shortText(item.documentType)} {shortText(item.documentNumber)}</p>
                  <p>{shortText(item.email || item.personalEmail || item.phone)}</p>
                </>
              )}
              renderMeta={(item) => (
                <>
                  <span>{item.branchId ? branchNameById.get(item.branchId) ?? `Sede #${item.branchId}` : 'Sin sede'}</span>
                  <span>{formatDateTime(item.updatedAt)}</span>
                </>
              )}
              emptyTitle={config.emptyTitle}
              emptyDescription={config.emptyDescription}
              loading={peopleQuery.isPending}
              error={peopleQuery.error instanceof Error ? peopleQuery.error.message : null}
              onRefresh={() => void refreshPeople()}
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
              eyebrow="Ficha"
              title={mode === 'create' ? `Crear ${config.highlightLabel.toLowerCase()}` : `Editar ${config.highlightLabel.toLowerCase()}`}
              description={mode === 'create' ? config.formDescription : config.detailDescription}
            />

            {feedback ? <InlineMessage tone={feedback.tone}>{feedback.message}</InlineMessage> : null}
            {!canViewBranches ? (
              <InlineMessage tone="info">Tu sesion no incluye `branches.view`; se usa la sede activa o una asignacion vacia segun el alcance actual.</InlineMessage>
            ) : null}
            {usingCatalogFallback ? (
              <InlineMessage tone="info">No fue posible resolver catalogos desde el API; se usan opciones versionadas locales para no frenar el trabajo.</InlineMessage>
            ) : null}
            {!hasCompanyWideAccess && activeBranchId ? (
              <InlineMessage tone="info">La sesion esta acotada a la sede {activeBranchId}; nuevas altas y ediciones quedan ligadas a ese contexto.</InlineMessage>
            ) : null}

            <form className="editor-form" onSubmit={handleSubmit}>
              <div className="field-grid two-columns">
                <Field label="Nombre" htmlFor={`${config.permissionBase}-first-name`}>
                  <TextInput id={`${config.permissionBase}-first-name`} value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} disabled={!canCreate && !canEdit} required />
                </Field>

                <Field label="Apellido" htmlFor={`${config.permissionBase}-last-name`}>
                  <TextInput id={`${config.permissionBase}-last-name`} value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} disabled={!canCreate && !canEdit} required />
                </Field>

                <Field label="Tipo de identificacion" htmlFor={`${config.permissionBase}-document-type`}>
                  <SelectInput id={`${config.permissionBase}-document-type`} value={form.documentType} onChange={(event) => setForm((current) => ({ ...current, documentType: event.target.value }))} disabled={!canCreate && !canEdit}>
                    <option value="">Selecciona</option>
                    {identificationTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </SelectInput>
                </Field>

                <Field label="Numero de identificacion" htmlFor={`${config.permissionBase}-document-number`}>
                  <TextInput id={`${config.permissionBase}-document-number`} value={form.documentNumber} onChange={(event) => setForm((current) => ({ ...current, documentNumber: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>

                <Field label="Expedida en" htmlFor={`${config.permissionBase}-issued-in`}>
                  <TextInput id={`${config.permissionBase}-issued-in`} value={form.issuedIn} onChange={(event) => setForm((current) => ({ ...current, issuedIn: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>

                <Field label="Sede" htmlFor={`${config.permissionBase}-branch-id`}>
                  <SelectInput id={`${config.permissionBase}-branch-id`} value={form.branchId} onChange={(event) => setForm((current) => ({ ...current, branchId: event.target.value }))} disabled={(!canCreate && !canEdit) || !hasCompanyWideAccess}>
                    <option value="">Sin sede asignada</option>
                    {!hasCompanyWideAccess && activeBranchId && !branches.some((branch) => branch.id === activeBranchId) ? <option value={activeBranchId}>{`Sede activa #${activeBranchId}`}</option> : null}
                    {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name} ({branch.code})</option>)}
                  </SelectInput>
                </Field>

                <Field label="Fecha de nacimiento" htmlFor={`${config.permissionBase}-birth-date`}>
                  <TextInput id={`${config.permissionBase}-birth-date`} type="date" value={form.birthDate} onChange={(event) => setForm((current) => ({ ...current, birthDate: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>

                <Field label="Sexo" htmlFor={`${config.permissionBase}-sex`}>
                  <SelectInput id={`${config.permissionBase}-sex`} value={form.sex} onChange={(event) => setForm((current) => ({ ...current, sex: event.target.value }))} disabled={!canCreate && !canEdit}>
                    <option value="">Selecciona</option>
                    {sexOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </SelectInput>
                </Field>

                <Field label="RH" htmlFor={`${config.permissionBase}-blood-type`}>
                  <SelectInput id={`${config.permissionBase}-blood-type`} value={form.bloodType} onChange={(event) => setForm((current) => ({ ...current, bloodType: event.target.value }))} disabled={!canCreate && !canEdit}>
                    <option value="">Selecciona</option>
                    {bloodTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </SelectInput>
                </Field>

                {config.showModelCategory ? (
                  <Field label="Categoria modelo" htmlFor={`${config.permissionBase}-model-category`}>
                    <SelectInput id={`${config.permissionBase}-model-category`} value={form.modelCategory} onChange={(event) => setForm((current) => ({ ...current, modelCategory: event.target.value }))} disabled={!canCreate && !canEdit}>
                      <option value="">Selecciona</option>
                      {modelCategoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </SelectInput>
                  </Field>
                ) : null}

                <Field label="Estado" htmlFor={`${config.permissionBase}-status`}>
                  <SelectInput id={`${config.permissionBase}-status`} value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as 'active' | 'inactive' }))} disabled={mode === 'create' || (!canCreate && !canEdit)}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </SelectInput>
                </Field>
              </div>

              <SectionHeading eyebrow="Contacto" title="Canales y direccion" description="Mantiene la misma base canonica usada en people." />

              <div className="field-grid two-columns">
                <Field label="Email corporativo" htmlFor={`${config.permissionBase}-email`}>
                  <TextInput id={`${config.permissionBase}-email`} type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>

                <Field label="Email personal" htmlFor={`${config.permissionBase}-personal-email`}>
                  <TextInput id={`${config.permissionBase}-personal-email`} type="email" value={form.personalEmail} onChange={(event) => setForm((current) => ({ ...current, personalEmail: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>

                <Field label="Telefono" htmlFor={`${config.permissionBase}-phone`}>
                  <TextInput id={`${config.permissionBase}-phone`} value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>

                <Field label="Foto / URL publica" htmlFor={`${config.permissionBase}-photo-url`}>
                  <TextInput id={`${config.permissionBase}-photo-url`} value={form.photoUrl} onChange={(event) => setForm((current) => ({ ...current, photoUrl: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>
              </div>

              <Field label="Direccion" htmlFor={`${config.permissionBase}-address`}>
                <TextAreaInput id={`${config.permissionBase}-address`} rows={2} value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} disabled={!canCreate && !canEdit} />
              </Field>

              <SectionHeading eyebrow="Banca" title="Cuenta y dispersion" description="Reutiliza la base financiera versionada en people para no duplicar reglas." />

              <div className="field-grid two-columns">
                <Field label="Entidad bancaria" htmlFor={`${config.permissionBase}-bank-entity`}>
                  <TextInput id={`${config.permissionBase}-bank-entity`} value={form.bankEntity} onChange={(event) => setForm((current) => ({ ...current, bankEntity: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>

                <Field label="Tipo de cuenta" htmlFor={`${config.permissionBase}-bank-account-type`}>
                  <SelectInput id={`${config.permissionBase}-bank-account-type`} value={form.bankAccountType} onChange={(event) => setForm((current) => ({ ...current, bankAccountType: event.target.value }))} disabled={!canCreate && !canEdit}>
                    <option value="">Selecciona</option>
                    {bankAccountTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </SelectInput>
                </Field>

                <Field label="Numero de cuenta" htmlFor={`${config.permissionBase}-bank-account-number`}>
                  <TextInput id={`${config.permissionBase}-bank-account-number`} value={form.bankAccountNumber} onChange={(event) => setForm((current) => ({ ...current, bankAccountNumber: event.target.value }))} disabled={!canCreate && !canEdit} />
                </Field>

                <Field label="Resumen operativo actual">
                  <div className="detail-chip-row wrap-row">
                    <StatusBadge value={selectedPersonDetail?.status ?? (mode === 'create' ? 'draft' : '--')} />
                    <span>{selectedPersonDetail ? `${selectedPersonDetail.contracts.length} contratos` : 'Sin detalle cargado'}</span>
                    <span>{selectedPersonDetail ? `${selectedPersonDetail.documents.length} documentos` : '0 documentos'}</span>
                  </div>
                </Field>
              </div>

              <Field label="Notas" htmlFor={`${config.permissionBase}-notes`}>
                <TextAreaInput id={`${config.permissionBase}-notes`} rows={4} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} disabled={!canCreate && !canEdit} />
              </Field>

              {selectedPersonDetail ? (
                <div className="detail-list">
                  <div>
                    <span>Sede actual</span>
                    <strong>{selectedPersonDetail.branchName ?? 'Sin sede asignada'}</strong>
                  </div>
                  <div>
                    <span>{config.highlightLabel} activo</span>
                    <strong>{selectedPersonDetail.fullName}</strong>
                  </div>
                  <div>
                    <span>Ultimo contrato</span>
                    <strong>{latestContract ? shortText(latestContract.positionName || latestContract.contractType) : 'Sin contratos cargados'}</strong>
                  </div>
                  <div>
                    <span>Ultima actualizacion</span>
                    <strong>{formatDateTime(selectedPersonDetail.updatedAt)}</strong>
                  </div>
                </div>
              ) : null}

              {canCreate || canEdit ? (
                <div className="form-actions-row">
                  <ActionButton type="submit" disabled={isSaving || (mode === 'edit' && !selectedPerson)}>
                    <Save size={16} />
                    {isSaving ? 'Guardando...' : mode === 'create' ? `Crear ${config.highlightLabel.toLowerCase()}` : 'Guardar cambios'}
                  </ActionButton>
                  {mode === 'create' && people.length ? (
                    <ActionButton
                      variant="secondary"
                      onClick={() => {
                        const first = people[0];
                        setMode('edit');
                        setSelectedId(first.id);
                        setForm(toFormState(first));
                        setFeedback(null);
                      }}
                    >
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

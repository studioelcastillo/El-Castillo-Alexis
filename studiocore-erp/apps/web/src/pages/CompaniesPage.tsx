import type {
  CompanyRecord,
  CreateCompanyInput,
  EnvelopeResponse,
  PaginatedResponse,
  UpdateCompanyInput,
} from '@studiocore/contracts';
import { ActionButton, Field, InlineMessage, PageHero, Panel, SectionHeading, StatusBadge, TextInput } from '@studiocore/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EntitySelectionList } from '../components/EntitySelectionList';
import { PermissionGuard } from '../components/PermissionGuard';
import { useApiClient, useAuth } from '../lib/auth';
import { toNullableString, toOptionalString } from '../lib/forms';
import { formatDateTime, shortText } from '../lib/format';

type CompanyFormState = {
  name: string;
  legalName: string;
  taxId: string;
  email: string;
  phone: string;
};

const emptyForm: CompanyFormState = {
  name: '',
  legalName: '',
  taxId: '',
  email: '',
  phone: '',
};

function toFormState(company?: CompanyRecord | null): CompanyFormState {
  if (!company) {
    return emptyForm;
  }

  return {
    name: company.name,
    legalName: company.legalName,
    taxId: company.taxId ?? '',
    email: company.email ?? '',
    phone: company.phone ?? '',
  };
}

export function CompaniesPage() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { hasPermission, session } = useAuth();
  const hasCompanyWideAccess = session?.user.hasCompanyWideAccess ?? false;
  const canCreate = hasCompanyWideAccess && hasPermission('companies.create');
  const canEdit = hasCompanyWideAccess && hasPermission('companies.edit');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('edit');
  const [form, setForm] = useState<CompanyFormState>(emptyForm);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const companiesQuery = useQuery({
    queryKey: ['companies-management'],
    queryFn: () => api.get<PaginatedResponse<CompanyRecord>>('/companies'),
  });

  const allCompanies = companiesQuery.data?.items ?? [];
  const filteredCompanies = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return allCompanies;
    }

    return allCompanies.filter((company) =>
      [company.name, company.legalName, company.taxId ?? '', company.email ?? '']
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [allCompanies, search]);

  const selectedCompany = allCompanies.find((company) => company.id === selectedId) ?? null;

  useEffect(() => {
    if (mode === 'create') {
      return;
    }

    if (!allCompanies.length) {
      setSelectedId(null);
      setForm(emptyForm);
      return;
    }

    if (!selectedId || !allCompanies.some((company) => company.id === selectedId)) {
      const first = allCompanies[0];
      setSelectedId(first.id);
      setForm(toFormState(first));
      return;
    }

    setForm(toFormState(selectedCompany));
  }, [allCompanies, mode, selectedCompany, selectedId]);

  async function refreshCompanies() {
    setFeedback(null);
    await companiesQuery.refetch();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsSaving(true);

    try {
      if (mode === 'create') {
        const payload: CreateCompanyInput = {
          name: form.name.trim(),
          legalName: form.legalName.trim(),
          ...(toOptionalString(form.taxId) ? { taxId: toOptionalString(form.taxId) } : {}),
          ...(toOptionalString(form.email) ? { email: toOptionalString(form.email) } : {}),
          ...(toOptionalString(form.phone) ? { phone: toOptionalString(form.phone) } : {}),
        };
        const response = await api.post<EnvelopeResponse<CompanyRecord>>('/companies', payload);
        await queryClient.invalidateQueries({ queryKey: ['companies-management'] });
        setMode('edit');
        setSelectedId(response.data.id);
        setForm(toFormState(response.data));
        setFeedback({ tone: 'success', message: `Empresa #${response.data.id} creada correctamente.` });
      } else if (selectedCompany) {
        const payload: UpdateCompanyInput = {
          name: form.name.trim(),
          legalName: form.legalName.trim(),
          taxId: toNullableString(form.taxId),
          email: toNullableString(form.email),
          phone: toNullableString(form.phone),
        };
        const response = await api.patch<EnvelopeResponse<CompanyRecord>>(`/companies/${selectedCompany.id}`, payload);
        await queryClient.invalidateQueries({ queryKey: ['companies-management'] });
        setForm(toFormState(response.data));
        setFeedback({ tone: 'success', message: `Empresa #${response.data.id} actualizada.` });
      }
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'No fue posible guardar la empresa.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  function startCreate() {
    setMode('create');
    setSelectedId(null);
    setForm(emptyForm);
    setFeedback(null);
  }

  return (
    <PermissionGuard permission="companies.view">
      <div className="page-stack">
        <PageHero
          eyebrow="Organizacion"
          title="Empresas"
          description="Gestion base de tenants empresariales. En esta fase ya puedes crear y editar empresas reales sobre el backend nuevo."
          actions={
            canCreate ? (
              <ActionButton onClick={startCreate}>
                <Plus size={16} />
                Nueva empresa
              </ActionButton>
            ) : null
          }
        />

        <div className="workspace-grid">
          <Panel>
            <EntitySelectionList
              eyebrow="Catalogo"
              title="Empresas registradas"
              description="Selecciona una empresa para revisar o editar su ficha canonica." 
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar por nombre, razon social, NIT o email"
              items={filteredCompanies}
              selectedId={selectedId}
              getId={(item) => item.id}
              renderTitle={(item) => (
                <>
                  <strong>{item.name}</strong>
                  <StatusBadge value={item.status} />
                </>
              )}
              renderDescription={(item) => (
                <>
                  <p>{item.legalName}</p>
                  <p>{shortText(item.taxId)}</p>
                </>
              )}
              renderMeta={(item) => (
                <>
                  <span>{shortText(item.email)}</span>
                  <span>{formatDateTime(item.updatedAt)}</span>
                </>
              )}
              emptyTitle="No hay empresas visibles"
              emptyDescription="Todavia no hay empresas para el filtro actual."
              loading={companiesQuery.isPending}
              error={companiesQuery.error instanceof Error ? companiesQuery.error.message : null}
              onRefresh={() => void refreshCompanies()}
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
              title={mode === 'create' ? 'Crear empresa' : 'Editar empresa'}
              description={
                mode === 'create'
                  ? 'Prepara un tenant empresarial nuevo con sus datos canonicos base.'
                  : 'Actualiza la identidad operativa y legal de la empresa seleccionada.'
              }
            />

            {feedback ? <InlineMessage tone={feedback.tone}>{feedback.message}</InlineMessage> : null}
            {!hasCompanyWideAccess ? (
              <InlineMessage tone="info">
                Esta vista queda en solo lectura mientras tu sesion opere una sede concreta. Para crear o editar empresas necesitas acceso global de empresa.
              </InlineMessage>
            ) : null}

            <form className="editor-form" onSubmit={handleSubmit}>
              <div className="field-grid two-columns">
                <Field label="Nombre comercial" htmlFor="company-name">
                  <TextInput
                    id="company-name"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    disabled={!canCreate && !canEdit}
                    required
                  />
                </Field>

                <Field label="Razon social" htmlFor="company-legal-name">
                  <TextInput
                    id="company-legal-name"
                    value={form.legalName}
                    onChange={(event) => setForm((current) => ({ ...current, legalName: event.target.value }))}
                    disabled={!canCreate && !canEdit}
                    required
                  />
                </Field>

                <Field label="NIT" htmlFor="company-tax-id">
                  <TextInput
                    id="company-tax-id"
                    value={form.taxId}
                    onChange={(event) => setForm((current) => ({ ...current, taxId: event.target.value }))}
                    disabled={!canCreate && !canEdit}
                  />
                </Field>

                <Field label="Telefono" htmlFor="company-phone">
                  <TextInput
                    id="company-phone"
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    disabled={!canCreate && !canEdit}
                  />
                </Field>

                <Field label="Email corporativo" htmlFor="company-email">
                  <TextInput
                    id="company-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    disabled={!canCreate && !canEdit}
                  />
                </Field>

                <Field label="Estado actual">
                  <div className="detail-chip-row">
                    <StatusBadge value={selectedCompany?.status ?? (mode === 'create' ? 'draft' : '--')} />
                    {selectedCompany ? <span>Actualizado {formatDateTime(selectedCompany.updatedAt)}</span> : null}
                  </div>
                </Field>
              </div>

              {canCreate || canEdit ? (
                <div className="form-actions-row">
                  <ActionButton type="submit" disabled={isSaving || (mode === 'edit' && !selectedCompany)}>
                    <Save size={16} />
                    {isSaving ? 'Guardando...' : mode === 'create' ? 'Crear empresa' : 'Guardar cambios'}
                  </ActionButton>
                  {mode === 'create' && allCompanies.length ? (
                    <ActionButton
                      variant="secondary"
                      onClick={() => {
                        const first = allCompanies[0];
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
              ) : (
                <InlineMessage tone="info">Tu sesion actual tiene lectura de empresas, pero no permisos de edicion.</InlineMessage>
              )}
            </form>
          </Panel>
        </div>
      </div>
    </PermissionGuard>
  );
}

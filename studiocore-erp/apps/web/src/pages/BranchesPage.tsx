import type {
  BranchRecord,
  CreateBranchInput,
  EnvelopeResponse,
  PaginatedResponse,
  UpdateBranchInput,
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

type BranchFormState = {
  name: string;
  code: string;
  city: string;
  address: string;
  phone: string;
};

const emptyForm: BranchFormState = {
  name: '',
  code: '',
  city: '',
  address: '',
  phone: '',
};

function toFormState(branch?: BranchRecord | null): BranchFormState {
  if (!branch) {
    return emptyForm;
  }

  return {
    name: branch.name,
    code: branch.code,
    city: branch.city ?? '',
    address: branch.address ?? '',
    phone: branch.phone ?? '',
  };
}

export function BranchesPage() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { hasPermission, session } = useAuth();
  const hasCompanyWideAccess = session?.user.hasCompanyWideAccess ?? false;
  const canCreate = hasCompanyWideAccess && hasPermission('branches.create');
  const canEdit = hasCompanyWideAccess && hasPermission('branches.edit');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('edit');
  const [form, setForm] = useState<BranchFormState>(emptyForm);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const branchesQuery = useQuery({
    queryKey: ['branches-management', search],
    queryFn: () => {
      const params = new URLSearchParams({ page: '1', pageSize: '100' });
      if (search.trim()) {
        params.set('search', search.trim());
      }
      return api.get<PaginatedResponse<BranchRecord>>(`/branches?${params.toString()}`);
    },
  });

  const allBranches = branchesQuery.data?.items ?? [];
  const selectedBranch = allBranches.find((branch) => branch.id === selectedId) ?? null;

  useEffect(() => {
    if (mode === 'create') {
      return;
    }

    if (!allBranches.length) {
      setSelectedId(null);
      setForm(emptyForm);
      return;
    }

    if (!selectedId || !allBranches.some((branch) => branch.id === selectedId)) {
      const first = allBranches[0];
      setSelectedId(first.id);
      setForm(toFormState(first));
      return;
    }

    setForm(toFormState(selectedBranch));
  }, [allBranches, mode, selectedBranch, selectedId]);

  const totalHint = useMemo(() => `${allBranches.length} sedes cargadas para la empresa activa.`, [allBranches.length]);

  async function refreshBranches() {
    setFeedback(null);
    await branchesQuery.refetch();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsSaving(true);

    try {
      if (mode === 'create') {
        const payload: CreateBranchInput = {
          name: form.name.trim(),
          code: form.code.trim(),
          ...(toOptionalString(form.city) ? { city: toOptionalString(form.city) } : {}),
          ...(toOptionalString(form.address) ? { address: toOptionalString(form.address) } : {}),
          ...(toOptionalString(form.phone) ? { phone: toOptionalString(form.phone) } : {}),
        };
        const response = await api.post<EnvelopeResponse<BranchRecord>>('/branches', payload);
        await queryClient.invalidateQueries({ queryKey: ['branches-management'] });
        setMode('edit');
        setSelectedId(response.data.id);
        setForm(toFormState(response.data));
        setFeedback({ tone: 'success', message: `Sede #${response.data.id} creada correctamente.` });
      } else if (selectedBranch) {
        const payload: UpdateBranchInput = {
          name: form.name.trim(),
          code: form.code.trim(),
          city: toNullableString(form.city),
          address: toNullableString(form.address),
          phone: toNullableString(form.phone),
        };
        const response = await api.patch<EnvelopeResponse<BranchRecord>>(`/branches/${selectedBranch.id}`, payload);
        await queryClient.invalidateQueries({ queryKey: ['branches-management'] });
        setForm(toFormState(response.data));
        setFeedback({ tone: 'success', message: `Sede #${response.data.id} actualizada.` });
      }
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'No fue posible guardar la sede.',
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
    <PermissionGuard permission="branches.view">
      <div className="page-stack">
        <PageHero
          eyebrow="Organizacion"
          title="Sedes"
          description="Operacion multisede real desde el backend nuevo. Aqui ya puedes dar de alta y editar sedes de la empresa activa."
          actions={
            canCreate ? (
              <ActionButton onClick={startCreate}>
                <Plus size={16} />
                Nueva sede
              </ActionButton>
            ) : null
          }
        />

        <div className="workspace-grid">
          <Panel>
            <EntitySelectionList
              eyebrow="Listado"
              title="Sedes activas"
              description={totalHint}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar por nombre, codigo o ciudad"
              items={allBranches}
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
                  <p>Codigo {item.code}</p>
                  <p>{shortText(item.city)}</p>
                </>
              )}
              renderMeta={(item) => (
                <>
                  <span>{shortText(item.phone)}</span>
                  <span>{formatDateTime(item.updatedAt)}</span>
                </>
              )}
              emptyTitle="No hay sedes visibles"
              emptyDescription="Todavia no hay sedes para esta empresa o para el filtro actual."
              loading={branchesQuery.isPending}
              error={branchesQuery.error instanceof Error ? branchesQuery.error.message : null}
              onRefresh={() => void refreshBranches()}
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
              title={mode === 'create' ? 'Crear sede' : 'Editar sede'}
              description={
                mode === 'create'
                  ? 'Define el punto operativo, su codigo y los datos base de contacto.'
                  : 'Mantiene alineada la identidad operativa de la sede seleccionada.'
              }
            />

            {feedback ? <InlineMessage tone={feedback.tone}>{feedback.message}</InlineMessage> : null}
            {!hasCompanyWideAccess ? (
              <InlineMessage tone="info">
                Tu sesion esta limitada a la sede activa, asi que este catalogo queda en consulta. El alta o edicion de sedes requiere acceso global de empresa.
              </InlineMessage>
            ) : null}

            <form className="editor-form" onSubmit={handleSubmit}>
              <div className="field-grid two-columns">
                <Field label="Nombre" htmlFor="branch-name">
                  <TextInput
                    id="branch-name"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    disabled={!canCreate && !canEdit}
                    required
                  />
                </Field>

                <Field label="Codigo" htmlFor="branch-code" hint="Ideal para identificacion corta y reportes.">
                  <TextInput
                    id="branch-code"
                    value={form.code}
                    onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
                    disabled={!canCreate && !canEdit}
                    required
                  />
                </Field>

                <Field label="Ciudad" htmlFor="branch-city">
                  <TextInput
                    id="branch-city"
                    value={form.city}
                    onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                    disabled={!canCreate && !canEdit}
                  />
                </Field>

                <Field label="Telefono" htmlFor="branch-phone">
                  <TextInput
                    id="branch-phone"
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    disabled={!canCreate && !canEdit}
                  />
                </Field>

                <Field label="Direccion" htmlFor="branch-address">
                  <TextInput
                    id="branch-address"
                    value={form.address}
                    onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                    disabled={!canCreate && !canEdit}
                  />
                </Field>

                <Field label="Estado actual">
                  <div className="detail-chip-row">
                    <StatusBadge value={selectedBranch?.status ?? (mode === 'create' ? 'draft' : '--')} />
                    {selectedBranch ? <span>Actualizado {formatDateTime(selectedBranch.updatedAt)}</span> : null}
                  </div>
                </Field>
              </div>

              {canCreate || canEdit ? (
                <div className="form-actions-row">
                  <ActionButton type="submit" disabled={isSaving || (mode === 'edit' && !selectedBranch)}>
                    <Save size={16} />
                    {isSaving ? 'Guardando...' : mode === 'create' ? 'Crear sede' : 'Guardar cambios'}
                  </ActionButton>
                  {mode === 'create' && allBranches.length ? (
                    <ActionButton
                      variant="secondary"
                      onClick={() => {
                        const first = allBranches[0];
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
                <InlineMessage tone="info">Tu sesion actual puede consultar sedes, pero no editar su configuracion.</InlineMessage>
              )}
            </form>
          </Panel>
        </div>
      </div>
    </PermissionGuard>
  );
}

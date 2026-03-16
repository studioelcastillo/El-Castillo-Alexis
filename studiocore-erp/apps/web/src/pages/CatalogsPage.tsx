import type {
  CatalogGroupRecord,
  CatalogListResponse,
  CreateCatalogGroupInput,
  EnvelopeResponse,
  UpdateCatalogGroupInput,
} from '@studiocore/contracts';
import {
  ActionButton,
  CheckboxField,
  EmptyState,
  Field,
  InlineMessage,
  PageHero,
  Panel,
  SectionHeading,
  StatusBadge,
  TextAreaInput,
  TextInput,
} from '@studiocore/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CopyPlus, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EntitySelectionList } from '../components/EntitySelectionList';
import { PermissionGuard } from '../components/PermissionGuard';
import { useApiClient, useAuth } from '../lib/auth';
import { fallbackCatalogGroups } from '../lib/catalogs';
import { formatDateTime, shortText } from '../lib/format';

type CatalogItemFormState = {
  value: string;
  label: string;
  description: string;
  isDefault: boolean;
};

type CatalogFormState = {
  key: string;
  label: string;
  description: string;
  items: CatalogItemFormState[];
};

const emptyItem: CatalogItemFormState = {
  value: '',
  label: '',
  description: '',
  isDefault: true,
};

const emptyForm: CatalogFormState = {
  key: '',
  label: '',
  description: '',
  items: [emptyItem],
};

function toFormState(group?: CatalogGroupRecord | null): CatalogFormState {
  if (!group) {
    return {
      ...emptyForm,
      items: [{ ...emptyItem }],
    };
  }

  return {
    key: group.key,
    label: group.label,
    description: group.description ?? '',
    items: group.items.length
      ? group.items.map((item) => ({
          value: item.value,
          label: item.label,
          description: item.description ?? '',
          isDefault: item.isDefault,
        }))
      : [{ ...emptyItem }],
  };
}

function cloneItems(items: CatalogItemFormState[]) {
  return items.map((item) => ({ ...item }));
}

function ensureDefaultItem(items: CatalogItemFormState[]) {
  if (!items.length) {
    return [{ ...emptyItem }];
  }

  if (items.some((item) => item.isDefault)) {
    return items;
  }

  return items.map((item, index) => ({ ...item, isDefault: index === 0 }));
}

export function CatalogsPage() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { hasPermission, session } = useAuth();
  const hasCompanyWideAccess = session?.user.hasCompanyWideAccess ?? false;
  const canCreate = hasCompanyWideAccess && hasPermission('catalogs.create');
  const canEdit = hasCompanyWideAccess && hasPermission('catalogs.edit');
  const [search, setSearch] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('edit');
  const [form, setForm] = useState<CatalogFormState>(toFormState());
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const catalogsQuery = useQuery({
    queryKey: ['catalogs-base'],
    queryFn: () => api.get<CatalogListResponse>('/catalogs'),
  });

  const allCatalogGroups = catalogsQuery.data?.items?.length ? catalogsQuery.data.items : fallbackCatalogGroups;
  const isUsingFallback = Boolean(catalogsQuery.isError || (catalogsQuery.data && !catalogsQuery.data.items.length));
  const filteredCatalogGroups = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return allCatalogGroups;
    }

    return allCatalogGroups.filter((group) =>
      [group.key, group.label, group.description ?? '', group.scope]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [allCatalogGroups, search]);

  const selectedGroup = allCatalogGroups.find((group) => group.key === selectedKey) ?? null;
  const isSystemGroup = mode === 'edit' && selectedGroup?.scope === 'system';
  const canManageCurrent = mode === 'create' ? canCreate : canEdit && selectedGroup?.scope === 'company';

  useEffect(() => {
    if (mode === 'create') {
      return;
    }

    if (!allCatalogGroups.length) {
      setSelectedKey(null);
      setForm(toFormState());
      return;
    }

    if (!selectedKey || !allCatalogGroups.some((group) => group.key === selectedKey)) {
      const first = allCatalogGroups[0];
      setSelectedKey(first.key);
      setForm(toFormState(first));
      return;
    }

    setForm(toFormState(selectedGroup));
  }, [allCatalogGroups, mode, selectedGroup, selectedKey]);

  async function refreshCatalogs() {
    setFeedback(null);
    await catalogsQuery.refetch();
  }

  function startCreate() {
    setMode('create');
    setForm(toFormState());
    setFeedback(null);
  }

  function startCustomize(group?: CatalogGroupRecord | null) {
    setMode('create');
    setSelectedKey(group?.key ?? selectedKey);
    setForm(toFormState(group));
    setFeedback(null);
  }

  function returnToSelection(preferredKey?: string | null) {
    const nextKey = preferredKey && allCatalogGroups.some((group) => group.key === preferredKey)
      ? preferredKey
      : allCatalogGroups[0]?.key ?? null;

    setMode('edit');
    setSelectedKey(nextKey);
    setForm(toFormState(allCatalogGroups.find((group) => group.key === nextKey) ?? null));
    setFeedback(null);
  }

  function updateItem(index: number, patch: Partial<CatalogItemFormState>) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return patch.isDefault ? { ...item, isDefault: false } : item;
        }

        return { ...item, ...patch };
      }),
    }));
  }

  function toggleDefault(index: number, checked: boolean) {
    setForm((current) => {
      const nextItems = current.items.map((item, itemIndex) => {
        if (checked) {
          return { ...item, isDefault: itemIndex === index };
        }

        if (itemIndex !== index) {
          return item;
        }

        return { ...item, isDefault: false };
      });

      return {
        ...current,
        items: ensureDefaultItem(nextItems),
      };
    });
  }

  function addItem() {
    setForm((current) => ({
      ...current,
      items: [...current.items, { ...emptyItem, isDefault: false }],
    }));
  }

  function removeItem(index: number) {
    setForm((current) => {
      const remaining = current.items.filter((_, itemIndex) => itemIndex !== index);
      return {
        ...current,
        items: ensureDefaultItem(remaining),
      };
    });
  }

  async function syncSelection(nextKey: string | null, successMessage: string) {
    await queryClient.invalidateQueries({ queryKey: ['catalogs-base'] });
    const refreshed = await catalogsQuery.refetch();
    const nextGroups = refreshed.data?.items?.length ? refreshed.data.items : fallbackCatalogGroups;
    const resolvedKey = nextKey && nextGroups.some((group) => group.key === nextKey)
      ? nextKey
      : nextGroups[0]?.key ?? null;
    const resolvedGroup = nextGroups.find((group) => group.key === resolvedKey) ?? null;

    setMode('edit');
    setSelectedKey(resolvedKey);
    setForm(toFormState(resolvedGroup));
    setFeedback({ tone: 'success', message: successMessage });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsSaving(true);

    const payloadBase = {
      key: form.key.trim(),
      label: form.label.trim(),
      description: form.description.trim() || null,
      items: ensureDefaultItem(cloneItems(form.items)).map((item) => ({
        value: item.value.trim(),
        label: item.label.trim(),
        description: item.description.trim() || null,
        isDefault: item.isDefault,
      })),
    };

    try {
      if (mode === 'create') {
        const payload: CreateCatalogGroupInput = payloadBase;
        const response = await api.post<EnvelopeResponse<CatalogGroupRecord>>('/catalogs/groups', payload);
        await syncSelection(response.data.key, `Catalogo \`${response.data.key}\` guardado para la empresa.`);
      } else if (selectedGroup?.scope === 'company' && selectedGroup.id) {
        const payload: UpdateCatalogGroupInput = payloadBase;
        const response = await api.patch<EnvelopeResponse<CatalogGroupRecord>>(`/catalogs/groups/${selectedGroup.id}`, payload);
        await syncSelection(response.data.key, `Catalogo \`${response.data.key}\` actualizado.`);
      }
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'No fue posible guardar el catalogo.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedGroup?.id || selectedGroup.scope !== 'company') {
      return;
    }

    setFeedback(null);
    setIsDeleting(true);
    try {
      await api.delete<{ success: boolean }>(`/catalogs/groups/${selectedGroup.id}`);
      await syncSelection(selectedGroup.key, `Se retiro la personalizacion de \`${selectedGroup.key}\` y quedo visible la version base.`);
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'No fue posible eliminar la personalizacion.',
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <PermissionGuard permission="catalogs.view">
      <div className="page-stack">
        <PageHero
          eyebrow="Core organizacional"
          title="Catalogos"
          description="Administra catalogos base y overrides por empresa para formularios como people, contratos y documentos."
          actions={
            canCreate ? (
              <ActionButton onClick={startCreate}>
                <Plus size={16} />
                Nuevo catalogo
              </ActionButton>
            ) : null
          }
        />

        <div className="workspace-grid">
          <Panel>
            <EntitySelectionList
              eyebrow="Listado"
              title="Catalogos visibles"
              description={`${allCatalogGroups.length} grupos visibles entre base del sistema y personalizaciones de empresa.`}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar por key, nombre o descripcion"
              items={filteredCatalogGroups}
              selectedId={selectedKey}
              getId={(item) => item.key}
              renderTitle={(item) => (
                <>
                  <strong>{item.label}</strong>
                  <StatusBadge value={item.scope === 'company' ? 'company' : 'system'} />
                </>
              )}
              renderDescription={(item) => (
                <>
                  <p>{item.key}</p>
                  <p>{shortText(item.description || 'Sin descripcion')}</p>
                </>
              )}
              renderMeta={(item) => (
                <>
                  <span>{item.items.length} opciones</span>
                  <span>{item.updatedAt ? formatDateTime(item.updatedAt) : 'Base versionada'}</span>
                </>
              )}
              emptyTitle="Sin catalogos visibles"
              emptyDescription="No hay catalogos que coincidan con el filtro actual."
              loading={catalogsQuery.isPending}
              error={catalogsQuery.error instanceof Error ? catalogsQuery.error.message : null}
              onRefresh={() => void refreshCatalogs()}
              onSelect={(item) => {
                setMode('edit');
                setSelectedKey(item.key);
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
              title={mode === 'create' ? 'Crear o personalizar catalogo' : 'Detalle del catalogo'}
              description={
                mode === 'create'
                  ? 'Puedes crear un grupo nuevo o clonar uno base para personalizarlo a nivel de empresa.'
                  : 'Los catalogos de sistema sirven como base; las versiones company override toman precedencia en la empresa activa.'
              }
            />

            {feedback ? <InlineMessage tone={feedback.tone}>{feedback.message}</InlineMessage> : null}
            {isUsingFallback ? (
              <InlineMessage tone="info">
                La lectura del API fallo y la vista usa el snapshot local versionado. Las acciones de guardado siguen apuntando al backend nuevo.
              </InlineMessage>
            ) : null}
            {!hasCompanyWideAccess ? (
              <InlineMessage tone="info">
                La sesion actual esta acotada por sede. Puedes consultar catalogos, pero crear o editar requiere acceso global de empresa.
              </InlineMessage>
            ) : null}
            {isSystemGroup ? (
              <InlineMessage tone="info">
                Este grupo es base del sistema y queda en solo lectura. Si quieres modificarlo para tu empresa, usa "Personalizar en empresa".
              </InlineMessage>
            ) : null}

            {mode === 'edit' && !selectedGroup ? (
              <EmptyState title="Sin catalogo seleccionado" description="Selecciona un catalogo o crea uno nuevo para continuar." compact />
            ) : (
              <form className="editor-form" onSubmit={handleSubmit}>
                <div className="field-grid two-columns">
                  <Field label="Key tecnica" htmlFor="catalog-key" hint="Se normaliza en snake_case dentro del backend.">
                    <TextInput
                      id="catalog-key"
                      value={form.key}
                      onChange={(event) => setForm((current) => ({ ...current, key: event.target.value }))}
                      disabled={!canManageCurrent}
                      required
                    />
                  </Field>

                  <Field label="Nombre visible" htmlFor="catalog-label">
                    <TextInput
                      id="catalog-label"
                      value={form.label}
                      onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
                      disabled={!canManageCurrent}
                      required
                    />
                  </Field>
                </div>

                <Field label="Descripcion" htmlFor="catalog-description">
                  <TextAreaInput
                    id="catalog-description"
                    rows={3}
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    disabled={!canManageCurrent}
                  />
                </Field>

                <div className="catalog-items-shell">
                  <SectionHeading
                    eyebrow="Opciones"
                    title="Items del catalogo"
                    description={`${form.items.length} opciones en esta version del catalogo.`}
                    actions={
                      canManageCurrent ? (
                        <ActionButton variant="secondary" className="small-button" onClick={addItem}>
                          <Plus size={16} />
                          Agregar item
                        </ActionButton>
                      ) : null
                    }
                  />

                  <div className="catalog-item-list">
                    {form.items.map((item, index) => (
                      <article key={`catalog-item-${index}`} className="catalog-item-card">
                        <div className="catalog-item-card__header">
                          <strong>Item {index + 1}</strong>
                          {canManageCurrent && form.items.length > 1 ? (
                            <ActionButton variant="secondary" className="small-button" onClick={() => removeItem(index)}>
                              Quitar
                            </ActionButton>
                          ) : null}
                        </div>

                        <div className="field-grid two-columns catalog-item-grid">
                          <Field label="Valor tecnico" htmlFor={`catalog-item-value-${index}`}>
                            <TextInput
                              id={`catalog-item-value-${index}`}
                              value={item.value}
                              onChange={(event) => updateItem(index, { value: event.target.value })}
                              disabled={!canManageCurrent}
                            />
                          </Field>

                          <Field label="Etiqueta" htmlFor={`catalog-item-label-${index}`}>
                            <TextInput
                              id={`catalog-item-label-${index}`}
                              value={item.label}
                              onChange={(event) => updateItem(index, { label: event.target.value })}
                              disabled={!canManageCurrent}
                            />
                          </Field>
                        </div>

                        <Field label="Descripcion" htmlFor={`catalog-item-description-${index}`}>
                          <TextAreaInput
                            id={`catalog-item-description-${index}`}
                            rows={2}
                            value={item.description}
                            onChange={(event) => updateItem(index, { description: event.target.value })}
                            disabled={!canManageCurrent}
                          />
                        </Field>

                        <CheckboxField
                          checked={item.isDefault}
                          onChange={(checked) => toggleDefault(index, checked)}
                          label="Item por defecto"
                          hint="Solo una opcion queda marcada como default en cada catalogo."
                          disabled={!canManageCurrent}
                        />
                      </article>
                    ))}
                  </div>
                </div>

                <div className="form-actions-row">
                  {canManageCurrent ? (
                    <ActionButton type="submit" disabled={isSaving}>
                      <Save size={16} />
                      {isSaving ? 'Guardando...' : mode === 'create' ? 'Guardar catalogo' : 'Guardar cambios'}
                    </ActionButton>
                  ) : null}

                  {mode === 'edit' && selectedGroup?.scope === 'system' && canCreate ? (
                    <ActionButton variant="secondary" onClick={() => startCustomize(selectedGroup)}>
                      <CopyPlus size={16} />
                      Personalizar en empresa
                    </ActionButton>
                  ) : null}

                  {mode === 'edit' && selectedGroup?.scope === 'company' && canEdit ? (
                    <ActionButton variant="danger" onClick={() => void handleDelete()} disabled={isDeleting}>
                      <Trash2 size={16} />
                      {isDeleting ? 'Eliminando...' : 'Eliminar override'}
                    </ActionButton>
                  ) : null}

                  {mode === 'create' && allCatalogGroups.length ? (
                    <ActionButton variant="secondary" onClick={() => returnToSelection(selectedKey)}>
                      Cancelar
                    </ActionButton>
                  ) : null}
                </div>
              </form>
            )}
          </Panel>
        </div>
      </div>
    </PermissionGuard>
  );
}

import type {
  CreateRoleInput,
  EnvelopeResponse,
  PaginatedResponse,
  PermissionMatrixResponse,
  PermissionRecord,
  RoleRecord,
  UpdateRoleInput,
} from '@studiocore/contracts';
import {
  ActionButton,
  CheckboxField,
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
import { Plus, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EntitySelectionList } from '../components/EntitySelectionList';
import { PermissionGuard } from '../components/PermissionGuard';
import { useApiClient, useAuth } from '../lib/auth';
import { toNullableString, toOptionalString } from '../lib/forms';
import { formatDateTime, joinValues } from '../lib/format';

type RoleFormState = {
  name: string;
  description: string;
  isSystem: boolean;
  permissionIds: number[];
};

const emptyForm: RoleFormState = {
  name: '',
  description: '',
  isSystem: false,
  permissionIds: [],
};

function toFormState(role?: RoleRecord | null): RoleFormState {
  if (!role) {
    return emptyForm;
  }

  return {
    name: role.name,
    description: role.description ?? '',
    isSystem: role.isSystem,
    permissionIds: [...role.permissionIds].sort((a, b) => a - b),
  };
}

export function RolesPage() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { hasPermission, session } = useAuth();
  const hasCompanyWideAccess = session?.user.hasCompanyWideAccess ?? false;
  const canCreate = hasCompanyWideAccess && hasPermission('roles.create');
  const canEdit = hasCompanyWideAccess && (hasPermission('roles.edit') || hasPermission('roles.manage_permissions'));
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('edit');
  const [form, setForm] = useState<RoleFormState>(emptyForm);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const rolesQuery = useQuery({
    queryKey: ['roles-management', search],
    queryFn: () => {
      const params = new URLSearchParams({ page: '1', pageSize: '100' });
      if (search.trim()) {
        params.set('search', search.trim());
      }
      return api.get<PaginatedResponse<RoleRecord>>(`/roles?${params.toString()}`);
    },
  });

  const permissionsQuery = useQuery({
    queryKey: ['permissions-catalog'],
    queryFn: () => api.get<PaginatedResponse<PermissionRecord>>('/permissions'),
  });

  const matrixQuery = useQuery({
    queryKey: ['permissions-matrix'],
    queryFn: () => api.get<PermissionMatrixResponse>('/permissions/matrix'),
  });

  const roles = rolesQuery.data?.items ?? [];
  const selectedRole = roles.find((role) => role.id === selectedId) ?? null;
  const permissionMatrix = matrixQuery.data?.items ?? {};
  const permissionCount = permissionsQuery.data?.total ?? 0;

  useEffect(() => {
    if (mode === 'create') {
      return;
    }

    if (!roles.length) {
      setSelectedId(null);
      setForm(emptyForm);
      return;
    }

    if (!selectedId || !roles.some((role) => role.id === selectedId)) {
      const first = roles[0];
      setSelectedId(first.id);
      setForm(toFormState(first));
      return;
    }

    setForm(toFormState(selectedRole));
  }, [mode, roles, selectedId, selectedRole]);

  const selectedPermissionKeys = useMemo(() => {
    const catalog = permissionsQuery.data?.items ?? [];
    return catalog
      .filter((permission) => form.permissionIds.includes(permission.id))
      .map((permission) => `${permission.moduleKey}.${permission.actionKey}`);
  }, [form.permissionIds, permissionsQuery.data?.items]);

  async function refreshRoles() {
    setFeedback(null);
    await Promise.all([rolesQuery.refetch(), permissionsQuery.refetch(), matrixQuery.refetch()]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsSaving(true);

    try {
      if (mode === 'create') {
        const payload: CreateRoleInput = {
          name: form.name.trim(),
          ...(toOptionalString(form.description) ? { description: toOptionalString(form.description) } : {}),
          isSystem: form.isSystem,
          permissionIds: [...form.permissionIds].sort((a, b) => a - b),
        };
        const response = await api.post<EnvelopeResponse<RoleRecord>>('/roles', payload);
        await queryClient.invalidateQueries({ queryKey: ['roles-management'] });
        setMode('edit');
        setSelectedId(response.data.id);
        setForm(toFormState(response.data));
        setFeedback({ tone: 'success', message: `Rol #${response.data.id} creado correctamente.` });
      } else if (selectedRole) {
        const payload: UpdateRoleInput = {
          name: form.name.trim(),
          description: toNullableString(form.description),
          isSystem: form.isSystem,
          permissionIds: [...form.permissionIds].sort((a, b) => a - b),
        };
        const response = await api.patch<EnvelopeResponse<RoleRecord>>(`/roles/${selectedRole.id}`, payload);
        await queryClient.invalidateQueries({ queryKey: ['roles-management'] });
        setForm(toFormState(response.data));
        setFeedback({ tone: 'success', message: `Rol #${response.data.id} actualizado.` });
      }
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'No fue posible guardar el rol.',
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

  function togglePermission(permissionId: number) {
    setForm((current) => ({
      ...current,
      permissionIds: current.permissionIds.includes(permissionId)
        ? current.permissionIds.filter((value) => value !== permissionId)
        : [...current.permissionIds, permissionId].sort((a, b) => a - b),
    }));
  }

  function toggleModule(moduleKey: string) {
    const modulePermissions = permissionMatrix[moduleKey]?.map((item) => item.id) ?? [];
    const hasAll = modulePermissions.every((permissionId) => form.permissionIds.includes(permissionId));

    setForm((current) => ({
      ...current,
      permissionIds: hasAll
        ? current.permissionIds.filter((permissionId) => !modulePermissions.includes(permissionId))
        : Array.from(new Set([...current.permissionIds, ...modulePermissions])).sort((a, b) => a - b),
    }));
  }

  return (
    <PermissionGuard permission="roles.view">
      <div className="page-stack">
        <PageHero
          eyebrow="IAM"
          title="Roles y permisos"
          description="Administra paquetes de acceso reutilizables por empresa. Esta vista ya permite editar el rol y su matriz real de permisos."
          actions={
            canCreate ? (
              <ActionButton onClick={startCreate}>
                <Plus size={16} />
                Nuevo rol
              </ActionButton>
            ) : null
          }
        />

        <div className="workspace-grid roles-workspace-grid">
          <Panel>
            <EntitySelectionList
              eyebrow="Listado"
              title="Roles disponibles"
              description={`${roles.length} roles visibles y ${permissionCount} permisos versionados.`}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar por nombre o descripcion"
              items={roles}
              selectedId={selectedId}
              getId={(item) => item.id}
              renderTitle={(item) => (
                <>
                  <strong>{item.name}</strong>
                  <StatusBadge value={item.isSystem ? 'system' : 'custom'} />
                </>
              )}
              renderDescription={(item) => (
                <>
                  <p>{item.description ?? 'Sin descripcion'}</p>
                  <p>{item.permissionIds.length} permisos asignados</p>
                </>
              )}
              renderMeta={(item) => (
                <>
                  <span>{joinValues(item.permissions.slice(0, 2).map((permission) => permission.key), 'Sin permisos')}</span>
                  <span>{formatDateTime(item.updatedAt)}</span>
                </>
              )}
              emptyTitle="No hay roles visibles"
              emptyDescription="Todavia no hay roles que coincidan con el filtro actual."
              loading={rolesQuery.isPending}
              error={rolesQuery.error instanceof Error ? rolesQuery.error.message : null}
              onRefresh={() => void refreshRoles()}
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
              title={mode === 'create' ? 'Crear rol' : 'Editar rol'}
              description={
                mode === 'create'
                  ? 'Define el paquete de acceso y su superficie de permisos desde la matriz canonica.'
                  : 'Mantiene sincronizado el rol con el catalogo real de permisos del backend nuevo.'
              }
            />

            {feedback ? <InlineMessage tone={feedback.tone}>{feedback.message}</InlineMessage> : null}
            {!hasCompanyWideAccess ? (
              <InlineMessage tone="info">
                La matriz de roles es un recurso global de empresa. Desde una sesion acotada por sede solo puedes revisarla, no modificarla.
              </InlineMessage>
            ) : null}

            <form className="editor-form" onSubmit={handleSubmit}>
              <div className="field-grid">
                <Field label="Nombre" htmlFor="role-name">
                  <TextInput
                    id="role-name"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    disabled={!canCreate && !canEdit}
                    required
                  />
                </Field>

                <Field label="Descripcion" htmlFor="role-description">
                  <TextAreaInput
                    id="role-description"
                    rows={3}
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    disabled={!canCreate && !canEdit}
                  />
                </Field>
              </div>

              <CheckboxField
                checked={form.isSystem}
                onChange={(checked) => setForm((current) => ({ ...current, isSystem: checked }))}
                label="Rol de sistema"
                hint="Marca esta opcion cuando el rol debe mantenerse como base operativa de la empresa."
                disabled={!canCreate && !canEdit}
              />

              <div className="permissions-editor">
                <SectionHeading
                  eyebrow="Matriz"
                  title="Permisos del rol"
                  description={`${form.permissionIds.length} permisos seleccionados en esta version.`}
                />

                <div className="permission-module-grid">
                  {Object.entries(permissionMatrix).map(([moduleKey, items]) => {
                    const allSelected = items.every((item) => form.permissionIds.includes(item.id));
                    return (
                      <article key={moduleKey} className="permission-module-card">
                        <div className="permission-module-card__header">
                          <div>
                            <strong>{moduleKey}</strong>
                            <p>{items.length} acciones disponibles</p>
                          </div>
                          <ActionButton variant="secondary" className="small-button" onClick={() => toggleModule(moduleKey)}>
                            {allSelected ? 'Quitar modulo' : 'Tomar modulo'}
                          </ActionButton>
                        </div>

                        <div className="permission-chip-grid">
                          {items.map((item) => {
                            const isSelected = form.permissionIds.includes(item.id);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                className={`permission-chip ${isSelected ? 'is-selected' : ''}`}
                                onClick={() => togglePermission(item.id)}
                                disabled={!canCreate && !canEdit}
                              >
                                <strong>{item.actionKey}</strong>
                                <span>{item.description}</span>
                              </button>
                            );
                          })}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>

              {selectedPermissionKeys.length ? (
                <div className="detail-chip-row wrap-row">
                  {selectedPermissionKeys.map((permissionKey) => (
                    <StatusBadge key={permissionKey} value={permissionKey} />
                  ))}
                </div>
              ) : null}

              {canCreate || canEdit ? (
                <div className="form-actions-row">
                  <ActionButton type="submit" disabled={isSaving || (mode === 'edit' && !selectedRole)}>
                    <Save size={16} />
                    {isSaving ? 'Guardando...' : mode === 'create' ? 'Crear rol' : 'Guardar rol'}
                  </ActionButton>
                  {mode === 'create' && roles.length ? (
                    <ActionButton
                      variant="secondary"
                      onClick={() => {
                        const first = roles[0];
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
                <InlineMessage tone="info">Tu sesion puede ver roles, pero no modificar su configuracion.</InlineMessage>
              )}
            </form>
          </Panel>
        </div>
      </div>
    </PermissionGuard>
  );
}

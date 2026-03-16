import type {
  BranchRecord,
  CreateUserInput,
  EnvelopeResponse,
  PaginatedResponse,
  ResetUserPasswordInput,
  ResetUserPasswordResponse,
  RoleRecord,
  UpdateUserInput,
  UserManagementRecord,
  UserRoleAssignmentInput,
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
  TextInput,
} from '@studiocore/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Plus, Save, ShieldPlus, UserCheck, UserX } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EntitySelectionList } from '../components/EntitySelectionList';
import { PermissionGuard } from '../components/PermissionGuard';
import { useApiClient, useAuth } from '../lib/auth';
import { toNullableNumber, toNullableString, toOptionalNumber, toOptionalString } from '../lib/forms';
import { formatDateTime, joinValues, shortText } from '../lib/format';

type AssignmentFormState = {
  roleId: string;
  branchId: string;
};

type UserFormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  defaultBranchId: string;
  roleAssignments: AssignmentFormState[];
};

const emptyAssignment: AssignmentFormState = {
  roleId: '',
  branchId: '',
};

const emptyForm: UserFormState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  defaultBranchId: '',
  roleAssignments: [{ ...emptyAssignment }],
};

function toFormState(user?: UserManagementRecord | null): UserFormState {
  if (!user) {
    return emptyForm;
  }

  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    password: '',
    phone: user.phone ?? '',
    defaultBranchId: user.defaultBranchId ? String(user.defaultBranchId) : '',
    roleAssignments: user.roleAssignments.length
      ? user.roleAssignments.map((assignment) => ({
          roleId: String(assignment.roleId),
          branchId: assignment.branchId ? String(assignment.branchId) : '',
        }))
      : [{ ...emptyAssignment }],
  };
}

function buildAssignments(assignments: AssignmentFormState[]) {
  const result: UserRoleAssignmentInput[] = [];
  const seen = new Set<string>();

  for (const assignment of assignments) {
    const roleId = toOptionalNumber(assignment.roleId);
    if (!roleId) {
      continue;
    }

    const branchId = toNullableNumber(assignment.branchId);
    const key = `${roleId}:${branchId ?? 'global'}`;
    if (seen.has(key)) {
      throw new Error('No repitas la misma combinacion de rol y sede.');
    }

    seen.add(key);
    result.push({ roleId, branchId });
  }

  if (!result.length) {
    throw new Error('Agrega al menos una asignacion de rol.');
  }

  return result;
}

export function UsersPage() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { hasPermission, session } = useAuth();
  const hasCompanyWideAccess = session?.user.hasCompanyWideAccess ?? false;
  const activeBranchId = session?.user.activeBranchId ?? null;
  const canCreate = hasPermission('users.create');
  const canEdit = hasPermission('users.edit');
  const canActivate = hasPermission('users.activate');
  const canDeactivate = hasPermission('users.deactivate');
  const canResetPassword = hasPermission('users.reset_password');
  const canViewRoles = hasPermission('roles.view');
  const canViewBranches = hasPermission('branches.view');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('edit');
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const usersQuery = useQuery({
    queryKey: ['users-management', search],
    queryFn: () => {
      const params = new URLSearchParams({ page: '1', pageSize: '100' });
      if (search.trim()) {
        params.set('search', search.trim());
      }
      return api.get<PaginatedResponse<UserManagementRecord>>(`/users?${params.toString()}`);
    },
  });

  const rolesQuery = useQuery({
    queryKey: ['roles-for-users'],
    queryFn: () => api.get<PaginatedResponse<RoleRecord>>('/roles?page=1&pageSize=100'),
    enabled: canViewRoles,
  });

  const branchesQuery = useQuery({
    queryKey: ['branches-for-users'],
    queryFn: () => api.get<PaginatedResponse<BranchRecord>>('/branches?page=1&pageSize=100'),
    enabled: canViewBranches,
  });

  const users = usersQuery.data?.items ?? [];
  const roles = rolesQuery.data?.items ?? [];
  const branches = branchesQuery.data?.items ?? [];
  const selectedUser = users.find((user) => user.id === selectedId) ?? null;
  const branchOptions = useMemo(() => {
    const visibleBranches = hasCompanyWideAccess
      ? branches
      : branches.filter((branch) => branch.id === activeBranchId);

    const options = visibleBranches.map((branch) => ({
      value: String(branch.id),
      label: `${branch.name} (${branch.code})`,
    }));

    if (!hasCompanyWideAccess && activeBranchId && !options.some((option) => option.value === String(activeBranchId))) {
      options.unshift({
        value: String(activeBranchId),
        label: `Sede activa #${activeBranchId}`,
      });
    }

    return options;
  }, [activeBranchId, branches, hasCompanyWideAccess]);

  function applyScopedFormState(nextForm: UserFormState) {
    if (hasCompanyWideAccess || !activeBranchId) {
      return nextForm;
    }

    return {
      ...nextForm,
      defaultBranchId: String(activeBranchId),
      roleAssignments: nextForm.roleAssignments.length
        ? nextForm.roleAssignments.map((assignment) => ({
            ...assignment,
            branchId: String(activeBranchId),
          }))
        : [{ ...emptyAssignment, branchId: String(activeBranchId) }],
    };
  }

  useEffect(() => {
    if (mode === 'create') {
      return;
    }

    if (!users.length) {
      setSelectedId(null);
      setForm(applyScopedFormState(emptyForm));
      return;
    }

    if (!selectedId || !users.some((user) => user.id === selectedId)) {
      const first = users[0];
      setSelectedId(first.id);
      setForm(applyScopedFormState(toFormState(first)));
      return;
    }

    setForm(applyScopedFormState(toFormState(selectedUser)));
  }, [activeBranchId, hasCompanyWideAccess, mode, selectedId, selectedUser, users]);

  const scopeIssues = useMemo(() => {
    const issues: string[] = [];

    if ((canCreate || canEdit) && !canViewRoles) {
      issues.push('Falta `roles.view` para poblar las opciones de rol.');
    }

    if ((canCreate || canEdit) && hasCompanyWideAccess && !canViewBranches) {
      issues.push('Falta `branches.view` para poblar las opciones de sede.');
    }

    return issues;
  }, [canCreate, canEdit, canViewBranches, canViewRoles, hasCompanyWideAccess]);

  async function refreshUsers() {
    setFeedback(null);
    const tasks: Array<Promise<unknown>> = [usersQuery.refetch()];

    if (canViewRoles) {
      tasks.push(rolesQuery.refetch());
    }

    if (canViewBranches) {
      tasks.push(branchesQuery.refetch());
    }

    await Promise.all(tasks);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsSaving(true);

    try {
      const roleAssignments = buildAssignments(form.roleAssignments);

      if (mode === 'create') {
        const payload: CreateUserInput = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          password: form.password.trim(),
          ...(toOptionalString(form.phone) ? { phone: toOptionalString(form.phone) } : {}),
          ...(toOptionalNumber(form.defaultBranchId) ? { defaultBranchId: toOptionalNumber(form.defaultBranchId) } : {}),
          roleAssignments,
        };
        const response = await api.post<EnvelopeResponse<UserManagementRecord>>('/users', payload);
        await queryClient.invalidateQueries({ queryKey: ['users-management'] });
        setMode('edit');
        setSelectedId(response.data.id);
        setForm(applyScopedFormState(toFormState(response.data)));
        setFeedback({ tone: 'success', message: `Usuario #${response.data.id} creado correctamente.` });
      } else if (selectedUser) {
        const payload: UpdateUserInput = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: toNullableString(form.phone),
          defaultBranchId: toNullableNumber(form.defaultBranchId),
          roleAssignments,
        };
        const response = await api.patch<EnvelopeResponse<UserManagementRecord>>(`/users/${selectedUser.id}`, payload);
        await queryClient.invalidateQueries({ queryKey: ['users-management'] });
        setForm(applyScopedFormState(toFormState(response.data)));
        setFeedback({ tone: 'success', message: `Usuario #${response.data.id} actualizado.` });
      }
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'No fue posible guardar el usuario.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange(nextStatus: 'activate' | 'deactivate') {
    if (!selectedUser) {
      return;
    }

    setFeedback(null);
    setIsChangingStatus(true);

    try {
      const path = `/users/${selectedUser.id}/${nextStatus}`;
      const response = await api.post<EnvelopeResponse<UserManagementRecord>>(path, {});
      await queryClient.invalidateQueries({ queryKey: ['users-management'] });
      setForm(applyScopedFormState(toFormState(response.data)));
      setFeedback({
        tone: 'success',
        message: `Usuario #${response.data.id} ${nextStatus === 'activate' ? 'activado' : 'desactivado'} correctamente.`,
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'No fue posible cambiar el estado del usuario.',
      });
    } finally {
      setIsChangingStatus(false);
    }
  }

  async function handleResetPassword() {
    if (!selectedUser) {
      return;
    }

    setFeedback(null);
    setIsResettingPassword(true);

    try {
      const payload: ResetUserPasswordInput = {};
      const response = await api.post<ResetUserPasswordResponse>(`/users/${selectedUser.id}/reset-password`, payload);
      await queryClient.invalidateQueries({ queryKey: ['users-management'] });
      setForm(applyScopedFormState(toFormState(response.data)));
      setFeedback({
        tone: 'success',
        message: `Password temporal generado: ${response.temporaryPassword}`,
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'No fue posible resetear el password.',
      });
    } finally {
      setIsResettingPassword(false);
    }
  }

  function startCreate() {
    setMode('create');
    setSelectedId(null);
    setForm(applyScopedFormState(emptyForm));
    setFeedback(null);
  }

  function updateAssignment(index: number, key: keyof AssignmentFormState, value: string) {
    setForm((current) => ({
      ...current,
      roleAssignments: current.roleAssignments.map((assignment, assignmentIndex) =>
        assignmentIndex === index ? { ...assignment, [key]: value } : assignment,
      ),
    }));
  }

  function removeAssignment(index: number) {
    setForm((current) => ({
      ...current,
      roleAssignments:
        current.roleAssignments.length === 1
          ? [applyScopedFormState({ ...current, roleAssignments: [{ ...emptyAssignment }] }).roleAssignments[0]]
          : current.roleAssignments.filter((_, assignmentIndex) => assignmentIndex !== index),
    }));
  }

  function addAssignment() {
    setForm((current) => ({
      ...current,
      roleAssignments: [
        ...current.roleAssignments,
        applyScopedFormState({ ...current, roleAssignments: [{ ...emptyAssignment }] }).roleAssignments[0],
      ],
    }));
  }

  return (
    <PermissionGuard permission="users.view">
      <div className="page-stack">
        <PageHero
          eyebrow="IAM"
          title="Usuarios"
          description="Gestiona usuarios, asignaciones de rol por sede y operaciones sensibles como activacion y reseteo de password sobre el backend nuevo."
          actions={
            canCreate ? (
              <ActionButton onClick={startCreate}>
                <Plus size={16} />
                Nuevo usuario
              </ActionButton>
            ) : null
          }
        />

        <div className="workspace-grid users-workspace-grid">
          <Panel>
            <EntitySelectionList
              eyebrow="Listado"
              title="Usuarios del tenant"
              description={`${users.length} usuarios visibles en el scope actual.`}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar por nombre, apellido o email"
              items={users}
              selectedId={selectedId}
              getId={(item) => item.id}
              renderTitle={(item) => (
                <>
                  <strong>
                    {item.firstName} {item.lastName}
                  </strong>
                  <StatusBadge value={item.status} />
                </>
              )}
              renderDescription={(item) => (
                <>
                  <p>{item.email}</p>
                  <p>{joinValues(item.roles, 'Sin roles')}</p>
                </>
              )}
              renderMeta={(item) => (
                <>
                  <span>{item.hasCompanyWideAccess ? 'Empresa completa' : `Sedes: ${joinValues(item.branchIds)}`}</span>
                  <span>{formatDateTime(item.lastLoginAt)}</span>
                </>
              )}
              emptyTitle="No hay usuarios visibles"
              emptyDescription="Todavia no hay usuarios que coincidan con el filtro actual."
              loading={usersQuery.isPending}
              error={usersQuery.error instanceof Error ? usersQuery.error.message : null}
              onRefresh={() => void refreshUsers()}
              onSelect={(item) => {
                setMode('edit');
                setSelectedId(item.id);
                setForm(applyScopedFormState(toFormState(item)));
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
              title={mode === 'create' ? 'Crear usuario' : 'Editar usuario'}
              description={
                mode === 'create'
                  ? 'Prepara identidad, sede por defecto y asignaciones iniciales de rol.'
                  : 'Actualiza datos base, asignaciones y operaciones sensibles del usuario seleccionado.'
              }
            />

            {feedback ? <InlineMessage tone={feedback.tone}>{feedback.message}</InlineMessage> : null}
            {scopeIssues.length ? <InlineMessage tone="info">{scopeIssues.join(' ')}</InlineMessage> : null}
            {!hasCompanyWideAccess && activeBranchId && (canCreate || canEdit) ? (
              <InlineMessage tone="info">
                Esta sesion solo puede operar usuarios de la sede {activeBranchId}. Las asignaciones globales o de otras sedes quedan bloqueadas.
              </InlineMessage>
            ) : null}

            <form className="editor-form" onSubmit={handleSubmit}>
              <div className="field-grid two-columns">
                <Field label="Nombre" htmlFor="user-first-name">
                  <TextInput
                    id="user-first-name"
                    value={form.firstName}
                    onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                    disabled={!canCreate && !canEdit}
                    required
                  />
                </Field>

                <Field label="Apellido" htmlFor="user-last-name">
                  <TextInput
                    id="user-last-name"
                    value={form.lastName}
                    onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                    disabled={!canCreate && !canEdit}
                    required
                  />
                </Field>

                <Field label="Email" htmlFor="user-email">
                  <TextInput
                    id="user-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    disabled={!canCreate && !canEdit}
                    required
                  />
                </Field>

                <Field label="Telefono" htmlFor="user-phone">
                  <TextInput
                    id="user-phone"
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    disabled={!canCreate && !canEdit}
                  />
                </Field>

                <Field label="Sede por defecto" htmlFor="user-default-branch">
                  <SelectInput
                    id="user-default-branch"
                    value={form.defaultBranchId}
                    onChange={(event) => setForm((current) => ({ ...current, defaultBranchId: event.target.value }))}
                    disabled={(!canCreate && !canEdit) || !hasCompanyWideAccess}
                  >
                    {hasCompanyWideAccess ? <option value="">Sin sede por defecto</option> : null}
                    {branchOptions.map((branch) => (
                      <option key={branch.value} value={branch.value}>
                        {branch.label}
                      </option>
                    ))}
                  </SelectInput>
                </Field>

                <Field label="Password inicial" htmlFor="user-password" hint={mode === 'create' ? 'Minimo 8 caracteres.' : 'Solo aplica al alta inicial.'}>
                  <TextInput
                    id="user-password"
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    disabled={mode !== 'create' || (!canCreate && !canEdit)}
                    required={mode === 'create'}
                  />
                </Field>

                <Field label="Estado y seguridad">
                  <div className="detail-stack">
                    <div className="detail-chip-row wrap-row">
                      <StatusBadge value={selectedUser?.status ?? (mode === 'create' ? 'draft' : '--')} />
                      <StatusBadge value={selectedUser?.mustChangePassword ? 'must_change' : 'stable'} />
                      <StatusBadge value={selectedUser?.mfaEnabled ? 'mfa_on' : 'mfa_off'} />
                    </div>
                    <p>Ultimo login: {formatDateTime(selectedUser?.lastLoginAt)}</p>
                  </div>
                </Field>
              </div>

              <div className="assignment-editor">
                <SectionHeading
                  eyebrow="Acceso"
                  title="Asignaciones de rol"
                  description="Cada fila define un rol y, opcionalmente, la sede especifica donde aplica."
                  actions={
                    canCreate || canEdit ? (
                      <ActionButton variant="secondary" className="small-button" onClick={addAssignment}>
                        <ShieldPlus size={16} />
                        Agregar fila
                      </ActionButton>
                    ) : null
                  }
                />

                <div className="assignment-list">
                  {form.roleAssignments.map((assignment, index) => (
                    <div key={`${index}-${assignment.roleId}-${assignment.branchId}`} className="assignment-row">
                      <Field label={`Rol ${index + 1}`} htmlFor={`assignment-role-${index}`}>
                        <SelectInput
                          id={`assignment-role-${index}`}
                          value={assignment.roleId}
                          onChange={(event) => updateAssignment(index, 'roleId', event.target.value)}
                          disabled={!canCreate && !canEdit}
                        >
                          <option value="">Selecciona un rol</option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </SelectInput>
                      </Field>

                      <Field label="Sede" htmlFor={`assignment-branch-${index}`}>
                        <SelectInput
                          id={`assignment-branch-${index}`}
                          value={assignment.branchId}
                          onChange={(event) => updateAssignment(index, 'branchId', event.target.value)}
                          disabled={(!canCreate && !canEdit) || !hasCompanyWideAccess}
                        >
                          {hasCompanyWideAccess ? <option value="">Global de empresa</option> : null}
                          {branchOptions.map((branch) => (
                            <option key={branch.value} value={branch.value}>
                              {branch.label}
                            </option>
                          ))}
                        </SelectInput>
                      </Field>

                      {canCreate || canEdit ? (
                        <ActionButton variant="secondary" className="small-button assignment-row__remove" onClick={() => removeAssignment(index)}>
                          Quitar
                        </ActionButton>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              {canCreate || canEdit ? (
                <div className="form-actions-row">
                  <ActionButton type="submit" disabled={isSaving || (mode === 'edit' && !selectedUser)}>
                    <Save size={16} />
                    {isSaving ? 'Guardando...' : mode === 'create' ? 'Crear usuario' : 'Guardar usuario'}
                  </ActionButton>
                  {mode === 'create' && users.length ? (
                    <ActionButton
                      variant="secondary"
                        onClick={() => {
                          const first = users[0];
                          setMode('edit');
                          setSelectedId(first.id);
                          setForm(applyScopedFormState(toFormState(first)));
                          setFeedback(null);
                        }}
                    >
                      Cancelar
                    </ActionButton>
                  ) : null}
                </div>
              ) : (
                <InlineMessage tone="info">Tu sesion puede consultar usuarios, pero no editar su configuracion.</InlineMessage>
              )}

              {mode === 'edit' && selectedUser ? (
                <div className="detail-actions-grid">
                  {canActivate ? (
                    <ActionButton
                      variant="secondary"
                      onClick={() => void handleStatusChange('activate')}
                      disabled={isChangingStatus || selectedUser.status === 'active'}
                    >
                      <UserCheck size={16} />
                      Activar
                    </ActionButton>
                  ) : null}
                  {canDeactivate ? (
                    <ActionButton
                      variant="secondary"
                      onClick={() => void handleStatusChange('deactivate')}
                      disabled={isChangingStatus || selectedUser.status === 'inactive'}
                    >
                      <UserX size={16} />
                      Desactivar
                    </ActionButton>
                  ) : null}
                  {canResetPassword ? (
                    <ActionButton variant="secondary" onClick={() => void handleResetPassword()} disabled={isResettingPassword}>
                      <KeyRound size={16} />
                      {isResettingPassword ? 'Generando...' : 'Password temporal'}
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

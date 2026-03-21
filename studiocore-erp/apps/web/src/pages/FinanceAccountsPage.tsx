import type {
  FinancialAccountRecord,
  CreateFinancialAccountInput,
  UpdateFinancialAccountInput,
  EnvelopeResponse,
  PaginatedResponse,
} from '@studiocore/contracts';
import { ActionButton, Field, InlineMessage, PageHero, Panel, SectionHeading, StatusBadge, TextInput, SelectInput } from '@studiocore/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Save, Landmark } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EntitySelectionList } from '../components/EntitySelectionList';
import { PermissionGuard } from '../components/PermissionGuard';
import { useApiClient, useAuth } from '../lib/auth';
import { toOptionalString } from '../lib/forms';
import { formatDateTime, shortText, formatCurrency } from '../lib/format';

type AccountFormState = {
  name: string;
  type: string;
  currency: string;
  bankName: string;
  accountNumber: string;
  notes: string;
};

const emptyForm: AccountFormState = {
  name: '',
  type: 'bank',
  currency: 'COP',
  bankName: '',
  accountNumber: '',
  notes: '',
};

function toFormState(account?: FinancialAccountRecord | null): AccountFormState {
  if (!account) {
    return emptyForm;
  }

  return {
    name: account.name,
    type: account.type,
    currency: account.currency,
    bankName: account.bankName ?? '',
    accountNumber: account.accountNumber ?? '',
    notes: account.notes ?? '',
  };
}

export function FinanceAccountsPage() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('finance.create');
  const canEdit = hasPermission('finance.edit');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('edit');
  const [form, setForm] = useState<AccountFormState>(emptyForm);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const accountsQuery = useQuery({
    queryKey: ['finance-accounts', search],
    queryFn: () => {
      const params = new URLSearchParams({ page: '1', pageSize: '100' });
      if (search.trim()) {
        params.set('search', search.trim());
      }
      return api.get<PaginatedResponse<FinancialAccountRecord>>(`/finance/accounts?${params.toString()}`);
    },
  });

  const allAccounts = accountsQuery.data?.items ?? [];
  const selectedAccount = allAccounts.find((account) => account.id === selectedId) ?? null;

  useEffect(() => {
    if (mode === 'create') {
      return;
    }

    if (!allAccounts.length) {
      setSelectedId(null);
      setForm(emptyForm);
      return;
    }

    if (!selectedId || !allAccounts.some((account) => account.id === selectedId)) {
      const first = allAccounts[0];
      setSelectedId(first.id);
      setForm(toFormState(first));
      return;
    }

    setForm(toFormState(selectedAccount));
  }, [allAccounts, mode, selectedAccount, selectedId]);

  const totalHint = useMemo(() => `${allAccounts.length} cuentas configuradas para el tenant activo.`, [allAccounts.length]);

  async function refreshAccounts() {
    setFeedback(null);
    await accountsQuery.refetch();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsSaving(true);

    try {
      if (mode === 'create') {
        const payload: CreateFinancialAccountInput = {
          name: form.name.trim(),
          type: form.type as any,
          currency: form.currency,
          ...(toOptionalString(form.bankName) ? { bankName: toOptionalString(form.bankName) } : {}),
          ...(toOptionalString(form.accountNumber) ? { accountNumber: toOptionalString(form.accountNumber) } : {}),
          ...(toOptionalString(form.notes) ? { notes: toOptionalString(form.notes) } : {}),
        };
        const response = await api.post<EnvelopeResponse<FinancialAccountRecord>>('/finance/accounts', payload);
        await queryClient.invalidateQueries({ queryKey: ['finance-accounts'] });
        setMode('edit');
        setSelectedId(response.data.id);
        setForm(toFormState(response.data));
        setFeedback({ tone: 'success', message: `Cuenta #${response.data.id} creada correctamente.` });
      } else if (selectedAccount && canEdit) {
        const payload: UpdateFinancialAccountInput = {
          name: form.name.trim(),
          type: form.type as any,
          currency: form.currency,
          bankName: toOptionalString(form.bankName) ?? null,
          accountNumber: toOptionalString(form.accountNumber) ?? null,
          notes: toOptionalString(form.notes) ?? null,
        };
        const response = await api.patch<EnvelopeResponse<FinancialAccountRecord>>(`/finance/accounts/${selectedAccount.id}`, payload);
        await queryClient.invalidateQueries({ queryKey: ['finance-accounts'] });
        await queryClient.invalidateQueries({ queryKey: ['finance-report-summary'] });
        setMode('edit');
        setSelectedId(response.data.id);
        setForm(toFormState(response.data));
        setFeedback({ tone: 'success', message: `Cuenta #${response.data.id} actualizada correctamente.` });
      }
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'No fue posible guardar la cuenta.',
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
    <PermissionGuard permission="finance.view">
      <div className="page-stack">
        <PageHero
          eyebrow="Finanzas"
          title="Cuentas"
          description="Gestiona las cuentas bancarias, cajas y plataformas de pago disponibles para la operacion."
          actions={
            canCreate ? (
              <ActionButton onClick={startCreate}>
                <Plus size={16} />
                Nueva cuenta
              </ActionButton>
            ) : null
          }
        />

        <div className="workspace-grid">
          <Panel>
            <EntitySelectionList
              eyebrow="Listado"
              title="Cuentas activas"
              description={totalHint}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar por nombre, banco o numero"
              items={allAccounts}
              selectedId={selectedId}
              getId={(item) => item.id}
              renderTitle={(item) => (
                <>
                  <strong>{item.name}</strong>
                  <StatusBadge value={item.type} />
                </>
              )}
              renderDescription={(item) => (
                <>
                  <p>{item.bankName || 'Caja/Plataforma'}</p>
                  <p>{formatCurrency(Number(item.balance), item.currency)}</p>
                </>
              )}
              renderMeta={(item) => (
                <>
                  <span>{item.accountNumber || '--'}</span>
                  <span>{formatDateTime(item.updatedAt)}</span>
                </>
              )}
              emptyTitle="No hay cuentas visibles"
              emptyDescription="Todavia no hay cuentas para esta empresa o para el filtro actual."
              loading={accountsQuery.isPending}
              error={accountsQuery.error instanceof Error ? accountsQuery.error.message : null}
              onRefresh={() => void refreshAccounts()}
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
              title={mode === 'create' ? 'Crear cuenta' : 'Detalle de cuenta'}
              description={
                mode === 'create'
                  ? 'Define los datos de la nueva cuenta bancaria o de efectivo.'
                  : 'Consulta la informacion técnica y el balance actual de la cuenta.'
              }
            />

            {feedback ? <InlineMessage tone={feedback.tone}>{feedback.message}</InlineMessage> : null}

            <form className="editor-form" onSubmit={handleSubmit}>
              <div className="field-grid two-columns">
                <Field label="Nombre descriptivo" htmlFor="acc-name">
                  <TextInput
                    id="acc-name"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    disabled={mode === 'edit' && !canEdit}
                    required
                  />
                </Field>

                <Field label="Tipo de cuenta" htmlFor="acc-type">
                  <SelectInput
                    id="acc-type"
                    value={form.type}
                    onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                    disabled={mode === 'edit' && !canEdit}
                    required
                  >
                    <option value="bank">Banco</option>
                    <option value="cash">Efectivo / Caja</option>
                    <option value="platform">Plataforma</option>
                    <option value="other">Otro</option>
                  </SelectInput>
                </Field>

                <Field label="Moneda" htmlFor="acc-currency">
                  <SelectInput
                    id="acc-currency"
                    value={form.currency}
                    onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))}
                    disabled={mode === 'edit' && !canEdit}
                    required
                  >
                    <option value="COP">Peso Colombiano (COP)</option>
                    <option value="USD">Dolar Americano (USD)</option>
                  </SelectInput>
                </Field>

                <Field label="Banco / Entidad" htmlFor="acc-bank">
                  <TextInput
                    id="acc-bank"
                    value={form.bankName}
                    onChange={(event) => setForm((current) => ({ ...current, bankName: event.target.value }))}
                    disabled={mode === 'edit' && !canEdit}
                  />
                </Field>

                <Field label="Numero de cuenta" htmlFor="acc-number">
                  <TextInput
                    id="acc-number"
                    value={form.accountNumber}
                    onChange={(event) => setForm((current) => ({ ...current, accountNumber: event.target.value }))}
                    disabled={mode === 'edit' && !canEdit}
                  />
                </Field>

                <Field label="Balance actual">
                  <div className="card-outline" style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Landmark size={20} className="text-accent" />
                    <div>
                      <p className="mini-label">Disponibilidad</p>
                      <strong style={{ fontSize: '1.25rem' }}>
                        {selectedAccount ? formatCurrency(Number(selectedAccount.balance), selectedAccount.currency) : '--'}
                      </strong>
                    </div>
                  </div>
                </Field>

                <div className="full-width">
                  <Field label="Notas internas" htmlFor="acc-notes">
                    <TextInput
                      id="acc-notes"
                      value={form.notes}
                      onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                      disabled={mode === 'edit' && !canEdit}
                    />
                  </Field>
                </div>
              </div>

              {mode === 'create' && canCreate ? (
                <div className="form-actions-row">
                  <ActionButton type="submit" disabled={isSaving}>
                    <Save size={16} />
                    {isSaving ? 'Creando...' : 'Crear cuenta'}
                  </ActionButton>
                  {allAccounts.length ? (
                    <ActionButton
                      variant="secondary"
                      onClick={() => {
                        const first = allAccounts[0];
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
              ) : mode === 'edit' && canEdit && selectedAccount ? (
                <div className="form-actions-row">
                  <ActionButton type="submit" disabled={isSaving}>
                    <Save size={16} />
                    {isSaving ? 'Guardando...' : 'Guardar cambios'}
                  </ActionButton>
                  <ActionButton
                    variant="secondary"
                    onClick={() => {
                      setForm(toFormState(selectedAccount));
                      setFeedback(null);
                    }}
                  >
                    Restaurar
                  </ActionButton>
                </div>
              ) : mode === 'edit' ? (
                <InlineMessage tone="info">
                  Tu sesion puede consultar esta cuenta, pero no editar sus condiciones base. El balance se actualiza automaticamente mediante transacciones.
                </InlineMessage>
              ) : null}
            </form>
          </Panel>
        </div>
      </div>
    </PermissionGuard>
  );
}

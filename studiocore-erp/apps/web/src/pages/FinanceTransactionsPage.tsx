import type {
  CreateFinancialTransactionInput,
  CreateFinancialTransferInput,
  EnvelopeResponse,
  FinancialAccountRecord,
  FinancialTransactionDetailRecord,
  FinancialTransactionRecord,
  PaginatedResponse,
  UpdateFinancialTransactionInput,
  VoidFinancialTransactionInput,
} from '@studiocore/contracts';
import {
  ActionButton,
  EmptyState,
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
import { ArrowLeftRight, FileBarChart2, History, Plus, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PermissionGuard } from '../components/PermissionGuard';
import { useApiClient, useAuth } from '../lib/auth';
import { formatCurrency, formatDateTime } from '../lib/format';

type TransactionMode = 'list' | 'create' | 'edit';

type TransactionFormState = {
  accountId: string;
  type: string;
  amount: string;
  transactionDate: string;
  description: string;
  destinationAccountId: string;
};

type TransactionFiltersState = {
  search: string;
  type: string;
  status: string;
  accountId: string;
  from: string;
  to: string;
};

const today = new Date().toISOString().slice(0, 10);

const emptyForm: TransactionFormState = {
  accountId: '',
  type: 'expense',
  amount: '',
  transactionDate: today,
  description: '',
  destinationAccountId: '',
};

const emptyFilters: TransactionFiltersState = {
  search: '',
  type: '',
  status: '',
  accountId: '',
  from: '',
  to: '',
};

function isTransferTransaction(transaction?: FinancialTransactionRecord | null) {
  return transaction?.relatedEntityType === 'finance_transfer';
}

function canManageTransaction(transaction?: FinancialTransactionRecord | null) {
  if (!transaction) {
    return false;
  }

  if (transaction.status !== 'posted') {
    return false;
  }

  if (!isTransferTransaction(transaction)) {
    return true;
  }

  return transaction.type === 'expense';
}

function toFormState(detail?: FinancialTransactionDetailRecord | null): TransactionFormState {
  if (!detail) {
    return emptyForm;
  }

  return {
    accountId: String(detail.isTransfer ? detail.sourceAccountId ?? '' : detail.accountId),
    type: detail.isTransfer ? 'transfer' : detail.type,
    amount: detail.amount,
    transactionDate: detail.transactionDate.slice(0, 10),
    description: detail.baseDescription,
    destinationAccountId: detail.destinationAccountId ? String(detail.destinationAccountId) : '',
  };
}

export function FinanceTransactionsPage() {
  const api = useApiClient();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('finance.create');
  const canEdit = hasPermission('finance.edit');
  const [mode, setMode] = useState<TransactionMode>('list');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<TransactionFormState>(emptyForm);
  const [filters, setFilters] = useState<TransactionFiltersState>(emptyFilters);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [showVoidForm, setShowVoidForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isVoiding, setIsVoiding] = useState(false);

  const accountsQuery = useQuery({
    queryKey: ['finance-accounts', 'list'],
    queryFn: () => api.get<PaginatedResponse<FinancialAccountRecord>>('/finance/accounts?page=1&pageSize=100'),
  });

  const transactionsQuery = useQuery({
    queryKey: ['finance-transactions', filters],
    queryFn: () => {
      const params = new URLSearchParams({ page: '1', pageSize: '100' });
      if (filters.search.trim()) {
        params.set('search', filters.search.trim());
      }
      if (filters.type) {
        params.set('type', filters.type);
      }
      if (filters.status) {
        params.set('status', filters.status);
      }
      if (filters.accountId) {
        params.set('accountId', filters.accountId);
      }
      if (filters.from) {
        params.set('from', filters.from);
      }
      if (filters.to) {
        params.set('to', filters.to);
      }
      return api.get<PaginatedResponse<FinancialTransactionRecord>>(`/finance/transactions?${params.toString()}`);
    },
  });

  const detailQuery = useQuery({
    queryKey: ['finance-transaction-detail', selectedId],
    queryFn: () => api.get<EnvelopeResponse<FinancialTransactionDetailRecord>>(`/finance/transactions/${selectedId}`),
    enabled: selectedId !== null,
  });

  const allAccounts = accountsQuery.data?.items ?? [];
  const allTransactions = transactionsQuery.data?.items ?? [];
  const selectedTransaction = allTransactions.find((transaction) => transaction.id === selectedId) ?? null;
  const selectedDetail = detailQuery.data?.data ?? null;
  const selectedTransactionCanManage = canEdit && canManageTransaction(selectedTransaction);

  useEffect(() => {
    if (mode === 'edit' && selectedDetail) {
      setForm(toFormState(selectedDetail));
    }
  }, [mode, selectedDetail]);

  function getAccountById(id: number) {
    return allAccounts.find((account) => account.id === id) ?? null;
  }

  function getAccountName(id: number) {
    return getAccountById(id)?.name ?? `Cuenta #${id}`;
  }

  function getAccountCurrency(id: number) {
    return getAccountById(id)?.currency ?? 'COP';
  }

  async function refreshFinanceData(nextSelectedId = selectedId) {
    await Promise.all([
      transactionsQuery.refetch(),
      accountsQuery.refetch(),
      queryClient.invalidateQueries({ queryKey: ['finance-report-summary'] }),
    ]);

    if (nextSelectedId !== null) {
      setSelectedId(nextSelectedId);
      await queryClient.invalidateQueries({ queryKey: ['finance-transaction-detail', nextSelectedId] });
    }
  }

  function startCreate() {
    setMode('create');
    setSelectedId(null);
    setForm(emptyForm);
    setVoidReason('');
    setShowVoidForm(false);
    setFeedback(null);
  }

  function selectTransaction(id: number) {
    setSelectedId(id);
    setShowVoidForm(false);
    if (mode === 'edit') {
      setMode('list');
    }
  }

  function startEdit(id: number) {
    setSelectedId(id);
    setShowVoidForm(false);
    setVoidReason('');
    setFeedback(null);
    setMode('edit');
  }

  function startVoid(id: number) {
    setSelectedId(id);
    setMode('list');
    setShowVoidForm(true);
    setVoidReason('');
    setFeedback(null);
  }

  function cancelEditor() {
    setMode('list');
    setShowVoidForm(false);
    setVoidReason('');
    setForm(selectedDetail ? toFormState(selectedDetail) : emptyForm);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsSaving(true);

    try {
      if (mode === 'create') {
        if (form.type === 'transfer') {
          const payload: CreateFinancialTransferInput = {
            sourceAccountId: Number(form.accountId),
            destinationAccountId: Number(form.destinationAccountId),
            amount: form.amount,
            description: form.description.trim(),
            transactionDate: form.transactionDate,
          };
          await api.post<EnvelopeResponse<{ expenseTx: FinancialTransactionRecord }>>('/finance/transfers', payload);
          await refreshFinanceData();
          setFeedback({ tone: 'success', message: 'Transferencia realizada correctamente.' });
        } else {
          const payload: CreateFinancialTransactionInput = {
            accountId: Number(form.accountId),
            type: form.type as any,
            amount: form.amount,
            description: form.description.trim(),
            transactionDate: form.transactionDate,
          };
          const response = await api.post<EnvelopeResponse<FinancialTransactionRecord>>('/finance/transactions', payload);
          await refreshFinanceData(response.data.id);
          setFeedback({ tone: 'success', message: 'Movimiento registrado correctamente.' });
        }
      } else if (mode === 'edit' && selectedId && selectedDetail) {
        const payload: UpdateFinancialTransactionInput = selectedDetail.isTransfer
          ? {
              accountId: Number(form.accountId),
              destinationAccountId: Number(form.destinationAccountId),
              amount: form.amount,
              transactionDate: form.transactionDate,
              description: form.description.trim(),
            }
          : {
              accountId: Number(form.accountId),
              type: form.type as any,
              amount: form.amount,
              transactionDate: form.transactionDate,
              description: form.description.trim(),
            };

        await api.patch<EnvelopeResponse<FinancialTransactionDetailRecord>>(`/finance/transactions/${selectedId}`, payload);
        await refreshFinanceData(selectedId);
        setFeedback({ tone: 'success', message: selectedDetail.isTransfer ? 'Transferencia actualizada correctamente.' : 'Movimiento actualizado correctamente.' });
      }

      setMode('list');
      setShowVoidForm(false);
      setVoidReason('');
      setForm(emptyForm);
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'No fue posible guardar el movimiento.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleVoid() {
    if (!selectedId) {
      return;
    }

    setFeedback(null);
    setIsVoiding(true);

    try {
      const payload: VoidFinancialTransactionInput = { reason: voidReason.trim() };
      await api.post<EnvelopeResponse<FinancialTransactionDetailRecord>>(`/finance/transactions/${selectedId}/void`, payload);
      await refreshFinanceData(selectedId);
      setShowVoidForm(false);
      setVoidReason('');
      setFeedback({ tone: 'success', message: 'Movimiento anulado correctamente.' });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'No fue posible anular el movimiento.',
      });
    } finally {
      setIsVoiding(false);
    }
  }

  return (
    <PermissionGuard permission="finance.view">
      <div className="page-stack">
        <PageHero
          eyebrow="Finanzas"
          title="Transacciones"
          description="Opera ingresos, egresos, transferencias y anulaciones controladas con impacto inmediato en balance." 
          actions={
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <ActionButton variant="secondary" onClick={() => navigate('/finance/reports')}>
                <FileBarChart2 size={16} />
                Ver reportes
              </ActionButton>
              {canCreate ? (
                <ActionButton onClick={startCreate}>
                  <Plus size={16} />
                  Nuevo movimiento
                </ActionButton>
              ) : null}
            </div>
          }
        />

        {feedback ? <InlineMessage tone={feedback.tone}>{feedback.message}</InlineMessage> : null}
        {detailQuery.error instanceof Error ? <InlineMessage tone="error">{detailQuery.error.message}</InlineMessage> : null}

        {mode !== 'list' ? (
          <Panel>
            <SectionHeading
              eyebrow="Formulario"
              title={mode === 'create' ? 'Registrar movimiento' : 'Editar movimiento'}
              description={
                mode === 'create'
                  ? 'Usa transferencias para mover saldo entre cuentas de la misma moneda.'
                  : selectedDetail?.isTransfer
                    ? 'Esta edicion actualiza simultaneamente la salida y la entrada de la transferencia.'
                    : 'Ajusta cuenta, tipo, monto, fecha o concepto sin perder auditoria.'
              }
            />

            {mode === 'edit' && detailQuery.isPending ? (
              <InlineMessage tone="info">Cargando detalle del movimiento seleccionado...</InlineMessage>
            ) : (
              <form className="editor-form" onSubmit={handleSubmit}>
                <div className="field-grid two-columns">
                  <Field label={form.type === 'transfer' ? 'Cuenta origen' : 'Cuenta afectada'} htmlFor="tx-account">
                    <SelectInput
                      id="tx-account"
                      value={form.accountId}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          accountId: event.target.value,
                          destinationAccountId: current.destinationAccountId === event.target.value ? '' : current.destinationAccountId,
                        }))
                      }
                      required
                    >
                      <option value="">Selecciona una cuenta...</option>
                      {allAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({formatCurrency(Number(account.balance), account.currency)})
                        </option>
                      ))}
                    </SelectInput>
                  </Field>

                  <Field label="Tipo" htmlFor="tx-type">
                    <SelectInput
                      id="tx-type"
                      value={form.type}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          type: event.target.value,
                          destinationAccountId: event.target.value === 'transfer' ? current.destinationAccountId : '',
                        }))
                      }
                      disabled={mode === 'edit' && selectedDetail?.isTransfer}
                      required
                    >
                      <option value="income">Ingreso (+)</option>
                      <option value="expense">Egreso (-)</option>
                      <option value="transfer">Transferencia (misma moneda)</option>
                    </SelectInput>
                  </Field>

                  {form.type === 'transfer' ? (
                    <Field label="Cuenta destino" htmlFor="tx-destination-account">
                      <SelectInput
                        id="tx-destination-account"
                        value={form.destinationAccountId}
                        onChange={(event) => setForm((current) => ({ ...current, destinationAccountId: event.target.value }))}
                        required
                      >
                        <option value="">Selecciona una cuenta destino...</option>
                        {allAccounts
                          .filter((account) => String(account.id) !== form.accountId)
                          .map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.name} ({formatCurrency(Number(account.balance), account.currency)})
                            </option>
                          ))}
                      </SelectInput>
                    </Field>
                  ) : null}

                  <Field label="Monto" htmlFor="tx-amount">
                    <TextInput
                      id="tx-amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={form.amount}
                      onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                      required
                    />
                  </Field>

                  <Field label="Fecha de transaccion" htmlFor="tx-date">
                    <TextInput
                      id="tx-date"
                      type="date"
                      value={form.transactionDate}
                      onChange={(event) => setForm((current) => ({ ...current, transactionDate: event.target.value }))}
                      required
                    />
                  </Field>

                  <div className="full-width">
                    <Field label="Concepto" htmlFor="tx-description">
                      <TextInput
                        id="tx-description"
                        value={form.description}
                        onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                        placeholder="Ej: Compra de insumos, reserva operativa, pago de proveedor..."
                        required
                      />
                    </Field>
                  </div>
                </div>

                <div className="form-actions-row">
                  <ActionButton type="submit" disabled={isSaving || !form.accountId || (form.type === 'transfer' && !form.destinationAccountId)}>
                    <Save size={16} />
                    {isSaving ? 'Guardando...' : mode === 'create' ? 'Registrar movimiento' : 'Guardar cambios'}
                  </ActionButton>
                  <ActionButton variant="secondary" onClick={cancelEditor}>
                    Cancelar
                  </ActionButton>
                </div>
              </form>
            )}
          </Panel>
        ) : null}

        <Panel>
          <SectionHeading
            eyebrow="Filtro"
            title="Historial operativo"
            description="Combina busqueda, cuenta, rango y estado para revisar movimientos activos o anulados."
          />

          <div className="field-grid two-columns">
            <Field label="Buscar" htmlFor="finance-search">
              <TextInput
                id="finance-search"
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Concepto o referencia visible"
              />
            </Field>

            <Field label="Cuenta" htmlFor="finance-account-filter">
              <SelectInput
                id="finance-account-filter"
                value={filters.accountId}
                onChange={(event) => setFilters((current) => ({ ...current, accountId: event.target.value }))}
              >
                <option value="">Todas las cuentas</option>
                {allAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <Field label="Tipo" htmlFor="finance-type-filter">
              <SelectInput
                id="finance-type-filter"
                value={filters.type}
                onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}
              >
                <option value="">Todos</option>
                <option value="income">Ingreso</option>
                <option value="expense">Egreso</option>
              </SelectInput>
            </Field>

            <Field label="Estado" htmlFor="finance-status-filter">
              <SelectInput
                id="finance-status-filter"
                value={filters.status}
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              >
                <option value="">Todos</option>
                <option value="posted">Posteado</option>
                <option value="voided">Anulado</option>
              </SelectInput>
            </Field>

            <Field label="Desde" htmlFor="finance-from-filter">
              <TextInput
                id="finance-from-filter"
                type="date"
                value={filters.from}
                onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
              />
            </Field>

            <Field label="Hasta" htmlFor="finance-to-filter">
              <TextInput
                id="finance-to-filter"
                type="date"
                value={filters.to}
                onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
              />
            </Field>
          </div>

          <div className="form-actions-row">
            <ActionButton variant="secondary" onClick={() => setFilters(emptyFilters)}>
              Limpiar filtros
            </ActionButton>
            <ActionButton variant="secondary" onClick={() => void refreshFinanceData()}>
              <History size={16} className={transactionsQuery.isFetching ? 'spin' : ''} />
              Recargar historial
            </ActionButton>
          </div>
        </Panel>

        <Panel>
          <SectionHeading
            eyebrow="Listado"
            title="Movimientos registrados"
            description={`${allTransactions.length} fila(s) visibles con el filtro actual. Las transferencias se gestionan desde la salida origen.`}
          />

          {transactionsQuery.isPending ? (
            <InlineMessage tone="info">Cargando historial financiero...</InlineMessage>
          ) : allTransactions.length ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Cuenta</th>
                    <th>Concepto</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th className="text-right">Monto</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {allTransactions.map((transaction) => {
                    const transactionCanManage = canEdit && canManageTransaction(transaction);
                    const transferManagedElsewhere = isTransferTransaction(transaction) && transaction.type === 'income';

                    return (
                      <tr
                        key={transaction.id}
                        onClick={() => selectTransaction(transaction.id)}
                        style={{
                          cursor: 'pointer',
                          background: selectedId === transaction.id ? 'rgba(182, 90, 58, 0.08)' : undefined,
                          opacity: transaction.status === 'voided' ? 0.76 : 1,
                        }}
                      >
                        <td>{formatDateTime(transaction.transactionDate, { dateOnly: true })}</td>
                        <td>{getAccountName(transaction.accountId)}</td>
                        <td>{transaction.description}</td>
                        <td>
                          <StatusBadge value={isTransferTransaction(transaction) ? 'transfer' : transaction.type} />
                        </td>
                        <td><StatusBadge value={transaction.status} /></td>
                        <td className={`text-right ${transaction.type === 'expense' ? 'text-error' : 'text-success'}`} style={{ fontWeight: 'bold' }}>
                          {transaction.type === 'expense' ? '-' : '+'}
                          {formatCurrency(Number(transaction.amount), getAccountCurrency(transaction.accountId))}
                        </td>
                        <td className="text-right">
                          <div style={{ display: 'inline-flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {transactionCanManage ? (
                              <>
                                <ActionButton
                                  variant="secondary"
                                  className="small-button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    startEdit(transaction.id);
                                  }}
                                >
                                  Editar
                                </ActionButton>
                                <ActionButton
                                  variant="danger"
                                  className="small-button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    startVoid(transaction.id);
                                  }}
                                >
                                  Anular
                                </ActionButton>
                              </>
                            ) : transferManagedElsewhere ? (
                              <span className="mini-label">Gestion desde origen</span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Sin movimientos visibles" description="Ajusta los filtros o registra el primer movimiento para esta sede o empresa." compact />
          )}
        </Panel>

        {selectedDetail ? (
          <Panel>
            <SectionHeading
              eyebrow="Detalle"
              title={selectedDetail.baseDescription}
              description={selectedDetail.isTransfer ? 'Transferencia interna entre cuentas, gestionada desde la salida origen.' : 'Revision puntual del movimiento seleccionado.'}
              actions={
                selectedTransactionCanManage && !showVoidForm ? (
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <ActionButton variant="secondary" onClick={() => startEdit(selectedDetail.id)}>
                      Editar
                    </ActionButton>
                    <ActionButton variant="danger" onClick={() => startVoid(selectedDetail.id)}>
                      Anular
                    </ActionButton>
                  </div>
                ) : undefined
              }
            />

            <div className="two-column-grid">
              <div className="card-outline">
                <span className="mini-label">Cuenta principal</span>
                <strong>{selectedDetail.isTransfer ? selectedDetail.sourceAccountName : selectedDetail.accountName}</strong>
                <p>{selectedDetail.accountCurrency}</p>
              </div>
              <div className="card-outline">
                <span className="mini-label">Monto</span>
                <strong>
                  {selectedDetail.type === 'expense' ? '-' : '+'}
                  {formatCurrency(Number(selectedDetail.amount), selectedDetail.accountCurrency)}
                </strong>
                <p>{formatDateTime(selectedDetail.transactionDate)}</p>
              </div>
              <div className="card-outline">
                <span className="mini-label">Tipo / Estado</span>
                <strong>{selectedDetail.isTransfer ? 'Transferencia' : selectedDetail.type}</strong>
                <p>{selectedDetail.status}</p>
              </div>
              <div className="card-outline">
                <span className="mini-label">Destino / Contraparte</span>
                <strong>{selectedDetail.destinationAccountName ?? 'No aplica'}</strong>
                <p>{selectedDetail.isTransfer ? 'Se sincroniza con la cuenta destino.' : 'Movimiento individual.'}</p>
              </div>
            </div>

            {selectedDetail.status === 'voided' ? (
              <InlineMessage tone="info">
                Movimiento anulado. Motivo: {selectedDetail.voidReason ?? 'Sin motivo registrado'}.
              </InlineMessage>
            ) : null}

            {isTransferTransaction(selectedTransaction) && selectedTransaction?.type === 'income' ? (
              <InlineMessage tone="info">Esta fila corresponde a la entrada destino de una transferencia. La edicion y anulacion se gestionan desde la salida origen.</InlineMessage>
            ) : null}

            {showVoidForm && selectedTransactionCanManage ? (
              <div className="page-stack">
                <Field label="Motivo de anulacion" htmlFor="finance-void-reason" hint="La anulacion revierte el balance y queda auditada en el historial.">
                  <TextAreaInput
                    id="finance-void-reason"
                    value={voidReason}
                    onChange={(event) => setVoidReason(event.target.value)}
                    placeholder="Describe por que el movimiento debe quedar sin efecto..."
                  />
                </Field>
                <div className="form-actions-row">
                  <ActionButton variant="danger" onClick={() => void handleVoid()} disabled={isVoiding || !voidReason.trim()}>
                    {isVoiding ? 'Anulando...' : 'Confirmar anulacion'}
                  </ActionButton>
                  <ActionButton variant="secondary" onClick={() => setShowVoidForm(false)}>
                    Cancelar
                  </ActionButton>
                </div>
              </div>
            ) : null}
          </Panel>
        ) : null}
      </div>
    </PermissionGuard>
  );
}

import type {
  FinancialAccountRecord,
  FinancialTransactionRecord,
  CreateFinancialTransactionInput,
  CreateFinancialTransferInput,
  EnvelopeResponse,
  PaginatedResponse,
} from '@studiocore/contracts';
import { ActionButton, Field, InlineMessage, PageHero, Panel, SectionHeading, StatusBadge, TextInput, SelectInput } from '@studiocore/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Save, History, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';
import { useState } from 'react';
import { PermissionGuard } from '../components/PermissionGuard';
import { useApiClient, useAuth } from '../lib/auth';
import { toOptionalString } from '../lib/forms';
import { formatDateTime, formatCurrency } from '../lib/format';

type TransactionFormState = {
  accountId: string;
  type: string;
  amount: string;
  transactionDate: string;
  description: string;
  personId: string;
  destinationAccountId: string;
};

const emptyForm: TransactionFormState = {
  accountId: '',
  type: 'expense',
  amount: '',
  transactionDate: new Date().toISOString().split('T')[0],
  description: '',
  personId: '',
  destinationAccountId: '',
};

export function FinanceTransactionsPage() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('finance.create');
  
  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [form, setForm] = useState<TransactionFormState>(emptyForm);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const accountsQuery = useQuery({
    queryKey: ['finance-accounts', 'list'],
    queryFn: () => api.get<PaginatedResponse<FinancialAccountRecord>>('/finance/accounts?page=1&pageSize=100'),
  });

  const transactionsQuery = useQuery({
    queryKey: ['finance-transactions'],
    queryFn: () => api.get<PaginatedResponse<FinancialTransactionRecord>>('/finance/transactions?page=1&pageSize=50'),
  });

  const allAccounts = accountsQuery.data?.items ?? [];
  const allTransactions = transactionsQuery.data?.items ?? [];

  function resetCreateForm() {
    setForm(emptyForm);
  }

  function openCreate() {
    resetCreateForm();
    setFeedback(null);
    setMode('create');
  }

  function cancelCreate() {
    resetCreateForm();
    setFeedback(null);
    setMode('list');
  }

  function getAccountById(id: number) {
    return allAccounts.find((account) => account.id === id) ?? null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsSaving(true);

    try {
      if (form.type === 'transfer') {
        const payload: CreateFinancialTransferInput = {
          sourceAccountId: Number(form.accountId),
          destinationAccountId: Number(form.destinationAccountId),
          amount: form.amount,
          description: form.description.trim(),
          transactionDate: form.transactionDate,
        };
        await api.post<EnvelopeResponse<any>>('/finance/transfers', payload);
      } else {
        const payload: CreateFinancialTransactionInput = {
          accountId: Number(form.accountId),
          type: form.type as any,
          amount: form.amount,
          description: form.description.trim(),
          transactionDate: form.transactionDate,
          ...(toOptionalString(form.personId) ? { personId: Number(form.personId) } : {}),
        };
        await api.post<EnvelopeResponse<FinancialTransactionRecord>>('/finance/transactions', payload);
      }

      await queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['finance-accounts'] });
      
      cancelCreate();
      setFeedback({ tone: 'success', message: form.type === 'transfer' ? 'Transferencia realizada correctamente.' : 'Transaccion registrada correctamente.' });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'No fue posible registrar la transaccion.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  function getAccountName(id: number) {
    return getAccountById(id)?.name ?? `Cuenta #${id}`;
  }

  function getAccountCurrency(id: number) {
    return getAccountById(id)?.currency ?? 'COP';
  }

  function getTransactionIcon(type: string) {
    switch (type) {
      case 'income': return <TrendingUp size={16} className="text-success" />;
      case 'expense': return <TrendingDown size={16} className="text-error" />;
      case 'transfer': return <ArrowLeftRight size={16} className="text-accent" />;
      default: return <History size={16} />;
    }
  }

  return (
    <PermissionGuard permission="finance.view">
      <div className="page-stack">
        <PageHero
          eyebrow="Finanzas"
          title="Transacciones"
          description="Historial consolidado de movimientos financieros y registro de nuevos ingresos o egresos."
          actions={
            canCreate && mode === 'list' ? (
              <ActionButton onClick={openCreate}>
                <Plus size={16} />
                Nuevo movimiento
              </ActionButton>
            ) : mode === 'create' ? (
              <ActionButton variant="secondary" onClick={cancelCreate}>
                Volver al listado
              </ActionButton>
            ) : null
          }
        />

        {feedback ? <InlineMessage tone={feedback.tone}>{feedback.message}</InlineMessage> : null}

        {mode === 'create' ? (
          <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <Panel>
              <SectionHeading
                eyebrow="Formulario"
                title="Registrar movimiento"
                description="Asegurate de seleccionar la cuenta correcta. El impacto en el balance es inmediato tras guardar."
              />

              <form className="editor-form" onSubmit={handleSubmit}>
                <div className="field-grid two-columns">
                  <Field label="Cuenta afectada" htmlFor="tx-account">
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

                  <Field label="Tipo de movimiento" htmlFor="tx-type">
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
                      required
                    >
                      <option value="income">Ingreso (+)</option>
                      <option value="expense">Egreso (-)</option>
                      <option value="transfer">Transferencia (misma moneda)</option>
                    </SelectInput>
                  </Field>

                  {form.type === 'transfer' ? (
                    <Field label="Cuenta destino" htmlFor="tx-dest-account">
                      <SelectInput
                        id="tx-dest-account"
                        value={form.destinationAccountId}
                        onChange={(event) => setForm((current) => ({ ...current, destinationAccountId: event.target.value }))}
                        required
                      >
                        <option value="">Selecciona cuenta destino...</option>
                        {allAccounts
                          .filter((account) => account.id !== Number(form.accountId))
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
                      placeholder="0.00"
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
                    <Field label="Concepto / Descripcion" htmlFor="tx-desc">
                      <TextInput
                        id="tx-desc"
                        value={form.description}
                        onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                        placeholder="Ej: Pago de nomina, Compra de suministros..."
                        required
                      />
                    </Field>
                  </div>
                </div>

                <div className="form-actions-row">
                  <ActionButton type="submit" disabled={isSaving || !form.accountId || (form.type === 'transfer' && !form.destinationAccountId)}>
                    <Save size={16} />
                    {isSaving ? 'Guardando...' : form.type === 'transfer' ? 'Realizar transferencia' : 'Registrar movimiento'}
                  </ActionButton>
                  <ActionButton variant="secondary" onClick={cancelCreate}>
                    Cancelar
                  </ActionButton>
                </div>
              </form>
            </Panel>
          </div>
        ) : (
          <Panel>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Icono</th>
                    <th>Fecha</th>
                    <th>Cuenta</th>
                    <th>Descripcion</th>
                    <th>Tipo</th>
                    <th className="text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {allTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                        No hay transacciones registradas todavia.
                      </td>
                    </tr>
                  ) : (
                    allTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td>{getTransactionIcon(tx.type)}</td>
                        <td>{formatDateTime(tx.transactionDate, { dateOnly: true })}</td>
                        <td>{getAccountName(tx.accountId)}</td>
                        <td>{tx.description}</td>
                        <td><StatusBadge value={tx.type} /></td>
                        <td className={`text-right ${tx.type === 'expense' ? 'text-error' : 'text-success'}`} style={{ fontWeight: 'bold' }}>
                          {tx.type === 'expense' ? '-' : '+'}
                          {formatCurrency(Number(tx.amount), getAccountCurrency(tx.accountId))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
      </div>
    </PermissionGuard>
  );
}

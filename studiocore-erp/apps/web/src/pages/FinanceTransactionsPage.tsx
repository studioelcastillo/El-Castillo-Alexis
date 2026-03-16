import type {
  FinancialAccountRecord,
  FinancialTransactionRecord,
  CreateFinancialTransactionInput,
  EnvelopeResponse,
  PaginatedResponse,
} from '@studiocore/contracts';
import { ActionButton, Field, InlineMessage, PageHero, Panel, SectionHeading, StatusBadge, TextInput, SelectInput } from '@studiocore/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Save, History, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';
import { useMemo, useState } from 'react';
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
};

const emptyForm: TransactionFormState = {
  accountId: '',
  type: 'expense',
  amount: '',
  transactionDate: new Date().toISOString().split('T')[0],
  description: '',
  personId: '',
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
    queryKey: ['finance-accounts-list'],
    queryFn: () => api.get<PaginatedResponse<FinancialAccountRecord>>('/finance/accounts?page=1&pageSize=100'),
  });

  const transactionsQuery = useQuery({
    queryKey: ['finance-transactions'],
    queryFn: () => api.get<PaginatedResponse<FinancialTransactionRecord>>('/finance/transactions?page=1&pageSize=50'),
  });

  const allAccounts = accountsQuery.data?.items ?? [];
  const allTransactions = transactionsQuery.data?.items ?? [];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsSaving(true);

    try {
      const payload: CreateFinancialTransactionInput = {
        accountId: Number(form.accountId),
        type: form.type as any,
        amount: form.amount,
        description: form.description.trim(),
        transactionDate: form.transactionDate,
        ...(toOptionalString(form.personId) ? { personId: Number(form.personId) } : {}),
      };

      await api.post<EnvelopeResponse<FinancialTransactionRecord>>('/finance/transactions', payload);
      await queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['finance-accounts'] });
      
      setMode('list');
      setForm(emptyForm);
      setFeedback({ tone: 'success', message: 'Transaccion registrada correctamente.' });
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
    return allAccounts.find(a => a.id === id)?.name ?? `Cuenta #${id}`;
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
              <ActionButton onClick={() => setMode('create')}>
                <Plus size={16} />
                Nuevo movimiento
              </ActionButton>
            ) : mode === 'create' ? (
              <ActionButton variant="secondary" onClick={() => setMode('list')}>
                Volver al listado
              </ActionButton>
            ) : null
          }
        />

        {feedback ? <InlineMessage tone={feedback.tone}>{feedback.message}</InlineMessage> : null}

        {mode === 'create' ? (
          <Panel style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
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
                    onChange={(event) => setForm((current) => ({ ...current, accountId: event.target.value }))}
                    required
                  >
                    <option value="">Selecciona una cuenta...</option>
                    {allAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(Number(acc.balance), acc.currency)})</option>
                    ))}
                  </SelectInput>
                </Field>

                <Field label="Tipo de movimiento" htmlFor="tx-type">
                  <SelectInput
                    id="tx-type"
                    value={form.type}
                    onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                    required
                  >
                    <option value="income">Ingreso (+)</option>
                    <option value="expense">Egreso (-)</option>
                    <option value="transfer">Transferencia (N/A)</option>
                  </SelectInput>
                </Field>

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
                <ActionButton type="submit" disabled={isSaving || !form.accountId}>
                  <Save size={16} />
                  {isSaving ? 'Guardando...' : 'Registrar movimiento'}
                </ActionButton>
                <ActionButton variant="secondary" onClick={() => setMode('list')}>
                  Cancelar
                </ActionButton>
              </div>
            </form>
          </Panel>
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
                          {tx.type === 'expense' ? '-' : '+'}{formatCurrency(Number(tx.amount), 'COP')}
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

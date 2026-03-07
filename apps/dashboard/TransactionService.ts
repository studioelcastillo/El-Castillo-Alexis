
import { api } from './api';
import { getCurrentStudioId } from './tenant';

// ==================== TYPES ====================

export interface TransactionPayload {
  user_id: number | string;
  stdmod_id: number | string;
  std_id?: number | string;
  transtype_id: number | string;
  prod_id?: number | string | null;
  trans_date: string;
  trans_description: string;
  trans_amount: number | string;
  trans_quantity: number | string;
  trans_rtefte: boolean;
}

export interface TransactionType {
  transtype_id: number;
  transtype_name: string;
  transtype_group: string; // INGRESOS | EGRESOS
  transtype_behavior: string | null; // TIENDA | null
  transtype_value: number | null;
}

export interface Product {
  prod_id: number;
  prod_name: string;
  prod_sale_price: number;
  transaction_type?: TransactionType;
}

// ==================== SERVICE ====================

const TransactionService = {
  // --- List (filtered by group INGRESOS/EGRESOS) ---
  getTransactions: (query: string) => {
    const params = new URLSearchParams(query);
    const stdId = getCurrentStudioId();
    if (stdId && !params.has('std_id')) {
      params.set('std_id', String(stdId));
    }
    return api.get(`/transactions?${params.toString()}`);
  },

  getTransaction: (id: number | string) => {
    return api.get(`/transactions?parentfield=trans_id&parentid=${id}`);
  },

  addTransaction: (data: TransactionPayload) => {
    return api.post('/transactions', {
      ...data,
      std_id: data.std_id || getCurrentStudioId() || undefined,
    });
  },

  editTransaction: (id: number | string, data: TransactionPayload) => {
    return api.put(`/transactions/${id}`, {
      ...data,
      std_id: data.std_id || getCurrentStudioId() || undefined,
    });
  },

  deleteTransaction: (id: number | string) => {
    return api.delete(`/transactions/${id}`);
  },

  // --- Transaction Types (autocomplete) ---
  getTransactionTypes: (group: string, search: string = '') => {
    return api.get(`/transactions_types?transtype_group=${group}&transtype_name=${search}`);
  },

  // --- Products (autocomplete, for EGRESOS/TIENDA) ---
  getProducts: (query: string) => {
    const params = new URLSearchParams(query);
    const stdId = getCurrentStudioId();
    if (stdId && !params.has('std_id')) {
      params.set('std_id', String(stdId));
    }
    return api.get(`/products?${params.toString()}`);
  },

  // --- Periods (for date validation) ---
  getClosedPeriods: () => {
    return api.get('/periods?period_state=CERRADO');
  },

  // --- User contracts (for contract dropdown, returns {value, label}) ---
  getStudiosModelsByUser: (userId: number | string) => {
    const params = new URLSearchParams({ user_id: String(userId) });
    const stdId = getCurrentStudioId();
    if (stdId) {
      params.set('std_id', String(stdId));
    }
    return api.get(`/petitions/studios_models?${params.toString()}`);
  },

  // --- Export Excel URL ---
  downloadExport: (userId: number | string) => {
    return api.get('/transactions/export', {
      params: { user_id: userId },
      responseType: 'blob',
    });
  },
};

export default TransactionService;

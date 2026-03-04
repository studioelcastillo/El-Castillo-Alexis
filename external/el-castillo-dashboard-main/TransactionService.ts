
import { api } from './api';

// ==================== TYPES ====================

export interface TransactionPayload {
  user_id: number | string;
  stdmod_id: number | string;
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
    return api.get(`/transactions?${query}`);
  },

  getTransaction: (id: number | string) => {
    return api.get(`/transactions?parentfield=trans_id&parentid=${id}`);
  },

  addTransaction: (data: TransactionPayload) => {
    return api.post('/transactions', data);
  },

  editTransaction: (id: number | string, data: TransactionPayload) => {
    return api.put(`/transactions/${id}`, data);
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
    return api.get(`/products?${query}`);
  },

  // --- Periods (for date validation) ---
  getClosedPeriods: () => {
    return api.get('/periods?period_state=CERRADO');
  },

  // --- User contracts (for contract dropdown, returns {value, label}) ---
  getStudiosModelsByUser: (userId: number | string) => {
    return api.get(`/petitions/studios_models?user_id=${userId}`);
  },

  // --- Export Excel URL ---
  getExportUrl: (userId: number | string): string => {
    const userStr = localStorage.getItem('user');
    let token = '';
    if (userStr) {
      try { token = JSON.parse(userStr).access_token || ''; } catch {}
    }
    return `${api.defaults.baseURL}/transactions/export?access_token=${token}&user_id=${userId}`;
  },
};

export default TransactionService;

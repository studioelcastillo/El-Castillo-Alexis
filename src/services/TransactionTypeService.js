import { api } from '../boot/axios'

export default {
  getTransactionsTypes (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/transactions_types?' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addTransactionType (params) {
    return api.post('api/transactions_types', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getTransactionType (params) {
    return api.get('api/transactions_types?transtype_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editTransactionType (params) {
    return api.put('api/transactions_types/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  delTransactionType (params) {
    return api.delete('api/transactions_types/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
}

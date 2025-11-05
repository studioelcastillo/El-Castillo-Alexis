import { api } from '../boot/axios'

export default {
  getTransactions (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/transactions?' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addTransaction (params) {
    return api.post('api/transactions', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getTransaction (params) {
    return api.get('api/transactions?parentfield=trans_id&parentid=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editTransaction (params) {
    return api.put('api/transactions/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  delTransaction (params) {
    return api.delete('api/transactions/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
}

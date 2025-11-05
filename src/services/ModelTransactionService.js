import { api } from '../boot/axios'

export default {
  getModelsTransactions (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/models_transactions?' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addModelTransaction (params) {
    return api.post('api/models_transactions', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getModelTransaction (params) {
    return api.get('api/models_transactions?modtrans_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editModelTransaction (params) {
    return api.put('api/models_transactions/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  delModelTransaction (params) {
    return api.delete('api/models_transactions/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
}

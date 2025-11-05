import { api } from '../boot/axios'

export default {
  getModelsStreamsCustomers (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/models_streams_customers?' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addModelStreamCustomer (params) {
    return api.post('api/models_streams_customers', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getModelStreamCustomer (params) {
    return api.get('api/models_streams_customers?modstrcus_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editModelStreamCustomer (params) {
    return api.put('api/models_streams_customers/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  delModelStreamCustomer (params) {
    return api.delete('api/models_streams_customers/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
}

import { api } from '../boot/axios'

export default {
  getExchangesRates (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/exchanges_rates?' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addExchangeRate (params) {
    return api.post('api/exchanges_rates', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getExchangeRate (params) {
    return api.get('api/exchanges_rates?exrate_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editExchangeRate (params) {
    return api.put('api/exchanges_rates/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  delExchangeRate (params) {
    return api.delete('api/exchanges_rates/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
}

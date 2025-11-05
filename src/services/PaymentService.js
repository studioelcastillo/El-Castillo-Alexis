import { api } from '../boot/axios'

export default {
  getPayments (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/payments?' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addPayment (params) {
    return api.post('api/payments', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getPayment (params) {
    return api.get('api/payments?pay_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editPayment (params) {
    return api.put('api/payments/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  delPayment (params) {
    return api.delete('api/payments/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
}

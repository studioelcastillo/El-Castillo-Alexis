import { api } from '../boot/axios'

export default {
  getPaymentsFiles (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/payments_files?' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addPaymentFile (params) {
    return api.post('api/payments_files', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getPaymentFile (params) {
    return api.get('api/payments_files?payfile_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editPaymentFile (params) {
    return api.put('api/payments_files/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  delPaymentFile (params) {
    return api.delete('api/payments_files/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
}

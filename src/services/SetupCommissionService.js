
import { api } from '../boot/axios'

export default {
  getSetupCommissionOptions (params) {
    return api.get('api/setup_commissions/select/options', { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getCommissions (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/setup_commissions?' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addCommission (params) {
    return api.post('api/setup_commissions', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addCommissionItem (params) {
    return api.post('api/setup_commissions_item', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getCommission (params) {
    return api.get('api/setup_commissions/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editCommission (params) {
    return api.put('api/setup_commissions/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editCommissionItem (params) {
    return api.put('api/setup_commissions_item/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  delCommission (params) {
    return api.delete('api/setup_commissions/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  deleteCommissionItem (params) {
    return api.delete('api/setup_commissions_item/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
}

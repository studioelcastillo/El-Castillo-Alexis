import { api } from '../boot/axios'

export default {
  getStudiosAccounts (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/studios_accounts?' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addStudioAccount (params) {
    return api.post('api/studios_accounts', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getStudioAccount (params) {
    return api.get('api/studios_accounts?stdacc_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editStudioAccount (params) {
    return api.put('api/studios_accounts/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  delStudioAccount (params) {
    return api.delete('api/studios_accounts/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  activateStudioAccount (params) {
    return api.put('api/studios_accounts/active/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  inactivateStudioAccount (params) {
    return api.put('api/studios_accounts/inactive/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  }
}

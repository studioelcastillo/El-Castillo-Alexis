import { api } from '../boot/axios'

export default {
  getAccounts (params) {
    return api.get('api/accounts', { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editAccount (params) {
    return api.put('api/accounts/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  }
}

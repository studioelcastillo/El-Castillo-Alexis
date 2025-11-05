import { api } from '../boot/axios'

export default {
  getBanksAccounts (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/banks_accounts?' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addBankAccount (params) {
    return api.post('api/banks_accounts', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getBankAccount (params) {
    return api.get('api/banks_accounts?bankacc_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editBankAccount (params) {
    return api.put('api/banks_accounts/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  delBankAccount (params) {
    return api.delete('api/banks_accounts/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
}

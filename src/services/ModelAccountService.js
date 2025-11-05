import { api } from '../boot/axios'

export default {
  getModelsAccounts (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/models_accounts?' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getModelsAccountsByModel (params) {
    return api.get('api/models_accounts/bymodel?user_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addModelAccount (params) {
    return api.post('api/models_accounts', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getModelAccount (params) {
    return api.get('api/models_accounts?modacc_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editModelAccount (params) {
    return api.put('api/models_accounts/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  delModelAccount (params) {
    return api.delete('api/models_accounts/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  activateModelAccount (params) {
    return api.put('api/models_accounts/active/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  inactivateModelAccount (params) {
    return api.put('api/models_accounts/inactive/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  inactivateMassiveModelAccount (params) {
    return api.put('api/models_accounts/massive/inactive', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  changeAccountsContract (params) {
    return api.put('api/models_accounts/change_contract', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getPlatforms (params) {
    return api.post('api/models_accounts/platforms', params, { headers: { Authorization: 'Bearer ' + params.token } })
  }
}

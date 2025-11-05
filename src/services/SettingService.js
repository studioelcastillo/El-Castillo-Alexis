import { api } from '../boot/axios'

export default {
  getSettings (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/settings?' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addSetting (params) {
    return api.post('api/settings', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getSetting (params) {
    return api.get('api/settings?sett_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editSetting (params) {
    return api.put('api/settings/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  delSetting (params) {
    return api.delete('api/settings/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  activateSetting (params) {
    return api.put('api/settings/active/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  inactivateSetting (params) {
    return api.put('api/settings/inactive/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  }
}

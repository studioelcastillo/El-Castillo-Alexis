import { api } from '../boot/axios'

export default {
  getChiefMonitorsRelations (params) {
  	return api.get('api/monitorsrelations', { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addRelation (params) {
    return api.post('api/monitorsrelations', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  delRelation (params) {
    return api.delete('api/monitorsrelations/' + params.userParentId + '/' + params.userChidlId, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getMonitorsOfChiefMonitor (params) {
    return api.get('api/monitorsrelations/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  }
}

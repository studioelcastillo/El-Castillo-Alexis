import { api } from '../boot/axios'

export default {
  getPeriods (params) {
    return api.get('api/periods', { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getPeriodsLimited (params) {
  	return api.get('api/periods?limit=true', { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getPeriodsClosed (params) {
    return api.get('api/periods/closed', { headers: { Authorization: 'Bearer ' + params.token } })
  },
  closePeriod (params) {
    return api.put('api/period/close/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  openPeriod (params) {
    return api.put('api/period/open/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  }
}

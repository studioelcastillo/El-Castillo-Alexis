import { api } from '../boot/axios'

export default {
  getIndicators (params) {
    return api.get('api/dashboard/indicators?user_id=' + params.id + '&' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getTasks (params) {
    return api.get('api/dashboard/tasks?' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getCharts (params) {
    return api.get('api/dashboard/charts?user_id=' + params.id + '&' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
}

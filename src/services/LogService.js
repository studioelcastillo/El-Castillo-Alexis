import { api } from '../boot/axios'

export default {
  getLogs (params) {
    return api.get('api/logs', { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getLogsWithFilers (params) {
    return api.get('api/logs/datatable?' + params.filters, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getLog (params) {
    return api.get('api/logs?log_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  }
}

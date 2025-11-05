import { api } from '../boot/axios'

export default {
  getStudioPeriods (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/reports/studio_periods?user_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getConsecutiveReport (params) {
    return api.get('api/reports/consecutive/' + params.report_number, { headers: { Authorization: 'Bearer ' + params.token } })
  }
}

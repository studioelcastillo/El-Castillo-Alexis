import { api } from '../boot/axios'

export default {
  getNotifications (params) {
    return api.get('api/notifications?' + params.filters, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getNotificationsData (params) {
    return api.get('api/notifications/data', { headers: { Authorization: 'Bearer ' + params.token } })
  },
  readNotification (params) {
    return api.put('api/notifications/read/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  }
}

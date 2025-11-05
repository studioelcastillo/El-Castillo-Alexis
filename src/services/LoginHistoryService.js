import { api } from '../boot/axios'

export default {
  getHistory (params) {
    return api.get('api/login/history?' + params.filters, { headers: { Authorization: 'Bearer ' + params.token } })
  }
}

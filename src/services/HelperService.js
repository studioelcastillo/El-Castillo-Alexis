import { api } from '../boot/axios'

export default {
  validateSession (params) {
    return api.get('api/session', { headers: { Authorization: 'Bearer ' + params.token } })
  }
}

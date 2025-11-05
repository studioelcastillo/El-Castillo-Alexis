import { api } from '../boot/axios'

export default {
  getProfiles (params) {
    return api.get('api/profiles', { headers: { Authorization: 'Bearer ' + params.token } })
  }
}

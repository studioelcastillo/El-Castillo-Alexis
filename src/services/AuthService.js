import { api } from '../boot/axios'

export default {
  login (params) {
    return api.post('api/auth/login', params)
  },
  logout (params) {
    return api.post('api/auth/logout', {}, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  recoveryPassword (params) {
    return api.post('api/auth/recoveryPassword', params)
  },
  newPassword (params) {
    return api.put('api/auth/newPassword', params)
  },
  user (data) {
    return api.get('api/auth/user', { headers: { Authorization: 'Bearer ' + params.token } })
  },
  changePassword (params) {
    return api.put('api/auth/changePassword', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  setToken (params) {
    return api.put('api/auth/setToken', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  checkSession (params) {
    return api.get('api/auth/checkSession', { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getActiveDataPolicy () {
    return api.get('api/auth/policy/data')
  }
}

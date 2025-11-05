import { api } from '../boot/axios'

export default {
  getUsers2 (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/users2?' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addUser2 (params) {
    return api.post('api/users2', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getUser2 (params) {
    return api.get('api/users2?user_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editUser2 (params) {
    return api.put('api/users2/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  delUser2 (params) {
    return api.delete('api/users2/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  activateUser2 (params) {
    return api.put('api/users2/active/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  inactivateUser2 (params) {
    return api.put('api/users2/inactive/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  }
}

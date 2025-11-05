import { api } from '../boot/axios'

export default {
  getUsersPermissions2 (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/users_permissions2?' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addUserPermission2 (params) {
    return api.post('api/users_permissions2', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getUserPermission2 (params) {
    return api.get('api/users_permissions2?userperm_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editUserPermission2 (params) {
    return api.put('api/users_permissions2/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  delUserPermission2 (params) {
    return api.delete('api/users_permissions2/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
}

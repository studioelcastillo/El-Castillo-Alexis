import { api } from '../boot/axios'

export default {
  getUsersDatatable (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/users/datatable?' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getUsers (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/users?' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addUser (params) {
    return api.post('api/users', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getUser (params) {
    return api.get('api/users?user_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getUserStdmods (params) {
    return api.get('api/users/stdmods?user_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getUserWithPermission (params) {
    return api.get('api/user/permissions?user_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editUser (params) {
    return api.put('api/users/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  overwriteUser (params) {
    return api.put('api/users/overwrite/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editMyProfile (params) {
    return api.put('api/users/myprofile/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  delUser (params) {
    return api.delete('api/users/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  activateUser (params) {
    return api.put('api/users/active/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  inactivateUser (params) {
    return api.put('api/users/inactive/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  changePassword (params) {
    return api.put('api/users/changePassword/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getUsersByProfile (params) {
    return api.get('api/users/profile/' + params.prof_name, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  uploadImage (params) {
    return api.post('api/users/image/' + params.id, params.data, { headers: { Authorization: 'Bearer ' + params.token, 'Content-Type': 'multipart/form-data' } })
  },
  getModelsByOwnerStudio (params) {
    return api.get('api/users/models/owner?owner_id=' + params.owner_id + '&searchterm=' + params.search + '&prof_ids=' + params.prof_ids + '&user_mutual_studios_id=' + params.user_id, 
    { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getUsersByOwnerStudio (params) {
    let url = 'api/users/owner?searchterm=' + encodeURIComponent(params.search || '');
    if (params.prof_id) {
      url += '&prof_id=' + encodeURIComponent(params.prof_id);
    }
    return api.get(url, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getUsersCoincide (params) {
    return api.post('api/users/coincide', params.user, { headers: { Authorization: 'Bearer ' + params.token } })
  }
}

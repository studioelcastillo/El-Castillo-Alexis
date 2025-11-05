import { api } from '../boot/axios'

export default {
  getStudios (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/studios?user_id=' + params.id + '&' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addStudio (params) {
    return api.post('api/studios', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getStudio (params) {
    return api.get('api/studios?std_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editStudio (params) {
    return api.put('api/studios/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  delStudio (params) {
    return api.delete('api/studios/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  uploadImage (params) {
    return api.post('api/studios/image/' + params.id, params.data, { headers: { Authorization: 'Bearer ' + params.token, 'Content-Type': 'multipart/form-data' } })
  },
  activateStudio (params) {
    return api.put('api/studios/active/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  inactivateStudio (params) {
    return api.put('api/studios/inactive/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
}

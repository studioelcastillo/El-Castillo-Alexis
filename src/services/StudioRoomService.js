import { api } from '../boot/axios'

export default {
  getStudiosRooms (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/studios_rooms?' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addStudioRoom (params) {
    return api.post('api/studios_rooms', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getStudioRoom (params) {
    return api.get('api/studios_rooms?stdroom_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editStudioRoom (params) {
    return api.put('api/studios_rooms/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  delStudioRoom (params) {
    return api.delete('api/studios_rooms/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
}

import { api } from '../boot/axios'

export default {
  getStudiosShifts (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/studios_shifts?' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getStudiosShiftsDistinct (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/studios_shifts-distinct?' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addStudioShift (params) {
    return api.post('api/studios_shifts', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getStudioShift (params) {
    return api.get('api/studios_shifts?stdshift_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editStudioShift (params) {
    return api.put('api/studios_shifts/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  delStudioShift (params) {
    return api.delete('api/studios_shifts/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
}

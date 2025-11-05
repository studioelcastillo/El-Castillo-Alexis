import { api } from '../boot/axios'

export default {
  getModelsStreams (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/models_streams?' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getModelsStreamsByModel (params) {
    return api.get('api/models_streams/model?user_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addModelStream (params) {
    return api.post('api/models_streams', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getModelStream (params) {
    return api.get('api/models_streams?modstr_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editModelStream (params) {
    return api.put('api/models_streams/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  delModelStream (params) {
    return api.delete('api/models_streams/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  populateStreams (params) {
    return api.post('api/models_streams/populate', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  importModelStream (params) {
    return api.post('api/models_streams/import', params.data, { headers: { Authorization: 'Bearer ' + params.token, 'Content-Type': 'multipart/form-data' } })
  },
}

import { api } from '../boot/axios'

export default {
  getModelsStreamsFiles (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/models_streams_files?' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addModelStreamFile (params) {
    return api.post('api/models_streams_files', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getModelStreamFile (params) {
    return api.get('api/models_streams_files?modstrfile_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editModelStreamFile (params) {
    return api.put('api/models_streams_files/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  delModelStreamFile (params) {
    return api.delete('api/models_streams_files/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
}

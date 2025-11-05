import { api } from '../boot/axios'

export default {
  getStudiosModels (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/studios_models?' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addStudioModel (params) {
    return api.post('api/studios_models', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getStudioModel (params) {
    return api.get('api/studios_models?stdmod_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editStudioModel (params) {
    return api.put('api/studios_models/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  delStudioModel (params) {
    return api.delete('api/studios_models/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  activateStudioModel (params) {
    return api.put('api/studios_models/active/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  inactivateStudioModel (params) {
    return api.put('api/studios_models/inactive/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getStudiosModelsFromModelByStudioModel (params) {
    return api.get('api/studios_models/model?stdmod_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  }
}

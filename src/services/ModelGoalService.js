import { api } from '../boot/axios'

export default {
  getModelsGoals (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/models_goals?' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addModelGoal (params) {
    return api.post('api/models_goals', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getModelGoal (params) {
    return api.get('api/models_goals?modgoal_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editModelGoal (params) {
    return api.put('api/models_goals/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  delModelGoal (params) {
    return api.delete('api/models_goals/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
}

import { api } from '../boot/axios'

export default {
  addPetitions (params) {
    return api.post('api/petitions', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addPetitionState (params) {
    return api.post('api/petition/state', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getPetitions (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/petitions?' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getPetition (params) {
    return api.get('api/petitions/dynamic/conditions?ptn_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getAccountCreations(params) {
    return api.get('api/petitions/account_creations?user_id=' + params.user_id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  checkModelStudio (params) {
    return api.get('api/petitions/check_model_studio?user_id=' + params.user_id, { headers: { Authorization: 'Bearer ' + params.token } }) 
  },
  getStudiosModelsByModel (params) {
    return api.get('api/petitions/studios_models?user_id=' + params.user_id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getPreviousObservations (params) {
    return api.get('api/petitions/observations/previous?search=' + encodeURIComponent(params.search), { headers: { Authorization: 'Bearer ' + params.token } })
  }
}

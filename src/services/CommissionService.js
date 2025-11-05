import { api } from '../boot/axios'

export default {
  getCommisssionsTree(params) {
    return api.get('api/commissionsrelations', { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addRelation (params) {
    return api.post('api/commissionsrelations', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  delRelation (params) {
    return api.delete('api/commissionsrelations/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editRelation (params) {
    return api.put('api/commissionsrelations/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editRelationParent (params) {
    return api.put('api/commissionsrelations/' + params.id, { commparent_id: params.commparent_id }, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getCommissionsOfChiefCommission (params) {
    return api.get('api/commissionsrelations/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  }
}

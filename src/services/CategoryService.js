import { api } from '../boot/axios'

export default {
  getCategories (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/categories?' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addCategory (params) {
    return api.post('api/categories', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getCategory (params) {
    return api.get('api/categories?cate_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editCategory (params) {
    return api.put('api/categories/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  delCategory (params) {
    return api.delete('api/categories/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
}

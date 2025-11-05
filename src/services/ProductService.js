import { api } from '../boot/axios'

export default {
  getProducts (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/products?' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addProduct (params) {
    return api.post('api/products', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getProduct (params) {
    return api.get('api/products?prod_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editProduct (params) {
    return api.put('api/products/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  delProduct (params) {
    return api.delete('api/products/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
}

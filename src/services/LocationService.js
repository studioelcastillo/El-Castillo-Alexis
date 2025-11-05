import { api } from '../boot/axios'

export default {
  getCountries (params) {
    return api.get('api/countries', { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getDepartments (params) {
    return api.get('api/departments/' + params.country_id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getCities (params) {
    return api.get('api/cities/' + params.dpto_id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getLocations (params) {
  	return api.get('api/locations', { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addCountry (params) {
    return api.post('api/locations/country', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addDepartment (params) {
    return api.post('api/locations/department', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  addCity (params) {
    return api.post('api/locations/city', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editCountry (params) {
    return api.put('api/locations/country/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editDepartment (params) {
    return api.put('api/locations/department/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  editCity (params) {
    return api.put('api/locations/city/' + params.id, params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  delCountry (params) {
    return api.delete('api/locations/country/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  delDepartment (params) {
    return api.delete('api/locations/department/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  delCity (params) {
    return api.delete('api/locations/city/' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  }
}

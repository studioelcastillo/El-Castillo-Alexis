import { api } from '../boot/axios'

export default {
  addPreference (params) {
    return api.post('api/mercadopago/preference', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  feedback (params) {
    return api.post('api/mercadopago/feedback', params, { headers: { Authorization: 'Bearer ' + params.token } })
  },
}

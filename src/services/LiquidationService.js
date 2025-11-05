import { api } from '../boot/axios'

export default {
  // models
  getModelsLiquidation (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/liquidations/models?' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getModelsLiquidationPaymentPlain (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/liquidations/models/payment_plain?' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  // studios
  getStudiosLiquidation (params) {
    params.query = (params.query) ? params.query : ''
    return api.get('api/liquidations/studios?' + params.query, { headers: { Authorization: 'Bearer ' + params.token } })
  },
}

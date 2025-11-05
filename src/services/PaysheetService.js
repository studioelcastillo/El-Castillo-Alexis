import { api } from 'boot/axios'

export default {
  // Método existente
  getPaysheetUsers(params) {
    const { token, ...queryParams } = params
    return api.get('api/paysheet', {
      params: queryParams,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  },

  // Obtener PDF de nómina
  getPaysheetPDF(params) {
    const { token, ...queryParams } = params
    return api.get('api/paysheet/pdf', {
      params: queryParams,
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  },

  // Obtener períodos de nómina
  getPayrollPeriods(params) {
    const { token, ...queryParams } = params
    return api.get('api/payroll/periods', {
      params: queryParams,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  }
}

import { ssoAPI } from '../boot/axios'

export default {
  status (params) {
    return ssoAPI.get('api/sso/status', {
      headers: {
          Authorization: 'Bearer ' + params.token,
          'sso-key': process.env.SSO_KEY
        }
      })
  },
  sso (params) {
    return ssoAPI.post('api/sso',
      {
        ...params,
        browser: {
          type: 'chrome',
          debug: false
        }
      },
      { headers: {
          'sso-key': process.env.SSO_KEY
        }
      })
  },
}

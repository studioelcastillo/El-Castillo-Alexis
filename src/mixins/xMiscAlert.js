import { QSpinnerGears, QSpinnerAudio } from 'quasar'

/* INDEX
 * cleanString(): Get only text characters (A-Z) from an string
 * alert(): Get $q.notify alert
 * activateLoading(): ???
 * disableLoading(): ???
 * errorsAlerts(): ???
 */

export const xMiscAlert = {
  data () {
    return {
    }
  },
  methods: {
    // get only text characters (A-Z) from an string
    cleanString (string) {
      return string.replace(/ /g, '')
        .replace(/[0-9]/g, '')
        .replace(/,/g, '')
        .replace(/,/g, '')
        .replace(/:/g, '')
        .toLowerCase()
    },
    // get $q.notify alert
    alert (type, message) {
      this.$q.notify({
        type: type, // ['info', 'positive', 'warning', 'negative', 'ongoing' ]
        message: message
      })
    },
    // ???
    activateLoading (message, spinner = 0) {
      var show = {
        message: message
      }

      if (spinner === 1) {
        show.spinner = QSpinnerGears
      } else if (spinner === 2) {
        show.spinner = QSpinnerAudio
      }
      this.$q.loading.show(show)
    },
    // ???
    disableLoading () {
      this.$q.loading.hide()
    },
    // Frontend error handler
    errorsAlerts (error) {
      // if access is denied
      if(error.response && error.response.status === 403) {
        this.alert('negative', 'Accesso Denegado')
        this.goTo('logout')
      }
      // specific code errors handler
      if (error.response && error.response.data && error.response.data.error && error.response.data.error.code === 'UNEXPECTED_ERROR') {
        this.alert('negative', 'Ha ocurrido un error inesperado, intentelo nuevamente')

      // gk-template standar errors handler
      } else if (error.response && error.response.data && error.response.data.error && error.response.data.error.message) {
        this.alert('warning', error.response.data.error.message)

      // Laravel Validator standar errors handler
      } else if (error.response && error.response.data && error.response.data.errors) {
        if (error.response.data.message == 'The given data was invalid.') {
          // Laravel error fields list
          if (error.response.data.errors != null) {
            var errorsList = error.response.data.errors
            // loop fields
            for (var field in errorsList) {
              // loop field errors
              for (var e = 0; e < errorsList[field].length; e++) {
                console.log(errorsList[field][e])
                if(errorsList[field][e].match(/The (.*) field is required./)){
                  this.alert('warning', 'El campo ' + field + ' es obligatorio')
                } else {
                  this.alert('warning', errorsList[field][e])
                }
              }
            }
          } else {
            this.alert('negative', 'No se ha podido resolver la petición, por favor contacte con soporte técnico')
          }
        } else {
          this.alert('negative', 'Ha ocurrido un error inesperado, intentelo nuevamente')
        }

      // oauth errors handler
      } else if (error.response && error.response.data && error.response.data.message == 'Unauthenticated.') {
        this.alert('negative', 'El token de sesión ha expirado')
        this.activateLoading('Cargando')
        this.goTo('logout')
        this.disableLoading()

      // oauth errors handler
      } else if (error.response && error.response.data && error.response.data.message == 'Password does not match this email') {
        this.alert('warning', 'Contraseña incorrecta')

      // js errors handler
      } else if (error && !error.response) {
        console.log(error)
        this.alert('negative', 'Ha ocurrido un error inesperado, intentelo nuevamente')

      // default message
      } else {
        this.alert('negative', 'Ha ocurrido un error inesperado, intentelo nuevamente')
      }
    }
  }
}

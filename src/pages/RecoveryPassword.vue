<template>
  <div class="row index">
    <div class="col-md-5 col-sm-5 col-xs-12 login">
      <div class="logo">
        <center>
          <img src="~assets/icons/elcatillo_logo_black.png" alt="solidaria" style="height: 160px;">
        </center>
      </div>
      <center>
        <div class="form">
          <q-form @submit="recovery" v-if="mode === 'recovery'">
            <table>
              <tr align="center">
                <td><h4><b class="text-primary">{{$t('recoveryPassword')}}</b></h4></td>
              </tr>
              <tr align="center">
                <td><small>{{$t('recoveryPasswordMsm')}}</small></td>
              </tr>
              <tr>
                <br>
              </tr>
              <tr>
                <td><q-input ref="mail" class="txtfield" v-model="email" filled type="email" :label="$t('email')" required/></td>
              </tr>
              <tr>
                <br>
              </tr>
              <!-- <tr>
                <td style="text-align: right;">
                  <q-checkbox v-model="remember" left-label :label="$t('rememberMe')" color="primary" />
                </td>
              </tr> -->
              <tr>
                <td>
                  <q-btn type="submit" class="login-form-btn bg-accent" :label="$t('resetPassword')"/>
                </td>
              </tr>
              <tr>
                <td>
                  <q-btn @click="goTo('login')" class="login-form-btn bg-primary" :label="$t('return')"/>
                </td>
              </tr>
            </table>
          </q-form>
          <q-form @submit="change" v-if="mode === 'change'">
            <table>
              <tr align="center">
                <td><h4><b>{{$t('changePassword')}}</b></h4></td>
              </tr>
              <tr>
                <br>
              </tr>
              <tr>
                <td>
                  <q-input ref="password" class="txtfield" v-model="password" filled :type="isPwd ? 'password' : 'text'" :label="$t('password')" required>
                    <template v-slot:append>
                      <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwd = !isPwd"/>
                    </template>
                  </q-input>
                </td>
              </tr>
              <tr>
                <td>
                  <q-input ref="password" class="txtfield" v-model="rpassword" filled :type="isPwd ? 'password' : 'text'" :label="$t('repeatPassword')" required lazy-rules :rules="[ val => val === this.password || $t('passwordDoesntMatch')]">
                    <template v-slot:append>
                      <q-icon :name="isPwd2 ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwd2 = !isPwd2"/>
                    </template>
                  </q-input>
                </td>
              </tr>
              <tr>
                <br>
              </tr>
              <tr>
                <td>
                  <q-btn type="submit" class="login100-form-btn" :label="$t('changePassword')"/>
                </td>
              </tr>
            </table>
          </q-form>
        </div>
      </center>
      <br>
    </div>
  </div>
</template>
<script>
import AuthService from 'src/services/AuthService'
import { xMisc } from 'src/mixins/xMisc.js'
export default {
  name: 'RecoveryPassword',
  mixins: [xMisc],
  data () {
    return {
      mode: 'recovery',
      isPwd: true,
      isPwd2: true,
      email: '',
      password: '',
      rpassword: ''
    }
  },
  created () {
    // Get params depending url format

    // https://localhost/recovery-password/?u=<user>&t=<token>
    // this format generates error when TurboSMTP is used to recover password.
    if (this.$route.query.u && this.$route.query.t) {
      this.mode = 'change'

    // https://localhost/recovery-password/<user>/?t=<token>
    } else if (this.$route.params.u && this.$route.query.t) {
      this.mode = 'change'
      this.$route.query.u = this.$route.params.u

    // https://localhost/recovery-password/<user>/<token>/
    } else if (this.$route.params.u && this.$route.params.t) {
      this.mode = 'change'
      this.$route.query.u = this.$route.params.u
      this.$route.query.t = this.$route.params.t
    }
    console.log(this.$route.query.u)
    console.log(this.$route.query.t)
  },
  mounted () {
  },
  methods: {
    validarEmail (email) {
      const regex = /^([a-zA-Z0-9_.-])+@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/
      return !!regex.test(email)
    },
    async recovery () {
      this.activateLoading(this.$t('loading'))
      // let user
      let sesion
      if (this.validarEmail(this.email)) {
        try {
          sesion = await AuthService.recoveryPassword({ email: this.email })
          console.log(sesion.data.status)
          if (sesion.data.status === 'Success') {
            this.alert('positive', this.$t('emailSent'))
          } else {
            this.alert('negative', this.$t('unregisteredMail'))
          }
        } catch (error) {
          this.alert('negative', this.$t('unregisteredMail'))
        }
      } else {
        this.alert('negative', this.$t('emailValidationMessage'))
      }
      this.disableLoading()
    },
    async change () {
      this.activateLoading(this.$t('loading'), 1)
      // let user
      let sesion
      try {
        sesion = await AuthService.newPassword({ u: this.$route.query.u, t: this.$route.query.t, password: this.password })
        if (sesion.data.status === 'Success') {
          this.alert('positive', this.$t('passwordChanged'))
          this.goTo('login')
        } else {
          this.alert('negative', this.$t('errorTokenExpired'))
          this.password = ''
          this.rpassword = ''
          this.mode = 'recovery'
          this.goTo('recovery-password')
        }
      } catch (error) {
        this.alert('negative', this.$t('errorTokenExpired'))
        this.password = ''
        this.rpassword = ''
        this.mode = 'recovery'
        this.goTo('recovery-password')
      }
      this.disableLoading()
    }
  }
}
</script>
<style type="text/css">
  body {
    background: linear-gradient(135deg, #F8F4E9 5%, #E5D18E 95%, #F8F4E9 100%);
  }
</style>

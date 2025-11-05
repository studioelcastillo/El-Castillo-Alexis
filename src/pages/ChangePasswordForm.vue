<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card">
          <q-form
              @submit="onSubmit"
              class="q-gutter-md"
            >
            <q-card-section>
              <center>
                <h5 class="is-size-3" style="text-transform: uppercase;"><b>{{initTitle}}</b></h5>
              </center>
            </q-card-section>

            <q-separator inset />

            <q-card-section>
              <q-input ref="password" class="txtfield" v-model="opassword" filled :type="isPwd ? 'password' : 'text'" :label="$t('oldPassword')" required>
                <template v-slot:append>
                  <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwdO = !isPwdO"/>
                </template>
              </q-input>
              <br>
              <q-input ref="password" class="txtfield" v-model="password" filled :type="isPwd ? 'password' : 'text'" :label="$t('password')" required>
                <template v-slot:append>
                  <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwd = !isPwd"/>
                </template>
              </q-input>
              <br>
              <q-input ref="password" class="txtfield" v-model="rpassword" filled :type="isPwd ? 'password' : 'text'" :label="$t('repeatPassword')" required lazy-rules :rules="[ val => val === this.password || $t('passwordDoesntMatch')]">
                <template v-slot:append>
                  <q-icon :name="isPwd2 ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwd2 = !isPwd2"/>
                </template>
              </q-input>

            </q-card-section>

            <q-separator inset />

            <q-card-section>
              <div>
                <q-btn type="submit" class="bg-primary text-white submit1" :label="$t('changePassword')"/>
                <q-btn @click="goBack()" :label="$t('cancel')" />
              </div>
            </q-card-section>
          </q-form>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script>
import AuthService from 'src/services/AuthService'
import { xMisc } from 'src/mixins/xMisc.js'

export default {
  name: 'Change-password-form',
  mixins: [xMisc],
  components: {
  },
  data () {
    return {
      initTitle: this.$t('changePassword'),
      isPwdO: true,
      isPwd: true,
      isPwd2: true,
      password: '',
      rpassword: '',
      opassword: ''
    }
  },
  mounted () {
  },
  methods: {
    async onSubmit () {
      this.activateLoading(this.$t('loading'), 1)
      var response = {}
      // POST
      try {
        response = await AuthService.changePassword({ u: this.decryptSession('user').user_email, i: this.decryptSession('user').user_id, opassword: this.opassword, password: this.password, token: this.decryptSession('token') })
        if (response.data.status === 'Success') {
          this.alert('positive', this.$t('passwordChanged'))
          this.goTo('home')
        } else {
          this.alert('negative', this.$t('errorMessage'))
          this.password = ''
          this.rpassword = ''
        }
      } catch (error) {
        this.errorsAlerts(error)
        // this.alert('negative', this.$t('errorMessage'))
        this.password = ''
        this.rpassword = ''
      }
      this.disableLoading()
    },
    toggleInstructions () {
      // if (this.needHelp) {
      //   this.needHelp = false
      //   this.helpText = 'Ayuda'
      // } else {
      //   this.needHelp = true
      //   this.helpText = 'Cerrar ayuda'
      // }
    },
    goBack () {
      history.go(-1)
    }
  }
}
</script>

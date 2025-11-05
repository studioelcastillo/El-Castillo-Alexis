<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card">
          <q-form
              class="q-gutter-md"
            >
            <q-card-section>
              <div class="q-px-md q-gutter-sm">
                <q-btn color="black" @click="goTo('logs')" :label="'&lt; ' + $t('return')" />
              </div>
            </q-card-section>

            <q-separator class="q-my-none" inset />

            <q-card-section>
              <h5 class="is-size-3">{{initTitle}}</h5>
              <br>

              <div class="row q-col-gutter-sm">
                <div class="col-xs-12 col-sm-4">
                  <q-input
                    filled
                    :disable="true"
                    v-model="log.log_id"
                    :label="$t('id')"
                    lazy-rules
                    :rules="[ val => !!val || $t('typeSomething')]"
                  />
                </div>

                <div class="col-xs-12 col-sm-4">
                  <q-input
                    filled
                    :disable="true"
                    autogrow
                    v-model="log.log_ip"
                    :label="$t('ip')"
                    lazy-rules
                    :rules="[
                      val => !!val || $t('typeSomething')
                    ]"
                  />
                </div>

                <div class="col-xs-12 col-sm-4">
                  <q-input
                    filled
                    :disable="true"
                    autogrow
                    v-model="log.user_name"
                    :label="$t('user')"
                    lazy-rules
                    :rules="[
                      val => !!val || $t('typeSomething')
                    ]"
                  />
                </div>

                <div class="col-xs-12 col-sm-4">
                  <q-input
                    filled
                    :disable="true"
                    v-model="log.log_table"
                    :label="$t('module')"
                    lazy-rules
                    :rules="[ val => !!val || $t('typeSomething')]"
                  />
                </div>

                <div class="col-xs-12 col-sm-4">
                  <q-input
                    filled
                    :disable="true"
                    v-model="log.log_table_id"
                    :label="$t('recordId')"
                    lazy-rules
                    :rules="[ val => !!val || $t('typeSomething')]"
                  />
                </div>

                <div class="col-xs-12 col-sm-4">
                  <q-input
                    filled
                    :disable="true"
                    v-model="log.log_action"
                    :label="$t('action')"
                    lazy-rules
                    :rules="[ val => !!val || $t('typeSomething')]"
                  />
                </div>

                <div v-if="log.log_action !== 'INSERT'" :class="(log.log_action == 'UPDATE') ? 'col-xs-12 col-sm-6' : 'col-xs-12 col-sm-12'">
                  <q-input
                    filled
                    type="textarea"
                    :disable="false"
                    v-model="log.log_before"
                    :label="(log.log_action == 'UPDATE') ? $t('before') : 'Registro'"
                    lazy-rules
                    :rules="[ val => !!val || $t('typeSomething')]"
                  />
                </div>

                <div v-if="log.log_action !== 'DELETE'" :class="(log.log_action == 'UPDATE') ? 'col-xs-12 col-sm-6' : 'col-xs-12 col-sm-12'">
                  <q-input
                    filled
                    type="textarea"
                    :disable="false"
                    v-model="log.log_after"
                    :label="(log.log_action == 'UPDATE') ? $t('after') : 'Registro'"
                    lazy-rules
                    :rules="[ val => !!val || $t('typeSomething')]"
                  />
                </div>

                <div class="col-xs-12 col-sm-12">
                  <q-input
                    filled
                    :disable="true"
                    v-model="log.created_at"
                    :label="$t('creationDate')"
                    lazy-rules
                    :rules="[ val => !!val || $t('typeSomething')]"
                  />
                </div>
              </div>

            </q-card-section>

            <q-separator inset />

            <q-separator inset />

            <q-card-section>
            </q-card-section>

          </q-form>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script>
import LogService from 'src/services/LogService'
import { xMisc } from 'src/mixins/xMisc.js'

export default {
  name: 'Log-form',
  mixins: [xMisc],
  components: {
  },
  data () {
    return {
      initTitle: this.$t('log'),
      log: {
        log_id: '',
        log_ip: '',
        user_name: '',
        log_table: '',
        log_table_id: '',
        log_action: '',
        log_before: '',
        log_after: '',
        created_at: ''
      }
    }
  },
  mounted () {
    this.getData()
  },
  methods: {
    async getData () {
      this.activateLoading(this.$t('loading'))
      var response = await LogService.getLog({ id: this.$route.params.id, token: this.decryptSession('token') })
      var beforemsm = ''
      if (response.data.data[0].log_before !== null) {
        var before = JSON.parse(response.data.data[0].log_before)
        var keysBefore = Object.keys(before)
        for (var u = 0; u < keysBefore.length; u++) {
          if (keysBefore[u].toLowerCase() === 'user_password') {
            beforemsm = beforemsm + this.$t(this.generateStringToTraslate(keysBefore[u].toLowerCase())) + ' = ' + this.littleText(before[keysBefore[u]], 15) + '\n'
          } else {
            beforemsm = beforemsm + this.$t(this.generateStringToTraslate(keysBefore[u].toLowerCase())) + ' = ' + before[keysBefore[u]] + '\n'
          }
        }
      }
      var aftermsm = ''
      if (response.data.data[0].log_after !== null) {
        var after = JSON.parse(response.data.data[0].log_after)
        var keysAfter = Object.keys(after)
        for (var i = 0; i < keysAfter.length; i++) {
          if (keysAfter[i].toLowerCase() === 'user_password') {
            aftermsm = aftermsm + this.$t(this.generateStringToTraslate(keysAfter[i].toLowerCase())) + ' = ' + this.littleText(after[keysAfter[i]], 15) + '\n'
          } else {
            aftermsm = aftermsm + this.$t(this.generateStringToTraslate(keysAfter[i].toLowerCase())) + ' = ' + after[keysAfter[i]] + '\n'
          }
        }
      }

      this.log.log_id = response.data.data[0].log_id
      this.log.log_ip = response.data.data[0].log_ip
      this.log.user_name = response.data.data[0].user.user_name
      this.log.log_table = this.$t(response.data.data[0].log_table)
      this.log.log_table_id = response.data.data[0].log_table_id
      this.log.log_action = this.$t(response.data.data[0].log_action)
      this.log.log_before = beforemsm.trim()
      this.log.log_after = aftermsm.trim()
      this.log.created_at = this.convertUTCDateToLocalDate(response.data.data[0].created_at)
      this.disableLoading()
    },
    generateStringToTraslate (string) {
      var datos = string.split('_')
      if (string.includes('id') || string.includes('created_at') || string.includes('updated_at') || string.includes('deleted_at')) {
        return string
      } else {
        var response = datos[1]
        for (var i = 2; i < datos.length; i++) {
          response = response + this.capitalize(datos[i])
        }
        return response
      }
    },
    capitalize (word) {
      return word[0].toUpperCase() + word.slice(1)
    }
  }
}
</script>
<style lang="sass" scoped>
.custom-caption
  text-align: center
  color: white
  background-color: rgba(0, 0, 0, .6)
</style>

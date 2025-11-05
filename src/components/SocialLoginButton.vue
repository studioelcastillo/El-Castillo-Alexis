<template>
  <q-btn type="submit" :color="color" :icon="icon" :label="label" class="login-form-btn" @click.prevent="loginSocial()"/>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { xMisc } from '../mixins/xMisc.js'
import { sGate } from '../mixins/sGate.js'

export default defineComponent({
  name: 'SocialLoginButton',
  mixins: [xMisc, sGate],
  props: {
    label: {
      type: String,
      required: true
    },
    network: {
      type: String,
      required: true
    },
    color: {
      type: String,
      default: 'white'
    },
    icon: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
    }
  },
  mounted () {
    window.addEventListener('message', this.onMessage, false)
  },
  beforeUnmount () {
    window.removeEventListener('message', this.onMessage)
  },
  methods: {
    loginSocial () {
      const newWindow = this.openWindow('', 'message')
      newWindow.location.href = process.env.API_URL + 'api/auth/redirect/' + this.network;
    },
    // This method save the new token and username
    onMessage (e) {
      if (e.data.provider !== this.network || !e.data.access_token) {
        return
      }
      this.encryptSession('user', JSON.parse(e.data.user.replace(/&quot;/g,'"')))
      this.encryptSession('token', e.data.access_token)
      this.vSession()
    },
    openWindow (url, title, options = {}) {
      if (typeof url === 'object') {
        options = url
        url = ''
      }

      options = { url, title, width: 600, height: 720, ...options }

      const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screen.left
      const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screen.top
      const width = window.innerWidth || document.documentElement.clientWidth || window.screen.width
      const height = window.innerHeight || document.documentElement.clientHeight || window.screen.height

      options.left = ((width / 2) - (options.width / 2)) + dualScreenLeft
      options.top = ((height / 2) - (options.height / 2)) + dualScreenTop

      const optionsStr = Object.keys(options).reduce((acc, key) => {
        acc.push(`${key}=${options[key]}`)
        return acc
      }, []).join(',')

      const newWindow = window.open(url, title, optionsStr)

      if (window.focus) {
        newWindow.focus()
      }

      return newWindow
    }
  }
})
</script>

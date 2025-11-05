import { boot } from 'quasar/wrappers'
import Echo from "laravel-echo"
import pusherjs from "pusher-js"

window.Pusher = pusherjs;

var echo = null

if (process.env.NOTIFICATION_BUTTON && process.env.NOTIFICATION_BUTTON.toUpperCase() === 'TRUE') {
  echo = new Echo({
      broadcaster: 'pusher',
      key: (process.env.SOCKET_KEY) ? process.env.SOCKET_KEY : '',
      wsHost: (process.env.SOCKET_HOST) ? process.env.SOCKET_HOST : '',
      wsPort: (process.env.SOCKET_PORT) ? process.env.SOCKET_PORT : '',
      forceTLS: false,
      disableStats: true,
  });
}

export default boot(({ app }) => {
  app.config.globalProperties.$echo = echo
})
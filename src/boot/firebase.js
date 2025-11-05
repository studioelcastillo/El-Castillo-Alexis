import { boot } from 'quasar/wrappers'
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import AuthService from 'src/services/AuthService'
import { xMisc } from 'src/mixins/xMisc.js'

import { LocalStorage, Notify } from 'quasar'

const firebaseConfig = {
  apiKey: process.env.FCM_APIKEY,
  authDomain: process.env.FCM_AUTHDOMAIN,
  projectId: process.env.FCM_PROJECTID,
  storageBucket: process.env.FCM_STORAGEBUCKET,
  messagingSenderId: process.env.FCM_MESSAGINGSENDERID,
  appId: process.env.FCM_APPID,
  measurementId: process.env.FCM_MEASUREMENTID
};

export default boot(({ app }) => {
  async function requestPermission() {
    // Initialize Firebase
    const firebaseApp = initializeApp(firebaseConfig);
    const messaging = getMessaging(firebaseApp)
    await navigator.serviceWorker.register('/firebase-messaging-sw.js').then((registration) => {
      // console.log('entro en register', registration)
      // firebase.messaging().useServiceWorker(registration)
    })
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        getToken(messaging, { vapidKey: 'BNHfyizcNcOEno6oLDl3ugVTmWWZCEN67KxkXWFQqjWzj1zNHSHtlAf6FriSm6H-6-VL6sBSg01MPzCiSP-656I'})
        .then((currentToken) => {
          if (currentToken) {
            AuthService.setToken({ fcm: currentToken, token: xMisc.methods.decryptSession('token') })
          } else {
            console.log('can not get token')
          }
        })

        onMessage(messaging, (payload) => {
          console.log('Message received.')
          console.log('Message received.', payload)
      
          const notification = payload.notification
      
          Notify.create({
            message: `${notification.title} - ${notification.body}`
            // You can also handle actions here, they are in `notification.actions`
          })
        })
      } else {
        // console.log('Do not have permission')
      }
    })
  }

  if (process.env.FCM_APIKEY && process.env.FCM_APIKEY !== '') {
    requestPermission()
  }
})
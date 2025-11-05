importScripts('https://www.gstatic.com/firebasejs/5.5.3/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/5.5.3/firebase-messaging.js');

if (process.env.FCM_APIKEY && process.env.FCM_APIKEY !== '') {
  firebase.initializeApp({
    'messagingSenderId': '268196724745'
  });
  const messaging = firebase.messaging();
  messaging.setBackgroundMessageHandler(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = 'Background Message Title';
    const notificationOptions = {
      body: 'Background Message body.'
    };
    return self.registration.showNotification(notificationTitle,
        notificationOptions);
  });
}
// public/firebase-messaging-sw.js

// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js')

// The environment variables will be injected here during build or
// you can hardcode the non-sensitive public config.
// Since Service Workers don't have access to process.env by default,
// it's common practice to use URL parameters or a config file.
// For simplicity in MVP, we configure it via query params when registering,
// but Firebase compat allows initialization like this:

firebase.initializeApp({
  apiKey: new URL(location).searchParams.get('apiKey'),
  authDomain: new URL(location).searchParams.get('authDomain'),
  projectId: new URL(location).searchParams.get('projectId'),
  messagingSenderId: new URL(location).searchParams.get('messagingSenderId'),
  appId: new URL(location).searchParams.get('appId'),
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload)

  const notificationTitle = payload.notification?.title || 'CampusNest Notification'
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/favicon.ico',
    data: payload.data, // Contains link info
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const link = event.notification.data?.link || '/'
  event.waitUntil(self.clients.openWindow(link))
})

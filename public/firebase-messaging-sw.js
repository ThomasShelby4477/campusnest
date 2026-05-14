// public/firebase-messaging-sw.js
// [SECURITY H-2] Firebase config is received via postMessage from the app,
// NOT from URL query parameters (which leak to server access logs and browser history).

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js')

let messaging = null

// Listen for config from the main app thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG' && event.data.config) {
    try {
      // Only initialize once
      if (!firebase.apps.length) {
        firebase.initializeApp(event.data.config)
      }
      messaging = firebase.messaging()

      messaging.onBackgroundMessage((payload) => {
        const notificationTitle = payload.notification?.title || 'CampusNest Notification'
        const notificationOptions = {
          body: payload.notification?.body,
          icon: '/favicon.ico',
          data: payload.data,
        }
        self.registration.showNotification(notificationTitle, notificationOptions)
      })
    } catch {
      // Firebase already initialized or not supported — silently continue
    }
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  // [SECURITY] Only navigate to same-origin relative paths to prevent open redirect
  const rawLink = event.notification.data?.link || '/'
  const link = rawLink.startsWith('/') && !rawLink.startsWith('//') ? rawLink : '/'
  event.waitUntil(self.clients.openWindow(link))
})

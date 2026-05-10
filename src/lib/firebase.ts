import { initializeApp, getApps, getApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Only initialize Firebase if all required config values are present
const isFirebaseConfigured = !!(
  firebaseConfig.projectId &&
  firebaseConfig.apiKey &&
  firebaseConfig.appId
)

const app = isFirebaseConfigured
  ? (!getApps().length ? initializeApp(firebaseConfig) : getApp())
  : null

export const requestFirebaseToken = async (): Promise<string | null> => {
  if (!app || !isFirebaseConfigured) return null

  try {
    const supported = await isSupported()
    if (!supported) return null

    const messaging = getMessaging(app)
    const permission = await Notification.requestPermission()

    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      })
      return token
    }
    return null
  } catch {
    // Silently fail — Firebase is optional (push notifications)
    return null
  }
}

export const onMessageListener = (): Promise<unknown> => {
  if (!app || !isFirebaseConfigured) return Promise.resolve(null)

  return new Promise((resolve) => {
    try {
      const messaging = getMessaging(app!)
      onMessage(messaging, (payload) => {
        resolve(payload)
      })
    } catch {
      resolve(null)
    }
  })
}

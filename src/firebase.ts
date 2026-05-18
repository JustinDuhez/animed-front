import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: "AIzaSyDH4prce6XF35j0QzmI0pPjLtmVO67zkF4",
  authDomain: "animed-57012.firebaseapp.com",
  projectId: "animed-57012",
  storageBucket: "animed-57012.firebasestorage.app",
  messagingSenderId: "471514822873",
  appId: "1:471514822873:web:0c6ca38dac02d0507de6c8",
  measurementId: "G-GJ7GNPZJNP"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const analytics = getAnalytics(app)

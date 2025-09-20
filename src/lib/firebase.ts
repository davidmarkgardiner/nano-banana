import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
let firebase_app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let googleProvider: GoogleAuthProvider | null = null

try {
  firebase_app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

  // Initialize Firebase Auth and get a reference to the service
  auth = getAuth(firebase_app)

  // Initialize Firebase Firestore and get a reference to the service
  db = getFirestore(firebase_app)

  // Initialize Google Auth Provider
  googleProvider = new GoogleAuthProvider()
} catch (error) {
  console.warn('Firebase initialization failed:', error)
}

// Initialize Firebase Storage and get a reference to the service
export const storage = firebase_app ? getStorage(firebase_app) : null

export { auth, db, googleProvider }
export default firebase_app

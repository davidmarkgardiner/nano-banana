import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
let firebaseApp: FirebaseApp | null = null
let authInstance: Auth | null = null
let dbInstance: Firestore | null = null
let googleAuthProvider: GoogleAuthProvider | null = null
let storageInstance: FirebaseStorage | null = null

try {
  firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

  // Initialize Firebase Auth and get a reference to the service
  authInstance = getAuth(firebaseApp)

  // Initialize Firebase Firestore and get a reference to the service
  dbInstance = getFirestore(firebaseApp)

  // Initialize Google Auth Provider
  googleAuthProvider = new GoogleAuthProvider()

  // Initialize Firebase Storage and get a reference to the service
  storageInstance = getStorage(firebaseApp)
} catch (error) {
  console.warn('Firebase initialization failed:', error)
}

export const auth = authInstance
export const db = dbInstance
export const googleProvider = googleAuthProvider
export const storage = storageInstance

export default firebaseApp

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signup: (email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const useAuth = () => {
  return useContext(AuthContext)
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const signup = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase Auth not initialized')
    await createUserWithEmailAndPassword(auth, email, password)
  }

  const login = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase Auth not initialized')
    await signInWithEmailAndPassword(auth, email, password)
  }

  const loginWithGoogle = async () => {
    if (!auth || !googleProvider) throw new Error('Firebase Auth not initialized')
    await signInWithPopup(auth, googleProvider)
  }

  const logout = async () => {
    if (!auth) throw new Error('Firebase Auth not initialized')
    await signOut(auth)
  }

  useEffect(() => {
    if (!auth) {
      console.warn('Firebase Auth not initialized - running without authentication')
      setLoading(false)
      setError('Firebase Auth not available')
      return
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user)
        setLoading(false)
        setError(null)
      }, (error) => {
        console.warn('Firebase Auth not configured yet:', error.message)
        setError('Firebase Auth not configured')
        setLoading(false)
      })

      return unsubscribe
    } catch (error: any) {
      console.warn('Firebase Auth initialization error:', error.message)
      setError('Firebase Auth not available')
      setLoading(false)
    }
  }, [])

  const value = {
    user,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
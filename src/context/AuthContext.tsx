'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore'

import { auth, googleProvider, db } from '@/lib/firebase'
import { isAdminEmail } from '@/lib/admin'

type UserApprovalState = 'pending' | 'approved' | 'rejected'
export type ApprovalStatus = UserApprovalState | 'unknown'

export interface UserApprovalRecord {
  status: UserApprovalState
  email: string | null
  displayName: string | null
  requestedAt: Timestamp | null
  updatedAt: Timestamp | null
  approvedBy: string | null
  approvedAt: Timestamp | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  loginWithGoogle: () => Promise<void>
  loginWithEmail: (email: string, password: string) => Promise<void>
  registerWithEmail: (email: string, password: string, displayName?: string) => Promise<void>
  logout: () => Promise<void>
  approvalStatus: ApprovalStatus
  approvalLoading: boolean
  approvalError: string | null
  approvalRecord: UserApprovalRecord | null
  refreshApprovalStatus: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const useAuth = () => {
  return useContext(AuthContext)
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>('unknown')
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [approvalError, setApprovalError] = useState<string | null>(null)
  const [approvalRecord, setApprovalRecord] = useState<UserApprovalRecord | null>(null)

  const loginWithGoogle = async () => {
    if (!auth || !googleProvider) throw new Error('Firebase Auth not initialized')
    await signInWithPopup(auth, googleProvider)
  }

  const loginWithEmail = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase Auth not initialized')
    await signInWithEmailAndPassword(auth, email, password)
  }

  const registerWithEmail = async (email: string, password: string, displayName?: string) => {
    if (!auth) throw new Error('Firebase Auth not initialized')

    const credential = await createUserWithEmailAndPassword(auth, email, password)

    if (displayName) {
      try {
        await updateProfile(credential.user, { displayName })
      } catch (profileError) {
        console.warn('Failed to update display name for email registration:', profileError)
      }
    }
  }

  const logout = async () => {
    if (!auth) throw new Error('Firebase Auth not initialized')
    await signOut(auth)
    setApprovalStatus('unknown')
    setApprovalRecord(null)
    setApprovalError(null)
  }

  const updateApprovalState = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setApprovalStatus('unknown')
      setApprovalRecord(null)
      setApprovalError(null)
      setApprovalLoading(false)
      return
    }

    setApprovalLoading(true)

    if (!db) {
      setApprovalStatus('pending')
      setApprovalRecord(null)
      setApprovalError('Firestore is not configured. Unable to verify admin approval.')
      setApprovalLoading(false)
      return
    }

    setApprovalError(null)

    try {
      const approvalRef = doc(db, 'userApprovals', currentUser.uid)
      const snapshot = await getDoc(approvalRef)

      const autoApprove = isAdminEmail(currentUser.email)

      if (!snapshot.exists()) {
        const now = Timestamp.now()
        const initialStatus: UserApprovalState = autoApprove ? 'approved' : 'pending'

        await setDoc(approvalRef, {
          status: initialStatus,
          email: currentUser.email ?? null,
          displayName: currentUser.displayName ?? null,
          requestedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ...(autoApprove && {
            approvedBy: currentUser.email ?? 'system-auto',
            approvedAt: serverTimestamp(),
          }),
        })

        setApprovalStatus(initialStatus)
        setApprovalRecord({
          status: initialStatus,
          email: currentUser.email ?? null,
          displayName: currentUser.displayName ?? null,
          requestedAt: now,
          updatedAt: now,
          approvedBy: autoApprove ? currentUser.email ?? 'system-auto' : null,
          approvedAt: autoApprove ? now : null,
        })
        return
      }

      const data = snapshot.data() as Partial<UserApprovalRecord & { status: UserApprovalState }>
      const status: UserApprovalState = data.status ?? 'pending'

      setApprovalStatus(status)
      setApprovalRecord({
        status,
        email: (data.email as string | null | undefined) ?? currentUser.email ?? null,
        displayName: (data.displayName as string | null | undefined) ?? currentUser.displayName ?? null,
        requestedAt: (data.requestedAt as Timestamp | undefined) ?? null,
        updatedAt: (data.updatedAt as Timestamp | undefined) ?? null,
        approvedBy: (data.approvedBy as string | undefined) ?? null,
        approvedAt: (data.approvedAt as Timestamp | undefined) ?? null,
      })
    } catch (error) {
      console.error('Failed to fetch approval status:', error)
      setApprovalError('Unable to verify admin approval. Please try again later.')
      setApprovalStatus('pending')
    } finally {
      setApprovalLoading(false)
    }
  }, [])

  const refreshApprovalStatus = useCallback(async () => {
    await updateApprovalState(user)
  }, [updateApprovalState, user])

  useEffect(() => {
    if (!auth) {
      console.warn('Firebase Auth not initialized - running without authentication')
      setLoading(false)
      return
    }

    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        (currentUser) => {
          setLoading(true)
          setUser(currentUser)
          updateApprovalState(currentUser).finally(() => {
            setLoading(false)
          })
        },
        (authError) => {
          console.warn('Firebase Auth not configured yet:', authError.message)
          setApprovalError('Firebase Auth not configured')
          setLoading(false)
        }
      )

      return unsubscribe
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.warn('Firebase Auth initialization error:', message)
      setApprovalError('Firebase Auth not available')
      setLoading(false)
    }
  }, [updateApprovalState])

  const value = {
    user,
    loading,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
    approvalStatus,
    approvalLoading,
    approvalError,
    approvalRecord,
    refreshApprovalStatus,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
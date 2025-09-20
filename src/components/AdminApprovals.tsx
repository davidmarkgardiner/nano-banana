'use client'

import { useState, useEffect } from 'react'
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import type { UserApprovalRecord } from '@/context/AuthContext'

interface UserApprovalWithId extends UserApprovalRecord {
  id: string
}

export default function AdminApprovals() {
  const { user } = useAuth()
  const [approvals, setApprovals] = useState<UserApprovalWithId[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Simple admin check - you can modify this logic
  const isAdmin = user?.email === 'davidmarkgardiner@gmail.com' // Replace with your email

  const fetchApprovals = async () => {
    if (!db) {
      setError('Firestore not available')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const snapshot = await getDocs(collection(db, 'userApprovals'))
      const approvalsList: UserApprovalWithId[] = []

      snapshot.forEach((doc) => {
        const data = doc.data() as UserApprovalRecord
        approvalsList.push({
          id: doc.id,
          ...data
        })
      })

      // Sort by status (pending first) then by request date
      approvalsList.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1
        if (a.status !== 'pending' && b.status === 'pending') return 1

        const aTime = a.requestedAt?.toDate().getTime() || 0
        const bTime = b.requestedAt?.toDate().getTime() || 0
        return bTime - aTime
      })

      setApprovals(approvalsList)
    } catch (error) {
      console.error('Error fetching approvals:', error)
      setError('Failed to fetch approval requests')
    } finally {
      setLoading(false)
    }
  }

  const updateApproval = async (userId: string, newStatus: 'approved' | 'rejected') => {
    if (!db || !user) return

    try {
      const approvalRef = doc(db, 'userApprovals', userId)
      await updateDoc(approvalRef, {
        status: newStatus,
        approvedBy: user.email,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      // Refresh the list
      await fetchApprovals()
    } catch (error) {
      console.error('Error updating approval:', error)
      alert('Failed to update approval status')
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchApprovals()
    } else {
      setLoading(false)
    }
  }, [isAdmin])

  if (!user) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
        <p className="text-gray-600">Please sign in to access admin features</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
        <p className="text-red-600">Access denied. Admin privileges required.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-1/3 rounded bg-gray-200"></div>
          <div className="space-y-3">
            <div className="h-4 rounded bg-gray-200"></div>
            <div className="h-4 rounded bg-gray-200"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchApprovals}
          className="mt-2 rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  const pendingCount = approvals.filter(a => a.status === 'pending').length

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">User Approvals</h2>
        <div className="flex items-center gap-4">
          {pendingCount > 0 && (
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
              {pendingCount} pending
            </span>
          )}
          <button
            onClick={fetchApprovals}
            className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {approvals.length === 0 ? (
        <p className="text-gray-500">No approval requests found.</p>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => (
            <div
              key={approval.id}
              className={`rounded-lg border p-4 ${
                approval.status === 'pending'
                  ? 'border-yellow-200 bg-yellow-50'
                  : approval.status === 'approved'
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-gray-900">
                      {approval.displayName || 'No name'}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        approval.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : approval.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {approval.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{approval.email}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    <p>
                      Requested: {approval.requestedAt?.toDate().toLocaleDateString()} at{' '}
                      {approval.requestedAt?.toDate().toLocaleTimeString()}
                    </p>
                    {approval.approvedBy && (
                      <p>
                        {approval.status === 'approved' ? 'Approved' : 'Rejected'} by {approval.approvedBy}
                      </p>
                    )}
                  </div>
                </div>

                {approval.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateApproval(approval.id, 'approved')}
                      className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateApproval(approval.id, 'rejected')}
                      className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
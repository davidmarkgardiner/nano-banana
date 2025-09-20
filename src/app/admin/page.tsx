'use client'

import AdminApprovals from '@/components/AdminApprovals'
import { useAuth } from '@/context/AuthContext'

export default function AdminPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage user approval requests</p>
        </div>

        <AdminApprovals />

        {user && (
          <div className="mt-8 rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="font-medium text-gray-900">Current Admin</h3>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
        )}
      </div>
    </div>
  )
}
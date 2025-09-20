'use client'

import { useAuth } from '@/context/AuthContext'

export default function UserProfile() {
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-100 shadow-xl backdrop-blur-xl">
      <div className="pointer-events-none absolute -top-24 left-8 h-48 w-48 rounded-full bg-sky-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 right-0 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl" />

      <div className="relative">
        <h2 className="text-2xl font-semibold text-white">Welcome back 👋</h2>

        <div className="mt-4 space-y-3 text-sm text-slate-200">
          <p>
            <span className="font-semibold text-white">Email:</span> {user.email}
          </p>
          <p>
            <span className="font-semibold text-white">User ID:</span> {user.uid}
          </p>
          <p>
            <span className="font-semibold text-white">Verified:</span> {user.emailVerified ? 'Yes' : 'No'}
          </p>
        </div>

        <button
          onClick={logout}
          className="mt-6 w-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:shadow-xl hover:shadow-rose-500/40"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
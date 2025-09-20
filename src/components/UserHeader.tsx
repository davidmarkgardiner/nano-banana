'use client'

import { User } from 'firebase/auth'
import Image from 'next/image'

interface UserHeaderProps {
  user: User
  onLogout: () => Promise<void>
  className?: string
}

export default function UserHeader({ user, onLogout, className }: UserHeaderProps) {
  const handleLogout = async () => {
    try {
      await onLogout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const containerClassName = [
    'w-full max-w-6xl mx-auto mb-8',
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={containerClassName}>
      <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/10 p-4 text-slate-100 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
        {/* User Info */}
        <div className="flex items-center gap-3">
          {/* Profile Picture */}
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
            {user.photoURL ? (
              <Image
                src={user.photoURL}
                alt={user.displayName || 'User'}
                width={40}
                height={40}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-medium text-sm">
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
          </div>

          {/* User Details */}
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
              Welcome back{user.displayName ? `, ${user.displayName}` : ''}!
            </p>
            <p className="text-xs text-slate-200/70 truncate">
              {user.email}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Account Badge */}
          <div className="hidden sm:flex items-center rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
            <div className="mr-1 h-2 w-2 animate-pulse rounded-full bg-emerald-300"></div>
            Active
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition-colors hover:border-red-400/50 hover:bg-red-500/10 hover:text-red-200"
            title="Sign out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </div>
  )
}
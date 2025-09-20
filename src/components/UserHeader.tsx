'use client'

import { User } from 'firebase/auth'
import Image from 'next/image'

interface UserHeaderProps {
  user: User
  onLogout: () => Promise<void>
}

export default function UserHeader({ user, onLogout }: UserHeaderProps) {
  const handleLogout = async () => {
    try {
      await onLogout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto mb-8">
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
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
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              Welcome back{user.displayName ? `, ${user.displayName}` : ''}!
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user.email}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Account Badge */}
          <div className="hidden sm:flex items-center px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md text-xs font-medium">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
            Active
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
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
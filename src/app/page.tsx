'use client'

import { useAuth } from '@/context/AuthContext'
import LoginForm from '@/components/LoginForm'
import ImageGenerator from '@/components/ImageGenerator'
import FirestoreDemo from '@/components/FirestoreDemo'

export default function Home() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🍌 Nano Banana
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            AI-powered image generation from text - Built with Firebase & Next.js
          </p>
        </div>

        <div className="mb-8 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left mx-auto">
          <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-white/50 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
            <h3 className="mb-3 text-xl font-semibold">🔐 Authentication</h3>
            <p className="m-0 max-w-[30ch] text-sm opacity-70">
              Secure user accounts with Google sign-in.
            </p>
          </div>

          <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-white/50 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
            <h3 className="mb-3 text-xl font-semibold">🎨 AI Images</h3>
            <p className="m-0 max-w-[30ch] text-sm opacity-70">
              Generate images from text using nano banana API.
            </p>
          </div>

          <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-white/50 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
            <h3 className="mb-3 text-xl font-semibold">💾 History</h3>
            <p className="m-0 max-w-[30ch] text-sm opacity-70">
              Save and manage your generated images.
            </p>
          </div>

          <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-white/50 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
            <h3 className="mb-3 text-xl font-semibold">📱 Responsive</h3>
            <p className="m-0 max-w-[30ch] text-sm opacity-70">
              Works perfectly on desktop and mobile.
            </p>
          </div>
        </div>

        {/* Main Application */}
        {!user ? (
          <LoginForm />
        ) : (
          <div className="space-y-8">
            <ImageGenerator user={user} onLogout={logout} />
            <FirestoreDemo />
          </div>
        )}

        {/* Status Section */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Firebase connected and ready!
          </div>
        </div>
      </div>
    </main>
  )
}
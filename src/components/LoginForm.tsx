'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

export default function LoginForm() {
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { loginWithGoogle } = useAuth()

  const handleGoogleLogin = async () => {
    try {
      setError('')
      setIsSubmitting(true)
      await loginWithGoogle()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-100 shadow-xl backdrop-blur-xl">
      <div className="pointer-events-none absolute -top-20 right-0 h-40 w-40 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />

      <h2 className="relative text-2xl font-semibold text-center text-white">Sign in with Google</h2>

      <p className="mt-3 text-sm text-center text-slate-300">
        Sign in with your Google account to request access. An administrator must approve your account before you can generate images or store content.
      </p>

      {error && (
        <div className="relative mt-4 rounded-2xl border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      <button
        onClick={handleGoogleLogin}
        disabled={isSubmitting}
        className="relative mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/30 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-50"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        {isSubmitting ? 'Signing in…' : 'Continue with Google'}
      </button>

      <div className="relative mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
        <p className="font-semibold uppercase tracking-[0.3em] text-sky-100">Admin approval required</p>
        <p className="mt-2 text-slate-300">
          After signing in, your request will be sent to the admin team. You will gain full access as soon as your account is approved.
        </p>
      </div>
    </div>
  )
}
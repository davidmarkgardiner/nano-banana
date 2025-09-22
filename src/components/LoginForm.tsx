'use client'

import { FormEvent, useState } from 'react'

import { useAuth } from '@/context/AuthContext'

type AuthMode = 'login' | 'register'

export default function LoginForm() {
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false)

  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth()

  const handleGoogleLogin = async () => {
    try {
      setError('')
      setIsGoogleSubmitting(true)
      await loginWithGoogle()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred'
      setError(message)
    } finally {
      setIsGoogleSubmitting(false)
    }
  }

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      setError('')
      setIsEmailSubmitting(true)

      if (authMode === 'login') {
        await loginWithEmail(email, password)
      } else {
        await registerWithEmail(email, password, displayName || undefined)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred'
      setError(message)
    } finally {
      setIsEmailSubmitting(false)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-100 shadow-xl backdrop-blur-xl">
      <div className="pointer-events-none absolute -top-20 right-0 h-40 w-40 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />

      <h2 className="relative text-2xl font-semibold text-center text-white">Access the Nano Banana toolkit</h2>

      <p className="mt-3 text-sm text-center text-slate-300">
        Sign in with Google or continue with your email and password to request access. An administrator must approve every account before you can generate images or store content.
      </p>

      {error && (
        <div className="relative mt-4 rounded-2xl border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      <button
        onClick={handleGoogleLogin}
        disabled={isGoogleSubmitting || isEmailSubmitting}
        className="relative mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/30 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-50"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        {isGoogleSubmitting ? 'Signing in…' : 'Continue with Google'}
      </button>

      <div className="relative mt-6 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-400">
        <span className="h-px flex-1 bg-white/10" />
        Or continue with email
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={handleEmailSubmit} className="relative mt-6 space-y-4">
        <div className="flex rounded-full border border-white/10 bg-white/10 p-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login')
              setError('')
            }}
            className={`flex-1 rounded-full px-4 py-2 transition ${
              authMode === 'login'
                ? 'bg-slate-900/60 text-white shadow-inner shadow-sky-500/20'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register')
              setError('')
            }}
            className={`flex-1 rounded-full px-4 py-2 transition ${
              authMode === 'register'
                ? 'bg-slate-900/60 text-white shadow-inner shadow-sky-500/20'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Create account
          </button>
        </div>

        {authMode === 'register' && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100" htmlFor="displayName">
              Name (optional)
            </label>
            <input
              id="displayName"
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Ada Lovelace"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
            />
          </div>
        )}

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter a secure password"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={isGoogleSubmitting || isEmailSubmitting}
          className="mt-2 w-full rounded-full border border-white/20 bg-sky-500/80 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-50"
        >
          {isEmailSubmitting
            ? authMode === 'login'
              ? 'Signing in…'
              : 'Creating account…'
            : authMode === 'login'
              ? 'Sign in with email'
              : 'Create account'}
        </button>
      </form>

      <div className="relative mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
        <p className="font-semibold uppercase tracking-[0.3em] text-sky-100">Admin approval required</p>
        <p className="mt-2 text-slate-300">
          After signing in, your request will be sent to the admin team. You will gain full access as soon as your account is approved.
        </p>
      </div>
    </div>
  )
}
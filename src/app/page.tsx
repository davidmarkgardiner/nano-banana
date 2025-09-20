'use client'

import { useAuth } from '@/context/AuthContext'
import LoginForm from '@/components/LoginForm'
import ImageGenerator from '@/components/ImageGenerator'
import FirestoreDemo from '@/components/FirestoreDemo'
import UserProfile from '@/components/UserProfile'
import PendingApprovalNotice from '@/components/PendingApprovalNotice'

const features = [
  {
    icon: '🔐',
    title: 'Authentication Flows',
    description:
      'Google sign-in with admin approvals keeps the canvas secure without managing local passwords or accounts.',
  },
  {
    icon: '🎨',
    title: 'AI Image Generation',
    description:
      'Generate beautiful images from text prompts using the nano banana API with real-time feedback and loading states.',
  },
  {
    icon: '🗄️',
    title: 'Firestore Data Layer',
    description:
      'Realtime examples for persisting and querying data with Firestore using secure rules and optimistic UI patterns.',
  },
  {
    icon: '⚡',
    title: 'Live Updates',
    description:
      'Designed for reactive features with hooks that keep your UI in sync with Firebase in milliseconds.',
  },
]

export default function Home() {
  const { user, loading, logout, approvalStatus, approvalLoading } = useAuth()

  const isApproved = Boolean(user && approvalStatus === 'approved')
  const awaitingApproval = Boolean(user && approvalStatus !== 'approved')

  if (loading || approvalLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Checking your access…</p>
        </div>
      </main>
    )
  }

  const wrapperClassName = [
    'relative mx-auto flex max-w-6xl flex-col px-6 pb-24 lg:px-12',
    isApproved ? 'pt-16' : 'pt-24'
  ].join(' ')

  const statusItems = [
    {
      label: 'Authentication',
      detail: approvalLoading
        ? 'Verifying…'
        : isApproved
          ? 'Approved'
          : user
            ? 'Awaiting approval'
            : 'Google sign-in ready',
    },
    {
      label: 'Firestore',
      detail: isApproved ? 'Synced' : 'Requires approval',
    },
    {
      label: 'AI Generation',
      detail: isApproved ? 'Ready' : 'Locked',
    },
    {
      label: 'Hosting',
      detail: 'Ready to deploy',
    },
  ]

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-[460px] w-[460px] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-[420px] w-[420px] rounded-full bg-purple-500/20 blur-3xl" />
      </div>

      {isApproved && user && <ImageGenerator user={user} onLogout={logout} />}

      <div className={wrapperClassName}>
        {!user && (
          <section className="text-center">
            <span className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-sky-200">
              🍌 Nano Banana AI
            </span>
            <h1 className="mt-8 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              Bring your ideas to life with the Nano Banana AI canvas
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300 sm:text-xl">
              Sign in with Google to describe your dream scene and watch the generator fill the screen with rich, download-ready artwork in seconds.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <a
                href="#auth"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition-transform hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-500/40"
              >
                Request access
              </a>
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-slate-200 transition-transform hover:-translate-y-1 hover:border-white/40 hover:text-white"
              >
                Explore the toolkit
              </a>
            </div>
          </section>
        )}

        <section
          id="features"
          className={`${isApproved ? 'mt-16' : 'mt-20'} grid gap-6 sm:grid-cols-2 xl:grid-cols-4`}
        >
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 text-left text-slate-100 shadow-xl backdrop-blur-xl transition-transform hover:-translate-y-1 hover:border-white/30 hover:bg-white/10"
            >
              <div className="absolute -top-12 right-0 h-32 w-32 rounded-full bg-sky-500/20 blur-2xl transition duration-500 group-hover:scale-150" />
              <div className="relative flex h-full flex-col">
                <span className="text-3xl">{feature.icon}</span>
                <h3 className="mt-6 text-xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm text-slate-300">{feature.description}</p>
              </div>
            </article>
          ))}
        </section>

        <section id="auth" className="mt-24">
          {!user ? (
            <div className="mx-auto max-w-2xl">
              <LoginForm />
            </div>
          ) : awaitingApproval ? (
            <div className="mx-auto max-w-3xl">
              <PendingApprovalNotice />
            </div>
          ) : (
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <div className="space-y-8">
                <UserProfile />
              </div>
              <FirestoreDemo />
            </div>
          )}
        </section>

        <section className="mt-24">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-10 text-center shadow-2xl backdrop-blur-2xl">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-sky-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 right-10 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="relative mx-auto max-w-4xl">
              <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-sky-100">
                Authentication + AI Generation
              </span>
              <h2 className="mt-6 text-3xl font-semibold text-white sm:text-4xl">
                Powerful building blocks for your AI-powered app
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300">
                Secure Google authentication, admin-reviewed access, AI image generation, and Firestore data storage with instant feedback. Everything is wired for rapid iteration and beautiful user experiences.
              </p>
              <dl className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-2 max-w-3xl mx-auto">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-200">
                  <dt className="text-sm font-semibold uppercase tracking-wide text-sky-200">AI-Powered</dt>
                  <dd className="mt-2 text-sm text-slate-300">Generate beautiful images from text prompts with real-time feedback and error handling.</dd>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-200">
                  <dt className="text-sm font-semibold uppercase tracking-wide text-sky-200">Firebase best practices</dt>
                  <dd className="mt-2 text-sm text-slate-300">Typed hooks, modular SDK usage, and production-ready patterns built in from the start.</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <section className="mt-24">
          <div className="relative overflow-hidden rounded-3xl border border-emerald-400/30 bg-gradient-to-r from-emerald-400/10 via-emerald-400/5 to-emerald-400/10 p-8 text-center shadow-2xl backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(74,222,128,0.22),transparent_60%)]" />
            <div className="relative flex flex-col items-center gap-6 lg:flex-row lg:justify-between">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-400" />
                <p className="text-sm font-semibold uppercase tracking-[0.4em] text-emerald-100">Live status</p>
              </div>
              <h3 className="text-2xl font-semibold text-white">
                🍌 Nano Banana AI ready to generate amazing images
              </h3>
              <div className="flex flex-wrap justify-center gap-4">
                {statusItems.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100"
                  >
                    {item.label}: {item.detail}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

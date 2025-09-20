'use client'

import { useAuth } from '@/context/AuthContext'
import LoginForm from '@/components/LoginForm'
import UserProfile from '@/components/UserProfile'
import FirestoreDemo from '@/components/FirestoreDemo'

const features = [
  {
    icon: '🔐',
    title: 'Authentication Flows',
    description:
      'Email/password accounts with Google sign-in ready to wire up so you can focus on your product onboarding.',
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
  {
    icon: '🚀',
    title: 'Deployment Ready',
    description:
      'Ship to Firebase Hosting with confidence using production configs and automated tooling baked in.',
  },
]

const statusItems = [
  {
    label: 'Authentication',
    detail: 'Connected',
  },
  {
    label: 'Firestore',
    detail: 'Synced',
  },
  {
    label: 'Hosting',
    detail: 'Ready to deploy',
  },
]

export default function Home() {
  const { user } = useAuth()

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-[460px] w-[460px] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-[420px] w-[420px] rounded-full bg-purple-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 pb-24 pt-24 lg:px-12">
        <section className="text-center">
          <span className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-sky-200">
            Firebase Starter Kit
          </span>
          <h1 className="mt-8 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            Launch modern experiences with Firebase and Next.js
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300 sm:text-xl">
            Crafted hero sections, authentication flows, and Firestore demos give you a clean slate to build delightful, real-time applications without the boilerplate.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href="#auth"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition-transform hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-500/40"
            >
              Get started now
            </a>
            <a
              href="#features"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-slate-200 transition-transform hover:-translate-y-1 hover:border-white/40 hover:text-white"
            >
              Explore the stack
            </a>
          </div>
        </section>

        <section id="features" className="mt-20 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
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

        <section id="auth" className="mt-24 grid gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-10 text-left shadow-2xl backdrop-blur-2xl">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-sky-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 right-10 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="relative">
              <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-sky-100">
                Authentication + Data
              </span>
              <h2 className="mt-6 text-3xl font-semibold text-white sm:text-4xl">
                Powerful building blocks to jump-start your Firebase app
              </h2>
              <p className="mt-4 max-w-xl text-base text-slate-300">
                Swap between login and sign-up flows, explore Firestore messaging, and manage user sessions with instant feedback. Everything is wired for rapid iteration.
              </p>
              <dl className="mt-10 grid gap-6 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-200">
                  <dt className="text-sm font-semibold uppercase tracking-wide text-sky-200">Session aware</dt>
                  <dd className="mt-2 text-sm text-slate-300">Reactive UI updates keep authentication and Firestore views perfectly in sync.</dd>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-200">
                  <dt className="text-sm font-semibold uppercase tracking-wide text-sky-200">Firebase best practices</dt>
                  <dd className="mt-2 text-sm text-slate-300">Typed hooks, modular SDK usage, and production-ready patterns built in from the start.</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="space-y-8">
            {!user ? (
              <LoginForm />
            ) : (
              <>
                <UserProfile />
                <FirestoreDemo />
              </>
            )}
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
                Firebase connected and ready to power your next idea
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

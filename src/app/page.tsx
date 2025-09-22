'use client'

import Link from 'next/link'

import { useAuth } from '@/context/AuthContext'
import LoginForm from '@/components/LoginForm'
import ImageGenerator from '@/components/ImageGenerator'
import FirestoreDemo from '@/components/FirestoreDemo'
import UserProfile from '@/components/UserProfile'
import PendingApprovalNotice from '@/components/PendingApprovalNotice'
import ChatBotWidget from '@/components/ChatBotWidget'

const features = [
  {
    icon: '🔐',
    title: 'Authentication Flows',
    description:
      'Google or email sign-in with admin approvals keeps the canvas secure without managing unreviewed accounts.',
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

const heroHighlights = [
  {
    icon: '✨',
    label: 'Glassmorphism UI with atmospheric gradients ready for branding.',
  },
  {
    icon: '🔐',
    label: 'Admin-gated authentication in minutes with Google or email options.',
  },
  {
    icon: '⚡',
    label: 'Realtime Firestore sync and streaming AI output for instant feedback.',
  },
]

const heroStats = [
  { label: 'Image resolution', value: '1024px HD' },
  { label: 'Prompt presets', value: '25+ ready-to-use' },
  { label: 'Framework', value: 'Next.js 15 + Firebase' },
]

const workflowSteps = [
  {
    number: '01',
    title: 'Request access',
    description: 'Sign in with Google or email and automatically route approvals to your admin workspace.',
    accent: 'from-sky-500/20 via-sky-500/10 to-transparent',
  },
  {
    number: '02',
    title: 'Generate & remix',
    description: 'Craft prompts, remix outputs with Nano Banana edits, and apply creative filters instantly.',
    accent: 'from-fuchsia-500/20 via-fuchsia-500/10 to-transparent',
  },
  {
    number: '03',
    title: 'Launch with confidence',
    description: 'Persist data to Firestore, sync UI state in realtime, and deploy with production-ready hosting.',
    accent: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
  },
]

const workflowHighlights = [
  'Guided prompt inspiration and Nano Banana remix tools.',
  'Secure Firestore reads & writes with typed hooks.',
  'Playwright demos and scripts to keep shipping velocity high.',
]

const featureAccentClasses = [
  'from-sky-400/30 via-sky-400/10 to-transparent',
  'from-violet-500/30 via-violet-500/10 to-transparent',
  'from-amber-500/30 via-amber-500/10 to-transparent',
  'from-emerald-500/30 via-emerald-500/10 to-transparent',
]

const capabilityHighlights = [
  {
    title: 'AI-powered creation',
    description: 'Generate vivid images with live streaming feedback, retries, and graceful error recovery built in.',
  },
  {
    title: 'Firebase best practices',
    description: 'Modular SDK usage, granular security rules, and optimistic UI patterns wired for production.',
  },
  {
    title: 'Team ready workflows',
    description: 'Admin approvals, audit-friendly user summaries, and shareable assets for cross-functional teams.',
  },
  {
    title: 'Developer tooling',
    description: 'Playwright tests, CLI utilities, and environment scripts to keep shipping velocity high.',
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
    'relative mx-auto flex w-full max-w-7xl flex-col px-6 pb-24 lg:px-12',
    isApproved ? 'pt-12' : 'pt-20',
  ].join(' ')

  const getStatusChipClasses = (detail: string) => {
    if (/Approved|Synced|Ready|Live/i.test(detail)) {
      return 'border border-emerald-400/40 bg-emerald-400/10 text-emerald-100'
    }
    if (/Awaiting|Locked|Requires|Pending/i.test(detail)) {
      return 'border border-amber-400/40 bg-amber-400/10 text-amber-100'
    }
    if (/Verifying|Checking/i.test(detail)) {
      return 'border border-sky-400/40 bg-sky-400/10 text-sky-100'
    }
    return 'border border-white/10 bg-white/5 text-slate-200'
  }

  const statusItems = [
    {
      label: 'Authentication',
      detail: approvalLoading
        ? 'Verifying…'
        : isApproved
          ? 'Approved'
          : user
            ? 'Awaiting approval'
            : 'Email or Google sign-in ready',
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(168,85,247,0.12),transparent_60%)]" />
        <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-[460px] w-[460px] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-[420px] w-[420px] rounded-full bg-purple-500/20 blur-3xl" />
      </div>

      <header className="relative z-20">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-6 lg:px-12">
          <Link href="/" className="group inline-flex items-center gap-3 text-slate-200">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-500 text-xl shadow-lg shadow-sky-500/30 transition-transform group-hover:-translate-y-0.5">
              🍌
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-200">Nano Banana</span>
              <span className="text-base font-semibold text-white">Creative AI toolkit</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#workflow" className="transition hover:text-white">
              Workflow
            </a>
            <a href="#auth" className="transition hover:text-white">
              Access
            </a>
            <a href="#live-status" className="transition hover:text-white">
              Status
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span
                  className={`hidden items-center gap-2 rounded-full px-4 py-2 text-xs font-medium sm:inline-flex ${getStatusChipClasses(statusItems[0].detail)}`}
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {statusItems[0].detail}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    void logout()
                  }}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-500/40"
                >
                  Sign out
                </button>
              </>
            ) : (
              <a
                href="#auth"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-500/40"
              >
                Request access
              </a>
            )}
          </div>

          <nav className="flex w-full items-center justify-between text-xs text-slate-300 md:hidden">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#workflow" className="transition hover:text-white">
              Workflow
            </a>
            <a href="#auth" className="transition hover:text-white">
              Access
            </a>
            <a href="#live-status" className="transition hover:text-white">
              Status
            </a>
          </nav>
        </div>
      </header>

      {isApproved && user && <ImageGenerator user={user} onLogout={logout} />}

      <div className={wrapperClassName}>
        {!user && (
          <section className="relative overflow-hidden rounded-[42px] border border-white/10 bg-white/5 px-8 py-12 shadow-2xl backdrop-blur-xl lg:px-12 lg:py-16">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),transparent_55%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(168,85,247,0.16),transparent_55%)]" />

            <div className="relative grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <div className="flex flex-col gap-8">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-sky-200">
                    Beta access open
                  </span>
                  <h1 className="mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                    Bring your ideas to life with the Nano Banana AI canvas
                  </h1>
                  <p className="mt-4 max-w-xl text-base text-slate-300 sm:text-lg">
                    Sign in with Google or email to describe your dream scene and watch the generator fill the screen with rich, download-ready artwork in seconds.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href="#auth"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-500/40"
                  >
                    <span>Request access</span>
                    <span className="text-lg">→</span>
                  </a>
                  <a
                    href="#features"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:-translate-y-1 hover:border-white/40 hover:text-white"
                  >
                    Explore the toolkit
                  </a>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {heroHighlights.map((item) => (
                    <div
                      key={item.label}
                      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/40 p-5 transition-transform hover:-translate-y-1"
                    >
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <div className="relative flex items-start gap-3">
                        <span className="text-lg">{item.icon}</span>
                        <p className="text-sm text-slate-200">{item.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <dl className="grid gap-6 sm:grid-cols-3">
                  {heroStats.map((stat) => (
                    <div key={stat.label} className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
                      <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100">{stat.label}</dt>
                      <dd className="mt-3 text-lg font-semibold text-white">{stat.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="relative">
                <div className="absolute -inset-6 rounded-[38px] bg-gradient-to-br from-sky-500/20 via-purple-500/10 to-transparent blur-3xl" />
                <div className="relative h-full rounded-[32px] border border-white/10 bg-slate-950/60 p-8 shadow-2xl backdrop-blur-3xl">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-100">Access pipeline</p>
                      <h3 className="mt-3 text-xl font-semibold text-white">Status overview</h3>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
                      Live
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-slate-300">
                    Your workspace is pre-configured with authentication, Firestore, and AI generation. Sign in to unlock the full canvas.
                  </p>
                  <div className="mt-8 space-y-3">
                    {statusItems.map((item) => (
                      <div
                        key={item.label}
                        className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-all ${getStatusChipClasses(item.detail)}`}
                      >
                        <span className="text-slate-100">{item.label}</span>
                        <span>{item.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <section id="features" className={`${isApproved ? 'mt-16' : 'mt-20'} scroll-mt-24`}>
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-sky-200">
              Product pillars
            </span>
            <h2 className="mt-6 text-3xl font-semibold text-white sm:text-4xl">
              Everything you need to ship a polished AI experience
            </h2>
            <p className="mt-4 text-base text-slate-300">
              The Nano Banana toolkit blends authentication, AI image generation, and Firestore into one cohesive canvas with delightful UI accents.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, index) => {
              const accent = featureAccentClasses[index % featureAccentClasses.length]

              return (
                <article
                  key={feature.title}
                  className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-7 text-left text-slate-100 shadow-xl backdrop-blur-xl transition-transform hover:-translate-y-1 hover:border-white/30 hover:bg-white/10"
                >
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
                  <div className="relative flex h-full flex-col gap-5">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/60 text-2xl shadow-inner shadow-black/20">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                    <p className="text-sm text-slate-300">{feature.description}</p>
                    <div className="mt-auto flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-sky-200 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      Learn more
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section id="workflow" className="mt-24 scroll-mt-24">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="flex flex-col gap-8 rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur-xl">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-sky-200">
                  Workflow
                </span>
                <h2 className="mt-5 text-3xl font-semibold text-white sm:text-4xl">
                  A guided path from first prompt to production
                </h2>
                <p className="mt-4 text-sm text-slate-300 sm:text-base">
                  Follow a polished journey with ready-to-use approvals, AI tooling, and data storage. Each step includes UI patterns you can drop into your own product.
                </p>
              </div>
              <ul className="space-y-3 text-sm text-slate-300">
                {workflowHighlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-sky-300" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
              <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-6 text-sm text-slate-300">
                <p>
                  Use the flow as-is or remix the components. Everything is responsive, accessible, and ready for branding tweaks.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {workflowSteps.map((step) => (
                <div
                  key={step.title}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-7 shadow-xl backdrop-blur-xl transition-transform hover:-translate-y-1"
                >
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${step.accent} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
                  <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/60 text-sm font-semibold uppercase tracking-[0.3em] text-sky-200">
                      {step.number}
                    </span>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-white sm:text-xl">{step.title}</h3>
                      <p className="text-sm text-slate-300">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="auth" className="mt-24 scroll-mt-24">
          <div className="relative overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-br from-slate-950/90 via-slate-900 to-slate-950 px-6 py-12 shadow-2xl lg:px-12">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.2),transparent_65%)]" />
            <div className="pointer-events-none absolute inset-x-10 bottom-0 h-48 bg-[radial-gradient(circle_at_bottom,_rgba(99,102,241,0.18),transparent_65%)]" />

            <div className="relative mx-auto max-w-4xl text-center">
              <span className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-sky-200">
                Access flow
              </span>
              <h2 className="mt-6 text-3xl font-semibold text-white sm:text-4xl">Secure sign-in and review process</h2>
              <p className="mt-4 text-sm text-slate-300 sm:text-base">
                Flexible authentication (Google or email), admin approvals, and Firestore demos are ready the moment you join. Choose your path below.
              </p>
            </div>

            <div className="relative mt-12">
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
            </div>
          </div>
        </section>

        <section className="mt-24">
          <div className="relative overflow-hidden rounded-[40px] border border-white/10 bg-white/5 p-10 text-center shadow-2xl backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),transparent_60%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(129,140,248,0.16),transparent_65%)]" />
            <div className="relative mx-auto max-w-4xl">
              <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-sky-100">
                Authentication + AI Generation
              </span>
              <h2 className="mt-6 text-3xl font-semibold text-white sm:text-4xl">
                Powerful building blocks for your AI-powered app
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300">
                Secure authentication with Google or email, admin-reviewed access, AI image generation, and Firestore data storage with instant feedback. Everything is wired for rapid iteration and beautiful user experiences.
              </p>
              <dl className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {capabilityHighlights.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left text-slate-200 transition hover:border-white/30 hover:bg-white/10"
                  >
                    <dt className="text-sm font-semibold uppercase tracking-wide text-sky-200">{item.title}</dt>
                    <dd className="mt-3 text-sm text-slate-300">{item.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section id="live-status" className="mt-24 scroll-mt-24">
          <div className="relative overflow-hidden rounded-[40px] border border-emerald-400/30 bg-gradient-to-br from-emerald-400/10 via-emerald-400/5 to-emerald-400/10 p-8 text-center shadow-2xl backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),transparent_60%)]" />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl text-left">
                <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.4em] text-emerald-100">
                  <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-400" />
                  Live status
                </div>
                <h3 className="mt-4 text-2xl font-semibold text-white lg:text-3xl">
                  🍌 Nano Banana AI is primed to generate amazing images
                </h3>
                <p className="mt-3 text-sm text-emerald-100/80">
                  Every layer—auth, Firestore, hosting, and AI—is wired up and ready when you are.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {statusItems.map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium ${getStatusChipClasses(item.detail)}`}
                  >
                    <span className="text-slate-100">{item.label}</span>
                    <span>{item.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <ChatBotWidget />
    </main>
  )
}

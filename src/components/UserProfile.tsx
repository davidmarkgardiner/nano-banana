'use client'

import { Timestamp } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'

const providerLabels: Record<string, string> = {
  'google.com': 'Google',
  password: 'Email & Password',
  'facebook.com': 'Facebook',
  'github.com': 'GitHub',
  'twitter.com': 'X',
}

const formatDate = (value?: string | null) => {
  if (!value) return 'Not available'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

const formatUid = (uid: string) => {
  if (uid.length <= 12) return uid
  return `${uid.slice(0, 6)}…${uid.slice(-4)}`
}

const formatTimestamp = (value?: Timestamp | null) => {
  if (!value) return 'Pending'

  const date = value.toDate()
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export default function UserProfile() {
  const { user, approvalStatus, approvalRecord } = useAuth()
  const [sessionIdCopied, setSessionIdCopied] = useState(false)

  if (!user) return null

  const primaryProvider = user.providerData
    ?.map((profile) => providerLabels[profile.providerId] || profile.providerId)
    .filter(Boolean)
    .join(', ')
    || 'Google'

  const accountCreated = formatDate(user.metadata?.creationTime)
  const lastLogin = formatDate(user.metadata?.lastSignInTime)
  const sessionId = formatUid(user.uid)
  const verificationCopy = user.emailVerified ? 'Email verified' : 'Verification pending'

  const approvalCopy =
    approvalStatus === 'approved'
      ? 'Admin approved'
      : approvalStatus === 'rejected'
        ? 'Approval rejected'
        : 'Waiting for admin approval'

  const approvalTone = (() => {
    if (approvalStatus === 'approved') return 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
    if (approvalStatus === 'rejected') return 'border border-rose-400/30 bg-rose-500/10 text-rose-100'
    return 'border border-amber-400/30 bg-amber-400/10 text-amber-200'
  })()

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-100 shadow-xl backdrop-blur-xl">
      <div className="pointer-events-none absolute -top-24 left-8 h-48 w-48 rounded-full bg-sky-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 right-0 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl" />

      <div className="relative">
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-sky-100">
          Account overview
        </span>
        <h2 className="mt-4 text-2xl font-semibold text-white">Your access summary</h2>
        <p className="mt-2 text-sm text-slate-200/80">
          Here&rsquo;s a quick snapshot of your session and approval status so you can plan your next masterpiece.
        </p>

        <dl className="mt-8 grid gap-4 text-sm text-slate-200 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100">Member since</dt>
            <dd className="mt-2 text-sm text-slate-100">{accountCreated}</dd>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100">Last sign-in</dt>
            <dd className="mt-2 text-sm text-slate-100">{lastLogin}</dd>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100">Sign-in method</dt>
            <dd className="mt-2 text-sm text-slate-100">{primaryProvider}</dd>
          </div>

          <div 
            className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 cursor-pointer transition-all duration-300 hover:border-sky-400/50 hover:bg-slate-800/60 hover:shadow-lg hover:shadow-sky-500/20 group relative overflow-hidden"
            onClick={() => {
              navigator.clipboard.writeText(user.uid)
              setSessionIdCopied(true)
              setTimeout(() => setSessionIdCopied(false), 2000)
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-sky-400/10 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_ease-in-out] transition-all duration-300" />
            <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100 flex items-center gap-2">
              <span className="animate-sparkle">✨</span>
              Session ID
              <span className="animate-sparkle animation-delay-100">💎</span>
            </dt>
            <dd className="mt-2 text-sm text-slate-100 font-mono tracking-wider group-hover:text-sky-200 transition-colors duration-200">
              {sessionId}
              {sessionIdCopied && (
                <span className="ml-2 text-xs text-emerald-300 animate-pulse">Copied!</span>
              )}
            </dd>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="text-xs text-sky-300">📋 Click to copy</span>
            </div>
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] ${approvalTone}`}>
            <span className="h-2 w-2 rounded-full bg-current" />
            {approvalCopy}
          </div>

          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] ${user.emailVerified ? 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border border-amber-400/30 bg-amber-400/10 text-amber-200'}`}>
            <span className="h-2 w-2 rounded-full bg-current" />
            {verificationCopy}
          </div>

          {user.email && (
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200">
              <span className="text-slate-100/80">Primary email</span>
              <span className="font-medium text-white/90">{user.email}</span>
            </div>
          )}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/60 via-slate-900/30 to-transparent p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100">Approval timeline</p>
            <ul className="mt-3 space-y-3 text-sm text-slate-200/80">
              <li>
                <span className="text-slate-100">Requested:</span> {formatTimestamp(approvalRecord?.requestedAt)}
              </li>
              <li>
                <span className="text-slate-100">Last updated:</span> {formatTimestamp(approvalRecord?.updatedAt)}
              </li>
              {approvalRecord?.approvedBy && (
                <li>
                  <span className="text-slate-100">Approved by:</span> {approvalRecord.approvedBy}
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/60 via-slate-900/30 to-transparent p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100">Pro tips</p>
            <ul className="mt-3 space-y-3 text-sm text-slate-200/80">
              <li>Mix descriptive lighting, textures, and emotions into prompts for ultra-vivid renders.</li>
              <li>Save standout prompts locally so you can reuse them after signing back in.</li>
              <li>Experiment with the Firestore demo beside you to persist prompt ideas in real time.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

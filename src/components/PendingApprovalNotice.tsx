'use client'

import { useMemo } from 'react'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'

const formatTimestamp = (value?: Timestamp | null) => {
  if (!value) return 'Not recorded yet'

  try {
    return value.toDate().toLocaleString()
  } catch (error) {
    console.warn('Unable to format timestamp', error)
    return 'Not recorded yet'
  }
}

export default function PendingApprovalNotice() {
  const { user, approvalStatus, approvalLoading, approvalRecord, approvalError, refreshApprovalStatus, logout } = useAuth()

  const statusDescription = useMemo(() => {
    if (approvalStatus === 'rejected') {
      return 'Your access request was rejected. Contact the administrator if you believe this is a mistake.'
    }

    return 'Thanks for signing in! Your request has been sent to the admin team. You will gain full access once your account is approved.'
  }, [approvalStatus])

  if (!user) {
    return null
  }

  const statusLabel = approvalStatus === 'rejected' ? 'Access denied' : 'Awaiting admin approval'
  const statusTone = approvalStatus === 'rejected'
    ? 'border-rose-400/40 bg-rose-500/10 text-rose-100'
    : 'border-amber-400/40 bg-amber-500/10 text-amber-100'

  const canRefresh = approvalStatus !== 'rejected'

  const handleRefresh = async () => {
    if (canRefresh) {
      await refreshApprovalStatus()
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-100 shadow-xl backdrop-blur-xl">
      <div className="pointer-events-none absolute -top-20 right-10 h-40 w-40 rounded-full bg-amber-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-sky-500/20 blur-3xl" />

      <div className="relative space-y-6">
        <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] ${statusTone}`}>
          <span className="h-2 w-2 rounded-full bg-current" />
          {statusLabel}
        </span>

        <div>
          <h2 className="text-2xl font-semibold text-white">Access pending</h2>
          <p className="mt-2 text-sm text-slate-200/80">{statusDescription}</p>
        </div>

        {approvalError && (
          <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm text-rose-100">
            {approvalError}
          </div>
        )}

        <dl className="grid gap-4 text-sm text-slate-200 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100">Signed in as</dt>
            <dd className="mt-2 text-sm text-slate-100">{user.email || 'Unknown email'}</dd>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100">Request submitted</dt>
            <dd className="mt-2 text-sm text-slate-100">{formatTimestamp(approvalRecord?.requestedAt)}</dd>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100">Latest update</dt>
            <dd className="mt-2 text-sm text-slate-100">{formatTimestamp(approvalRecord?.updatedAt)}</dd>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100">Status</dt>
            <dd className="mt-2 text-sm capitalize text-slate-100">{approvalStatus}</dd>
          </div>
        </dl>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={!canRefresh || approvalLoading}
            className="flex-1 rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/30 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {approvalLoading ? 'Checking…' : 'Check for approval'}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

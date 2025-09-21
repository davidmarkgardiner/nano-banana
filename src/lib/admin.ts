const DEFAULT_ADMIN_EMAILS = ['davidmarkgardiner@gmail.com']

const parseAdminEmails = (): string[] => {
  const raw = process.env.NEXT_PUBLIC_FIREBASE_ADMIN_EMAILS

  if (!raw || raw.trim().length === 0) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        'NEXT_PUBLIC_FIREBASE_ADMIN_EMAILS is not set. Falling back to default admin email(s). Update your environment variables before deploying.'
      )
    }
    return DEFAULT_ADMIN_EMAILS
  }

  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0)
}

const adminEmailList = parseAdminEmails()
const adminEmailSet = new Set(adminEmailList)

export const ADMIN_EMAILS = adminEmailList

export const isAdminEmail = (email?: string | null): boolean => {
  if (!email) return false
  return adminEmailSet.has(email.trim().toLowerCase())
}

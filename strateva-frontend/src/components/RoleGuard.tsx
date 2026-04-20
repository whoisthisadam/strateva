import type { ReactNode } from 'react'
import { useAuth } from '@/auth/useAuth'
import type { Role } from '@/auth/types'
import { strings } from '@/lib/strings'

interface RoleGuardProps {
  allow: readonly Role[]
  fallback?: ReactNode
  children: ReactNode
}

export function RoleGuard({ allow, fallback, children }: RoleGuardProps) {
  const { user } = useAuth()
  if (!user) return null
  if (!allow.includes(user.role)) {
    return (
      fallback ?? (
        <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-800">
          {strings.errors.forbidden}
        </div>
      )
    )
  }
  return <>{children}</>
}

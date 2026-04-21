import type { ReactNode } from 'react'
import { useAuth } from '@/auth/useAuth'
import type { Role } from '@/auth/types'

interface RoleGuardProps {
  allow: readonly Role[]
  fallback?: ReactNode
  children: ReactNode
}

/**
 * Silent role gate: renders `children` only when the current user's role is
 * in `allow`. Otherwise renders `fallback` (default `null`) — the element is
 * omitted from the DOM rather than replaced with an error message. For
 * route-level redirects use `RequireRole` instead.
 */
export function RoleGuard({ allow, fallback = null, children }: RoleGuardProps) {
  const { user } = useAuth()
  if (!user) return null
  if (!allow.includes(user.role)) return <>{fallback}</>
  return <>{children}</>
}

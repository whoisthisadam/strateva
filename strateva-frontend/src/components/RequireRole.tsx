import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import type { Role } from '@/auth/types'

interface RequireRoleProps {
  allow: readonly Role[]
  redirectTo?: string
  children: ReactNode
}

/**
 * Route-level silent authorization: if the current user's role is not in
 * `allow`, redirect to `redirectTo` (default `/`) instead of rendering a
 * forbidden message. For inline element gating use `RoleGuard`.
 */
export function RequireRole({ allow, redirectTo = '/', children }: RequireRoleProps) {
  const { user } = useAuth()
  if (!user) return null
  if (!allow.includes(user.role)) return <Navigate to={redirectTo} replace />
  return <>{children}</>
}

import type { Page } from '@/types/goals'

export const AUDIT_ACTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN_SUCCESS',
  'LOGIN_FAILURE',
] as const

export type AuditAction = (typeof AUDIT_ACTIONS)[number]

/**
 * Read-only projection returned by GET /api/v1/audit. Mirrors
 * {@code com.strateva.audit.web.AuditLogView} on the backend.
 */
export interface AuditLogViewDto {
  id: string
  action: AuditAction
  entityType: string
  entityId: string | null
  actor: string
  message: string | null
  diff: string | null
  createdAt: string
}

export interface AuditLogFilters {
  entityType?: string
  entityId?: string
  performedBy?: string
  from?: string
  to?: string
  page?: number
  size?: number
}

export type AuditLogPage = Page<AuditLogViewDto>

import { http } from '@/lib/http'
import type { AuditLogFilters, AuditLogPage } from '@/types/admin'

/**
 * Pulls a paginated slice of the audit log. All filters are optional and
 * forwarded as query params to GET /api/v1/audit — Spring Data binds
 * unknown params away, so we can always send the full set.
 */
export async function listAuditLog(filters: AuditLogFilters = {}): Promise<AuditLogPage> {
  const params: Record<string, string | number> = {}
  if (filters.entityType && filters.entityType.trim().length > 0) {
    params.entityType = filters.entityType.trim()
  }
  if (filters.entityId && filters.entityId.trim().length > 0) {
    params.entityId = filters.entityId.trim()
  }
  if (filters.performedBy && filters.performedBy.trim().length > 0) {
    params.performedBy = filters.performedBy.trim()
  }
  if (filters.from) params.from = filters.from
  if (filters.to) params.to = filters.to
  if (typeof filters.page === 'number') params.page = filters.page
  if (typeof filters.size === 'number') params.size = filters.size
  const { data } = await http.get<AuditLogPage>('/v1/audit', { params })
  return data
}

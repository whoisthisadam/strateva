import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { listAuditLog } from '@/features/admin/adminApi'
import type { AuditLogFilters } from '@/types/admin'

const AUDIT_KEY = ['admin', 'audit'] as const

export function useAuditLog(filters: AuditLogFilters, enabled = true) {
  return useQuery({
    queryKey: [...AUDIT_KEY, filters],
    queryFn: () => listAuditLog(filters),
    enabled,
    placeholderData: keepPreviousData,
  })
}

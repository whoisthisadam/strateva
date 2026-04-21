import { http } from '@/lib/http'
import type { Role } from '@/auth/types'
import type { UserSummaryDto } from '@/types/users'

export async function listUsers(role?: Role): Promise<UserSummaryDto[]> {
  const params: Record<string, string> = {}
  if (role) params.role = role
  const { data } = await http.get<UserSummaryDto[]>('/v1/users', { params })
  return data
}

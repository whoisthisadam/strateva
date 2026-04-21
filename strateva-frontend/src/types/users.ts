import type { Role } from '@/auth/types'

export interface UserSummaryDto {
  id: string
  username: string
  fullName: string
  role: Role
}

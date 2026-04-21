import { useQuery } from '@tanstack/react-query'
import type { Role } from '@/auth/types'
import { listUsers } from '@/features/users/usersApi'

const USERS_KEY = ['users'] as const

export function useUsersList(role?: Role, enabled = true) {
  return useQuery({
    queryKey: [...USERS_KEY, 'list', role ?? 'all'],
    queryFn: () => listUsers(role),
    enabled,
  })
}

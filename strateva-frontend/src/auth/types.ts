export const ROLES = ['PROJECT_MANAGER', 'BUSINESS_ANALYST', 'EMPLOYEE'] as const
export type Role = (typeof ROLES)[number]

export interface CurrentUser {
  id: string
  username: string
  fullName: string
  role: Role
}

export interface LoginPayload {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  expiresInMs: number
  user: CurrentUser
}

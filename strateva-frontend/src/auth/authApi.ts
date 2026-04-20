import { http } from '@/lib/http'
import type { CurrentUser, LoginPayload, LoginResponse } from '@/auth/types'

export async function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponse>('/v1/auth/login', payload)
  return data
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const { data } = await http.get<CurrentUser>('/v1/auth/me')
  return data
}

export async function logoutRequest(): Promise<void> {
  await http.post('/v1/auth/logout')
}

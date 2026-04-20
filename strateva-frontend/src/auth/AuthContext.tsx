import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'
import type { CurrentUser, LoginPayload, LoginResponse } from '@/auth/types'
import { fetchCurrentUser, loginRequest, logoutRequest } from '@/auth/authApi'
import {
  readStoredToken,
  registerUnauthorizedHandler,
  writeStoredToken,
} from '@/lib/http'
import { strings } from '@/lib/strings'

interface AuthState {
  user: CurrentUser | null
  token: string | null
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated'
}

interface AuthContextValue extends AuthState {
  login: (payload: LoginPayload) => Promise<LoginResponse>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const token = readStoredToken()
    return {
      user: null,
      token,
      status: token ? 'loading' : 'unauthenticated',
    }
  })

  const clear = useCallback((message?: string) => {
    writeStoredToken(null)
    setState({ user: null, token: null, status: 'unauthenticated' })
    if (message) toast.error(message)
  }, [])

  useEffect(() => {
    registerUnauthorizedHandler(() => clear(strings.auth.sessionExpired))
  }, [clear])

  useEffect(() => {
    if (state.status !== 'loading' || !state.token) return
    let cancelled = false
    fetchCurrentUser()
      .then((user) => {
        if (!cancelled) {
          setState((prev) => ({ ...prev, user, status: 'authenticated' }))
        }
      })
      .catch(() => {
        if (!cancelled) clear()
      })
    return () => {
      cancelled = true
    }
  }, [state.status, state.token, clear])

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await loginRequest(payload)
    writeStoredToken(response.token)
    setState({ user: response.user, token: response.token, status: 'authenticated' })
    return response
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      clear()
    }
  }, [clear])

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, logout }),
    [state, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

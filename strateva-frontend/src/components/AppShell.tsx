import { Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/auth/useAuth'
import { strings } from '@/lib/strings'

export function AppShell() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{strings.app.title}</h1>
            <p className="text-xs text-slate-500">{strings.app.subtitle}</p>
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <div className="text-right text-sm">
                <div className="font-medium text-slate-900">{user.fullName}</div>
                <div className="text-xs text-slate-500">
                  {strings.auth.role[user.role]}
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => void logout()}>
                {strings.nav.logout}
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-6">
        <Outlet />
      </main>
    </div>
  )
}

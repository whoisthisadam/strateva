import { NavLink, Outlet } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Logo } from '@/components/brand/Logo'
import { useAuth } from '@/auth/useAuth'
import type { Role } from '@/auth/types'
import { cn } from '@/lib/cn'
import { strings } from '@/lib/strings'

interface NavItem {
  to: string
  label: string
  end: boolean
  allow?: readonly Role[]
}

const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: strings.nav.dashboard, end: true },
  { to: '/goals', label: strings.nav.goals, end: false },
  {
    to: '/backlogs',
    label: strings.nav.backlogs,
    end: false,
    allow: ['PROJECT_MANAGER', 'BUSINESS_ANALYST'],
  },
  { to: '/tasks', label: strings.nav.tasks, end: false },
  {
    to: '/analytics',
    label: strings.nav.analytics,
    end: false,
    allow: ['PROJECT_MANAGER'],
  },
  {
    to: '/reports',
    label: strings.nav.reports,
    end: false,
    allow: ['PROJECT_MANAGER'],
  },
  {
    to: '/admin/audit',
    label: strings.nav.audit,
    end: false,
    allow: ['PROJECT_MANAGER'],
  },
  {
    to: '/admin/users',
    label: strings.nav.users,
    end: false,
    allow: ['PROJECT_MANAGER'],
  },
]

export function AppShell() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-full flex-col bg-app">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <div className="leading-tight">
              <h1 className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                {strings.app.title}
              </h1>
              <p className="hidden text-xs text-slate-500 sm:block">
                {strings.app.subtitle}
              </p>
            </div>
          </div>
          {user && (
            <nav aria-label={strings.nav.dashboard} className="hidden items-center gap-1 md:flex">
              {NAV_ITEMS.filter(
                (item) => !item.allow || item.allow.includes(user.role),
              ).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}
          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden text-right text-sm sm:block">
                <div className="font-medium text-slate-900">{user.fullName}</div>
                <div className="text-xs text-slate-500">
                  {strings.auth.role[user.role]}
                </div>
              </div>
              <Avatar name={user.fullName} size="md" />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void logout()}
                aria-label={strings.nav.logout}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{strings.nav.logout}</span>
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}

import { useState } from 'react'
import { Users as UsersIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useUsersList } from '@/features/users/useUsers'
import type { Role } from '@/auth/types'
import { strings } from '@/lib/strings'

const ROLE_ORDER: Role[] = ['PROJECT_MANAGER', 'BUSINESS_ANALYST', 'EMPLOYEE']

const ROLE_VARIANT: Record<Role, 'brand' | 'neutral' | 'success'> = {
  PROJECT_MANAGER: 'brand',
  BUSINESS_ANALYST: 'success',
  EMPLOYEE: 'neutral',
}

export function UsersListPage() {
  const [role, setRole] = useState<Role | ''>('')
  const { data, isLoading, isError } = useUsersList(role || undefined)
  const rows = [...(data ?? [])].sort((a, b) => {
    const ra = ROLE_ORDER.indexOf(a.role)
    const rb = ROLE_ORDER.indexOf(b.role)
    if (ra !== rb) return ra - rb
    return a.fullName.localeCompare(b.fullName, 'ru')
  })

  return (
    <div className="space-y-6" data-testid="users-page">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {strings.admin.users.title}
        </h1>
        <p className="text-sm text-slate-600">{strings.admin.users.subtitle}</p>
      </header>

      <div className="w-full sm:w-72 space-y-1.5">
        <Label htmlFor="users-role-filter">{strings.admin.users.filters.role}</Label>
        <Select
          id="users-role-filter"
          value={role}
          onChange={(e) => setRole(e.target.value as Role | '')}
          data-testid="users-role-filter"
        >
          <option value="">{strings.admin.users.filters.roleAll}</option>
          {ROLE_ORDER.map((r) => (
            <option key={r} value={r}>{strings.auth.role[r]}</option>
          ))}
        </Select>
      </div>

      {isLoading && <p className="text-sm text-slate-500">{strings.app.loading}</p>}
      {isError && <p className="text-sm text-red-600">{strings.admin.users.toast.loadFailed}</p>}

      {!isLoading && rows.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
              <UsersIcon aria-hidden="true" className="h-6 w-6" />
            </span>
            <p className="text-base font-medium text-slate-900">{strings.admin.users.empty}</p>
          </CardContent>
        </Card>
      )}

      {rows.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm" data-testid="users-table">
              <thead className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">{strings.admin.users.columns.fullName}</th>
                  <th className="px-4 py-3 font-medium">{strings.admin.users.columns.username}</th>
                  <th className="px-4 py-3 font-medium">{strings.admin.users.columns.role}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/40" data-testid="users-row">
                    <td className="px-4 py-3 font-medium text-slate-900">{u.fullName}</td>
                    <td className="px-4 py-3">
                      <code className="font-mono text-xs text-slate-600">{u.username}</code>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ROLE_VARIANT[u.role]} data-testid="user-role">
                        {strings.auth.role[u.role]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

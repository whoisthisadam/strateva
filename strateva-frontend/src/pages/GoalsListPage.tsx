import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Target } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { RoleGuard } from '@/components/RoleGuard'
import { GoalPriorityBadge, GoalStatusBadge } from '@/features/goals/goalBadges'
import { useGoalsList } from '@/features/goals/useGoals'
import { useAuth } from '@/auth/useAuth'
import { GOAL_STATUSES, type GoalStatus } from '@/types/goals'
import { strings } from '@/lib/strings'

function fmtDate(iso: string): string {
  try {
    return format(new Date(iso), 'd MMMM yyyy', { locale: ru })
  } catch {
    return iso
  }
}

export function GoalsListPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<GoalStatus | ''>('')

  const filters = useMemo(
    () => ({ search: search.trim() || undefined, status: status || undefined, size: 50 }),
    [search, status],
  )
  const { data, isLoading, isError } = useGoalsList(filters)

  const rows = data?.content ?? []
  const isEmployee = user?.role === 'EMPLOYEE'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {strings.goals.title}
          </h1>
          <p className="text-sm text-slate-500">{strings.goals.subtitle}</p>
        </div>
        <RoleGuard allow={['PROJECT_MANAGER']}>
          <Button
            onClick={() => navigate('/goals/new')}
            data-testid="create-goal"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {strings.goals.createButton}
          </Button>
        </RoleGuard>
      </div>

      {!isEmployee && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Input
              leadingIcon={<Search className="h-4 w-4" aria-hidden="true" />}
              placeholder={strings.goals.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="goals-search"
            />
          </div>
          <div className="w-full sm:w-60 space-y-1.5">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as GoalStatus | '')}
              data-testid="goals-status-filter"
              aria-label={strings.goals.statusFilterLabel}
            >
              <option value="">{strings.goals.statusFilterAll}</option>
              {GOAL_STATUSES.map((s) => (
                <option key={s} value={s}>{strings.goals.status[s]}</option>
              ))}
            </Select>
          </div>
        </div>
      )}

      {isLoading && <p className="text-sm text-slate-500">{strings.app.loading}</p>}
      {isError && <p className="text-sm text-red-600">{strings.errors.unknown}</p>}

      {!isLoading && rows.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
              <Target aria-hidden="true" className="h-6 w-6" />
            </span>
            <p className="text-base font-medium text-slate-900">{strings.goals.empty}</p>
            <p className="text-sm text-slate-500">{strings.goals.emptyHint}</p>
          </CardContent>
        </Card>
      )}

      {rows.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm" data-testid="goals-table">
              <thead className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">{strings.goals.columns.title}</th>
                  <th className="px-4 py-3 font-medium">{strings.goals.columns.period}</th>
                  <th className="px-4 py-3 font-medium">{strings.goals.columns.priority}</th>
                  <th className="px-4 py-3 font-medium">{strings.goals.columns.status}</th>
                  <th className="px-4 py-3 font-medium text-right">{strings.goals.columns.kpis}</th>
                  <th className="px-4 py-3 font-medium">{strings.goals.columns.createdAt}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/40" data-testid="goals-row">
                    <td className="px-4 py-3">
                      <Link
                        to={`/goals/${g.id}`}
                        className="font-medium text-slate-900 hover:text-brand-700"
                      >
                        {g.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {fmtDate(g.periodStart)} — {fmtDate(g.periodEnd)}
                    </td>
                    <td className="px-4 py-3"><GoalPriorityBadge priority={g.priority} /></td>
                    <td className="px-4 py-3"><GoalStatusBadge status={g.status} /></td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">{g.kpiCount}</td>
                    <td className="px-4 py-3 text-slate-600">{fmtDate(g.createdAt)}</td>
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

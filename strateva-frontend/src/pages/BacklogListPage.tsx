import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ListTodo, Plus, Search } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { RoleGuard } from '@/components/RoleGuard'
import { BacklogStatusBadge } from '@/features/backlogs/backlogBadges'
import { useBacklogsList } from '@/features/backlogs/useBacklogs'
import { BACKLOG_STATUSES, type BacklogStatus } from '@/types/backlog'
import { strings } from '@/lib/strings'

function fmtDate(iso: string): string {
  try {
    return format(new Date(iso), 'd MMMM yyyy', { locale: ru })
  } catch {
    return iso
  }
}

export function BacklogListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<BacklogStatus | ''>('')

  const filters = useMemo(
    () => ({ search: search.trim() || undefined, status: status || undefined, size: 50 }),
    [search, status],
  )
  const { data, isLoading, isError } = useBacklogsList(filters)
  const rows = data?.content ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {strings.backlog.title}
          </h1>
          <p className="text-sm text-slate-500">{strings.backlog.subtitle}</p>
        </div>
        <RoleGuard allow={['BUSINESS_ANALYST']}>
          <Button
            onClick={() => navigate('/backlogs/new')}
            data-testid="create-backlog"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {strings.backlog.createButton}
          </Button>
        </RoleGuard>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Input
            leadingIcon={<Search className="h-4 w-4" aria-hidden="true" />}
            placeholder={strings.backlog.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="backlogs-search"
          />
        </div>
        <div className="w-full sm:w-60 space-y-1.5">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as BacklogStatus | '')}
            data-testid="backlogs-status-filter"
            aria-label={strings.backlog.statusFilterLabel}
          >
            <option value="">{strings.backlog.statusFilterAll}</option>
            {BACKLOG_STATUSES.map((s) => (
              <option key={s} value={s}>{strings.backlog.status[s]}</option>
            ))}
          </Select>
        </div>
      </div>

      {isLoading && <p className="text-sm text-slate-500">{strings.app.loading}</p>}
      {isError && <p className="text-sm text-red-600">{strings.errors.unknown}</p>}

      {!isLoading && rows.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
              <ListTodo aria-hidden="true" className="h-6 w-6" />
            </span>
            <p className="text-base font-medium text-slate-900">{strings.backlog.empty}</p>
            <p className="text-sm text-slate-500">{strings.backlog.emptyHint}</p>
          </CardContent>
        </Card>
      )}

      {rows.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm" data-testid="backlogs-table">
              <thead className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">{strings.backlog.columns.title}</th>
                  <th className="px-4 py-3 font-medium">{strings.backlog.columns.goal}</th>
                  <th className="px-4 py-3 font-medium">{strings.backlog.columns.status}</th>
                  <th className="px-4 py-3 font-medium text-right">{strings.backlog.columns.items}</th>
                  <th className="px-4 py-3 font-medium">{strings.backlog.columns.createdBy}</th>
                  <th className="px-4 py-3 font-medium">{strings.backlog.columns.createdAt}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/40" data-testid="backlogs-row">
                    <td className="px-4 py-3">
                      <Link
                        to={`/backlogs/${b.id}`}
                        className="font-medium text-slate-900 hover:text-brand-700"
                      >
                        {b.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{b.goalTitle}</td>
                    <td className="px-4 py-3"><BacklogStatusBadge status={b.status} /></td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">{b.itemCount}</td>
                    <td className="px-4 py-3 text-slate-600">{b.createdBy ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{fmtDate(b.createdAt)}</td>
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

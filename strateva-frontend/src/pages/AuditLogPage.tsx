import { Fragment, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, History } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuditLog } from '@/features/admin/useAdmin'
import { useUsersList } from '@/features/users/useUsers'
import { type AuditAction, type AuditLogFilters } from '@/types/admin'
import { cn } from '@/lib/cn'
import { strings } from '@/lib/strings'

const PAGE_SIZES = [10, 20, 50, 100] as const
const ENTITY_TYPES = ['StrategicGoal', 'Backlog', 'Task', 'User'] as const

type FiltersState = {
  entityType: string
  entityId: string
  performedBy: string
  from: string
  to: string
  size: number
}

const INITIAL: FiltersState = {
  entityType: '', entityId: '', performedBy: '', from: '', to: '', size: 20,
}

function fmtDateTime(iso: string): string {
  try {
    return format(new Date(iso), 'd MMM yyyy, HH:mm:ss', { locale: ru })
  } catch {
    return iso
  }
}

function toIsoStart(local: string): string | undefined {
  return local ? new Date(`${local}T00:00:00`).toISOString() : undefined
}
function toIsoEnd(local: string): string | undefined {
  return local ? new Date(`${local}T23:59:59.999`).toISOString() : undefined
}

const ACTION_VARIANT: Record<AuditAction, 'brand' | 'neutral' | 'success' | 'warning'> = {
  CREATE: 'success',
  UPDATE: 'brand',
  DELETE: 'warning',
  LOGIN_SUCCESS: 'neutral',
  LOGIN_FAILURE: 'warning',
}

export function AuditLogPage() {
  const [state, setState] = useState<FiltersState>(INITIAL)
  const [applied, setApplied] = useState<FiltersState>(INITIAL)
  const [page, setPage] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)

  const filters = useMemo<AuditLogFilters>(
    () => ({
      entityType: applied.entityType || undefined,
      entityId: applied.entityId || undefined,
      performedBy: applied.performedBy || undefined,
      from: toIsoStart(applied.from),
      to: toIsoEnd(applied.to),
      page,
      size: applied.size,
    }),
    [applied, page],
  )

  const { data, isLoading, isError } = useAuditLog(filters)
  const users = useUsersList()
  const rows = data?.content ?? []
  const totalPages = Math.max(data?.totalPages ?? 1, 1)

  const apply = () => { setPage(0); setApplied(state) }
  const reset = () => { setState(INITIAL); setApplied(INITIAL); setPage(0) }

  return (
    <div className="space-y-6" data-testid="audit-page">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {strings.admin.audit.title}
        </h1>
        <p className="text-sm text-slate-600">{strings.admin.audit.subtitle}</p>
      </header>

      <Card>
        <CardContent className="space-y-4 py-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="audit-filter-entity-type">{strings.admin.audit.filters.entityType}</Label>
              <Select id="audit-filter-entity-type" data-testid="audit-filter-entity-type"
                value={state.entityType}
                onChange={(e) => setState({ ...state, entityType: e.target.value })}>
                <option value="">{strings.admin.audit.filters.entityTypeAll}</option>
                {ENTITY_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="audit-filter-performed-by">{strings.admin.audit.filters.performedBy}</Label>
              <Select id="audit-filter-performed-by" data-testid="audit-filter-performed-by"
                value={state.performedBy}
                onChange={(e) => setState({ ...state, performedBy: e.target.value })}>
                <option value="">{strings.admin.audit.filters.performedByAll}</option>
                {(users.data ?? []).map((u) => (
                  <option key={u.id} value={u.username}>{u.fullName} ({u.username})</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="audit-filter-entity-id">{strings.admin.audit.filters.entityId}</Label>
              <Input id="audit-filter-entity-id" data-testid="audit-filter-entity-id"
                placeholder={strings.admin.audit.filters.entityIdPlaceholder}
                value={state.entityId}
                onChange={(e) => setState({ ...state, entityId: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="audit-filter-from">{strings.admin.audit.filters.from}</Label>
              <Input id="audit-filter-from" data-testid="audit-filter-from" type="date"
                value={state.from}
                onChange={(e) => setState({ ...state, from: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="audit-filter-to">{strings.admin.audit.filters.to}</Label>
              <Input id="audit-filter-to" data-testid="audit-filter-to" type="date"
                value={state.to}
                onChange={(e) => setState({ ...state, to: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="audit-filter-size">{strings.admin.audit.filters.pageSize}</Label>
              <Select id="audit-filter-size" data-testid="audit-filter-size"
                value={String(state.size)}
                onChange={(e) => setState({ ...state, size: Number(e.target.value) })}>
                {PAGE_SIZES.map((n) => (<option key={n} value={n}>{n}</option>))}
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={apply} data-testid="audit-filter-apply">
              {strings.admin.audit.filters.apply}
            </Button>
            <Button variant="secondary" onClick={reset} data-testid="audit-filter-reset">
              {strings.admin.audit.filters.reset}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && <p className="text-sm text-slate-500">{strings.app.loading}</p>}
      {isError && <p className="text-sm text-red-600">{strings.admin.audit.toast.loadFailed}</p>}

      {!isLoading && rows.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
              <History aria-hidden="true" className="h-6 w-6" />
            </span>
            <p className="text-base font-medium text-slate-900">{strings.admin.audit.empty}</p>
            <p className="text-sm text-slate-500">{strings.admin.audit.emptyHint}</p>
          </CardContent>
        </Card>
      )}

      {rows.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm" data-testid="audit-table">
              <thead className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="w-8 px-2 py-3" aria-hidden="true" />
                  <th className="px-4 py-3 font-medium">{strings.admin.audit.columns.createdAt}</th>
                  <th className="px-4 py-3 font-medium">{strings.admin.audit.columns.actor}</th>
                  <th className="px-4 py-3 font-medium">{strings.admin.audit.columns.action}</th>
                  <th className="px-4 py-3 font-medium">{strings.admin.audit.columns.entityType}</th>
                  <th className="px-4 py-3 font-medium">{strings.admin.audit.columns.entityId}</th>
                  <th className="px-4 py-3 font-medium">{strings.admin.audit.columns.message}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => {
                  const open = expanded === r.id
                  return (
                    <Fragment key={r.id}>
                      <tr
                        className={cn('hover:bg-slate-50/40', open && 'bg-slate-50/60')}
                        data-testid="audit-row"
                      >
                        <td className="px-2 py-3">
                          <button
                            type="button"
                            onClick={() => setExpanded(open ? null : r.id)}
                            aria-label={strings.admin.audit.columns.details}
                            data-testid={`audit-row-toggle-${r.id}`}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          >
                            {open ? <ChevronDown className="h-4 w-4" aria-hidden="true" />
                              : <ChevronRight className="h-4 w-4" aria-hidden="true" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-slate-600 tabular-nums">{fmtDateTime(r.createdAt)}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{r.actor}</td>
                        <td className="px-4 py-3">
                          <Badge variant={ACTION_VARIANT[r.action]} data-testid="audit-action">
                            {strings.admin.audit.action[r.action]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{r.entityType}</td>
                        <td className="px-4 py-3">
                          <code className="font-mono text-xs text-slate-600">{r.entityId ?? '—'}</code>
                        </td>
                        <td className="px-4 py-3">
                          {r.message ? (
                            <code className="font-mono text-xs text-slate-600">{r.message}</code>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                      {open && (
                        <tr data-testid={`audit-row-details-${r.id}`}>
                          <td />
                          <td colSpan={6} className="bg-slate-50/70 px-4 py-4 align-top">
                            <div className="space-y-2">
                              <p className="text-sm font-semibold text-slate-800">
                                {strings.admin.audit.details.title}
                              </p>
                              <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                                <div>
                                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                    {strings.admin.audit.details.messageLabel}
                                  </dt>
                                  <dd className="mt-1 text-slate-800">
                                    {r.message ? (
                                      <code className="font-mono text-xs text-slate-700">{r.message}</code>
                                    ) : (
                                      <span className="text-slate-500">—</span>
                                    )}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                    {strings.admin.audit.details.diffLabel}
                                  </dt>
                                  <dd className="mt-1">
                                    {r.diff ? (
                                      <pre
                                        data-allow-en
                                        className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-white p-3 font-mono text-xs text-slate-700 ring-1 ring-inset ring-slate-200"
                                      >
                                        {r.diff}
                                      </pre>
                                    ) : (
                                      <span className="text-slate-500">{strings.admin.audit.details.none}</span>
                                    )}
                                  </dd>
                                </div>
                              </dl>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
            <span className="text-xs text-slate-500" data-testid="audit-pagination-status">
              {strings.admin.audit.pagination.status
                .replace('{page}', String(page + 1))
                .replace('{total}', String(totalPages))}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                data-testid="audit-pagination-prev">
                {strings.admin.audit.pagination.prev}
              </Button>
              <Button variant="secondary" size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page + 1 >= totalPages}
                data-testid="audit-pagination-next">
                {strings.admin.audit.pagination.next}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

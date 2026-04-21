import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RoleGuard } from '@/components/RoleGuard'
import { GoalPriorityBadge, GoalStatusBadge } from '@/features/goals/goalBadges'
import {
  useChangeGoalStatus,
  useDeleteGoal,
  useGoal,
  useSubmitGoal,
} from '@/features/goals/useGoals'
import { strings } from '@/lib/strings'

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return format(new Date(iso), 'd MMMM yyyy', { locale: ru })
  } catch {
    return iso
  }
}

export function GoalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, isError } = useGoal(id)
  const submitMutation = useSubmitGoal()
  const statusMutation = useChangeGoalStatus()
  const deleteMutation = useDeleteGoal()

  if (isLoading) return <p className="text-sm text-slate-500">{strings.app.loading}</p>
  if (isError || !data) return <p className="text-sm text-red-600">{strings.errors.unknown}</p>

  const canEdit = data.status === 'DRAFT' || data.status === 'SUBMITTED'
  const canSubmit = data.status === 'DRAFT'
  const canActivate = data.status === 'SUBMITTED'
  const canComplete = data.status === 'ACTIVE'
  const canArchive = data.status === 'ACTIVE' || data.status === 'COMPLETED'
  const canDelete = data.status === 'DRAFT'

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          to="/goals"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {strings.goals.backToList}
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {data.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <GoalStatusBadge status={data.status} />
              <GoalPriorityBadge priority={data.priority} />
            </div>
          </div>
          <RoleGuard allow={['PROJECT_MANAGER']} fallback={null}>
            <div className="flex flex-wrap items-center gap-2" data-testid="goal-actions">
              {canEdit && (
                <Button variant="secondary" onClick={() => navigate(`/goals/${id}/edit`)} data-testid="action-edit">
                  {strings.goals.actions.edit}
                </Button>
              )}
              {canSubmit && (
                <Button onClick={() => id && submitMutation.mutate(id)} data-testid="action-submit">
                  {strings.goals.actions.submitForApproval}
                </Button>
              )}
              {canActivate && (
                <Button
                  onClick={() => id && statusMutation.mutate({ id, status: 'ACTIVE' })}
                  data-testid="action-activate"
                >
                  {strings.goals.actions.activate}
                </Button>
              )}
              {canComplete && (
                <Button
                  variant="secondary"
                  onClick={() => id && statusMutation.mutate({ id, status: 'COMPLETED' })}
                  data-testid="action-complete"
                >
                  {strings.goals.actions.complete}
                </Button>
              )}
              {canArchive && (
                <Button
                  variant="secondary"
                  onClick={() => id && statusMutation.mutate({ id, status: 'ARCHIVED' })}
                  data-testid="action-archive"
                >
                  {strings.goals.actions.archive}
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="danger"
                  onClick={() => {
                    if (id && window.confirm(strings.goals.actions.confirmDelete)) {
                      deleteMutation.mutate(id, { onSuccess: () => navigate('/goals') })
                    }
                  }}
                  data-testid="action-delete"
                >
                  {strings.goals.actions.delete}
                </Button>
              )}
            </div>
          </RoleGuard>
        </div>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          <Field label={strings.goals.detail.periodLabel}>
            {fmtDate(data.periodStart)} — {fmtDate(data.periodEnd)}
          </Field>
          <Field label={strings.goals.detail.createdAtLabel}>{fmtDate(data.createdAt)}</Field>
          <Field label={strings.goals.detail.createdByLabel}>{data.createdBy ?? '—'}</Field>
          {data.description && (
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {strings.goals.form.descriptionLabel}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{data.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">{strings.goals.detail.kpisTitle}</h2>
        {data.kpis.length === 0 && (
          <p className="text-sm text-slate-500">{strings.goals.detail.noKpis}</p>
        )}
        {data.kpis.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">{strings.goals.form.kpiName}</th>
                    <th className="px-4 py-3 font-medium text-right">{strings.goals.detail.targetLabel}</th>
                    <th className="px-4 py-3 font-medium text-right">{strings.goals.detail.currentLabel}</th>
                    <th className="px-4 py-3 font-medium">{strings.goals.form.kpiUnit}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.kpis.map((k) => (
                    <tr key={k.id} data-testid="kpi-detail-row">
                      <td className="px-4 py-3 text-slate-900">{k.name}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">{k.targetValue}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">{k.currentValue}</td>
                      <td className="px-4 py-3 text-slate-500">{k.unit ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-900">{children}</p>
    </div>
  )
}

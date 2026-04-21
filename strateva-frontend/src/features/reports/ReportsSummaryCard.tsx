import { useNavigate } from 'react-router-dom'
import { ArrowRight, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useReportsOverview } from '@/features/reports/useReports'
import { strings } from '@/lib/strings'

/**
 * Dashboard card shown only to project managers (see RoleGuard upstream).
 * Surfaces the overdue-task count and a shortcut to /analytics so the PM can
 * dive into the charts without leaving the home view.
 */
export function ReportsSummaryCard() {
  const navigate = useNavigate()
  const { data, isLoading } = useReportsOverview()
  const overdue = isLoading
    ? strings.dashboard.loadingStats
    : String(data?.tasksOverdue ?? 0)
  const total = isLoading
    ? strings.dashboard.loadingStats
    : String(data?.tasksTotal ?? 0)
  return (
    <Card data-testid="dashboard-card-reports" className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="flex-row items-start gap-3 space-y-0">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
          <BarChart3 aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="space-y-1">
          <CardTitle className="text-base">{strings.dashboard.cards.reports.title}</CardTitle>
          <p className="text-sm text-slate-600">
            {strings.dashboard.cards.reports.description}
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-4">
        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200/70 bg-slate-50/60 px-3 py-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {strings.dashboard.statsTotal}
            </dt>
            <dd
              data-testid="dashboard-card-reports-total"
              className="mt-1 text-2xl font-semibold tabular-nums text-slate-900"
            >
              {total}
            </dd>
          </div>
          <div className="rounded-xl border border-slate-200/70 bg-slate-50/60 px-3 py-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {strings.dashboard.cards.reports.statsOverdue}
            </dt>
            <dd
              data-testid="dashboard-card-reports-overdue"
              className="mt-1 text-2xl font-semibold tabular-nums text-slate-900"
            >
              {overdue}
            </dd>
          </div>
        </dl>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/analytics')}
          data-testid="dashboard-card-reports-open"
          className="self-start"
        >
          <span>{strings.dashboard.cards.reports.openAnalytics}</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </CardContent>
    </Card>
  )
}

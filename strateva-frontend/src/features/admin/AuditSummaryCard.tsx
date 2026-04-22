import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuditLog } from '@/features/admin/useAdmin'
import { strings } from '@/lib/strings'

/**
 * Dashboard card shown only to project managers. Total audit rows come from the
 * unfiltered page's {@code totalElements}; the "last 24 h" figure uses a
 * server-side time filter so the call stays O(1) regardless of dataset size.
 */
export function AuditSummaryCard() {
  const navigate = useNavigate()
  const total = useAuditLog({ size: 1 })
  const since = useMemo(() => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), [])
  const recent = useAuditLog({ from: since, size: 1 })

  const isLoading = total.isLoading || recent.isLoading
  const totalValue = isLoading
    ? strings.dashboard.loadingStats
    : String(total.data?.totalElements ?? 0)
  const recentValue = isLoading
    ? strings.dashboard.loadingStats
    : String(recent.data?.totalElements ?? 0)

  return (
    <Card data-testid="dashboard-card-audit" className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="flex-row items-start gap-3 space-y-0">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
          <ShieldCheck aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="space-y-1">
          <CardTitle className="text-base">{strings.dashboard.cards.audit.title}</CardTitle>
          <p className="text-sm text-slate-600">{strings.dashboard.cards.audit.description}</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-4">
        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200/70 bg-slate-50/60 px-3 py-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {strings.dashboard.statsTotal}
            </dt>
            <dd
              data-testid="dashboard-card-audit-total"
              className="mt-1 text-2xl font-semibold tabular-nums text-slate-900"
            >
              {totalValue}
            </dd>
          </div>
          <div className="rounded-xl border border-slate-200/70 bg-slate-50/60 px-3 py-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {strings.dashboard.cards.audit.statsToday}
            </dt>
            <dd
              data-testid="dashboard-card-audit-recent"
              className="mt-1 text-2xl font-semibold tabular-nums text-slate-900"
            >
              {recentValue}
            </dd>
          </div>
        </dl>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/admin/audit')}
          data-testid="dashboard-card-audit-open"
          className="self-start"
        >
          <span>{strings.dashboard.cards.audit.openAudit}</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </CardContent>
    </Card>
  )
}

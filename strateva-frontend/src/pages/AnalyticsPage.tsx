import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  useBacklogThroughput,
  useGoalsProgress,
  useReportsOverview,
  useTaskWorkload,
} from '@/features/reports/useReports'
import { TASK_STATUSES, type TaskStatus } from '@/types/tasks'
import { strings } from '@/lib/strings'

interface OverviewTileProps {
  testId: string
  label: string
  value: number | undefined
  loading: boolean
}

function OverviewTile({ testId, label, value, loading }: OverviewTileProps) {
  return (
    <div
      data-testid={testId}
      className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm"
    >
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">
        {loading ? strings.dashboard.loadingStats : String(value ?? 0)}
      </div>
    </div>
  )
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: '#94a3b8',
  IN_PROGRESS: '#2563eb',
  DONE: '#16a34a',
  BLOCKED: '#dc2626',
}

export function AnalyticsPage() {
  const overview = useReportsOverview()
  const goals = useGoalsProgress()
  const workload = useTaskWorkload()
  const throughput = useBacklogThroughput()

  const goalsChart = useMemo(
    () =>
      (goals.data?.rows ?? []).map((r) => ({
        title: r.title,
        done: r.doneTasks,
        pending: Math.max(0, r.totalTasks - r.doneTasks),
      })),
    [goals.data],
  )

  const workloadChart = useMemo(() => {
    const byAssignee = new Map<string, Record<TaskStatus, number> & { assignee: string }>()
    for (const row of workload.data?.rows ?? []) {
      const key = row.assignee ?? strings.reports.charts.unassigned
      let bucket = byAssignee.get(key)
      if (!bucket) {
        bucket = { assignee: key, TODO: 0, IN_PROGRESS: 0, DONE: 0, BLOCKED: 0 }
        byAssignee.set(key, bucket)
      }
      bucket[row.status] = row.count
    }
    return Array.from(byAssignee.values())
  }, [workload.data])

  const throughputChart = useMemo(
    () =>
      (throughput.data?.rows ?? []).map((r) => ({
        period: r.period,
        signed: r.signedCount,
      })),
    [throughput.data],
  )

  return (
    <div className="space-y-6" data-testid="analytics-page">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {strings.reports.analyticsTitle}
        </h1>
        <p className="text-sm text-slate-600">{strings.reports.analyticsSubtitle}</p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <OverviewTile testId="analytics-goals-total" label={strings.reports.overview.goalsTotal}
          value={overview.data?.goalsTotal} loading={overview.isLoading} />
        <OverviewTile testId="analytics-goals-active" label={strings.reports.overview.goalsActive}
          value={overview.data?.goalsActive} loading={overview.isLoading} />
        <OverviewTile testId="analytics-tasks-total" label={strings.reports.overview.tasksTotal}
          value={overview.data?.tasksTotal} loading={overview.isLoading} />
        <OverviewTile testId="analytics-tasks-done" label={strings.reports.overview.tasksDone}
          value={overview.data?.tasksDone} loading={overview.isLoading} />
        <OverviewTile testId="analytics-tasks-overdue" label={strings.reports.overview.tasksOverdue}
          value={overview.data?.tasksOverdue} loading={overview.isLoading} />
        <OverviewTile testId="analytics-backlogs-signed" label={strings.reports.overview.backlogsSigned}
          value={overview.data?.backlogsSigned} loading={overview.isLoading} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card data-testid="analytics-chart-goals">
          <CardHeader>
            <CardTitle className="text-base">{strings.reports.charts.goalsProgressTitle}</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {goalsChart.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={goalsChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="title" tick={{ fontSize: 11 }} />
                  <YAxis label={{ value: strings.reports.charts.goalsProgressYAxis, angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="done" name={strings.reports.charts.goalsProgressDone} stackId="a" fill="#16a34a" />
                  <Bar dataKey="pending" name={strings.reports.charts.goalsProgressPending} stackId="a" fill="#cbd5e1" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card data-testid="analytics-chart-workload">
          <CardHeader>
            <CardTitle className="text-base">{strings.reports.charts.workloadTitle}</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {workloadChart.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workloadChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="assignee" tick={{ fontSize: 11 }} />
                  <YAxis label={{ value: strings.reports.charts.workloadYAxis, angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  {TASK_STATUSES.map((s) => (
                    <Bar key={s} dataKey={s} stackId="b" name={strings.tasks.status[s]} fill={STATUS_COLORS[s]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card data-testid="analytics-chart-throughput">
          <CardHeader>
            <CardTitle className="text-base">{strings.reports.charts.throughputTitle}</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {throughputChart.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={throughputChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="period" />
                  <YAxis label={{ value: strings.reports.charts.throughputYAxis, angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="signed" name={strings.reports.charts.throughputYAxis} stroke="#2563eb" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-slate-500">
      {strings.reports.empty}
    </div>
  )
}

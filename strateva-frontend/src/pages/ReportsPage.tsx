import { useState, type ReactNode } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/cn'
import {
  useBacklogThroughput,
  useDownloadReportCsv,
  useGoalsProgress,
  useKpisProgress,
  useOverdueTasks,
  useTaskWorkload,
} from '@/features/reports/useReports'
import type { ReportKey } from '@/types/reports'
import { strings } from '@/lib/strings'

type TabKey = ReportKey

interface TabDef {
  key: TabKey
  label: string
  filename: string
}

const TABS: readonly TabDef[] = [
  { key: 'goals-progress', label: strings.reports.tabs.goalsProgress, filename: 'goals-progress.csv' },
  { key: 'kpis-progress', label: strings.reports.tabs.kpisProgress, filename: 'kpis-progress.csv' },
  { key: 'task-workload', label: strings.reports.tabs.taskWorkload, filename: 'task-workload.csv' },
  { key: 'overdue-tasks', label: strings.reports.tabs.overdueTasks, filename: 'overdue-tasks.csv' },
  { key: 'backlog-throughput', label: strings.reports.tabs.backlogThroughput, filename: 'backlog-throughput.csv' },
]

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return format(new Date(iso), 'd MMMM yyyy', { locale: ru })
  } catch {
    return iso
  }
}

export function ReportsPage() {
  const [active, setActive] = useState<TabKey>('goals-progress')
  const download = useDownloadReportCsv()
  const current = TABS.find((t) => t.key === active)!

  return (
    <div className="space-y-6" data-testid="reports-page">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {strings.reports.reportsTitle}
          </h1>
          <p className="text-sm text-slate-600">{strings.reports.reportsSubtitle}</p>
        </div>
        <Button
          data-testid="reports-export-csv"
          variant="secondary"
          size="sm"
          disabled={download.isPending}
          onClick={() =>
            download.mutate({ key: current.key, filename: current.filename })
          }
        >
          {download.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="h-4 w-4" aria-hidden="true" />
          )}
          <span>
            {download.isPending ? strings.reports.downloading : strings.reports.exportCsv}
          </span>
        </Button>
      </header>

      <nav className="flex flex-wrap gap-2" role="tablist" aria-label={strings.reports.reportsTitle}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={active === tab.key}
            data-testid={`reports-tab-${tab.key}`}
            onClick={() => setActive(tab.key)}
            className={cn(
              'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              active === tab.key
                ? 'border-brand-200 bg-brand-50 text-brand-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{current.label}</CardTitle>
        </CardHeader>
        <CardContent>
          {active === 'goals-progress' && <GoalsProgressTable />}
          {active === 'kpis-progress' && <KpisProgressTable />}
          {active === 'task-workload' && <TaskWorkloadTable />}
          {active === 'overdue-tasks' && <OverdueTasksTable />}
          {active === 'backlog-throughput' && <ThroughputTable />}
        </CardContent>
      </Card>
    </div>
  )
}

interface TableProps {
  isEmpty: boolean
  children: ReactNode
}

function TableWrapper({ isEmpty, children }: TableProps) {
  if (isEmpty) {
    return <p className="text-sm text-slate-500">{strings.reports.empty}</p>
  }
  return <div className="overflow-x-auto">{children}</div>
}

function GoalsProgressTable() {
  const { data } = useGoalsProgress()
  const rows = data?.rows ?? []
  return (
    <TableWrapper isEmpty={rows.length === 0}>
      <table className="min-w-full text-sm">
        <thead className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="py-2 pr-4">{strings.reports.columns.goalTitle}</th>
            <th className="py-2 pr-4">{strings.reports.columns.goalStatus}</th>
            <th className="py-2 pr-4 text-right">{strings.reports.columns.totalTasks}</th>
            <th className="py-2 pr-4 text-right">{strings.reports.columns.doneTasks}</th>
            <th className="py-2 pr-4 text-right">{strings.reports.columns.percent}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.goalId} data-testid="reports-row-goal">
              <td className="py-2 pr-4 text-slate-900">{r.title}</td>
              <td className="py-2 pr-4 text-slate-600">{strings.goals.status[r.status]}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{r.totalTasks}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{r.doneTasks}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{r.percent.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrapper>
  )
}


function KpisProgressTable() {
  const { data } = useKpisProgress()
  const rows = data?.rows ?? []
  return (
    <TableWrapper isEmpty={rows.length === 0}>
      <table className="min-w-full text-sm">
        <thead className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="py-2 pr-4">{strings.reports.columns.goalTitle}</th>
            <th className="py-2 pr-4">{strings.reports.columns.kpiName}</th>
            <th className="py-2 pr-4 text-right">{strings.reports.columns.kpiCurrent}</th>
            <th className="py-2 pr-4 text-right">{strings.reports.columns.kpiTarget}</th>
            <th className="py-2 pr-4">{strings.reports.columns.kpiUnit}</th>
            <th className="py-2 pr-4 text-right">{strings.reports.columns.percent}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.kpiId} data-testid="reports-row-kpi">
              <td className="py-2 pr-4 text-slate-900">{r.goalTitle}</td>
              <td className="py-2 pr-4 text-slate-900">{r.name}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{r.currentValue}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{r.targetValue}</td>
              <td className="py-2 pr-4 text-slate-600">{r.unit ?? '—'}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{r.percent.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrapper>
  )
}

function TaskWorkloadTable() {
  const { data } = useTaskWorkload()
  const rows = data?.rows ?? []
  return (
    <TableWrapper isEmpty={rows.length === 0}>
      <table className="min-w-full text-sm">
        <thead className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="py-2 pr-4">{strings.reports.columns.assignee}</th>
            <th className="py-2 pr-4">{strings.reports.columns.status}</th>
            <th className="py-2 pr-4 text-right">{strings.reports.columns.count}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r, idx) => (
            <tr key={`${r.assignee ?? '∅'}-${r.status}-${idx}`} data-testid="reports-row-workload">
              <td className="py-2 pr-4 text-slate-900">
                {r.assignee ?? strings.reports.charts.unassigned}
              </td>
              <td className="py-2 pr-4 text-slate-600">{strings.tasks.status[r.status]}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{r.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrapper>
  )
}

function OverdueTasksTable() {
  const { data } = useOverdueTasks()
  const rows = data?.rows ?? []
  return (
    <TableWrapper isEmpty={rows.length === 0}>
      <table className="min-w-full text-sm">
        <thead className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="py-2 pr-4">{strings.reports.columns.title}</th>
            <th className="py-2 pr-4">{strings.reports.columns.goalTitle}</th>
            <th className="py-2 pr-4">{strings.reports.columns.assignee}</th>
            <th className="py-2 pr-4">{strings.reports.columns.deadline}</th>
            <th className="py-2 pr-4 text-right">{strings.reports.columns.daysOverdue}</th>
            <th className="py-2 pr-4">{strings.reports.columns.status}</th>
            <th className="py-2 pr-4">{strings.reports.columns.priority}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.taskId} data-testid="reports-row-overdue">
              <td className="py-2 pr-4 text-slate-900">{r.title}</td>
              <td className="py-2 pr-4 text-slate-600">{r.goalTitle}</td>
              <td className="py-2 pr-4 text-slate-600">
                {r.assignee ?? strings.reports.charts.unassigned}
              </td>
              <td className="py-2 pr-4 text-slate-600">{fmtDate(r.deadline)}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{r.daysOverdue}</td>
              <td className="py-2 pr-4 text-slate-600">{strings.tasks.status[r.status]}</td>
              <td className="py-2 pr-4 text-slate-600">{strings.goals.priority[r.priority]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrapper>
  )
}

function ThroughputTable() {
  const { data } = useBacklogThroughput()
  const rows = data?.rows ?? []
  return (
    <TableWrapper isEmpty={rows.length === 0}>
      <table className="min-w-full text-sm">
        <thead className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="py-2 pr-4">{strings.reports.columns.period}</th>
            <th className="py-2 pr-4 text-right">{strings.reports.columns.signedCount}</th>
            <th className="py-2 pr-4 text-right">{strings.reports.columns.itemCount}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.period} data-testid="reports-row-throughput">
              <td className="py-2 pr-4 text-slate-900">{r.period}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{r.signedCount}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{r.itemCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrapper>
  )
}

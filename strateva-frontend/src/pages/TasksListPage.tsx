import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ClipboardList, LayoutGrid, Plus, Search, Table as TableIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { RoleGuard } from '@/components/RoleGuard'
import { TaskStatusBadge } from '@/features/tasks/taskBadges'
import { useTasksList } from '@/features/tasks/useTasks'
import { useAuth } from '@/auth/useAuth'
import { GOAL_PRIORITIES, type GoalPriority } from '@/types/goals'
import { TASK_STATUSES, type TaskStatus, type TaskSummaryDto } from '@/types/tasks'
import { strings } from '@/lib/strings'
import { cn } from '@/lib/cn'

type ViewMode = 'table' | 'board'

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return format(new Date(iso), 'd MMMM yyyy', { locale: ru })
  } catch {
    return iso
  }
}

export function TasksListPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<TaskStatus | ''>('')
  const [priority, setPriority] = useState<GoalPriority | ''>('')
  const [view, setView] = useState<ViewMode>('table')

  const filters = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: status || undefined,
      priority: priority || undefined,
      size: 100,
    }),
    [search, status, priority],
  )
  const { data, isLoading, isError } = useTasksList(filters)
  const rows = data?.content ?? []
  const isEmployee = user?.role === 'EMPLOYEE'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {strings.tasks.title}
          </h1>
          <p className="text-sm text-slate-500">{strings.tasks.subtitle}</p>
        </div>
        <RoleGuard allow={['PROJECT_MANAGER']}>
          <Button onClick={() => navigate('/tasks/new')} data-testid="create-task">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {strings.tasks.createButton}
          </Button>
        </RoleGuard>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Input
            leadingIcon={<Search className="h-4 w-4" aria-hidden="true" />}
            placeholder={strings.tasks.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="tasks-search"
          />
        </div>
        <div className="w-full sm:w-56 space-y-1.5">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus | '')}
            data-testid="tasks-status-filter"
            aria-label={strings.tasks.statusFilterLabel}
          >
            <option value="">{strings.tasks.statusFilterAll}</option>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>{strings.tasks.status[s]}</option>
            ))}
          </Select>
        </div>
        <div className="w-full sm:w-56 space-y-1.5">
          <Select
            value={priority}
            onChange={(e) => setPriority(e.target.value as GoalPriority | '')}
            data-testid="tasks-priority-filter"
            aria-label={strings.tasks.priorityFilterLabel}
          >
            <option value="">{strings.tasks.priorityFilterAll}</option>
            {GOAL_PRIORITIES.map((p) => (
              <option key={p} value={p}>{strings.goals.priority[p]}</option>
            ))}
          </Select>
        </div>
        <ViewToggle value={view} onChange={setView} />
      </div>

      {isLoading && <p className="text-sm text-slate-500">{strings.app.loading}</p>}
      {isError && <p className="text-sm text-red-600">{strings.errors.unknown}</p>}

      {!isLoading && rows.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
              <ClipboardList aria-hidden="true" className="h-6 w-6" />
            </span>
            <p className="text-base font-medium text-slate-900">{strings.tasks.empty}</p>
            <p className="text-sm text-slate-500">
              {isEmployee ? strings.tasks.emptyEmployeeHint : strings.tasks.emptyHint}
            </p>
          </CardContent>
        </Card>
      )}

      {rows.length > 0 && view === 'table' && <TasksTable rows={rows} />}
      {rows.length > 0 && view === 'board' && <TasksBoard rows={rows} />}
    </div>
  )
}

function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  const btn = (v: ViewMode) =>
    cn(
      'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      value === v
        ? 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    )
  return (
    <div className="flex gap-1" data-testid="tasks-view-toggle">
      <button type="button" onClick={() => onChange('table')} className={btn('table')} data-testid="tasks-view-table">
        <TableIcon className="h-4 w-4" aria-hidden="true" />
        {strings.tasks.viewTable}
      </button>
      <button type="button" onClick={() => onChange('board')} className={btn('board')} data-testid="tasks-view-board">
        <LayoutGrid className="h-4 w-4" aria-hidden="true" />
        {strings.tasks.viewBoard}
      </button>
    </div>
  )
}

function TasksTable({ rows }: { rows: TaskSummaryDto[] }) {
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm" data-testid="tasks-table">
          <thead className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">{strings.tasks.columns.title}</th>
              <th className="px-4 py-3 font-medium">{strings.tasks.columns.goal}</th>
              <th className="px-4 py-3 font-medium">{strings.tasks.columns.priority}</th>
              <th className="px-4 py-3 font-medium">{strings.tasks.columns.status}</th>
              <th className="px-4 py-3 font-medium">{strings.tasks.columns.assignee}</th>
              <th className="px-4 py-3 font-medium">{strings.tasks.columns.deadline}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((task) => (
              <tr key={task.id} className="hover:bg-slate-50/40" data-testid="tasks-row">
                <td className="px-4 py-3">
                  <Link
                    to={`/tasks/${task.id}`}
                    className="font-medium text-slate-900 hover:text-brand-700"
                  >
                    {task.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{task.goalTitle}</td>
                <td className="px-4 py-3 text-slate-600">{strings.goals.priority[task.priority]}</td>
                <td className="px-4 py-3"><TaskStatusBadge status={task.status} /></td>
                <td className="px-4 py-3 text-slate-600">{task.assignedTo ?? strings.tasks.unassigned}</td>
                <td className="px-4 py-3 text-slate-600">{fmtDate(task.deadline)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function TasksBoard({ rows }: { rows: TaskSummaryDto[] }) {
  const columns: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE']
  const grouped = columns.map((s) => ({
    status: s,
    items: rows.filter((r) => r.status === s),
  }))
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="tasks-board">
      {grouped.map((col) => (
        <div
          key={col.status}
          className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3"
          data-testid={`tasks-board-column-${col.status}`}
        >
          <div className="flex items-center justify-between px-1">
            <TaskStatusBadge status={col.status} />
            <span className="text-xs tabular-nums text-slate-500">{col.items.length}</span>
          </div>
          <div className="space-y-2">
            {col.items.map((t) => (
              <Link
                key={t.id}
                to={`/tasks/${t.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm transition-shadow hover:shadow-md"
                data-testid="tasks-board-card"
              >
                <p className="font-medium text-slate-900">{t.title}</p>
                <p className="mt-1 text-xs text-slate-500">{t.goalTitle}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>{strings.goals.priority[t.priority]}</span>
                  <span>{t.assignedTo ?? strings.tasks.unassigned}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

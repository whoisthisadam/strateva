import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, UserPlus } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RoleGuard } from '@/components/RoleGuard'
import { TaskStatusBadge } from '@/features/tasks/taskBadges'
import { TaskForm } from '@/features/tasks/TaskForm'
import { TaskAssignDialog } from '@/features/tasks/TaskAssignDialog'
import { TaskStatusDropdown } from '@/features/tasks/TaskStatusDropdown'
import {
  useAssignTask,
  useChangeTaskStatus,
  useDeleteTask,
  useTask,
  useUpdateTask,
} from '@/features/tasks/useTasks'
import { useAuth } from '@/auth/useAuth'
import { strings } from '@/lib/strings'

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return format(new Date(iso), 'd MMMM yyyy', { locale: ru })
  } catch {
    return iso
  }
}

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data, isLoading, isError } = useTask(id)
  const taskId = id ?? ''
  const updateMutation = useUpdateTask(taskId)
  const assignMutation = useAssignTask(taskId)
  const statusMutation = useChangeTaskStatus(taskId)
  const deleteMutation = useDeleteTask()

  const [editing, setEditing] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)

  if (isLoading) return <p className="text-sm text-slate-500">{strings.app.loading}</p>
  if (isError || !data) return <p className="text-sm text-red-600">{strings.errors.unknown}</p>

  const t = strings.tasks
  const isPM = user?.role === 'PROJECT_MANAGER'
  const isOwnerEmployee = user?.role === 'EMPLOYEE' && data.assignedTo === user.username
  const canEdit = isPM && data.status !== 'DONE'
  const canDelete = isPM && data.status === 'TODO'
  const canAssign = isPM
  const canChangeStatus = (isPM || isOwnerEmployee) && data.status !== 'DONE'

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          to="/tasks"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t.backToList}
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {data.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <TaskStatusBadge status={data.status} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2" data-testid="task-actions">
            <RoleGuard allow={['PROJECT_MANAGER']}>
              {canEdit && !editing && (
                <Button variant="secondary" onClick={() => setEditing(true)} data-testid="action-edit">
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  {t.actions.edit}
                </Button>
              )}
              {canAssign && (
                <Button variant="secondary" onClick={() => setAssignOpen(true)} data-testid="action-assign">
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                  {data.assignedTo ? t.actions.reassign : t.actions.assign}
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="danger"
                  onClick={() => {
                    if (window.confirm(t.actions.confirmDelete)) {
                      deleteMutation.mutate(taskId, { onSuccess: () => navigate('/tasks') })
                    }
                  }}
                  data-testid="action-delete"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  {t.actions.delete}
                </Button>
              )}
            </RoleGuard>
          </div>
        </div>
      </div>

      {editing && (
        <Card>
          <CardContent className="p-6">
            <TaskForm
              mode="edit"
              defaultValues={{
                title: data.title,
                description: data.description,
                priority: data.priority,
                deadline: data.deadline,
              }}
              submitting={updateMutation.isPending}
              onCancel={() => setEditing(false)}
              onSubmit={async (values) => {
                await updateMutation.mutateAsync(values)
                setEditing(false)
              }}
            />
          </CardContent>
        </Card>
      )}

      {!editing && (
        <Card>
          <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
            <Field label={t.detail.goalLabel}>{data.goalTitle}</Field>
            <Field label={t.detail.priorityLabel}>{strings.goals.priority[data.priority]}</Field>
            <Field label={t.detail.assigneeLabel}>{data.assignedTo ?? t.unassigned}</Field>
            <Field label={t.detail.deadlineLabel}>
              {data.deadline ? fmtDate(data.deadline) : t.detail.noDeadline}
            </Field>
            <Field label={t.detail.createdAtLabel}>{fmtDate(data.createdAt)}</Field>
            <Field label={t.detail.createdByLabel}>{data.createdBy ?? '—'}</Field>
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {t.detail.descriptionLabel}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                {data.description ?? t.detail.noDescription}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {canChangeStatus && !editing && (
        <Card>
          <CardContent className="p-6" data-testid="task-status-panel">
            <div className="max-w-sm">
              <TaskStatusDropdown
                status={data.status}
                assigned={!!data.assignedTo}
                disabled={statusMutation.isPending}
                onChange={(next) => statusMutation.mutate(next)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <TaskAssignDialog
        open={assignOpen}
        currentAssignee={data.assignedTo}
        submitting={assignMutation.isPending}
        onClose={() => setAssignOpen(false)}
        onSubmit={async (assignee) => {
          await assignMutation.mutateAsync(assignee)
          setAssignOpen(false)
        }}
      />
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

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useUsersList } from '@/features/users/useUsers'
import { strings } from '@/lib/strings'

interface TaskAssignDialogProps {
  open: boolean
  currentAssignee?: string | null
  submitting?: boolean
  onClose: () => void
  onSubmit: (assignee: string) => void | Promise<void>
}

export function TaskAssignDialog({
  open,
  currentAssignee,
  submitting,
  onClose,
  onSubmit,
}: TaskAssignDialogProps) {
  const [assignee, setAssignee] = useState<string>(currentAssignee ?? '')
  const { data: users, isLoading } = useUsersList('EMPLOYEE', open)

  useEffect(() => {
    if (open) setAssignee(currentAssignee ?? '')
  }, [open, currentAssignee])

  if (!open) return null
  const t = strings.tasks.assignDialog
  const employees = users ?? []
  const canSubmit = assignee.trim().length > 0 && !submitting

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    await onSubmit(assignee)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-dialog-title"
      data-testid="task-assign-dialog"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-900/5">
        <div className="space-y-1">
          <h2 id="assign-dialog-title" className="text-lg font-semibold text-slate-900">
            {t.title}
          </h2>
          <p className="text-sm text-slate-500">{t.subtitle}</p>
        </div>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-assignee">{t.assigneeLabel}</Label>
            <Select
              id="task-assignee"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              disabled={isLoading || employees.length === 0}
              data-testid="task-assignee-select"
            >
              <option value="">{t.assigneePlaceholder}</option>
              {employees.map((u) => (
                <option key={u.id} value={u.username}>
                  {u.fullName}
                </option>
              ))}
            </Select>
            {!isLoading && employees.length === 0 && (
              <p className="text-xs text-slate-500">{t.noEmployees}</p>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              {strings.app.cancel}
            </Button>
            <Button type="submit" disabled={!canSubmit} data-testid="task-assign-submit">
              {t.submit}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

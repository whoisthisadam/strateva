import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { TASK_STATUSES, type TaskStatus } from '@/types/tasks'
import { strings } from '@/lib/strings'

const ALLOWED: Record<TaskStatus, readonly TaskStatus[]> = {
  TODO: ['IN_PROGRESS', 'BLOCKED'],
  IN_PROGRESS: ['DONE', 'BLOCKED', 'TODO'],
  BLOCKED: ['IN_PROGRESS', 'TODO'],
  DONE: [],
}

interface TaskStatusDropdownProps {
  status: TaskStatus
  assigned: boolean
  disabled?: boolean
  onChange: (target: TaskStatus) => void
}

/**
 * Status select honouring the backend state-machine and BR-3:
 * when `assigned` is false the control is locked at TODO.
 */
export function TaskStatusDropdown({ status, assigned, disabled, onChange }: TaskStatusDropdownProps) {
  const targets = ALLOWED[status]
  const br3Locked = status === 'TODO' && !assigned
  const locked = disabled || status === 'DONE' || targets.length === 0 || br3Locked
  const t = strings.tasks.statusDropdown

  return (
    <div className="space-y-1.5">
      <Label htmlFor="task-status-select">{t.label}</Label>
      <Select
        id="task-status-select"
        value={status}
        disabled={locked}
        data-testid="task-status-select"
        onChange={(e) => {
          const next = e.target.value as TaskStatus
          if (next !== status && targets.includes(next)) {
            onChange(next)
          }
        }}
      >
        {TASK_STATUSES.map((s) => (
          <option
            key={s}
            value={s}
            disabled={s !== status && !targets.includes(s)}
          >
            {strings.tasks.status[s]}
          </option>
        ))}
      </Select>
      {br3Locked && (
        <p className="text-xs text-amber-700" data-testid="task-status-lock-reason">
          {t.lockedReason}
        </p>
      )}
    </div>
  )
}

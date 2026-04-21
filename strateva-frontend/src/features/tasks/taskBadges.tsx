import { Badge } from '@/components/ui/badge'
import type { TaskStatus } from '@/types/tasks'
import { strings } from '@/lib/strings'

type BadgeVariant = 'brand' | 'neutral' | 'success' | 'warning'

const STATUS_VARIANT: Record<TaskStatus, BadgeVariant> = {
  TODO: 'neutral',
  IN_PROGRESS: 'brand',
  DONE: 'success',
  BLOCKED: 'warning',
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]} data-testid="task-status">
      {strings.tasks.status[status]}
    </Badge>
  )
}

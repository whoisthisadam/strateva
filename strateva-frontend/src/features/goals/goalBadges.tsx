import { Badge } from '@/components/ui/badge'
import type { GoalPriority, GoalStatus } from '@/types/goals'
import { strings } from '@/lib/strings'

type BadgeVariant = 'brand' | 'neutral' | 'success' | 'warning'

const STATUS_VARIANT: Record<GoalStatus, BadgeVariant> = {
  DRAFT: 'neutral',
  SUBMITTED: 'warning',
  ACTIVE: 'success',
  COMPLETED: 'brand',
  ARCHIVED: 'neutral',
}

const PRIORITY_VARIANT: Record<GoalPriority, BadgeVariant> = {
  LOW: 'neutral',
  MEDIUM: 'brand',
  HIGH: 'warning',
  CRITICAL: 'warning',
}

export function GoalStatusBadge({ status }: { status: GoalStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]} data-testid="goal-status">
      {strings.goals.status[status]}
    </Badge>
  )
}

export function GoalPriorityBadge({ priority }: { priority: GoalPriority }) {
  return (
    <Badge variant={PRIORITY_VARIANT[priority]} data-testid="goal-priority">
      {strings.goals.priority[priority]}
    </Badge>
  )
}

import { Badge } from '@/components/ui/badge'
import type { BacklogStatus } from '@/types/backlog'
import { strings } from '@/lib/strings'

type BadgeVariant = 'brand' | 'neutral' | 'success' | 'warning'

const STATUS_VARIANT: Record<BacklogStatus, BadgeVariant> = {
  DRAFT: 'neutral',
  SUBMITTED: 'warning',
  SIGNED: 'success',
  CANCELLED: 'neutral',
}

export function BacklogStatusBadge({ status }: { status: BacklogStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]} data-testid="backlog-status">
      {strings.backlog.status[status]}
    </Badge>
  )
}

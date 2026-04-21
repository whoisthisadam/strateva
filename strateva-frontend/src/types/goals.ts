export const GOAL_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'ACTIVE',
  'COMPLETED',
  'ARCHIVED',
] as const
export type GoalStatus = (typeof GOAL_STATUSES)[number]

export const GOAL_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
export type GoalPriority = (typeof GOAL_PRIORITIES)[number]

export interface KpiRequestDto {
  name: string
  targetValue: number
  currentValue?: number | null
  unit?: string | null
}

export interface KpiResponseDto {
  id: string
  name: string
  targetValue: number
  currentValue: number
  unit: string | null
}

export interface GoalFormValues {
  title: string
  description?: string
  periodStart: string
  periodEnd: string
  priority: GoalPriority
  kpis: KpiRequestDto[]
}

export interface GoalResponseDto {
  id: string
  title: string
  description: string | null
  periodStart: string
  periodEnd: string
  priority: GoalPriority
  status: GoalStatus
  createdBy: string | null
  createdAt: string
  updatedAt: string
  kpis: KpiResponseDto[]
}

export interface GoalSummaryDto {
  id: string
  title: string
  periodStart: string
  periodEnd: string
  priority: GoalPriority
  status: GoalStatus
  createdAt: string
  kpiCount: number
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface GoalListFilters {
  status?: GoalStatus
  priority?: GoalPriority
  search?: string
  page?: number
  size?: number
}

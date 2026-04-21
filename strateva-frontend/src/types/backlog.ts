import type { GoalPriority, Page } from '@/types/goals'

export const BACKLOG_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'SIGNED',
  'CANCELLED',
] as const
export type BacklogStatus = (typeof BACKLOG_STATUSES)[number]

export interface BacklogItemRequestDto {
  title: string
  description?: string | null
  priority: GoalPriority
}

export interface BacklogItemResponseDto {
  id: string
  title: string
  description: string | null
  priority: GoalPriority
}

export interface BacklogCreateRequestDto {
  title: string
  goalId: string
  items?: BacklogItemRequestDto[]
}

export interface BacklogResponseDto {
  id: string
  title: string
  goalId: string
  goalTitle: string
  status: BacklogStatus
  createdBy: string | null
  createdAt: string
  updatedAt: string
  submittedAt: string | null
  signedAt: string | null
  signedBy: string | null
  cancelledAt: string | null
  cancelledBy: string | null
  items: BacklogItemResponseDto[]
}

export interface BacklogSummaryDto {
  id: string
  title: string
  goalId: string
  goalTitle: string
  status: BacklogStatus
  createdBy: string | null
  createdAt: string
  submittedAt: string | null
  signedAt: string | null
  itemCount: number
}

export interface BacklogListFilters {
  status?: BacklogStatus
  goalId?: string
  search?: string
  page?: number
  size?: number
}

export type { Page }

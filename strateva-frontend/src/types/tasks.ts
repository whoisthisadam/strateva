import type { GoalPriority, Page } from '@/types/goals'

export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export interface TaskCreateRequestDto {
  title: string
  description?: string | null
  goalId: string
  backlogItemId?: string | null
  priority: GoalPriority
  deadline?: string | null
}

export interface TaskUpdateRequestDto {
  title: string
  description?: string | null
  priority: GoalPriority
  deadline?: string | null
}

export interface TaskResponseDto {
  id: string
  title: string
  description: string | null
  goalId: string
  goalTitle: string
  backlogItemId: string | null
  backlogItemTitle: string | null
  priority: GoalPriority
  status: TaskStatus
  deadline: string | null
  assignedTo: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface TaskSummaryDto {
  id: string
  title: string
  goalId: string
  goalTitle: string
  priority: GoalPriority
  status: TaskStatus
  deadline: string | null
  assignedTo: string | null
  createdBy: string | null
  createdAt: string
}

export interface TaskListFilters {
  status?: TaskStatus
  priority?: GoalPriority
  goalId?: string
  assignee?: string
  search?: string
  page?: number
  size?: number
}

export type { Page }

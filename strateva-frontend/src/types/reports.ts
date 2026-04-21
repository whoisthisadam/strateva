import type { GoalPriority, GoalStatus } from '@/types/goals'
import type { TaskStatus } from '@/types/tasks'

export interface ReportResponseDto<T> {
  generatedAt: string
  generatedBy: string | null
  count: number
  rows: T[]
}

export interface ReportsOverviewDto {
  generatedAt: string
  generatedBy: string | null
  goalsTotal: number
  goalsActive: number
  tasksTotal: number
  tasksDone: number
  tasksOverdue: number
  backlogsSigned: number
}

export interface GoalProgressRowDto {
  goalId: string
  title: string
  status: GoalStatus
  totalTasks: number
  doneTasks: number
  percent: number
}

export interface KpiProgressRowDto {
  kpiId: string
  goalId: string
  goalTitle: string
  name: string
  currentValue: number
  targetValue: number
  unit: string | null
  percent: number
}

export interface TaskWorkloadRowDto {
  assignee: string | null
  status: TaskStatus
  count: number
}

export interface OverdueTaskRowDto {
  taskId: string
  title: string
  goalId: string
  goalTitle: string
  assignee: string | null
  deadline: string
  daysOverdue: number
  status: TaskStatus
  priority: GoalPriority
}

export interface BacklogThroughputRowDto {
  period: string
  signedCount: number
  itemCount: number
}

export type ReportKey =
  | 'goals-progress'
  | 'kpis-progress'
  | 'task-workload'
  | 'overdue-tasks'
  | 'backlog-throughput'

import { http } from '@/lib/http'
import type {
  Page,
  TaskCreateRequestDto,
  TaskListFilters,
  TaskResponseDto,
  TaskStatus,
  TaskSummaryDto,
  TaskUpdateRequestDto,
} from '@/types/tasks'

export async function listTasks(filters: TaskListFilters = {}): Promise<Page<TaskSummaryDto>> {
  const params: Record<string, string | number> = {}
  if (filters.status) params.status = filters.status
  if (filters.priority) params.priority = filters.priority
  if (filters.goalId) params.goalId = filters.goalId
  if (filters.assignee) params.assignee = filters.assignee
  if (filters.search && filters.search.trim().length > 0) params.search = filters.search.trim()
  if (typeof filters.page === 'number') params.page = filters.page
  if (typeof filters.size === 'number') params.size = filters.size
  const { data } = await http.get<Page<TaskSummaryDto>>('/v1/tasks', { params })
  return data
}

export async function fetchTask(id: string): Promise<TaskResponseDto> {
  const { data } = await http.get<TaskResponseDto>(`/v1/tasks/${id}`)
  return data
}

export async function createTask(values: TaskCreateRequestDto): Promise<TaskResponseDto> {
  const { data } = await http.post<TaskResponseDto>('/v1/tasks', values)
  return data
}

export async function updateTask(
  id: string,
  values: TaskUpdateRequestDto,
): Promise<TaskResponseDto> {
  const { data } = await http.patch<TaskResponseDto>(`/v1/tasks/${id}`, values)
  return data
}

export async function assignTask(id: string, assignee: string): Promise<TaskResponseDto> {
  const { data } = await http.post<TaskResponseDto>(`/v1/tasks/${id}/assignee`, { assignee })
  return data
}

export async function changeTaskStatus(
  id: string,
  status: TaskStatus,
): Promise<TaskResponseDto> {
  const { data } = await http.post<TaskResponseDto>(`/v1/tasks/${id}/status`, { status })
  return data
}

export async function deleteTask(id: string): Promise<void> {
  await http.delete(`/v1/tasks/${id}`)
}

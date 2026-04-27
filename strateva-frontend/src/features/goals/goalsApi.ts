import { http } from '@/lib/http'
import type {
  GoalFormValues,
  GoalListFilters,
  GoalResponseDto,
  GoalSummaryDto,
  Page,
} from '@/types/goals'

export async function listGoals(filters: GoalListFilters = {}): Promise<Page<GoalSummaryDto>> {
  const params: Record<string, string | number> = {}
  if (filters.status) params.status = filters.status
  if (filters.priority) params.priority = filters.priority
  if (filters.search && filters.search.trim().length > 0) params.search = filters.search.trim()
  if (typeof filters.page === 'number') params.page = filters.page
  if (typeof filters.size === 'number') params.size = filters.size
  const { data } = await http.get<Page<GoalSummaryDto>>('/v1/goals', { params })
  return data
}

export async function fetchGoal(id: string): Promise<GoalResponseDto> {
  const { data } = await http.get<GoalResponseDto>(`/v1/goals/${id}`)
  return data
}

export async function createGoal(values: GoalFormValues): Promise<GoalResponseDto> {
  const { data } = await http.post<GoalResponseDto>('/v1/goals', values)
  return data
}

export async function updateGoal(id: string, values: GoalFormValues): Promise<GoalResponseDto> {
  const { data } = await http.patch<GoalResponseDto>(`/v1/goals/${id}`, values)
  return data
}

export async function activateGoal(id: string): Promise<GoalResponseDto> {
  const { data } = await http.post<GoalResponseDto>(`/v1/goals/${id}/activate`)
  return data
}

export async function completeGoal(id: string): Promise<GoalResponseDto> {
  const { data } = await http.post<GoalResponseDto>(`/v1/goals/${id}/complete`)
  return data
}

export async function archiveGoal(id: string): Promise<GoalResponseDto> {
  const { data } = await http.post<GoalResponseDto>(`/v1/goals/${id}/archive`)
  return data
}

export async function deleteGoal(id: string): Promise<void> {
  await http.delete(`/v1/goals/${id}`)
}

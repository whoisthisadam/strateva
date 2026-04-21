import { http } from '@/lib/http'
import type {
  BacklogCreateRequestDto,
  BacklogItemRequestDto,
  BacklogListFilters,
  BacklogResponseDto,
  BacklogSummaryDto,
  Page,
} from '@/types/backlog'

export async function listBacklogs(
  filters: BacklogListFilters = {},
): Promise<Page<BacklogSummaryDto>> {
  const params: Record<string, string | number> = {}
  if (filters.status) params.status = filters.status
  if (filters.goalId) params.goalId = filters.goalId
  if (filters.search && filters.search.trim().length > 0) params.search = filters.search.trim()
  if (typeof filters.page === 'number') params.page = filters.page
  if (typeof filters.size === 'number') params.size = filters.size
  const { data } = await http.get<Page<BacklogSummaryDto>>('/v1/backlogs', { params })
  return data
}

export async function fetchBacklog(id: string): Promise<BacklogResponseDto> {
  const { data } = await http.get<BacklogResponseDto>(`/v1/backlogs/${id}`)
  return data
}

export async function createBacklog(
  values: BacklogCreateRequestDto,
): Promise<BacklogResponseDto> {
  const { data } = await http.post<BacklogResponseDto>('/v1/backlogs', values)
  return data
}

export async function addBacklogItem(
  backlogId: string,
  item: BacklogItemRequestDto,
): Promise<BacklogResponseDto> {
  const { data } = await http.post<BacklogResponseDto>(
    `/v1/backlogs/${backlogId}/items`,
    item,
  )
  return data
}

export async function updateBacklogItem(
  backlogId: string,
  itemId: string,
  item: BacklogItemRequestDto,
): Promise<BacklogResponseDto> {
  const { data } = await http.patch<BacklogResponseDto>(
    `/v1/backlogs/${backlogId}/items/${itemId}`,
    item,
  )
  return data
}

export async function removeBacklogItem(
  backlogId: string,
  itemId: string,
): Promise<BacklogResponseDto> {
  const { data } = await http.delete<BacklogResponseDto>(
    `/v1/backlogs/${backlogId}/items/${itemId}`,
  )
  return data
}

export async function submitBacklog(id: string): Promise<BacklogResponseDto> {
  const { data } = await http.post<BacklogResponseDto>(`/v1/backlogs/${id}/submit`)
  return data
}

export async function signBacklog(id: string): Promise<BacklogResponseDto> {
  const { data } = await http.post<BacklogResponseDto>(`/v1/backlogs/${id}/sign`)
  return data
}

export async function cancelBacklog(id: string): Promise<BacklogResponseDto> {
  const { data } = await http.post<BacklogResponseDto>(`/v1/backlogs/${id}/cancel`)
  return data
}

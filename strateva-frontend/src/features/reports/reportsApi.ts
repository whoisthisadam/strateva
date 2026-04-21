import { http } from '@/lib/http'
import type {
  BacklogThroughputRowDto,
  GoalProgressRowDto,
  KpiProgressRowDto,
  OverdueTaskRowDto,
  ReportKey,
  ReportResponseDto,
  ReportsOverviewDto,
  TaskWorkloadRowDto,
} from '@/types/reports'

export async function fetchOverview(): Promise<ReportsOverviewDto> {
  const { data } = await http.get<ReportsOverviewDto>('/v1/reports/overview')
  return data
}

export async function fetchGoalsProgress(): Promise<ReportResponseDto<GoalProgressRowDto>> {
  const { data } = await http.get<ReportResponseDto<GoalProgressRowDto>>(
    '/v1/reports/goals-progress',
  )
  return data
}

export async function fetchKpisProgress(): Promise<ReportResponseDto<KpiProgressRowDto>> {
  const { data } = await http.get<ReportResponseDto<KpiProgressRowDto>>(
    '/v1/reports/kpis-progress',
  )
  return data
}

export async function fetchTaskWorkload(): Promise<ReportResponseDto<TaskWorkloadRowDto>> {
  const { data } = await http.get<ReportResponseDto<TaskWorkloadRowDto>>(
    '/v1/reports/task-workload',
  )
  return data
}

export async function fetchOverdueTasks(): Promise<ReportResponseDto<OverdueTaskRowDto>> {
  const { data } = await http.get<ReportResponseDto<OverdueTaskRowDto>>(
    '/v1/reports/overdue-tasks',
  )
  return data
}

export async function fetchBacklogThroughput(): Promise<ReportResponseDto<BacklogThroughputRowDto>> {
  const { data } = await http.get<ReportResponseDto<BacklogThroughputRowDto>>(
    '/v1/reports/backlog-throughput',
  )
  return data
}

/**
 * Streams a report as a text/csv blob and triggers a browser download via an
 * anchor element. The server prepends a UTF-8 BOM so Excel recognises the
 * Cyrillic payload without an import wizard.
 */
export async function downloadReportCsv(key: ReportKey, filename: string): Promise<void> {
  const response = await http.get<Blob>(`/v1/reports/${key}`, {
    params: { format: 'csv' },
    responseType: 'blob',
  })
  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(url)
}

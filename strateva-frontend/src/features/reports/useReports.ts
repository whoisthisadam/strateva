import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import {
  downloadReportCsv,
  fetchBacklogThroughput,
  fetchGoalsProgress,
  fetchKpisProgress,
  fetchOverdueTasks,
  fetchOverview,
  fetchTaskWorkload,
} from '@/features/reports/reportsApi'
import { strings } from '@/lib/strings'
import type { ReportKey } from '@/types/reports'

const REPORTS_KEY = ['reports'] as const

export function useReportsOverview(enabled = true) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'overview'],
    queryFn: fetchOverview,
    enabled,
  })
}

export function useGoalsProgress(enabled = true) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'goals-progress'],
    queryFn: fetchGoalsProgress,
    enabled,
  })
}

export function useKpisProgress(enabled = true) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'kpis-progress'],
    queryFn: fetchKpisProgress,
    enabled,
  })
}

export function useTaskWorkload(enabled = true) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'task-workload'],
    queryFn: fetchTaskWorkload,
    enabled,
  })
}

export function useOverdueTasks(enabled = true) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'overdue-tasks'],
    queryFn: fetchOverdueTasks,
    enabled,
  })
}

export function useBacklogThroughput(enabled = true) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'backlog-throughput'],
    queryFn: fetchBacklogThroughput,
    enabled,
  })
}

export function useDownloadReportCsv() {
  return useMutation({
    mutationFn: ({ key, filename }: { key: ReportKey; filename: string }) =>
      downloadReportCsv(key, filename),
    onError: (err: unknown) => {
      if (err instanceof AxiosError) {
        const data = err.response?.data as { message?: string } | undefined
        if (data?.message) {
          toast.error(data.message)
          return
        }
      }
      toast.error(strings.reports.toast.exportFailed)
    },
  })
}

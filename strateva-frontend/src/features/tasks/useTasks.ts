import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import {
  assignTask,
  changeTaskStatus,
  createTask,
  deleteTask,
  fetchTask,
  listTasks,
  updateTask,
} from '@/features/tasks/tasksApi'
import { strings } from '@/lib/strings'
import type {
  TaskCreateRequestDto,
  TaskListFilters,
  TaskStatus,
  TaskUpdateRequestDto,
} from '@/types/tasks'

const TASKS_KEY = ['tasks'] as const

export function useTasksList(filters: TaskListFilters) {
  return useQuery({
    queryKey: [...TASKS_KEY, 'list', filters],
    queryFn: () => listTasks(filters),
  })
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: [...TASKS_KEY, 'detail', id],
    queryFn: () => fetchTask(id as string),
    enabled: !!id,
  })
}

function invalidateTasks(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: TASKS_KEY })
}

function handleError(err: unknown) {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { message?: string } | undefined
    if (data?.message) {
      toast.error(data.message)
      return
    }
  }
  toast.error(strings.errors.unknown)
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: TaskCreateRequestDto) => createTask(values),
    onSuccess: () => {
      toast.success(strings.tasks.toast.created)
      invalidateTasks(qc)
    },
    onError: handleError,
  })
}

export function useUpdateTask(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: TaskUpdateRequestDto) => updateTask(id, values),
    onSuccess: () => {
      toast.success(strings.tasks.toast.updated)
      invalidateTasks(qc)
    },
    onError: handleError,
  })
}

export function useAssignTask(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (assignee: string) => assignTask(id, assignee),
    onSuccess: () => {
      toast.success(strings.tasks.toast.assigned)
      invalidateTasks(qc)
    },
    onError: handleError,
  })
}

export function useChangeTaskStatus(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (status: TaskStatus) => changeTaskStatus(id, status),
    onSuccess: () => {
      toast.success(strings.tasks.toast.statusChanged)
      invalidateTasks(qc)
    },
    onError: handleError,
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      toast.success(strings.tasks.toast.deleted)
      invalidateTasks(qc)
    },
    onError: handleError,
  })
}

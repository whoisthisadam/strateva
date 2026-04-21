import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import {
  changeGoalStatus,
  createGoal,
  deleteGoal,
  fetchGoal,
  listGoals,
  submitGoal,
  updateGoal,
} from '@/features/goals/goalsApi'
import { strings } from '@/lib/strings'
import type {
  GoalFormValues,
  GoalListFilters,
  GoalStatus,
} from '@/types/goals'

const GOALS_KEY = ['goals'] as const

export function useGoalsList(filters: GoalListFilters) {
  return useQuery({
    queryKey: [...GOALS_KEY, 'list', filters],
    queryFn: () => listGoals(filters),
  })
}

export function useGoal(id: string | undefined) {
  return useQuery({
    queryKey: [...GOALS_KEY, 'detail', id],
    queryFn: () => fetchGoal(id as string),
    enabled: !!id,
  })
}

function invalidateGoals(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: GOALS_KEY })
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

export function useCreateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: GoalFormValues) => createGoal(values),
    onSuccess: () => {
      toast.success(strings.goals.toast.created)
      invalidateGoals(qc)
    },
    onError: handleError,
  })
}

export function useUpdateGoal(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: GoalFormValues) => updateGoal(id, values),
    onSuccess: () => {
      toast.success(strings.goals.toast.updated)
      invalidateGoals(qc)
    },
    onError: handleError,
  })
}

export function useSubmitGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => submitGoal(id),
    onSuccess: () => {
      toast.success(strings.goals.toast.submitted)
      invalidateGoals(qc)
    },
    onError: handleError,
  })
}

export function useChangeGoalStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: GoalStatus }) =>
      changeGoalStatus(id, status),
    onSuccess: (_data, { status }) => {
      const toastMap: Record<GoalStatus, string | null> = {
        DRAFT: null,
        SUBMITTED: strings.goals.toast.submitted,
        ACTIVE: strings.goals.toast.activated,
        COMPLETED: strings.goals.toast.completed,
        ARCHIVED: strings.goals.toast.archived,
      }
      const msg = toastMap[status]
      if (msg) toast.success(msg)
      invalidateGoals(qc)
    },
    onError: handleError,
  })
}

export function useDeleteGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteGoal(id),
    onSuccess: () => {
      toast.success(strings.goals.toast.deleted)
      invalidateGoals(qc)
    },
    onError: handleError,
  })
}

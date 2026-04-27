import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import {
  activateGoal,
  archiveGoal,
  completeGoal,
  createGoal,
  deleteGoal,
  fetchGoal,
  listGoals,
  updateGoal,
} from '@/features/goals/goalsApi'
import { strings } from '@/lib/strings'
import type {
  GoalFormValues,
  GoalListFilters,
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

export function useActivateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => activateGoal(id),
    onSuccess: () => {
      toast.success(strings.goals.toast.activated)
      invalidateGoals(qc)
    },
    onError: handleError,
  })
}

export function useCompleteGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => completeGoal(id),
    onSuccess: () => {
      toast.success(strings.goals.toast.completed)
      invalidateGoals(qc)
    },
    onError: handleError,
  })
}

export function useArchiveGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => archiveGoal(id),
    onSuccess: () => {
      toast.success(strings.goals.toast.archived)
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

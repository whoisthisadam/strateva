import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import {
  addBacklogItem,
  cancelBacklog,
  createBacklog,
  fetchBacklog,
  listBacklogs,
  removeBacklogItem,
  signBacklog,
  submitBacklog,
  updateBacklogItem,
} from '@/features/backlogs/backlogsApi'
import { strings } from '@/lib/strings'
import type {
  BacklogCreateRequestDto,
  BacklogItemRequestDto,
  BacklogListFilters,
} from '@/types/backlog'

const BACKLOGS_KEY = ['backlogs'] as const

export function useBacklogsList(filters: BacklogListFilters) {
  return useQuery({
    queryKey: [...BACKLOGS_KEY, 'list', filters],
    queryFn: () => listBacklogs(filters),
  })
}

export function useBacklog(id: string | undefined) {
  return useQuery({
    queryKey: [...BACKLOGS_KEY, 'detail', id],
    queryFn: () => fetchBacklog(id as string),
    enabled: !!id,
  })
}

function invalidateBacklogs(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: BACKLOGS_KEY })
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

export function useCreateBacklog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: BacklogCreateRequestDto) => createBacklog(values),
    onSuccess: () => {
      toast.success(strings.backlog.toast.created)
      invalidateBacklogs(qc)
    },
    onError: handleError,
  })
}

export function useAddBacklogItem(backlogId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (item: BacklogItemRequestDto) => addBacklogItem(backlogId, item),
    onSuccess: () => {
      toast.success(strings.backlog.toast.itemAdded)
      invalidateBacklogs(qc)
    },
    onError: handleError,
  })
}

export function useUpdateBacklogItem(backlogId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, item }: { itemId: string; item: BacklogItemRequestDto }) =>
      updateBacklogItem(backlogId, itemId, item),
    onSuccess: () => {
      toast.success(strings.backlog.toast.itemUpdated)
      invalidateBacklogs(qc)
    },
    onError: handleError,
  })
}

export function useRemoveBacklogItem(backlogId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) => removeBacklogItem(backlogId, itemId),
    onSuccess: () => {
      toast.success(strings.backlog.toast.itemRemoved)
      invalidateBacklogs(qc)
    },
    onError: handleError,
  })
}

export function useSubmitBacklog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => submitBacklog(id),
    onSuccess: () => {
      toast.success(strings.backlog.toast.submitted)
      invalidateBacklogs(qc)
    },
    onError: handleError,
  })
}

export function useSignBacklog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => signBacklog(id),
    onSuccess: () => {
      toast.success(strings.backlog.toast.signed)
      invalidateBacklogs(qc)
    },
    onError: handleError,
  })
}

export function useCancelBacklog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cancelBacklog(id),
    onSuccess: () => {
      toast.success(strings.backlog.toast.cancelled)
      invalidateBacklogs(qc)
    },
    onError: handleError,
  })
}

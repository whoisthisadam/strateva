import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { backlogItemSchema, type BacklogItemSchema } from '@/features/backlogs/backlogSchema'
import { GOAL_PRIORITIES, type GoalPriority } from '@/types/goals'
import type { BacklogItemRequestDto } from '@/types/backlog'
import { strings } from '@/lib/strings'

interface BacklogItemFormProps {
  defaultValues?: Partial<BacklogItemRequestDto>
  mode: 'create' | 'edit'
  submitting?: boolean
  onSubmit: (values: BacklogItemRequestDto) => void | Promise<void>
  onCancel: () => void
}

export function BacklogItemForm({
  defaultValues,
  mode,
  submitting,
  onSubmit,
  onCancel,
}: BacklogItemFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BacklogItemSchema>({
    resolver: zodResolver(backlogItemSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      priority: (defaultValues?.priority as GoalPriority) ?? 'MEDIUM',
    },
  })
  const t = strings.backlog.itemForm

  const submit = handleSubmit(async (v) => {
    await onSubmit({
      title: v.title,
      description: v.description && v.description.length > 0 ? v.description : null,
      priority: v.priority,
    })
  })

  return (
    <form
      className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/40 p-4"
      onSubmit={submit}
      noValidate
      data-testid="backlog-item-form"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
        <div className="sm:col-span-6 space-y-1.5">
          <Label htmlFor="item-title">{t.titleLabel}</Label>
          <Input
            id="item-title"
            placeholder={t.titlePlaceholder}
            invalid={!!errors.title}
            {...register('title')}
          />
          {errors.title && (
            <p className="text-xs text-red-600" role="alert">{errors.title.message}</p>
          )}
        </div>
        <div className="sm:col-span-6 space-y-1.5">
          <Label htmlFor="item-priority">{t.priorityLabel}</Label>
          <Select id="item-priority" invalid={!!errors.priority} {...register('priority')}>
            {GOAL_PRIORITIES.map((p) => (
              <option key={p} value={p}>{strings.goals.priority[p]}</option>
            ))}
          </Select>
        </div>
        <div className="sm:col-span-12 space-y-1.5">
          <Label htmlFor="item-description">{t.descriptionLabel}</Label>
          <Textarea
            id="item-description"
            placeholder={t.descriptionPlaceholder}
            {...register('description')}
          />
          {errors.description && (
            <p className="text-xs text-red-600" role="alert">{errors.description.message}</p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          {strings.app.cancel}
        </Button>
        <Button type="submit" size="sm" disabled={submitting} data-testid="backlog-item-submit">
          {mode === 'create' ? t.submitCreate : t.submitUpdate}
        </Button>
      </div>
    </form>
  )
}

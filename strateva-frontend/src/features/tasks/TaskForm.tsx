import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  taskCreateSchema,
  taskUpdateSchema,
  type TaskCreateSchema,
  type TaskUpdateSchema,
} from '@/features/tasks/taskSchema'
import { GOAL_PRIORITIES, type GoalPriority, type GoalSummaryDto } from '@/types/goals'
import type { TaskCreateRequestDto, TaskUpdateRequestDto } from '@/types/tasks'
import { strings } from '@/lib/strings'

interface BaseProps {
  submitting?: boolean
  onCancel: () => void
}

interface CreateProps extends BaseProps {
  mode: 'create'
  goals: GoalSummaryDto[]
  goalsLoading?: boolean
  defaultValues?: Partial<TaskCreateRequestDto>
  onSubmit: (values: TaskCreateRequestDto) => void | Promise<void>
}

interface EditProps extends BaseProps {
  mode: 'edit'
  defaultValues: Partial<TaskUpdateRequestDto>
  onSubmit: (values: TaskUpdateRequestDto) => void | Promise<void>
}

export function TaskForm(props: CreateProps | EditProps) {
  const t = strings.tasks.form
  if (props.mode === 'create') return <CreateForm {...props} t={t} />
  return <EditForm {...props} t={t} />
}

type FormStrings = typeof strings.tasks.form

function CreateForm({
  goals,
  goalsLoading,
  defaultValues,
  submitting,
  onSubmit,
  onCancel,
  t,
}: CreateProps & { t: FormStrings }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskCreateSchema>({
    resolver: zodResolver(taskCreateSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      goalId: defaultValues?.goalId ?? '',
      priority: (defaultValues?.priority as GoalPriority) ?? 'MEDIUM',
      deadline: defaultValues?.deadline ?? '',
    },
  })
  const submit = handleSubmit(async (v) => {
    await onSubmit({
      title: v.title,
      description: v.description && v.description.length > 0 ? v.description : null,
      goalId: v.goalId,
      priority: v.priority,
      deadline: v.deadline && v.deadline.length > 0 ? v.deadline : null,
    })
  })
  return (
    <form className="space-y-5" onSubmit={submit} noValidate data-testid="task-form">
      <TitleField register={register} errors={errors} t={t} />
      <DescriptionField register={register} errors={errors} t={t} />
      <div className="space-y-1.5">
        <Label htmlFor="goalId">{t.goalLabel}</Label>
        <Select
          id="goalId"
          invalid={!!errors.goalId}
          disabled={goalsLoading || goals.length === 0}
          data-testid="task-goal"
          {...register('goalId')}
        >
          <option value="">{t.goalPlaceholder}</option>
          {goals.map((g) => (
            <option key={g.id} value={g.id}>{g.title}</option>
          ))}
        </Select>
        {!goalsLoading && goals.length === 0 && (
          <p className="text-xs text-slate-500">{t.noGoals}</p>
        )}
        {errors.goalId && (
          <p className="text-xs text-red-600" role="alert">{errors.goalId.message}</p>
        )}
      </div>
      <PriorityDeadlineRow register={register} errors={errors} t={t} />
      <FormActions submitting={submitting} onCancel={onCancel} label={t.submitCreate} t={t} />
    </form>
  )
}

function EditForm({ defaultValues, submitting, onSubmit, onCancel, t }: EditProps & { t: FormStrings }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskUpdateSchema>({
    resolver: zodResolver(taskUpdateSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      priority: (defaultValues?.priority as GoalPriority) ?? 'MEDIUM',
      deadline: defaultValues?.deadline ?? '',
    },
  })
  const submit = handleSubmit(async (v) => {
    await onSubmit({
      title: v.title,
      description: v.description && v.description.length > 0 ? v.description : null,
      priority: v.priority,
      deadline: v.deadline && v.deadline.length > 0 ? v.deadline : null,
    })
  })
  return (
    <form className="space-y-5" onSubmit={submit} noValidate data-testid="task-form">
      <TitleField register={register} errors={errors} t={t} />
      <DescriptionField register={register} errors={errors} t={t} />
      <PriorityDeadlineRow register={register} errors={errors} t={t} />
      <FormActions submitting={submitting} onCancel={onCancel} label={t.submitUpdate} t={t} />
    </form>
  )
}

type AnyRegister = ReturnType<typeof useForm<TaskCreateSchema>>['register']
type AnyErrors = ReturnType<typeof useForm<TaskCreateSchema>>['formState']['errors']

function TitleField({ register, errors, t }: { register: AnyRegister; errors: AnyErrors; t: FormStrings }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="title">{t.titleLabel}</Label>
      <Input
        id="title"
        placeholder={t.titlePlaceholder}
        invalid={!!errors.title}
        data-testid="task-title"
        {...register('title')}
      />
      {errors.title && <p className="text-xs text-red-600" role="alert">{errors.title.message}</p>}
    </div>
  )
}

function DescriptionField({ register, errors, t }: { register: AnyRegister; errors: AnyErrors; t: FormStrings }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="description">{t.descriptionLabel}</Label>
      <Textarea
        id="description"
        placeholder={t.descriptionPlaceholder}
        {...register('description')}
      />
      {errors.description && (
        <p className="text-xs text-red-600" role="alert">{errors.description.message}</p>
      )}
    </div>
  )
}

function PriorityDeadlineRow({ register, errors, t }: { register: AnyRegister; errors: AnyErrors; t: FormStrings }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="priority">{t.priorityLabel}</Label>
        <Select id="priority" invalid={!!errors.priority} data-testid="task-priority" {...register('priority')}>
          {GOAL_PRIORITIES.map((p) => (
            <option key={p} value={p}>{strings.goals.priority[p]}</option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="deadline">{t.deadlineLabel}</Label>
        <Input
          id="deadline"
          type="date"
          data-testid="task-deadline"
          {...register('deadline')}
        />
      </div>
    </div>
  )
}

function FormActions({
  submitting,
  onCancel,
  label,
  t,
}: {
  submitting?: boolean
  onCancel: () => void
  label: string
  t: FormStrings
}) {
  return (
    <div className="flex items-center justify-end gap-3 pt-2">
      <Button type="button" variant="secondary" onClick={onCancel}>
        {strings.app.cancel}
      </Button>
      <Button type="submit" disabled={submitting} data-testid="task-submit">
        {submitting ? t.submitting : label}
      </Button>
    </div>
  )
}

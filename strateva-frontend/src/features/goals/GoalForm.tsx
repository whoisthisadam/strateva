import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { goalFormSchema, type GoalFormSchema } from '@/features/goals/goalSchema'
import { GOAL_PRIORITIES, type GoalFormValues } from '@/types/goals'
import { strings } from '@/lib/strings'

interface GoalFormProps {
  defaultValues?: Partial<GoalFormValues>
  submitting?: boolean
  onSubmit: (values: GoalFormValues) => void | Promise<void>
  onCancel?: () => void
}

const emptyKpi = { name: '', targetValue: 0, currentValue: 0, unit: '' }

export function GoalForm({ defaultValues, submitting, onSubmit, onCancel }: GoalFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<GoalFormSchema>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      periodStart: defaultValues?.periodStart ?? '',
      periodEnd: defaultValues?.periodEnd ?? '',
      priority: defaultValues?.priority ?? 'MEDIUM',
      kpis:
        defaultValues?.kpis && defaultValues.kpis.length > 0
          ? defaultValues.kpis.map((k) => ({
              name: k.name,
              targetValue: Number(k.targetValue),
              currentValue: k.currentValue == null ? 0 : Number(k.currentValue),
              unit: k.unit ?? '',
            }))
          : [emptyKpi],
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'kpis' })
  const t = strings.goals.form

  const submit = handleSubmit(async (v) => {
    await onSubmit({
      title: v.title,
      description: v.description ?? undefined,
      periodStart: v.periodStart,
      periodEnd: v.periodEnd,
      priority: v.priority,
      kpis: v.kpis.map((k) => ({
        name: k.name,
        targetValue: Number(k.targetValue),
        currentValue: k.currentValue == null ? 0 : Number(k.currentValue),
        unit: k.unit || null,
      })),
    })
  })

  return (
    <form className="space-y-6" onSubmit={submit} noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="title">{t.titleLabel}</Label>
          <Input
            id="title"
            placeholder={t.titlePlaceholder}
            invalid={!!errors.title}
            {...register('title')}
          />
          {errors.title && <p className="text-xs text-red-600" role="alert">{errors.title.message}</p>}
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="description">{t.descriptionLabel}</Label>
          <Textarea
            id="description"
            placeholder={t.descriptionPlaceholder}
            {...register('description')}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="periodStart">{t.periodStartLabel}</Label>
          <Input id="periodStart" type="date" invalid={!!errors.periodStart} {...register('periodStart')} />
          {errors.periodStart && (
            <p className="text-xs text-red-600" role="alert">{errors.periodStart.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="periodEnd">{t.periodEndLabel}</Label>
          <Input id="periodEnd" type="date" invalid={!!errors.periodEnd} {...register('periodEnd')} />
          {errors.periodEnd && (
            <p className="text-xs text-red-600" role="alert">{errors.periodEnd.message}</p>
          )}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="priority">{t.priorityLabel}</Label>
          <Select id="priority" invalid={!!errors.priority} {...register('priority')}>
            {GOAL_PRIORITIES.map((p) => (
              <option key={p} value={p}>{strings.goals.priority[p]}</option>
            ))}
          </Select>
        </div>
      </div>

      <section aria-labelledby="kpis-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="kpis-heading" className="text-base font-semibold text-slate-900">{t.kpisTitle}</h2>
            <p className="text-xs text-slate-500">{t.kpisHint}</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => append(emptyKpi)}
            data-testid="add-kpi"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> {t.addKpi}
          </Button>
        </div>

        {errors.kpis && typeof errors.kpis.message === 'string' && (
          <p className="text-xs text-red-600" role="alert">{errors.kpis.message}</p>
        )}

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              data-testid="kpi-row"
              className="rounded-xl border border-slate-200 bg-slate-50/40 p-4"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                <div className="sm:col-span-5 space-y-1.5">
                  <Label>{t.kpiName}</Label>
                  <Input
                    invalid={!!errors.kpis?.[index]?.name}
                    {...register(`kpis.${index}.name` as const)}
                  />
                </div>
                <div className="sm:col-span-3 space-y-1.5">
                  <Label>{t.kpiTarget}</Label>
                  <Input
                    type="number"
                    step="any"
                    invalid={!!errors.kpis?.[index]?.targetValue}
                    {...register(`kpis.${index}.targetValue` as const, { valueAsNumber: true })}
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>{t.kpiCurrent}</Label>
                  <Input
                    type="number"
                    step="any"
                    {...register(`kpis.${index}.currentValue` as const, { valueAsNumber: true })}
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>{t.kpiUnit}</Label>
                  <Input placeholder={t.kpiUnitPlaceholder} {...register(`kpis.${index}.unit` as const)} />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  data-testid="remove-kpi"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" /> {t.removeKpi}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            {strings.app.cancel}
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? t.submitting : t.submit}
        </Button>
      </div>
    </form>
  )
}

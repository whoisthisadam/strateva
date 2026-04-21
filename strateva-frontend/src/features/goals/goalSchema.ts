import { z } from 'zod'
import { strings } from '@/lib/strings'
import { GOAL_PRIORITIES } from '@/types/goals'

const V = strings.goals.form.validation

const kpiSchema = z.object({
  name: z.string().trim().min(1, V.kpiNameRequired).max(200, V.kpiNameRequired),
  targetValue: z
    .number({ message: V.kpiTargetRequired })
    .min(0, V.kpiTargetNonNegative),
  currentValue: z
    .number()
    .min(0, V.kpiTargetNonNegative)
    .optional()
    .nullable(),
  unit: z.string().max(40).optional().nullable(),
})

export const goalFormSchema = z
  .object({
    title: z.string().trim().min(1, V.titleRequired).max(200, V.titleTooLong),
    description: z.string().max(2000).optional().nullable(),
    periodStart: z.string().min(1, V.periodStartRequired),
    periodEnd: z.string().min(1, V.periodEndRequired),
    priority: z.enum(GOAL_PRIORITIES, { message: V.priorityRequired }),
    kpis: z.array(kpiSchema).min(1, V.atLeastOneKpi),
  })
  .refine(
    (data) => {
      if (!data.periodStart || !data.periodEnd) return true
      return new Date(data.periodStart) <= new Date(data.periodEnd)
    },
    { message: V.periodOrder, path: ['periodEnd'] },
  )

export type GoalFormSchema = z.infer<typeof goalFormSchema>

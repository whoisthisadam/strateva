import { z } from 'zod'
import { strings } from '@/lib/strings'
import { GOAL_PRIORITIES } from '@/types/goals'

const V = strings.tasks.form.validation

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1, V.titleRequired).max(200, V.titleTooLong),
  description: z.string().max(2000, V.descriptionTooLong).optional().nullable(),
  goalId: z.string().trim().min(1, V.goalRequired),
  priority: z.enum(GOAL_PRIORITIES, { message: V.priorityRequired }),
  deadline: z.string().optional().nullable(),
})

export type TaskCreateSchema = z.infer<typeof taskCreateSchema>

export const taskUpdateSchema = z.object({
  title: z.string().trim().min(1, V.titleRequired).max(200, V.titleTooLong),
  description: z.string().max(2000, V.descriptionTooLong).optional().nullable(),
  priority: z.enum(GOAL_PRIORITIES, { message: V.priorityRequired }),
  deadline: z.string().optional().nullable(),
})

export type TaskUpdateSchema = z.infer<typeof taskUpdateSchema>

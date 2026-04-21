import { z } from 'zod'
import { strings } from '@/lib/strings'
import { GOAL_PRIORITIES } from '@/types/goals'

const CV = strings.backlog.form.validation
const IV = strings.backlog.itemForm.validation

export const backlogCreateSchema = z.object({
  title: z.string().trim().min(1, CV.titleRequired).max(200, CV.titleTooLong),
  goalId: z.string().trim().min(1, CV.goalRequired),
})

export type BacklogCreateSchema = z.infer<typeof backlogCreateSchema>

export const backlogItemSchema = z.object({
  title: z.string().trim().min(1, IV.titleRequired).max(200, IV.titleTooLong),
  description: z.string().max(2000, IV.descriptionTooLong).optional().nullable(),
  priority: z.enum(GOAL_PRIORITIES, { message: IV.priorityRequired }),
})

export type BacklogItemSchema = z.infer<typeof backlogItemSchema>

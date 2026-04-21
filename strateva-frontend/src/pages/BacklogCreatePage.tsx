import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useGoalsList } from '@/features/goals/useGoals'
import { useCreateBacklog } from '@/features/backlogs/useBacklogs'
import {
  backlogCreateSchema,
  type BacklogCreateSchema,
} from '@/features/backlogs/backlogSchema'
import { strings } from '@/lib/strings'

export function BacklogCreatePage() {
  const navigate = useNavigate()
  const createMutation = useCreateBacklog()
  const { data: goalsPage, isLoading: goalsLoading } = useGoalsList({ size: 200 })
  const goals = goalsPage?.content ?? []

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BacklogCreateSchema>({
    resolver: zodResolver(backlogCreateSchema),
    defaultValues: { title: '', goalId: '' },
  })
  const t = strings.backlog.form

  const submit = handleSubmit(async (values) => {
    const created = await createMutation.mutateAsync({
      title: values.title,
      goalId: values.goalId,
    })
    navigate(`/backlogs/${created.id}`)
  })

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          to="/backlogs"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {strings.backlog.backToList}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {t.createTitle}
        </h1>
      </div>
      <Card>
        <CardContent className="p-6">
          <form className="space-y-5" onSubmit={submit} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="title">{t.titleLabel}</Label>
              <Input
                id="title"
                placeholder={t.titlePlaceholder}
                invalid={!!errors.title}
                data-testid="backlog-title"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-xs text-red-600" role="alert">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="goalId">{t.goalLabel}</Label>
              <Select
                id="goalId"
                invalid={!!errors.goalId}
                disabled={goalsLoading || goals.length === 0}
                data-testid="backlog-goal"
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

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => navigate('/backlogs')}>
                {strings.app.cancel}
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                data-testid="backlog-submit"
              >
                {createMutation.isPending ? t.submitting : t.submit}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

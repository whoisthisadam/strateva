import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { GoalForm } from '@/features/goals/GoalForm'
import { useGoal, useUpdateGoal } from '@/features/goals/useGoals'
import { strings } from '@/lib/strings'

export function GoalEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, isError } = useGoal(id)
  const updateMutation = useUpdateGoal(id ?? '')

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          to={id ? `/goals/${id}` : '/goals'}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {strings.goals.backToList}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {strings.goals.form.editTitle}
        </h1>
      </div>
      <Card>
        <CardContent className="p-6">
          {isLoading && <p className="text-sm text-slate-500">{strings.app.loading}</p>}
          {isError && <p className="text-sm text-red-600">{strings.errors.unknown}</p>}
          {data && (
            <GoalForm
              submitting={updateMutation.isPending}
              defaultValues={{
                title: data.title,
                description: data.description ?? '',
                periodStart: data.periodStart,
                periodEnd: data.periodEnd,
                priority: data.priority,
                kpis: data.kpis.map((k) => ({
                  name: k.name,
                  targetValue: Number(k.targetValue),
                  currentValue: Number(k.currentValue),
                  unit: k.unit ?? '',
                })),
              }}
              onCancel={() => navigate(`/goals/${id}`)}
              onSubmit={async (values) => {
                await updateMutation.mutateAsync(values)
                navigate(`/goals/${id}`)
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

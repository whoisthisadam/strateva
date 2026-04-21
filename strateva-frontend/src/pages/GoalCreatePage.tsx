import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { GoalForm } from '@/features/goals/GoalForm'
import { useCreateGoal } from '@/features/goals/useGoals'
import { strings } from '@/lib/strings'

export function GoalCreatePage() {
  const navigate = useNavigate()
  const createMutation = useCreateGoal()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          to="/goals"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {strings.goals.backToList}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {strings.goals.form.createTitle}
        </h1>
      </div>
      <Card>
        <CardContent className="p-6">
          <GoalForm
            submitting={createMutation.isPending}
            onCancel={() => navigate('/goals')}
            onSubmit={async (values) => {
              const created = await createMutation.mutateAsync(values)
              navigate(`/goals/${created.id}`)
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}

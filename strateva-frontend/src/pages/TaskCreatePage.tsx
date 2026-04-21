import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useGoalsList } from '@/features/goals/useGoals'
import { useCreateTask } from '@/features/tasks/useTasks'
import { TaskForm } from '@/features/tasks/TaskForm'
import { strings } from '@/lib/strings'

export function TaskCreatePage() {
  const navigate = useNavigate()
  const createMutation = useCreateTask()
  const { data: goalsPage, isLoading: goalsLoading } = useGoalsList({ size: 200 })
  const goals = (goalsPage?.content ?? []).filter((g) => g.status !== 'ARCHIVED')

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          to="/tasks"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {strings.tasks.backToList}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {strings.tasks.form.createTitle}
        </h1>
      </div>
      <Card>
        <CardContent className="p-6">
          <TaskForm
            mode="create"
            goals={goals}
            goalsLoading={goalsLoading}
            submitting={createMutation.isPending}
            onCancel={() => navigate('/tasks')}
            onSubmit={async (values) => {
              const created = await createMutation.mutateAsync(values)
              navigate(`/tasks/${created.id}`)
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}

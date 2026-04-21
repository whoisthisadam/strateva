import type { ComponentType, SVGProps } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ClipboardList, ListTodo, Shield, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/RoleGuard'
import { useAuth } from '@/auth/useAuth'
import { useGoalsList } from '@/features/goals/useGoals'
import { useBacklogsList } from '@/features/backlogs/useBacklogs'
import { useTasksList } from '@/features/tasks/useTasks'
import { strings } from '@/lib/strings'

type Icon = ComponentType<SVGProps<SVGSVGElement>>

interface SummaryStat {
  label: string
  value: string
}

interface SummaryCardProps {
  testId: string
  icon: Icon
  title: string
  description: string
  stats: SummaryStat[]
  to: string
}

function SummaryCard({ testId, icon: Icon, title, description, stats, to }: SummaryCardProps) {
  const navigate = useNavigate()
  return (
    <Card data-testid={testId} className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="flex-row items-start gap-3 space-y-0">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-4">
        <dl className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-slate-200/70 bg-slate-50/60 px-3 py-2"
            >
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {s.label}
              </dt>
              <dd
                className="mt-1 text-2xl font-semibold tabular-nums text-slate-900"
                data-testid={`${testId}-${s.label}`}
              >
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(to)}
          data-testid={`${testId}-open`}
          className="self-start"
        >
          <span>{strings.dashboard.openList}</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </CardContent>
    </Card>
  )
}

function formatCount(value: number | undefined, isLoading: boolean): string {
  if (isLoading) return strings.dashboard.loadingStats
  return String(value ?? 0)
}

function GoalsSummaryCard() {
  const total = useGoalsList({ size: 1 })
  const active = useGoalsList({ status: 'ACTIVE', size: 1 })
  const isLoading = total.isLoading || active.isLoading
  return (
    <SummaryCard
      testId="dashboard-card-goals"
      icon={Target}
      title={strings.dashboard.cards.goals.title}
      description={strings.dashboard.cards.goals.description}
      stats={[
        { label: strings.dashboard.statsTotal, value: formatCount(total.data?.totalElements, isLoading) },
        {
          label: strings.dashboard.cards.goals.statsActive,
          value: formatCount(active.data?.totalElements, isLoading),
        },
      ]}
      to="/goals"
    />
  )
}

function BacklogsSummaryCard() {
  const total = useBacklogsList({ size: 1 })
  const pending = useBacklogsList({ status: 'SUBMITTED', size: 1 })
  const isLoading = total.isLoading || pending.isLoading
  return (
    <SummaryCard
      testId="dashboard-card-backlogs"
      icon={ListTodo}
      title={strings.dashboard.cards.backlogs.title}
      description={strings.dashboard.cards.backlogs.description}
      stats={[
        { label: strings.dashboard.statsTotal, value: formatCount(total.data?.totalElements, isLoading) },
        {
          label: strings.dashboard.cards.backlogs.statsPending,
          value: formatCount(pending.data?.totalElements, isLoading),
        },
      ]}
      to="/backlogs"
    />
  )
}

function TasksSummaryCard() {
  const { user } = useAuth()
  const total = useTasksList({ size: 1 })
  const inProgress = useTasksList({ status: 'IN_PROGRESS', size: 1 })
  const isLoading = total.isLoading || inProgress.isLoading
  const isEmployee = user?.role === 'EMPLOYEE'
  return (
    <SummaryCard
      testId="dashboard-card-tasks"
      icon={ClipboardList}
      title={strings.dashboard.cards.tasks.title}
      description={strings.dashboard.cards.tasks.description}
      stats={[
        { label: strings.dashboard.statsTotal, value: formatCount(total.data?.totalElements, isLoading) },
        {
          label: isEmployee
            ? strings.dashboard.cards.tasks.statsMine
            : strings.dashboard.cards.tasks.statsInProgress,
          value: formatCount(inProgress.data?.totalElements, isLoading),
        },
      ]}
      to="/tasks"
    />
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm ring-1 ring-slate-900/[0.02] sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-white"
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar name={user.fullName} size="lg" />
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {strings.nav.dashboard}
              </h1>
              <p className="text-sm text-slate-600">
                {strings.dashboard.welcome},{' '}
                <span className="font-medium text-slate-900">{user.fullName}</span>
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="brand">
                  <Shield className="h-3 w-3" aria-hidden="true" />
                  <span>
                    {strings.dashboard.roleLabel}: {strings.auth.role[user.role]}
                  </span>
                </Badge>
                <span className="text-xs text-slate-500">
                  {strings.dashboard.overview}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-label={strings.nav.dashboard}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        <GoalsSummaryCard />
        <RoleGuard allow={['PROJECT_MANAGER', 'BUSINESS_ANALYST']}>
          <BacklogsSummaryCard />
        </RoleGuard>
        <TasksSummaryCard />
      </section>
    </div>
  )
}

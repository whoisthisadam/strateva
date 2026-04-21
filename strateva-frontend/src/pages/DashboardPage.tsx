import type { ComponentType, SVGProps } from 'react'
import {
  BarChart3,
  FileText,
  History,
  ListTodo,
  Shield,
  Target,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/auth/useAuth'
import { strings } from '@/lib/strings'

type Icon = ComponentType<SVGProps<SVGSVGElement>>

interface FeatureCard {
  key: string
  icon: Icon
  title: string
  description: string
}

const FEATURE_CARDS: FeatureCard[] = [
  {
    key: 'goals',
    icon: Target,
    title: strings.dashboard.cards.goals.title,
    description: strings.dashboard.cards.goals.description,
  },
  {
    key: 'backlogs',
    icon: ListTodo,
    title: strings.dashboard.cards.backlogs.title,
    description: strings.dashboard.cards.backlogs.description,
  },
  {
    key: 'tasks',
    icon: FileText,
    title: strings.dashboard.cards.tasks.title,
    description: strings.dashboard.cards.tasks.description,
  },
  {
    key: 'reports',
    icon: BarChart3,
    title: strings.dashboard.cards.reports.title,
    description: strings.dashboard.cards.reports.description,
  },
  {
    key: 'audit',
    icon: History,
    title: strings.dashboard.cards.audit.title,
    description: strings.dashboard.cards.audit.description,
  },
]

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
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {FEATURE_CARDS.map(({ key, icon: Icon, title, description }) => (
          <Card
            key={key}
            className="transition-shadow hover:shadow-md"
          >
            <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <CardTitle className="text-base">{title}</CardTitle>
              </div>
              <Badge variant="neutral">{strings.dashboard.soon}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">{description}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  )
}

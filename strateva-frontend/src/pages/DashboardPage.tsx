import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/auth/useAuth'
import { strings } from '@/lib/strings'

export function DashboardPage() {
  const { user } = useAuth()
  if (!user) return null
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{strings.nav.dashboard}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            {strings.auth.loggedInAs}{' '}
            <span className="font-medium text-slate-900">{user.fullName}</span>{' '}
            <span className="text-slate-500">({strings.auth.role[user.role]})</span>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

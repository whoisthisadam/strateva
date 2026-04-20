import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/auth/useAuth'
import { strings } from '@/lib/strings'

const schema = z.object({
  username: z.string().trim().min(1, strings.auth.requiredUsername),
  password: z.string().min(1, strings.auth.requiredPassword),
})

type LoginFormValues = z.infer<typeof schema>

export function LoginPage() {
  const { login, status } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  })

  if (status === 'authenticated') {
    return <Navigate to={location.state?.from ?? '/'} replace />
  }

  async function onSubmit(values: LoginFormValues) {
    setServerError(null)
    try {
      await login(values)
      navigate(location.state?.from ?? '/', { replace: true })
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 401) {
        setServerError(strings.auth.invalidCredentials)
      } else {
        setServerError(strings.errors.unknown)
      }
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-slate-50 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{strings.auth.loginTitle}</CardTitle>
          <CardDescription>{strings.auth.loginSubtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="username">{strings.auth.usernameLabel}</Label>
              <Input
                id="username"
                autoComplete="username"
                placeholder={strings.auth.usernamePlaceholder}
                invalid={!!errors.username}
                {...register('username')}
              />
              {errors.username && (
                <p className="text-xs text-red-600" role="alert">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">{strings.auth.passwordLabel}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder={strings.auth.passwordPlaceholder}
                invalid={!!errors.password}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-red-600" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {serverError && (
              <div
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {serverError}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? strings.auth.submitting : strings.auth.submit}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

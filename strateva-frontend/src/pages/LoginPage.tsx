import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { z } from 'zod'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  User as UserIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/brand/Logo'
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

  const [showPassword, setShowPassword] = useState(false);

  const handleToggle = () => {
    setShowPassword(!showPassword)
  }

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
    <div className="min-h-full bg-app">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 gap-0 p-4 md:p-6 lg:grid-cols-2 lg:gap-10">
        <aside className="relative hidden overflow-hidden rounded-3xl bg-brand-pane p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3">
            <Logo size={40} />
            <span className="text-xl font-semibold tracking-tight">
              {strings.app.title}
            </span>
          </div>
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold leading-tight tracking-tight">
              {strings.marketing.tagline}
            </h2>
            <p className="text-base text-white/80">{strings.marketing.description}</p>
            <ul className="space-y-3">
              {strings.marketing.bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm text-white/90">
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 shrink-0 text-brand-200"
                  />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-white/60">{strings.auth.demoHint}</p>
        </aside>

        <section className="flex items-center justify-center py-8 lg:py-0">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <Logo size={36} />
              <span className="text-lg font-semibold tracking-tight text-slate-900">
                {strings.app.title}
              </span>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-xl shadow-brand-900/5 ring-1 ring-slate-900/[0.02] sm:p-8">
              <div className="mb-6 space-y-1.5">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  {strings.auth.loginTitle}
                </h1>
                <p className="text-sm text-slate-500">{strings.auth.loginSubtitle}</p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="username">{strings.auth.usernameLabel}</Label>
                  <Input
                    id="username"
                    autoComplete="username"
                    placeholder={strings.auth.usernamePlaceholder}
                    invalid={!!errors.username}
                    leadingIcon={<UserIcon className="h-4 w-4" aria-hidden="true" />}
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
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder={strings.auth.passwordPlaceholder}
                      invalid={!!errors.password}
                      leadingIcon={<Lock className="h-4 w-4" aria-hidden="true"/>}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={handleToggle}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-600" role="alert">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {serverError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{serverError}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      <span>{strings.auth.submitting}</span>
                    </>
                  ) : (
                    <>
                      <span>{strings.auth.submit}</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
  leadingIcon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, leadingIcon, ...props }, ref) => {
    const base = cn(
      'flex h-11 w-full rounded-lg border border-slate-300 bg-white py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:border-brand-500',
      'disabled:cursor-not-allowed disabled:opacity-50',
      leadingIcon ? 'pl-10 pr-3' : 'px-3',
      invalid && 'border-red-500 focus-visible:ring-red-500/40 focus-visible:border-red-500',
      className,
    )

    if (!leadingIcon) {
      return (
        <input ref={ref} aria-invalid={invalid || undefined} className={base} {...props} />
      )
    }

    return (
      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-slate-400"
        >
          {leadingIcon}
        </span>
        <input ref={ref} aria-invalid={invalid || undefined} className={base} {...props} />
      </div>
    )
  },
)
Input.displayName = 'Input'

import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClass: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
}

/**
 * Circular avatar derived from the person's initials (first letter of up to
 * the first two whitespace-separated words). Purely visual — no text node
 * is emitted for screen readers (wrapped name remains the source of truth).
 */
export function Avatar({ name, size = 'md', className, ...rest }: AvatarProps) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div
      aria-hidden="true"
      data-allow-en
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold text-white',
        'bg-gradient-to-br from-brand-500 to-brand-800 ring-2 ring-white/60 shadow-sm',
        sizeClass[size],
        className,
      )}
      {...rest}
    >
      {initials}
    </div>
  )
}

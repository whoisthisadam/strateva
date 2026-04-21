import { cn } from '@/lib/cn'

export interface LogoProps {
  size?: number
  className?: string
}

/**
 * Strateva brand mark. Stylized rounded square with an ascending chart glyph
 * rendered as an inline SVG gradient — no external assets, crisp at any size.
 */
export function Logo({ size = 32, className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      role="img"
      aria-hidden="true"
      className={cn('shrink-0', className)}
    >
      <defs>
        <linearGradient id="strateva-logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="55%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="9" fill="url(#strateva-logo-g)" />
      <path
        d="M10 26 L17 19 L22 23 L30 13"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="30" cy="13" r="2.4" fill="#ffffff" />
    </svg>
  )
}

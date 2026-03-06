import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/utils/cn'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-semibold transition-all duration-[120ms] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)] disabled:opacity-50 disabled:pointer-events-none select-none',
  {
    variants: {
      variant: {
        primary: 'bg-[var(--color-accent)] text-black hover:brightness-110 rounded-[var(--radius-md)]',
        secondary: 'bg-[var(--color-surface-03)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:border-[var(--color-border-active)] rounded-[var(--radius-md)]',
        danger: 'bg-[var(--color-danger)] text-white hover:brightness-110 rounded-[var(--radius-md)]',
        ghost: 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-02)] rounded-[var(--radius-md)]',
        accent: 'border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent-dim)] rounded-[var(--radius-md)]',
      },
      size: {
        sm: 'h-9 px-4 text-sm gap-1.5',
        md: 'h-12 px-6 text-base gap-2',
        lg: 'h-14 px-8 text-lg gap-2',
        icon: 'h-12 w-12',
        'icon-sm': 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: ReactNode
  loading?: boolean
}

export function Button({ variant, size, className, children, loading, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={loading ?? props.disabled}
      {...props}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  )
}

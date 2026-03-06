import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '@/shared/utils/cn'
import { useActiveWorkoutStore } from '@/presentation/features/workout/stores/activeWorkout.store'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Inicio', icon: '🏠' },
  { to: '/workout', label: 'Entreno', icon: '⚡', isAccent: true },
  { to: '/exercises', label: 'Ejercicios', icon: '🔍' },
  { to: '/progress', label: 'Progreso', icon: '📈' },
  { to: '/settings', label: 'Ajustes', icon: '⚙️' },
] as const

export function BottomNav() {
  const routerState = useRouterState()
  const activeSession = useActiveWorkoutStore(s => s.sessionId)
  const currentPath = routerState.location.pathname

  return (
    <nav
      className="fixed bottom-0 inset-x-0 bg-[var(--color-surface-01)] border-t border-[var(--color-border)] safe-bottom z-30"
      style={{ height: '64px' }}
      role="navigation"
      aria-label="Navegación principal"
    >
      <div className="flex h-full">
        {NAV_ITEMS.map(item => {
          const isActive = currentPath.includes(item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors min-h-[48px]',
                isActive
                  ? 'text-[var(--color-accent)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="relative text-xl leading-none">
                {item.icon}
                {item.to === '/workout' && activeSession && (
                  <span
                    className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse"
                    aria-label="Entrenamiento activo"
                  />
                )}
              </span>
              <span className={cn(
                'text-[10px] font-semibold',
                isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'
              )}>
                {item.label}
              </span>
              {isActive && (
                <span
                  className="absolute bottom-1 w-4 h-0.5 rounded-full bg-[var(--color-accent)]"
                  aria-hidden="true"
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

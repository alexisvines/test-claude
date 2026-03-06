import { cn } from '@/shared/utils/cn'
import { formatTime } from '@/shared/utils/formatters'
import { Button } from '@/presentation/design-system/components/Button'
import type { RestTimerState } from '../hooks/useRestTimer'

const PRESET_TIMES = [60, 90, 120, 180, 240]

interface Props {
  timer: RestTimerState
  className?: string
}

export function RestTimer({ timer, className }: Props) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - timer.progress)

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* SVG Ring */}
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Background ring */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="var(--color-surface-03)"
            strokeWidth="8"
          />
          {/* Progress ring */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={timer.secondsLeft <= 10 ? 'var(--color-danger)' : 'var(--color-accent)'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
          />
        </svg>
        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-mono text-3xl font-bold"
            style={{ color: timer.secondsLeft <= 10 ? 'var(--color-danger)' : 'var(--color-text-primary)' }}
          >
            {formatTime(timer.secondsLeft)}
          </span>
          <span className="text-xs text-[var(--color-text-secondary)]">
            {timer.isRunning ? 'descanso' : 'listo'}
          </span>
        </div>
      </div>

      {/* Controls */}
      {timer.isRunning ? (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => timer.subtract(15)}>-15s</Button>
          <Button variant="secondary" size="sm" onClick={timer.pause}>Pausa</Button>
          <Button variant="secondary" size="sm" onClick={() => timer.add(15)}>+15s</Button>
        </div>
      ) : timer.secondsLeft > 0 ? (
        <Button variant="primary" size="md" onClick={timer.resume}>Continuar</Button>
      ) : null}

      {/* Preset buttons */}
      {!timer.isRunning && (
        <div className="flex gap-2 flex-wrap justify-center">
          {PRESET_TIMES.map(seconds => (
            <button
              key={seconds}
              onClick={() => timer.start(seconds)}
              className="px-3 py-1.5 text-sm rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors min-w-[48px]"
            >
              {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

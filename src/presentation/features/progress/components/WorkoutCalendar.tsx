import { useState } from 'react'
import { cn } from '@/shared/utils/cn'

interface Props {
  completedDates: Set<string>  // 'YYYY-MM-DD'
}

const DAY_HEADERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function WorkoutCalendar({ completedDates }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // offset: Monday = 0, Sunday = 6
  const offset = (new Date(year, month, 1).getDay() + 6) % 7
  // Total cells: 6 rows × 7 cols
  const cells = Array.from({ length: 42 }, (_, i) => {
    const day = i - offset + 1
    return day >= 1 && day <= daysInMonth ? day : null
  })

  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth()

  // Count workouts in current visible month
  const workoutsThisMonth = cells.filter(
    d => d !== null && completedDates.has(toDateKey(year, month, d))
  ).length

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-03)] transition-colors"
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            {MONTH_NAMES[month]} {year}
          </p>
          {workoutsThisMonth > 0 && (
            <p className="text-[10px] text-[var(--color-text-secondary)]">
              {workoutsThisMonth} entreno{workoutsThisMonth !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-03)] transition-colors"
          aria-label="Mes siguiente"
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7">
        {DAY_HEADERS.map(h => (
          <div key={h} className="text-center text-[10px] font-medium text-[var(--color-text-muted)] py-1">
            {h}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} />
          }

          const key = toDateKey(year, month, day)
          const hasWorkout = completedDates.has(key)
          const isToday = isCurrentMonth && day === today.getDate()

          return (
            <div key={key} className="flex flex-col items-center py-0.5">
              <div
                className={cn(
                  'w-8 h-8 flex items-center justify-center text-xs transition-colors',
                  isToday
                    ? 'ring-1 ring-[var(--color-accent)] rounded-full font-bold text-[var(--color-text-primary)]'
                    : hasWorkout
                      ? 'text-[var(--color-text-primary)]'
                      : 'text-[var(--color-text-secondary)]',
                )}
              >
                {day}
              </div>
              {hasWorkout ? (
                <div className="w-1 h-1 rounded-full bg-green-500 mt-0.5" />
              ) : (
                <div className="w-1 h-1 mt-0.5" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

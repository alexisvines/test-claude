import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart
} from 'recharts'
import { getContainer } from '@/infrastructure/container/DIContainer'
import { formatDate } from '@/shared/utils/formatters'
import { cn } from '@/shared/utils/cn'
import { WorkoutCalendar } from '@/presentation/features/progress/components/WorkoutCalendar'

type Period = '1m' | '3m' | '6m' | '1y' | 'all'

const PERIOD_LABELS: Record<Period, string> = {
  '1m': '1M', '3m': '3M', '6m': '6M', '1y': '1A', 'all': 'Todo'
}

function getPeriodDate(period: Period): Date {
  const now = new Date()
  switch (period) {
    case '1m': return new Date(now.setMonth(now.getMonth() - 1))
    case '3m': return new Date(now.setMonth(now.getMonth() - 3))
    case '6m': return new Date(now.setMonth(now.getMonth() - 6))
    case '1y': return new Date(now.setFullYear(now.getFullYear() - 1))
    case 'all': return new Date(0)
  }
}

interface ChartPoint {
  date: string
  weight: number
  isPR: boolean
}

function ExerciseProgressChart({ exerciseId }: { exerciseId: string; exerciseName: string }) {
  const container = getContainer()
  const [period, setPeriod] = useState<Period>('3m')

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', 'all'],
    queryFn: async () => {
      const athlete = await container.athleteRepo.getDefault()
      if (!athlete) return []
      return container.workoutRepo.findByAthleteId(athlete.id, 500)
    },
  })

  const chartData: ChartPoint[] = sessions
    .filter(s => s.status === 'completed' && s.startedAt >= getPeriodDate(period))
    .flatMap(s => {
      const exerciseSets = s.sets.filter(set => set.exerciseId === exerciseId)
      if (exerciseSets.length === 0) return []
      const maxWeight = Math.max(...exerciseSets.map(set => set.weight.toKg()))
      const hasPR = exerciseSets.some(set => set.isPersonalRecord)
      return [{
        date: formatDate(s.startedAt),
        weight: maxWeight,
        isPR: hasPR,
      }]
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--color-text-secondary)]">
        <p>No hay datos para este ejercicio en el período seleccionado</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-1 mb-4">
        {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              'flex-1 py-1.5 text-xs rounded-[var(--radius-sm)] transition-colors',
              period === p
                ? 'bg-[var(--color-accent)] text-black font-bold'
                : 'text-[var(--color-text-secondary)] bg-[var(--color-surface-03)]'
            )}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C8FF00" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#C8FF00" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8C8C8C' }} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#8C8C8C' }} tickLine={false} unit="kg" width={40} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: 'var(--color-text-primary)',
              fontSize: 12,
            }}
            formatter={(value: number) => [`${value}kg`, 'Peso']}
          />
          <Area
            type="monotone"
            dataKey="weight"
            stroke="#C8FF00"
            strokeWidth={2}
            fill="url(#weightGrad)"
            dot={(props) => {
              const { cx, cy, payload } = props as { cx: number; cy: number; payload: ChartPoint }
              if (payload.isPR) {
                return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={5} fill="#FFD700" stroke="#C8FF00" strokeWidth={2} />
              }
              return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={3} fill="#C8FF00" />
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ProgressPage() {
  const container = getContainer()

  const { data: athlete } = useQuery({
    queryKey: ['athlete'],
    queryFn: () => container.athleteRepo.getDefault(),
  })

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', 'all'],
    queryFn: async () => {
      if (!athlete) return []
      return container.workoutRepo.findByAthleteId(athlete.id, 500)
    },
    enabled: !!athlete,
  })

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises', 'top'],
    queryFn: () => container.exerciseRepo.findAll(),
  })

  // Find exercises with most sets done
  const exerciseUsage = new Map<string, number>()
  for (const session of sessions) {
    for (const set of session.sets) {
      exerciseUsage.set(set.exerciseId, (exerciseUsage.get(set.exerciseId) ?? 0) + 1)
    }
  }

  const topExercises = exercises
    .filter(e => exerciseUsage.has(e.id))
    .sort((a, b) => (exerciseUsage.get(b.id) ?? 0) - (exerciseUsage.get(a.id) ?? 0))
    .slice(0, 5)

  const completedDates = useMemo(() => {
    const set = new Set<string>()
    for (const s of sessions) {
      if (s.status === 'completed') {
        const d = s.startedAt
        set.add(
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        )
      }
    }
    return set
  }, [sessions])

  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('')

  const currentExercise = selectedExerciseId
    ? exercises.find(e => e.id === selectedExerciseId) ?? topExercises[0]
    : topExercises[0]

  // Weekly volume data for last 8 weeks
  const weeklyData = (() => {
    const weeks: Array<{ week: string; volume: number; sessions: number }> = []
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - i * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)

      const weekSessions = sessions.filter(s =>
        s.startedAt >= weekStart && s.startedAt < weekEnd && s.status === 'completed'
      )

      const volume = weekSessions.reduce((acc, s) => acc + s.totalVolume.toKg(), 0)

      weeks.push({
        week: `S${8 - i}`,
        volume: Math.round(volume),
        sessions: weekSessions.length,
      })
    }
    return weeks
  })()

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto">
      <div className="pt-2">
        <h1 className="font-display text-3xl font-bold text-[var(--color-text-primary)]">Progreso</h1>
      </div>

      {/* Monthly Calendar */}
      <div className="space-y-3">
        <h2 className="font-display text-lg font-bold text-[var(--color-text-secondary)] uppercase tracking-wide">
          Actividad mensual
        </h2>
        <div className="bg-[var(--color-surface-02)] rounded-[var(--radius-lg)] p-4">
          <WorkoutCalendar completedDates={completedDates} />
        </div>
      </div>

      {/* Weekly Volume Chart */}
      <div className="space-y-3">
        <h2 className="font-display text-lg font-bold text-[var(--color-text-secondary)] uppercase tracking-wide">
          Volumen semanal
        </h2>
        <div className="bg-[var(--color-surface-02)] rounded-[var(--radius-lg)] p-4">
          {weeklyData.some(w => w.volume > 0) ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0A84FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0A84FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#8C8C8C' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#8C8C8C' }} tickLine={false} unit="kg" width={40} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-text-primary)',
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`${value}kg`, 'Volumen']}
                />
                <Area type="monotone" dataKey="volume" stroke="#0A84FF" strokeWidth={2} fill="url(#volGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-[var(--color-text-secondary)]">
              Completa entrenamientos para ver tu progreso
            </div>
          )}
        </div>
      </div>

      {/* Exercise Progression */}
      {topExercises.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[var(--color-text-secondary)] uppercase tracking-wide">
            Progresión por ejercicio
          </h2>

          {/* Exercise selector */}
          <div className="overflow-x-auto">
            <div className="flex gap-2" style={{ width: 'max-content' }}>
              {topExercises.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => setSelectedExerciseId(ex.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap',
                    (selectedExerciseId === ex.id || (!selectedExerciseId && topExercises[0]?.id === ex.id))
                      ? 'bg-[var(--color-accent)] text-black'
                      : 'bg-[var(--color-surface-02)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                  )}
                >
                  {ex.nameEs}
                </button>
              ))}
            </div>
          </div>

          {currentExercise && (
            <div className="bg-[var(--color-surface-02)] rounded-[var(--radius-lg)] p-4">
              <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">{currentExercise.nameEs}</h3>
              <ExerciseProgressChart
                exerciseId={currentExercise.id}
                exerciseName={currentExercise.nameEs}
              />
              <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                ⭐ = Récord personal
              </p>
            </div>
          )}
        </div>
      )}

      {sessions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-5xl mb-3">📊</p>
          <p className="text-[var(--color-text-secondary)]">
            Completa tu primer entrenamiento para ver el progreso
          </p>
        </div>
      )}

      <div className="h-4" />
    </div>
  )
}

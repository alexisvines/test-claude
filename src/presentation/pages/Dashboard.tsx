import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { getContainer } from '@/infrastructure/container/DIContainer'
import { formatVolume, formatDate } from '@/shared/utils/formatters'
import { cn } from '@/shared/utils/cn'
import { useActiveWorkoutStore } from '@/presentation/features/workout/stores/activeWorkout.store'
import { useStartWorkout } from '@/presentation/features/workout/hooks/useStartWorkout'
import { WeeklyVolumeWidget } from '@/presentation/features/progress/components/WeeklyVolumeWidget'
import type { WorkoutSession } from '@/domain/entities/WorkoutSession'
import type { Routine } from '@/domain/entities/Routine'

function StatCard({ label, value, icon, accent }: { label: string; value: string; icon: string; accent?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-[var(--radius-md)] p-4 flex flex-col gap-1',
        accent ? 'bg-[var(--color-accent-dim)] border border-[var(--color-accent)]' : 'bg-[var(--color-surface-02)]'
      )}
    >
      <span className="text-2xl">{icon}</span>
      <span className={cn('font-mono text-2xl font-bold', accent ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]')}>
        {value}
      </span>
      <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
    </motion.div>
  )
}

function StreakCard({ days }: { days: number }) {
  const flames = days >= 30 ? '🔥🔥🔥' : days >= 7 ? '🔥🔥' : '🔥'
  return (
    <div className="rounded-[var(--radius-lg)] p-4 bg-gradient-to-r from-orange-950/50 to-[var(--color-surface-02)] border border-orange-500/20 flex items-center gap-4">
      <div className="text-4xl animate-pulse">{flames}</div>
      <div>
        <p className="font-display text-3xl font-bold text-orange-400">{days}</p>
        <p className="text-sm text-[var(--color-text-secondary)]">
          días de racha{days === 1 ? '' : ''}
        </p>
      </div>
      {days >= 7 && (
        <div className="ml-auto text-right">
          <p className="text-xs text-[var(--color-text-muted)]">Logro</p>
          <p className="text-sm font-semibold text-orange-400">
            {days >= 180 ? '🌟 Leyenda' : days >= 90 ? '👑 Rey' : days >= 30 ? '💎 Diamante' : '⚡ Energía'}
          </p>
        </div>
      )}
    </div>
  )
}

const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MUSCLE_DAY_EMOJI: Record<string, string> = {
  chest: '💪', back: '🔙', lats: '🔙', shoulders: '🏋️', biceps: '💪',
  triceps: '💪', forearms: '🤜', quadriceps: '🦵', hamstrings: '🦵',
  glutes: '🍑', calves: '🦶', core: '🎯', traps: '🐂',
}

function TodayCard({ routine }: { routine: Routine }) {
  const today = new Date().getDay()
  const day = routine.days[today % routine.days.length]
  if (!day) return null

  const primaryMuscleKey = day.isRestDay ? null : day.exercises[0]?.exerciseId.split('-')[0]
  const emoji = day.isRestDay ? '😴' : (primaryMuscleKey ? (MUSCLE_DAY_EMOJI[primaryMuscleKey] ?? '🏋️') : '🏋️')
  const label = day.isRestDay ? 'Día de descanso' : day.name

  return (
    <div className="rounded-[var(--radius-lg)] p-4 bg-[var(--color-surface-02)] border border-[var(--color-border)]">
      <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-1">
        Hoy · {DAY_SHORT[today]}
      </p>
      <div className="flex items-center gap-3">
        <span className="text-3xl">{emoji}</span>
        <div>
          <p className="font-semibold text-[var(--color-text-primary)]">{label}</p>
          {!day.isRestDay && (
            <p className="text-xs text-[var(--color-text-secondary)]">
              {day.exercises.length} ejercicio{day.exercises.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <p className="ml-auto text-xs text-[var(--color-accent)] font-semibold">{routine.name}</p>
      </div>
    </div>
  )
}

function RecentWorkout({ session }: { session: WorkoutSession }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[var(--color-border)] last:border-0">
      <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-surface-03)] flex items-center justify-center text-lg">
        🏋️
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm text-[var(--color-text-primary)]">
          {session.routineName ?? 'Entrenamiento libre'}
        </p>
        <p className="text-xs text-[var(--color-text-secondary)]">
          {formatDate(session.startedAt)} · {session.sets.length} series
        </p>
      </div>
      <p className="font-mono text-sm text-[var(--color-text-secondary)]">
        {formatVolume(session.totalVolume.toKg())}
      </p>
    </div>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const container = getContainer()
  const store = useActiveWorkoutStore()
  const startWorkoutMutation = useStartWorkout()

  const { data: athlete } = useQuery({
    queryKey: ['athlete'],
    queryFn: () => container.athleteRepo.getDefault(),
  })

  const { data: recentSessions = [] } = useQuery({
    queryKey: ['sessions', 'recent'],
    queryFn: async () => {
      if (!athlete) return []
      return container.workoutRepo.findByAthleteId(athlete.id, 10)
    },
    enabled: !!athlete,
  })

  const { data: achievements = [] } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      if (!athlete) return []
      return container.athleteRepo.getAchievements(athlete.id)
    },
    enabled: !!athlete,
  })

  const { data: activeRoutine } = useQuery({
    queryKey: ['routine', athlete?.activeRoutineId],
    queryFn: () => athlete?.activeRoutineId ? container.routineRepo.findById(athlete.activeRoutineId) : null,
    enabled: !!athlete?.activeRoutineId,
  })

  const unlockedAchievements = achievements.filter(a => a.isUnlocked).slice(-3).reverse()
  const hasActiveSession = !!store.sessionId

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between pt-2"
      >
        <div>
          <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">Bienvenido</p>
          <h1 className="font-display text-3xl font-bold text-[var(--color-text-primary)]">
            {athlete?.name ?? 'Atleta'}
          </h1>
          <p className="text-sm text-[var(--color-accent)]">{athlete?.levelLabel ?? 'Novato'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-[var(--color-surface-03)] flex items-center justify-center text-2xl">
            {athlete?.level === 'leyenda' ? '🌟' : athlete?.level === 'elite' ? '💎' : '🏋️'}
          </div>
          <button
            onClick={() => void navigate({ to: '/settings' })}
            className="w-10 h-10 rounded-full bg-[var(--color-surface-02)] flex items-center justify-center text-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label="Ajustes"
          >
            ⚙️
          </button>
        </div>
      </motion.div>

      {/* Active Session Banner */}
      {hasActiveSession && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[var(--radius-lg)] p-4 border border-[var(--color-success)] bg-green-950/30 cursor-pointer"
          onClick={() => void navigate({ to: '/workout' })}
        >
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
            <p className="text-[var(--color-success)] font-semibold">Entrenamiento activo — Continúa</p>
          </div>
        </motion.div>
      )}

      {/* Today's workout from active routine */}
      {activeRoutine && !hasActiveSession && (
        <TodayCard routine={activeRoutine} />
      )}

      {/* Streak */}
      {athlete && athlete.stats.currentStreakDays > 0 && (
        <StreakCard days={athlete.stats.currentStreakDays} />
      )}

      {/* Stats Grid */}
      {athlete && (
        <div>
          <h2 className="font-display text-lg font-bold text-[var(--color-text-secondary)] mb-3 uppercase tracking-wide">
            Tus stats
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon="🏋️"
              label="Sesiones totales"
              value={athlete.stats.totalSessions.toString()}
            />
            <StatCard
              icon="📦"
              label="Volumen total"
              value={formatVolume(athlete.stats.totalVolumeTons * 1000)}
            />
            <StatCard
              icon="⭐"
              label="Records personales"
              value={athlete.stats.totalPRs.toString()}
              accent
            />
            <StatCard
              icon="🔥"
              label="Racha máxima"
              value={`${athlete.stats.longestStreakDays}d`}
            />
          </div>
        </div>
      )}

      {/* Semáforo de volumen semanal */}
      {athlete && <WeeklyVolumeWidget athleteId={athlete.id} />}

      {/* Recent workouts */}
      {recentSessions.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-bold text-[var(--color-text-secondary)] mb-3 uppercase tracking-wide">
            Últimos entrenamientos
          </h2>
          <div className="bg-[var(--color-surface-02)] rounded-[var(--radius-lg)] px-4">
            {recentSessions
              .filter(s => s.status === 'completed')
              .slice(0, 5)
              .map(session => (
                <RecentWorkout key={session.id} session={session} />
              ))}
          </div>
        </div>
      )}

      {/* Recent achievements */}
      {unlockedAchievements.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-bold text-[var(--color-text-secondary)] mb-3 uppercase tracking-wide">
            Logros recientes
          </h2>
          <div className="flex gap-3">
            {unlockedAchievements.map(a => (
              <div
                key={a.id}
                className="flex-1 bg-[var(--color-surface-02)] rounded-[var(--radius-md)] p-3 text-center"
              >
                <div className="text-2xl mb-1">{a.icon}</div>
                <p className="text-xs text-[var(--color-text-secondary)] leading-tight">{a.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA if no sessions */}
      {recentSessions.length === 0 && !hasActiveSession && (
        <div className="text-center py-8 space-y-3">
          <p className="text-5xl">💪</p>
          <p className="text-[var(--color-text-secondary)]">Tu primera sesión te espera</p>
        </div>
      )}

      {/* FAB — Start Workout */}
      <div className="h-4" />
      <motion.div
        className="fixed bottom-20 right-4 z-20"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.3 }}
      >
        <button
          onClick={() => hasActiveSession ? void navigate({ to: '/workout' }) : athlete && startWorkoutMutation.mutate({ athleteId: athlete.id, routineId: athlete.activeRoutineId })}
          disabled={startWorkoutMutation.isPending}
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-black shadow-[var(--shadow-accent)] active:scale-95 transition-transform"
          style={{ backgroundColor: 'var(--color-accent)' }}
          aria-label={hasActiveSession ? 'Continuar entrenamiento' : 'Iniciar entrenamiento'}
        >
          {startWorkoutMutation.isPending ? (
            <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : hasActiveSession ? '▶' : '⚡'}
        </button>
      </motion.div>
    </div>
  )
}

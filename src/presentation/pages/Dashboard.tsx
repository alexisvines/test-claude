import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { getContainer } from '@/infrastructure/container/DIContainer'
import { formatVolume, formatDate } from '@/shared/utils/formatters'
import { cn } from '@/shared/utils/cn'
import { useActiveWorkoutStore } from '@/presentation/features/workout/stores/activeWorkout.store'
import type { WorkoutSession } from '@/domain/entities/WorkoutSession'

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

  const startWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (!athlete) throw new Error('No athlete found')
      const result = await container.startWorkoutHandler.handle({
        athleteId: athlete.id,
        routineId: athlete.activeRoutineId,
      })
      return result
    },
    onSuccess: (result) => {
      store.setSession(result.sessionId, {
        id: result.sessionId,
        athleteId: athlete!.id,
        routineId: athlete?.activeRoutineId,
        routineName: result.routineName,
        startedAt: new Date(),
        sets: [],
        status: 'active',
      } as unknown as import('@/domain/entities/WorkoutSession').WorkoutSession)

      if (athlete?.activeRoutineId) {
        container.routineRepo.findById(athlete.activeRoutineId).then(routine => {
          if (routine) {
            const today = new Date().getDay() // 0=Sun, 1=Mon...
            const todayDay = routine.days[today % routine.days.length]
            if (todayDay && !todayDay.isRestDay) {
              const exercises = todayDay.exercises.map(ex => ({
                exercise: { id: ex.exerciseId } as import('@/domain/entities/Exercise').Exercise,
                targetSets: ex.sets,
                targetRepRange: ex.repRange,
                targetRIR: ex.rirTarget,
                restSeconds: ex.restSeconds,
                loggedSets: [],
              }))
              store.setExercises(exercises)
            }
          }
        }).catch(() => {/* ignore */})
      }

      void navigate({ to: '/workout' })
    },
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
        <div className="w-12 h-12 rounded-full bg-[var(--color-surface-03)] flex items-center justify-center text-2xl">
          {athlete?.level === 'leyenda' ? '🌟' : athlete?.level === 'elite' ? '💎' : '🏋️'}
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
          onClick={() => hasActiveSession ? void navigate({ to: '/workout' }) : startWorkoutMutation.mutate()}
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

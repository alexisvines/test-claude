import { useQuery } from '@tanstack/react-query'
import { getContainer } from '@/infrastructure/container/DIContainer'
import { PRProjectionEngine } from '@/domain/services/PRProjectionEngine'
import type { PRProjection } from '@/domain/services/PRProjectionEngine'

// Horas de recuperación por músculo (refleja MuscularFatigueMap)
const RECOVERY_HOURS: Record<string, number> = {
  biceps: 36, triceps: 36, calves: 36, forearms: 36,
  chest: 48, shoulders: 48, core: 40, traps: 48,
  back: 72, lats: 72, quadriceps: 72, hamstrings: 72, glutes: 72,
}

export function usePRProjections(athleteId: string | undefined) {
  const container = getContainer()

  return useQuery<PRProjection[]>({
    queryKey: ['prProjections', athleteId],
    enabled: !!athleteId,
    staleTime: 15 * 60 * 1000,
    queryFn: async () => {
      if (!athleteId) return []

      const now = new Date()
      const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const [sessions, sessions7d, exercises] = await Promise.all([
        container.workoutRepo.findByDateRange(athleteId, sixMonthsAgo, now),
        container.workoutRepo.findByDateRange(athleteId, sevenDaysAgo, now),
        container.exerciseRepo.findAll(),
      ])

      // exerciseId → músculo primario
      const exerciseMuscleMap = new Map<string, string>()
      for (const ex of exercises) {
        const muscle = ex.primaryMuscles[0]
        if (muscle) exerciseMuscleMap.set(ex.id, muscle)
      }

      // Última sesión por músculo (últimos 7 días)
      const lastTrainingDate = new Map<string, Date>()
      for (const session of sessions7d) {
        if (session.status !== 'completed') continue
        for (const set of session.sets) {
          const muscle = exerciseMuscleMap.get(set.exerciseId)
          if (!muscle) continue
          const existing = lastTrainingDate.get(muscle)
          if (!existing || set.completedAt > existing) {
            lastTrainingDate.set(muscle, set.completedAt)
          }
        }
      }

      // Fatiga por ejercicio (0-100)
      const fatigueByExercise = new Map<string, number>()
      for (const ex of exercises) {
        const muscle = ex.primaryMuscles[0]
        if (!muscle) continue
        const lastDate = lastTrainingDate.get(muscle)
        if (!lastDate) { fatigueByExercise.set(ex.id, 0); continue }
        const hours = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60)
        const recoveryHours = RECOVERY_HOURS[muscle] ?? 48
        const fatigue = Math.max(0, Math.min(100, (1 - hours / recoveryHours) * 100))
        fatigueByExercise.set(ex.id, fatigue)
      }

      // Aplanar sets de sesiones completadas (últimos 6 meses)
      const allSets = sessions
        .filter(s => s.status === 'completed')
        .flatMap(s =>
          s.sets.map(set => ({
            exerciseId: set.exerciseId,
            completedAt: set.completedAt,
            oneRepMax: set.oneRepMax,
          }))
        )

      return PRProjectionEngine.projectTopExercises(allSets, fatigueByExercise, 4)
    },
  })
}

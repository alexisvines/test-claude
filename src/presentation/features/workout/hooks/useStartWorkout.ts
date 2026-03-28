import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { getContainer } from '@/infrastructure/container/DIContainer'
import { useActiveWorkoutStore } from '@/presentation/features/workout/stores/activeWorkout.store'
import type { WorkoutSession } from '@/domain/entities/WorkoutSession'

interface StartWorkoutParams {
  athleteId: string
  routineId?: string
}

export function useStartWorkout() {
  const navigate = useNavigate()
  const store = useActiveWorkoutStore()
  const container = getContainer()

  return useMutation({
    mutationFn: async ({ athleteId, routineId }: StartWorkoutParams) => {
      const result = await container.startWorkoutHandler.handle({ athleteId, routineId })
      return { result, athleteId, routineId }
    },
    onSuccess: async ({ result, athleteId, routineId }) => {
      store.setSession(result.sessionId, {
        id: result.sessionId,
        athleteId,
        routineId,
        routineName: result.routineName,
        startedAt: new Date(),
        sets: [],
        status: 'active',
      } as unknown as WorkoutSession)

      if (routineId) {
        const routine = await container.routineRepo.findById(routineId).catch(() => null)
        if (routine) {
          const today = new Date().getDay()
          const numDays = routine.days.length
          const startIdx = today % numDays
          // Si el día de hoy es descanso, buscar el siguiente día de entrenamiento
          let todayDay = null
          for (let i = 0; i < numDays; i++) {
            const candidate = routine.days[(startIdx + i) % numDays]
            if (candidate && !candidate.isRestDay) {
              todayDay = candidate
              break
            }
          }
          if (todayDay && !todayDay.isRestDay) {
            const exerciseDetails = await Promise.all(
              todayDay.exercises.map(ex =>
                container.exerciseRepo.findById(ex.exerciseId).catch(() => null)
              )
            )
            store.setExercises(
              todayDay.exercises
                .map((ex, i) => {
                  const detail = exerciseDetails[i]
                  if (!detail) return null
                  return {
                    exercise: detail,
                    targetSets: ex.sets,
                    targetRepRange: ex.repRange,
                    targetRIR: ex.rirTarget,
                    restSeconds: ex.restSeconds,
                    loggedSets: [],
                  }
                })
                .filter(Boolean) as Parameters<typeof store.setExercises>[0]
            )
          }
        }
      }

      void navigate({ to: '/workout' })
    },
  })
}

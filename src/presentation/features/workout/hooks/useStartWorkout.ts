import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { getContainer } from '@/infrastructure/container/DIContainer'
import { useActiveWorkoutStore } from '@/presentation/features/workout/stores/activeWorkout.store'
import type { WorkoutSession } from '@/domain/entities/WorkoutSession'
import type { Exercise } from '@/domain/entities/Exercise'

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
          const todayDay = routine.days[today % routine.days.length]
          if (todayDay && !todayDay.isRestDay) {
            const exerciseDetails = await Promise.all(
              todayDay.exercises.map(ex =>
                container.exerciseRepo.findById(ex.exerciseId).catch(() => null)
              )
            )
            store.setExercises(todayDay.exercises.map((ex, i) => ({
              exercise: exerciseDetails[i] ?? ({ id: ex.exerciseId } as Exercise),
              targetSets: ex.sets,
              targetRepRange: ex.repRange,
              targetRIR: ex.rirTarget,
              restSeconds: ex.restSeconds,
              loggedSets: [],
            })))
          }
        }
      }

      void navigate({ to: '/workout' })
    },
  })
}

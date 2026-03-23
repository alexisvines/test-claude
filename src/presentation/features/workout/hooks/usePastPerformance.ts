/**
 * Modo Sombra — Rendimiento anterior por ejercicio
 *
 * Consulta la última sesión completada de la misma rutina y extrae
 * el mejor set por ejercicio, para mostrar una comparación en tiempo real
 * durante el entrenamiento actual.
 */
import { useQuery } from '@tanstack/react-query'
import { getContainer } from '@/infrastructure/container/DIContainer'

export interface PastExercisePerf {
  bestWeight: number   // kg del mejor set (mayor peso)
  bestReps: number     // reps en ese mejor set
  totalVolume: number  // kg×reps acumulado en toda la sesión para ese ejercicio
  setCount: number     // número de series registradas
}

export type PastPerformanceMap = Map<string, PastExercisePerf>

export function usePastPerformance(
  athleteId: string | null | undefined,
  routineId: string | null | undefined,
) {
  const container = getContainer()

  return useQuery<PastPerformanceMap>({
    queryKey: ['pastPerformance', routineId, athleteId],
    queryFn: async (): Promise<PastPerformanceMap> => {
      if (!athleteId || !routineId) return new Map()

      const sessions = await container.workoutRepo.findByAthleteId(athleteId, 30)

      // Buscar la última sesión completada de esta rutina (excluye la actual)
      const pastSession = sessions
        .filter(s => s.routineId === routineId && s.status === 'completed')
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0]

      if (!pastSession) return new Map()

      const perf: PastPerformanceMap = new Map()

      for (const set of pastSession.sets) {
        const weightKg = set.weight.toKg()
        const vol = weightKg * set.reps
        const prev = perf.get(set.exerciseId)

        if (!prev) {
          perf.set(set.exerciseId, {
            bestWeight: weightKg,
            bestReps: set.reps,
            totalVolume: vol,
            setCount: 1,
          })
        } else {
          const isBetter = weightKg > prev.bestWeight ||
            (weightKg === prev.bestWeight && set.reps > prev.bestReps)
          perf.set(set.exerciseId, {
            bestWeight: isBetter ? weightKg : prev.bestWeight,
            bestReps: isBetter ? set.reps : prev.bestReps,
            totalVolume: prev.totalVolume + vol,
            setCount: prev.setCount + 1,
          })
        }
      }

      return perf
    },
    enabled: !!athleteId && !!routineId,
    staleTime: 5 * 60 * 1000,
  })
}

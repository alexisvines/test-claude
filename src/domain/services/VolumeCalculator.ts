import type { WorkoutSession } from '../entities/WorkoutSession'
import type { MuscleGroup } from '../value-objects/MuscleGroup'
import type { Exercise } from '../entities/Exercise'

export interface MuscleVolumeData {
  muscle: MuscleGroup
  sets: number
  volumeKg: number
}

export interface WeeklyVolumeData {
  weekStart: Date
  byMuscle: Map<MuscleGroup, MuscleVolumeData>
  totalSets: number
  totalVolumeKg: number
}

export class VolumeCalculator {
  static calculateSessionVolume(
    session: WorkoutSession,
    exerciseMap: Map<string, Exercise>
  ): Map<MuscleGroup, MuscleVolumeData> {
    const volumeMap = new Map<MuscleGroup, MuscleVolumeData>()

    for (const set of session.sets) {
      const exercise = exerciseMap.get(set.exerciseId)
      if (!exercise) continue

      const volumeKg = set.volume.toKg()

      for (const muscle of exercise.muscleGroups.primary) {
        const existing = volumeMap.get(muscle) ?? { muscle, sets: 0, volumeKg: 0 }
        volumeMap.set(muscle, {
          muscle,
          sets: existing.sets + 1,
          volumeKg: existing.volumeKg + volumeKg,
        })
      }

      for (const muscle of exercise.muscleGroups.secondary) {
        const existing = volumeMap.get(muscle) ?? { muscle, sets: 0, volumeKg: 0 }
        volumeMap.set(muscle, {
          muscle,
          sets: existing.sets + 0.5,
          volumeKg: existing.volumeKg + volumeKg * 0.5,
        })
      }
    }

    return volumeMap
  }

  static calculateWeeklyVolume(
    sessions: WorkoutSession[],
    exerciseMap: Map<string, Exercise>,
    weekStart: Date
  ): WeeklyVolumeData {
    const combined = new Map<MuscleGroup, MuscleVolumeData>()
    let totalSets = 0
    let totalVolumeKg = 0

    for (const session of sessions) {
      const sessionVolume = VolumeCalculator.calculateSessionVolume(session, exerciseMap)

      for (const [muscle, data] of sessionVolume) {
        const existing = combined.get(muscle) ?? { muscle, sets: 0, volumeKg: 0 }
        combined.set(muscle, {
          muscle,
          sets: existing.sets + data.sets,
          volumeKg: existing.volumeKg + data.volumeKg,
        })
        totalSets += data.sets
        totalVolumeKg += data.volumeKg
      }
    }

    return {
      weekStart,
      byMuscle: combined,
      totalSets,
      totalVolumeKg,
    }
  }
}

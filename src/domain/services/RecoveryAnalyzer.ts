import type { MuscleGroup } from '../value-objects/MuscleGroup'

export type RecoveryStatus = 'recovered' | 'partial' | 'fatigued'

export interface MuscleRecovery {
  muscle: MuscleGroup
  status: RecoveryStatus
  hoursSinceLastTraining: number
  lastTrainedAt?: Date
}

export class RecoveryAnalyzer {
  private static readonly FULL_RECOVERY_HOURS = 48
  private static readonly PARTIAL_RECOVERY_HOURS = 24

  static analyze(
    muscleLastTrained: Map<MuscleGroup, Date>
  ): Map<MuscleGroup, MuscleRecovery> {
    const now = new Date()
    const result = new Map<MuscleGroup, MuscleRecovery>()

    for (const [muscle, lastTrained] of muscleLastTrained) {
      const hoursSince = (now.getTime() - lastTrained.getTime()) / (1000 * 60 * 60)

      let status: RecoveryStatus
      if (hoursSince >= RecoveryAnalyzer.FULL_RECOVERY_HOURS) {
        status = 'recovered'
      } else if (hoursSince >= RecoveryAnalyzer.PARTIAL_RECOVERY_HOURS) {
        status = 'partial'
      } else {
        status = 'fatigued'
      }

      result.set(muscle, {
        muscle,
        status,
        hoursSinceLastTraining: hoursSince,
        lastTrainedAt: lastTrained,
      })
    }

    return result
  }

  static getStatusColor(status: RecoveryStatus): string {
    const colors: Record<RecoveryStatus, string> = {
      recovered: '#34C759',
      partial: '#FF9F0A',
      fatigued: '#FF2D55',
    }
    return colors[status]
  }

  static getStatusLabel(status: RecoveryStatus): string {
    const labels: Record<RecoveryStatus, string> = {
      recovered: 'Recuperado',
      partial: 'Parcialmente recuperado',
      fatigued: 'Necesita recuperación',
    }
    return labels[status]
  }
}

import type { Weight } from '../../../domain/value-objects/Weight'
import type { RIR } from '../../../domain/value-objects/RIR'
import type { RPE } from '../../../domain/value-objects/RPE'

export interface RecordSetCommand {
  readonly sessionId: string
  readonly exerciseId: string
  readonly exerciseName: string
  readonly setNumber: number
  readonly weight: Weight
  readonly reps: number
  readonly rir: RIR
  readonly rpe: RPE
  readonly notes?: string
}

export interface RecordSetResult {
  setId: string
  isPersonalRecord: boolean
  progressionSuggestion?: import('../../../domain/services/ProgressionEngine').ProgressionSuggestion
}

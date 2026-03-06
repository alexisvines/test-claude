import { Weight } from '../value-objects/Weight'
import { RIR } from '../value-objects/RIR'
import { RPE } from '../value-objects/RPE'

export interface WorkoutSetProps {
  id: string
  exerciseId: string
  setNumber: number
  weight: Weight
  reps: number
  rir: RIR
  rpe: RPE
  notes?: string
  completedAt: Date
  isPersonalRecord?: boolean
}

export class WorkoutSet {
  private constructor(private readonly props: WorkoutSetProps) {}

  static create(params: {
    exerciseId: string
    setNumber: number
    weight: Weight
    reps: number
    rir: RIR
    rpe: RPE
    notes?: string
  }): WorkoutSet {
    if (params.reps < 1) throw new Error('Reps must be at least 1')
    if (params.reps > 100) throw new Error('Reps cannot exceed 100')
    return new WorkoutSet({
      id: crypto.randomUUID(),
      exerciseId: params.exerciseId,
      setNumber: params.setNumber,
      weight: params.weight,
      reps: params.reps,
      rir: params.rir,
      rpe: params.rpe,
      notes: params.notes,
      completedAt: new Date(),
      isPersonalRecord: false,
    })
  }

  static reconstitute(props: WorkoutSetProps): WorkoutSet {
    return new WorkoutSet(props)
  }

  get id(): string { return this.props.id }
  get exerciseId(): string { return this.props.exerciseId }
  get setNumber(): number { return this.props.setNumber }
  get weight(): Weight { return this.props.weight }
  get reps(): number { return this.props.reps }
  get rir(): RIR { return this.props.rir }
  get rpe(): RPE { return this.props.rpe }
  get notes(): string | undefined { return this.props.notes }
  get completedAt(): Date { return this.props.completedAt }
  get isPersonalRecord(): boolean { return this.props.isPersonalRecord ?? false }

  get volume(): Weight {
    return this.props.weight.multiply(this.props.reps)
  }

  get oneRepMax(): number {
    const w = this.props.weight.toKg()
    const r = this.props.reps
    if (r === 1) return w
    return Math.round(w * (1 + r / 30))
  }

  markAsPersonalRecord(): WorkoutSet {
    return new WorkoutSet({ ...this.props, isPersonalRecord: true })
  }

  toJSON(): object {
    return {
      id: this.props.id,
      exerciseId: this.props.exerciseId,
      setNumber: this.props.setNumber,
      weight: this.props.weight.toJSON(),
      reps: this.props.reps,
      rir: this.props.rir.toJSON(),
      rpe: this.props.rpe.toJSON(),
      notes: this.props.notes,
      completedAt: this.props.completedAt.toISOString(),
      isPersonalRecord: this.props.isPersonalRecord,
    }
  }

  static fromJSON(data: Record<string, unknown>): WorkoutSet {
    return WorkoutSet.reconstitute({
      id: data['id'] as string,
      exerciseId: data['exerciseId'] as string,
      setNumber: data['setNumber'] as number,
      weight: Weight.fromJSON(data['weight'] as { kg: number; unit: 'kg' | 'lb' }),
      reps: data['reps'] as number,
      rir: RIR.fromJSON(data['rir'] as number),
      rpe: RPE.fromJSON(data['rpe'] as number),
      notes: data['notes'] as string | undefined,
      completedAt: new Date(data['completedAt'] as string),
      isPersonalRecord: data['isPersonalRecord'] as boolean | undefined,
    })
  }
}

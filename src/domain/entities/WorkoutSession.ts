import { WorkoutSet } from './WorkoutSet'
import type {
  KovaDomainEvent,
  WorkoutCompleted,
  SetRecorded,
  PersonalRecordAchieved,
} from '../events'
import { Weight } from '../value-objects/Weight'

export type WorkoutStatus = 'active' | 'completed' | 'cancelled'

export interface WorkoutSessionProps {
  id: string
  athleteId: string
  routineId?: string
  routineName?: string
  startedAt: Date
  completedAt?: Date
  sets: WorkoutSet[]
  status: WorkoutStatus
  notes?: string
  domainEvents: KovaDomainEvent[]
}

export class WorkoutSession {
  private constructor(private props: WorkoutSessionProps) {}

  static create(params: {
    athleteId: string
    routineId?: string
    routineName?: string
  }): WorkoutSession {
    return new WorkoutSession({
      id: crypto.randomUUID(),
      athleteId: params.athleteId,
      routineId: params.routineId,
      routineName: params.routineName,
      startedAt: new Date(),
      sets: [],
      status: 'active',
      domainEvents: [],
    })
  }

  static reconstitute(props: WorkoutSessionProps): WorkoutSession {
    return new WorkoutSession({ ...props, domainEvents: [] })
  }

  get id(): string { return this.props.id }
  get athleteId(): string { return this.props.athleteId }
  get routineId(): string | undefined { return this.props.routineId }
  get routineName(): string | undefined { return this.props.routineName }
  get startedAt(): Date { return this.props.startedAt }
  get completedAt(): Date | undefined { return this.props.completedAt }
  get sets(): ReadonlyArray<WorkoutSet> { return this.props.sets }
  get status(): WorkoutStatus { return this.props.status }
  get notes(): string | undefined { return this.props.notes }

  get isActive(): boolean { return this.props.status === 'active' }
  get isCompleted(): boolean { return this.props.status === 'completed' }

  get durationMinutes(): number {
    const end = this.props.completedAt ?? new Date()
    return Math.round((end.getTime() - this.props.startedAt.getTime()) / 60000)
  }

  get totalVolume(): Weight {
    return this.props.sets.reduce(
      (acc, set) => acc.add(set.volume),
      Weight.zero()
    )
  }

  get exerciseIds(): string[] {
    return [...new Set(this.props.sets.map(s => s.exerciseId))]
  }

  get setCountByExercise(): Map<string, number> {
    const map = new Map<string, number>()
    for (const set of this.props.sets) {
      map.set(set.exerciseId, (map.get(set.exerciseId) ?? 0) + 1)
    }
    return map
  }

  getSetsForExercise(exerciseId: string): WorkoutSet[] {
    return this.props.sets.filter(s => s.exerciseId === exerciseId)
  }

  recordSet(
    set: WorkoutSet,
    previousBest?: { weightKg: number; exerciseName: string }
  ): void {
    if (!this.isActive) throw new Error('Cannot record set on completed session')

    const isNewPR = previousBest && set.weight.toKg() > previousBest.weightKg

    const finalSet = isNewPR ? set.markAsPersonalRecord() : set
    this.props.sets = [...this.props.sets, finalSet]

    const setRecordedEvent: SetRecorded = {
      type: 'SetRecorded',
      occurredAt: new Date(),
      aggregateId: this.props.id,
      sessionId: this.props.id,
      exerciseId: set.exerciseId,
      setId: set.id,
      weightKg: set.weight.toKg(),
      reps: set.reps,
      rirValue: set.rir.value,
    }
    this.props.domainEvents = [...this.props.domainEvents, setRecordedEvent]

    if (isNewPR && previousBest) {
      const prEvent: PersonalRecordAchieved = {
        type: 'PersonalRecordAchieved',
        occurredAt: new Date(),
        aggregateId: this.props.id,
        sessionId: this.props.id,
        exerciseId: set.exerciseId,
        setId: set.id,
        previousBestKg: previousBest.weightKg,
        newBestKg: set.weight.toKg(),
        exerciseName: previousBest.exerciseName,
      }
      this.props.domainEvents = [...this.props.domainEvents, prEvent]
    }
  }

  complete(notes?: string): void {
    if (!this.isActive) throw new Error('Session is not active')
    this.props.status = 'completed'
    this.props.completedAt = new Date()
    this.props.notes = notes

    const event: WorkoutCompleted = {
      type: 'WorkoutCompleted',
      occurredAt: new Date(),
      aggregateId: this.props.id,
      sessionId: this.props.id,
      athleteId: this.props.athleteId,
      durationMinutes: this.durationMinutes,
      totalSets: this.props.sets.length,
      totalVolume: this.totalVolume.toKg(),
      exercises: this.exerciseIds,
    }
    this.props.domainEvents = [...this.props.domainEvents, event]
  }

  cancel(): void {
    this.props.status = 'cancelled'
  }

  removeLastSet(exerciseId: string): void {
    const exerciseSets = this.getSetsForExercise(exerciseId)
    if (exerciseSets.length === 0) return
    const lastSet = exerciseSets[exerciseSets.length - 1]
    if (lastSet) {
      this.props.sets = this.props.sets.filter(s => s.id !== lastSet.id)
    }
  }

  pullDomainEvents(): KovaDomainEvent[] {
    const events = [...this.props.domainEvents]
    this.props.domainEvents = []
    return events
  }

  toJSON(): object {
    return {
      id: this.props.id,
      athleteId: this.props.athleteId,
      routineId: this.props.routineId,
      routineName: this.props.routineName,
      startedAt: this.props.startedAt.toISOString(),
      completedAt: this.props.completedAt?.toISOString(),
      sets: this.props.sets.map(s => s.toJSON()),
      status: this.props.status,
      notes: this.props.notes,
    }
  }
}

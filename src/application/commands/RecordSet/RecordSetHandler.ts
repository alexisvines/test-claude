import type { IWorkoutRepository } from '../../../domain/repositories/IWorkoutRepository'
import type { IEventBus } from '../../ports/IEventBus'
import { WorkoutSet } from '../../../domain/entities/WorkoutSet'
import type { RecordSetCommand, RecordSetResult } from './RecordSetCommand'

export class RecordSetHandler {
  constructor(
    private readonly workoutRepo: IWorkoutRepository,
    private readonly eventBus: IEventBus
  ) {}

  async handle(command: RecordSetCommand): Promise<RecordSetResult> {
    const session = await this.workoutRepo.findById(command.sessionId)
    if (!session) throw new Error(`Session not found: ${command.sessionId}`)
    if (!session.isActive) throw new Error('Session is not active')

    const previousBest = await this.workoutRepo.getPersonalBest(
      session.athleteId,
      command.exerciseId
    )

    const set = WorkoutSet.create({
      exerciseId: command.exerciseId,
      setNumber: command.setNumber,
      weight: command.weight,
      reps: command.reps,
      rir: command.rir,
      rpe: command.rpe,
      notes: command.notes,
    })

    session.recordSet(
      set,
      previousBest !== null
        ? { weightKg: previousBest, exerciseName: command.exerciseName }
        : undefined
    )

    await this.workoutRepo.save(session)

    const events = session.pullDomainEvents()
    for (const event of events) {
      await this.eventBus.publish(event)
    }

    const recordedSet = session.sets[session.sets.length - 1]

    return {
      setId: set.id,
      isPersonalRecord: recordedSet?.isPersonalRecord ?? false,
    }
  }
}

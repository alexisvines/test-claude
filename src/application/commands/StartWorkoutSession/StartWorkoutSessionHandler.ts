import type { IWorkoutRepository } from '../../../domain/repositories/IWorkoutRepository'
import type { IRoutineRepository } from '../../../domain/repositories/IRoutineRepository'
import { WorkoutSession } from '../../../domain/entities/WorkoutSession'

export interface StartWorkoutSessionCommand {
  athleteId: string
  routineId?: string
}

export interface StartWorkoutSessionResult {
  sessionId: string
  routineName?: string
}

export class StartWorkoutSessionHandler {
  constructor(
    private readonly workoutRepo: IWorkoutRepository,
    private readonly routineRepo: IRoutineRepository
  ) {}

  async handle(command: StartWorkoutSessionCommand): Promise<StartWorkoutSessionResult> {
    const existing = await this.workoutRepo.findActive(command.athleteId)
    if (existing) {
      return { sessionId: existing.id, routineName: existing.routineName }
    }

    let routineName: string | undefined
    if (command.routineId) {
      const routine = await this.routineRepo.findById(command.routineId)
      routineName = routine?.name
    }

    const session = WorkoutSession.create({
      athleteId: command.athleteId,
      routineId: command.routineId,
      routineName,
    })

    await this.workoutRepo.save(session)

    return { sessionId: session.id, routineName }
  }
}

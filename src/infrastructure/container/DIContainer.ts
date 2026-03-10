import { getDatabase } from '../persistence/dexie/KovaDatabase'
import { DexieWorkoutRepository } from '../persistence/dexie/DexieWorkoutRepository'
import { DexieExerciseRepository } from '../persistence/dexie/DexieExerciseRepository'
import { DexieRoutineRepository } from '../persistence/dexie/DexieRoutineRepository'
import { DexieAthleteRepository } from '../persistence/dexie/DexieAthleteRepository'
import { StartWorkoutSessionHandler } from '../../application/commands/StartWorkoutSession/StartWorkoutSessionHandler'
import { RecordSetHandler } from '../../application/commands/RecordSet/RecordSetHandler'
import { CompleteWorkoutSessionHandler } from '../../application/commands/CompleteWorkoutSession/CompleteWorkoutSessionHandler'
import { aiProviderFactory } from '../ai/AIProviderFactory'
import type { IWorkoutRepository } from '../../domain/repositories/IWorkoutRepository'
import type { IExerciseRepository } from '../../domain/repositories/IExerciseRepository'
import type { IRoutineRepository } from '../../domain/repositories/IRoutineRepository'
import type { IAthleteRepository } from '../../domain/repositories/IAthleteRepository'
import type { IEventBus } from '../../application/ports/IEventBus'
import type { IAIEvaluationPort } from '../../application/ports/IAIEvaluationPort'
import type { KovaDomainEvent } from '../../domain/events'

class InMemoryEventBus implements IEventBus {
  private readonly handlers = new Map<string, Array<(event: KovaDomainEvent) => Promise<void>>>()

  async publish(event: KovaDomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) ?? []
    await Promise.allSettled(handlers.map(h => h(event)))
  }

  subscribe<T extends KovaDomainEvent>(
    eventType: T['type'],
    handler: (event: T) => Promise<void>
  ): void {
    const existing = this.handlers.get(eventType) ?? []
    this.handlers.set(eventType, [...existing, handler as (event: KovaDomainEvent) => Promise<void>])
  }
}

export class DIContainer {
  private static instance: DIContainer | null = null

  readonly workoutRepo: IWorkoutRepository
  readonly exerciseRepo: IExerciseRepository
  readonly routineRepo: IRoutineRepository
  readonly athleteRepo: IAthleteRepository
  readonly eventBus: IEventBus
  readonly ai: IAIEvaluationPort

  readonly startWorkoutHandler: StartWorkoutSessionHandler
  readonly recordSetHandler: RecordSetHandler
  readonly completeWorkoutHandler: CompleteWorkoutSessionHandler

  private constructor() {
    const db = getDatabase()

    this.workoutRepo = new DexieWorkoutRepository(db)
    this.exerciseRepo = new DexieExerciseRepository(db)
    this.routineRepo = new DexieRoutineRepository(db)
    this.athleteRepo = new DexieAthleteRepository(db)
    this.eventBus = new InMemoryEventBus()
    this.ai = aiProviderFactory.create()

    this.startWorkoutHandler = new StartWorkoutSessionHandler(
      this.workoutRepo,
      this.routineRepo
    )
    this.recordSetHandler = new RecordSetHandler(this.workoutRepo, this.eventBus)
    this.completeWorkoutHandler = new CompleteWorkoutSessionHandler(
      this.workoutRepo,
      this.athleteRepo,
      this.eventBus
    )
  }

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer()
    }
    return DIContainer.instance
  }

  static reset(): void {
    DIContainer.instance = null
  }
}

export function getContainer(): DIContainer {
  return DIContainer.getInstance()
}

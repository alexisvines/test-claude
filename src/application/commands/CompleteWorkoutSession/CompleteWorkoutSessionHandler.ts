import type { IWorkoutRepository } from '../../../domain/repositories/IWorkoutRepository'
import type { IAthleteRepository } from '../../../domain/repositories/IAthleteRepository'
import type { IEventBus } from '../../ports/IEventBus'
import { AchievementEvaluator } from '../../../domain/services/AchievementEvaluator'
import { Achievement, ALL_ACHIEVEMENTS } from '../../../domain/entities/Achievement'

export interface CompleteWorkoutSessionCommand {
  sessionId: string
  notes?: string
}

export interface CompleteWorkoutSessionResult {
  durationMinutes: number
  totalSets: number
  totalVolumeKg: number
  newAchievements: string[]
}

export class CompleteWorkoutSessionHandler {
  private readonly achievementEvaluator = new AchievementEvaluator()

  constructor(
    private readonly workoutRepo: IWorkoutRepository,
    private readonly athleteRepo: IAthleteRepository,
    private readonly eventBus: IEventBus
  ) {}

  async handle(command: CompleteWorkoutSessionCommand): Promise<CompleteWorkoutSessionResult> {
    const session = await this.workoutRepo.findById(command.sessionId)
    if (!session) throw new Error(`Session not found: ${command.sessionId}`)
    if (!session.isActive) throw new Error('Session is already completed')

    session.complete(command.notes)
    await this.workoutRepo.save(session)

    const events = session.pullDomainEvents()
    for (const event of events) {
      await this.eventBus.publish(event)
    }

    const athlete = await this.athleteRepo.getDefault()
    let newAchievements: string[] = []

    if (athlete) {
      athlete.recordWorkout(session.totalVolume.toKg())

      const prCount = session.sets.filter(s => s.isPersonalRecord).length
      for (let i = 0; i < prCount; i++) athlete.recordPR()

      const lastDate = athlete.stats.lastWorkoutDate
      const daysSinceLast = lastDate
        ? Math.floor((Date.now() - lastDate.getTime()) / 86400000)
        : 999

      const newStreak =
        daysSinceLast <= 1
          ? athlete.stats.currentStreakDays + 1
          : 1
      athlete.updateStreak(newStreak)

      const unlockedAchievements = await this.athleteRepo.getUnlockedAchievements(athlete.id)
      const unlockedIds = new Set(unlockedAchievements.map(a => a.id))

      newAchievements = this.achievementEvaluator.evaluate(athlete.stats, unlockedIds)

      for (const achievementId of newAchievements) {
        const definition = ALL_ACHIEVEMENTS.find(a => a.id === achievementId)
        if (definition) {
          const achievement = Achievement.define(definition).unlock()
          await this.athleteRepo.saveAchievement(athlete.id, achievement)

          await this.eventBus.publish({
            type: 'AchievementUnlocked',
            occurredAt: new Date(),
            aggregateId: athlete.id,
            athleteId: athlete.id,
            achievementId,
            achievementName: definition.name,
          })
        }
      }

      await this.athleteRepo.save(athlete)
    }

    return {
      durationMinutes: session.durationMinutes,
      totalSets: session.sets.length,
      totalVolumeKg: session.totalVolume.toKg(),
      newAchievements,
    }
  }
}

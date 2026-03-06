import type { IAthleteRepository } from '../../../domain/repositories/IAthleteRepository'
import { Athlete } from '../../../domain/entities/Athlete'
import { Achievement, ALL_ACHIEVEMENTS } from '../../../domain/entities/Achievement'
import type { GymOSDatabase } from './GymOSDatabase'

export class DexieAthleteRepository implements IAthleteRepository {
  constructor(private readonly db: GymOSDatabase) {}

  async save(athlete: Athlete): Promise<void> {
    await this.db.athletes.put({
      id: athlete.id,
      name: athlete.name,
      weightUnit: athlete.weightUnit,
      stats: JSON.stringify(athlete.toJSON()),
      activeRoutineId: athlete.activeRoutineId,
      createdAt: athlete.createdAt.toISOString(),
    })
  }

  async getDefault(): Promise<Athlete | null> {
    const record = await this.db.athletes.toCollection().first()
    if (!record) return null
    const data = JSON.parse(record.stats) as Record<string, unknown>
    return Athlete.fromJSON(data)
  }

  async saveAchievement(athleteId: string, achievement: Achievement): Promise<void> {
    await this.db.achievements.put({
      id: achievement.id,
      athleteId,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      category: achievement.category,
      isUnlocked: achievement.isUnlocked ? 1 : 0,
      unlockedAt: achievement.unlockedAt?.toISOString(),
    })
  }

  async getAchievements(athleteId: string): Promise<Achievement[]> {
    const unlockedRecords = await this.db.achievements
      .where('athleteId')
      .equals(athleteId)
      .toArray()

    const unlockedMap = new Map(unlockedRecords.map(r => [r.id, r]))

    return ALL_ACHIEVEMENTS.map(def => {
      const record = unlockedMap.get(def.id)
      const base = Achievement.define(def)
      if (record?.isUnlocked) {
        return Achievement.reconstitute({
          ...def,
          isUnlocked: true,
          unlockedAt: record.unlockedAt ? new Date(record.unlockedAt) : new Date(),
        })
      }
      return base
    })
  }

  async getUnlockedAchievements(athleteId: string): Promise<Achievement[]> {
    const records = await this.db.achievements
      .where('athleteId')
      .equals(athleteId)
      .filter(r => r.isUnlocked === 1)
      .toArray()

    return records.map(r =>
      Achievement.reconstitute({
        id: r.id,
        name: r.name,
        description: r.description,
        icon: r.icon,
        category: r.category as Achievement['category'],
        isUnlocked: true,
        unlockedAt: r.unlockedAt ? new Date(r.unlockedAt) : undefined,
      })
    )
  }
}

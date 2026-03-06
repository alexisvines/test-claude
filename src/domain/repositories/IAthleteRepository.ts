import type { Athlete } from '../entities/Athlete'
import type { Achievement } from '../entities/Achievement'

export interface IAthleteRepository {
  save(athlete: Athlete): Promise<void>
  getDefault(): Promise<Athlete | null>
  saveAchievement(athleteId: string, achievement: Achievement): Promise<void>
  getAchievements(athleteId: string): Promise<Achievement[]>
  getUnlockedAchievements(athleteId: string): Promise<Achievement[]>
}

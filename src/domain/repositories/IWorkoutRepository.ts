import type { WorkoutSession } from '../entities/WorkoutSession'

export interface IWorkoutRepository {
  save(session: WorkoutSession): Promise<void>
  findById(id: string): Promise<WorkoutSession | null>
  findActive(athleteId: string): Promise<WorkoutSession | null>
  findByAthleteId(athleteId: string, limit?: number): Promise<WorkoutSession[]>
  findByDateRange(athleteId: string, from: Date, to: Date): Promise<WorkoutSession[]>
  delete(id: string): Promise<void>
  getPersonalBest(athleteId: string, exerciseId: string): Promise<number | null>
}

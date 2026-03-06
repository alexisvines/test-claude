import type { Exercise } from '../entities/Exercise'
import type { MuscleGroup } from '../value-objects/MuscleGroup'

export interface ExerciseFilter {
  muscleGroups?: MuscleGroup[]
  equipment?: string[]
  difficulty?: string
  search?: string
  isCustom?: boolean
}

export interface IExerciseRepository {
  save(exercise: Exercise): Promise<void>
  findById(id: string): Promise<Exercise | null>
  findAll(filter?: ExerciseFilter): Promise<Exercise[]>
  findByMuscleGroup(muscle: MuscleGroup): Promise<Exercise[]>
  search(query: string): Promise<Exercise[]>
  delete(id: string): Promise<void>
  count(): Promise<number>
  bulkSave(exercises: Exercise[]): Promise<void>
}

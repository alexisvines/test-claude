import type { IExerciseRepository, ExerciseFilter } from '../../../domain/repositories/IExerciseRepository'
import { Exercise } from '../../../domain/entities/Exercise'
import type { MuscleGroup } from '../../../domain/value-objects/MuscleGroup'
import type { GymOSDatabase, ExerciseRecord } from './GymOSDatabase'

export class DexieExerciseRepository implements IExerciseRepository {
  constructor(private readonly db: GymOSDatabase) {}

  async save(exercise: Exercise): Promise<void> {
    const json = exercise.toJSON()
    await this.db.exercises.put({
      id: json.id,
      name: json.name,
      nameEs: json.nameEs,
      primaryMuscles: JSON.stringify(json.muscleGroups.primary),
      secondaryMuscles: JSON.stringify(json.muscleGroups.secondary),
      equipment: JSON.stringify(json.equipment),
      movementPattern: json.movementPattern,
      difficulty: json.difficulty,
      instructions: JSON.stringify(json.instructions),
      commonMistakes: JSON.stringify(json.commonMistakes),
      tips: JSON.stringify(json.tips),
      variants: JSON.stringify(json.variants),
      isCustom: json.isCustom ? 1 : 0,
    })
  }

  async bulkSave(exercises: Exercise[]): Promise<void> {
    const records = exercises.map(exercise => {
      const json = exercise.toJSON()
      return {
        id: json.id,
        name: json.name,
        nameEs: json.nameEs,
        primaryMuscles: JSON.stringify(json.muscleGroups.primary),
        secondaryMuscles: JSON.stringify(json.muscleGroups.secondary),
        equipment: JSON.stringify(json.equipment),
        movementPattern: json.movementPattern,
        difficulty: json.difficulty,
        instructions: JSON.stringify(json.instructions),
        commonMistakes: JSON.stringify(json.commonMistakes),
        tips: JSON.stringify(json.tips),
        variants: JSON.stringify(json.variants),
        isCustom: json.isCustom ? 1 : 0,
      }
    })
    await this.db.exercises.bulkPut(records)
  }

  async findById(id: string): Promise<Exercise | null> {
    const record = await this.db.exercises.get(id)
    if (!record) return null
    return this.reconstitute(record)
  }

  async findAll(filter?: ExerciseFilter): Promise<Exercise[]> {
    let collection = this.db.exercises.toCollection()

    if (filter?.isCustom !== undefined) {
      collection = this.db.exercises.where('isCustom').equals(filter.isCustom ? 1 : 0)
    }

    const records = await collection.toArray()
    let exercises = records.map(r => this.reconstitute(r))

    if (filter?.muscleGroups && filter.muscleGroups.length > 0) {
      exercises = exercises.filter(e =>
        filter.muscleGroups!.some(m => e.targetsMusle(m))
      )
    }

    if (filter?.equipment && filter.equipment.length > 0) {
      exercises = exercises.filter(e =>
        filter.equipment!.some(eq => e.equipment.includes(eq as Example))
      )
    }

    if (filter?.difficulty) {
      exercises = exercises.filter(e => e.difficulty === filter.difficulty)
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase()
      exercises = exercises.filter(
        e => e.name.toLowerCase().includes(q) || e.nameEs.toLowerCase().includes(q)
      )
    }

    return exercises
  }

  async findByMuscleGroup(muscle: MuscleGroup): Promise<Exercise[]> {
    return this.findAll({ muscleGroups: [muscle] })
  }

  async search(query: string): Promise<Exercise[]> {
    return this.findAll({ search: query })
  }

  async delete(id: string): Promise<void> {
    await this.db.exercises.delete(id)
  }

  async count(): Promise<number> {
    return this.db.exercises.count()
  }

  private reconstitute(record: ExerciseRecord): Exercise {
    return Exercise.fromJSON({
      id: record.id,
      name: record.name,
      nameEs: record.nameEs,
      muscleGroups: {
        primary: JSON.parse(record.primaryMuscles) as MuscleGroup[],
        secondary: JSON.parse(record.secondaryMuscles) as MuscleGroup[],
      },
      equipment: JSON.parse(record.equipment),
      movementPattern: record.movementPattern as Exercise['movementPattern'],
      difficulty: record.difficulty as Exercise['difficulty'],
      instructions: JSON.parse(record.instructions),
      commonMistakes: JSON.parse(record.commonMistakes),
      tips: JSON.parse(record.tips),
      variants: JSON.parse(record.variants),
      isCustom: record.isCustom === 1,
    })
  }
}

// TypeScript workaround for equipment type
type Example = import('../../../domain/entities/Exercise').Equipment

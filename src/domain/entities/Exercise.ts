import type { MuscleGroup } from '../value-objects/MuscleGroup'

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'kettlebell'
  | 'resistance-band'
  | 'bench'
  | 'pull-up-bar'
  | 'smith-machine'
  | 'ez-bar'

export type MovementPattern =
  | 'push-horizontal'
  | 'push-vertical'
  | 'pull-horizontal'
  | 'pull-vertical'
  | 'squat'
  | 'hinge'
  | 'carry'
  | 'isolation'
  | 'core'

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export interface ExerciseProps {
  id: string
  name: string
  nameEs: string
  muscleGroups: {
    primary: MuscleGroup[]
    secondary: MuscleGroup[]
  }
  equipment: Equipment[]
  movementPattern: MovementPattern
  difficulty: Difficulty
  instructions: string[]
  commonMistakes: string[]
  tips: string[]
  variants: string[]
  isCustom?: boolean
  createdBy?: string
}

export class Exercise {
  private constructor(private readonly props: ExerciseProps) {}

  static create(params: Omit<ExerciseProps, 'id'>): Exercise {
    if (!params.name.trim()) throw new Error('Exercise name is required')
    if (params.muscleGroups.primary.length === 0) {
      throw new Error('Exercise must have at least one primary muscle group')
    }
    return new Exercise({ ...params, id: crypto.randomUUID() })
  }

  static reconstitute(props: ExerciseProps): Exercise {
    return new Exercise(props)
  }

  get id(): string { return this.props.id }
  get name(): string { return this.props.name }
  get nameEs(): string { return this.props.nameEs }
  get muscleGroups(): ExerciseProps['muscleGroups'] { return this.props.muscleGroups }
  get equipment(): Equipment[] { return this.props.equipment }
  get movementPattern(): MovementPattern { return this.props.movementPattern }
  get difficulty(): Difficulty { return this.props.difficulty }
  get instructions(): string[] { return this.props.instructions }
  get commonMistakes(): string[] { return this.props.commonMistakes }
  get tips(): string[] { return this.props.tips }
  get variants(): string[] { return this.props.variants }
  get isCustom(): boolean { return this.props.isCustom ?? false }

  get primaryMuscles(): MuscleGroup[] {
    return this.props.muscleGroups.primary
  }

  get allMuscles(): MuscleGroup[] {
    return [
      ...this.props.muscleGroups.primary,
      ...this.props.muscleGroups.secondary,
    ]
  }

  targetsMusle(muscle: MuscleGroup): boolean {
    return this.allMuscles.includes(muscle)
  }

  primaryTargets(muscle: MuscleGroup): boolean {
    return this.props.muscleGroups.primary.includes(muscle)
  }

  toJSON(): ExerciseProps {
    return { ...this.props }
  }

  static fromJSON(data: ExerciseProps): Exercise {
    return new Exercise(data)
  }
}

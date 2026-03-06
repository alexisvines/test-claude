import { RepRange } from '../value-objects/RepRange'

export type ProgressionMethod =
  | 'double-progression'
  | 'linear'
  | 'rpe-based'
  | 'wave-loading'

export interface RoutineExercise {
  exerciseId: string
  sets: number
  repRange: RepRange
  rirTarget: number
  progressionMethod: ProgressionMethod
  restSeconds: number
  notes?: string
}

export interface RoutineDay {
  id: string
  name: string
  exercises: RoutineExercise[]
  isRestDay: boolean
  restDayType?: 'complete' | 'active'
}

export interface RoutineProps {
  id: string
  name: string
  description?: string
  days: RoutineDay[]
  isTemplate: boolean
  templateId?: string
  createdAt: Date
  updatedAt: Date
}

export class Routine {
  private constructor(private props: RoutineProps) {}

  static create(params: {
    name: string
    description?: string
    days?: RoutineDay[]
  }): Routine {
    if (!params.name.trim()) throw new Error('Routine name is required')
    return new Routine({
      id: crypto.randomUUID(),
      name: params.name,
      description: params.description,
      days: params.days ?? [],
      isTemplate: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  static reconstitute(props: RoutineProps): Routine {
    return new Routine(props)
  }

  get id(): string { return this.props.id }
  get name(): string { return this.props.name }
  get description(): string | undefined { return this.props.description }
  get days(): ReadonlyArray<RoutineDay> { return this.props.days }
  get isTemplate(): boolean { return this.props.isTemplate }
  get createdAt(): Date { return this.props.createdAt }
  get updatedAt(): Date { return this.props.updatedAt }

  get totalExercises(): number {
    return this.props.days.reduce((acc, day) => acc + day.exercises.length, 0)
  }

  get trainingDays(): RoutineDay[] {
    return this.props.days.filter(d => !d.isRestDay)
  }

  addDay(day: Omit<RoutineDay, 'id'>): void {
    this.props.days = [...this.props.days, { ...day, id: crypto.randomUUID() }]
    this.props.updatedAt = new Date()
  }

  removeDay(dayId: string): void {
    this.props.days = this.props.days.filter(d => d.id !== dayId)
    this.props.updatedAt = new Date()
  }

  updateDay(dayId: string, updates: Partial<RoutineDay>): void {
    this.props.days = this.props.days.map(d =>
      d.id === dayId ? { ...d, ...updates } : d
    )
    this.props.updatedAt = new Date()
  }

  reorderDays(dayIds: string[]): void {
    const dayMap = new Map(this.props.days.map(d => [d.id, d]))
    this.props.days = dayIds.map(id => dayMap.get(id)).filter((d): d is RoutineDay => !!d)
    this.props.updatedAt = new Date()
  }

  toJSON(): object {
    return {
      ...this.props,
      days: this.props.days.map(day => ({
        ...day,
        exercises: day.exercises.map(ex => ({
          ...ex,
          repRange: ex.repRange.toJSON(),
        })),
      })),
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    }
  }

  static fromJSON(data: Record<string, unknown>): Routine {
    const days = (data['days'] as Array<Record<string, unknown>>).map(day => ({
      id: day['id'] as string,
      name: day['name'] as string,
      isRestDay: day['isRestDay'] as boolean,
      restDayType: day['restDayType'] as 'complete' | 'active' | undefined,
      exercises: ((day['exercises'] as Array<Record<string, unknown>>) ?? []).map(ex => ({
        exerciseId: ex['exerciseId'] as string,
        sets: ex['sets'] as number,
        repRange: RepRange.fromJSON(ex['repRange'] as { min: number; max: number }),
        rirTarget: ex['rirTarget'] as number,
        progressionMethod: ex['progressionMethod'] as ProgressionMethod,
        restSeconds: ex['restSeconds'] as number,
        notes: ex['notes'] as string | undefined,
      })),
    }))

    return Routine.reconstitute({
      id: data['id'] as string,
      name: data['name'] as string,
      description: data['description'] as string | undefined,
      days,
      isTemplate: data['isTemplate'] as boolean,
      templateId: data['templateId'] as string | undefined,
      createdAt: new Date(data['createdAt'] as string),
      updatedAt: new Date(data['updatedAt'] as string),
    })
  }
}

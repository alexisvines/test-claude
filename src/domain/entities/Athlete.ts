import type { WeightUnit } from '../value-objects/Weight'

export type AthleteLevel =
  | 'novato'
  | 'principiante'
  | 'intermedio'
  | 'avanzado'
  | 'elite'
  | 'leyenda'

export interface AthleteStats {
  totalSessions: number
  totalVolumeTons: number
  totalPRs: number
  currentStreakDays: number
  longestStreakDays: number
  lastWorkoutDate?: Date
}

export interface AthleteProps {
  id: string
  name: string
  weightUnit: WeightUnit
  stats: AthleteStats
  createdAt: Date
  activeRoutineId?: string
}

export const LEVEL_THRESHOLDS: Record<AthleteLevel, number> = {
  novato: 0,
  principiante: 10,
  intermedio: 25,
  avanzado: 100,
  elite: 250,
  leyenda: 500,
}

export const LEVEL_LABELS: Record<AthleteLevel, string> = {
  novato: 'Novato',
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
  elite: 'Elite',
  leyenda: 'Leyenda',
}

function getLevelFromSessions(sessions: number): AthleteLevel {
  if (sessions >= 500) return 'leyenda'
  if (sessions >= 250) return 'elite'
  if (sessions >= 100) return 'avanzado'
  if (sessions >= 25) return 'intermedio'
  if (sessions >= 10) return 'principiante'
  return 'novato'
}

export class Athlete {
  private constructor(private props: AthleteProps) {}

  static create(params: { name: string; weightUnit?: WeightUnit }): Athlete {
    if (!params.name.trim()) throw new Error('Athlete name is required')
    return new Athlete({
      id: crypto.randomUUID(),
      name: params.name,
      weightUnit: params.weightUnit ?? 'kg',
      stats: {
        totalSessions: 0,
        totalVolumeTons: 0,
        totalPRs: 0,
        currentStreakDays: 0,
        longestStreakDays: 0,
      },
      createdAt: new Date(),
    })
  }

  static reconstitute(props: AthleteProps): Athlete {
    return new Athlete(props)
  }

  get id(): string { return this.props.id }
  get name(): string { return this.props.name }
  get weightUnit(): WeightUnit { return this.props.weightUnit }
  get stats(): AthleteStats { return this.props.stats }
  get createdAt(): Date { return this.props.createdAt }
  get activeRoutineId(): string | undefined { return this.props.activeRoutineId }

  get level(): AthleteLevel {
    return getLevelFromSessions(this.props.stats.totalSessions)
  }

  get levelLabel(): string {
    return LEVEL_LABELS[this.level]
  }

  get xpToNextLevel(): number {
    const levels = Object.entries(LEVEL_THRESHOLDS) as [AthleteLevel, number][]
    const current = this.props.stats.totalSessions
    const nextThreshold = levels.find(([, threshold]) => threshold > current)
    return nextThreshold ? nextThreshold[1] - current : 0
  }

  recordWorkout(volumeKg: number): void {
    this.props.stats = {
      ...this.props.stats,
      totalSessions: this.props.stats.totalSessions + 1,
      totalVolumeTons: this.props.stats.totalVolumeTons + volumeKg / 1000,
      lastWorkoutDate: new Date(),
    }
  }

  recordPR(): void {
    this.props.stats = {
      ...this.props.stats,
      totalPRs: this.props.stats.totalPRs + 1,
    }
  }

  updateStreak(streakDays: number): void {
    this.props.stats = {
      ...this.props.stats,
      currentStreakDays: streakDays,
      longestStreakDays: Math.max(this.props.stats.longestStreakDays, streakDays),
    }
  }

  setActiveRoutine(routineId: string | undefined): void {
    this.props.activeRoutineId = routineId
  }

  updateSettings(updates: { name?: string; weightUnit?: WeightUnit }): void {
    if (updates.name !== undefined) this.props.name = updates.name
    if (updates.weightUnit !== undefined) this.props.weightUnit = updates.weightUnit
  }

  toJSON(): object {
    return {
      ...this.props,
      stats: {
        ...this.props.stats,
        lastWorkoutDate: this.props.stats.lastWorkoutDate?.toISOString(),
      },
      createdAt: this.props.createdAt.toISOString(),
    }
  }

  static fromJSON(data: Record<string, unknown>): Athlete {
    const stats = data['stats'] as Record<string, unknown>
    return Athlete.reconstitute({
      id: data['id'] as string,
      name: data['name'] as string,
      weightUnit: data['weightUnit'] as WeightUnit,
      activeRoutineId: data['activeRoutineId'] as string | undefined,
      stats: {
        totalSessions: stats['totalSessions'] as number,
        totalVolumeTons: stats['totalVolumeTons'] as number,
        totalPRs: stats['totalPRs'] as number,
        currentStreakDays: stats['currentStreakDays'] as number,
        longestStreakDays: stats['longestStreakDays'] as number,
        lastWorkoutDate: stats['lastWorkoutDate']
          ? new Date(stats['lastWorkoutDate'] as string)
          : undefined,
      },
      createdAt: new Date(data['createdAt'] as string),
    })
  }
}

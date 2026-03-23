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

export const LEVEL_LABELS: Record<AthleteLevel, string> = {
  novato: 'Novato',
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
  elite: 'Elite',
  leyenda: 'Leyenda',
}

/**
 * Puntuación compuesta que refleja la experiencia real del atleta.
 *
 * Fórmula:
 *   XP = sesiones×10 + PRs×5 + toneladasVolumen×2 + rachaMaxima×1
 *
 * Ejemplos orientativos:
 *   5 sesiones, 0 PRs, 1 ton  → ~51 XP → Principiante
 *   25 sesiones, 10 PRs, 5 ton → ~310 XP → Intermedio
 *   100 sesiones, 40 PRs, 50 ton → ~1150 XP → Avanzado
 */
export function calculateAthleteXP(stats: AthleteStats): number {
  return (
    stats.totalSessions * 10 +
    stats.totalPRs * 5 +
    Math.floor(stats.totalVolumeTons) * 2 +
    stats.longestStreakDays * 1
  )
}

// Umbrales en XP (no en sesiones)
export const LEVEL_XP_THRESHOLDS: Record<AthleteLevel, number> = {
  novato:        0,
  principiante:  50,
  intermedio:    250,
  avanzado:      1000,
  elite:         4000,
  leyenda:       10000,
}

function getLevelFromXP(xp: number): AthleteLevel {
  if (xp >= 10000) return 'leyenda'
  if (xp >= 4000)  return 'elite'
  if (xp >= 1000)  return 'avanzado'
  if (xp >= 250)   return 'intermedio'
  if (xp >= 50)    return 'principiante'
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

  get xp(): number {
    return calculateAthleteXP(this.props.stats)
  }

  get level(): AthleteLevel {
    return getLevelFromXP(this.xp)
  }

  get levelLabel(): string {
    return LEVEL_LABELS[this.level]
  }

  /** XP que falta para subir al siguiente nivel (0 si es leyenda) */
  get xpToNextLevel(): number {
    const current = this.xp
    const thresholds = Object.values(LEVEL_XP_THRESHOLDS).sort((a, b) => a - b)
    const next = thresholds.find(t => t > current)
    return next !== undefined ? next - current : 0
  }

  /** Progreso dentro del nivel actual (0-1) para barra de XP */
  get levelProgress(): number {
    const entries = Object.entries(LEVEL_XP_THRESHOLDS).sort((a, b) => a[1] - b[1]) as [AthleteLevel, number][]
    const current = this.xp
    const currentIdx = entries.findIndex(([l]) => l === this.level)
    const currentThreshold = entries[currentIdx]?.[1] ?? 0
    const nextThreshold = entries[currentIdx + 1]?.[1]
    if (nextThreshold === undefined) return 1
    return Math.min(1, (current - currentThreshold) / (nextThreshold - currentThreshold))
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

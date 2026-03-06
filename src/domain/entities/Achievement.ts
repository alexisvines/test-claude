export type AchievementCategory =
  | 'first-time'
  | 'streak'
  | 'volume'
  | 'personal-records'
  | 'consistency'

export interface AchievementProps {
  id: string
  name: string
  description: string
  icon: string
  category: AchievementCategory
  unlockedAt?: Date
  isUnlocked: boolean
}

export class Achievement {
  private constructor(private props: AchievementProps) {}

  static define(params: Omit<AchievementProps, 'isUnlocked' | 'unlockedAt'>): Achievement {
    return new Achievement({ ...params, isUnlocked: false })
  }

  static reconstitute(props: AchievementProps): Achievement {
    return new Achievement(props)
  }

  get id(): string { return this.props.id }
  get name(): string { return this.props.name }
  get description(): string { return this.props.description }
  get icon(): string { return this.props.icon }
  get category(): AchievementCategory { return this.props.category }
  get unlockedAt(): Date | undefined { return this.props.unlockedAt }
  get isUnlocked(): boolean { return this.props.isUnlocked }

  unlock(): Achievement {
    if (this.props.isUnlocked) return this
    return new Achievement({
      ...this.props,
      isUnlocked: true,
      unlockedAt: new Date(),
    })
  }

  toJSON(): AchievementProps {
    return { ...this.props, unlockedAt: this.props.unlockedAt }
  }
}

export const ALL_ACHIEVEMENTS: Omit<AchievementProps, 'isUnlocked' | 'unlockedAt'>[] = [
  // First time
  { id: 'first-session', name: 'Primera Sesión', description: 'El viaje comienza', icon: '🏋️', category: 'first-time' },
  { id: 'first-pr', name: 'Primer PR', description: 'Rompe tus límites', icon: '💪', category: 'first-time' },
  { id: 'first-week', name: 'Primera Semana', description: 'Completaste tu primera semana', icon: '🗓️', category: 'first-time' },
  // Streaks
  { id: 'streak-7', name: 'Racha de Fuego', description: '7 días consecutivos', icon: '🔥', category: 'streak' },
  { id: 'streak-14', name: 'Energía Eléctrica', description: '14 días consecutivos', icon: '⚡', category: 'streak' },
  { id: 'streak-30', name: 'Diamante', description: '30 días consecutivos', icon: '💎', category: 'streak' },
  { id: 'streak-90', name: 'Corona', description: '90 días consecutivos', icon: '👑', category: 'streak' },
  { id: 'streak-180', name: 'Estrella', description: '180 días consecutivos', icon: '🌟', category: 'streak' },
  // Volume
  { id: 'volume-1t', name: '1 Tonelada', description: 'Levantaste tu primera tonelada', icon: '🪨', category: 'volume' },
  { id: 'volume-10t', name: '10 Toneladas', description: 'Levantaste 10 toneladas en total', icon: '🏗️', category: 'volume' },
  { id: 'volume-100t', name: '100 Toneladas', description: 'Levantaste 100 toneladas en total', icon: '🚀', category: 'volume' },
  // PRs
  { id: 'prs-10', name: '10 PRs', description: 'Lograste 10 récords personales', icon: '⭐', category: 'personal-records' },
  { id: 'prs-50', name: '50 PRs', description: 'Lograste 50 récords personales', icon: '🌠', category: 'personal-records' },
  { id: 'prs-100', name: '100 PRs', description: 'Lograste 100 récords personales', icon: '🏆', category: 'personal-records' },
  // Consistency
  { id: 'sessions-25', name: '25 Sesiones', description: 'Completaste 25 entrenamientos', icon: '📅', category: 'consistency' },
  { id: 'sessions-100', name: '100 Sesiones', description: 'Completaste 100 entrenamientos', icon: '💯', category: 'consistency' },
  { id: 'sessions-365', name: '365 Sesiones', description: 'Un año de entrenamientos', icon: '🎯', category: 'consistency' },
]

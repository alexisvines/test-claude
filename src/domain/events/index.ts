export interface DomainEvent {
  readonly type: string
  readonly occurredAt: Date
  readonly aggregateId: string
}

export interface WorkoutCompleted extends DomainEvent {
  readonly type: 'WorkoutCompleted'
  readonly sessionId: string
  readonly athleteId: string
  readonly durationMinutes: number
  readonly totalSets: number
  readonly totalVolume: number
  readonly exercises: string[]
}

export interface SetRecorded extends DomainEvent {
  readonly type: 'SetRecorded'
  readonly sessionId: string
  readonly exerciseId: string
  readonly setId: string
  readonly weightKg: number
  readonly reps: number
  readonly rirValue: number
}

export interface PersonalRecordAchieved extends DomainEvent {
  readonly type: 'PersonalRecordAchieved'
  readonly sessionId: string
  readonly exerciseId: string
  readonly setId: string
  readonly previousBestKg: number
  readonly newBestKg: number
  readonly exerciseName: string
}

export interface StreakMilestoneReached extends DomainEvent {
  readonly type: 'StreakMilestoneReached'
  readonly athleteId: string
  readonly streakDays: number
}

export interface DeloadRecommended extends DomainEvent {
  readonly type: 'DeloadRecommended'
  readonly athleteId: string
  readonly exerciseId: string
  readonly reason: string
}

export interface AchievementUnlocked extends DomainEvent {
  readonly type: 'AchievementUnlocked'
  readonly athleteId: string
  readonly achievementId: string
  readonly achievementName: string
}

export type GymOSDomainEvent =
  | WorkoutCompleted
  | SetRecorded
  | PersonalRecordAchieved
  | StreakMilestoneReached
  | DeloadRecommended
  | AchievementUnlocked

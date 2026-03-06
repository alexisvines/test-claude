import Dexie, { type Table } from 'dexie'

export interface WorkoutSessionRecord {
  id: string
  athleteId: string
  routineId?: string
  routineName?: string
  startedAt: string
  completedAt?: string
  status: string
  notes?: string
  sets: string // JSON
}

export interface ExerciseRecord {
  id: string
  name: string
  nameEs: string
  primaryMuscles: string // JSON array
  secondaryMuscles: string // JSON array
  equipment: string // JSON array
  movementPattern: string
  difficulty: string
  instructions: string // JSON array
  commonMistakes: string // JSON array
  tips: string // JSON array
  variants: string // JSON array
  isCustom: number // 0 or 1 (Dexie boolean indexing)
}

export interface RoutineRecord {
  id: string
  name: string
  description?: string
  days: string // JSON
  isTemplate: number
  templateId?: string
  createdAt: string
  updatedAt: string
}

export interface AthleteRecord {
  id: string
  name: string
  weightUnit: string
  stats: string // JSON
  createdAt: string
  activeRoutineId?: string
}

export interface AchievementRecord {
  id: string
  athleteId: string
  name: string
  description: string
  icon: string
  category: string
  isUnlocked: number
  unlockedAt?: string
}

export class GymOSDatabase extends Dexie {
  workoutSessions!: Table<WorkoutSessionRecord>
  exercises!: Table<ExerciseRecord>
  routines!: Table<RoutineRecord>
  athletes!: Table<AthleteRecord>
  achievements!: Table<AchievementRecord>

  constructor() {
    super('GymOSDB')
    this.version(1).stores({
      workoutSessions: 'id, athleteId, status, startedAt, completedAt',
      exercises: 'id, name, nameEs, movementPattern, difficulty, isCustom',
      routines: 'id, name, isTemplate',
      athletes: 'id',
      achievements: 'id, athleteId, isUnlocked',
    })
  }
}

let dbInstance: GymOSDatabase | null = null

export function getDatabase(): GymOSDatabase {
  if (!dbInstance) {
    dbInstance = new GymOSDatabase()
  }
  return dbInstance
}

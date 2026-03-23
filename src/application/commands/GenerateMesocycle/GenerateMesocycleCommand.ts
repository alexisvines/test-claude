// Estructura devuelta por la IA (JSON mode)
export interface MesocycleAIDay {
  name: string
  isRestDay: boolean
  exercises: Array<{
    exerciseId: string
    sets: number
    repRangeMin: number
    repRangeMax: number
    rirTarget: number
    restSeconds: number
    progressionMethod: string
  }>
}

export interface MesocycleAIResponse {
  name: string
  weeks: number
  days: MesocycleAIDay[]
}

export type MesocycleGoal = 'strength' | 'hypertrophy' | 'strength-hypertrophy'
export type MesocycleEquipment = 'barbell' | 'dumbbell' | 'machines' | 'bodyweight'
export type MesocycleLevel = 'beginner' | 'intermediate' | 'advanced'

export interface CurrentPRs {
  squat?: number
  bench?: number
  deadlift?: number
}

export interface GenerateMesocycleCommand {
  goal: MesocycleGoal
  equipment: MesocycleEquipment[]
  daysPerWeek: 3 | 4 | 5 | 6
  level: MesocycleLevel
  currentPRs?: CurrentPRs
  athleteId: string
}

// Resultado devuelto al componente para previsualizar antes de guardar
export interface MesocycleDayPreview {
  name: string
  isRestDay: boolean
  exercises: Array<{
    exerciseId: string
    sets: number
    repRangeMin: number
    repRangeMax: number
    rirTarget: number
    restSeconds: number
    progressionMethod: string
  }>
}

export interface GenerateMesocycleResult {
  routineId: string
  name: string
  weeks: number
  days: MesocycleDayPreview[]
}

export interface WorkoutContext {
  sessionId: string
  athleteName: string
  durationMinutes: number
  exercises: Array<{
    exerciseId: string
    exerciseName: string
    sets: Array<{
      weight: number
      reps: number
      rir: number
      rpe: number
    }>
  }>
  weeklyVolumeTrend: Record<string, number>
  totalPRsToday: number
  previousSessions: number
}

export interface AIWorkoutEvaluation {
  score: number
  scoreExplanation: string
  praises: string[]
  improvements: string[]
  nextSession: string
  recoveryAdvice: string
  weeklyPattern: string
}

export interface IAIEvaluationPort {
  evaluateWorkout(context: WorkoutContext): Promise<AIWorkoutEvaluation>
  chat(messages: Array<{ role: 'user' | 'assistant'; content: string }>, workoutContext?: WorkoutContext): Promise<string>
}

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { castDraft } from 'immer'
import type { WorkoutSession } from '@/domain/entities/WorkoutSession'
import type { Exercise } from '@/domain/entities/Exercise'

export interface ActiveExercise {
  exercise: Exercise
  targetSets: number
  targetRepRange: { min: number; max: number }
  targetRIR: number
  restSeconds: number
  loggedSets: LoggedSet[]
}

export interface LoggedSet {
  setNumber: number
  weight: number
  reps: number
  rir: number
  rpe: number
  notes?: string
  isPersonalRecord?: boolean
  completedAt: string
}

interface ActiveWorkoutState {
  sessionId: string | null
  session: WorkoutSession | null
  exercises: ActiveExercise[]
  currentExerciseIndex: number
  isResting: boolean
  restSeconds: number
  startedAt: Date | null
  newPRExercise: string | null

  setSession: (sessionId: string, session: WorkoutSession) => void
  setExercises: (exercises: ActiveExercise[]) => void
  addExercise: (exercise: ActiveExercise) => void
  addLoggedSet: (exerciseIndex: number, set: LoggedSet) => void
  removeLastSet: (exerciseIndex: number) => void
  setCurrentExercise: (index: number) => void
  startRest: (seconds: number) => void
  stopRest: () => void
  setNewPR: (exerciseName: string | null) => void
  reset: () => void
}

export const useActiveWorkoutStore = create<ActiveWorkoutState>()(
  immer((set) => ({
    sessionId: null,
    session: null,
    exercises: [],
    currentExerciseIndex: 0,
    isResting: false,
    restSeconds: 0,
    startedAt: null,
    newPRExercise: null,

    setSession: (sessionId, session) =>
      set(state => {
        state.sessionId = sessionId
        state.session = castDraft(session)
        state.startedAt = new Date()
      }),

    setExercises: (exercises) =>
      set(state => { state.exercises = exercises }),

    addExercise: (exercise) =>
      set(state => { state.exercises.push(exercise) }),

    addLoggedSet: (exerciseIndex, loggedSet) =>
      set(state => {
        const exercise = state.exercises[exerciseIndex]
        if (exercise) exercise.loggedSets.push(loggedSet)
      }),

    removeLastSet: (exerciseIndex) =>
      set(state => {
        const exercise = state.exercises[exerciseIndex]
        if (exercise) exercise.loggedSets.pop()
      }),

    setCurrentExercise: (index) =>
      set(state => { state.currentExerciseIndex = index }),

    startRest: (seconds) =>
      set(state => {
        state.isResting = true
        state.restSeconds = seconds
      }),

    stopRest: () =>
      set(state => {
        state.isResting = false
        state.restSeconds = 0
      }),

    setNewPR: (exerciseName) =>
      set(state => { state.newPRExercise = exerciseName }),

    reset: () =>
      set(state => {
        state.sessionId = null
        state.session = null
        state.exercises = []
        state.currentExerciseIndex = 0
        state.isResting = false
        state.restSeconds = 0
        state.startedAt = null
        state.newPRExercise = null
      }),
  }))
)

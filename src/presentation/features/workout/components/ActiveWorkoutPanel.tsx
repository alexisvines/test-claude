import { useState, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'motion/react'
import { getContainer } from '@/infrastructure/container/DIContainer'
import { Weight } from '@/domain/value-objects/Weight'
import { RIR } from '@/domain/value-objects/RIR'
import { RPE } from '@/domain/value-objects/RPE'
import { useActiveWorkoutStore } from '../stores/activeWorkout.store'
import { SetLogger } from './SetLogger'
import { ExerciseCard } from './ExerciseCard'
import { RestTimer } from './RestTimer'
import { PRBanner } from './PRBanner'
import { useRestTimer } from '../hooks/useRestTimer'
import { useWakeLock } from '../hooks/useWakeLock'
import { Button } from '@/presentation/design-system/components/Button'
import { formatDuration } from '@/shared/utils/formatters'
import { cn } from '@/shared/utils/cn'
import { useMutation } from '@tanstack/react-query'

export function ActiveWorkoutPanel() {
  const navigate = useNavigate()
  const store = useActiveWorkoutStore()
  const timer = useRestTimer()
  useWakeLock(true)

  const [showLogger, setShowLogger] = useState(false)
  const [view, setView] = useState<'exercises' | 'rest'>('exercises')

  const currentExercise = store.exercises[store.currentExerciseIndex]

  const container = getContainer()

  const recordSetMutation = useMutation({
    mutationFn: async (setData: { weight: number; reps: number; rir: number; rpe: number; notes?: string }) => {
      if (!store.sessionId || !currentExercise) return null

      const loggedSet = {
        setNumber: currentExercise.loggedSets.length + 1,
        weight: setData.weight,
        reps: setData.reps,
        rir: setData.rir,
        rpe: setData.rpe,
        notes: setData.notes,
        completedAt: new Date().toISOString(),
      }

      const result = await container.recordSetHandler.handle({
        sessionId: store.sessionId,
        exerciseId: currentExercise.exercise.id,
        exerciseName: currentExercise.exercise.nameEs,
        setNumber: loggedSet.setNumber,
        weight: Weight.fromKg(setData.weight),
        reps: setData.reps,
        rir: RIR.create(setData.rir),
        rpe: setData.rpe >= 6 ? RPE.create(setData.rpe) : RPE.none(),
        notes: setData.notes,
      })

      store.addLoggedSet(store.currentExerciseIndex, loggedSet)
      if (result.isPersonalRecord) {
        store.setNewPR(currentExercise.exercise.nameEs)
      }

      return result
    },
    onSuccess: () => {
      setShowLogger(false)
      // Auto-start rest timer
      const restSeconds = currentExercise?.restSeconds ?? 120
      timer.start(restSeconds)
      setView('rest')
    },
  })

  const completeWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (!store.sessionId) return null
      return container.completeWorkoutHandler.handle({ sessionId: store.sessionId })
    },
    onSuccess: (result) => {
      store.reset()
      void navigate({ to: '/' })
      if (result?.newAchievements && result.newAchievements.length > 0) {
        // Achievements shown via event bus in production
      }
    },
  })

  const handleLogSet = useCallback((setData: Omit<import('../stores/activeWorkout.store').LoggedSet, 'completedAt'>) => {
    recordSetMutation.mutate({
      weight: setData.weight,
      reps: setData.reps,
      rir: setData.rir,
      rpe: setData.rpe,
      notes: setData.notes,
    })
  }, [recordSetMutation])

  if (!store.sessionId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[var(--color-text-secondary)]">
        <p>No hay entrenamiento activo</p>
      </div>
    )
  }

  const elapsed = store.startedAt
    ? Math.round((Date.now() - store.startedAt.getTime()) / 60000)
    : 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
        <div>
          <p className="text-xs text-[var(--color-text-secondary)]">Entrenamiento activo</p>
          <h2 className="font-display text-xl font-bold text-[var(--color-text-primary)]">
            {store.session?.routineName ?? 'Entrenamiento libre'}
          </h2>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-bold text-[var(--color-accent)]">
            {formatDuration(elapsed)}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {store.exercises.reduce((acc, ex) => acc + ex.loggedSets.length, 0)} series
          </p>
        </div>
      </div>

      {/* View tabs */}
      <div className="flex border-b border-[var(--color-border)]">
        {(['exercises', 'rest'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              'flex-1 py-3 text-sm font-semibold transition-colors',
              view === v
                ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]'
                : 'text-[var(--color-text-secondary)]'
            )}
          >
            {v === 'exercises' ? 'Ejercicios' : `Descanso ${timer.isRunning ? `(${timer.secondsLeft}s)` : ''}`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
        {view === 'rest' ? (
          <div className="flex flex-col items-center gap-6 pt-4">
            <RestTimer timer={timer} />
            <Button
              variant="secondary"
              onClick={() => setView('exercises')}
            >
              Ver ejercicios
            </Button>
          </div>
        ) : (
          <>
            {store.exercises.map((ex, i) => (
              <ExerciseCard
                key={ex.exercise.id}
                exercise={ex.exercise}
                setCount={ex.loggedSets.length}
                targetSets={ex.targetSets}
                isActive={i === store.currentExerciseIndex}
                onClick={() => {
                  store.setCurrentExercise(i)
                  setShowLogger(true)
                  setView('exercises')
                }}
              />
            ))}

            {store.exercises.length === 0 && (
              <div className="text-center py-8 text-[var(--color-text-secondary)]">
                <p className="text-4xl mb-3">🏋️</p>
                <p>No hay ejercicios. Añade uno para empezar.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Set Logger Sheet */}
      <AnimatePresence>
        {showLogger && currentExercise && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-40 bg-[var(--color-surface-01)] rounded-t-[var(--radius-xl)] shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-[var(--color-surface-01)] p-4 flex justify-between items-center border-b border-[var(--color-border)]">
              <div className="w-12 h-1 rounded-full bg-[var(--color-border)] mx-auto" />
            </div>
            <div className="p-4">
              <SetLogger
                exerciseName={currentExercise.exercise.nameEs}
                setNumber={currentExercise.loggedSets.length + 1}
                suggestedWeight={currentExercise.loggedSets[currentExercise.loggedSets.length - 1]?.weight ?? 0}
                suggestedReps={currentExercise.targetRepRange.min}
                onLog={handleLogSet}
                onCancel={() => setShowLogger(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-[var(--color-base)] border-t border-[var(--color-border)] safe-bottom flex gap-3">
        {currentExercise && !showLogger && (
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={() => setShowLogger(true)}
          >
            + Serie — {currentExercise.exercise.nameEs}
          </Button>
        )}
        <Button
          variant="danger"
          size="lg"
          onClick={() => {
            if (confirm('¿Finalizar el entrenamiento?')) {
              completeWorkoutMutation.mutate()
            }
          }}
          loading={completeWorkoutMutation.isPending}
          className={showLogger ? 'flex-1' : 'w-14'}
        >
          {showLogger ? 'Finalizar' : '✓'}
        </Button>
      </div>

      {/* PR Banner */}
      <PRBanner
        exerciseName={store.newPRExercise}
        onDismiss={() => store.setNewPR(null)}
      />
    </div>
  )
}

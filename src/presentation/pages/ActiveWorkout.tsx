import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getContainer } from '@/infrastructure/container/DIContainer'
import { useActiveWorkoutStore } from '@/presentation/features/workout/stores/activeWorkout.store'
import { ActiveWorkoutPanel } from '@/presentation/features/workout/components/ActiveWorkoutPanel'
import { Button } from '@/presentation/design-system/components/Button'
import type { Exercise } from '@/domain/entities/Exercise'
import { MUSCLE_GROUP_LABELS } from '@/domain/value-objects/MuscleGroup'
import { useDebounce } from '@/shared/hooks/useDebounce'

function ExercisePicker({ onSelect }: { onSelect: (exercise: Exercise) => void }) {
  const container = getContainer()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises', 'picker', debouncedSearch],
    queryFn: () => container.exerciseRepo.findAll({ search: debouncedSearch || undefined }),
  })

  return (
    <div className="space-y-3">
      <input
        type="search"
        placeholder="Buscar ejercicio..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-[var(--color-surface-03)] rounded-[var(--radius-md)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] border border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none transition-colors"
        autoFocus
      />
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {exercises.slice(0, 20).map(ex => (
          <button
            key={ex.id}
            onClick={() => onSelect(ex)}
            className="w-full text-left p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-02)] hover:bg-[var(--color-surface-03)] transition-colors"
          >
            <p className="font-semibold text-sm text-[var(--color-text-primary)]">{ex.nameEs}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {ex.primaryMuscles.map(m => MUSCLE_GROUP_LABELS[m]).join(', ')}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

export function ActiveWorkoutPage() {
  const navigate = useNavigate()
  const store = useActiveWorkoutStore()
  const container = getContainer()
  const [showPicker, setShowPicker] = useState(false)

  const { data: athlete } = useQuery({
    queryKey: ['athlete'],
    queryFn: () => container.athleteRepo.getDefault(),
  })

  const startWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (!athlete) throw new Error('No athlete found')
      return container.startWorkoutHandler.handle({ athleteId: athlete.id })
    },
    onSuccess: (result) => {
      store.setSession(result.sessionId, {
        id: result.sessionId,
        athleteId: athlete!.id,
        routineName: result.routineName,
        startedAt: new Date(),
        sets: [],
        status: 'active',
      } as unknown as import('@/domain/entities/WorkoutSession').WorkoutSession)
    },
  })

  useEffect(() => {
    if (!store.sessionId && athlete && !startWorkoutMutation.isPending) {
      startWorkoutMutation.mutate()
    }
  }, [athlete])

  function handleAddExercise(exercise: Exercise) {
    store.addExercise({
      exercise,
      targetSets: 3,
      targetRepRange: { min: 8, max: 12 },
      targetRIR: 2,
      restSeconds: 120,
      loggedSets: [],
    })
    setShowPicker(false)
  }

  if (startWorkoutMutation.isPending || !store.sessionId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="w-10 h-10 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
        <p className="text-[var(--color-text-secondary)]">Iniciando entrenamiento...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <button
          onClick={() => void navigate({ to: '/dashboard' })}
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors p-2 -ml-2"
          aria-label="Volver al inicio"
        >
          ← Inicio
        </button>
        <Button
          variant="accent"
          size="sm"
          onClick={() => setShowPicker(!showPicker)}
        >
          + Ejercicio
        </Button>
      </div>

      {/* Exercise Picker */}
      {showPicker && (
        <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-01)]">
          <ExercisePicker onSelect={handleAddExercise} />
        </div>
      )}

      {/* Main Panel */}
      <div className="flex-1 overflow-hidden">
        <ActiveWorkoutPanel />
      </div>
    </div>
  )
}

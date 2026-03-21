import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
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

// ─── Countdown overlay 3-2-1-¡VAMOS! ─────────────────────────────────────────
const COUNTDOWN_STEPS = ['3', '2', '1', '¡VAMOS!']

function CountdownOverlay({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (step >= COUNTDOWN_STEPS.length) {
      onDone()
      return
    }
    const id = setTimeout(() => setStep(s => s + 1), step === COUNTDOWN_STEPS.length - 1 ? 800 : 1000)
    return () => clearTimeout(id)
  }, [step, onDone])

  const label = COUNTDOWN_STEPS[step] ?? ''
  const isVamos = step === COUNTDOWN_STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="text-center"
        >
          <p
            className="font-display font-black leading-none select-none"
            style={{
              fontSize: isVamos ? '3.5rem' : '8rem',
              color: isVamos ? 'var(--color-accent)' : 'white',
              textShadow: isVamos ? '0 0 40px var(--color-accent)' : '0 0 30px rgba(255,255,255,0.4)',
            }}
          >
            {label}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ─── Pantalla de confirmación (idle) ─────────────────────────────────────────
function IdleScreen({
  routineName,
  onStart,
  onBack,
}: {
  routineName?: string
  onStart: () => void
  onBack: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center h-screen px-6 gap-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <p className="text-6xl">💪</p>
        <h1 className="font-display text-4xl font-black text-[var(--color-text-primary)]">
          ¿Listo para<br />entrenar?
        </h1>
        {routineName && (
          <p className="text-[var(--color-accent)] font-semibold">{routineName}</p>
        )}
        {!routineName && (
          <p className="text-[var(--color-text-secondary)] text-sm">Entrenamiento libre</p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="w-full max-w-xs space-y-3"
      >
        <button
          onClick={onStart}
          className="w-full py-5 rounded-2xl text-xl font-black text-black active:scale-95 transition-transform"
          style={{ backgroundColor: 'var(--color-accent)', boxShadow: 'var(--shadow-accent)' }}
        >
          ¡Empezar entrenamiento!
        </button>
        <button
          onClick={onBack}
          className="w-full py-3 rounded-2xl text-sm font-semibold text-[var(--color-text-secondary)] bg-[var(--color-surface-02)] active:scale-95 transition-transform"
        >
          ← Volver al inicio
        </button>
      </motion.div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
type PageState = 'idle' | 'countdown' | 'active'

export function ActiveWorkoutPage() {
  const navigate = useNavigate()
  const store = useActiveWorkoutStore()
  const container = getContainer()
  const [showPicker, setShowPicker] = useState(false)

  // Si ya hay sesión activa (restaurada del localStorage), ir directo al panel
  const [pageState, setPageState] = useState<PageState>(
    store.sessionId ? 'active' : 'idle'
  )

  const { data: athlete } = useQuery({
    queryKey: ['athlete'],
    queryFn: () => container.athleteRepo.getDefault(),
  })

  const { data: activeRoutine } = useQuery({
    queryKey: ['routine', athlete?.activeRoutineId],
    queryFn: () => athlete?.activeRoutineId
      ? container.routineRepo.findById(athlete.activeRoutineId)
      : null,
    enabled: !!athlete?.activeRoutineId,
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

  // Cuando el usuario confirma: lanzar sesión en background y mostrar countdown
  function handleConfirmStart() {
    startWorkoutMutation.mutate()
    setPageState('countdown')
  }

  // Al terminar el countdown, ir al panel (la sesión ya debería estar lista)
  const handleCountdownDone = useCallback(() => {
    setPageState('active')
  }, [])

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

  // ── Pantalla de confirmación ──────────────────────────────────────────────
  if (pageState === 'idle') {
    return (
      <IdleScreen
        routineName={activeRoutine?.name}
        onStart={handleConfirmStart}
        onBack={() => void navigate({ to: '/dashboard' })}
      />
    )
  }

  // ── Countdown ─────────────────────────────────────────────────────────────
  if (pageState === 'countdown') {
    return (
      <>
        {/* Fondo con el panel montándose detrás */}
        <div className="flex flex-col items-center justify-center h-screen gap-4">
          <div className="w-10 h-10 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
        </div>
        <CountdownOverlay onDone={handleCountdownDone} />
      </>
    )
  }

  // ── Entrenamiento activo ──────────────────────────────────────────────────
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

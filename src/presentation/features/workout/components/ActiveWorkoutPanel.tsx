import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'motion/react'
import { getContainer } from '@/infrastructure/container/DIContainer'
import { Weight } from '@/domain/value-objects/Weight'
import { RIR } from '@/domain/value-objects/RIR'
import { RPE } from '@/domain/value-objects/RPE'
import { useActiveWorkoutStore, type LoggedSet, type ActiveExercise } from '../stores/activeWorkout.store'
import { PRBanner } from './PRBanner'
import { useRestTimer } from '../hooks/useRestTimer'
import { useWakeLock } from '../hooks/useWakeLock'
import { formatDuration } from '@/shared/utils/formatters'
import { cn } from '@/shared/utils/cn'
import { useMutation } from '@tanstack/react-query'
import type { WorkoutSession } from '@/domain/entities/WorkoutSession'
import { MUSCLE_GROUP_LABELS } from '@/domain/value-objects/MuscleGroup'
import {
  Dumbbell, Target, Layers, Maximize2, Triangle, Grip,
  Zap, Footprints, Circle, Mountain, type LucideIcon,
} from 'lucide-react'

// ─── Motivational quotes ──────────────────────────────────────────────────────
const QUOTES = [
  { text: 'Fall seven times, stand up eight.', author: '日本語・Proverbio japonés' },
  { text: 'La disciplina es el puente entre metas y logros.', author: 'Jim Rohn' },
  { text: 'Kaizen — 改善: Mejorar cada día, aunque sea 1%.', author: 'Filosofía japonesa' },
  { text: 'The warrior who trains daily fears no battle.', author: 'Proverbio nórdico' },
  { text: 'El cuerpo logra lo que la mente cree.', author: 'Napoleon Hill' },
  { text: 'Pain is temporary. Glory is forever.', author: 'Arnold Schwarzenegger' },
  { text: 'Suffer now and live the rest of your life as a champion.', author: 'Muhammad Ali' },
  { text: 'En el hierro forjamos el carácter.', author: 'Séneca' },
  { text: 'Mushin — 無心: Mente vacía, acción pura.', author: 'Filosofía japonesa' },
  { text: 'Champions are made in the moments they want to quit.', author: 'Anónimo' },
  { text: 'Ganamos o aprendemos. Nunca perdemos.', author: 'Nelson Mandela' },
  { text: 'Do not pray for an easy life; pray for the strength to endure a difficult one.', author: 'Bruce Lee' },
  { text: 'Hvílast er froðleikr — El descanso es sabiduría.', author: 'Antiguo nórdico' },
  { text: 'Nana korobi ya oki — Cae siete, levántate ocho.', author: 'Proverbio japonés' },
  { text: 'El hierro nunca miente.', author: 'Henry Rollins' },
  { text: 'Iron never lies.', author: 'Henry Rollins' },
  { text: 'La victoria pertenece al más perseverante.', author: 'Napoleón Bonaparte' },
  { text: 'Frems þær er framast kemr — El que avanza llega más lejos.', author: 'Saga nórdica' },
]

function randomQuote() { return QUOTES[Math.floor(Math.random() * QUOTES.length)]! }

// ─── Persistence ──────────────────────────────────────────────────────────────
const STORAGE_KEY = 'kova-workout-v3'

interface PersistedWorkout {
  sessionId: string
  athleteId: string
  routineName?: string
  startedAt: string
  currentExerciseIndex: number
  exercises: {
    exerciseId: string
    targetSets: number
    targetRepRange: { min: number; max: number }
    targetRIR: number
    restSeconds: number
    loggedSets: LoggedSet[]
  }[]
}

interface StoreSnapshot {
  sessionId: string | null
  session: WorkoutSession | null
  exercises: ActiveExercise[]
  currentExerciseIndex: number
  startedAt: Date | null
}

function saveWorkoutToStorage(snap: StoreSnapshot): void {
  if (!snap.sessionId) { localStorage.removeItem(STORAGE_KEY); return }
  const session = snap.session as unknown as Record<string, unknown>
  const data: PersistedWorkout = {
    sessionId: snap.sessionId,
    athleteId: String(session?.['athleteId'] ?? ''),
    routineName: String(session?.['routineName'] ?? ''),
    startedAt: snap.startedAt?.toISOString() ?? new Date().toISOString(),
    currentExerciseIndex: snap.currentExerciseIndex,
    exercises: snap.exercises.map(ex => ({
      exerciseId: ex.exercise.id,
      targetSets: ex.targetSets,
      targetRepRange: ex.targetRepRange,
      targetRIR: ex.targetRIR,
      restSeconds: ex.restSeconds,
      loggedSets: ex.loggedSets,
    })),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function loadWorkoutFromStorage(): PersistedWorkout | null {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as PersistedWorkout | null }
  catch { return null }
}

// ─── Muscle icons ─────────────────────────────────────────────────────────────
const MUSCLE_ICONS: Record<string, LucideIcon> = {
  chest: Dumbbell, back: Layers, lats: Maximize2, shoulders: Triangle,
  biceps: Dumbbell, triceps: Dumbbell, forearms: Grip, quadriceps: Zap,
  hamstrings: Footprints, glutes: Circle, calves: Footprints, core: Target, traps: Mountain,
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RestTimerBanner({ timer, onSkip }: {
  timer: ReturnType<typeof useRestTimer>
  onSkip: () => void
}) {
  if (!timer.isRunning && timer.secondsLeft === 0) return null
  const pct = timer.progress * 100

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden"
    >
      <div className="bg-[var(--color-surface-02)] border-b border-[var(--color-border)] px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--color-text-muted)] shrink-0">⏱ Descanso</span>
          <div className="flex-1 h-1.5 bg-[var(--color-surface-03)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${100 - pct}%`,
                backgroundColor: timer.secondsLeft <= 10 ? '#FF3B30' : 'var(--color-accent)',
              }}
            />
          </div>
          <span
            className={cn('font-mono text-lg font-bold shrink-0 w-12 text-center', timer.secondsLeft <= 10 && 'text-red-400')}
          >
            {String(Math.floor(timer.secondsLeft / 60)).padStart(2, '0')}:{String(timer.secondsLeft % 60).padStart(2, '0')}
          </span>
          <button
            onClick={() => timer.add(15)}
            className="text-xs px-2 py-1 rounded-lg bg-[var(--color-surface-03)] text-[var(--color-text-secondary)] shrink-0"
          >+15</button>
          <button
            onClick={onSkip}
            className="text-xs px-2 py-1 rounded-lg text-black font-bold shrink-0"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >✓ Listo</button>
        </div>
      </div>
    </motion.div>
  )
}

function QuoteToast({ quote }: { quote: { text: string; author: string } | null }) {
  return (
    <AnimatePresence>
      {quote && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mx-4 mt-2 px-3 py-2 rounded-xl bg-[var(--color-surface-02)] border border-[var(--color-border)]"
        >
          <p className="text-xs text-[var(--color-text-secondary)] italic">"{quote.text}"</p>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">— {quote.author}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function SetRow({ set, index }: { set: LoggedSet; index: number }) {
  return (
    <div className={cn('grid grid-cols-[32px_1fr_1fr_auto] gap-2 items-center px-3 py-1.5 text-sm', index % 2 === 0 ? 'bg-[var(--color-surface-03)]/50' : '')}>
      <span className="font-mono text-[var(--color-text-muted)] text-xs text-center">{set.setNumber}</span>
      <span className="font-mono font-semibold text-[var(--color-text-primary)] text-center">{set.weight > 0 ? set.weight : '—'}</span>
      <span className="font-mono font-semibold text-[var(--color-text-primary)] text-center">{set.reps}</span>
      <div className="flex items-center gap-1 justify-end">
        {set.isPersonalRecord && (
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">🏆 PR</span>
        )}
        <span className="text-[var(--color-success)] text-base">✓</span>
      </div>
    </div>
  )
}

function ActiveSetInput({
  setNumber,
  lastSet,
  targetRepRange,
  onLog,
  onCancel,
  isPending,
}: {
  setNumber: number
  lastSet?: LoggedSet
  targetRepRange: { min: number; max: number }
  onLog: (weight: number, reps: number, rir: number) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [weight, setWeight] = useState(lastSet?.weight ?? 0)
  const [reps, setReps] = useState(lastSet?.reps ?? targetRepRange.min)
  const [rir, setRir] = useState(lastSet?.rir ?? 2)

  const RIR_COLORS = ['#FF2D55', '#FF6B35', '#34C759', '#30D158', '#0A84FF', '#5856D6']

  function vibrate(ms: number) { if ('vibrate' in navigator) navigator.vibrate(ms) }

  return (
    <div className="px-3 pb-3 pt-2 space-y-2 bg-[var(--color-accent-dim)]/20 rounded-b-xl border-t border-[var(--color-border)]">
      {/* Labels row */}
      <div className="grid grid-cols-[28px_1fr_1fr_44px] gap-2">
        <span />
        <span className="text-[10px] text-[var(--color-text-muted)] text-center font-semibold uppercase tracking-wide">Peso (kg)</span>
        <span className="text-[10px] text-[var(--color-text-muted)] text-center font-semibold uppercase tracking-wide">Reps</span>
        <span />
      </div>

      {/* Main row: SET# | KG | REPS | ✓ */}
      <div className="grid grid-cols-[28px_1fr_1fr_44px] gap-2 items-center">
        <span className="font-mono text-[var(--color-accent)] text-xs font-bold text-center">{setNumber}</span>

        {/* Weight input */}
        <input
          type="number"
          value={weight === 0 ? '' : weight}
          onChange={e => setWeight(parseFloat(e.target.value) || 0)}
          placeholder="0"
          className="w-full text-center font-mono font-bold text-lg bg-[var(--color-surface-03)] rounded-xl py-2 text-[var(--color-text-primary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none"
          inputMode="decimal"
        />

        {/* Reps stepper */}
        <div className="flex items-center gap-0.5">
          <button onClick={() => { vibrate(20); setReps(r => Math.max(1, r - 1)) }}
            className="w-8 h-10 rounded-l-xl bg-[var(--color-surface-03)] text-[var(--color-text-secondary)] font-bold text-base border border-[var(--color-border)] flex items-center justify-center shrink-0">−</button>
          <span className="flex-1 text-center bg-[var(--color-surface-03)] h-10 flex flex-col items-center justify-center border-y border-[var(--color-border)]">
            <span className="font-mono font-bold text-base text-[var(--color-text-primary)] leading-none">{reps}</span>
            <span className="text-[9px] text-[var(--color-text-muted)] leading-none mt-0.5">reps</span>
          </span>
          <button onClick={() => { vibrate(20); setReps(r => Math.min(100, r + 1)) }}
            className="w-8 h-10 rounded-r-xl bg-[var(--color-surface-03)] text-[var(--color-accent)] font-bold text-base border border-[var(--color-border)] flex items-center justify-center shrink-0">+</button>
        </div>

        {/* Confirm */}
        <button
          onClick={() => { vibrate(50); onLog(weight, reps, rir) }}
          disabled={isPending}
          className="w-11 h-10 rounded-xl text-black font-black text-lg flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50 shrink-0"
          style={{ backgroundColor: 'var(--color-accent)' }}
        >
          {isPending ? <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : '✓'}
        </button>
      </div>

      {/* Weight quick-adjust row */}
      <div className="flex gap-1 items-center">
        <span className="text-[10px] text-[var(--color-text-muted)] shrink-0 w-7 text-center">kg</span>
        {[-5, -2.5, +2.5, +5].map(v => (
          <button key={v} onClick={() => { vibrate(15); setWeight(w => Math.max(0, Math.round((w + v) * 10) / 10)) }}
            className="flex-1 py-1 rounded-lg bg-[var(--color-surface-03)] text-[10px] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] border border-[var(--color-border)]">
            {v > 0 ? `+${v}` : v}
          </button>
        ))}
      </div>

      {/* RIR compact row */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-[var(--color-text-muted)] shrink-0 w-7 text-center">RIR</span>
        <div className="flex gap-1 flex-1">
          {[0, 1, 2, 3, 4, 5].map((r, i) => (
            <button
              key={r}
              onClick={() => { vibrate(20); setRir(r) }}
              className={cn('flex-1 h-7 rounded text-[10px] font-bold transition-all', rir === r ? 'text-black scale-105' : 'text-[var(--color-text-muted)] bg-[var(--color-surface-03)]')}
              style={rir === r ? { backgroundColor: RIR_COLORS[i] } : {}}
            >
              {r}
            </button>
          ))}
        </div>
        <button onClick={onCancel} className="text-[10px] text-[var(--color-text-muted)] hover:text-red-400 px-1 shrink-0">✕</button>
      </div>
    </div>
  )
}

function ExerciseBlock({
  ex,
  isActive,
  onAddSet,
  onLog,
  isPending,
  activeExerciseId,
}: {
  ex: ActiveExercise
  isActive: boolean
  onAddSet: () => void
  onLog: (weight: number, reps: number, rir: number) => void
  isPending: boolean
  activeExerciseId: string | null
}) {
  const isLogging = activeExerciseId === ex.exercise.id
  const isComplete = ex.loggedSets.length >= ex.targetSets
  const Icon = MUSCLE_ICONS[ex.exercise.primaryMuscles[0] ?? ''] ?? Dumbbell
  const lastSet = ex.loggedSets[ex.loggedSets.length - 1]
  const [showInstructions, setShowInstructions] = useState(false)

  return (
    <div className={cn('rounded-2xl border overflow-hidden transition-all', isActive ? 'border-[var(--color-accent)]' : 'border-[var(--color-border)]', isComplete && !isLogging ? 'opacity-70' : '')}>
      {/* Exercise header — tap para ver instrucciones */}
      <button
        onClick={() => setShowInstructions(p => !p)}
        className="w-full p-3 flex items-center gap-3 bg-[var(--color-surface-02)] text-left"
      >
        <div className={cn('w-9 h-9 flex items-center justify-center rounded-xl text-[var(--color-text-secondary)] shrink-0', isActive ? 'bg-[var(--color-accent-dim)]' : 'bg-[var(--color-surface-03)]')}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-[var(--color-text-primary)] leading-tight">{ex.exercise.nameEs}</p>
          <p className="text-[11px] text-[var(--color-text-muted)]">
            {ex.exercise.primaryMuscles.map(m => MUSCLE_GROUP_LABELS[m]).join(', ')}
            {' · '}{ex.targetRepRange.min}–{ex.targetRepRange.max} reps · RIR {ex.targetRIR}
            {' · '}<span className="text-[var(--color-accent)]">{showInstructions ? '▲' : '▼ info'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn('font-mono font-bold text-sm', isComplete ? 'text-[var(--color-success)]' : 'text-[var(--color-text-primary)]')}>
            {ex.loggedSets.length}/{ex.targetSets}
          </span>
          {isComplete && <span className="text-[var(--color-success)] text-base">✓</span>}
        </div>
      </button>

      {/* Set table header */}
      {ex.loggedSets.length > 0 && (
        <div className="grid grid-cols-[32px_1fr_1fr_auto] gap-2 px-3 py-1 border-t border-[var(--color-border)]">
          <span className="text-[10px] text-[var(--color-text-muted)] text-center font-semibold">SERIE</span>
          <span className="text-[10px] text-[var(--color-text-muted)] text-center font-semibold">KG</span>
          <span className="text-[10px] text-[var(--color-text-muted)] text-center font-semibold">REPS</span>
          <span className="text-[10px] text-[var(--color-text-muted)] text-right font-semibold pr-2">RES</span>
        </div>
      )}

      {/* Completed set rows */}
      {ex.loggedSets.map((s, i) => <SetRow key={s.setNumber} set={s} index={i} />)}

      {/* Active input row */}
      {isLogging ? (
        <ActiveSetInput
          setNumber={ex.loggedSets.length + 1}
          lastSet={lastSet}
          targetRepRange={ex.targetRepRange}
          onLog={onLog}
          onCancel={onAddSet}
          isPending={isPending}
        />
      ) : (
        <div className="px-3 py-2 border-t border-[var(--color-border)]">
          <button
            onClick={onAddSet}
            className="w-full py-2 rounded-xl text-xs font-bold border border-dashed border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
          >
            + Serie {ex.loggedSets.length + 1}
          </button>
        </div>
      )}

      {/* Collapsible instructions */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-[var(--color-border)] bg-[var(--color-surface-01)]">
              <p className="text-[10px] uppercase tracking-wide font-bold text-[var(--color-text-muted)] pt-2">Instrucciones</p>
              <ol className="space-y-1">
                {ex.exercise.instructions.map((step, i) => (
                  <li key={i} className="text-xs text-[var(--color-text-secondary)] flex gap-2">
                    <span className="text-[var(--color-accent)] font-mono font-bold shrink-0">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
              {ex.exercise.tips.length > 0 && (
                <div className="space-y-1 pt-1">
                  <p className="text-[10px] uppercase tracking-wide font-bold text-[var(--color-text-muted)]">Tips</p>
                  {ex.exercise.tips.map((tip, i) => (
                    <p key={i} className="text-xs text-[var(--color-text-secondary)] flex gap-2">
                      <span>💡</span>{tip}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
export function ActiveWorkoutPanel() {
  const navigate = useNavigate()
  const store = useActiveWorkoutStore()
  const timer = useRestTimer()
  useWakeLock(true)

  const container = getContainer()

  // Which exercise has the active input row open
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null)
  // Quote toast state
  const [currentQuote, setCurrentQuote] = useState<{ text: string; author: string } | null>(null)
  const quoteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Set completion flash
  const [setFlash, setSetFlash] = useState<string | null>(null)

  // ── Persistence: save on every change ──────────────────────────────────────
  useEffect(() => {
    saveWorkoutToStorage({
      sessionId: store.sessionId,
      session: store.session,
      exercises: store.exercises,
      currentExerciseIndex: store.currentExerciseIndex,
      startedAt: store.startedAt,
    })
  }, [store.sessionId, store.exercises, store.currentExerciseIndex])

  // ── Persistence: restore on mount ──────────────────────────────────────────
  useEffect(() => {
    if (store.sessionId) return // Already have active session
    const persisted = loadWorkoutFromStorage()
    if (!persisted) return

    async function restore() {
      if (!persisted) return
      // Restore session into store
      store.setSession(persisted.sessionId, {
        id: persisted.sessionId,
        athleteId: persisted.athleteId,
        routineName: persisted.routineName,
        startedAt: new Date(persisted.startedAt),
        sets: [],
        status: 'active',
      } as unknown as WorkoutSession)

      // Load full exercise entities
      const exercises: ActiveExercise[] = []
      for (const pex of persisted.exercises) {
        const exercise = await container.exerciseRepo.findById(pex.exerciseId).catch(() => null)
        if (!exercise) continue
        exercises.push({
          exercise,
          targetSets: pex.targetSets,
          targetRepRange: pex.targetRepRange,
          targetRIR: pex.targetRIR,
          restSeconds: pex.restSeconds,
          loggedSets: pex.loggedSets,
        })
      }
      store.setExercises(exercises)
      store.setCurrentExercise(persisted.currentExerciseIndex)
    }

    void restore()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Show quote for 4 seconds ──────────────────────────────────────────────
  function showQuote() {
    if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current)
    setCurrentQuote(randomQuote())
    quoteTimerRef.current = setTimeout(() => setCurrentQuote(null), 4000)
  }

  // ── Record set mutation ───────────────────────────────────────────────────
  const recordSetMutation = useMutation({
    mutationFn: async (p: { exerciseIndex: number; weight: number; reps: number; rir: number }) => {
      const ex = store.exercises[p.exerciseIndex]
      if (!store.sessionId || !ex) return null

      const result = await container.recordSetHandler.handle({
        sessionId: store.sessionId,
        exerciseId: ex.exercise.id,
        exerciseName: ex.exercise.nameEs,
        setNumber: ex.loggedSets.length + 1,
        weight: Weight.fromKg(p.weight),
        reps: p.reps,
        rir: RIR.create(p.rir),
        rpe: RPE.none(),
        notes: undefined,
      })

      const loggedSet: LoggedSet = {
        setNumber: ex.loggedSets.length + 1,
        weight: p.weight,
        reps: p.reps,
        rir: p.rir,
        rpe: 8,
        completedAt: new Date().toISOString(),
        isPersonalRecord: result.isPersonalRecord,
      }

      store.addLoggedSet(p.exerciseIndex, loggedSet)
      if (result.isPersonalRecord) store.setNewPR(ex.exercise.nameEs)

      return { result, ex: ex, set: loggedSet }
    },
    onSuccess: (data) => {
      if (!data) return
      setActiveExerciseId(null)
      // Show set completion flash
      const vol = Math.round(data.set.weight * data.set.reps)
      setSetFlash(`Serie ${data.set.setNumber} ✓  ${data.set.weight > 0 ? `${data.set.weight}kg × ${data.set.reps} = ${vol}kg vol` : `${data.set.reps} reps`}`)
      setTimeout(() => setSetFlash(null), 2500)
      // Show quote
      showQuote()
      // Start rest timer
      timer.start(data.ex.restSeconds ?? 120)
    },
  })

  const completeWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (!store.sessionId) return null
      return container.completeWorkoutHandler.handle({ sessionId: store.sessionId })
    },
    onSuccess: () => {
      localStorage.removeItem(STORAGE_KEY)
      store.reset()
      void navigate({ to: '/' })
    },
  })

  const handleLog = useCallback((exerciseIndex: number, weight: number, reps: number, rir: number) => {
    recordSetMutation.mutate({ exerciseIndex, weight, reps, rir })
  }, [recordSetMutation])

  // ── Elapsed time (re-renders every minute) ────────────────────────────────
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(id)
  }, [])
  const elapsed = store.startedAt ? Math.round((Date.now() - store.startedAt.getTime()) / 60000) : 0

  if (!store.sessionId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[var(--color-text-secondary)]">
        <p>No hay entrenamiento activo</p>
      </div>
    )
  }

  const totalSets = store.exercises.reduce((a, e) => a + e.loggedSets.length, 0)

  return (
    <div className="flex flex-col h-full">
      {/* ── Sticky header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-base)] z-10">
        <div>
          <p className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide">Entrenando</p>
          <h2 className="font-display text-lg font-bold text-[var(--color-text-primary)] leading-tight">
            {store.session?.routineName ?? 'Entrenamiento libre'}
          </h2>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-bold text-[var(--color-accent)]">{formatDuration(elapsed)}</p>
          <p className="text-[11px] text-[var(--color-text-muted)]">{totalSets} series</p>
        </div>
      </div>

      {/* ── Rest timer banner ── */}
      <AnimatePresence>
        {(timer.isRunning || timer.secondsLeft > 0) && (
          <RestTimerBanner timer={timer} onSkip={() => timer.stop()} />
        )}
      </AnimatePresence>

      {/* ── Set flash ── */}
      <AnimatePresence>
        {setFlash && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-4 mt-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--color-success)] bg-[var(--color-success)]/10 border border-[var(--color-success)]/20"
          >
            {setFlash}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Quote toast ── */}
      <QuoteToast quote={currentQuote} />

      {/* ── Scrollable exercise list ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-28">
        {store.exercises.length === 0 ? (
          <div className="text-center py-12 text-[var(--color-text-secondary)]">
            <p className="text-4xl mb-3">🏋️</p>
            <p>No hay ejercicios. Añade uno para empezar.</p>
          </div>
        ) : (
          store.exercises.map((ex, i) => (
            <ExerciseBlock
              key={ex.exercise.id}
              ex={ex}
              isActive={i === store.currentExerciseIndex}
              activeExerciseId={activeExerciseId}
              onAddSet={() => {
                store.setCurrentExercise(i)
                setActiveExerciseId(prev => prev === ex.exercise.id ? null : ex.exercise.id)
              }}
              onLog={(weight, reps, rir) => handleLog(i, weight, reps, rir)}
              isPending={recordSetMutation.isPending && store.currentExerciseIndex === i}
            />
          ))
        )}
      </div>

      {/* ── Bottom action ── */}
      <div className="fixed bottom-0 inset-x-0 px-4 py-3 bg-[var(--color-base)] border-t border-[var(--color-border)] safe-bottom">
        <button
          onClick={() => {
            if (confirm('¿Finalizar el entrenamiento?')) completeWorkoutMutation.mutate()
          }}
          disabled={completeWorkoutMutation.isPending}
          className="w-full py-3 rounded-2xl text-sm font-black text-white bg-red-600/90 hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {completeWorkoutMutation.isPending
            ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <>✓ Finalizar entrenamiento — {totalSets} series</>}
        </button>
      </div>

      {/* ── PR Banner ── */}
      <PRBanner
        exerciseName={store.newPRExercise}
        onDismiss={() => store.setNewPR(null)}
      />
    </div>
  )
}

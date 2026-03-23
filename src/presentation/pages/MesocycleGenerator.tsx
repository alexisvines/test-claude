/**
 * Generador de Mesociclos IA
 *
 * Wizard de 5 pasos que usa Gemini AI para diseñar un plan de entrenamiento
 * periodizado de 8 semanas, guardado como Routine activa al finalizar.
 */
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
import { getContainer } from '@/infrastructure/container/DIContainer'
import { GenerateMesocycleHandler } from '@/application/commands/GenerateMesocycle/GenerateMesocycleHandler'
import { GeminiAIAdapter } from '@/infrastructure/ai/GeminiAIAdapter'
import { cn } from '@/shared/utils/cn'
import type {
  MesocycleGoal,
  MesocycleEquipment,
  MesocycleLevel,
  CurrentPRs,
  GenerateMesocycleResult,
  MesocycleDayPreview,
} from '@/application/commands/GenerateMesocycle/GenerateMesocycleCommand'

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface WizardState {
  goal: MesocycleGoal | null
  equipment: MesocycleEquipment[]
  daysPerWeek: 3 | 4 | 5 | 6 | null
  level: MesocycleLevel | null
  currentPRs: CurrentPRs
}

// ── Opciones del wizard ────────────────────────────────────────────────────────

const GOALS: Array<{ value: MesocycleGoal; label: string; description: string; emoji: string }> = [
  { value: 'strength', label: 'Fuerza máxima', description: 'Bajas repeticiones, pesos altos, énfasis en los 3 básicos', emoji: '🏋️' },
  { value: 'hypertrophy', label: 'Hipertrofia', description: 'Volumen moderado, rangos medios para maximizar músculo', emoji: '💪' },
  { value: 'strength-hypertrophy', label: 'Fuerza + músculo', description: 'Lo mejor de ambos mundos — Powerbuilding', emoji: '⚡' },
]

const EQUIPMENT: Array<{ value: MesocycleEquipment; label: string; emoji: string }> = [
  { value: 'barbell', label: 'Barra + discos', emoji: '🏋️' },
  { value: 'dumbbell', label: 'Mancuernas', emoji: '💪' },
  { value: 'machines', label: 'Máquinas', emoji: '⚙️' },
  { value: 'bodyweight', label: 'Peso corporal', emoji: '🤸' },
]

const DAYS: Array<{ value: 3 | 4 | 5 | 6; label: string; description: string }> = [
  { value: 3, label: '3 días', description: 'Full Body · ideal para principiantes' },
  { value: 4, label: '4 días', description: 'Upper/Lower · equilibrio perfecto' },
  { value: 5, label: '5 días', description: 'Push/Pull/Legs + variación' },
  { value: 6, label: '6 días', description: 'Alta frecuencia · atletas avanzados' },
]

const LEVELS: Array<{ value: MesocycleLevel; label: string; description: string; emoji: string }> = [
  { value: 'beginner', label: 'Principiante', description: 'Menos de 1 año entrenando con pesas', emoji: '🌱' },
  { value: 'intermediate', label: 'Intermedio', description: 'Entre 1 y 3 años de experiencia consistente', emoji: '🌿' },
  { value: 'advanced', label: 'Avanzado', description: 'Más de 3 años, progresión lenta y controlada', emoji: '🌳' },
]

// ── Componentes del wizard ────────────────────────────────────────────────────

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1 rounded-full transition-all duration-300',
            i < step ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-surface-03)]',
            i === step - 1 ? 'flex-[2]' : 'flex-1'
          )}
        />
      ))}
    </div>
  )
}

function OptionCard({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-[var(--radius-md)] p-4 border-2 transition-all duration-200',
        selected
          ? 'border-[var(--color-accent)] bg-[var(--color-accent-dim)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface-02)] active:scale-[0.98]',
        className
      )}
    >
      {children}
    </button>
  )
}

// ── Pasos del wizard ──────────────────────────────────────────────────────────

function StepGoal({ state, setState }: { state: WizardState; setState: React.Dispatch<React.SetStateAction<WizardState>> }) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">¿Cuál es tu objetivo?</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Define el foco de tu mesociclo de 8 semanas</p>
      </div>
      {GOALS.map(opt => (
        <OptionCard
          key={opt.value}
          selected={state.goal === opt.value}
          onClick={() => setState(s => ({ ...s, goal: opt.value }))}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{opt.emoji}</span>
            <div>
              <p className="font-semibold text-[var(--color-text-primary)]">{opt.label}</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{opt.description}</p>
            </div>
            {state.goal === opt.value && (
              <span className="ml-auto text-[var(--color-accent)] font-bold text-lg">✓</span>
            )}
          </div>
        </OptionCard>
      ))}
    </div>
  )
}

function StepEquipment({ state, setState }: { state: WizardState; setState: React.Dispatch<React.SetStateAction<WizardState>> }) {
  function toggle(v: MesocycleEquipment) {
    setState(s => ({
      ...s,
      equipment: s.equipment.includes(v)
        ? s.equipment.filter(e => e !== v)
        : [...s.equipment, v],
    }))
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">¿Qué equipo tienes?</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Selecciona todo lo disponible</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {EQUIPMENT.map(opt => (
          <OptionCard
            key={opt.value}
            selected={state.equipment.includes(opt.value)}
            onClick={() => toggle(opt.value)}
          >
            <div className="text-center space-y-1 py-2">
              <p className="text-3xl">{opt.emoji}</p>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{opt.label}</p>
              {state.equipment.includes(opt.value) && (
                <p className="text-xs text-[var(--color-accent)] font-bold">✓ Seleccionado</p>
              )}
            </div>
          </OptionCard>
        ))}
      </div>
    </div>
  )
}

function StepDays({ state, setState }: { state: WizardState; setState: React.Dispatch<React.SetStateAction<WizardState>> }) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">¿Cuántos días por semana?</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Días que puedes entrenar de forma consistente</p>
      </div>
      {DAYS.map(opt => (
        <OptionCard
          key={opt.value}
          selected={state.daysPerWeek === opt.value}
          onClick={() => setState(s => ({ ...s, daysPerWeek: opt.value }))}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-[var(--color-text-primary)]">{opt.label}</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{opt.description}</p>
            </div>
            {state.daysPerWeek === opt.value && (
              <span className="text-[var(--color-accent)] font-bold text-lg">✓</span>
            )}
          </div>
        </OptionCard>
      ))}
    </div>
  )
}

function StepLevel({ state, setState }: { state: WizardState; setState: React.Dispatch<React.SetStateAction<WizardState>> }) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">¿Cuál es tu experiencia?</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Sé honesto — determina el volumen e intensidad</p>
      </div>
      {LEVELS.map(opt => (
        <OptionCard
          key={opt.value}
          selected={state.level === opt.value}
          onClick={() => setState(s => ({ ...s, level: opt.value }))}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{opt.emoji}</span>
            <div>
              <p className="font-semibold text-[var(--color-text-primary)]">{opt.label}</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{opt.description}</p>
            </div>
            {state.level === opt.value && (
              <span className="ml-auto text-[var(--color-accent)] font-bold text-lg">✓</span>
            )}
          </div>
        </OptionCard>
      ))}
    </div>
  )
}

function StepPRs({ state, setState }: { state: WizardState; setState: React.Dispatch<React.SetStateAction<WizardState>> }) {
  function setField(field: keyof CurrentPRs, value: string) {
    const num = value === '' ? undefined : Number(value)
    setState(s => ({ ...s, currentPRs: { ...s.currentPRs, [field]: num } }))
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">PRs actuales</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Opcional — mejora la precisión del plan generado
        </p>
      </div>
      <div
        className="rounded-[var(--radius-md)] p-3 text-sm border"
        style={{ borderColor: '#C8FF0030', backgroundColor: '#C8FF0010', color: '#C8FF00' }}
      >
        💡 Con tus PRs, la IA calibra los pesos iniciales y la progresión para ti
      </div>
      {(['squat', 'bench', 'deadlift'] as const).map(field => {
        const labels = { squat: 'Sentadilla', bench: 'Press banca', deadlift: 'Peso muerto' }
        const emojis = { squat: '🦵', bench: '💪', deadlift: '🔗' }
        return (
          <div key={field} className="space-y-1">
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">
              {emojis[field]} {labels[field]} <span className="text-[var(--color-text-muted)]">(kg · opcional)</span>
            </label>
            <div className="flex items-center gap-2 bg-[var(--color-surface-02)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-3">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={500}
                placeholder="Ej: 100"
                value={state.currentPRs[field] ?? ''}
                onChange={e => setField(field, e.target.value)}
                className="flex-1 py-3 bg-transparent text-[var(--color-text-primary)] font-mono text-lg outline-none"
              />
              <span className="text-sm text-[var(--color-text-muted)]">kg</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Preview del plan generado ─────────────────────────────────────────────────

function PlanPreview({ result, exerciseNames }: { result: GenerateMesocycleResult; exerciseNames: Map<string, string> }) {
  const trainingDays = result.days.filter(d => !d.isRestDay)
  const restDays = result.days.filter(d => d.isRestDay).length

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <p className="text-4xl">🎉</p>
        <h2 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">{result.name}</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {result.weeks} semanas · {trainingDays.length} días de entrenamiento · {restDays} de descanso
        </p>
        <div
          className="inline-block text-xs font-bold px-3 py-1 rounded-full"
          style={{ color: '#C8FF00', backgroundColor: '#C8FF0020' }}
        >
          ✓ Guardado como rutina activa
        </div>
      </div>

      {trainingDays.map((day, i) => (
        <DayCard key={i} day={day} exerciseNames={exerciseNames} />
      ))}
    </div>
  )
}

function DayCard({ day, exerciseNames }: { day: MesocycleDayPreview; exerciseNames: Map<string, string> }) {
  return (
    <div className="bg-[var(--color-surface-02)] rounded-[var(--radius-md)] p-4 space-y-3">
      <p className="font-semibold text-[var(--color-text-primary)]">{day.name}</p>
      {day.exercises.map((ex, i) => (
        <div key={i} className="flex items-center justify-between text-sm">
          <div className="flex-1 min-w-0">
            <p className="text-[var(--color-text-primary)] truncate">
              {exerciseNames.get(ex.exerciseId) ?? ex.exerciseId}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {ex.sets} × {ex.repRangeMin}-{ex.repRangeMax} · RIR {ex.rirTarget} · {ex.restSeconds}s
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Animación de generación ───────────────────────────────────────────────────

function GeneratingScreen() {
  const messages = [
    'Analizando tu perfil…',
    'Diseñando la periodización…',
    'Calculando progresiones…',
    'Optimizando el volumen…',
    'Preparando tu mesociclo…',
  ]
  const [msgIdx, setMsgIdx] = useState(0)

  useState(() => {
    const interval = setInterval(() => {
      setMsgIdx(i => (i + 1) % messages.length)
    }, 1500)
    return () => clearInterval(interval)
  })

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="relative w-20 h-20">
        <div
          className="absolute inset-0 rounded-full border-4 border-t-[var(--color-accent)] border-r-transparent border-b-transparent border-l-transparent animate-spin"
        />
        <div className="absolute inset-3 rounded-full bg-[var(--color-surface-02)] flex items-center justify-center text-2xl">
          🧠
        </div>
      </div>
      <div className="text-center space-y-2">
        <p className="font-display text-xl font-bold text-[var(--color-text-primary)]">
          Diseñando tu mesociclo
        </p>
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-sm text-[var(--color-text-secondary)]"
          >
            {messages[msgIdx]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

const TOTAL_STEPS = 5

const INITIAL_STATE: WizardState = {
  goal: null,
  equipment: ['barbell'],
  daysPerWeek: null,
  level: null,
  currentPRs: {},
}

export function MesocycleGeneratorPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(1)
  const [wizardState, setWizardState] = useState<WizardState>(INITIAL_STATE)
  const [result, setResult] = useState<GenerateMesocycleResult | null>(null)
  const [exerciseNames] = useState<Map<string, string>>(new Map())

  // Cargar nombres de ejercicios para el preview
  const container = getContainer()

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!wizardState.goal || !wizardState.daysPerWeek || !wizardState.level) {
        throw new Error('Faltan datos del wizard')
      }

      // Cargar nombres de ejercicios para el preview
      const exercises = await container.exerciseRepo.findAll()
      for (const ex of exercises) {
        exerciseNames.set(ex.id, ex.nameEs)
      }

      const geminiKey = (() => {
        try { return localStorage.getItem('kova_gemini_key') ?? '' } catch { return '' }
      })()

      const geminiAdapter = new GeminiAIAdapter(geminiKey)
      const handler = new GenerateMesocycleHandler(
        container.routineRepo,
        container.athleteRepo,
        geminiAdapter
      )

      return handler.handle({
        goal: wizardState.goal,
        equipment: wizardState.equipment.length > 0 ? wizardState.equipment : ['barbell'],
        daysPerWeek: wizardState.daysPerWeek,
        level: wizardState.level,
        currentPRs: wizardState.currentPRs,
        athleteId: '',  // handler uses athleteRepo.getDefault() internally
      })
    },
    onSuccess: (data) => {
      setResult(data)
      // Invalidar queries para que el dashboard y rutinas se actualicen
      void queryClient.invalidateQueries({ queryKey: ['routine'] })
      void queryClient.invalidateQueries({ queryKey: ['athlete'] })
    },
  })

  function canAdvance(): boolean {
    switch (step) {
      case 1: return !!wizardState.goal
      case 2: return wizardState.equipment.length > 0
      case 3: return !!wizardState.daysPerWeek
      case 4: return !!wizardState.level
      case 5: return true  // PRs son opcionales
      default: return false
    }
  }

  function handleNext() {
    if (step < TOTAL_STEPS) {
      setStep(s => s + 1)
    } else {
      generateMutation.mutate()
    }
  }

  if (generateMutation.isPending) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <GeneratingScreen />
      </div>
    )
  }

  if (result) {
    return (
      <div className="p-4 space-y-6 max-w-lg mx-auto">
        <PlanPreview result={result} exerciseNames={exerciseNames} />
        <button
          onClick={() => void navigate({ to: '/routines' })}
          className="w-full py-4 rounded-[var(--radius-md)] font-bold text-black text-lg"
          style={{ backgroundColor: 'var(--color-accent)' }}
        >
          Ver mis rutinas →
        </button>
        <button
          onClick={() => void navigate({ to: '/dashboard' })}
          className="w-full py-3 rounded-[var(--radius-md)] text-sm text-[var(--color-text-secondary)] bg-[var(--color-surface-02)]"
        >
          Volver al inicio
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => step > 1 ? setStep(s => s - 1) : void navigate({ to: '/routines' })}
          className="w-10 h-10 rounded-full bg-[var(--color-surface-02)] flex items-center justify-center text-[var(--color-text-secondary)]"
          aria-label="Volver"
        >
          ←
        </button>
        <div className="flex-1">
          <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">
            Generador de mesociclos IA
          </p>
          <StepIndicator step={step} total={TOTAL_STEPS} />
        </div>
        <span className="text-xs font-mono text-[var(--color-text-muted)]">{step}/{TOTAL_STEPS}</span>
      </div>

      {/* Paso activo */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2 }}
        >
          {step === 1 && <StepGoal state={wizardState} setState={setWizardState} />}
          {step === 2 && <StepEquipment state={wizardState} setState={setWizardState} />}
          {step === 3 && <StepDays state={wizardState} setState={setWizardState} />}
          {step === 4 && <StepLevel state={wizardState} setState={setWizardState} />}
          {step === 5 && <StepPRs state={wizardState} setState={setWizardState} />}
        </motion.div>
      </AnimatePresence>

      {/* Error */}
      {generateMutation.isError && (
        <div className="rounded-[var(--radius-md)] p-3 bg-red-950/30 border border-red-500/30 text-sm text-red-400">
          Hubo un error generando el plan. Intenta de nuevo.
        </div>
      )}

      {/* Info BYOK — paso 5 */}
      {step === 5 && (
        <div className="rounded-[var(--radius-md)] p-3 bg-[var(--color-surface-02)] border border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
          {localStorage.getItem('kova_gemini_key')
            ? '🤖 Usando Gemini AI con tu clave — plan personalizado de alta calidad'
            : '📋 Sin clave Gemini — se generará un plan básico offline. Añade tu clave gratuita en Ajustes para planes con IA.'}
        </div>
      )}

      {/* Botón avanzar */}
      <div className="pb-6">
        <button
          onClick={handleNext}
          disabled={!canAdvance()}
          className={cn(
            'w-full py-4 rounded-[var(--radius-md)] font-bold text-lg transition-all',
            canAdvance()
              ? 'text-black'
              : 'text-[var(--color-text-muted)] bg-[var(--color-surface-03)]'
          )}
          style={canAdvance() ? { backgroundColor: 'var(--color-accent)' } : {}}
        >
          {step === TOTAL_STEPS ? '⚡ Generar mi mesociclo' : 'Continuar →'}
        </button>
      </div>
    </div>
  )
}

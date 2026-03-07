import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useQueryClient } from '@tanstack/react-query'
import { getContainer } from '@/infrastructure/container/DIContainer'
import { LocalTemplateGenerator } from '@/domain/localRoutineGenerator'
import {
  buildProfile,
  calcBmi,
  bmiCategory,
  validFrequenciesForLevel,
  type PersonalizationInput,
  type FitnessLevel,
  type PrimaryGoal,
  type TrainingFrequency,
  type RoutineOutput,
} from '@/domain/personalizedRoutines'
import { cn } from '@/shared/utils/cn'

// ─── Metadata for UI ──────────────────────────────────────────────────────────

const GOAL_OPTIONS: { value: PrimaryGoal; label: string; icon: string; desc: string }[] = [
  { value: 'fat-loss',      icon: '🔥', label: 'Perder Grasa',          desc: 'Déficit calórico + cardio. Alta densidad de trabajo.' },
  { value: 'muscle-gain',   icon: '💪', label: 'Ganar Músculo',         desc: 'Superávit moderado. Progresión de carga semanal.' },
  { value: 'strength',      icon: '⚡', label: 'Fuerza Máxima',         desc: 'Sets pesados, bajo RIR. Progresión lineal/por bloques.' },
  { value: 'recomposition', icon: '⚖️', label: 'Recomposición Corporal', desc: 'Perder grasa y ganar músculo simultáneamente.' },
  { value: 'performance',   icon: '🏃', label: 'Rendimiento Deportivo',  desc: 'Fuerza, potencia y cardio integrados.' },
]

const MUSCLE_FOCUS_OPTIONS = [
  { value: 'chest',     label: 'Pecho',    icon: '🫁' },
  { value: 'back',      label: 'Espalda',  icon: '🗿' },
  { value: 'shoulders', label: 'Hombros',  icon: '🦾' },
  { value: 'arms',      label: 'Brazos',   icon: '💪' },
  { value: 'glutes',    label: 'Glúteos',  icon: '🍑' },
  { value: 'legs',      label: 'Piernas',  icon: '🦵' },
]

const LEVEL_OPTIONS: { value: FitnessLevel; label: string; icon: string; desc: string }[] = [
  { value: 'beginner',     icon: '🌱', label: 'Principiante', desc: 'Menos de 1 año entrenando con constancia' },
  { value: 'intermediate', icon: '⚡', label: 'Intermedio',   desc: '1 a 3 años entrenando regularmente' },
  { value: 'advanced',     icon: '🔥', label: 'Avanzado',     desc: 'Más de 3 años con progresión estructurada' },
]

const CARDIO_TYPE_LABEL: Record<string, string> = {
  LISS:     'LISS (Cardio estable)',
  HIIT:     'HIIT (Intervalos)',
  Moderate: 'Moderado',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="flex-1 h-1 rounded-full bg-[var(--color-border)]">
        <motion.div
          className="h-1 rounded-full bg-[var(--color-accent)]"
          animate={{ width: `${((step) / total) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <span className="text-xs text-[var(--color-text-secondary)] tabular-nums shrink-0">
        {step}/{total}
      </span>
    </div>
  )
}

function SelectCard({
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
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-[var(--radius-md)] border p-3 transition-all',
        selected
          ? 'border-[var(--color-accent)] bg-[var(--color-accent-dim)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface-03)] hover:border-[var(--color-text-secondary)]',
        className,
      )}
    >
      {children}
    </button>
  )
}

// ─── Step components ──────────────────────────────────────────────────────────

function Step1({
  data,
  onChange,
}: {
  data: Partial<PersonalizationInput>
  onChange: (k: keyof PersonalizationInput, v: unknown) => void
}) {
  const bmi = data.weightKg && data.heightCm ? calcBmi(data.weightKg, data.heightCm) : null

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-1">Datos personales</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">Para ajustar la rutina a tu cuerpo y metabolismo.</p>
      </div>

      {/* Género */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">Género</label>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: 'male',   label: 'Hombre', icon: '♂' },
            { value: 'female', label: 'Mujer',  icon: '♀' },
          ] as const).map(opt => (
            <SelectCard key={opt.value} selected={data.gender === opt.value} onClick={() => onChange('gender', opt.value)}>
              <span className="text-lg mr-2">{opt.icon}</span>
              <span className="font-medium text-[var(--color-text-primary)]">{opt.label}</span>
            </SelectCard>
          ))}
        </div>
      </div>

      {/* Edad */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">Edad</label>
          <span className="text-sm font-semibold text-[var(--color-accent)]">{data.age ?? 25} años</span>
        </div>
        <input
          type="range"
          min="15"
          max="70"
          value={data.age ?? 25}
          onChange={e => onChange('age', Number(e.target.value))}
          className="w-full accent-[var(--color-accent)]"
        />
        <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
          <span>15</span><span>70</span>
        </div>
      </div>

      {/* Peso y talla */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">Peso (kg)</label>
          <input
            type="number"
            min="30" max="300"
            placeholder="75"
            value={data.weightKg ?? ''}
            onChange={e => onChange('weightKg', Number(e.target.value) || undefined)}
            className="w-full bg-[var(--color-surface-03)] rounded-[var(--radius-md)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">Talla (cm)</label>
          <input
            type="number"
            min="100" max="250"
            placeholder="175"
            value={data.heightCm ?? ''}
            onChange={e => onChange('heightCm', Number(e.target.value) || undefined)}
            className="w-full bg-[var(--color-surface-03)] rounded-[var(--radius-md)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none"
          />
        </div>
      </div>

      {/* BMI live */}
      {bmi !== null && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-03)] border border-[var(--color-border)] px-4 py-3"
        >
          <span className="text-2xl">📊</span>
          <div>
            <p className="text-xs text-[var(--color-text-secondary)]">Índice de Masa Corporal (IMC)</p>
            <p className="font-semibold text-[var(--color-text-primary)]">
              {bmi} — <span className="text-[var(--color-accent)]">{bmiCategory(bmi)}</span>
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function Step2({
  data,
  onChange,
}: {
  data: Partial<PersonalizationInput>
  onChange: (k: keyof PersonalizationInput, v: unknown) => void
}) {
  const validFreqs = data.level ? validFrequenciesForLevel(data.level) : []

  // Auto-correct frequency if it becomes invalid after level change
  useEffect(() => {
    if (data.level && data.trainingFrequency && !validFreqs.includes(data.trainingFrequency)) {
      onChange('trainingFrequency', validFreqs[0])
    }
  }, [data.level]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-1">Experiencia y frecuencia</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">El plan se adapta a tu nivel y disponibilidad semanal.</p>
      </div>

      {/* Nivel */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">Nivel</label>
        <div className="space-y-2">
          {LEVEL_OPTIONS.map(opt => (
            <SelectCard key={opt.value} selected={data.level === opt.value} onClick={() => onChange('level', opt.value)}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{opt.icon}</span>
                <div>
                  <p className="font-semibold text-[var(--color-text-primary)]">{opt.label}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{opt.desc}</p>
                </div>
              </div>
            </SelectCard>
          ))}
        </div>
      </div>

      {/* Días por semana */}
      {data.level && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
            Días de entrenamiento / semana
          </label>
          <div className="flex gap-2">
            {([3, 5, 6] as TrainingFrequency[]).map(freq => {
              const available = validFreqs.includes(freq)
              return (
                <button
                  key={freq}
                  type="button"
                  disabled={!available}
                  onClick={() => available && onChange('trainingFrequency', freq)}
                  className={cn(
                    'flex-1 rounded-[var(--radius-md)] border py-3 font-bold text-lg transition-all',
                    !available && 'opacity-25 cursor-not-allowed border-[var(--color-border)] text-[var(--color-text-muted)]',
                    available && data.trainingFrequency === freq && 'border-[var(--color-accent)] bg-[var(--color-accent-dim)] text-[var(--color-accent)]',
                    available && data.trainingFrequency !== freq && 'border-[var(--color-border)] bg-[var(--color-surface-03)] text-[var(--color-text-primary)] hover:border-[var(--color-text-secondary)]',
                  )}
                >
                  {freq}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            {data.level === 'beginner' && 'Para principiantes, 3 días es lo óptimo para recuperación y adaptación.'}
            {data.level === 'intermediate' && 'Intermedios pueden elegir 3 (PPL) o 5 días (Upper/Lower + Weak Point).'}
            {data.level === 'advanced' && 'Avanzados pueden elegir 5 (PPL doble) o 6 días (PPL completo).'}
          </p>
        </motion.div>
      )}
    </div>
  )
}

function Step3({
  data,
  onChange,
}: {
  data: Partial<PersonalizationInput>
  onChange: (k: keyof PersonalizationInput, v: unknown) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-1">Objetivo principal</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">Esto define la intensidad, el RIR objetivo y el cardio recomendado.</p>
      </div>
      <div className="space-y-2">
        {GOAL_OPTIONS.map(opt => (
          <SelectCard key={opt.value} selected={data.primaryGoal === opt.value} onClick={() => onChange('primaryGoal', opt.value)}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{opt.icon}</span>
              <div>
                <p className="font-semibold text-[var(--color-text-primary)]">{opt.label}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{opt.desc}</p>
              </div>
            </div>
          </SelectCard>
        ))}
      </div>
    </div>
  )
}

function Step4({
  data,
  onChange,
}: {
  data: Partial<PersonalizationInput>
  onChange: (k: keyof PersonalizationInput, v: unknown) => void
}) {
  const selected: string[] = data.muscleFocus ?? []
  const isAdvancedOrInter = data.level !== 'beginner'

  function toggle(v: string) {
    if (selected.includes(v)) {
      onChange('muscleFocus', selected.filter(x => x !== v))
    } else if (selected.length < 3) {
      onChange('muscleFocus', [...selected, v])
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-1">Énfasis muscular</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {isAdvancedOrInter
            ? 'Selecciona hasta 3 grupos musculares para añadir trabajo de aislamiento extra en esos días.'
            : 'Como principiante, la rutina Full Body ya trabaja todos los músculos de forma equilibrada. Puedes añadir énfasis opcional.'}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {MUSCLE_FOCUS_OPTIONS.map(opt => {
          const isSelected = selected.includes(opt.value)
          const isDisabled = !isSelected && selected.length >= 3
          return (
            <button
              key={opt.value}
              type="button"
              disabled={isDisabled}
              onClick={() => toggle(opt.value)}
              className={cn(
                'flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-3 text-sm transition-all',
                isSelected  && 'border-[var(--color-accent)] bg-[var(--color-accent-dim)] text-[var(--color-accent)]',
                !isSelected && !isDisabled && 'border-[var(--color-border)] bg-[var(--color-surface-03)] text-[var(--color-text-primary)] hover:border-[var(--color-text-secondary)]',
                isDisabled  && 'opacity-30 cursor-not-allowed border-[var(--color-border)] text-[var(--color-text-muted)]',
              )}
            >
              <span className="text-lg">{opt.icon}</span>
              <span className="font-medium">{opt.label}</span>
              {isSelected && <span className="ml-auto text-xs">✓</span>}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => onChange('muscleFocus', [])}
        className="text-xs text-[var(--color-text-secondary)] underline underline-offset-2"
      >
        Sin énfasis específico (limpiar selección)
      </button>

      {selected.length > 0 && (
        <p className="text-xs text-[var(--color-accent)]">
          Se añadirán ejercicios de aislamiento para: {selected.map(s => MUSCLE_FOCUS_OPTIONS.find(o => o.value === s)?.label).join(', ')}
        </p>
      )}
    </div>
  )
}

function Step5Result({
  output,
  onSave,
  onReset,
  saving,
  saved,
}: {
  output: RoutineOutput
  onSave: () => void
  onReset: () => void
  saving: boolean
  saved: boolean
}) {
  const { routine, cardioProtocol, recoveryNotes, rir, profile } = output

  function handleExport() {
    const json = JSON.stringify(profile, null, 2)
    void navigator.clipboard.writeText(json)
  }

  const goalLabel = GOAL_OPTIONS.find(g => g.value === profile.primaryGoal)?.label ?? ''
  const levelLabel = LEVEL_OPTIONS.find(l => l.value === profile.level)?.label ?? ''
  const genderLabel = profile.gender === 'male' ? 'Hombre' : 'Mujer'

  const trainingDays = routine.days.filter(d => !d.isRestDay)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-1">Tu rutina personalizada</h2>
        <p className="text-xs text-[var(--color-text-secondary)]">{routine.name}</p>
      </div>

      {/* Profile chips */}
      <div className="flex flex-wrap gap-1.5">
        {[
          `${genderLabel}, ${profile.age} años`,
          `${profile.weightKg} kg · ${profile.heightCm} cm · IMC ${profile.bmi}`,
          levelLabel,
          `${profile.trainingFrequency} días/sem`,
          goalLabel,
          `RIR principal ${rir.main} · accesorios ${rir.accessories}`,
        ].map(chip => (
          <span key={chip} className="text-xs px-2 py-1 rounded-full bg-[var(--color-surface-03)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
            {chip}
          </span>
        ))}
      </div>

      {/* Routine days */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
          Estructura — {trainingDays.length} días de entrenamiento
        </h3>
        {routine.days.map(day => (
          <div key={day.id} className={cn(
            'rounded-[var(--radius-md)] border overflow-hidden',
            day.isRestDay ? 'border-[var(--color-border)] opacity-60' : 'border-[var(--color-border)]',
          )}>
            <div className="px-3 py-2 bg-[var(--color-surface-02)]">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                {day.isRestDay ? '💤 ' : '🏋️ '}{day.name}
                {day.isRestDay && day.restDayType === 'active' && ' — Activo (caminar, movilidad)'}
              </p>
            </div>
            {!day.isRestDay && (
              <div className="px-3 pb-2 pt-1 bg-[var(--color-surface-01)] space-y-1">
                {day.exercises.map((ex, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                    <span className="text-[var(--color-accent)] font-mono font-bold w-6">{ex.sets}×</span>
                    <span className="tabular-nums">{ex.repRange.min}-{ex.repRange.max} reps</span>
                    <span className="text-[var(--color-text-muted)]">· RIR {ex.rirTarget}</span>
                    <span className="ml-auto text-[var(--color-text-muted)] capitalize">
                      {ex.exerciseId.split('-').slice(1).join(' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Cardio */}
      <div className="rounded-[var(--radius-lg)] border border-emerald-700/40 bg-emerald-950/30 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏃</span>
          <h3 className="font-semibold text-emerald-400">Cardio recomendado</h3>
          <span className="ml-auto text-xs text-emerald-500 font-medium">{cardioProtocol.sessionsPerWeek}×/semana</span>
        </div>
        <div className="space-y-2">
          {cardioProtocol.modalities.map((m, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-xs font-semibold text-emerald-400 mt-0.5 whitespace-nowrap">{CARDIO_TYPE_LABEL[m.type]}</span>
              <div>
                <p className="text-xs text-emerald-200">{m.durationMinutes} min · {m.intensityNote}</p>
              </div>
            </div>
          ))}
        </div>
        {cardioProtocol.hrZone && (
          <p className="text-xs text-emerald-500">
            Zona objetivo: {cardioProtocol.hrZone.low}-{cardioProtocol.hrZone.high} lpm
          </p>
        )}
        <p className="text-xs text-emerald-600">{cardioProtocol.timing}</p>
        <ul className="space-y-1">
          {cardioProtocol.notes.map((n, i) => (
            <li key={i} className="text-xs text-emerald-600 flex gap-1.5">
              <span>•</span><span>{n}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recovery notes */}
      {recoveryNotes.length > 0 && (
        <div className="rounded-[var(--radius-lg)] border border-amber-700/40 bg-amber-950/30 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <h3 className="font-semibold text-amber-400">Notas de recuperación</h3>
          </div>
          <ul className="space-y-1.5">
            {recoveryNotes.map((note, i) => (
              <li key={i} className="text-xs text-amber-300 flex gap-1.5">
                <span>•</span><span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={onSave}
          disabled={saving || saved}
          className={cn(
            'w-full py-3 rounded-[var(--radius-md)] font-semibold text-sm transition-all',
            saved
              ? 'bg-green-600 text-white cursor-default'
              : 'bg-[var(--color-accent)] text-black hover:opacity-90 disabled:opacity-50',
          )}
        >
          {saved ? '✓ Rutina guardada' : saving ? 'Guardando…' : 'Guardar rutina'}
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="flex-1 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] transition-colors"
          >
            Exportar perfil JSON
          </button>
          <button
            type="button"
            onClick={onReset}
            className="flex-1 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)] transition-colors"
          >
            Volver a empezar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface PersonalizedWizardProps {
  onClose: () => void
}

export function PersonalizedWizard({ onClose }: PersonalizedWizardProps) {
  const container = getContainer()
  const queryClient = useQueryClient()

  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [formData, setFormData] = useState<Partial<PersonalizationInput>>({
    age: 25,
    muscleFocus: [],
  })
  const [generating, setGenerating] = useState(false)
  const [output, setOutput] = useState<RoutineOutput | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const TOTAL_STEPS = 5

  function update(key: keyof PersonalizationInput, value: unknown) {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  function canProceed(): boolean {
    if (step === 1) return !!(formData.gender && formData.age && formData.weightKg && formData.heightCm)
    if (step === 2) return !!(formData.level && formData.trainingFrequency)
    if (step === 3) return !!formData.primaryGoal
    if (step === 4) return true // muscle focus is optional
    return false
  }

  async function proceed() {
    if (!canProceed()) return
    if (step < 4) {
      setDirection(1)
      setStep(s => s + 1)
      return
    }
    // Step 4 → generate result
    setDirection(1)
    setStep(5)
    setGenerating(true)
    try {
      const profile = buildProfile({
        gender:            formData.gender!,
        age:               formData.age!,
        weightKg:          formData.weightKg!,
        heightCm:          formData.heightCm!,
        level:             formData.level!,
        trainingFrequency: formData.trainingFrequency!,
        primaryGoal:       formData.primaryGoal!,
        muscleFocus:       formData.muscleFocus ?? [],
      })
      const generator = new LocalTemplateGenerator()
      const result = await generator.generate(profile)
      setOutput(result)
    } finally {
      setGenerating(false)
    }
  }

  function back() {
    if (step === 1) { onClose(); return }
    setDirection(-1)
    setStep(s => s - 1)
    if (step === 5) setOutput(null)
  }

  async function saveRoutine() {
    if (!output) return
    setSaving(true)
    try {
      await container.routineRepo.save(output.routine)
      void queryClient.invalidateQueries({ queryKey: ['routines'] })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  function reset() {
    setStep(1)
    setDirection(-1)
    setOutput(null)
    setSaved(false)
    setFormData({ age: 25, muscleFocus: [] })
  }

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative z-10 w-full max-w-lg max-h-[92dvh] flex flex-col bg-[var(--color-surface-02)] rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <span className="font-semibold text-[var(--color-text-primary)]">Rutina a tu medida</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors text-xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-5 pb-1 shrink-0">
          <ProgressBar step={step} total={TOTAL_STEPS} />
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              {step === 1 && <Step1 data={formData} onChange={update} />}
              {step === 2 && <Step2 data={formData} onChange={update} />}
              {step === 3 && <Step3 data={formData} onChange={update} />}
              {step === 4 && <Step4 data={formData} onChange={update} />}
              {step === 5 && (
                generating ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-10 h-10 rounded-full border-2 border-[var(--color-accent)] border-t-transparent"
                    />
                    <p className="text-[var(--color-text-secondary)] text-sm">Generando tu rutina…</p>
                  </div>
                ) : output ? (
                  <Step5Result
                    output={output}
                    onSave={saveRoutine}
                    onReset={reset}
                    saving={saving}
                    saved={saved}
                  />
                ) : null
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation buttons (hidden on result step) */}
        {step < 5 && (
          <div className="shrink-0 px-5 pb-5 pt-3 border-t border-[var(--color-border)] flex gap-3">
            <button
              type="button"
              onClick={back}
              className="px-5 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)] transition-colors"
            >
              {step === 1 ? 'Cancelar' : 'Atrás'}
            </button>
            <button
              type="button"
              onClick={() => void proceed()}
              disabled={!canProceed()}
              className="flex-1 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-black font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition-all"
            >
              {step === 4 ? 'Generar rutina ✨' : 'Continuar →'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}

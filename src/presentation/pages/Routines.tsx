import { useState, Component, type ErrorInfo, type ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'motion/react'
import { getContainer } from '@/infrastructure/container/DIContainer'
import { Routine, type RoutineDay } from '@/domain/entities/Routine'
import { RepRange } from '@/domain/value-objects/RepRange'
import { Button } from '@/presentation/design-system/components/Button'
import { cn } from '@/shared/utils/cn'
import { RoutineWizard } from '@/presentation/features/routines/components/RoutineWizard'
import { PersonalizedWizard } from '@/presentation/features/routines/components/PersonalizedWizard'
import { useStartWorkout } from '@/presentation/features/workout/hooks/useStartWorkout'
import { MUSCLE_GROUP_LABELS } from '@/domain/value-objects/MuscleGroup'

/* ─── Error boundary for wizard ─── */
class WizardErrorBoundary extends Component<
  { children: ReactNode; onClose: () => void },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[WizardError]', error, info) }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[var(--color-surface-02)] rounded-2xl p-6 max-w-sm mx-4 space-y-4 text-center border border-[var(--color-border)]">
            <p className="text-3xl">⚠️</p>
            <p className="font-semibold text-[var(--color-text-primary)]">Algo salió mal</p>
            <p className="text-sm text-[var(--color-text-secondary)]">No se pudo cargar el asistente. Intenta de nuevo.</p>
            <button
              onClick={() => { this.setState({ hasError: false }); this.props.onClose() }}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-black"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const WEEK_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const MUSCLE_EMOJI: Record<string, string> = {
  chest: '💪', back: '🔙', lats: '🔙', shoulders: '🏋️', biceps: '💪',
  triceps: '💪', forearms: '🤜', quadriceps: '🦵', hamstrings: '🦵',
  glutes: '🍑', calves: '🦶', core: '🎯', traps: '🐂',
}

function getRoutineMuscles(routine: Routine): string[] {
  try {
    const seen = new Set<string>()
    for (const day of routine.days) {
      if (!day.isRestDay && Array.isArray(day.exercises)) {
        for (const ex of day.exercises) {
          const m = ex.exerciseId?.split('-')[0]
          if (m) seen.add(m)
        }
      }
    }
    return [...seen].slice(0, 5)
  } catch {
    return []
  }
}

/* ─── Weekly strip (compact, shown inside card) ─── */
function WeekStrip({ days, isActive }: { days: readonly RoutineDay[]; isActive: boolean }) {
  const [expandedDay, setExpandedDay] = useState<number | null>(null)
  const todayIndex = (new Date().getDay() + 6) % 7

  return (
    <div className="space-y-2">
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(days.length, 7)}, 1fr)` }}>
        {days.slice(0, 7).map((day, i) => {
          const mKey = day.isRestDay ? null : day.exercises[0]?.exerciseId.split('-')[0]
          const emoji = day.isRestDay ? '·' : (mKey ? (MUSCLE_EMOJI[mKey] ?? '🏋️') : '🏋️')
          const isToday = i === todayIndex % Math.min(days.length, 7)
          return (
            <button
              key={day.id}
              onClick={() => setExpandedDay(expandedDay === i ? null : i)}
              className={cn(
                'flex flex-col items-center py-2 rounded-xl transition-all',
                day.isRestDay ? 'opacity-30 bg-[var(--color-surface-03)]' : 'bg-[var(--color-surface-03)] hover:bg-[var(--color-surface-02)]',
                isToday && isActive && 'ring-1 ring-[var(--color-accent)] bg-[var(--color-accent-dim)]',
                expandedDay === i && 'ring-1 ring-[var(--color-border-active)]'
              )}
            >
              <span className={cn(
                'text-[9px] font-bold uppercase tracking-wide',
                isToday && isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'
              )}>
                {WEEK_LABELS[i] ?? `D${i + 1}`}
              </span>
              <span className="text-sm leading-none mt-0.5">{emoji}</span>
            </button>
          )
        })}
      </div>

      <AnimatePresence>
        {expandedDay !== null && days[expandedDay] && (
          <motion.div
            key={expandedDay}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[var(--color-surface-03)] rounded-xl p-3 space-y-1.5">
              <p className="text-xs font-bold text-[var(--color-accent)] mb-2">
                {days[expandedDay]!.name}
                {days[expandedDay]!.isRestDay ? ' · Descanso' : ` · ${days[expandedDay]!.exercises.length} ejercicios`}
              </p>
              {!days[expandedDay]!.isRestDay && (days[expandedDay]!.exercises ?? []).map((ex, j) => (
                <div key={j} className="flex items-start gap-2 text-xs">
                  <span className="text-[var(--color-accent)] font-mono font-bold w-6 shrink-0 pt-0.5">{ex.sets}×</span>
                  <span className="text-[var(--color-text-primary)] flex-1 leading-tight">
                    {ex.exerciseId.split('-').slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </span>
                  <span className="text-[var(--color-text-muted)] shrink-0 pt-0.5">
                    {ex.repRange.min}-{ex.repRange.max}r
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Premium RoutineCard ─── */
function RoutineCard({ routine, onDelete, onSetActive, isActive, onStartWorkout, startPending }: {
  routine: Routine
  onDelete: () => void
  onSetActive: () => void
  isActive: boolean
  onStartWorkout: () => void
  startPending: boolean
}) {
  const muscles = getRoutineMuscles(routine)
  const today = new Date().getDay()
  const daysLen = routine.days.length
  const todayDay = daysLen > 0 ? routine.days[today % daysLen] : undefined
  const hasTodayWorkout = todayDay && !todayDay.isRestDay

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl border overflow-hidden',
        isActive ? 'border-[var(--color-accent)]' : 'border-[var(--color-border)]'
      )}
      style={isActive ? {
        background: 'linear-gradient(160deg, var(--color-surface-02) 60%, rgba(57,255,20,0.06) 100%)'
      } : { background: 'var(--color-surface-02)' }}
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base text-[var(--color-text-primary)]">{routine.name}</h3>
              {isActive && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-accent)] text-black font-black tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                  ACTIVA
                </span>
              )}
            </div>
            {routine.description && (
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{routine.description}</p>
            )}
          </div>
          <button
            onClick={onDelete}
            className="text-[var(--color-text-muted)] hover:text-red-400 transition-colors p-1 shrink-0"
            aria-label="Eliminar rutina"
          >
            ✕
          </button>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
          <span className="flex items-center gap-1">
            <span>📅</span>
            <span>{routine.trainingDays.length} días/sem</span>
          </span>
          <span className="text-[var(--color-border)]">·</span>
          <span className="flex items-center gap-1">
            <span>💪</span>
            <span>{routine.totalExercises} ejercicios</span>
          </span>
          {hasTodayWorkout && (
            <>
              <span className="text-[var(--color-border)]">·</span>
              <span className="text-[var(--color-accent)] font-semibold flex items-center gap-1">
                <span>⚡</span>
                <span>Hoy: {todayDay.name}</span>
              </span>
            </>
          )}
        </div>

        {/* Muscle chips */}
        {muscles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {muscles.map(m => (
              <span
                key={m}
                className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--color-surface-03)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
              >
                {MUSCLE_EMOJI[m] ?? '🏋️'} {MUSCLE_GROUP_LABELS[m as keyof typeof MUSCLE_GROUP_LABELS] ?? m}
              </span>
            ))}
          </div>
        )}

        {/* Weekly strip */}
        <WeekStrip days={routine.days} isActive={isActive} />

        {/* CTA buttons */}
        <div className="flex gap-2 pt-1">
          {!isActive && (
            <button
              onClick={onSetActive}
              className="flex-1 py-2.5 rounded-xl border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-secondary)] hover:border-[var(--color-border-active)] hover:text-[var(--color-text-primary)] transition-all"
            >
              Activar rutina
            </button>
          )}
          <button
            onClick={onStartWorkout}
            disabled={startPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-black text-black flex items-center justify-center gap-1.5 active:scale-95 transition-transform disabled:opacity-70"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            {startPending ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>⚡ Entrenar ahora</>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Template card with gradient ─── */
const TEMPLATE_STYLES: Record<string, { gradient: string; icon: string; label: string }> = {
  fullbody: { gradient: 'from-green-950/60 to-green-900/20', icon: '🌐', label: 'Full Body' },
  fuerza:   { gradient: 'from-blue-950/60 to-blue-900/20',  icon: '🏗️', label: 'Fuerza' },
  upper:    { gradient: 'from-yellow-950/60 to-yellow-900/20', icon: '⬆️', label: 'Upper/Lower' },
  ppl:      { gradient: 'from-red-950/60 to-red-900/20',    icon: '🔄', label: 'PPL' },
}

interface TemplateInfo {
  level: string
  goal: string
  benefits: string[]
  proTip: string
  frequency: string
}

const TEMPLATE_INFO: Record<string, TemplateInfo> = {
  ppl: {
    level: 'Intermedio–Avanzado',
    goal: 'Hipertrofia & Volumen',
    frequency: '6 días/sem',
    benefits: [
      'Máxima frecuencia de estímulo por grupo muscular (2×/sem)',
      'Volumen semanal alto: ideal para maximizar hipertrofia',
      'Separación óptima empuje/jalón reduce fatiga acumulada',
    ],
    proTip: 'Usa RIR 2 en la mayoría de series. Las últimas series de aislamiento pueden llegar a RIR 0–1 para mayor estímulo.',
  },
  fuerza: {
    level: 'Principiante–Intermedio',
    goal: 'Fuerza Máxima',
    frequency: '3 días/sem',
    benefits: [
      'Progresión lineal semana a semana en los levantamientos básicos',
      'Squat, Press, Peso Muerto: los movimientos más eficientes',
      'Menos fatiga acumulada, ideal para progresar consistentemente',
    ],
    proTip: 'Incrementa 2.5 kg cada sesión. Si fallas 3 sesiones seguidas en un peso, baja 10% y vuelve a subir.',
  },
  fullbody: {
    level: 'Todos los niveles',
    goal: 'Mantenimiento & Fitness General',
    frequency: '3 días/sem',
    benefits: [
      'Alta frecuencia de cada músculo (3×/sem) maximiza síntesis proteica',
      'Perfecto si tienes poco tiempo o eres principiante',
      'Equilibrio entre volumen, fuerza y recuperación',
    ],
    proTip: 'Varía los ejercicios entre días (Día 1, 2, 3) para estimular el músculo con ángulos distintos.',
  },
  upper: {
    level: 'Intermedio',
    goal: 'Hipertrofia Balanceada',
    frequency: '4 días/sem',
    benefits: [
      'Equilibrio entre fuerza (Upper A / Lower A) y volumen (Upper B / Lower B)',
      '4 días permite mayor recuperación que PPL sin perder frecuencia',
      'Ideal para atletas con vida ocupada que quieren resultados consistentes',
    ],
    proTip: 'Los días de "Volumen" (B) son ideales para trabajar cerca del fallo con RIR 1. Los días de "Fuerza" (A) quedate en RIR 2–3.',
  },
}

function getTemplateKey(name: string) {
  const n = name.toLowerCase()
  if (n.includes('ppl') || n.includes('push') || n.includes('pull')) return 'ppl'
  if (n.includes('fuerza') || n.includes('5x5')) return 'fuerza'
  if (n.includes('full') || n.includes('cuerpo')) return 'fullbody'
  if (n.includes('upper') || n.includes('lower')) return 'upper'
  return 'fullbody'
}

function getTemplateStyle(name: string) {
  const key = getTemplateKey(name)
  return TEMPLATE_STYLES[key]!
}

function TemplateCard({ template, onImport, isPending }: {
  template: Routine
  onImport: () => void
  isPending: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const style = getTemplateStyle(template.name)
  const info = TEMPLATE_INFO[getTemplateKey(template.name)]!
  const muscles = getRoutineMuscles(template)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl border border-[var(--color-border)] overflow-hidden',
        `bg-gradient-to-br ${style.gradient}`
      )}
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-black/30 flex items-center justify-center text-2xl shrink-0">
            {style.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-[var(--color-text-primary)]">{template.name}</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-[var(--color-text-secondary)]">
                {style.label}
              </span>
            </div>
            <div className="flex gap-3 mt-1 text-xs text-[var(--color-text-secondary)] flex-wrap">
              <span>📅 {template.trainingDays.length} días/sem</span>
              <span>💪 {template.totalExercises} ejercicios</span>
              <span className="text-[var(--color-text-muted)]">· {info.level}</span>
            </div>
          </div>
        </div>

        {/* Goal + Description */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[var(--color-text-secondary)] font-semibold">
            🎯 {info.goal}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[var(--color-text-secondary)]">
            {info.frequency}
          </span>
        </div>

        {template.description && (
          <p className="text-xs text-[var(--color-text-secondary)]">{template.description}</p>
        )}

        {/* Expandable detail */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-1">
                {/* Benefits */}
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wide font-bold text-[var(--color-text-muted)]">Beneficios</p>
                  {info.benefits.map((b, i) => (
                    <div key={i} className="flex gap-2 text-xs text-[var(--color-text-secondary)]">
                      <span className="text-[var(--color-accent)] shrink-0">✓</span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                {/* Pro tip */}
                <div className="bg-black/20 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-wide font-bold text-[var(--color-accent)] mb-1">💡 Consejo Pro</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{info.proTip}</p>
                </div>

                {/* Muscle chips */}
                {muscles.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {muscles.map(m => (
                      <span key={m} className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/30 text-[var(--color-text-secondary)]">
                        {MUSCLE_EMOJI[m] ?? '🏋️'} {MUSCLE_GROUP_LABELS[m as keyof typeof MUSCLE_GROUP_LABELS] ?? m}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle details */}
        <button
          onClick={() => setExpanded(p => !p)}
          className="w-full text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors text-left"
        >
          {expanded ? '▲ Ocultar detalles' : '▼ Ver beneficios y consejos pro'}
        </button>

        {/* Import button */}
        <button
          onClick={onImport}
          disabled={isPending}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-black flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-70"
          style={{ backgroundColor: 'var(--color-accent)' }}
        >
          {isPending ? (
            <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <>📥 Importar plantilla</>
          )}
        </button>
      </div>
    </motion.div>
  )
}

/* ─── Page ─── */
export function RoutinesPage() {
  const container = getContainer()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [showPersonalized, setShowPersonalized] = useState(false)
  const [newName, setNewName] = useState('')

  const startWorkout = useStartWorkout()

  const { data: athlete } = useQuery({
    queryKey: ['athlete'],
    queryFn: () => container.athleteRepo.getDefault(),
  })

  const { data: routines = [], isLoading } = useQuery({
    queryKey: ['routines'],
    queryFn: () => container.routineRepo.findAll(),
  })

  const { data: templates = [] } = useQuery({
    queryKey: ['routines', 'templates'],
    queryFn: () => container.routineRepo.findTemplates(),
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const routine = Routine.create({ name: newName || 'Nueva rutina' })
      await container.routineRepo.save(routine)
      return routine
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['routines'] })
      setShowCreate(false)
      setNewName('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => container.routineRepo.delete(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['routines'] }),
  })

  const setActiveMutation = useMutation({
    mutationFn: async (routineId: string) => {
      if (!athlete) return
      athlete.setActiveRoutine(routineId)
      await container.athleteRepo.save(athlete)
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['athlete'] }),
  })

  const importTemplateMutation = useMutation({
    mutationFn: async (template: Routine) => {
      const copy = Routine.create({
        name: template.name,
        description: template.description,
        days: template.days.map(d => ({
          ...d,
          exercises: d.exercises.map(ex => ({
            ...ex,
            repRange: RepRange.create(ex.repRange.min, ex.repRange.max),
          })),
        })) as import('@/domain/entities/Routine').RoutineDay[],
      })
      await container.routineRepo.save(copy)
      return copy
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['routines'] }),
  })

  const handleStartWorkout = (routineId: string) => {
    if (!athlete) return
    // Activate routine if not already active, then start workout
    const doStart = () => startWorkout.mutate({ athleteId: athlete.id, routineId })
    if (athlete.activeRoutineId !== routineId) {
      setActiveMutation.mutateAsync(routineId).then(doStart).catch(doStart)
    } else {
      doStart()
    }
  }

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="font-display text-3xl font-bold text-[var(--color-text-primary)]">Rutinas</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => { setShowWizard(p => !p); setShowCreate(false) }}>
            🧙 Asistente
          </Button>
          <Button variant="primary" size="sm" onClick={() => { setShowCreate(p => !p); setShowWizard(false) }}>
            + Nueva
          </Button>
        </div>
      </div>

      {/* Personalized wizard CTA */}
      <div className="rounded-2xl border border-[var(--color-accent)] overflow-hidden">
        <div
          className="p-4 flex items-center gap-4"
          style={{ background: 'linear-gradient(135deg, var(--color-accent-dim) 0%, rgba(57,255,20,0.03) 100%)' }}
        >
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent)] flex items-center justify-center text-2xl shrink-0">
            ✨
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[var(--color-text-primary)]">Rutina a tu medida</p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">5 preguntas · IA local · Cardio + RIR personalizado</p>
          </div>
          <button
            onClick={() => setShowPersonalized(true)}
            className="shrink-0 px-3 py-2 rounded-xl text-xs font-black text-black"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            Crear →
          </button>
        </div>
      </div>

      {/* AI Mesocycle CTA */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#7c3aed40' }}>
        <div
          className="p-4 flex items-center gap-4"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(124,58,237,0.03) 100%)' }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: 'rgba(124,58,237,0.3)' }}>
            🧠
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[var(--color-text-primary)]">Generar con IA</p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Mesociclo 8 semanas · periodizado · con deload</p>
          </div>
          <button
            onClick={() => void navigate({ to: '/plan' })}
            className="shrink-0 px-3 py-2 rounded-xl text-xs font-black text-white"
            style={{ backgroundColor: '#7c3aed' }}
          >
            Generar →
          </button>
        </div>
      </div>

      {/* Simple wizard */}
      <AnimatePresence>
        {showWizard && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <RoutineWizard onSaved={() => setShowWizard(false)} onCancel={() => setShowWizard(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[var(--color-surface-02)] rounded-2xl p-4 space-y-3">
              <input
                type="text"
                placeholder="Nombre de la rutina"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full bg-[var(--color-surface-03)] rounded-xl px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] border border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none transition-colors"
                onKeyDown={e => { if (e.key === 'Enter') createMutation.mutate() }}
                autoFocus
              />
              <Button variant="primary" size="md" onClick={() => createMutation.mutate()} loading={createMutation.isPending} className="w-full">
                Crear rutina
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User routines */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-40 rounded-2xl bg-[var(--color-surface-02)] animate-pulse" />
          ))}
        </div>
      ) : routines.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide font-semibold">Mis rutinas</h2>
          {routines.map(routine => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              isActive={athlete?.activeRoutineId === routine.id}
              onDelete={() => deleteMutation.mutate(routine.id)}
              onSetActive={() => setActiveMutation.mutate(routine.id)}
              onStartWorkout={() => handleStartWorkout(routine.id)}
              startPending={startWorkout.isPending}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-[var(--color-text-secondary)]">
          <p className="text-4xl mb-3">📋</p>
          <p>Crea tu primera rutina o importa una plantilla abajo</p>
        </div>
      )}

      {/* Templates */}
      {templates.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide font-semibold">
            Plantillas de expertos
          </h2>
          {templates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onImport={() => importTemplateMutation.mutate(template)}
              isPending={importTemplateMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Personalized wizard modal */}
      {showPersonalized && (
        <WizardErrorBoundary onClose={() => setShowPersonalized(false)}>
          <AnimatePresence>
            <PersonalizedWizard
              key="personalized-wizard"
              onClose={() => setShowPersonalized(false)}
            />
          </AnimatePresence>
        </WizardErrorBoundary>
      )}
    </div>
  )
}

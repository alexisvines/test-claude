import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
import { getContainer } from '@/infrastructure/container/DIContainer'
import { Routine, type RoutineDay } from '@/domain/entities/Routine'
import { RepRange } from '@/domain/value-objects/RepRange'
import { Button } from '@/presentation/design-system/components/Button'
import { cn } from '@/shared/utils/cn'
import { RoutineWizard } from '@/presentation/features/routines/components/RoutineWizard'
import { PersonalizedWizard } from '@/presentation/features/routines/components/PersonalizedWizard'

const WEEK_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MUSCLE_DAY_EMOJI: Record<string, string> = {
  chest: '💪', back: '🔙', lats: '🔙', shoulders: '🏋️', biceps: '💪',
  triceps: '💪', forearms: '🤜', quadriceps: '🦵', hamstrings: '🦵',
  glutes: '🍑', calves: '🦶', core: '🎯', traps: '🐂',
  push: '💪', pull: '🔙', legs: '🦵',
}

function WeeklyView({ days }: { days: readonly RoutineDay[] }) {
  const [expandedDay, setExpandedDay] = useState<number | null>(null)
  const todayIndex = (new Date().getDay() + 6) % 7 // Mon=0…Sun=6

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
        Vista semanal
      </p>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(days.length, 7)}, 1fr)` }}>
        {days.slice(0, 7).map((day, i) => {
          const muscleKey = day.isRestDay ? null : day.exercises[0]?.exerciseId.split('-')[0]
          const emoji = day.isRestDay ? '😴' : (muscleKey ? (MUSCLE_DAY_EMOJI[muscleKey] ?? '🏋️') : '🏋️')
          const isToday = i === todayIndex % days.length
          return (
            <button
              key={day.id}
              onClick={() => setExpandedDay(expandedDay === i ? null : i)}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-[var(--radius-md)] transition-colors',
                day.isRestDay
                  ? 'bg-[var(--color-surface-01)] opacity-50'
                  : 'bg-[var(--color-surface-02)] hover:bg-[var(--color-surface-03)]',
                isToday && 'ring-1 ring-[var(--color-accent)]',
                expandedDay === i && 'bg-[var(--color-surface-03)]'
              )}
            >
              <span className={cn(
                'text-[10px] font-bold uppercase',
                isToday ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'
              )}>
                {WEEK_LABELS[i] ?? `D${i + 1}`}
              </span>
              <span className="text-lg leading-none">{emoji}</span>
            </button>
          )
        })}
      </div>

      {/* Expanded day detail */}
      <AnimatePresence>
        {expandedDay !== null && days[expandedDay] && (
          <motion.div
            key={expandedDay}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[var(--color-surface-03)] rounded-[var(--radius-md)] p-3 space-y-1">
              <p className="text-xs font-semibold text-[var(--color-accent)] mb-2">
                {days[expandedDay]!.name}
                {days[expandedDay]!.isRestDay ? ' — Descanso' : ` — ${days[expandedDay]!.exercises.length} ejercicios`}
              </p>
              {!days[expandedDay]!.isRestDay && days[expandedDay]!.exercises.map((ex, j) => (
                <div key={j} className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                  <span className="text-[var(--color-accent)] font-mono font-bold w-6">{ex.sets}×</span>
                  <span className="text-[var(--color-text-primary)]">
                    {ex.exerciseId.split('-').slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </span>
                  <span className="ml-auto text-[var(--color-text-muted)]">
                    {ex.repRange.min}-{ex.repRange.max} reps
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

function RoutineCard({ routine, onDelete, onSetActive, isActive }: {
  routine: Routine
  onDelete: () => void
  onSetActive: () => void
  isActive: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      layout
      className={cn(
        'rounded-[var(--radius-lg)] border overflow-hidden',
        isActive ? 'border-[var(--color-accent)]' : 'border-[var(--color-border)]'
      )}
    >
      <div
        className="p-4 cursor-pointer bg-[var(--color-surface-02)]"
        onClick={() => setExpanded(p => !p)}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[var(--color-text-primary)]">{routine.name}</h3>
              {isActive && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent-dim)] text-[var(--color-accent)] border border-[var(--color-accent)]">
                  Activa
                </span>
              )}
            </div>
            {routine.description && (
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">{routine.description}</p>
            )}
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              {routine.trainingDays.length} días de entrenamiento · {routine.totalExercises} ejercicios
            </p>
          </div>
          <span className="text-[var(--color-text-secondary)] text-sm">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 bg-[var(--color-surface-01)]">
              <div className="pt-3">
                <WeeklyView days={routine.days} />
              </div>

              <div className="flex gap-2 pt-2 border-t border-[var(--color-border)]">
                {!isActive && (
                  <Button variant="accent" size="sm" onClick={onSetActive} className="flex-1">
                    Usar esta rutina
                  </Button>
                )}
                <Button variant="danger" size="sm" onClick={onDelete}>
                  Eliminar
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function RoutinesPage() {
  const container = getContainer()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [showPersonalized, setShowPersonalized] = useState(false)
  const [newName, setNewName] = useState('')

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

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto">
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
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-accent)] bg-[var(--color-accent-dim)] p-4 flex items-center gap-4">
        <span className="text-3xl shrink-0">✨</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[var(--color-text-primary)]">Crear rutina a tu medida</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Edad, objetivo, nivel y más — genera una rutina experta con cardio y RIR personalizados.</p>
        </div>
        <Button variant="accent" size="sm" onClick={() => setShowPersonalized(true)} className="shrink-0">
          Comenzar
        </Button>
      </div>

      {/* Wizard */}
      <AnimatePresence>
        {showWizard && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <RoutineWizard
              onSaved={() => setShowWizard(false)}
              onCancel={() => setShowWizard(false)}
            />
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
            <div className="bg-[var(--color-surface-02)] rounded-[var(--radius-lg)] p-4 space-y-3">
              <input
                type="text"
                placeholder="Nombre de la rutina"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full bg-[var(--color-surface-03)] rounded-[var(--radius-md)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] border border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none transition-colors"
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
            <div key={i} className="h-24 rounded-[var(--radius-lg)] bg-[var(--color-surface-02)] animate-pulse" />
          ))}
        </div>
      ) : routines.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">Mis rutinas</h2>
          {routines.map(routine => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              isActive={athlete?.activeRoutineId === routine.id}
              onDelete={() => deleteMutation.mutate(routine.id)}
              onSetActive={() => setActiveMutation.mutate(routine.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-[var(--color-text-secondary)]">
          <p className="text-4xl mb-3">📋</p>
          <p>Crea tu primera rutina o importa una plantilla</p>
        </div>
      )}

      {/* Templates */}
      {templates.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
            Plantillas disponibles
          </h2>
          {templates.map(template => (
            <div
              key={template.id}
              className="bg-[var(--color-surface-02)] rounded-[var(--radius-lg)] p-4 border border-[var(--color-border)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--color-text-primary)]">{template.name}</h3>
                  {template.description && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">{template.description}</p>
                  )}
                </div>
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => importTemplateMutation.mutate(template)}
                  loading={importTemplateMutation.isPending}
                >
                  Importar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="h-4" />

      {/* Personalized wizard modal */}
      <AnimatePresence>
        {showPersonalized && (
          <PersonalizedWizard onClose={() => setShowPersonalized(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

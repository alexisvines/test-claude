import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
import { getContainer } from '@/infrastructure/container/DIContainer'
import {
  ROUTINE_TEMPLATES,
  selectBestTemplate,
  saveRoutineFromWizard,
  type WizardInput,
} from '@/domain/routineTemplates'
import { Button } from '@/presentation/design-system/components/Button'
import { cn } from '@/shared/utils/cn'
import type { Routine } from '@/domain/entities/Routine'

interface Props {
  onSaved: (routine: Routine) => void
  onCancel: () => void
}

const LEVELS: { value: WizardInput['level']; label: string; emoji: string; hint: string }[] = [
  { value: 'principiante', label: 'Principiante', emoji: '🌱', hint: 'Menos de 1 año entrenando' },
  { value: 'intermedio', label: 'Intermedio', emoji: '⚡', hint: '1–3 años con técnica sólida' },
  { value: 'avanzado', label: 'Avanzado', emoji: '🔥', hint: 'Más de 3 años, recuperación alta' },
]

const DAYS_OPTIONS: { value: 3 | 4 | 6; label: string }[] = [
  { value: 3, label: '3 días' },
  { value: 4, label: '4 días' },
  { value: 6, label: '6 días' },
]

export function RoutineWizard({ onSaved, onCancel }: Props) {
  const container = getContainer()
  const queryClient = useQueryClient()

  const [level, setLevel] = useState<WizardInput['level'] | null>(null)
  const [days, setDays] = useState<3 | 4 | 6 | null>(null)

  const match = level && days ? selectBestTemplate({ level, daysPerWeek: days }) : null

  const availableDays = level
    ? Array.from(
        new Set(
          ROUTINE_TEMPLATES.filter(t => t.targetLevels.includes(level)).map(t => {
            if (t.daysPerWeek <= 3) return 3
            if (t.daysPerWeek <= 4) return 4
            return 6
          }),
        ),
      ).sort((a, b) => a - b)
    : ([3, 4, 6] as const)

  const saveMutation = useMutation({
    mutationFn: () =>
      saveRoutineFromWizard({ level, daysPerWeek: days }, container.routineRepo),
    onSuccess: routine => {
      void queryClient.invalidateQueries({ queryKey: ['routines'] })
      onSaved(routine)
    },
  })

  return (
    <div className="bg-[var(--color-surface-02)] rounded-[var(--radius-lg)] p-4 space-y-5 border border-[var(--color-accent)]">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-[var(--color-text-primary)]">
          Asistente de rutina
        </h2>
        <button
          onClick={onCancel}
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xl leading-none"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>

      {/* Paso 1 — Nivel */}
      <div className="space-y-2">
        <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
          ¿Cuál es tu nivel?
        </p>
        <div className="grid grid-cols-3 gap-2">
          {LEVELS.map(l => (
            <button
              key={l.value}
              onClick={() => { setLevel(l.value); setDays(null) }}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-[var(--radius-md)] border transition-all text-center',
                level === l.value
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-dim)] text-[var(--color-accent)]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface-03)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]',
              )}
            >
              <span className="text-2xl">{l.emoji}</span>
              <span className="text-xs font-semibold">{l.label}</span>
              <span className="text-[10px] opacity-70 leading-tight">{l.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Paso 2 — Días */}
      <AnimatePresence>
        {level && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden space-y-2"
          >
            <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
              ¿Cuántos días por semana?
            </p>
            <div className="flex gap-2">
              {DAYS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDays(opt.value)}
                  disabled={!availableDays.includes(opt.value)}
                  className={cn(
                    'flex-1 h-12 rounded-[var(--radius-md)] border text-sm font-semibold transition-all',
                    days === opt.value
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-dim)] text-[var(--color-accent)]'
                      : 'border-[var(--color-border)] bg-[var(--color-surface-03)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]',
                    !availableDays.includes(opt.value) && 'opacity-30 pointer-events-none',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview del match */}
      <AnimatePresence>
        {match && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="rounded-[var(--radius-md)] bg-[var(--color-surface-03)] border border-[var(--color-border)] p-4 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-[var(--color-text-primary)]">{match.name}</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{match.description}</p>
              </div>
              <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap shrink-0">
                {match.daysPerWeek} días/sem
              </span>
            </div>
            <p className="text-xs italic text-[var(--color-accent)] border-l-2 border-[var(--color-accent)] pl-3">
              "{match.phrase}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Acciones */}
      <div className="flex gap-3">
        <Button variant="ghost" size="md" onClick={onCancel} className="flex-1 text-gray-300">
          Cancelar
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          disabled={!match}
          className="flex-1"
        >
          Guardar esta rutina
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-xs text-[var(--color-danger)] text-center">
          Error al guardar. Intenta de nuevo.
        </p>
      )}
    </div>
  )
}

import { useState } from 'react'
import { cn } from '@/shared/utils/cn'
import { Button } from '@/presentation/design-system/components/Button'
import type { LoggedSet } from '../stores/activeWorkout.store'

const RIR_OPTIONS = [0, 1, 2, 3, 4, 5]
const RIR_COLORS = ['#FF2D55', '#FF6B35', '#34C759', '#30D158', '#0A84FF', '#5856D6']
const RIR_LABELS = ['Fallo', 'Casi', 'Óptimo', 'Consv.', 'Fácil', 'Calent.']

function vibrate(pattern: number | number[]): void {
  if ('vibrate' in navigator) navigator.vibrate(pattern)
}

interface Props {
  exerciseName: string
  setNumber: number
  suggestedWeight?: number
  suggestedReps?: number
  unit?: 'kg' | 'lb'
  onLog: (set: Omit<LoggedSet, 'completedAt'>) => void
  onCancel?: () => void
}

export function SetLogger({
  exerciseName,
  setNumber,
  suggestedWeight = 0,
  suggestedReps = 10,
  unit = 'kg',
  onLog,
  onCancel,
}: Props) {
  const [weightStr, setWeightStr] = useState(String(suggestedWeight))
  const weight = parseFloat(weightStr) || 0
  const [reps, setReps] = useState(suggestedReps)
  const [rir, setRir] = useState(2)
  const [rpe, setRpe] = useState(8)
  const [notes, setNotes] = useState('')

  function handleLog() {
    vibrate(50)
    onLog({ setNumber, weight, reps, rir, rpe, notes: notes || undefined })
  }

  function adjustWeight(delta: number) {
    vibrate(20)
    setWeightStr(String(Math.max(0, Math.round((weight + delta) * 10) / 10)))
  }

  function adjustReps(delta: number) {
    vibrate(20)
    setReps(prev => Math.max(1, Math.min(100, prev + delta)))
  }

  return (
    <div className="bg-[var(--color-surface-02)] rounded-[var(--radius-lg)] p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">Serie</p>
          <h3 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
            #{setNumber} — {exerciseName}
          </h3>
        </div>
      </div>

      {/* Weight */}
      <div className="space-y-2">
        <label className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">Peso ({unit})</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => adjustWeight(-2.5)}
            className="h-14 w-14 rounded-[var(--radius-md)] bg-[var(--color-surface-03)] text-[var(--color-text-secondary)] text-xl font-bold hover:bg-[var(--color-surface-elevated)] active:scale-95 transition-all"
            aria-label="Reducir peso 2.5kg"
          >
            -
          </button>
          <input
            type="number"
            value={weightStr}
            onChange={e => setWeightStr(e.target.value)}
            className="flex-1 h-16 text-center font-mono text-4xl font-bold bg-transparent text-[var(--color-text-primary)] border-0 outline-none"
            inputMode="decimal"
            aria-label="Peso"
          />
          <button
            onClick={() => adjustWeight(2.5)}
            className="h-14 w-14 rounded-[var(--radius-md)] bg-[var(--color-surface-03)] text-[var(--color-accent)] text-xl font-bold hover:bg-[var(--color-surface-elevated)] active:scale-95 transition-all"
            aria-label="Aumentar peso 2.5kg"
          >
            +
          </button>
        </div>
        <div className="flex gap-2 justify-center">
          {[0.5, 1.25, 2.5, 5].map(v => (
            <button
              key={v}
              onClick={() => adjustWeight(v)}
              className="px-2 py-1 text-xs rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
            >
              +{v}
            </button>
          ))}
        </div>
      </div>

      {/* Reps */}
      <div className="space-y-2">
        <label className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">Repeticiones</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => adjustReps(-1)}
            className="h-14 w-14 rounded-[var(--radius-md)] bg-[var(--color-surface-03)] text-[var(--color-text-secondary)] text-xl font-bold hover:bg-[var(--color-surface-elevated)] active:scale-95 transition-all"
            aria-label="Reducir reps"
          >
            -
          </button>
          <span className="flex-1 text-center font-mono text-5xl font-bold text-[var(--color-text-primary)]">
            {reps}
          </span>
          <button
            onClick={() => adjustReps(1)}
            className="h-14 w-14 rounded-[var(--radius-md)] bg-[var(--color-surface-03)] text-[var(--color-accent)] text-xl font-bold hover:bg-[var(--color-surface-elevated)] active:scale-95 transition-all"
            aria-label="Aumentar reps"
          >
            +
          </button>
        </div>
      </div>

      {/* RIR */}
      <div className="space-y-2">
        <label className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
          RIR — Reps en Reserva
        </label>
        <div className="grid grid-cols-6 gap-1">
          {RIR_OPTIONS.map((r, i) => (
            <button
              key={r}
              onClick={() => { vibrate(30); setRir(r) }}
              className={cn(
                'h-12 rounded-[var(--radius-sm)] text-sm font-bold transition-all active:scale-95',
                rir === r ? 'text-black scale-105' : 'text-[var(--color-text-secondary)] bg-[var(--color-surface-03)]'
              )}
              style={rir === r ? { backgroundColor: RIR_COLORS[i] } : {}}
              aria-label={`RIR ${r}: ${RIR_LABELS[i]}`}
              aria-pressed={rir === r}
            >
              <div className="flex flex-col items-center">
                <span>{r}</span>
                <span className="text-[9px] leading-none opacity-80">{RIR_LABELS[i]}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RPE (optional) */}
      <div className="space-y-2">
        <label className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
          RPE (opcional)
        </label>
        <input
          type="range"
          min={6}
          max={10}
          step={0.5}
          value={rpe}
          onChange={e => setRpe(parseFloat(e.target.value))}
          className="w-full accent-[var(--color-accent)]"
          aria-label={`RPE ${rpe}`}
        />
        <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
          <span>6 — Ligero</span>
          <span className="text-[var(--color-text-secondary)] font-mono">RPE {rpe}</span>
          <span>10 — Máximo</span>
        </div>
      </div>

      {/* Notes */}
      <input
        type="text"
        placeholder="Notas (opcional)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        className="w-full bg-[var(--color-surface-03)] rounded-[var(--radius-md)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] border border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none transition-colors"
        aria-label="Notas de la serie"
      />

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <Button variant="ghost" size="md" onClick={onCancel} className="flex-1 text-gray-300">
            Cancelar
          </Button>
        )}
        <Button variant="primary" size="lg" onClick={handleLog} className="flex-1">
          ✓ Registrar Serie
        </Button>
      </div>
    </div>
  )
}

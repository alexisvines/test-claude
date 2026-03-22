/**
 * Mapa de Fatiga Muscular — feature exclusiva de Kova
 *
 * Muestra el estado de recuperación de cada grupo muscular en tiempo real,
 * calculado a partir del historial de entrenamientos recientes.
 * Basado en tasas de síntesis proteica muscular post-ejercicio (investigación 2020–2024).
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getContainer } from '@/infrastructure/container/DIContainer'
import { MUSCLE_GROUP_LABELS, type MuscleGroup } from '@/domain/value-objects/MuscleGroup'
import { MuscleDiagram } from '@/presentation/features/exercises/components/MuscleDiagram'

// ── Tasas de recuperación por músculo (horas hasta recuperación completa) ─────
// Basado en: Damas et al. 2016, Nosaka & Newton 2002, investigación RP Strength
const RECOVERY_HOURS: Record<MuscleGroup, number> = {
  biceps:     36,
  triceps:    36,
  calves:     36,
  forearms:   36,
  chest:      48,
  shoulders:  48,
  core:       40,
  traps:      48,
  back:       72,
  lats:       72,
  quadriceps: 72,
  hamstrings: 72,
  glutes:     72,
}

type RecoveryState = 'recovered' | 'ready' | 'recovering' | 'fatigued'

interface MuscleState {
  muscle: MuscleGroup
  fatiguePercent: number   // 0 = totalmente recuperado, 100 = máxima fatiga
  state: RecoveryState
  hoursSinceLastTraining: number | null
  lastTrainingLabel: string
}

const STATE_CONFIG: Record<RecoveryState, { color: string; label: string; emoji: string }> = {
  recovered:  { color: '#C8FF00', label: 'Listo',        emoji: '✓' },
  ready:      { color: '#22c55e', label: 'Casi listo',   emoji: '↑' },
  recovering: { color: '#f59e0b', label: 'Recuperando',  emoji: '⏳' },
  fatigued:   { color: '#ef4444', label: 'Descansando',  emoji: '😴' },
}

function getRecoveryState(fatiguePct: number): RecoveryState {
  if (fatiguePct < 20) return 'recovered'
  if (fatiguePct < 50) return 'ready'
  if (fatiguePct < 75) return 'recovering'
  return 'fatigued'
}

function formatHoursLabel(hours: number | null): string {
  if (hours === null) return 'Sin datos'
  if (hours < 1) return 'hace menos de 1h'
  if (hours < 24) return `hace ${Math.round(hours)}h`
  const days = Math.round(hours / 24)
  return `hace ${days}d`
}

export function MuscularFatigueMap({ athleteId }: { athleteId: string }) {
  const [expanded, setExpanded] = useState(true)
  const container = getContainer()

  const { data: muscleStates, isLoading } = useQuery({
    queryKey: ['muscleFatigue', athleteId],
    queryFn: async (): Promise<MuscleState[]> => {
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const [sessions, exercises] = await Promise.all([
        container.workoutRepo.findByDateRange(athleteId, sevenDaysAgo, now),
        container.exerciseRepo.findAll(),
      ])

      // Mapa exerciseId → músculos primarios
      const exerciseMuscleMap = new Map<string, MuscleGroup[]>()
      for (const ex of exercises) {
        exerciseMuscleMap.set(ex.id, ex.primaryMuscles as MuscleGroup[])
      }

      // Calcular última fecha de entrenamiento por músculo
      const lastTrainingDate = new Map<MuscleGroup, Date>()

      for (const session of sessions) {
        if (session.status !== 'completed') continue
        const sessionDate = new Date(session.startedAt)

        for (const set of session.sets) {
          const muscles = exerciseMuscleMap.get(set.exerciseId) ?? []
          for (const muscle of muscles) {
            const existing = lastTrainingDate.get(muscle)
            if (!existing || sessionDate > existing) {
              lastTrainingDate.set(muscle, sessionDate)
            }
          }
        }
      }

      // Calcular estado de fatiga para cada músculo
      return (Object.keys(RECOVERY_HOURS) as MuscleGroup[]).map(muscle => {
        const lastDate = lastTrainingDate.get(muscle)
        if (!lastDate) {
          return {
            muscle,
            fatiguePercent: 0,
            state: 'recovered' as RecoveryState,
            hoursSinceLastTraining: null,
            lastTrainingLabel: 'Sin entrenar esta semana',
          }
        }

        const hoursSince = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60)
        const recoveryHours = RECOVERY_HOURS[muscle]
        const fatiguePercent = Math.max(0, Math.min(100, (1 - hoursSince / recoveryHours) * 100))

        return {
          muscle,
          fatiguePercent,
          state: getRecoveryState(fatiguePercent),
          hoursSinceLastTraining: hoursSince,
          lastTrainingLabel: formatHoursLabel(hoursSince),
        }
      })
    },
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
  })

  // Separar listos vs. recuperando
  const trained = (muscleStates ?? []).filter(m => m.hoursSinceLastTraining !== null)
  const ready = trained.filter(m => m.state === 'recovered' || m.state === 'ready')
  const recovering = trained.filter(m => m.state === 'recovering' || m.state === 'fatigued')

  // Construir colorOverride para el diagrama
  const colorOverride: Partial<Record<MuscleGroup, string>> = {}
  for (const ms of trained) {
    colorOverride[ms.muscle] = STATE_CONFIG[ms.state].color
  }

  return (
    <div className="bg-[var(--color-surface-02)] rounded-[var(--radius-lg)] overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <div>
          <h2 className="font-display text-lg font-bold text-[var(--color-text-secondary)] uppercase tracking-wide flex items-center gap-2">
            Recuperación muscular
            <span className="text-base font-normal">🧬</span>
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Estado actual basado en tu historial
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isLoading && trained.length > 0 && (
            <div className="flex gap-1.5">
              {ready.length > 0 && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ color: '#C8FF00', backgroundColor: '#C8FF0020' }}>
                  {ready.length} ✓
                </span>
              )}
              {recovering.length > 0 && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ color: '#f59e0b', backgroundColor: '#f59e0b20' }}>
                  {recovering.length} ⏳
                </span>
              )}
            </div>
          )}
          <span className="text-[var(--color-text-muted)] text-sm">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-5">
          {isLoading && (
            <div className="h-40 rounded-xl bg-[var(--color-surface-03)] animate-pulse" />
          )}

          {!isLoading && trained.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-3xl mb-2">🧬</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Completa un entrenamiento para ver tu mapa de recuperación
              </p>
            </div>
          )}

          {!isLoading && trained.length > 0 && (
            <div className="space-y-4">
              {/* Diagrama corporal con colores de fatiga */}
              <div className="flex justify-center">
                <MuscleDiagram
                  primary={[]}
                  secondary={[]}
                  size="lg"
                  colorOverride={colorOverride}
                />
              </div>

              {/* Leyenda de estados */}
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(STATE_CONFIG) as [RecoveryState, typeof STATE_CONFIG[RecoveryState]][]).map(([state, cfg]) => (
                  <div key={state} className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cfg.color }}
                    />
                    <span className="text-[11px] text-[var(--color-text-secondary)]">{cfg.label}</span>
                  </div>
                ))}
              </div>

              {/* Resumen textual */}
              {ready.length > 0 && (
                <div className="rounded-xl p-3 border" style={{ borderColor: '#C8FF0030', backgroundColor: '#C8FF0010' }}>
                  <p className="text-xs font-semibold text-[var(--color-accent)] mb-1">
                    ✓ Listos para entrenar hoy
                  </p>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">
                    {ready.map(m => MUSCLE_GROUP_LABELS[m.muscle]).join(' · ')}
                  </p>
                </div>
              )}

              {recovering.length > 0 && (
                <div className="rounded-xl p-3 border border-[var(--color-border)] bg-[var(--color-surface-03)]">
                  <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                    ⏳ Aún recuperando
                  </p>
                  <div className="space-y-1">
                    {recovering.map(m => (
                      <div key={m.muscle} className="flex justify-between items-center">
                        <span className="text-[11px] text-[var(--color-text-secondary)]">
                          {MUSCLE_GROUP_LABELS[m.muscle]}
                        </span>
                        <span className="text-[10px] font-mono" style={{ color: STATE_CONFIG[m.state].color }}>
                          {m.lastTrainingLabel}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[9px] text-[var(--color-text-muted)] text-center">
                Basado en tasas de síntesis proteica muscular post-ejercicio · Damas et al. 2016
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

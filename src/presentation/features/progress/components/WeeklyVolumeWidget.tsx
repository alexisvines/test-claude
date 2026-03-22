import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getContainer } from '@/infrastructure/container/DIContainer'
import { MUSCLE_GROUP_LABELS, type MuscleGroup } from '@/domain/value-objects/MuscleGroup'
import { cn } from '@/shared/utils/cn'

// ── Rangos basados en investigación de Dr. Mike Israetel (RP Strength) ─────────
// MEV: Volumen mínimo efectivo · MAV: Volumen máximo adaptativo · MRV: Volumen máximo recuperable
const VOLUME_RANGES: Record<MuscleGroup, { mev: number; mav: number; mrv: number }> = {
  chest:      { mev: 6,  mav: 16, mrv: 22 },
  back:       { mev: 8,  mav: 18, mrv: 25 },
  lats:       { mev: 6,  mav: 16, mrv: 25 },
  shoulders:  { mev: 8,  mav: 14, mrv: 20 },
  biceps:     { mev: 6,  mav: 14, mrv: 20 },
  triceps:    { mev: 6,  mav: 14, mrv: 20 },
  forearms:   { mev: 4,  mav: 10, mrv: 16 },
  quadriceps: { mev: 8,  mav: 16, mrv: 25 },
  hamstrings: { mev: 6,  mav: 12, mrv: 20 },
  glutes:     { mev: 4,  mav: 12, mrv: 20 },
  calves:     { mev: 6,  mav: 14, mrv: 20 },
  core:       { mev: 0,  mav: 10, mrv: 20 },
  traps:      { mev: 4,  mav: 12, mrv: 20 },
}

type VolumeStatus = 'none' | 'low' | 'optimal' | 'high' | 'over'

function getStatus(sets: number, ranges: { mev: number; mav: number; mrv: number }): VolumeStatus {
  if (sets === 0) return 'none'
  if (sets < ranges.mev) return 'low'
  if (sets <= ranges.mav) return 'optimal'
  if (sets <= ranges.mrv) return 'high'
  return 'over'
}

const STATUS_CONFIG: Record<VolumeStatus, { color: string; bg: string; label: string }> = {
  none:    { color: 'var(--color-text-muted)',    bg: 'var(--color-surface-03)',    label: 'Sin entrenar' },
  low:     { color: '#ef4444',                    bg: '#ef444420',                  label: 'Bajo MEV' },
  optimal: { color: '#22c55e',                    bg: '#22c55e20',                  label: 'Óptimo' },
  high:    { color: '#f59e0b',                    bg: '#f59e0b20',                  label: 'Volumen alto' },
  over:    { color: '#ef4444',                    bg: '#ef444430',                  label: 'Sobre MRV' },
}

interface MuscleVolumeRow {
  muscle: MuscleGroup
  sets: number
  status: VolumeStatus
  ranges: { mev: number; mav: number; mrv: number }
}

function VolumeBar({ sets, ranges, status }: { sets: number; ranges: { mev: number; mav: number; mrv: number }; status: VolumeStatus }) {
  const config = STATUS_CONFIG[status]
  const pct = Math.min(100, (sets / ranges.mrv) * 100)
  const mevPct = (ranges.mev / ranges.mrv) * 100
  const mavPct = (ranges.mav / ranges.mrv) * 100

  return (
    <div className="relative h-2 rounded-full bg-[var(--color-surface-03)] overflow-visible">
      {/* Marcadores MEV y MAV */}
      <div
        className="absolute -top-1 bottom-0 w-px bg-white/30 z-10"
        style={{ left: `${mevPct}%`, height: '16px' }}
        title={`MEV: ${ranges.mev} series`}
      />
      <div
        className="absolute -top-1 bottom-0 w-px bg-[var(--color-accent)]/40 z-10"
        style={{ left: `${mavPct}%`, height: '16px' }}
        title={`MAV: ${ranges.mav} series`}
      />
      {/* Barra de progreso */}
      <div
        className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: config.color }}
      />
    </div>
  )
}

// ── Chip explicativo de cada término ─────────────────────────────────────────
function VolumeTermChip({ term, color, explanation }: { term: string; color: string; explanation: string }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      <span
        className="text-[10px] font-black px-1.5 py-0.5 rounded font-mono shrink-0 mt-0.5"
        style={{ backgroundColor: `${color}25`, color }}
      >
        {term}
      </span>
      <span className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">{explanation}</span>
    </div>
  )
}

export function WeeklyVolumeWidget({ athleteId }: { athleteId: string }) {
  const [expanded, setExpanded] = useState(true)
  const [showGlossary, setShowGlossary] = useState(false)
  const container = getContainer()

  const { data: muscleVolume, isLoading } = useQuery({
    queryKey: ['weeklyVolume', athleteId],
    queryFn: async (): Promise<MuscleVolumeRow[]> => {
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const [sessions, exercises] = await Promise.all([
        container.workoutRepo.findByDateRange(athleteId, sevenDaysAgo, now),
        container.exerciseRepo.findAll(),
      ])

      // Mapa rápido de exerciseId → muscle principal
      const exerciseMuscleMap = new Map<string, MuscleGroup>()
      for (const ex of exercises) {
        const primary = ex.primaryMuscles[0]
        if (primary) exerciseMuscleMap.set(ex.id, primary as MuscleGroup)
      }

      // Sumar series por músculo primario de sesiones completadas
      const setsPerMuscle = new Map<MuscleGroup, number>()
      for (const session of sessions) {
        if (session.status !== 'completed') continue
        for (const [exerciseId, count] of session.setCountByExercise) {
          const muscle = exerciseMuscleMap.get(exerciseId)
          if (muscle && muscle in VOLUME_RANGES) {
            setsPerMuscle.set(muscle, (setsPerMuscle.get(muscle) ?? 0) + count)
          }
        }
      }

      return (Object.keys(VOLUME_RANGES) as MuscleGroup[]).map(muscle => {
        const sets = setsPerMuscle.get(muscle) ?? 0
        const ranges = VOLUME_RANGES[muscle]
        return { muscle, sets, status: getStatus(sets, ranges), ranges }
      })
    },
    staleTime: 5 * 60 * 1000,
  })

  const rows = (muscleVolume ?? []).filter(r => r.sets > 0 || r.status === 'none')
  const trainedRows = rows.filter(r => r.sets > 0).sort((a, b) => b.sets - a.sets)
  const displayRows = trainedRows.length > 0 ? trainedRows : []

  const optimal = (muscleVolume ?? []).filter(r => r.status === 'optimal').length
  const low = (muscleVolume ?? []).filter(r => r.status === 'low').length
  const over = (muscleVolume ?? []).filter(r => r.status === 'over' || r.status === 'high').length

  return (
    <div className="bg-[var(--color-surface-02)] rounded-[var(--radius-lg)] overflow-hidden">
      {/* Header colapsable */}
      <button
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <div>
          <h2 className="font-display text-lg font-bold text-[var(--color-text-secondary)] uppercase tracking-wide">
            Volumen semanal
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Últimos 7 días · series por músculo
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isLoading && muscleVolume && (
            <div className="flex gap-1.5 items-center">
              {optimal > 0 && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ color: '#22c55e', backgroundColor: '#22c55e20' }}>
                  {optimal} ✓
                </span>
              )}
              {low > 0 && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ color: '#ef4444', backgroundColor: '#ef444420' }}>
                  {low} ↓
                </span>
              )}
              {over > 0 && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ color: '#f59e0b', backgroundColor: '#f59e0b20' }}>
                  {over} ↑
                </span>
              )}
            </div>
          )}
          <span className="text-[var(--color-text-muted)] text-sm">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 rounded-lg bg-[var(--color-surface-03)] animate-pulse" />
              ))}
            </div>
          )}

          {!isLoading && displayRows.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-3xl mb-2">📊</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Completa tu primer entrenamiento para ver el semáforo de volumen
              </p>
            </div>
          )}

          {!isLoading && displayRows.length > 0 && (
            <div className="space-y-3">
              {displayRows.map(({ muscle, sets, status, ranges }) => {
                const config = STATUS_CONFIG[status]
                return (
                  <div key={muscle} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">
                        {MUSCLE_GROUP_LABELS[muscle]}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ color: config.color, backgroundColor: config.bg }}
                        >
                          {config.label}
                        </span>
                        {/* series / MAV */}
                        <span className="font-mono text-xs text-[var(--color-text-muted)]">
                          {sets}<span className="opacity-50">/{ranges.mav}</span>
                        </span>
                      </div>
                    </div>
                    <VolumeBar sets={sets} ranges={ranges} status={status} />
                    {/* Etiquetas MEV / MAV debajo de la barra */}
                    <div className="relative h-3">
                      <span
                        className="absolute text-[9px] text-white/30 -translate-x-1/2"
                        style={{ left: `${(ranges.mev / ranges.mrv) * 100}%` }}
                      >
                        MEV
                      </span>
                      <span
                        className="absolute text-[9px] text-[var(--color-accent)]/40 -translate-x-1/2"
                        style={{ left: `${(ranges.mav / ranges.mrv) * 100}%` }}
                      >
                        MAV
                      </span>
                    </div>
                  </div>
                )
              })}

              {/* Leyenda + toggle glosario */}
              <div className="pt-2 border-t border-[var(--color-border)]">
                <div className="flex flex-wrap gap-x-4 gap-y-1 items-center">
                  {(['low', 'optimal', 'high', 'over'] as VolumeStatus[]).map(s => (
                    <span
                      key={s}
                      className={cn('text-[10px] flex items-center gap-1')}
                      style={{ color: STATUS_CONFIG[s].color }}
                    >
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: STATUS_CONFIG[s].color }} />
                      {STATUS_CONFIG[s].label}
                    </span>
                  ))}
                  <button
                    onClick={e => { e.stopPropagation(); setShowGlossary(g => !g) }}
                    className="ml-auto text-[10px] text-[var(--color-accent)]/70 hover:text-[var(--color-accent)] transition-colors flex items-center gap-1"
                  >
                    {showGlossary ? '▲' : 'ⓘ'} ¿Qué significa esto?
                  </button>
                </div>

                {/* Glosario desplegable */}
                {showGlossary && (
                  <div className="mt-3 rounded-xl bg-[var(--color-surface-03)] p-3 space-y-0.5 border border-[var(--color-border)]">
                    <p className="text-[10px] uppercase tracking-wide font-bold text-[var(--color-text-muted)] mb-2">
                      Glosario de volumen — Dr. Mike Israetel (RP Strength)
                    </p>
                    <VolumeTermChip
                      term="MEV"
                      color="#f59e0b"
                      explanation="Mínimo Efectivo de Volumen — el mínimo de series semanales para que el músculo crezca. Por debajo no hay adaptación."
                    />
                    <VolumeTermChip
                      term="MAV"
                      color="#C8FF00"
                      explanation="Máximo Adaptativo de Volumen — el punto ideal donde más creces. Entre MEV y MAV es la zona óptima."
                    />
                    <VolumeTermChip
                      term="MRV"
                      color="#ef4444"
                      explanation="Máximo Recuperable de Volumen — el límite que tu cuerpo puede absorber. Superarlo produce sobreentrenamiento."
                    />
                    <p className="text-[10px] text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-border)] mt-2">
                      El número junto a cada músculo (ej. 10/16) muestra tus series esta semana vs. tu MAV objetivo.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

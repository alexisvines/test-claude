/**
 * Panel de Proyección de Marca Personal
 *
 * Muestra cuándo el usuario alcanzará su próximo PR para cada ejercicio
 * principal, usando regresión lineal sobre el 1RM estimado (Epley).
 */
import { useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'
import { usePRProjections } from '../hooks/usePRProjections'
import type { PRProjection } from '@/domain/services/PRProjectionEngine'
import { getContainer } from '@/infrastructure/container/DIContainer'
import { useQuery } from '@tanstack/react-query'

const CONFIDENCE_CONFIG = {
  high:   { label: 'Alta confianza',     color: '#C8FF00' },
  medium: { label: 'Progresando bien',   color: '#f59e0b' },
  low:    { label: 'Datos insuficientes', color: '#8C8C8C' },
}

function ConfidenceChip({ confidence }: { confidence: PRProjection['confidence'] }) {
  const cfg = CONFIDENCE_CONFIG[confidence]
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ color: cfg.color, backgroundColor: `${cfg.color}20` }}
    >
      {cfg.label}
    </span>
  )
}

function PRChart({ projection }: { projection: PRProjection }) {
  const historyData = projection.history.map(p => ({
    idx: p.sessionIndex,
    real: p.oneRepMax,
  }))

  // Añadir punto proyectado
  const projected = projection.weeksUntilPR !== null
    ? [
        ...historyData,
        {
          idx: historyData.length + (projection.weeksUntilPR ?? 0),
          real: null,
          proyectado: projection.nextMilestone,
        },
      ]
    : historyData

  const allValues = [
    ...historyData.map(d => d.real),
    projection.nextMilestone,
  ].filter(Boolean) as number[]
  const minVal = Math.max(0, Math.min(...allValues) - 10)
  const maxVal = Math.max(...allValues) + 5

  return (
    <ResponsiveContainer width="100%" height={100}>
      <LineChart data={projected} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="idx" hide />
        <YAxis
          domain={[minVal, maxVal]}
          tick={{ fontSize: 9, fill: '#8C8C8C' }}
          tickLine={false}
          width={32}
          unit="kg"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            fontSize: 11,
          }}
          formatter={(v: number) => [`${v}kg`, '']}
          labelFormatter={() => ''}
        />
        {projection.nextMilestone && (
          <ReferenceLine
            y={projection.nextMilestone}
            stroke="#C8FF00"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
          />
        )}
        <Line
          type="monotone"
          dataKey="real"
          stroke="#C8FF00"
          strokeWidth={2}
          dot={{ r: 2, fill: '#C8FF00' }}
          connectNulls={false}
          name="1RM"
        />
        <Line
          type="monotone"
          dataKey="proyectado"
          stroke="#C8FF00"
          strokeWidth={1.5}
          strokeDasharray="6 4"
          dot={{ r: 4, fill: '#C8FF00', stroke: '#000', strokeWidth: 1.5 }}
          connectNulls={false}
          name="Proyección"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

function PRCard({
  projection,
  exerciseName,
}: {
  projection: PRProjection
  exerciseName: string
}) {
  const [expanded, setExpanded] = useState(false)
  const progress = Math.min(
    100,
    ((projection.current1RM - (projection.nextMilestone - 5)) /
      5) *
      100
  )

  return (
    <div className="bg-[var(--color-surface-03)] rounded-[var(--radius-md)] p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[var(--color-text-primary)] text-sm truncate">{exerciseName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <ConfidenceChip confidence={projection.confidence} />
            {projection.isPRWindowNow && (
              <span className="text-[10px] font-bold text-[var(--color-accent)] animate-pulse">
                🎯 ¡Semana de PR!
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono text-xl font-bold text-[var(--color-accent)]">
            {projection.current1RM}
            <span className="text-xs text-[var(--color-text-muted)]">kg</span>
          </p>
          <p className="text-[10px] text-[var(--color-text-muted)]">1RM actual</p>
        </div>
      </div>

      {/* Barra de progreso al siguiente hito */}
      <div>
        <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] mb-1">
          <span>{projection.nextMilestone - 5}kg</span>
          <span className="text-[var(--color-accent)] font-semibold">
            Meta: {projection.nextMilestone}kg
          </span>
        </div>
        <div className="h-1.5 bg-[var(--color-surface-02)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.max(4, progress)}%`,
              backgroundColor: 'var(--color-accent)',
            }}
          />
        </div>
      </div>

      {/* Predicción */}
      {projection.weeksUntilPR !== null ? (
        <div className="flex items-center gap-3">
          <div className="flex-1 text-center rounded-lg p-2 bg-[var(--color-surface-02)]">
            <p className="font-mono text-lg font-bold text-[var(--color-text-primary)]">
              {projection.weeksUntilPR}
            </p>
            <p className="text-[10px] text-[var(--color-text-muted)]">semanas</p>
          </div>
          <div className="flex-1 text-center rounded-lg p-2 bg-[var(--color-surface-02)]">
            <p className="font-mono text-sm font-bold text-[var(--color-text-primary)]">
              +{projection.weeklyGainKg}
            </p>
            <p className="text-[10px] text-[var(--color-text-muted)]">kg/semana</p>
          </div>
          {projection.targetDate && (
            <div className="flex-1 text-center rounded-lg p-2 bg-[var(--color-surface-02)]">
              <p className="font-mono text-sm font-bold text-[var(--color-text-primary)]">
                {projection.targetDate.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
              </p>
              <p className="text-[10px] text-[var(--color-text-muted)]">fecha est.</p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-[var(--color-text-muted)] text-center">
          Mantén la consistencia para proyectar tu PR
        </p>
      )}

      {/* Toggle gráfico */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-[11px] text-[var(--color-text-muted)] flex items-center justify-center gap-1"
      >
        {expanded ? '▲ Ocultar gráfico' : '▼ Ver historial de 1RM'}
      </button>

      {expanded && <PRChart projection={projection} />}
    </div>
  )
}

export function PRProjectionPanel({ athleteId }: { athleteId: string }) {
  const container = getContainer()
  const { data: projections = [], isLoading } = usePRProjections(athleteId)

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises', 'all'],
    queryFn: () => container.exerciseRepo.findAll(),
    staleTime: Infinity,
  })

  const exerciseNameMap = new Map(exercises.map(e => [e.id, e.nameEs]))

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="h-32 rounded-[var(--radius-md)] bg-[var(--color-surface-03)] animate-pulse" />
        ))}
      </div>
    )
  }

  if (projections.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-3xl mb-2">🎯</p>
        <p className="text-sm text-[var(--color-text-muted)]">
          Entrena 3 veces por ejercicio para ver tu proyección de PR
        </p>
      </div>
    )
  }

  const hasPRWindow = projections.some(p => p.isPRWindowNow)

  return (
    <div className="space-y-3">
      {hasPRWindow && (
        <div
          className="rounded-[var(--radius-md)] p-3 text-sm font-semibold border"
          style={{
            borderColor: '#C8FF0040',
            backgroundColor: '#C8FF0015',
            color: '#C8FF00',
          }}
        >
          🎯 Esta semana tienes una ventana de PR — fatiga baja y tendencia al alza
        </div>
      )}

      {projections.map(proj => (
        <PRCard
          key={proj.exerciseId}
          projection={proj}
          exerciseName={exerciseNameMap.get(proj.exerciseId) ?? proj.exerciseId}
        />
      ))}

      <p className="text-[9px] text-[var(--color-text-muted)] text-center">
        Proyección basada en fórmula Epley (1RM) + regresión lineal · actualizado cada 15 min
      </p>
    </div>
  )
}

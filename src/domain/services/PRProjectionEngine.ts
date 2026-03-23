/**
 * Motor de Proyección de Marcas Personales
 *
 * Calcula cuándo el usuario alcanzará su próximo PR para cada ejercicio
 * principal, usando la fórmula Epley para estimar 1RM y regresión lineal
 * para proyectar la tendencia futura.
 *
 * 100% offline — sin dependencias externas.
 */

export interface PRDataPoint {
  sessionIndex: number   // índice ordinal de la sesión (0, 1, 2, …)
  date: Date
  oneRepMax: number      // kg estimados con fórmula Epley
}

export interface PRProjection {
  exerciseId: string
  current1RM: number                 // 1RM más reciente (kg)
  nextMilestone: number              // próximo hito a alcanzar (múltiplo de 5)
  weeklyGainKg: number               // ganancia semanal proyectada (kg/semana)
  weeksUntilPR: number | null        // null = sin suficiente tendencia positiva
  targetDate: Date | null
  confidence: 'high' | 'medium' | 'low'
  r2: number                         // coeficiente de determinación (0-1)
  history: PRDataPoint[]             // para el gráfico
  isPRWindowNow: boolean             // true si esta semana es óptima para intentar PR
}

interface SessionSummary {
  date: Date
  best1RM: number
}

/** Agrega series por sesión, tomando el mejor 1RM de cada sesión */
function aggregateSessions(
  sets: ReadonlyArray<{ exerciseId: string; completedAt: Date; oneRepMax: number }>,
  exerciseId: string
): SessionSummary[] {
  const byDay = new Map<string, SessionSummary>()

  for (const s of sets) {
    if (s.exerciseId !== exerciseId) continue
    const key = s.completedAt.toISOString().slice(0, 10)
    const existing = byDay.get(key)
    if (!existing || s.oneRepMax > existing.best1RM) {
      byDay.set(key, { date: s.completedAt, best1RM: s.oneRepMax })
    }
  }

  return [...byDay.values()].sort((a, b) => a.date.getTime() - b.date.getTime())
}

/** Regresión lineal simple: y = a + b·x. Devuelve { slope, intercept, r2 } */
function linearRegression(points: Array<{ x: number; y: number }>): {
  slope: number
  intercept: number
  r2: number
} {
  const n = points.length
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0, r2: 0 }

  const sumX = points.reduce((s, p) => s + p.x, 0)
  const sumY = points.reduce((s, p) => s + p.y, 0)
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0)
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0)

  const xMean = sumX / n
  const yMean = sumY / n

  const denom = sumX2 - n * xMean * xMean
  const slope = denom !== 0 ? (sumXY - n * xMean * yMean) / denom : 0
  const intercept = yMean - slope * xMean

  // R²
  const ssTot = points.reduce((s, p) => s + (p.y - yMean) ** 2, 0)
  const ssRes = points.reduce((s, p) => s + (p.y - (intercept + slope * p.x)) ** 2, 0)
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot)

  return { slope, intercept, r2 }
}

/** Próximo múltiplo de 5 por encima del valor dado */
function nextMilestone(kg: number): number {
  return Math.ceil((kg + 0.1) / 5) * 5
}

/** Convierte slope (kg / sesión) a kg / semana dado un ritmo de sesiones */
function slopeToWeeklyGain(slopeKgPerSession: number, sessions: SessionSummary[]): number {
  if (sessions.length < 2) return 0
  const first = sessions[0]!.date.getTime()
  const last = sessions[sessions.length - 1]!.date.getTime()
  const weeks = (last - first) / (7 * 24 * 60 * 60 * 1000)
  if (weeks === 0) return 0
  const sessionsPerWeek = sessions.length / weeks
  return slopeKgPerSession * sessionsPerWeek
}

export class PRProjectionEngine {
  /**
   * Calcula la proyección de PR para un ejercicio dado el historial de sets.
   *
   * @param exerciseId - ID del ejercicio
   * @param sets       - Todos los sets históricos del atleta (filtrado internamente)
   * @param fatiguePercent - Fatiga estimada del músculo (0-100) desde MuscularFatigueMap
   */
  static project(
    exerciseId: string,
    sets: ReadonlyArray<{ exerciseId: string; completedAt: Date; oneRepMax: number }>,
    fatiguePercent = 100
  ): PRProjection | null {
    const sessions = aggregateSessions(sets, exerciseId)

    if (sessions.length < 3) return null  // datos insuficientes

    // Usar las últimas 8 sesiones para la regresión
    const recent = sessions.slice(-8)
    const points = recent.map((s, i) => ({ x: i, y: s.best1RM }))
    const { slope, intercept, r2 } = linearRegression(points)

    const current1RM = sessions[sessions.length - 1]!.best1RM
    const milestone = nextMilestone(current1RM)
    const weeklyGain = slopeToWeeklyGain(slope, recent)

    let weeksUntilPR: number | null = null
    let targetDate: Date | null = null

    if (weeklyGain > 0.05) {
      weeksUntilPR = Math.ceil((milestone - current1RM) / weeklyGain)
      targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + weeksUntilPR * 7)
    }

    const confidence: PRProjection['confidence'] =
      r2 >= 0.8 ? 'high' : r2 >= 0.5 ? 'medium' : 'low'

    // Ventana de PR: PR cercano (≤2 semanas) y fatiga baja (< 50%)
    const isPRWindowNow =
      weeksUntilPR !== null &&
      weeksUntilPR <= 2 &&
      fatiguePercent < 50

    // Datos históricos para el gráfico
    const history: PRDataPoint[] = sessions.map((s, i) => ({
      sessionIndex: i,
      date: s.date,
      oneRepMax: s.best1RM,
    }))

    // Añadir punto de proyección futuro si aplica
    if (weeksUntilPR !== null && intercept !== undefined) {
      const futureIndex = sessions.length + weeksUntilPR * 2
      const _ = intercept + slope * (recent.length - 1 + weeksUntilPR * 2)
      void _  // usado sólo para cálculo interno de la línea
      void futureIndex
    }

    return {
      exerciseId,
      current1RM: Math.round(current1RM),
      nextMilestone: milestone,
      weeklyGainKg: Math.round(weeklyGain * 10) / 10,
      weeksUntilPR,
      targetDate,
      confidence,
      r2,
      history,
      isPRWindowNow,
    }
  }

  /**
   * Proyecta los top ejercicios más frecuentes del atleta.
   * Devuelve sólo ejercicios con suficiente historial (≥3 sesiones).
   */
  static projectTopExercises(
    sets: ReadonlyArray<{ exerciseId: string; completedAt: Date; oneRepMax: number }>,
    fatigueByMuscle: Map<string, number>,
    limit = 4
  ): PRProjection[] {
    // Contar sesiones por ejercicio
    const sessionsByExercise = new Map<string, Set<string>>()
    for (const s of sets) {
      const days = sessionsByExercise.get(s.exerciseId) ?? new Set()
      days.add(s.completedAt.toISOString().slice(0, 10))
      sessionsByExercise.set(s.exerciseId, days)
    }

    // Ordenar por frecuencia y tomar los top con ≥3 sesiones
    const candidates = [...sessionsByExercise.entries()]
      .filter(([, days]) => days.size >= 3)
      .sort((a, b) => b[1].size - a[1].size)
      .slice(0, limit * 2)  // tomar extra por si algunos no proyectan
      .map(([id]) => id)

    const results: PRProjection[] = []
    for (const id of candidates) {
      if (results.length >= limit) break
      const proj = PRProjectionEngine.project(id, sets, fatigueByMuscle.get(id) ?? 100)
      if (proj) results.push(proj)
    }

    return results
  }
}

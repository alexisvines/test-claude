import type { IAIEvaluationPort, WorkoutContext, AIWorkoutEvaluation } from '../../application/ports/IAIEvaluationPort'

export class OfflineAIAdapter implements IAIEvaluationPort {
  async evaluateWorkout(context: WorkoutContext): Promise<AIWorkoutEvaluation> {
    const totalSets = context.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)
    const avgRIR = this.calcAvgRIR(context)
    const score = this.calculateScore(totalSets, avgRIR, context.durationMinutes, context.totalPRsToday)

    return {
      score,
      scoreExplanation: this.buildScoreExplanation(score, totalSets, avgRIR),
      praises: this.buildPraises(context, avgRIR),
      improvements: this.buildImprovements(avgRIR, context),
      nextSession: this.buildNextSession(avgRIR, context),
      recoveryAdvice: this.buildRecoveryAdvice(context.durationMinutes, totalSets),
      weeklyPattern: 'Basado en análisis offline — conecta con IA para análisis detallado.',
    }
  }

  async chat(messages: Array<{ role: 'user' | 'assistant'; content: string }>, workoutContext?: WorkoutContext): Promise<string> {
    const lastMessage = messages[messages.length - 1]?.content ?? ''
    const lowerMsg = lastMessage.toLowerCase()

    if (lowerMsg.includes('deload') || lowerMsg.includes('descanso')) {
      return 'Un deload es una reducción planificada del volumen o intensidad. Se recomienda cada 4-6 semanas de entrenamiento intenso, reduciendo el peso un 40-50% y el volumen un 50%. Esto permite la recuperación del sistema nervioso central y los tejidos.'
    }
    if (lowerMsg.includes('volumen') || lowerMsg.includes('series')) {
      return 'El volumen óptimo de hipertrofia es de 10-20 series por grupo muscular por semana. Principiantes se benefician de 10-12 series, intermedios de 14-16 series, y avanzados pueden tolerar 18-20 o más. Aumenta gradualmente para evitar el sobreentrenamiento.'
    }
    if (lowerMsg.includes('proteína') || lowerMsg.includes('dieta') || lowerMsg.includes('nutrición')) {
      return 'Para hipertrofia, consume 1.6-2.2g de proteína por kg de peso corporal. Distribuye las proteínas en 3-4 comidas a lo largo del día. El total calórico debe ser ligeramente superior al mantenimiento (superávit de 200-300 kcal) para maximizar la ganancia muscular.'
    }
    if (lowerMsg.includes('rir') || lowerMsg.includes('rpe')) {
      return 'RIR (Reps In Reserve) indica cuántas repeticiones te quedan antes del fallo. RIR 2 es el punto óptimo para hipertrofia: suficiente esfuerzo para estimular el crecimiento pero sin agotar el sistema nervioso. RPE 8-8.5 equivale aproximadamente a RIR 2.'
    }
    if (workoutContext) {
      return `He analizado tu entrenamiento de hoy (${context_summary(workoutContext)}). Para una análisis más detallado y personalizado, configura tu clave de API de Gemini o Claude en Ajustes.`
    }
    return 'Estoy en modo offline. Para respuestas más detalladas y personalizadas, configura tu clave de API en Ajustes → IA Coach. Te puedo ayudar con preguntas sobre deload, volumen, nutrición, RIR/RPE y más.'
  }

  private calcAvgRIR(context: WorkoutContext): number {
    let total = 0
    let count = 0
    for (const ex of context.exercises) {
      for (const set of ex.sets) {
        total += set.rir
        count++
      }
    }
    return count > 0 ? total / count : 2
  }

  private calculateScore(sets: number, avgRIR: number, duration: number, prs: number): number {
    let score = 50

    // Sets (más sets = más puntos hasta un máximo)
    score += Math.min(20, sets * 1.5)

    // RIR óptimo es 2
    const rirScore = 10 - Math.abs(avgRIR - 2) * 5
    score += Math.max(0, rirScore)

    // Duración razonable (45-90 min es óptimo)
    if (duration >= 30 && duration <= 120) score += 10
    else if (duration > 120) score -= 5

    // PRs
    score += prs * 5

    return Math.round(Math.min(100, Math.max(0, score)))
  }

  private buildScoreExplanation(score: number, sets: number, avgRIR: number): string {
    if (score >= 80) return `Excelente sesión. ${sets} series con RIR promedio de ${avgRIR.toFixed(1)} — intensidad óptima.`
    if (score >= 60) return `Buena sesión. ${sets} series completadas. Considera ajustar la intensidad (RIR promedio: ${avgRIR.toFixed(1)}).`
    return `Sesión completada con ${sets} series. Hay margen de mejora en la intensidad y el volumen.`
  }

  private buildPraises(context: WorkoutContext, avgRIR: number): string[] {
    const praises: string[] = []
    if (context.exercises.length >= 4) praises.push('Buena selección de ejercicios para cobertura muscular completa')
    if (avgRIR >= 1.5 && avgRIR <= 3) praises.push('Intensidad dentro del rango óptimo para hipertrofia')
    if (context.totalPRsToday > 0) praises.push(`¡Lograste ${context.totalPRsToday} récord${context.totalPRsToday > 1 ? 's' : ''} personal${context.totalPRsToday > 1 ? 'es' : ''} hoy!`)
    if (context.durationMinutes >= 30 && context.durationMinutes <= 90) praises.push('Duración de entrenamiento en el rango ideal')
    if (praises.length === 0) praises.push('Completaste tu entrenamiento — ¡la consistencia es clave!')
    return praises.slice(0, 3)
  }

  private buildImprovements(avgRIR: number, context: WorkoutContext): string[] {
    const improvements: string[] = []
    if (avgRIR > 3) improvements.push('Aumenta la intensidad — tu RIR promedio sugiere que puedes esforzarte más')
    if (avgRIR < 1) improvements.push('Considera bajar el peso — un RIR tan bajo aumenta el riesgo de sobreentrenamiento')
    if (context.durationMinutes > 120) improvements.push('El entrenamiento fue muy largo — considera reducir los tiempos de descanso')
    if (context.exercises.length < 3) improvements.push('Añade más variedad de ejercicios para una estimulación muscular completa')
    if (improvements.length === 0) improvements.push('Mantén la consistencia y aplica sobrecarga progresiva gradualmente')
    return improvements.slice(0, 3)
  }

  private buildNextSession(avgRIR: number, _context: WorkoutContext): string {
    if (avgRIR >= 2) {
      return 'Considera aumentar el peso en 2.5kg (ejercicios de tren superior) o 5kg (tren inferior) si completaste todas las series en el rango superior de reps.'
    }
    return 'Mantén el peso actual y trabaja para alcanzar la parte superior del rango de repeticiones antes de progresar.'
  }

  private buildRecoveryAdvice(duration: number, sets: number): string {
    if (sets > 20 || duration > 90) {
      return 'Sesión de alto volumen. Prioriza el sueño (7-9 horas), hidratación (2-3L de agua) y un mínimo de 48 horas antes de entrenar los mismos músculos.'
    }
    return 'Buena recuperación incluye 7-9 horas de sueño, hidratación adecuada y una ingesta de proteínas de 1.6-2.2g/kg de peso corporal.'
  }
}

function context_summary(context: WorkoutContext): string {
  const totalSets = context.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)
  return `${context.exercises.length} ejercicios, ${totalSets} series, ${context.durationMinutes} minutos`
}

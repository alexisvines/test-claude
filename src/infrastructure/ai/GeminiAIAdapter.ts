import type { IAIEvaluationPort, WorkoutContext, AIWorkoutEvaluation } from '../../application/ports/IAIEvaluationPort'
import { OfflineAIAdapter } from './OfflineAIAdapter'

const SYSTEM_PROMPT = `Eres un coach de fuerza experto certificado (NSCA-CSCS) que habla español.
Analiza entrenamientos de forma directa, práctica y motivadora.
Usa términos técnicos cuando sea necesario pero explica de forma accesible.
Responde siempre en español.`

export class GeminiAIAdapter implements IAIEvaluationPort {
  private readonly fallback = new OfflineAIAdapter()

  constructor(private readonly apiKey: string) {}

  async evaluateWorkout(context: WorkoutContext): Promise<AIWorkoutEvaluation> {
    if (!this.apiKey) return this.fallback.evaluateWorkout(context)

    const prompt = this.buildEvaluationPrompt(context)

    try {
      const response = await this.callGemini(prompt, true)
      return this.parseEvaluation(response)
    } catch {
      return this.fallback.evaluateWorkout(context)
    }
  }

  async chat(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    workoutContext?: WorkoutContext
  ): Promise<string> {
    if (!this.apiKey) return this.fallback.chat(messages, workoutContext)

    const systemContext = workoutContext
      ? `\n\nContexto del último entrenamiento:\n${JSON.stringify(workoutContext, null, 2)}`
      : ''

    const fullSystem = SYSTEM_PROMPT + systemContext

    try {
      const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: fullSystem }] },
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            },
          }),
        }
      )

      if (!response.ok) throw new Error(`Gemini API error: ${response.status}`)
      const data = await response.json() as GeminiResponse
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No se pudo obtener respuesta.'
    } catch {
      return this.fallback.chat(messages, workoutContext)
    }
  }

  private buildEvaluationPrompt(context: WorkoutContext): string {
    const exerciseSummary = context.exercises.map(ex => {
      const setsSummary = ex.sets.map(s =>
        `${s.weight}kg × ${s.reps} reps (RIR ${s.rir}, RPE ${s.rpe})`
      ).join(', ')
      return `- ${ex.exerciseName}: ${setsSummary}`
    }).join('\n')

    return `Analiza este entrenamiento y responde SOLO con JSON válido:

ATLETA: ${context.athleteName}
DURACIÓN: ${context.durationMinutes} minutos
SESIONES PREVIAS: ${context.previousSessions}
PRs HOY: ${context.totalPRsToday}

EJERCICIOS:
${exerciseSummary}

Responde ÚNICAMENTE con este JSON (sin markdown, sin explicaciones fuera del JSON):
{
  "score": <número 0-100>,
  "scoreExplanation": "<explicación del score en 1-2 oraciones>",
  "praises": ["<elogio 1>", "<elogio 2>", "<elogio 3>"],
  "improvements": ["<mejora 1>", "<mejora 2>", "<mejora 3>"],
  "nextSession": "<plan específico para la próxima sesión>",
  "recoveryAdvice": "<consejo de recuperación>",
  "weeklyPattern": "<análisis del patrón semanal>"
}`
  }

  private async callGemini(prompt: string, jsonMode: boolean): Promise<string> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: jsonMode ? 0.3 : 0.7,
            maxOutputTokens: 2048,
            ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
          },
        }),
      }
    )

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`)
    const data = await response.json() as GeminiResponse
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  }

  private parseEvaluation(raw: string): AIWorkoutEvaluation {
    try {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      return JSON.parse(cleaned) as AIWorkoutEvaluation
    } catch {
      return {
        score: 70,
        scoreExplanation: 'Evaluación completada.',
        praises: ['Completaste tu entrenamiento'],
        improvements: ['Registra más datos para análisis detallado'],
        nextSession: 'Continúa con tu programa actual.',
        recoveryAdvice: 'Duerme 7-9 horas y mantente hidratado.',
        weeklyPattern: 'Sigue tu rutina planificada.',
      }
    }
  }
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
}

import type { IAIEvaluationPort, WorkoutContext, AIWorkoutEvaluation } from '../../application/ports/IAIEvaluationPort'
import { OfflineAIAdapter } from './OfflineAIAdapter'
import type { GenerateMesocycleCommand, MesocycleAIResponse } from '../../application/commands/GenerateMesocycle/GenerateMesocycleCommand'

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

  async generateMesocycle(command: GenerateMesocycleCommand): Promise<MesocycleAIResponse | null> {
    if (!this.apiKey) return null
    const goalLabels: Record<string, string> = {
      strength: 'Fuerza máxima', hypertrophy: 'Hipertrofia', 'strength-hypertrophy': 'Fuerza + músculo',
    }
    const levelLabels: Record<string, string> = {
      beginner: 'Principiante (<1 año)', intermediate: 'Intermedio (1-3 años)', advanced: 'Avanzado (3+ años)',
    }
    const equipmentLabels: Record<string, string> = {
      barbell: 'Barra + discos', dumbbell: 'Mancuernas', machines: 'Máquinas', bodyweight: 'Peso corporal',
    }
    const prs = command.currentPRs
      ? `Sentadilla: ${command.currentPRs.squat ?? 'N/A'}kg, Press banca: ${command.currentPRs.bench ?? 'N/A'}kg, Peso muerto: ${command.currentPRs.deadlift ?? 'N/A'}kg`
      : 'No proporcionados'

    const prompt = `Eres un coach certificado NSCA-CSCS. Genera un mesociclo de entrenamiento de fuerza de 8 semanas.

OBJETIVO: ${goalLabels[command.goal] ?? command.goal}
EQUIPO: ${command.equipment.map(e => equipmentLabels[e] ?? e).join(', ')}
DÍAS POR SEMANA: ${command.daysPerWeek}
NIVEL: ${levelLabels[command.level] ?? command.level}
PRs ACTUALES: ${prs}

Reglas:
- Los días de descanso tienen isRestDay: true y exercises: []
- Los exerciseId deben ser slugs en inglés con guiones (ej: barbell-bench-press, barbell-squat, dumbbell-curl)
- Incluye semana de deload en la semana 8 (rirTarget 3-4, sets reducidos)
- El array "days" tiene exactamente 7 elementos (días de la semana, lunes a domingo)
- restSeconds: 90-240 según intensidad
- progressionMethod: "double-progression" o "linear"

Responde ÚNICAMENTE con JSON válido (sin markdown):
{
  "name": "Mesociclo IA — <objetivo> 8 semanas",
  "weeks": 8,
  "days": [
    {
      "name": "Día A — Empuje",
      "isRestDay": false,
      "exercises": [
        {
          "exerciseId": "barbell-bench-press",
          "sets": 4,
          "repRangeMin": 6,
          "repRangeMax": 10,
          "rirTarget": 2,
          "restSeconds": 180,
          "progressionMethod": "double-progression"
        }
      ]
    },
    { "name": "Descanso", "isRestDay": true, "exercises": [] }
  ]
}`

    try {
      const raw = await this.callGemini(prompt, true)
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      return JSON.parse(cleaned) as MesocycleAIResponse
    } catch {
      return null
    }
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

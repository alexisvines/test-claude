import { z } from 'zod'
import type { Routine } from './entities/Routine'

// ─── Core types ───────────────────────────────────────────────────────────────

export type Gender = 'male' | 'female'
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced'
export type TrainingFrequency = 3 | 5 | 6
export type PrimaryGoal = 'fat-loss' | 'muscle-gain' | 'strength' | 'recomposition' | 'performance'
export type AgeGroup = 'young' | 'adult' | 'mature' | 'senior'

// ─── PersonalizationProfile ───────────────────────────────────────────────────
// This object is designed to be serializable as an AI prompt input.
// When connecting an AI generator, pass this directly as a structured JSON input.

export interface PersonalizationProfile {
  gender: Gender
  age: number
  weightKg: number
  heightCm: number
  bmi: number             // auto-calculated: weightKg / (heightCm/100)²
  ageGroup: AgeGroup      // <25='young' | 25-40='adult' | 40-50='mature' | 50+='senior'
  level: FitnessLevel
  trainingFrequency: TrainingFrequency
  primaryGoal: PrimaryGoal
  muscleFocus: string[]   // empty = no specific emphasis
}

// ─── Cardio ───────────────────────────────────────────────────────────────────

export interface CardioModality {
  type: 'LISS' | 'HIIT' | 'Moderate'
  durationMinutes: number
  intensityNote: string
}

export interface CardioProtocol {
  sessionsPerWeek: number
  modalities: CardioModality[]
  timing: string
  hrZone?: { low: number; high: number }
  notes: string[]
}

// ─── Output ───────────────────────────────────────────────────────────────────

export interface RoutineOutput {
  routine: Routine
  cardioProtocol: CardioProtocol
  recoveryNotes: string[]
  rir: { main: number; accessories: number }
  profile: PersonalizationProfile
}

// ─── Generator interface ──────────────────────────────────────────────────────
// Replace LocalTemplateGenerator with AIRoutineGenerator to connect AI:
//   const generator: IRoutineGenerator = new AIRoutineGenerator(anthropicClient)
//   → generator.generate(profile) sends profile as JSON to LLM and parses response

export interface IRoutineGenerator {
  generate(profile: PersonalizationProfile): Promise<RoutineOutput>
}

// ─── Validation schema ────────────────────────────────────────────────────────

export const personalizationSchema = z.object({
  gender: z.enum(['male', 'female']),
  age: z.number().int().min(15).max(70),
  weightKg: z.number().min(30).max(300),
  heightCm: z.number().min(100).max(250),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  trainingFrequency: z.union([z.literal(3), z.literal(5), z.literal(6)]),
  primaryGoal: z.enum(['fat-loss', 'muscle-gain', 'strength', 'recomposition', 'performance']),
  muscleFocus: z.array(z.string()).max(3),
})

export type PersonalizationInput = z.infer<typeof personalizationSchema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function buildProfile(input: PersonalizationInput): PersonalizationProfile {
  const bmi = Math.round((input.weightKg / Math.pow(input.heightCm / 100, 2)) * 10) / 10
  const ageGroup: AgeGroup =
    input.age < 25 ? 'young' :
    input.age < 41 ? 'adult' :
    input.age < 51 ? 'mature' : 'senior'
  return { ...input, bmi, ageGroup }
}

export function calcBmi(weightKg: number, heightCm: number): number {
  return Math.round((weightKg / Math.pow(heightCm / 100, 2)) * 10) / 10
}

export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return 'Bajo peso'
  if (bmi < 25)   return 'Normal'
  if (bmi < 30)   return 'Sobrepeso'
  return 'Obesidad'
}

export function validFrequenciesForLevel(level: FitnessLevel): TrainingFrequency[] {
  if (level === 'beginner') return [3]
  if (level === 'intermediate') return [3, 5]
  return [5, 6]
}

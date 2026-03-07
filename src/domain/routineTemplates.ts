import { z } from 'zod'
import { Routine } from './entities/Routine'
import { RepRange } from './value-objects/RepRange'
import type { IRoutineRepository } from './repositories/IRoutineRepository'

// ─── Zod schema ───────────────────────────────────────────────────────────────

export const wizardInputSchema = z.object({
  level: z.enum(['principiante', 'intermedio', 'avanzado']),
  daysPerWeek: z.union([z.literal(3), z.literal(4), z.literal(6)]),
})

export type WizardInput = z.infer<typeof wizardInputSchema>

// ─── Template metadata ────────────────────────────────────────────────────────

export interface RoutineTemplateMetadata {
  key: string
  name: string
  description: string
  targetLevels: WizardInput['level'][]
  daysPerWeek: number
  phrase: string
  buildRoutine: () => Routine
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function ex(id: string, sets: number, min: number, max: number, rir = 2, rest = 120) {
  return {
    exerciseId: id,
    sets,
    repRange: RepRange.create(min, max),
    rirTarget: rir,
    progressionMethod: 'double-progression' as const,
    restSeconds: rest,
  }
}

// ─── 4 Plantillas ─────────────────────────────────────────────────────────────

export const ROUTINE_TEMPLATES: RoutineTemplateMetadata[] = [
  {
    key: 'full-body-novato',
    name: 'Full Body 3×/semana',
    description: 'Lunes, Miércoles y Viernes. Trabajas todo el cuerpo en cada sesión. Ideal para partir de cero.',
    targetLevels: ['principiante'],
    daysPerWeek: 3,
    phrase: '¡Weón, el primer paso es el más difícil! Arriba esa barra y a darle no más.',
    buildRoutine() {
      const r = Routine.create({ name: this.name, description: this.description })
      r.addDay({
        name: 'Full Body Día 1',
        isRestDay: false,
        exercises: [
          ex('quads-squat', 3, 8, 12, 2, 150),
          ex('chest-barbell-bench-press', 3, 8, 12, 2, 120),
          ex('back-barbell-row', 3, 8, 12, 2, 120),
          ex('shoulders-overhead-press', 3, 10, 15, 2, 120),
          ex('biceps-barbell-curl', 3, 12, 15, 2, 90),
          ex('triceps-cable-pushdown', 3, 12, 15, 2, 90),
          ex('calves-standing-calf-raise', 3, 15, 20, 2, 60),
        ],
      })
      r.addDay({ name: 'Descanso', isRestDay: true, restDayType: 'active', exercises: [] })
      r.addDay({
        name: 'Full Body Día 2',
        isRestDay: false,
        exercises: [
          ex('back-romanian-deadlift', 3, 8, 12, 2, 150),
          ex('chest-incline-dumbbell-press', 3, 8, 12, 2, 120),
          ex('back-lat-pulldown', 3, 8, 12, 2, 120),
          ex('shoulders-lateral-raise', 4, 12, 20, 2, 90),
          ex('biceps-hammer-curl', 3, 12, 15, 2, 90),
          ex('triceps-overhead-extension', 3, 12, 15, 2, 90),
        ],
      })
      r.addDay({ name: 'Descanso', isRestDay: true, restDayType: 'active', exercises: [] })
      r.addDay({
        name: 'Full Body Día 3',
        isRestDay: false,
        exercises: [
          ex('quads-leg-press', 3, 10, 15, 2, 120),
          ex('chest-cable-crossover', 3, 12, 15, 2, 90),
          ex('back-pull-up', 3, 5, 10, 2, 120),
          ex('shoulders-dumbbell-shoulder-press', 3, 10, 15, 2, 120),
          ex('biceps-preacher-curl', 3, 12, 15, 2, 90),
          ex('triceps-dips', 3, 10, 15, 2, 90),
        ],
      })
      r.addDay({ name: 'Descanso', isRestDay: true, restDayType: 'complete', exercises: [] })
      return r
    },
  },

  {
    key: 'fuerza-5x5',
    name: '5×5 Fuerza',
    description: '3 días / semana. Sentadilla, press y peso muerto. Para construir fuerza real desde la base.',
    targetLevels: ['principiante', 'intermedio'],
    daysPerWeek: 3,
    phrase: 'La fuerza no se pide, se gana. ¡Dale con todo, po, que el hierro no miente!',
    buildRoutine() {
      const r = Routine.create({ name: this.name, description: this.description })
      r.addDay({
        name: 'Entrenamiento A',
        isRestDay: false,
        exercises: [
          ex('quads-squat', 5, 5, 5, 1, 180),
          ex('chest-barbell-bench-press', 5, 5, 5, 1, 180),
          ex('back-barbell-row', 5, 5, 5, 1, 180),
        ],
      })
      r.addDay({ name: 'Descanso', isRestDay: true, restDayType: 'active', exercises: [] })
      r.addDay({
        name: 'Entrenamiento B',
        isRestDay: false,
        exercises: [
          ex('quads-squat', 5, 5, 5, 1, 180),
          ex('shoulders-overhead-press', 5, 5, 5, 1, 180),
          ex('back-deadlift', 1, 5, 5, 1, 240),
        ],
      })
      r.addDay({ name: 'Descanso', isRestDay: true, restDayType: 'active', exercises: [] })
      return r
    },
  },

  {
    key: 'upper-lower',
    name: 'Upper/Lower 4×/semana',
    description: '4 días alternando tren superior e inferior. Más volumen sin quemarte.',
    targetLevels: ['intermedio'],
    daysPerWeek: 4,
    phrase: 'Cuatro días sin excusas. ¡El que la lleva, la lleva! Tú decides si eres de los que sí.',
    buildRoutine() {
      const r = Routine.create({ name: this.name, description: this.description })
      r.addDay({
        name: 'Upper A (Fuerza)',
        isRestDay: false,
        exercises: [
          ex('chest-barbell-bench-press', 4, 4, 8, 2, 180),
          ex('back-barbell-row', 4, 4, 8, 2, 180),
          ex('shoulders-overhead-press', 3, 6, 10, 2, 150),
          ex('back-pull-up', 3, 5, 10, 2, 150),
        ],
      })
      r.addDay({
        name: 'Lower A (Fuerza)',
        isRestDay: false,
        exercises: [
          ex('quads-squat', 4, 4, 8, 2, 180),
          ex('back-romanian-deadlift', 3, 6, 10, 2, 150),
          ex('quads-leg-press', 3, 8, 12, 2, 120),
          ex('calves-standing-calf-raise', 4, 12, 20, 2, 90),
        ],
      })
      r.addDay({ name: 'Descanso', isRestDay: true, restDayType: 'active', exercises: [] })
      r.addDay({
        name: 'Upper B (Volumen)',
        isRestDay: false,
        exercises: [
          ex('chest-incline-dumbbell-press', 4, 8, 15, 2, 120),
          ex('back-cable-row', 4, 10, 15, 2, 120),
          ex('shoulders-lateral-raise', 4, 15, 20, 2, 90),
          ex('back-face-pull', 3, 15, 20, 2, 90),
          ex('biceps-ez-bar-curl', 3, 12, 15, 2, 90),
          ex('triceps-cable-pushdown', 3, 12, 15, 2, 90),
        ],
      })
      r.addDay({
        name: 'Lower B (Volumen)',
        isRestDay: false,
        exercises: [
          ex('back-deadlift', 4, 4, 6, 2, 180),
          ex('quads-bulgarian-split-squat', 3, 10, 15, 2, 120),
          ex('hamstrings-leg-curl', 4, 12, 15, 2, 90),
          ex('glutes-hip-thrust', 3, 12, 15, 2, 120),
          ex('calves-seated-calf-raise', 4, 15, 20, 2, 90),
        ],
      })
      r.addDay({ name: 'Descanso', isRestDay: true, restDayType: 'complete', exercises: [] })
      return r
    },
  },

  {
    key: 'ppl',
    name: 'PPL — Push Pull Legs',
    description: '6 días / semana. El plan del crack: empuje, jalón y piernas, dos veces cada uno.',
    targetLevels: ['avanzado'],
    daysPerWeek: 6,
    phrase: 'Seis días, puro hueso y músculo. ¡Pa\' los valientes no más, causa! ¿Estás listo o te echas atrás?',
    buildRoutine() {
      const r = Routine.create({ name: this.name, description: this.description })
      r.addDay({
        name: 'Push A (Pecho y Hombros)',
        isRestDay: false,
        exercises: [
          ex('chest-barbell-bench-press', 4, 6, 10, 2, 150),
          ex('chest-incline-dumbbell-press', 3, 8, 12, 2, 120),
          ex('shoulders-overhead-press', 3, 8, 12, 2, 120),
          ex('shoulders-lateral-raise', 4, 12, 20, 2, 90),
          ex('triceps-cable-pushdown', 3, 10, 15, 2, 90),
          ex('triceps-overhead-extension', 3, 10, 15, 2, 90),
        ],
      })
      r.addDay({
        name: 'Pull A (Espalda y Bíceps)',
        isRestDay: false,
        exercises: [
          ex('back-barbell-row', 4, 6, 10, 2, 150),
          ex('back-pull-up', 3, 6, 10, 2, 120),
          ex('back-lat-pulldown', 3, 8, 12, 2, 120),
          ex('back-face-pull', 3, 15, 20, 2, 90),
          ex('biceps-barbell-curl', 3, 10, 15, 2, 90),
          ex('biceps-hammer-curl', 3, 10, 15, 2, 90),
        ],
      })
      r.addDay({
        name: 'Legs A (Piernas)',
        isRestDay: false,
        exercises: [
          ex('quads-squat', 4, 6, 10, 2, 180),
          ex('hamstrings-leg-curl', 4, 10, 15, 2, 120),
          ex('quads-leg-press', 3, 10, 15, 2, 120),
          ex('glutes-hip-thrust', 3, 10, 15, 2, 120),
          ex('calves-standing-calf-raise', 4, 12, 20, 2, 90),
        ],
      })
      r.addDay({
        name: 'Push B',
        isRestDay: false,
        exercises: [
          ex('chest-incline-bench-press', 4, 6, 10, 2, 150),
          ex('chest-dumbbell-bench-press', 3, 8, 12, 2, 120),
          ex('shoulders-dumbbell-shoulder-press', 3, 8, 12, 2, 120),
          ex('shoulders-cable-lateral-raise', 4, 12, 20, 2, 90),
          ex('triceps-close-grip-bench', 3, 8, 12, 2, 120),
          ex('triceps-french-press', 3, 10, 15, 2, 90),
        ],
      })
      r.addDay({
        name: 'Pull B',
        isRestDay: false,
        exercises: [
          ex('back-deadlift', 4, 4, 6, 2, 180),
          ex('back-dumbbell-row', 3, 8, 12, 2, 120),
          ex('back-cable-row', 3, 10, 15, 2, 120),
          ex('shoulders-rear-delt-fly', 4, 15, 20, 2, 90),
          ex('biceps-ez-bar-curl', 3, 10, 15, 2, 90),
          ex('biceps-concentration-curl', 3, 12, 15, 2, 90),
        ],
      })
      r.addDay({
        name: 'Legs B',
        isRestDay: false,
        exercises: [
          ex('quads-bulgarian-split-squat', 4, 8, 12, 2, 150),
          ex('back-romanian-deadlift', 4, 8, 12, 2, 150),
          ex('quads-hack-squat', 3, 10, 15, 2, 120),
          ex('hamstrings-seated-leg-curl', 3, 12, 15, 2, 90),
          ex('calves-seated-calf-raise', 4, 15, 20, 2, 90),
        ],
      })
      r.addDay({ name: 'Descanso', isRestDay: true, restDayType: 'complete', exercises: [] })
      return r
    },
  },
]

// ─── Selección ────────────────────────────────────────────────────────────────

export function selectBestTemplate(input: WizardInput): RoutineTemplateMetadata {
  const byLevel = ROUTINE_TEMPLATES.filter(t => t.targetLevels.includes(input.level))
  const candidates = byLevel.length > 0 ? byLevel : ROUTINE_TEMPLATES

  return candidates.reduce((best, candidate) => {
    const bestDiff = Math.abs(best.daysPerWeek - input.daysPerWeek)
    const candidateDiff = Math.abs(candidate.daysPerWeek - input.daysPerWeek)
    return candidateDiff < bestDiff ? candidate : best
  })
}

// ─── Guardado con validación Zod ──────────────────────────────────────────────

export async function saveRoutineFromWizard(
  rawInput: unknown,
  routineRepo: IRoutineRepository,
): Promise<Routine> {
  const input = wizardInputSchema.parse(rawInput)
  const template = selectBestTemplate(input)
  const routine = template.buildRoutine()
  await routineRepo.save(routine)
  return routine
}

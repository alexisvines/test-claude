import { Routine } from '../../../domain/entities/Routine'
import { RepRange } from '../../../domain/value-objects/RepRange'

function makeExercise(id: string, sets: number, min: number, max: number, rirTarget = 2, rest = 120) {
  return {
    exerciseId: id,
    sets,
    repRange: RepRange.create(min, max),
    rirTarget,
    progressionMethod: 'double-progression' as const,
    restSeconds: rest,
  }
}

export function getSeedRoutineTemplates(): Routine[] {
  const ppl = Routine.create({ name: 'PPL — Push Pull Legs', description: '6 días / semana. Push (empuje), Pull (jalón), Legs (piernas).' })
  ppl.addDay({
    name: 'Push A (Pecho y Hombros)',
    isRestDay: false,
    exercises: [
      makeExercise('chest-barbell-bench-press', 4, 6, 10, 2, 150),
      makeExercise('chest-incline-dumbbell-press', 3, 8, 12, 2, 120),
      makeExercise('shoulders-overhead-press', 3, 8, 12, 2, 120),
      makeExercise('shoulders-lateral-raise', 4, 12, 20, 2, 90),
      makeExercise('triceps-cable-pushdown', 3, 10, 15, 2, 90),
      makeExercise('triceps-overhead-extension', 3, 10, 15, 2, 90),
    ],
  })
  ppl.addDay({
    name: 'Pull A (Espalda y Bíceps)',
    isRestDay: false,
    exercises: [
      makeExercise('back-barbell-row', 4, 6, 10, 2, 150),
      makeExercise('back-pull-up', 3, 6, 10, 2, 120),
      makeExercise('back-lat-pulldown', 3, 8, 12, 2, 120),
      makeExercise('back-face-pull', 3, 15, 20, 2, 90),
      makeExercise('biceps-barbell-curl', 3, 10, 15, 2, 90),
      makeExercise('biceps-hammer-curl', 3, 10, 15, 2, 90),
    ],
  })
  ppl.addDay({
    name: 'Legs A (Piernas)',
    isRestDay: false,
    exercises: [
      makeExercise('quads-squat', 4, 6, 10, 2, 180),
      makeExercise('hamstrings-leg-curl', 4, 10, 15, 2, 120),
      makeExercise('quads-leg-press', 3, 10, 15, 2, 120),
      makeExercise('glutes-hip-thrust', 3, 10, 15, 2, 120),
      makeExercise('calves-standing-calf-raise', 4, 12, 20, 2, 90),
    ],
  })
  ppl.addDay({
    name: 'Push B',
    isRestDay: false,
    exercises: [
      makeExercise('chest-incline-bench-press', 4, 6, 10, 2, 150),
      makeExercise('chest-dumbbell-bench-press', 3, 8, 12, 2, 120),
      makeExercise('shoulders-dumbbell-shoulder-press', 3, 8, 12, 2, 120),
      makeExercise('shoulders-cable-lateral-raise', 4, 12, 20, 2, 90),
      makeExercise('triceps-close-grip-bench', 3, 8, 12, 2, 120),
      makeExercise('triceps-french-press', 3, 10, 15, 2, 90),
    ],
  })
  ppl.addDay({
    name: 'Pull B',
    isRestDay: false,
    exercises: [
      makeExercise('back-deadlift', 4, 4, 6, 2, 180),
      makeExercise('back-dumbbell-row', 3, 8, 12, 2, 120),
      makeExercise('back-cable-row', 3, 10, 15, 2, 120),
      makeExercise('shoulders-rear-delt-fly', 4, 15, 20, 2, 90),
      makeExercise('biceps-ez-bar-curl', 3, 10, 15, 2, 90),
      makeExercise('biceps-concentration-curl', 3, 12, 15, 2, 90),
    ],
  })
  ppl.addDay({
    name: 'Legs B',
    isRestDay: false,
    exercises: [
      makeExercise('quads-bulgarian-split-squat', 4, 8, 12, 2, 150),
      makeExercise('back-romanian-deadlift', 4, 8, 12, 2, 150),
      makeExercise('quads-hack-squat', 3, 10, 15, 2, 120),
      makeExercise('hamstrings-seated-leg-curl', 3, 12, 15, 2, 90),
      makeExercise('calves-seated-calf-raise', 4, 15, 20, 2, 90),
    ],
  })
  ppl.addDay({ name: 'Descanso', isRestDay: true, restDayType: 'complete', exercises: [] })

  // 5x5 Stronglifts
  const fiveByFive = Routine.create({ name: '5×5 Fuerza', description: '3 días / semana. Ideal para fuerza y principiantes-intermedios.' })
  fiveByFive.addDay({
    name: 'Entrenamiento A',
    isRestDay: false,
    exercises: [
      makeExercise('quads-squat', 5, 5, 5, 1, 180),
      makeExercise('chest-barbell-bench-press', 5, 5, 5, 1, 180),
      makeExercise('back-barbell-row', 5, 5, 5, 1, 180),
    ],
  })
  fiveByFive.addDay({ name: 'Descanso', isRestDay: true, restDayType: 'active', exercises: [] })
  fiveByFive.addDay({
    name: 'Entrenamiento B',
    isRestDay: false,
    exercises: [
      makeExercise('quads-squat', 5, 5, 5, 1, 180),
      makeExercise('shoulders-overhead-press', 5, 5, 5, 1, 180),
      makeExercise('back-deadlift', 1, 5, 5, 1, 240),
    ],
  })
  fiveByFive.addDay({ name: 'Descanso', isRestDay: true, restDayType: 'active', exercises: [] })

  // Full Body 3x
  const fullBody = Routine.create({ name: 'Full Body 3×/semana', description: 'Lunes, Miércoles, Viernes. Entrena todo el cuerpo en cada sesión.' })
  fullBody.addDay({
    name: 'Full Body Día 1',
    isRestDay: false,
    exercises: [
      makeExercise('quads-squat', 3, 8, 12, 2, 150),
      makeExercise('chest-barbell-bench-press', 3, 8, 12, 2, 120),
      makeExercise('back-barbell-row', 3, 8, 12, 2, 120),
      makeExercise('shoulders-overhead-press', 3, 10, 15, 2, 120),
      makeExercise('biceps-barbell-curl', 3, 12, 15, 2, 90),
      makeExercise('triceps-cable-pushdown', 3, 12, 15, 2, 90),
      makeExercise('calves-standing-calf-raise', 3, 15, 20, 2, 60),
    ],
  })
  fullBody.addDay({ name: 'Descanso', isRestDay: true, restDayType: 'active', exercises: [] })
  fullBody.addDay({
    name: 'Full Body Día 2',
    isRestDay: false,
    exercises: [
      makeExercise('back-romanian-deadlift', 3, 8, 12, 2, 150),
      makeExercise('chest-incline-dumbbell-press', 3, 8, 12, 2, 120),
      makeExercise('back-lat-pulldown', 3, 8, 12, 2, 120),
      makeExercise('shoulders-lateral-raise', 4, 12, 20, 2, 90),
      makeExercise('biceps-hammer-curl', 3, 12, 15, 2, 90),
      makeExercise('triceps-overhead-extension', 3, 12, 15, 2, 90),
    ],
  })
  fullBody.addDay({ name: 'Descanso', isRestDay: true, restDayType: 'active', exercises: [] })
  fullBody.addDay({
    name: 'Full Body Día 3',
    isRestDay: false,
    exercises: [
      makeExercise('quads-leg-press', 3, 10, 15, 2, 120),
      makeExercise('chest-cable-crossover', 3, 12, 15, 2, 90),
      makeExercise('back-pull-up', 3, 5, 10, 2, 120),
      makeExercise('shoulders-dumbbell-shoulder-press', 3, 10, 15, 2, 120),
      makeExercise('biceps-preacher-curl', 3, 12, 15, 2, 90),
      makeExercise('triceps-dips', 3, 10, 15, 2, 90),
    ],
  })
  fullBody.addDay({ name: 'Descanso', isRestDay: true, restDayType: 'complete', exercises: [] })

  // Upper Lower
  const upperLower = Routine.create({ name: 'Upper/Lower 4×/semana', description: '4 días alternando tren superior e inferior.' })
  upperLower.addDay({
    name: 'Upper A (Fuerza)',
    isRestDay: false,
    exercises: [
      makeExercise('chest-barbell-bench-press', 4, 4, 8, 2, 180),
      makeExercise('back-barbell-row', 4, 4, 8, 2, 180),
      makeExercise('shoulders-overhead-press', 3, 6, 10, 2, 150),
      makeExercise('back-pull-up', 3, 5, 10, 2, 150),
    ],
  })
  upperLower.addDay({
    name: 'Lower A (Fuerza)',
    isRestDay: false,
    exercises: [
      makeExercise('quads-squat', 4, 4, 8, 2, 180),
      makeExercise('back-romanian-deadlift', 3, 6, 10, 2, 150),
      makeExercise('quads-leg-press', 3, 8, 12, 2, 120),
      makeExercise('calves-standing-calf-raise', 4, 12, 20, 2, 90),
    ],
  })
  upperLower.addDay({ name: 'Descanso', isRestDay: true, restDayType: 'active', exercises: [] })
  upperLower.addDay({
    name: 'Upper B (Volumen)',
    isRestDay: false,
    exercises: [
      makeExercise('chest-incline-dumbbell-press', 4, 8, 15, 2, 120),
      makeExercise('back-cable-row', 4, 10, 15, 2, 120),
      makeExercise('shoulders-lateral-raise', 4, 15, 20, 2, 90),
      makeExercise('back-face-pull', 3, 15, 20, 2, 90),
      makeExercise('biceps-ez-bar-curl', 3, 12, 15, 2, 90),
      makeExercise('triceps-cable-pushdown', 3, 12, 15, 2, 90),
    ],
  })
  upperLower.addDay({
    name: 'Lower B (Volumen)',
    isRestDay: false,
    exercises: [
      makeExercise('back-deadlift', 4, 4, 6, 2, 180),
      makeExercise('quads-bulgarian-split-squat', 3, 10, 15, 2, 120),
      makeExercise('hamstrings-leg-curl', 4, 12, 15, 2, 90),
      makeExercise('glutes-hip-thrust', 3, 12, 15, 2, 120),
      makeExercise('calves-seated-calf-raise', 4, 15, 20, 2, 90),
    ],
  })
  upperLower.addDay({ name: 'Descanso', isRestDay: true, restDayType: 'complete', exercises: [] })

  const templates = [ppl, fiveByFive, fullBody, upperLower]
  return templates
}

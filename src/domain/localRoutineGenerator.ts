import { Routine } from './entities/Routine'
import { RepRange } from './value-objects/RepRange'
import type {
  IRoutineGenerator,
  PersonalizationProfile,
  CardioProtocol,
  RoutineOutput,
  PrimaryGoal,
  AgeGroup,
} from './personalizedRoutines'

// ─── Helper ───────────────────────────────────────────────────────────────────

type ExEntry = ReturnType<typeof ex>

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

// ─── RIR & rest deltas by goal ────────────────────────────────────────────────

const RIR_BY_GOAL: Record<PrimaryGoal, { main: number; accessories: number }> = {
  'fat-loss':      { main: 1, accessories: 1 },
  'muscle-gain':   { main: 2, accessories: 2 },
  'strength':      { main: 1, accessories: 3 },
  'recomposition': { main: 2, accessories: 2 },
  'performance':   { main: 2, accessories: 3 },
}

const REST_DELTA_BY_GOAL: Record<PrimaryGoal, number> = {
  'fat-loss':      -30,
  'muscle-gain':   0,
  'strength':      30,
  'recomposition': 0,
  'performance':   15,
}

const SETS_DELTA_BY_AGE: Record<AgeGroup, number> = {
  young: 0, adult: 0, mature: -1, senior: -2,
}

const REST_DELTA_BY_AGE: Record<AgeGroup, number> = {
  young: 0, adult: 0, mature: 30, senior: 60,
}

// ─── Muscle emphasis extras ───────────────────────────────────────────────────
// Keywords match lowercase day names: 'push', 'pull', 'legs', 'upper', 'lower', 'full'

const EMPHASIS_EXTRAS: Record<string, { days: string[]; exercise: ExEntry }[]> = {
  chest: [
    { days: ['push', 'upper', 'full'], exercise: ex('chest-cable-crossover',     3, 12, 15, 2, 90) },
  ],
  back: [
    { days: ['pull', 'upper', 'full'], exercise: ex('back-dumbbell-row',         3, 10, 12, 2, 90) },
  ],
  shoulders: [
    { days: ['push', 'upper', 'full'], exercise: ex('shoulders-rear-delt-fly',   3, 15, 20, 3, 75) },
  ],
  arms: [
    { days: ['push', 'upper', 'full'], exercise: ex('triceps-overhead-extension',3, 12, 15, 2, 75) },
    { days: ['pull', 'upper', 'full'], exercise: ex('biceps-concentration-curl', 3, 12, 15, 2, 75) },
  ],
  glutes: [
    { days: ['legs', 'lower', 'full', 'pierna'], exercise: ex('glutes-hip-thrust', 3, 12, 15, 2, 90) },
  ],
  legs: [
    { days: ['legs', 'lower', 'full', 'pierna'], exercise: ex('quads-hack-squat',  3, 10, 15, 2, 90) },
  ],
}

// ─── Base template builders ───────────────────────────────────────────────────

function buildBeginnerFullBody(name: string): Routine {
  const r = Routine.create({
    name,
    description: 'Full Body 3×/semana — Fuerza y volumen alternados. Base sólida para principiantes con ejercicios compuestos y adecuada recuperación.',
  })
  r.addDay({
    name: 'Full Body A — Fuerza',
    isRestDay: false,
    exercises: [
      ex('quads-squat',                     3,  6,  8, 2, 180),
      ex('chest-barbell-bench-press',        3,  6,  8, 2, 150),
      ex('back-barbell-row',                 3,  6,  8, 2, 150),
      ex('shoulders-overhead-press',         3,  8, 10, 2, 120),
      ex('glutes-hip-thrust',                3, 10, 12, 2, 120),
      ex('biceps-barbell-curl',              3, 10, 12, 2,  90),
    ],
  })
  r.addDay({ name: 'Descanso Activo', isRestDay: true, restDayType: 'active', exercises: [] })
  r.addDay({
    name: 'Full Body B — Volumen',
    isRestDay: false,
    exercises: [
      ex('back-deadlift',                    3,  4,  6, 2, 180),
      ex('chest-incline-dumbbell-press',     3,  8, 12, 2, 120),
      ex('back-lat-pulldown',                3,  8, 12, 2, 120),
      ex('shoulders-lateral-raise',          3, 12, 15, 2,  90),
      ex('quads-leg-press',                  3, 10, 12, 2, 120),
      ex('triceps-cable-pushdown',           3, 12, 15, 2,  90),
    ],
  })
  r.addDay({ name: 'Descanso Activo', isRestDay: true, restDayType: 'active', exercises: [] })
  r.addDay({
    name: 'Full Body C — Mixto',
    isRestDay: false,
    exercises: [
      ex('quads-squat',                      3,  8, 10, 2, 150),
      ex('chest-barbell-bench-press',         3,  8, 10, 2, 120),
      ex('back-pull-up',                      3,  5, 10, 2, 120),
      ex('shoulders-dumbbell-shoulder-press', 3, 10, 12, 2, 120),
      ex('back-romanian-deadlift',            3,  8, 12, 2, 120),
      ex('triceps-dips',                      3,  8, 12, 2,  90),
    ],
  })
  r.addDay({ name: 'Descanso Completo', isRestDay: true, restDayType: 'complete', exercises: [] })
  return r
}

function buildIntermediatePPL(name: string): Routine {
  const r = Routine.create({
    name,
    description: 'Push/Pull/Legs 3×/semana — Dividido por patrón de movimiento. Mayor volumen y especialización por grupo muscular.',
  })
  r.addDay({
    name: 'Push — Pecho, Hombros, Tríceps',
    isRestDay: false,
    exercises: [
      ex('chest-barbell-bench-press',        4,  5,  8, 2, 180),
      ex('chest-incline-dumbbell-press',     3,  8, 12, 2, 120),
      ex('shoulders-overhead-press',         3,  8, 10, 2, 120),
      ex('chest-cable-crossover',            3, 12, 15, 2,  90),
      ex('shoulders-lateral-raise',          3, 12, 15, 2,  90),
      ex('triceps-cable-pushdown',           3, 12, 15, 2,  90),
    ],
  })
  r.addDay({ name: 'Descanso Activo', isRestDay: true, restDayType: 'active', exercises: [] })
  r.addDay({
    name: 'Pull — Espalda, Bíceps',
    isRestDay: false,
    exercises: [
      ex('back-pull-up',                     4,  5, 10, 2, 180),
      ex('back-barbell-row',                 3,  6, 10, 2, 150),
      ex('back-cable-row',                   3, 10, 12, 2, 120),
      ex('back-face-pull',                   3, 15, 20, 3,  90),
      ex('biceps-ez-bar-curl',               3, 10, 12, 2,  90),
      ex('biceps-hammer-curl',               3, 12, 15, 3,  90),
    ],
  })
  r.addDay({ name: 'Descanso Activo', isRestDay: true, restDayType: 'active', exercises: [] })
  r.addDay({
    name: 'Legs — Piernas',
    isRestDay: false,
    exercises: [
      ex('quads-squat',                      4,  5,  8, 2, 180),
      ex('back-romanian-deadlift',           3,  8, 12, 2, 150),
      ex('quads-leg-press',                  3, 10, 12, 2, 120),
      ex('quads-hack-squat',                 3, 12, 15, 2,  90),
      ex('hamstrings-leg-curl',              3, 12, 15, 2,  90),
      ex('calves-standing-calf-raise',       4, 12, 20, 2,  75),
    ],
  })
  r.addDay({ name: 'Descanso Completo', isRestDay: true, restDayType: 'complete', exercises: [] })
  return r
}

function buildIntermediateUpperLower(name: string): Routine {
  const r = Routine.create({
    name,
    description: 'Upper/Lower 5×/semana — Alta frecuencia por grupo muscular. Alternancia de días de fuerza y volumen con énfasis en puntos débiles.',
  })
  r.addDay({
    name: 'Upper A — Push Fuerza',
    isRestDay: false,
    exercises: [
      ex('chest-barbell-bench-press',        4,  4,  6, 2, 180),
      ex('chest-incline-dumbbell-press',     3,  8, 12, 2, 120),
      ex('shoulders-overhead-press',         3,  8, 10, 2, 150),
      ex('chest-cable-crossover',            3, 12, 15, 2,  90),
      ex('shoulders-lateral-raise',          3, 12, 15, 2,  90),
      ex('triceps-dips',                     3,  8, 12, 2,  90),
      ex('triceps-cable-pushdown',           3, 12, 15, 2,  75),
    ],
  })
  r.addDay({
    name: 'Lower A — Quad Focus',
    isRestDay: false,
    exercises: [
      ex('quads-squat',                      4,  4,  6, 2, 180),
      ex('quads-leg-press',                  3, 10, 12, 2, 120),
      ex('quads-hack-squat',                 3, 12, 15, 2,  90),
      ex('quads-bulgarian-split-squat',      3, 10, 12, 2, 120),
      ex('calves-seated-calf-raise',         4, 12, 20, 2,  75),
    ],
  })
  r.addDay({ name: 'Descanso Activo', isRestDay: true, restDayType: 'active', exercises: [] })
  r.addDay({
    name: 'Upper B — Pull Fuerza',
    isRestDay: false,
    exercises: [
      ex('back-pull-up',                     4,  4,  8, 2, 180),
      ex('back-barbell-row',                 4,  5,  8, 2, 150),
      ex('back-cable-row',                   3, 10, 12, 2, 120),
      ex('back-face-pull',                   3, 15, 20, 3,  90),
      ex('biceps-ez-bar-curl',               3, 10, 12, 2,  90),
      ex('biceps-preacher-curl',             3, 12, 15, 2,  90),
    ],
  })
  r.addDay({
    name: 'Lower B — Glutes & Ham Focus',
    isRestDay: false,
    exercises: [
      ex('back-deadlift',                    4,  4,  6, 2, 180),
      ex('glutes-hip-thrust',                4,  8, 12, 2, 120),
      ex('back-romanian-deadlift',           3,  8, 12, 2, 150),
      ex('hamstrings-leg-curl',              3, 12, 15, 2,  90),
      ex('hamstrings-seated-leg-curl',       3, 12, 15, 2,  90),
    ],
  })
  r.addDay({
    name: 'Full Body — Weak Point',
    isRestDay: false,
    exercises: [
      ex('chest-barbell-bench-press',        3, 10, 12, 2, 120),
      ex('back-pull-up',                     3,  8, 12, 2, 120),
      ex('quads-squat',                      3, 12, 15, 3, 120),
      ex('shoulders-overhead-press',         3, 10, 12, 2, 120),
      ex('glutes-hip-thrust',                3, 12, 15, 2,  90),
    ],
  })
  r.addDay({ name: 'Descanso Activo',   isRestDay: true, restDayType: 'active',   exercises: [] })
  r.addDay({ name: 'Descanso Completo', isRestDay: true, restDayType: 'complete', exercises: [] })
  return r
}

function buildAdvancedPPL5(name: string): Routine {
  const r = Routine.create({
    name,
    description: 'PPL 5×/semana — Volumen e intensidad avanzados. Dos bloques Push/Pull/Legs con días de recuperación integrados.',
  })
  r.addDay({
    name: 'Push A — Pecho, Hombros, Tríceps',
    isRestDay: false,
    exercises: [
      ex('chest-barbell-bench-press',             5,  3,  5, 1, 240),
      ex('chest-incline-bench-press',              4,  6,  8, 2, 180),
      ex('chest-cable-crossover',                  3, 12, 15, 2,  90),
      ex('shoulders-dumbbell-shoulder-press',      3, 10, 12, 2, 120),
      ex('shoulders-cable-lateral-raise',          4, 15, 20, 2,  75),
      ex('triceps-dips',                           3,  8, 12, 2,  90),
      ex('triceps-cable-pushdown',                 3, 12, 15, 2,  75),
    ],
  })
  r.addDay({
    name: 'Pull A — Espalda Ancha, Bíceps',
    isRestDay: false,
    exercises: [
      ex('back-pull-up',                           5,  4,  6, 1, 210),
      ex('back-barbell-row',                       4,  5,  8, 2, 180),
      ex('back-lat-pulldown',                      3, 10, 12, 2, 120),
      ex('back-face-pull',                         4, 15, 20, 2,  90),
      ex('biceps-ez-bar-curl',                     4,  8, 12, 2,  90),
      ex('biceps-hammer-curl',                     3, 12, 15, 3,  75),
    ],
  })
  r.addDay({
    name: 'Legs A — Quad, Fuerza',
    isRestDay: false,
    exercises: [
      ex('quads-squat',                            5,  3,  5, 1, 240),
      ex('quads-leg-press',                        4,  8, 12, 2, 150),
      ex('quads-hack-squat',                       4, 10, 15, 2,  90),
      ex('quads-bulgarian-split-squat',            3, 10, 12, 2, 120),
      ex('calves-standing-calf-raise',             5, 12, 20, 2,  75),
    ],
  })
  r.addDay({
    name: 'Push B — Hombros, Pecho Vertical',
    isRestDay: false,
    exercises: [
      ex('shoulders-overhead-press',               5,  3,  5, 1, 240),
      ex('chest-incline-dumbbell-press',           3, 10, 12, 2, 120),
      ex('shoulders-lateral-raise',                4, 12, 15, 2,  90),
      ex('chest-dumbbell-bench-press',             3, 10, 12, 2, 120),
      ex('shoulders-rear-delt-fly',                3, 15, 20, 3,  75),
      ex('triceps-overhead-extension',             3, 12, 15, 2,  75),
    ],
  })
  r.addDay({
    name: 'Pull B — Espalda Gruesa, Bíceps',
    isRestDay: false,
    exercises: [
      ex('back-deadlift',                          5,  2,  4, 1, 300),
      ex('back-cable-row',                         4,  8, 12, 2, 150),
      ex('back-dumbbell-row',                      4,  8, 12, 2, 120),
      ex('back-face-pull',                         3, 15, 20, 3,  75),
      ex('biceps-concentration-curl',              3, 12, 15, 2,  75),
      ex('biceps-preacher-curl',                   3, 10, 12, 2,  90),
    ],
  })
  r.addDay({ name: 'Descanso Activo',   isRestDay: true, restDayType: 'active',   exercises: [] })
  r.addDay({ name: 'Descanso Completo', isRestDay: true, restDayType: 'complete', exercises: [] })
  return r
}

function buildAdvancedPPL6(name: string): Routine {
  const r = Routine.create({
    name,
    description: 'PPL 6×/semana — Máximo volumen y doble frecuencia. Push A/B, Pull A/B, Legs A/B para atletas avanzados con alta capacidad de recuperación.',
  })
  r.addDay({
    name: 'Push A — Pecho, Hombros, Tríceps',
    isRestDay: false,
    exercises: [
      ex('chest-barbell-bench-press',             5,  3,  5, 1, 240),
      ex('chest-incline-bench-press',              4,  6,  8, 2, 180),
      ex('chest-cable-crossover',                  3, 12, 15, 2,  90),
      ex('shoulders-dumbbell-shoulder-press',      3, 10, 12, 2, 120),
      ex('shoulders-cable-lateral-raise',          4, 15, 20, 2,  75),
      ex('triceps-dips',                           3,  8, 12, 2,  90),
      ex('triceps-cable-pushdown',                 3, 12, 15, 2,  75),
    ],
  })
  r.addDay({
    name: 'Pull A — Espalda Ancha, Bíceps',
    isRestDay: false,
    exercises: [
      ex('back-pull-up',                           5,  4,  6, 1, 210),
      ex('back-barbell-row',                       4,  5,  8, 2, 180),
      ex('back-lat-pulldown',                      3, 10, 12, 2, 120),
      ex('back-face-pull',                         4, 15, 20, 2,  90),
      ex('biceps-ez-bar-curl',                     4,  8, 12, 2,  90),
      ex('biceps-hammer-curl',                     3, 12, 15, 3,  75),
    ],
  })
  r.addDay({
    name: 'Legs A — Quad, Fuerza',
    isRestDay: false,
    exercises: [
      ex('quads-squat',                            5,  3,  5, 1, 240),
      ex('quads-leg-press',                        4,  8, 12, 2, 150),
      ex('quads-hack-squat',                       4, 10, 15, 2,  90),
      ex('quads-bulgarian-split-squat',            3, 10, 12, 2, 120),
      ex('calves-seated-calf-raise',               4, 12, 20, 2,  75),
    ],
  })
  r.addDay({
    name: 'Push B — Hombros, Pecho Vertical',
    isRestDay: false,
    exercises: [
      ex('shoulders-overhead-press',               5,  3,  5, 1, 240),
      ex('chest-incline-dumbbell-press',           3, 10, 12, 2, 120),
      ex('shoulders-lateral-raise',                4, 12, 15, 2,  90),
      ex('chest-dumbbell-bench-press',             3, 10, 12, 2, 120),
      ex('shoulders-rear-delt-fly',                3, 15, 20, 3,  75),
      ex('triceps-overhead-extension',             3, 12, 15, 2,  75),
    ],
  })
  r.addDay({
    name: 'Pull B — Espalda Gruesa, Bíceps',
    isRestDay: false,
    exercises: [
      ex('back-deadlift',                          5,  2,  4, 1, 300),
      ex('back-cable-row',                         4,  8, 12, 2, 150),
      ex('back-dumbbell-row',                      4,  8, 12, 2, 120),
      ex('back-face-pull',                         3, 15, 20, 3,  75),
      ex('biceps-concentration-curl',              3, 12, 15, 2,  75),
      ex('biceps-preacher-curl',                   3, 10, 12, 2,  90),
    ],
  })
  r.addDay({
    name: 'Legs B — Glutes, Isquios',
    isRestDay: false,
    exercises: [
      ex('back-romanian-deadlift',                 4,  6, 10, 2, 180),
      ex('glutes-hip-thrust',                      5,  8, 12, 2, 150),
      ex('hamstrings-leg-curl',                    4, 10, 15, 2,  90),
      ex('hamstrings-seated-leg-curl',             3, 12, 15, 2,  90),
      ex('calves-standing-calf-raise',             4, 12, 20, 2,  75),
    ],
  })
  r.addDay({ name: 'Descanso Completo', isRestDay: true, restDayType: 'complete', exercises: [] })
  return r
}

// ─── Template selector ────────────────────────────────────────────────────────

function selectBaseTemplate(profile: PersonalizationProfile): Routine {
  const goalLabel: Record<string, string> = {
    'fat-loss':      'Pérdida de Grasa',
    'muscle-gain':   'Ganancia Muscular',
    'strength':      'Fuerza',
    'recomposition': 'Recomposición',
    'performance':   'Rendimiento',
  }
  const levelLabel: Record<string, string> = {
    beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado',
  }
  const name = `${levelLabel[profile.level]} · ${profile.trainingFrequency} días · ${goalLabel[profile.primaryGoal]}`

  if (profile.level === 'beginner') return buildBeginnerFullBody(name)
  if (profile.level === 'intermediate') {
    return profile.trainingFrequency <= 3
      ? buildIntermediatePPL(name)
      : buildIntermediateUpperLower(name)
  }
  return profile.trainingFrequency >= 6
    ? buildAdvancedPPL6(name)
    : buildAdvancedPPL5(name)
}

// ─── Modifier ─────────────────────────────────────────────────────────────────

function applyModifiers(
  baseRoutine: Routine,
  profile: PersonalizationProfile,
  baseRir: { main: number; accessories: number },
): { routine: Routine; rir: { main: number; accessories: number } } {
  const rirBonus = profile.ageGroup === 'senior' ? 1 : 0
  const finalRir = {
    main:        Math.min(3, baseRir.main        + rirBonus),
    accessories: Math.min(4, baseRir.accessories + rirBonus),
  }

  const restDelta = REST_DELTA_BY_GOAL[profile.primaryGoal] + REST_DELTA_BY_AGE[profile.ageGroup]
  const setsDelta = SETS_DELTA_BY_AGE[profile.ageGroup]

  const modified = Routine.create({
    name: baseRoutine.name,
    description: baseRoutine.description,
  })

  for (const day of baseRoutine.days) {
    if (day.isRestDay) {
      modified.addDay({ name: day.name, isRestDay: true, restDayType: day.restDayType, exercises: [] })
      continue
    }

    const dayLow = day.name.toLowerCase()

    // Determine day type for emphasis matching
    const isLegDay  = dayLow.includes('leg') || dayLow.includes('lower') || dayLow.includes('pierna')
    const isPushDay = dayLow.includes('push') || dayLow.includes('upper')
    const isPullDay = dayLow.includes('pull') || dayLow.includes('upper')
    const isFullDay = dayLow.includes('full')

    const modifiedExercises = day.exercises.map((exercise, idx) => {
      const isMain   = idx < 2  // first 2 exercises = main compound lifts
      const newRir   = isMain ? finalRir.main : finalRir.accessories
      const newSets  = Math.max(2, exercise.sets + setsDelta)
      const newRest  = Math.max(60, exercise.restSeconds + restDelta)
      return {
        ...exercise,
        sets:       newSets,
        rirTarget:  newRir,
        restSeconds: newRest,
        repRange:   RepRange.create(exercise.repRange.min, exercise.repRange.max),
      }
    })

    // Add muscle emphasis extras (deduplicated)
    const existingIds = new Set(modifiedExercises.map(e => e.exerciseId))
    const emphasisExtras: typeof modifiedExercises = []

    for (const focus of profile.muscleFocus) {
      for (const item of EMPHASIS_EXTRAS[focus] ?? []) {
        const matches =
          (item.days.includes('push')   && isPushDay) ||
          (item.days.includes('pull')   && isPullDay) ||
          (item.days.includes('legs')   && isLegDay)  ||
          (item.days.includes('lower')  && isLegDay)  ||
          (item.days.includes('pierna') && isLegDay)  ||
          (item.days.includes('full')   && isFullDay)

        if (matches && !existingIds.has(item.exercise.exerciseId)) {
          emphasisExtras.push({
            ...item.exercise,
            rirTarget: finalRir.accessories,
            restSeconds: Math.max(60, item.exercise.restSeconds + restDelta),
            repRange: RepRange.create(item.exercise.repRange.min, item.exercise.repRange.max),
          })
          existingIds.add(item.exercise.exerciseId)
        }
      }
    }

    modified.addDay({
      name: day.name,
      isRestDay: false,
      exercises: [...modifiedExercises, ...emphasisExtras],
    })
  }

  return { routine: modified, rir: finalRir }
}

// ─── Cardio protocols ─────────────────────────────────────────────────────────

function buildCardioProtocol(profile: PersonalizationProfile): CardioProtocol {
  const senior = profile.ageGroup === 'senior'

  const protocols: Partial<Record<PrimaryGoal, CardioProtocol>> = {
    'fat-loss': {
      sessionsPerWeek: senior ? 3 : 4,
      modalities: senior
        ? [{ type: 'LISS', durationMinutes: 35, intensityNote: 'Caminata rápida o bicicleta suave. FC 110-130 lpm.' }]
        : [
            { type: 'LISS', durationMinutes: 35, intensityNote: 'Caminata inclinada, bicicleta o elíptica. FC 120-140 lpm.' },
            { type: 'HIIT', durationMinutes: 20, intensityNote: '8 rondas: 20s al 90% intensidad + 40s recuperación activa. Alterna con LISS.' },
          ],
      timing: 'Post-entrenamiento o días de descanso. No HIIT + piernas el mismo día.',
      hrZone: { low: 120, high: 155 },
      notes: [
        'Prioriza LISS si entrenas piernas ese día para no comprometer recuperación',
        'Al menos 6h de separación entre cardio intenso y sesión de pesas',
        'Hidratación: 500 ml extra por cada sesión de cardio',
      ],
    },
    'muscle-gain': {
      sessionsPerWeek: senior ? 1 : 2,
      modalities: [
        { type: 'LISS', durationMinutes: 25, intensityNote: 'Caminata, bicicleta suave o natación tranquila. FC < 130 lpm.' },
      ],
      timing: 'Días de descanso o post-upper. Evitar post-piernas.',
      hrZone: { low: 100, high: 130 },
      notes: [
        'El cardio excesivo compite con la síntesis proteica — mantén el volumen mínimo',
        'Cardio post-piernas puede frenar la recuperación y las ganancias de masa',
        '8.000-10.000 pasos diarios es suficiente como base cardiovascular para ganancia muscular',
      ],
    },
    'strength': {
      sessionsPerWeek: 2,
      modalities: [
        { type: 'LISS', durationMinutes: 20, intensityNote: 'Caminata o bicicleta muy suave. FC < 125 lpm. Objetivo: salud cardíaca, no composición.' },
      ],
      timing: 'Días de descanso. Nunca antes de sentadilla o peso muerto pesado.',
      hrZone: { low: 100, high: 125 },
      notes: [
        'El cardio está aquí para salud cardiovascular, no para composición corporal',
        'Evitar cardio de alta intensidad — compromete la recuperación del sistema nervioso central',
        'Caminatas de 20-30 min son el mejor complemento para atletas de fuerza pura',
      ],
    },
    'recomposition': {
      sessionsPerWeek: senior ? 2 : 3,
      modalities: [
        { type: 'LISS',     durationMinutes: 30, intensityNote: 'Bicicleta, elíptica o caminata inclinada. FC 125-145 lpm.' },
        { type: 'HIIT',     durationMinutes: 15, intensityNote: '6 rondas: 30s al 85% + 30s descanso. Solo 1×/semana.' },
      ],
      timing: 'Post-entrenamiento (cardio moderado) o días de descanso.',
      hrZone: { low: 125, high: 150 },
      notes: [
        'La recomposición es más lenta que un ciclo de cut/bulk separados — ten paciencia',
        'Déficit calórico moderado (200-300 kcal): maximiza pérdida de grasa sin sacrificar músculo',
        'Prioriza el sueño (7-9h): es cuando ocurre la síntesis muscular real',
      ],
    },
    'performance': {
      sessionsPerWeek: 2,
      modalities: [
        { type: 'HIIT',     durationMinutes: 20, intensityNote: 'Sprints, remo o ciclismo. Intervalos 1:2 esfuerzo:descanso.' },
        { type: 'Moderate', durationMinutes: 30, intensityNote: 'Carrera o ciclismo a ritmo moderado. FC 140-160 lpm.' },
      ],
      timing: 'Sesión separada (mañana si pesas en tarde) o días de descanso.',
      hrZone: { low: 140, high: 165 },
      notes: [
        'Periodiza el cardio junto al ciclo de fuerza — reduce volumen en semanas pesadas',
        'Al menos 48h de recuperación entre sesiones de alta intensidad',
        'Incluye trabajo de movilidad dinámica antes del cardio de alta intensidad',
      ],
    },
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return (protocols[profile.primaryGoal] ?? protocols['muscle-gain'])!
}

// ─── Recovery notes ───────────────────────────────────────────────────────────

function buildRecoveryNotes(profile: PersonalizationProfile): string[] {
  const notes: string[] = []

  if (profile.ageGroup === 'mature') {
    notes.push('Calentamiento extendido (10-15 min): movilidad articular + activación antes de cargas máximas')
    notes.push('Descansa 48-72h entre sesiones que trabajen los mismos grupos musculares')
    notes.push('Prioriza el sueño (7-9h): la recuperación y síntesis muscular ocurren principalmente de noche')
    notes.push('Considera colágeno hidrolizado y vitamina D para salud articular y ósea')
  }

  if (profile.ageGroup === 'senior') {
    notes.push('Calentamiento de 15+ min: articulaciones, movilidad dinámica y activación neuromuscular')
    notes.push('72-96h de recuperación recomendadas entre sesiones intensas del mismo grupo muscular')
    notes.push('El sueño es crítico (8-9h): la hormona de crecimiento cae significativamente después de los 50')
    notes.push('1-2 sesiones semanales de movilidad/yoga para mantener rango de movimiento articular')
    notes.push('Consulta con tu médico antes de cambios drásticos de intensidad o volumen')
  }

  if (profile.level === 'advanced') {
    notes.push('Deload cada 4-6 semanas: reduce el volumen total al 50% para promover supercompensación')
    notes.push('Monitorea signos de sobreentrenamiento: calidad del sueño, FC en reposo, motivación diaria')
  }

  if (profile.primaryGoal === 'strength') {
    notes.push('Incluye semanas de transición entre bloques pesados con mayor volumen y menor intensidad')
  }

  return notes
}

// ─── LocalTemplateGenerator ───────────────────────────────────────────────────

export class LocalTemplateGenerator implements IRoutineGenerator {
  async generate(profile: PersonalizationProfile): Promise<RoutineOutput> {
    const baseRir     = RIR_BY_GOAL[profile.primaryGoal]
    const baseRoutine = selectBaseTemplate(profile)
    const { routine, rir } = applyModifiers(baseRoutine, profile, baseRir)
    const cardioProtocol  = buildCardioProtocol(profile)
    const recoveryNotes   = buildRecoveryNotes(profile)

    return { routine, cardioProtocol, recoveryNotes, rir, profile }
  }
}

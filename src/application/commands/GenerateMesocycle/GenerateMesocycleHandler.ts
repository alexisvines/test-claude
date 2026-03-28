import { Routine, type RoutineDay } from '../../../domain/entities/Routine'
import { RepRange } from '../../../domain/value-objects/RepRange'
import type { IRoutineRepository } from '../../../domain/repositories/IRoutineRepository'
import type { IAthleteRepository } from '../../../domain/repositories/IAthleteRepository'
import type {
  GenerateMesocycleCommand,
  GenerateMesocycleResult,
  MesocycleDayPreview,
  MesocycleAIResponse,
} from './GenerateMesocycleCommand'

export interface IMesocycleAIPort {
  generateMesocycle(command: GenerateMesocycleCommand): Promise<MesocycleAIResponse | null>
}

// Plan offline básico cuando no hay clave de Gemini
function buildOfflinePlan(command: GenerateMesocycleCommand): MesocycleAIResponse {
  const goalName: Record<string, string> = {
    strength: 'Fuerza', hypertrophy: 'Hipertrofia', 'strength-hypertrophy': 'Fuerza + músculo',
  }
  const hasBarbell = command.equipment.includes('barbell')
  const hasDumbbell = command.equipment.includes('dumbbell')

  const pushExercises = [
    hasBarbell ? 'chest-barbell-bench-press' : 'chest-dumbbell-bench-press',
    hasDumbbell ? 'shoulders-dumbbell-shoulder-press' : 'shoulders-overhead-press',
    'triceps-cable-pushdown',
  ]
  const pullExercises = [
    hasBarbell ? 'back-barbell-row' : 'back-dumbbell-row',
    'back-lat-pulldown',
    hasDumbbell ? 'biceps-dumbbell-curl' : 'biceps-barbell-curl',
  ]
  const legExercises = [
    hasBarbell ? 'quads-squat' : 'quads-goblet-squat',
    'back-romanian-deadlift',
    'quads-leg-press',
  ]

  const makeDay = (name: string, exerciseIds: string[], setsOverride = 3) => ({
    name,
    isRestDay: false,
    exercises: exerciseIds.map(id => ({
      exerciseId: id,
      sets: setsOverride,
      repRangeMin: 8,
      repRangeMax: 12,
      rirTarget: 2,
      restSeconds: 120,
      progressionMethod: 'double-progression',
    })),
  })

  const restDay = { name: 'Descanso', isRestDay: true, exercises: [] }

  let days: MesocycleAIResponse['days']

  if (command.daysPerWeek === 3) {
    days = [
      makeDay('Día A — Empuje', pushExercises),
      restDay,
      makeDay('Día B — Jalón', pullExercises),
      restDay,
      makeDay('Día C — Piernas', legExercises),
      restDay,
      restDay,
    ]
  } else if (command.daysPerWeek === 4) {
    days = [
      makeDay('Día A — Empuje', pushExercises),
      makeDay('Día B — Jalón', pullExercises),
      restDay,
      makeDay('Día C — Piernas', legExercises),
      makeDay('Día D — Empuje + Jalón', [...pushExercises.slice(0, 2), ...pullExercises.slice(0, 2)]),
      restDay,
      restDay,
    ]
  } else {
    // 5-6 días: Upper/Lower
    days = [
      makeDay('Upper A', [...pushExercises.slice(0, 2), ...pullExercises.slice(0, 2)]),
      makeDay('Lower A', legExercises),
      makeDay('Upper B', [...pushExercises, pullExercises[2] ?? pullExercises[0]!]),
      makeDay('Lower B', [...legExercises.slice(0, 2)]),
      command.daysPerWeek >= 5
        ? makeDay('Full Body', [pushExercises[0]!, pullExercises[0]!, legExercises[0]!])
        : restDay,
      command.daysPerWeek >= 6
        ? makeDay('Full Body B', [pushExercises[1]!, pullExercises[1]!, legExercises[1]!])
        : restDay,
      restDay,
    ]
  }

  return {
    name: `Mesociclo ${goalName[command.goal] ?? 'Básico'} 8 semanas`,
    weeks: 8,
    days,
  }
}

function mapAIResponseToRoutine(
  response: MesocycleAIResponse,
  knownExerciseIds: Set<string>
): { name: string; days: RoutineDay[] } {
  const days: RoutineDay[] = response.days.map(d => {
    if (d.isRestDay) {
      return {
        id: crypto.randomUUID(),
        name: d.name || 'Descanso',
        isRestDay: true,
        restDayType: 'complete' as const,
        exercises: [],
      }
    }

    const exercises = d.exercises
      .filter(ex => {
        // Validar que el ejerciseId existe o al menos tiene formato válido
        return ex.exerciseId && ex.exerciseId.includes('-')
      })
      .map(ex => ({
        exerciseId: ex.exerciseId,
        sets: Math.max(1, Math.min(10, ex.sets)),
        repRange: RepRange.create(
          Math.max(1, ex.repRangeMin),
          Math.min(50, ex.repRangeMax)
        ),
        rirTarget: Math.max(0, Math.min(5, ex.rirTarget)),
        restSeconds: Math.max(30, Math.min(600, ex.restSeconds)),
        progressionMethod: (
          ['double-progression', 'linear', 'rpe-based', 'wave-loading'].includes(ex.progressionMethod)
            ? ex.progressionMethod
            : 'double-progression'
        ) as 'double-progression' | 'linear' | 'rpe-based' | 'wave-loading',
      }))

    return {
      id: crypto.randomUUID(),
      name: d.name,
      isRestDay: false,
      exercises,
    }
  })

  void knownExerciseIds  // disponible para validación adicional si se desea

  return { name: response.name, days }
}

export class GenerateMesocycleHandler {
  constructor(
    private readonly routineRepo: IRoutineRepository,
    private readonly athleteRepo: IAthleteRepository,
    private readonly mesocycleAI: IMesocycleAIPort
  ) {}

  async handle(command: GenerateMesocycleCommand): Promise<GenerateMesocycleResult> {
    // Intentar con IA, caer a offline si falla
    let aiResponse = await this.mesocycleAI.generateMesocycle(command)
    if (!aiResponse) {
      aiResponse = buildOfflinePlan(command)
    }

    const mapped = mapAIResponseToRoutine(aiResponse, new Set())
    const routine = Routine.create({ name: mapped.name, days: mapped.days })

    // Guardar la rutina
    await this.routineRepo.save(routine)

    // Establecer como rutina activa del atleta
    const athlete = await this.athleteRepo.getDefault()
    if (athlete) {
      athlete.setActiveRoutine(routine.id)
      await this.athleteRepo.save(athlete)
    }

    // Construir preview para la UI
    const days: MesocycleDayPreview[] = routine.days.map(d => ({
      name: d.name,
      isRestDay: d.isRestDay,
      exercises: d.exercises.map(ex => ({
        exerciseId: ex.exerciseId,
        sets: ex.sets,
        repRangeMin: ex.repRange.min,
        repRangeMax: ex.repRange.max,
        rirTarget: ex.rirTarget,
        restSeconds: ex.restSeconds,
        progressionMethod: ex.progressionMethod,
      })),
    }))

    return {
      routineId: routine.id,
      name: routine.name,
      weeks: aiResponse.weeks,
      days,
    }
  }
}

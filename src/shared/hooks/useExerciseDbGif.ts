import { useQuery } from '@tanstack/react-query'

const EXERCISEDB_BASE = 'https://exercisedb.dev/api/v1'

interface ExerciseDbItem {
  id: string
  name: string
  gifUrl: string
  bodyPart: string
  target: string
  equipment: string
}

/** Generate multiple name variants to maximize ExerciseDB match rate */
function getNameVariants(exerciseName: string): string[] {
  const base = exerciseName.toLowerCase()
  const variants: string[] = [base]

  // "Skull Crusher / French Press" → try each part separately
  if (base.includes(' / ')) {
    variants.push(...base.split(' / ').map(p => p.trim()))
  }

  // "Pull-Up", "T-Bar Row", "EZ-Bar Curl" → remove hyphens
  if (base.includes('-')) {
    variants.push(base.replace(/-/g, ' '))
  }

  // "Pec Deck Machine", "Hip Abductor Machine" → strip " machine"
  if (base.endsWith(' machine')) {
    variants.push(base.slice(0, -8).trim())
  }

  // Strip common equipment prefixes for a broader search
  const stripped = base.replace(
    /^(barbell|dumbbell|cable|ez-bar|ez bar|resistance band|seated|standing|lying) /,
    ''
  )
  if (stripped !== base) variants.push(stripped)

  return [...new Set(variants)]
}

async function fetchExerciseGifUrl(exerciseName: string): Promise<string | null> {
  const variants = getNameVariants(exerciseName)

  for (const variant of variants) {
    let res: Response
    try {
      res = await fetch(
        `${EXERCISEDB_BASE}/exercises/name/${encodeURIComponent(variant)}?limit=5`,
        { signal: AbortSignal.timeout(8000) }
      )
    } catch {
      continue
    }

    if (!res.ok) continue

    const data: unknown = await res.json()
    const exercises: ExerciseDbItem[] = Array.isArray(data)
      ? (data as ExerciseDbItem[])
      : ((data as Record<string, unknown>).exercises as ExerciseDbItem[] | undefined) ?? []

    if (!exercises.length) continue

    const exact = exercises.find(e => e.name.toLowerCase() === variant)
    const match = exact ?? exercises[0]
    if (match?.gifUrl) return match.gifUrl
  }

  return null
}

export function useExerciseDbGif(exerciseName: string) {
  return useQuery<string | null>({
    queryKey: ['exercisedb-gif', exerciseName],
    queryFn: () => fetchExerciseGifUrl(exerciseName),
    staleTime: 1000 * 60 * 60 * 24, // 24h
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
    enabled: !!exerciseName,
  })
}

// Keep original hook for fallback JPG images
const GITHUB_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises'

const FREE_EXERCISE_DB_MAP: Record<string, string> = {
  // CHEST
  'Barbell Bench Press':          'Barbell_Bench_Press_-_Medium_Grip',
  'Incline Barbell Bench Press':  'Barbell_Incline_Bench_Press_-_Medium_Grip',
  'Decline Bench Press':          'Barbell_Decline_Bench_Press',
  'Dumbbell Bench Press':         'Dumbbell_Bench_Press',
  'Incline Dumbbell Press':       'Dumbbell_Incline_Bench_Press',
  'Chest Dips':                   'Chest_Dip',
  'Cable Crossover':              'Cable_Crossover',
  'Pec Deck Machine':             'Pec_Deck_Fly',
  'Cable Fly':                    'Low_Cable_Crossover',
  'Dumbbell Fly':                 'Dumbbell_Fly',
  'Push-Up':                      'Push-up',
  // BACK
  'Deadlift':                     'Barbell_Deadlift',
  'Pull-Up':                      'Pull-up',
  'Chin-Up':                      'Chin-up',
  'Barbell Row':                  'Barbell_Bent_Over_Row',
  'Dumbbell Row':                 'Dumbbell_Bent_Over_Row',
  'Lat Pulldown':                 'Cable_Pulldown',
  'Cable Row':                    'Cable_Seated_Row',
  'T-Bar Row':                    'T-Bar_Row_with_Handle',
  'Face Pull':                    'Cable_Rear_Delt_Row',
  'Romanian Deadlift':            'Romanian_Deadlift',
  'Sumo Deadlift':                'Sumo_Deadlift',
  'Back Extension':               'Back_Extension',
  // SHOULDERS
  'Overhead Press':               'Barbell_Shoulder_Press',
  'Dumbbell Shoulder Press':      'Dumbbell_Shoulder_Press',
  'Arnold Press':                 'Arnold_Dumbbell_Press',
  'Lateral Raise':                'Dumbbell_Lateral_Raise',
  'Cable Lateral Raise':          'Cable_Lateral_Raise',
  'Rear Delt Fly':                'Bent_Over_Dumbbell_Rear_Delt_Row',
  'Front Raise':                  'Dumbbell_Front_Raise',
  // BICEPS
  'Barbell Curl':                 'Barbell_Curl',
  'EZ-Bar Curl':                  'EZ_Barbell_Curl',
  'Dumbbell Curl':                'Dumbbell_Alternate_Bicep_Curl',
  'Hammer Curl':                  'Hammer_Curl',
  'Preacher Curl':                'Barbell_Preacher_Curl',
  'Concentration Curl':           'Concentration_Curl',
  'Cable Curl':                   'Cable_Curl',
  // TRICEPS
  'Close Grip Bench Press':       'Barbell_Close_Grip_Bench_Press',
  'Skull Crusher / French Press': 'EZ_Barbell_Skull_Crusher',
  'Overhead Tricep Extension':    'Dumbbell_Tricep_Extension',
  'Cable Pushdown':               'Triceps_Pushdown',
  'Cable Overhead Extension':     'Cable_Overhead_Tricep_Extension',
  'Tricep Kickback':              'Dumbbell_Tricep_Kickback',
  'Tricep Dips':                  'Tricep_Dip',
  // QUADS
  'Barbell Back Squat':           'Barbell_Squat',
  'Front Squat':                  'Barbell_Front_Squat',
  'Goblet Squat':                 'Dumbbell_Goblet_Squat',
  'Leg Press':                    'Leg_Press',
  'Hack Squat':                   'Hack_Squat',
  'Leg Extension':                'Leg_Extension',
  'Bulgarian Split Squat':        'Barbell_Bulgarian_Split_Squat',
  'Walking Lunges':               'Barbell_Walking_Lunge',
  // HAMSTRINGS
  'Lying Leg Curl':               'Lying_Leg_Curl',
  'Seated Leg Curl':              'Seated_Leg_Curl',
  'Nordic Curl':                  'Inverse_Leg_Curl',
  // GLUTES
  'Hip Thrust':                   'Barbell_Hip_Thrust',
  'Glute Bridge':                 'Glute_Bridge',
  'Cable Glute Kickback':         'Cable_Glute_Kickback',
  'Hip Abductor Machine':         'Hip_Abductor',
  // CALVES
  'Standing Calf Raise':          'Standing_Calf_Raise',
  'Seated Calf Raise':            'Seated_Calf_Raise',
  // CORE
  'Plank':                        'Plank',
  'Side Plank':                   'Side_Plank',
  'Crunch':                       'Crunch',
  'Hanging Leg Raise':            'Hanging_Leg_Raise',
  'Ab Wheel Rollout':             'Ab_Wheel_Rollout',
  'Dragon Flag':                  'Dragon_Flag',
  // TRAPS
  'Barbell Shrug':                'Barbell_Shrug',
  'Dumbbell Shrug':               'Dumbbell_Shrug',
  // LATS
  'Dumbbell Pullover':            'Dumbbell_Pullover',
  'Straight Arm Pulldown':        'Straight_Arm_Dumbbell_Pullover',
  // FOREARMS
  'Wrist Curl':                   'Wrist_Curl',
  'Reverse Curl':                 'Reverse_Curl',
}

export function useExerciseThumbnail(exerciseName: string): string {
  const mapped = FREE_EXERCISE_DB_MAP[exerciseName]
  const id = mapped ?? exerciseName.split(' ').join('_')
  return `${GITHUB_BASE}/${id}/0.jpg`
}

export function useExerciseImages(exerciseName: string) {
  const mapped = FREE_EXERCISE_DB_MAP[exerciseName]
  const id = mapped ?? exerciseName.split(' ').join('_')
  const base = `${GITHUB_BASE}/${id}`
  return {
    img0: `${base}/0.jpg`,
    img1: `${base}/1.jpg`,
  }
}

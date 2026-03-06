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

async function fetchExerciseGifUrl(exerciseName: string): Promise<string | null> {
  const name = exerciseName.toLowerCase()
  const res = await fetch(
    `${EXERCISEDB_BASE}/exercises/name/${encodeURIComponent(name)}?limit=5`,
    { signal: AbortSignal.timeout(6000) }
  )

  if (!res.ok) return null

  const data: unknown = await res.json()
  const exercises: ExerciseDbItem[] = Array.isArray(data)
    ? (data as ExerciseDbItem[])
    : ((data as Record<string, unknown>).exercises as ExerciseDbItem[] | undefined) ?? []

  if (!exercises.length) return null

  const exact = exercises.find(e => e.name.toLowerCase() === name)
  const match = exact ?? exercises[0]
  return match?.gifUrl ?? null
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

export function useExerciseImages(exerciseName: string) {
  const id = exerciseName.split(' ').join('_')
  return {
    img0: `${GITHUB_BASE}/${id}/0.jpg`,
    img1: `${GITHUB_BASE}/${id}/1.jpg`,
  }
}

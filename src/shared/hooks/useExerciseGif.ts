import { useQuery } from '@tanstack/react-query'

export function useExerciseGif(exerciseName: string) {
  return useQuery({
    queryKey: ['exercise-gif', exerciseName],
    queryFn: async () => {
      const res = await fetch(
        `https://exercisedb-api.vercel.app/api/v1/exercises/name/${encodeURIComponent(exerciseName)}?limit=1`
      )
      if (!res.ok) return null
      const json = (await res.json()) as { data?: { gifUrl?: string }[] }
      return (json.data?.[0]?.gifUrl as string) ?? null
    },
    staleTime: 1000 * 60 * 60 * 24,
    retry: 1,
  })
}

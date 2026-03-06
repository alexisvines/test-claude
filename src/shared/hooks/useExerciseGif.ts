const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises'

export function useExerciseImages(exerciseName: string) {
  const id = exerciseName.split(' ').join('_')
  return {
    img0: `${BASE}/${id}/0.jpg`,
    img1: `${BASE}/${id}/1.jpg`,
  }
}

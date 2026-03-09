import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { getContainer } from '@/infrastructure/container/DIContainer'
import { MUSCLE_GROUPS, MUSCLE_GROUP_LABELS, type MuscleGroup } from '@/domain/value-objects/MuscleGroup'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { useExerciseImages, useExerciseDbGif, useExerciseThumbnail } from '@/shared/hooks/useExerciseGif'
import { cn } from '@/shared/utils/cn'
import type { Exercise } from '@/domain/entities/Exercise'
import { MuscleDiagram } from '@/presentation/features/exercises/components/MuscleDiagram'

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barra', dumbbell: 'Mancuerna', cable: 'Polea', machine: 'Máquina',
  bodyweight: 'Peso corporal', kettlebell: 'Kettlebell', 'pull-up-bar': 'Barra fija', 'ez-bar': 'Barra EZ',
}

const MUSCLE_EMOJIS: Record<string, string> = {
  chest: '💪', back: '🔙', lats: '🦅', shoulders: '🏋️', biceps: '💪',
  triceps: '💪', forearms: '🤜', quadriceps: '🦵', hamstrings: '🦵',
  glutes: '🍑', calves: '🦶', core: '🎯', traps: '🐂',
}

function ExerciseThumbnail({ exercise }: { exercise: Exercise }) {
  const thumbnailUrl = useExerciseThumbnail(exercise.name)
  const [stage, setStage] = useState<'thumb' | 'gif' | 'error'>('thumb')
  // Only fire the API query when GitHub JPG failed — avoids 73 simultaneous requests on list load
  const { data: gifUrl, isLoading: gifLoading } = useExerciseDbGif(
    stage === 'gif' ? exercise.name : ''
  )
  const primaryEmoji = exercise.primaryMuscles[0] !== undefined
    ? (MUSCLE_EMOJIS[exercise.primaryMuscles[0]] ?? '🏋️') : '🏋️'

  if (stage === 'error') {
    return (
      <div className="w-14 h-14 rounded-[var(--radius-md)] bg-[var(--color-surface-03)] flex items-center justify-center shrink-0 text-2xl">
        {primaryEmoji}
      </div>
    )
  }

  if (stage === 'gif') {
    // Show skeleton while the API request is in-flight (prevents race condition)
    if (gifLoading) {
      return <div className="w-14 h-14 rounded-[var(--radius-md)] bg-[var(--color-surface-03)] animate-pulse shrink-0" />
    }
    if (!gifUrl) {
      return (
        <div className="w-14 h-14 rounded-[var(--radius-md)] bg-[var(--color-surface-03)] flex items-center justify-center shrink-0 text-2xl">
          {primaryEmoji}
        </div>
      )
    }
    return (
      <img
        src={gifUrl}
        alt={exercise.nameEs}
        loading="lazy"
        decoding="async"
        onError={() => setStage('error')}
        className="w-14 h-14 rounded-[var(--radius-md)] object-cover shrink-0 bg-[var(--color-surface-03)]"
      />
    )
  }

  // stage === 'thumb' — try GitHub static JPG first
  return (
    <img
      src={thumbnailUrl}
      alt={exercise.nameEs}
      loading="lazy"
      decoding="async"
      onError={() => setStage('gif')}
      className="w-14 h-14 rounded-[var(--radius-md)] object-cover shrink-0 bg-[var(--color-surface-03)]"
    />
  )
}

function ExerciseDetail({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  const { data: gifUrl, isLoading: gifLoading } = useExerciseDbGif(exercise.name)
  const { img0, img1 } = useExerciseImages(exercise.name)
  const primaryEmoji = exercise.primaryMuscles[0] !== undefined ? (MUSCLE_EMOJIS[exercise.primaryMuscles[0]] ?? '🏋️') : '🏋️'
  const [imgState, setImgState] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [gifError, setGifError] = useState(false)
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    setImgState('loading')
    setGifError(false)
    setFrame(0)
  }, [exercise.name])

  useEffect(() => {
    if (imgState !== 'loaded') return
    const id = setInterval(() => setFrame(f => (f === 0 ? 1 : 0)), 1500)
    return () => clearInterval(id)
  }, [imgState])

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      className="fixed inset-0 bg-[var(--color-base)] z-50 overflow-y-auto"
    >
      <div className="sticky top-0 bg-[var(--color-base)] border-b border-[var(--color-border)] px-4 py-3 flex items-center gap-3">
        <button
          onClick={onClose}
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-2 -ml-2"
        >
          ←
        </button>
        <h1 className="font-display text-xl font-bold text-[var(--color-text-primary)]">
          {exercise.nameEs}
        </h1>
      </div>

      <div className="p-4 space-y-5">
        {/* Exercise animation — GIF from ExerciseDB, fallback to JPG crossfade */}
        <div
          className="relative rounded-xl overflow-hidden bg-[var(--color-surface-02)]"
          style={{ minHeight: '14rem' }}
        >
          {/* Skeleton while loading */}
          {(gifLoading || (!gifUrl && !gifError && imgState === 'loading')) && (
            <div className="absolute inset-0 animate-pulse bg-[var(--color-surface-02)]" />
          )}

          {/* Animated GIF from ExerciseDB */}
          {gifUrl && !gifError ? (
            <img
              key={gifUrl}
              src={gifUrl}
              alt={exercise.nameEs}
              onError={() => setGifError(true)}
              className="w-full max-h-72 object-contain mx-auto"
              style={{ background: 'var(--color-surface-02)' }}
            />
          ) : !gifLoading && (
            /* Fallback: JPG crossfade */
            imgState === 'error' ? (
              <div className="h-40 flex items-center justify-center">
                <span className="text-7xl">{primaryEmoji}</span>
              </div>
            ) : (
              <>
                <img
                  src={img0}
                  alt={exercise.nameEs}
                  onLoad={() => setImgState('loaded')}
                  onError={() => setImgState('error')}
                  className={cn(
                    'w-full max-h-64 object-cover transition-opacity duration-700',
                    imgState === 'loading' ? 'opacity-0' : frame === 0 ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {imgState === 'loaded' && (
                  <img
                    src={img1}
                    alt={exercise.nameEs}
                    className={cn(
                      'absolute inset-0 w-full max-h-64 object-cover transition-opacity duration-700',
                      frame === 1 ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                )}
              </>
            )
          )}
        </div>

        {/* Muscle groups + Diagram */}
        <div>
          <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">Músculos trabajados</p>
          <div className="flex gap-4 items-start">
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                {exercise.primaryMuscles.map(m => (
                  <span
                    key={m}
                    className="px-3 py-1 rounded-full text-sm font-semibold text-black"
                    style={{ backgroundColor: 'var(--color-accent)' }}
                  >
                    {MUSCLE_EMOJIS[m]} {MUSCLE_GROUP_LABELS[m]}
                  </span>
                ))}
                {exercise.muscleGroups.secondary.map(m => (
                  <span
                    key={m}
                    className="px-3 py-1 rounded-full text-sm border border-[var(--color-border)] text-[var(--color-text-secondary)]"
                  >
                    {MUSCLE_GROUP_LABELS[m]}
                  </span>
                ))}
              </div>
              <div className="flex gap-3 text-xs text-[var(--color-text-muted)]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#39FF14' }} />
                  Principal
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#22c55e' }} />
                  Secundario
                </span>
              </div>
            </div>
            <MuscleDiagram
              primary={exercise.primaryMuscles}
              secondary={exercise.muscleGroups.secondary}
              size="sm"
            />
          </div>
        </div>

        {/* Difficulty & Equipment */}
        <div className="flex gap-3">
          <div className="flex-1 bg-[var(--color-surface-02)] rounded-[var(--radius-md)] p-3">
            <p className="text-xs text-[var(--color-text-secondary)]">Dificultad</p>
            <p className="font-semibold text-sm capitalize">
              {exercise.difficulty === 'beginner' ? '🟢 Principiante' : exercise.difficulty === 'intermediate' ? '🟡 Intermedio' : '🔴 Avanzado'}
            </p>
          </div>
          <div className="flex-1 bg-[var(--color-surface-02)] rounded-[var(--radius-md)] p-3">
            <p className="text-xs text-[var(--color-text-secondary)]">Equipo</p>
            <p className="font-semibold text-sm">
              {exercise.equipment.map(e => EQUIPMENT_LABELS[e] ?? e).join(', ')}
            </p>
          </div>
        </div>

        {/* Instructions */}
        {exercise.instructions.length > 0 && (
          <div>
            <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">Instrucciones</p>
            <ol className="space-y-2">
              {exercise.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-[var(--color-text-primary)]">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black shrink-0"
                    style={{ backgroundColor: 'var(--color-accent)' }}>
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Tips */}
        {exercise.tips.length > 0 && (
          <div>
            <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">Tips</p>
            <div className="space-y-2">
              {exercise.tips.map((tip, i) => (
                <div key={i} className="flex gap-2 text-sm text-[var(--color-text-secondary)] bg-[var(--color-surface-02)] rounded-[var(--radius-md)] p-3">
                  <span>💡</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Common Mistakes */}
        {exercise.commonMistakes.length > 0 && (
          <div>
            <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">Errores comunes</p>
            <div className="space-y-2">
              {exercise.commonMistakes.map((mistake, i) => (
                <div key={i} className="flex gap-2 text-sm text-[var(--color-text-secondary)] bg-[var(--color-surface-02)] rounded-[var(--radius-md)] p-3">
                  <span>⚠️</span>
                  <span>{mistake}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function ExercisesPage() {
  const container = getContainer()
  const [search, setSearch] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null)
  const [selectedDifficulty] = useState<string | null>(null)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const debouncedSearch = useDebounce(search, 300)

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercises', debouncedSearch, selectedMuscle, selectedDifficulty],
    queryFn: () => container.exerciseRepo.findAll({
      search: debouncedSearch || undefined,
      muscleGroups: selectedMuscle ? [selectedMuscle] : undefined,
      difficulty: selectedDifficulty ?? undefined,
    }),
  })

  return (
    <div className="flex flex-col h-screen">
      {selectedExercise && (
        <ExerciseDetail exercise={selectedExercise} onClose={() => setSelectedExercise(null)} />
      )}

      <div className="sticky top-0 bg-[var(--color-base)] z-10">
        <div className="px-4 pt-4 pb-2">
          <h1 className="font-display text-3xl font-bold text-[var(--color-text-primary)] mb-3">
            Ejercicios
          </h1>
          <input
            type="search"
            placeholder="Buscar ejercicio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[var(--color-surface-02)] rounded-[var(--radius-md)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] border border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none transition-colors"
          />
        </div>

        {/* Muscle filters */}
        <div className="px-4 pb-2 overflow-x-auto">
          <div className="flex gap-2 pb-2" style={{ width: 'max-content' }}>
            <button
              onClick={() => setSelectedMuscle(null)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap',
                !selectedMuscle
                  ? 'bg-[var(--color-accent)] text-black'
                  : 'bg-[var(--color-surface-02)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
              )}
            >
              Todos
            </button>
            {MUSCLE_GROUPS.map(muscle => (
              <button
                key={muscle}
                onClick={() => setSelectedMuscle(selectedMuscle === muscle ? null : muscle)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap',
                  selectedMuscle === muscle
                    ? 'bg-[var(--color-accent)] text-black'
                    : 'bg-[var(--color-surface-02)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                )}
              >
                {MUSCLE_GROUP_LABELS[muscle]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-24">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 rounded-[var(--radius-md)] bg-[var(--color-surface-02)] animate-pulse" />
            ))}
          </div>
        ) : exercises.length === 0 ? (
          <div className="text-center py-12 text-[var(--color-text-secondary)]">
            <p className="text-4xl mb-3">🔍</p>
            <p>No se encontraron ejercicios</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {exercises.length} ejercicio{exercises.length !== 1 ? 's' : ''}
            </p>
            {exercises.map(exercise => (
              <motion.button
                key={exercise.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setSelectedExercise(exercise)}
                className="w-full text-left p-4 rounded-[var(--radius-md)] bg-[var(--color-surface-02)] border border-[var(--color-border)] hover:border-[var(--color-border-active)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ExerciseThumbnail exercise={exercise} />
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[var(--color-text-primary)] truncate">
                      {exercise.nameEs}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {exercise.primaryMuscles.map(m => MUSCLE_GROUP_LABELS[m]).join(' · ')}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      exercise.difficulty === 'beginner'
                        ? 'bg-green-900/40 text-green-400'
                        : exercise.difficulty === 'intermediate'
                          ? 'bg-yellow-900/40 text-yellow-400'
                          : 'bg-red-900/40 text-red-400'
                    )}>
                      {exercise.difficulty === 'beginner' ? 'Principiante' : exercise.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">
                      {exercise.equipment[0] ? (EQUIPMENT_LABELS[exercise.equipment[0]] ?? exercise.equipment[0]) : ''}
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

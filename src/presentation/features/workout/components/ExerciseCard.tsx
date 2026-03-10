import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Dumbbell, Target, Layers, Maximize2, Triangle, Grip,
  Zap, Footprints, Circle, Mountain, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import type { Exercise } from '@/domain/entities/Exercise'
import { MUSCLE_GROUP_LABELS } from '@/domain/value-objects/MuscleGroup'
import { MuscleDiagram } from '@/presentation/features/exercises/components/MuscleDiagram'
import { useExerciseThumbnail, useWgerImage } from '@/shared/hooks/useExerciseGif'

const MUSCLE_ICONS: Record<string, LucideIcon> = {
  chest: Dumbbell,
  back: Layers,
  lats: Maximize2,
  shoulders: Triangle,
  biceps: Dumbbell,
  triceps: Dumbbell,
  forearms: Grip,
  quadriceps: Zap,
  hamstrings: Footprints,
  glutes: Circle,
  calves: Footprints,
  core: Target,
  traps: Mountain,
}

const MUSCLE_COLOR: Record<string, string> = {
  chest: '#FF6B6B', back: '#4ECDC4', lats: '#45B7D1', shoulders: '#96CEB4',
  biceps: '#FFEAA7', triceps: '#DDA0DD', forearms: '#F0E68C', quadriceps: '#98FB98',
  hamstrings: '#FFB347', glutes: '#FF69B4', calves: '#87CEEB', core: '#FFA500', traps: '#C0C0C0',
}

function ExerciseMediaRow({ exercise }: { exercise: Exercise }) {
  const thumbnailUrl = useExerciseThumbnail(exercise.name)
  const [githubFailed, setGithubFailed] = useState(false)
  const { data: wgerUrl, isLoading: wgerLoading } = useWgerImage(exercise.name, githubFailed)
  const [wgerFailed, setWgerFailed] = useState(false)

  const showPlaceholder = githubFailed && (wgerFailed || (!wgerLoading && !wgerUrl))
  const muscleColor = MUSCLE_COLOR[exercise.primaryMuscles[0] ?? ''] ?? '#888'

  return (
    <div className="flex gap-3 pt-3 items-center">
      {/* Exercise image */}
      <div className="w-24 h-24 rounded-[var(--radius-md)] bg-[var(--color-surface-03)] overflow-hidden shrink-0 flex items-center justify-center">
        {showPlaceholder ? (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-1"
            style={{ background: `linear-gradient(135deg, ${muscleColor}22, ${muscleColor}44)` }}
          >
            <span className="text-2xl">🏋️</span>
            <span className="text-[8px] text-[var(--color-text-muted)] text-center px-1 leading-tight">
              {exercise.nameEs}
            </span>
          </div>
        ) : wgerLoading && githubFailed ? (
          <div className="w-full h-full flex items-center justify-center">
            <span className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : wgerUrl && githubFailed ? (
          <img
            src={wgerUrl}
            alt={exercise.nameEs}
            loading="lazy"
            onError={() => setWgerFailed(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={thumbnailUrl}
            alt={exercise.nameEs}
            loading="lazy"
            onError={() => setGithubFailed(true)}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      {/* Muscle diagram */}
      <div className="flex-1 flex justify-center">
        <MuscleDiagram
          primary={exercise.primaryMuscles}
          secondary={exercise.muscleGroups.secondary}
          size="sm"
        />
      </div>
    </div>
  )
}

interface Props {
  exercise: Exercise
  setCount: number
  targetSets: number
  isActive: boolean
  onClick: () => void
}

export function ExerciseCard({ exercise, setCount, targetSets, isActive, onClick }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)
  const progress = targetSets > 0 ? setCount / targetSets : 0
  const isComplete = setCount >= targetSets

  return (
    <motion.div
      layout
      className={cn(
        'rounded-[var(--radius-lg)] border transition-all cursor-pointer',
        isActive
          ? 'border-[var(--color-accent)] bg-[var(--color-surface-02)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface-01)]',
        isComplete && !isActive && 'opacity-60'
      )}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Muscle Icon */}
          {(() => {
            const Icon = MUSCLE_ICONS[exercise.primaryMuscles[0] ?? ''] ?? Dumbbell
            return (
              <div className="w-10 h-10 flex items-center justify-center bg-[var(--color-surface-03)] rounded-[var(--radius-md)] text-[var(--color-text-secondary)]">
                <Icon size={20} />
              </div>
            )
          })()}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[var(--color-text-primary)] truncate">
              {exercise.nameEs}
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {exercise.primaryMuscles.map(m => MUSCLE_GROUP_LABELS[m]).join(', ')}
            </p>
          </div>

          {/* Set count */}
          <div className="flex flex-col items-end gap-1">
            <span
              className={cn(
                'font-mono font-bold text-lg',
                isComplete ? 'text-[var(--color-success)]' : 'text-[var(--color-text-primary)]'
              )}
            >
              {setCount}/{targetSets}
            </span>
            {isComplete && <span className="text-xs text-[var(--color-success)]">✓ Completo</span>}
          </div>
        </div>

        {/* Progress bar */}
        {targetSets > 0 && (
          <div className="mt-3 h-1.5 bg-[var(--color-surface-03)] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: isComplete ? 'var(--color-success)' : 'var(--color-accent)' }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, progress * 100)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        {/* Expand/collapse instructions */}
        {exercise.instructions.length > 0 && (
          <button
            onClick={e => { e.stopPropagation(); setIsExpanded(p => !p) }}
            className="mt-2 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
            aria-expanded={isExpanded}
          >
            {isExpanded ? '▲ Ocultar instrucciones' : '▼ Ver instrucciones'}
          </button>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-[var(--color-border)]">
              {/* Image + Muscle diagram side by side */}
              <ExerciseMediaRow exercise={exercise} />

              <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide pt-1">
                Instrucciones
              </p>
              <ol className="space-y-1">
                {exercise.instructions.map((step, i) => (
                  <li key={i} className="text-sm text-[var(--color-text-secondary)] flex gap-2">
                    <span className="text-[var(--color-accent)] font-mono font-bold shrink-0">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
              {exercise.tips.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide pt-1">
                    Tips
                  </p>
                  {exercise.tips.map((tip, i) => (
                    <p key={i} className="text-sm text-[var(--color-text-secondary)] flex gap-2">
                      <span>💡</span>{tip}
                    </p>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

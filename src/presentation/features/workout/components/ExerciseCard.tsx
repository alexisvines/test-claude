import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/shared/utils/cn'
import type { Exercise } from '@/domain/entities/Exercise'
import { MUSCLE_GROUP_LABELS } from '@/domain/value-objects/MuscleGroup'

const MUSCLE_EMOJIS: Record<string, string> = {
  chest: '💪',
  back: '🔙',
  lats: '🦅',
  shoulders: '🏋️',
  biceps: '💪',
  triceps: '💪',
  forearms: '🤜',
  quadriceps: '🦵',
  hamstrings: '🦵',
  glutes: '🍑',
  calves: '🦶',
  core: '🎯',
  traps: '🐂',
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
          {/* Muscle Emoji */}
          <div className="text-2xl w-10 h-10 flex items-center justify-center bg-[var(--color-surface-03)] rounded-[var(--radius-md)]">
            {MUSCLE_EMOJIS[exercise.primaryMuscles[0] ?? ''] ?? '🏋️'}
          </div>

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
            <div className="px-4 pb-4 space-y-2 border-t border-[var(--color-border)]">
              <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide pt-3">
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

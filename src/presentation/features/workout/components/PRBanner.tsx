import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { ReactNode } from 'react'

interface Props {
  exerciseName: string | null
  onDismiss: () => void
}

function triggerConfetti(): void {
  import('canvas-confetti').then(({ default: confetti }) => {
    void confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#C8FF00', '#FFD700', '#FF6B35', '#34C759'],
    })
  }).catch(() => {/* ignore */})
}

function vibrateCelebration(): void {
  if ('vibrate' in navigator) {
    navigator.vibrate([100, 50, 100, 50, 200])
  }
}

export function PRBanner({ exerciseName, onDismiss }: Props): ReactNode {
  const hasTriggered = useRef(false)

  useEffect(() => {
    if (exerciseName && !hasTriggered.current) {
      hasTriggered.current = true
      triggerConfetti()
      vibrateCelebration()
      const timer = setTimeout(() => {
        onDismiss()
        hasTriggered.current = false
      }, 4000)
      return () => clearTimeout(timer)
    }
    if (!exerciseName) {
      hasTriggered.current = false
    }
  }, [exerciseName, onDismiss])

  return (
    <AnimatePresence>
      {exerciseName && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-sm"
          role="status"
          aria-live="polite"
          aria-label={`Nuevo récord personal en ${exerciseName}`}
        >
          <div
            className="rounded-[var(--radius-xl)] p-4 flex items-center gap-3"
            style={{
              background: 'linear-gradient(135deg, rgba(200,255,0,0.2), rgba(200,255,0,0.05))',
              border: '1px solid var(--color-accent)',
              boxShadow: 'var(--shadow-accent)',
            }}
          >
            <div className="text-3xl">🏆</div>
            <div>
              <p className="font-bold text-[var(--color-accent)] text-sm uppercase tracking-wide">
                ¡Nuevo Récord Personal!
              </p>
              <p className="text-[var(--color-text-primary)] font-semibold">
                {exerciseName}
              </p>
            </div>
            <button
              onClick={onDismiss}
              className="ml-auto text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors p-1"
              aria-label="Cerrar notificación"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { aiProviderFactory } from '@/infrastructure/ai/AIProviderFactory'
import { Button } from '@/presentation/design-system/components/Button'
import type { WorkoutContext, AIWorkoutEvaluation } from '@/application/ports/IAIEvaluationPort'
import { cn } from '@/shared/utils/cn'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  evaluation?: AIWorkoutEvaluation | null
  workoutContext?: WorkoutContext
  isOpen: boolean
  onClose: () => void
}

function ScoreCircle({ score }: { score: number }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - score / 100)

  const color = score >= 80 ? '#34C759' : score >= 60 ? '#FF9F0A' : '#FF2D55'

  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
        <motion.circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-mono text-3xl font-bold"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-[var(--color-text-secondary)]">/ 100</span>
      </div>
    </div>
  )
}

export function AICoachPanel({ evaluation, workoutContext, isOpen, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      const ai = aiProviderFactory.create()
      const response = await ai.chat(newMessages, workoutContext)
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Lo siento, ocurrió un error. Verifica tu clave de API en Ajustes.'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-[var(--color-surface-01)] rounded-t-[var(--radius-xl)] max-h-[85vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1 rounded-full bg-[var(--color-border-active)]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-[var(--color-border)]">
              <div>
                <h2 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
                  🤖 AI Coach
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Powered by Gemini 2.0 Flash
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors p-2"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Workout evaluation */}
              {evaluation && (
                <div className="p-4 space-y-4 border-b border-[var(--color-border)]">
                  <ScoreCircle score={evaluation.score} />
                  <p className="text-center text-sm text-[var(--color-text-secondary)]">
                    {evaluation.scoreExplanation}
                  </p>

                  {evaluation.praises.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-[var(--color-success)] uppercase tracking-wide">
                        ✅ Lo hiciste bien
                      </p>
                      {evaluation.praises.map((praise, i) => (
                        <div key={i} className="flex gap-2 text-sm text-[var(--color-text-secondary)]">
                          <span className="shrink-0">•</span>
                          <span>{praise}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {evaluation.improvements.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-[var(--color-warning)] uppercase tracking-wide">
                        💡 Áreas de mejora
                      </p>
                      {evaluation.improvements.map((imp, i) => (
                        <div key={i} className="flex gap-2 text-sm text-[var(--color-text-secondary)]">
                          <span className="shrink-0">•</span>
                          <span>{imp}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-[var(--color-surface-02)] rounded-[var(--radius-md)] p-3">
                    <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wide mb-1">
                      📅 Próxima sesión
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)]">{evaluation.nextSession}</p>
                  </div>

                  <div className="bg-[var(--color-surface-02)] rounded-[var(--radius-md)] p-3">
                    <p className="text-xs font-semibold text-[var(--color-info)] uppercase tracking-wide mb-1">
                      💤 Recuperación
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)]">{evaluation.recoveryAdvice}</p>
                  </div>
                </div>
              )}

              {/* Chat messages */}
              <div className="p-4 space-y-3">
                {messages.length === 0 && !evaluation && (
                  <div className="text-center py-6 text-[var(--color-text-secondary)]">
                    <p className="text-3xl mb-2">💬</p>
                    <p className="text-sm">Pregúntame sobre tu entrenamiento, nutrición, progresión...</p>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      'max-w-[85%] rounded-[var(--radius-lg)] p-3 text-sm',
                      msg.role === 'user'
                        ? 'ml-auto bg-[var(--color-accent)] text-black'
                        : 'bg-[var(--color-surface-03)] text-[var(--color-text-primary)]'
                    )}
                  >
                    {msg.content}
                  </div>
                ))}

                {isLoading && (
                  <div className="bg-[var(--color-surface-03)] rounded-[var(--radius-lg)] p-3 max-w-[85%] flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-[var(--color-text-secondary)] animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Chat input */}
            <div className="p-4 border-t border-[var(--color-border)] safe-bottom">
              {/* Quick questions */}
              {messages.length === 0 && (
                <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                  {['¿Cuándo hacer deload?', '¿Más volumen o intensidad?', '¿Estoy progresando bien?'].map(q => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors whitespace-nowrap"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Escribe tu pregunta..."
                  onKeyDown={e => { if (e.key === 'Enter') void sendMessage() }}
                  className="flex-1 bg-[var(--color-surface-03)] rounded-[var(--radius-md)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] border border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none transition-colors"
                />
                <Button
                  variant="primary"
                  size="icon"
                  onClick={() => void sendMessage()}
                  disabled={!input.trim() || isLoading}
                  aria-label="Enviar"
                >
                  ↑
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

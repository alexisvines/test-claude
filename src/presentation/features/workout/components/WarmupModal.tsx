import { motion } from 'motion/react'
import type { MuscleGroup } from '@/domain/value-objects/MuscleGroup'

// ── Protocolos de calentamiento por grupo muscular ────────────────────────────
interface WarmupTip {
  emoji: string
  title: string
  detail: string
}

const GENERAL_WARMUP: WarmupTip[] = [
  { emoji: '🚶', title: '3–5 min de cardio suave', detail: 'Caminata rápida, trote o saltos de tijera para elevar la temperatura corporal.' },
  { emoji: '🔄', title: 'Movilidad articular', detail: 'Círculos de hombro, cadera y tobillos — 10 repeticiones cada articulación.' },
]

const MUSCLE_WARMUPS: Partial<Record<MuscleGroup, WarmupTip[]>> = {
  chest: [
    { emoji: '🤸', title: 'Rotaciones de hombro', detail: '2 × 15 círculos hacia adelante y atrás para lubricar el manguito rotador.' },
    { emoji: '💪', title: 'Flexiones lentas × 10', detail: 'Baja en 3 segundos, sube en 1. Activa el pecho sin fatigar.' },
  ],
  back: [
    { emoji: '🎯', title: 'Retracción de escápulas', detail: 'Aprieta los omóplatos 2 seg, 15 reps. Activa los romboides.' },
    { emoji: '🏊', title: 'Remo sin peso × 15', detail: 'Simula el movimiento de remo con resistencia de banda o sin peso.' },
  ],
  lats: [
    { emoji: '🤸', title: 'Estiramiento de dorsales', detail: 'Cuelga de barra 20–30 seg para elongar los dorsales.' },
    { emoji: '🎯', title: 'Jalón liviano × 15', detail: 'Con la mitad del peso habitual, enfoca en el recorrido completo.' },
  ],
  shoulders: [
    { emoji: '🔄', title: 'Rotaciones de manguito', detail: 'Con banda o mancuerna de 1–2 kg, rotaciones internas/externas × 15 c/u.' },
    { emoji: '💪', title: 'Press Arnold sin peso × 12', detail: 'Solo con las manos para calentar el rango de movimiento completo.' },
  ],
  quadriceps: [
    { emoji: '🦵', title: 'Sentadillas sin peso × 20', detail: 'Lenta, con control. Lleva las rodillas sobre los pies.' },
    { emoji: '🏃', title: 'Zancadas × 10 c/u', detail: 'Activa cuádriceps y glúteos antes de agregar carga.' },
  ],
  hamstrings: [
    { emoji: '🤸', title: 'Buenos días sin barra × 15', detail: 'Hip hinge lento para activar isquiotibiales y glúteos.' },
    { emoji: '🦵', title: 'Peso muerto rumano sin peso × 12', detail: 'Estiramiento activo de cadena posterior.' },
  ],
  glutes: [
    { emoji: '🍑', title: 'Puente de glúteos × 20', detail: 'Tumbado boca arriba, empuja con talones. Activa glúteos al máximo.' },
    { emoji: '🦵', title: 'Abducción de cadera × 15', detail: 'Con banda o sin, de pie. Abre la cadera lateralmente.' },
  ],
  core: [
    { emoji: '🎯', title: 'Plancha 30 segundos', detail: 'Core neutro, no dejes caer las caderas. Respira.' },
    { emoji: '🔄', title: 'Dead bug × 10', detail: 'Boca arriba, brazos/piernas opuestos. Control total del core.' },
  ],
  biceps: [
    { emoji: '💪', title: 'Curl con banda × 20', detail: 'Movimiento lento y controlado para calentar el tendón del bíceps.' },
  ],
  triceps: [
    { emoji: '💪', title: 'Extensión de tríceps sin peso × 15', detail: 'Simula el movimiento por encima de la cabeza para calentar el codo.' },
  ],
  calves: [
    { emoji: '🦶', title: 'Elevaciones de talón × 25', detail: 'Lento y controlado, rango completo. Calienta tendón de Aquiles.' },
  ],
}

function getWarmupProtocol(primaryMuscles: MuscleGroup[]): WarmupTip[] {
  const specific: WarmupTip[] = []
  for (const m of primaryMuscles.slice(0, 2)) {
    const tips = MUSCLE_WARMUPS[m]
    if (tips) specific.push(...tips)
  }
  return [...GENERAL_WARMUP, ...specific.slice(0, 3)]
}

// ── Componente ────────────────────────────────────────────────────────────────
export function WarmupModal({
  primaryMuscles,
  onStart,
  onSkip,
}: {
  primaryMuscles: MuscleGroup[]
  onStart: () => void
  onSkip: () => void
}) {
  const tips = getWarmupProtocol(primaryMuscles)

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-end p-0"
      onClick={onSkip}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="w-full max-h-[85vh] overflow-y-auto bg-[var(--color-surface-01)] rounded-t-3xl border-t border-[var(--color-border)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--color-border)]" />
        </div>

        <div className="px-5 pb-8 space-y-5">
          {/* Header */}
          <div className="text-center pt-2">
            <p className="text-4xl mb-2">🔥</p>
            <h2 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
              Calentamiento previo
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              ~5 minutos antes de levantar — reduce lesiones y mejora el rendimiento
            </p>
          </div>

          {/* Tips */}
          <div className="space-y-3">
            {tips.map((tip, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex gap-3 p-3 rounded-2xl bg-[var(--color-surface-02)] border border-[var(--color-border)]"
              >
                <span className="text-2xl shrink-0">{tip.emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">{tip.title}</p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">{tip.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Nota científica */}
          <p className="text-[10px] text-[var(--color-text-muted)] text-center px-4">
            El calentamiento aumenta la temperatura muscular, mejora la conducción nerviosa y reduce el riesgo de lesión hasta un 50%.
          </p>

          {/* Botones */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onSkip}
              className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-[var(--color-text-secondary)] bg-[var(--color-surface-03)] border border-[var(--color-border)]"
            >
              Saltar
            </button>
            <button
              onClick={onStart}
              className="flex-2 flex-grow-[2] py-3.5 rounded-2xl text-base font-black text-black active:scale-95 transition-transform"
              style={{ backgroundColor: 'var(--color-accent)', boxShadow: 'var(--shadow-accent)' }}
            >
              ¡Listo, a entrenar! →
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

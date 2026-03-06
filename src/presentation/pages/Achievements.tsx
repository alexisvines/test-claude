import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { getContainer } from '@/infrastructure/container/DIContainer'
import type { Achievement } from '@/domain/entities/Achievement'
import { cn } from '@/shared/utils/cn'
import { formatDate } from '@/shared/utils/formatters'

const CATEGORY_LABELS: Record<string, string> = {
  'first-time': 'Primera vez',
  'streak': 'Rachas',
  'volume': 'Volumen',
  'personal-records': 'Récords personales',
  'consistency': 'Consistencia',
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'rounded-[var(--radius-lg)] p-4 border text-center',
        achievement.isUnlocked
          ? 'bg-[var(--color-surface-02)] border-[var(--color-border-active)]'
          : 'bg-[var(--color-surface-01)] border-[var(--color-border)] opacity-50'
      )}
    >
      <div className={cn('text-4xl mb-2', !achievement.isUnlocked && 'grayscale opacity-50')}>
        {achievement.icon}
      </div>
      <h3 className={cn(
        'font-semibold text-sm',
        achievement.isUnlocked ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'
      )}>
        {achievement.name}
      </h3>
      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
        {achievement.description}
      </p>
      {achievement.isUnlocked && achievement.unlockedAt && (
        <p className="text-xs text-[var(--color-accent)] mt-2">
          ✓ {formatDate(achievement.unlockedAt)}
        </p>
      )}
      {!achievement.isUnlocked && (
        <p className="text-xs text-[var(--color-text-muted)] mt-2">Bloqueado 🔒</p>
      )}
    </motion.div>
  )
}

export function AchievementsPage() {
  const container = getContainer()

  const { data: athlete } = useQuery({
    queryKey: ['athlete'],
    queryFn: () => container.athleteRepo.getDefault(),
  })

  const { data: achievements = [] } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      if (!athlete) return []
      return container.athleteRepo.getAchievements(athlete.id)
    },
    enabled: !!athlete,
  })

  const byCategory = achievements.reduce((acc, a) => {
    const cat = a.category
    if (!acc[cat]) acc[cat] = []
    acc[cat]?.push(a)
    return acc
  }, {} as Record<string, Achievement[]>)

  const unlockedCount = achievements.filter(a => a.isUnlocked).length

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto">
      <div className="pt-2">
        <h1 className="font-display text-3xl font-bold text-[var(--color-text-primary)]">Logros</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">
          {unlockedCount}/{achievements.length} desbloqueados
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-[var(--color-surface-03)] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-[var(--color-accent)]"
          initial={{ width: 0 }}
          animate={{ width: achievements.length > 0 ? `${(unlockedCount / achievements.length) * 100}%` : '0%' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Level */}
      {athlete && (
        <div className="bg-gradient-to-r from-[var(--color-accent-dim)] to-transparent rounded-[var(--radius-lg)] p-4 border border-[var(--color-accent)]/20">
          <div className="flex items-center gap-3">
            <div className="text-4xl">
              {athlete.level === 'leyenda' ? '🌟' : athlete.level === 'elite' ? '💎' : athlete.level === 'avanzado' ? '🏆' : '🏋️'}
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">Nivel actual</p>
              <p className="font-display text-2xl font-bold text-[var(--color-accent)]">{athlete.levelLabel}</p>
              {athlete.xpToNextLevel > 0 && (
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {athlete.xpToNextLevel} sesiones para el siguiente nivel
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* By category */}
      {Object.entries(byCategory).map(([category, categoryAchievements]) => (
        <div key={category} className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[var(--color-text-secondary)] uppercase tracking-wide">
            {CATEGORY_LABELS[category] ?? category}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {categoryAchievements.map(a => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </div>
        </div>
      ))}

      {achievements.length === 0 && (
        <div className="text-center py-12">
          <p className="text-5xl mb-3">🏆</p>
          <p className="text-[var(--color-text-secondary)]">Completa tu primer entrenamiento para desbloquear logros</p>
        </div>
      )}

      <div className="h-4" />
    </div>
  )
}

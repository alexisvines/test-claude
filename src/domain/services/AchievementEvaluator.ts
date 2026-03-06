import type { AthleteStats } from '../entities/Athlete'

export interface AchievementCondition {
  id: string
  check: (stats: AthleteStats) => boolean
}

export const ACHIEVEMENT_CONDITIONS: AchievementCondition[] = [
  { id: 'first-session', check: s => s.totalSessions >= 1 },
  { id: 'first-pr', check: s => s.totalPRs >= 1 },
  { id: 'first-week', check: s => s.totalSessions >= 3 },
  { id: 'streak-7', check: s => s.currentStreakDays >= 7 },
  { id: 'streak-14', check: s => s.currentStreakDays >= 14 },
  { id: 'streak-30', check: s => s.currentStreakDays >= 30 },
  { id: 'streak-90', check: s => s.currentStreakDays >= 90 },
  { id: 'streak-180', check: s => s.currentStreakDays >= 180 },
  { id: 'volume-1t', check: s => s.totalVolumeTons >= 1 },
  { id: 'volume-10t', check: s => s.totalVolumeTons >= 10 },
  { id: 'volume-100t', check: s => s.totalVolumeTons >= 100 },
  { id: 'prs-10', check: s => s.totalPRs >= 10 },
  { id: 'prs-50', check: s => s.totalPRs >= 50 },
  { id: 'prs-100', check: s => s.totalPRs >= 100 },
  { id: 'sessions-25', check: s => s.totalSessions >= 25 },
  { id: 'sessions-100', check: s => s.totalSessions >= 100 },
  { id: 'sessions-365', check: s => s.totalSessions >= 365 },
]

export class AchievementEvaluator {
  evaluate(
    stats: AthleteStats,
    unlockedIds: Set<string>
  ): string[] {
    return ACHIEVEMENT_CONDITIONS
      .filter(c => !unlockedIds.has(c.id) && c.check(stats))
      .map(c => c.id)
  }
}

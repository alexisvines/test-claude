import { formatDistance, format, isToday, isYesterday } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatWeight(kg: number, unit: 'kg' | 'lb' = 'kg'): string {
  const value = unit === 'lb' ? kg * 2.20462 : kg
  return `${Math.round(value * 10) / 10}${unit}`
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function formatDate(date: Date): string {
  if (isToday(date)) return 'Hoy'
  if (isYesterday(date)) return 'Ayer'
  return format(date, 'dd MMM yyyy', { locale: es })
}

export function formatRelative(date: Date): string {
  return formatDistance(date, new Date(), { addSuffix: true, locale: es })
}

export function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`
  return `${Math.round(kg)}kg`
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

import Model from 'react-body-highlighter'
import type { IExerciseData, Muscle } from 'react-body-highlighter'
import type { MuscleGroup } from '@/domain/value-objects/MuscleGroup'

interface MuscleDiagramProps {
  primary: MuscleGroup[]
  secondary: MuscleGroup[]
  size?: 'sm' | 'md' | 'lg'
}

// Map our domain muscle groups to react-body-highlighter slugs
const MUSCLE_MAP: Partial<Record<MuscleGroup, Muscle[]>> = {
  chest:       ['chest'],
  back:        ['upper-back', 'lower-back'],
  lats:        ['upper-back'],
  shoulders:   ['front-deltoids', 'back-deltoids'],
  biceps:      ['biceps'],
  triceps:     ['triceps'],
  forearms:    ['forearm'],
  quadriceps:  ['quadriceps'],
  hamstrings:  ['hamstring'],
  glutes:      ['gluteal'],
  calves:      ['calves'],
  core:        ['abs', 'obliques'],
  traps:       ['trapezius'],
}

const SIZE_MAP = { sm: 110, md: 140, lg: 175 }

// Colors indexed by frequency (1-based → array index 0-based)
// frequency 1 → secondary muscle → index 0
// frequency 3 → primary muscle  → index 2
const HIGHLIGHTED_COLORS = ['#22c55e', '#2dde6a', '#39FF14']
const BODY_COLOR = '#1e293b'

export function MuscleDiagram({ primary, secondary, size = 'md' }: MuscleDiagramProps) {
  const px = SIZE_MAP[size]

  // Build unique slug lists; exclude from secondary any that appear in primary
  const primarySlugs = [...new Set(primary.flatMap(m => MUSCLE_MAP[m] ?? []))]
  const secondarySlugs = [
    ...new Set(
      secondary
        .flatMap(m => MUSCLE_MAP[m] ?? [])
        .filter(s => !primarySlugs.includes(s))
    ),
  ]

  const data: IExerciseData[] = [
    ...(primarySlugs.length
      ? [{ name: 'primary', muscles: primarySlugs, frequency: 3 }]
      : []),
    ...(secondarySlugs.length
      ? [{ name: 'secondary', muscles: secondarySlugs, frequency: 1 }]
      : []),
  ]

  const shared = {
    data,
    bodyColor: BODY_COLOR,
    highlightedColors: HIGHLIGHTED_COLORS,
  }

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <Model
        {...shared}
        style={{ width: px, filter: 'drop-shadow(0 0 4px rgba(57,255,20,0.15))' }}
      />
      <Model
        {...shared}
        type="posterior"
        style={{ width: px, filter: 'drop-shadow(0 0 4px rgba(57,255,20,0.15))' }}
      />
    </div>
  )
}

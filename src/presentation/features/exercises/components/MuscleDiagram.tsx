import Model from 'react-body-highlighter'
import type { Muscle } from 'react-body-highlighter'
import type { MuscleGroup } from '@/domain/value-objects/MuscleGroup'

// Mapping from Kova domain muscles → react-body-highlighter muscle names
const MUSCLE_MAP: Record<MuscleGroup, Muscle[]> = {
  chest:      ['chest'],
  back:       ['upper-back', 'lower-back'],
  lats:       ['upper-back'],
  shoulders:  ['front-deltoids', 'back-deltoids'],
  biceps:     ['biceps'],
  triceps:    ['triceps'],
  forearms:   ['forearm'],
  quadriceps: ['quadriceps'],
  hamstrings: ['hamstring'],
  glutes:     ['gluteal'],
  calves:     ['calves'],
  core:       ['abs', 'obliques'],
  traps:      ['trapezius'],
}

// Width per view — total = 2× this (matches previous sm:200 md:244 lg:304 total)
const SIZES = { sm: 100, md: 122, lg: 152 }

export function MuscleDiagram({
  primary,
  secondary,
  size = 'md',
}: {
  primary: MuscleGroup[]
  secondary: MuscleGroup[]
  size?: 'sm' | 'md' | 'lg'
}) {
  const w = SIZES[size]

  const primaryVisual = [...new Set(primary.flatMap(m => MUSCLE_MAP[m] ?? []))]
  const secondaryVisual = [...new Set(
    secondary.flatMap(m => MUSCLE_MAP[m] ?? []).filter(m => !primaryVisual.includes(m))
  )]

  // Frequency trick: pass primary muscles in two entries so they get frequency=2
  // → highlightedColors[1] = #C8FF00 (accent)
  // Secondary muscles only appear once → frequency=1 → highlightedColors[0] = #22c55e
  const allMuscles = [...primaryVisual, ...secondaryVisual]
  const data = allMuscles.length > 0
    ? [
        { name: 'muscles', muscles: allMuscles },
        ...(primaryVisual.length > 0 ? [{ name: 'primary-boost', muscles: primaryVisual }] : []),
      ]
    : []

  return (
    <div className="flex" aria-label="Diagrama muscular">
      <Model
        type="anterior"
        data={data}
        highlightedColors={['#22c55e', '#C8FF00']}
        bodyColor="#1a2535"
        style={{ width: w }}
      />
      <Model
        type="posterior"
        data={data}
        highlightedColors={['#22c55e', '#C8FF00']}
        bodyColor="#1a2535"
        style={{ width: w }}
      />
    </div>
  )
}

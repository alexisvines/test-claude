import Body from 'react-muscle-highlighter'
import type { Slug } from 'react-muscle-highlighter'
import type { MuscleGroup } from '@/domain/value-objects/MuscleGroup'

// Mapa de músculos Kova → slugs de react-muscle-highlighter por vista
// Front slugs: chest, obliques, abs, biceps, triceps, neck, trapezius,
//              deltoids, adductors, quadriceps, calves, forearm
// Back slugs:  neck, trapezius, deltoids, upper-back, triceps, lower-back,
//              forearm, gluteal, adductors, hamstring, calves
const FRONT_MAP: Record<MuscleGroup, Slug[]> = {
  chest:      ['chest'],
  back:       [],
  lats:       [],
  shoulders:  ['deltoids'],
  biceps:     ['biceps'],
  triceps:    ['triceps'],
  forearms:   ['forearm'],
  quadriceps: ['quadriceps'],
  hamstrings: [],
  glutes:     [],
  calves:     ['calves'],
  core:       ['abs', 'obliques'],
  traps:      ['trapezius'],
}

const BACK_MAP: Record<MuscleGroup, Slug[]> = {
  chest:      [],
  back:       ['upper-back', 'lower-back'],
  lats:       ['upper-back'],
  shoulders:  ['deltoids'],
  biceps:     [],
  triceps:    ['triceps'],
  forearms:   ['forearm'],
  quadriceps: [],
  hamstrings: ['hamstring'],
  glutes:     ['gluteal'],
  calves:     ['calves'],
  core:       [],
  traps:      ['trapezius'],
}

const SIZES = { sm: 100, md: 122, lg: 152 }

function buildData(
  muscles: MuscleGroup[],
  map: Record<MuscleGroup, Slug[]>,
  intensity: 1 | 2
) {
  return [...new Set(muscles.flatMap(m => map[m] ?? []))].map(slug => ({
    slug,
    intensity,
  }))
}

// Mapa de músculo → slugs afectados (unión de front+back, sin duplicados)
const ALL_MAP: Record<MuscleGroup, Slug[]> = {
  chest:      ['chest'],
  back:       ['upper-back', 'lower-back'],
  lats:       ['upper-back'],
  shoulders:  ['deltoids'],
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

export function MuscleDiagram({
  primary,
  secondary,
  size = 'md',
  /** Override de colores por grupo muscular — usado por MuscularFatigueMap */
  colorOverride,
}: {
  primary: MuscleGroup[]
  secondary: MuscleGroup[]
  size?: 'sm' | 'md' | 'lg'
  colorOverride?: Partial<Record<MuscleGroup, string>>
}) {
  const w = SIZES[size]

  let frontData: { slug: Slug; intensity?: number; color?: string }[]
  let backData: typeof frontData
  let hasPrimary: boolean
  let glowColor: string

  if (colorOverride) {
    // Modo fatiga: cada músculo recibe su color de recuperación
    frontData = Object.entries(colorOverride).flatMap(([muscle, color]) =>
      (FRONT_MAP[muscle as MuscleGroup] ?? []).map(slug => ({ slug, color: color as string }))
    )
    backData = Object.entries(colorOverride).flatMap(([muscle, color]) =>
      (BACK_MAP[muscle as MuscleGroup] ?? []).map(slug => ({ slug, color: color as string }))
    )
    hasPrimary = Object.keys(colorOverride).length > 0
    glowColor = 'rgba(100,100,100,0.2)'
  } else {
    // Modo normal: primarios con intensidad 2, secundarios con 1
    const primarySlugs = new Set([
      ...primary.flatMap(m => FRONT_MAP[m] ?? []),
      ...primary.flatMap(m => BACK_MAP[m] ?? []),
    ])
    const filteredSecondary = secondary.filter(m =>
      [...(FRONT_MAP[m] ?? []), ...(BACK_MAP[m] ?? [])].every(s => !primarySlugs.has(s))
    )
    frontData = [
      ...buildData(primary, FRONT_MAP, 2),
      ...buildData(filteredSecondary, FRONT_MAP, 1),
    ]
    backData = [
      ...buildData(primary, BACK_MAP, 2),
      ...buildData(filteredSecondary, BACK_MAP, 1),
    ]
    hasPrimary = primary.length > 0
    glowColor = hasPrimary ? 'rgba(200,255,0,0.35)' : 'transparent'
  }

  const wrapperStyle: React.CSSProperties = {
    display: 'flex',
    maxWidth: '100%',
    overflow: 'hidden',
    background: 'radial-gradient(ellipse at center, #1a2535 60%, #0d1117 100%)',
    borderRadius: '12px',
    padding: '8px',
    gap: '4px',
    filter: hasPrimary ? `drop-shadow(0 0 10px ${glowColor})` : undefined,
  }

  return (
    <div style={wrapperStyle} aria-label="Diagrama muscular">
      <Body
        side="front"
        data={frontData}
        colors={['#22c55e', '#C8FF00']}
        defaultFill="#2a3a50"
        gender="male"
        scale={w / 120}
      />
      <Body
        side="back"
        data={backData}
        colors={['#22c55e', '#C8FF00']}
        defaultFill="#2a3a50"
        gender="male"
        scale={w / 120}
      />
    </div>
  )
}

// Exportar ALL_MAP para uso del MuscularFatigueMap
export { ALL_MAP }

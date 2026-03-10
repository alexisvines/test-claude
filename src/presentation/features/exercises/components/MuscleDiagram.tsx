import type { MuscleGroup } from '@/domain/value-objects/MuscleGroup'

interface MuscleDiagramProps {
  primary: MuscleGroup[]
  secondary: MuscleGroup[]
  size?: 'sm' | 'md' | 'lg'
}

// ── Visual muscle region IDs ───────────────────────────────────────────────────
type MuscleId =
  | 'shoulders-front' | 'chest' | 'biceps' | 'forearms'
  | 'abs' | 'obliques' | 'quads' | 'calves-front'
  | 'traps' | 'shoulders-back' | 'upper-back' | 'lats'
  | 'triceps' | 'lower-back' | 'glutes' | 'hamstrings' | 'calves-back'

const DOMAIN_TO_VISUAL: Record<MuscleGroup, MuscleId[]> = {
  chest:      ['chest'],
  back:       ['upper-back', 'lats', 'lower-back'],
  lats:       ['lats'],
  shoulders:  ['shoulders-front', 'shoulders-back'],
  biceps:     ['biceps'],
  triceps:    ['triceps'],
  forearms:   ['forearms'],
  quadriceps: ['quads'],
  hamstrings: ['hamstrings'],
  glutes:     ['glutes'],
  calves:     ['calves-front', 'calves-back'],
  core:       ['abs', 'obliques'],
  traps:      ['traps'],
}

// ── SVG path data ──────────────────────────────────────────────────────────────
// ViewBox 0 0 280 460 | Front: center x=70 | Back: center x=210 (offset +140)

type PathEntry = { id: MuscleId; d: string }

/** Shift all x coordinates in an SVG path string by offset */
function shiftX(d: string, offset: number): string {
  return d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) =>
    `${parseFloat(x) + offset},${y}`
  )
}

// ── Body silhouette (dark background — drawn behind muscles) ──────────────────
const FRONT_SILHOUETTE: string[] = [
  // torso
  'M 64,57 C 50,61 40,68 36,80 C 30,90 30,110 32,130 C 30,150 30,166 34,180 C 36,190 42,200 46,212 L 48,228 L 92,228 L 94,212 C 98,200 104,190 106,180 C 110,166 110,150 108,130 C 110,110 110,90 104,80 C 100,68 90,61 76,57 Z',
  // left upper arm
  'M 36,80 C 26,80 18,88 17,105 C 16,122 18,140 22,152 C 25,160 31,163 36,159 C 42,155 44,137 42,120 C 40,104 40,88 36,80 Z',
  // left forearm
  'M 18,155 C 13,164 11,181 13,196 C 15,206 21,210 26,207 C 32,204 34,187 32,172 C 30,159 22,153 18,155 Z',
  // right upper arm
  'M 104,80 C 114,80 122,88 123,105 C 124,122 122,140 118,152 C 115,160 109,163 104,159 C 98,155 96,137 98,120 C 100,104 100,88 104,80 Z',
  // right forearm
  'M 122,155 C 127,164 129,181 127,196 C 125,206 119,210 114,207 C 108,204 106,187 108,172 C 110,159 118,153 122,155 Z',
  // left thigh
  'M 48,228 C 38,232 33,248 33,268 C 33,288 38,306 48,314 C 55,316 62,308 66,290 C 68,272 66,250 56,234 C 52,228 50,226 48,228 Z',
  // left shin
  'M 42,318 C 36,328 34,344 36,360 C 38,372 44,378 50,376 C 56,374 60,364 60,350 C 60,336 56,322 50,320 C 46,318 43,318 42,318 Z',
  // right thigh
  'M 92,228 C 102,232 107,248 107,268 C 107,288 102,306 92,314 C 85,316 78,308 74,290 C 72,272 74,250 84,234 C 88,228 90,226 92,228 Z',
  // right shin
  'M 98,318 C 104,328 106,344 104,360 C 102,372 96,378 90,376 C 84,374 80,364 80,350 C 80,336 84,322 90,320 C 94,318 97,318 98,318 Z',
]

const BACK_SILHOUETTE: string[] = FRONT_SILHOUETTE.map(d => shiftX(d, 140))

// ── Muscle overlays – front view ──────────────────────────────────────────────
const FRONT_MUSCLES: PathEntry[] = [
  // anterior deltoids
  { id: 'shoulders-front', d: 'M 36,79 C 26,75 18,84 19,99 C 20,110 27,116 34,111 C 42,107 46,96 43,86 C 41,80 38,78 36,79 Z' },
  { id: 'shoulders-front', d: 'M 104,79 C 114,75 122,84 121,99 C 120,110 113,116 106,111 C 98,107 94,96 97,86 C 99,80 102,78 104,79 Z' },
  // pectoralis major (two lobes)
  { id: 'chest', d: 'M 40,82 C 30,88 26,102 30,118 C 34,130 46,136 60,128 C 66,118 64,100 56,90 C 51,83 44,80 40,82 Z' },
  { id: 'chest', d: 'M 100,82 C 110,88 114,102 110,118 C 106,130 94,136 80,128 C 74,118 76,100 84,90 C 89,83 96,80 100,82 Z' },
  // biceps
  { id: 'biceps', d: 'M 19,99 C 13,108 12,126 15,140 C 18,150 24,154 30,150 C 36,146 37,128 34,116 C 31,105 23,97 19,99 Z' },
  { id: 'biceps', d: 'M 121,99 C 127,108 128,126 125,140 C 122,150 116,154 110,150 C 104,146 103,128 106,116 C 109,105 117,97 121,99 Z' },
  // forearms (brachioradialis)
  { id: 'forearms', d: 'M 14,154 C 9,164 8,180 10,194 C 12,204 18,208 23,204 C 29,200 31,184 28,170 C 26,158 17,152 14,154 Z' },
  { id: 'forearms', d: 'M 126,154 C 131,164 132,180 130,194 C 128,204 122,208 117,204 C 111,200 109,184 112,170 C 114,158 123,152 126,154 Z' },
  // abs – 6 sections (2 col × 3 row)
  { id: 'abs', d: 'M 59,120 C 57,120 55,122 55,126 C 55,130 57,132 60,132 C 64,132 65,130 65,126 C 65,122 63,120 59,120 Z' },
  { id: 'abs', d: 'M 59,136 C 57,136 55,138 55,142 C 55,146 57,148 60,148 C 64,148 65,146 65,142 C 65,138 63,136 59,136 Z' },
  { id: 'abs', d: 'M 59,151 C 57,151 55,153 55,157 C 55,161 57,163 60,163 C 64,163 65,161 65,157 C 65,153 63,151 59,151 Z' },
  { id: 'abs', d: 'M 81,120 C 79,120 75,122 75,126 C 75,130 77,132 80,132 C 84,132 85,130 85,126 C 85,122 83,120 81,120 Z' },
  { id: 'abs', d: 'M 81,136 C 79,136 75,138 75,142 C 75,146 77,148 80,148 C 84,148 85,146 85,142 C 85,138 83,136 81,136 Z' },
  { id: 'abs', d: 'M 81,151 C 79,151 75,153 75,157 C 75,161 77,163 80,163 C 84,163 85,161 85,157 C 85,153 83,151 81,151 Z' },
  // obliques
  { id: 'obliques', d: 'M 38,120 C 32,130 30,144 32,158 C 35,168 43,168 47,160 C 50,152 50,132 46,123 C 43,117 40,117 38,120 Z' },
  { id: 'obliques', d: 'M 102,120 C 108,130 110,144 108,158 C 105,168 97,168 93,160 C 90,152 90,132 94,123 C 97,117 100,117 102,120 Z' },
  // quadriceps
  { id: 'quads', d: 'M 48,232 C 38,242 34,260 35,280 C 36,298 43,312 53,314 C 62,314 69,302 70,282 C 71,262 67,242 57,234 C 53,230 50,230 48,232 Z' },
  { id: 'quads', d: 'M 92,232 C 102,242 106,260 105,280 C 104,298 97,312 87,314 C 78,314 71,302 70,282 C 69,262 73,242 83,234 C 87,230 90,230 92,232 Z' },
  // calves-front (tibialis anterior)
  { id: 'calves-front', d: 'M 40,322 C 36,330 34,346 36,362 C 38,372 44,376 48,372 C 53,368 54,350 51,336 C 49,324 43,320 40,322 Z' },
  { id: 'calves-front', d: 'M 100,322 C 104,330 106,346 104,362 C 102,372 96,376 92,372 C 87,368 86,350 89,336 C 91,324 97,320 100,322 Z' },
]

// ── Muscle overlays – back view (+140 on all x) ───────────────────────────────
const BACK_MUSCLES: PathEntry[] = [
  // trapezius (diamond shape)
  { id: 'traps', d: shiftX('M 70,56 C 54,60 42,68 40,84 C 43,96 57,103 70,100 C 83,103 97,96 100,84 C 98,68 86,60 70,56 Z', 140) },
  // rear deltoids
  { id: 'shoulders-back', d: shiftX('M 36,79 C 26,75 18,84 19,99 C 20,110 27,116 34,111 C 42,107 46,96 43,86 C 41,80 38,78 36,79 Z', 140) },
  { id: 'shoulders-back', d: shiftX('M 104,79 C 114,75 122,84 121,99 C 120,110 113,116 106,111 C 98,107 94,96 97,86 C 99,80 102,78 104,79 Z', 140) },
  // upper back (rhomboids + mid-traps)
  { id: 'upper-back', d: shiftX('M 54,86 C 45,94 42,110 46,124 C 50,136 60,142 70,140 C 80,142 90,136 94,124 C 98,110 95,94 86,86 C 80,82 60,82 54,86 Z', 140) },
  // lats (wing shapes)
  { id: 'lats', d: shiftX('M 41,88 C 32,98 29,118 30,138 C 31,154 36,168 44,174 C 52,178 60,174 62,162 C 65,146 63,120 57,104 C 53,91 45,84 41,88 Z', 140) },
  { id: 'lats', d: shiftX('M 99,88 C 108,98 111,118 110,138 C 109,154 104,168 96,174 C 88,178 80,174 78,162 C 75,146 77,120 83,104 C 87,91 95,84 99,88 Z', 140) },
  // triceps (horseshoe)
  { id: 'triceps', d: shiftX('M 19,99 C 12,108 11,126 14,140 C 17,152 23,156 28,152 C 34,148 35,130 32,116 C 29,105 23,97 19,99 Z', 140) },
  { id: 'triceps', d: shiftX('M 121,99 C 128,108 129,126 126,140 C 123,152 117,156 112,152 C 106,148 105,130 108,116 C 111,105 117,97 121,99 Z', 140) },
  // forearms (extensors)
  { id: 'forearms', d: shiftX('M 12,156 C 7,166 6,182 8,196 C 10,206 16,210 22,207 C 28,203 30,187 27,173 C 25,161 16,153 12,156 Z', 140) },
  { id: 'forearms', d: shiftX('M 128,156 C 133,166 134,182 132,196 C 130,206 124,210 118,207 C 112,203 110,187 113,173 C 115,161 124,153 128,156 Z', 140) },
  // erector spinae (two narrow strips along spine)
  { id: 'lower-back', d: shiftX('M 65,132 C 63,142 61,160 62,178 C 62,192 64,202 66,206 C 68,206 69,202 69,188 C 70,172 70,154 69,136 C 68,132 66,130 65,132 Z', 140) },
  { id: 'lower-back', d: shiftX('M 75,132 C 77,130 72,132 71,136 C 70,154 70,172 71,188 C 71,202 72,206 74,206 C 76,202 78,192 78,178 C 79,160 77,142 75,132 Z', 140) },
  // glutes
  { id: 'glutes', d: shiftX('M 46,208 C 37,214 33,228 34,244 C 35,258 43,268 53,266 C 62,264 68,252 67,237 C 66,222 58,208 48,208 Z', 140) },
  { id: 'glutes', d: shiftX('M 94,208 C 103,214 107,228 106,244 C 105,258 97,268 87,266 C 78,264 72,252 73,237 C 74,222 82,208 92,208 Z', 140) },
  // hamstrings
  { id: 'hamstrings', d: shiftX('M 46,268 C 36,278 32,296 33,316 C 34,332 42,344 52,344 C 62,342 68,330 68,312 C 68,294 64,274 54,266 C 50,262 47,264 46,268 Z', 140) },
  { id: 'hamstrings', d: shiftX('M 94,268 C 104,278 108,296 107,316 C 106,332 98,344 88,344 C 78,342 72,330 72,312 C 72,294 76,274 86,266 C 90,262 93,264 94,268 Z', 140) },
  // gastrocnemius (two heads per leg)
  { id: 'calves-back', d: shiftX('M 38,348 C 30,360 28,378 32,392 C 35,402 41,406 46,402 C 51,398 53,382 50,367 C 48,355 42,345 38,348 Z', 140) },
  { id: 'calves-back', d: shiftX('M 52,346 C 48,358 48,374 51,388 C 53,398 57,402 61,400 C 66,397 67,382 65,368 C 63,356 57,346 52,346 Z', 140) },
  { id: 'calves-back', d: shiftX('M 102,348 C 110,360 112,378 108,392 C 105,402 99,406 94,402 C 89,398 87,382 90,367 C 92,355 98,345 102,348 Z', 140) },
  { id: 'calves-back', d: shiftX('M 88,346 C 92,358 92,374 89,388 C 87,398 83,402 79,400 C 74,397 73,382 75,368 C 77,356 83,346 88,346 Z', 140) },
]

// ── Anatomical detail lines (muscle separations) ──────────────────────────────
const DETAIL_LINES_FRONT = [
  'M 70,116 L 70,166',          // linea alba (abs center)
  'M 70,80 L 70,128',           // pec sternal split
  'M 62,64 C 55,62 46,64 40,70', // left clavicle
  'M 78,64 C 85,62 94,64 100,70', // right clavicle
]

const DETAIL_LINES_BACK = [
  shiftX('M 70,60 L 70,208', 140),  // spine
  shiftX('M 62,64 C 55,62 46,64 40,70', 140),
  shiftX('M 78,64 C 85,62 94,64 100,70', 140),
]

// ── Diagram sizes ─────────────────────────────────────────────────────────────
const DIAGRAM_WIDTHS = { sm: 200, md: 244, lg: 304 }

// ── Component ─────────────────────────────────────────────────────────────────
export function MuscleDiagram({ primary, secondary, size = 'md' }: MuscleDiagramProps) {
  const width = DIAGRAM_WIDTHS[size]
  const height = Math.round(width * (460 / 280))

  const primaryIds = new Set(primary.flatMap(m => DOMAIN_TO_VISUAL[m] ?? []))
  const secondaryIds = new Set(
    secondary.flatMap(m => DOMAIN_TO_VISUAL[m] ?? []).filter(id => !primaryIds.has(id))
  )

  function fillGradient(id: MuscleId): string {
    if (primaryIds.has(id)) return 'url(#g-primary)'
    if (secondaryIds.has(id)) return 'url(#g-secondary)'
    return 'url(#g-inactive)'
  }

  function strokeCol(id: MuscleId): string {
    if (primaryIds.has(id)) return 'rgba(57,255,20,0.55)'
    if (secondaryIds.has(id)) return 'rgba(34,197,94,0.45)'
    return '#1a2a3a'
  }

  function glowFilter(id: MuscleId): string | undefined {
    return primaryIds.has(id) ? 'url(#f-glow)' : undefined
  }

  return (
    <svg
      viewBox="0 0 280 460"
      width={width}
      height={height}
      style={{ display: 'block', overflow: 'visible' }}
      aria-label="Diagrama muscular"
    >
      <defs>
        {/* Primary: neon green with 3D specular highlight */}
        <radialGradient id="g-primary" cx="38%" cy="28%" r="68%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#d4ffb0" />
          <stop offset="38%"  stopColor="#39FF14" />
          <stop offset="100%" stopColor="#0b3500" />
        </radialGradient>

        {/* Secondary: medium green */}
        <radialGradient id="g-secondary" cx="38%" cy="28%" r="68%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#bbf7d0" />
          <stop offset="40%"  stopColor="#22c55e" />
          <stop offset="100%" stopColor="#052e16" />
        </radialGradient>

        {/* Inactive: dark slate with subtle depth */}
        <radialGradient id="g-inactive" cx="38%" cy="28%" r="68%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#2d4055" />
          <stop offset="100%" stopColor="#0d1c2a" />
        </radialGradient>

        {/* Body base */}
        <radialGradient id="g-body" cx="50%" cy="40%" r="60%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#182435" />
          <stop offset="100%" stopColor="#090f18" />
        </radialGradient>

        {/* Glow for active muscles */}
        <filter id="f-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ─── FRONT VIEW ───────────────────────────────────────────────────── */}
      <circle cx="70" cy="26" r="21" fill="url(#g-body)" stroke="#1e3248" strokeWidth="0.7" />
      <path d="M 64,46 L 76,46 L 77,58 L 63,58 Z" fill="url(#g-body)" stroke="#1a2f42" strokeWidth="0.5" />

      {FRONT_SILHOUETTE.map((d, i) => (
        <path key={`fs${i}`} d={d} fill="url(#g-body)" stroke="#162234" strokeWidth="0.6" />
      ))}

      {FRONT_MUSCLES.map((p, i) => (
        <path
          key={`fm${i}`}
          d={p.d}
          fill={fillGradient(p.id)}
          stroke={strokeCol(p.id)}
          strokeWidth="0.5"
          filter={glowFilter(p.id)}
        />
      ))}

      {DETAIL_LINES_FRONT.map((d, i) => (
        <path key={`fd${i}`} d={d} fill="none" stroke="#0d1c2c" strokeWidth="0.6" strokeLinecap="round" />
      ))}

      <text x="70" y="452" textAnchor="middle" fontSize="7.5" fill="#334e68" letterSpacing="1.2" fontFamily="sans-serif">ANT</text>

      {/* ─── BACK VIEW ────────────────────────────────────────────────────── */}
      <circle cx="210" cy="26" r="21" fill="url(#g-body)" stroke="#1e3248" strokeWidth="0.7" />
      <path d="M 204,46 L 216,46 L 217,58 L 203,58 Z" fill="url(#g-body)" stroke="#1a2f42" strokeWidth="0.5" />

      {BACK_SILHOUETTE.map((d, i) => (
        <path key={`bs${i}`} d={d} fill="url(#g-body)" stroke="#162234" strokeWidth="0.6" />
      ))}

      {BACK_MUSCLES.map((p, i) => (
        <path
          key={`bm${i}`}
          d={p.d}
          fill={fillGradient(p.id)}
          stroke={strokeCol(p.id)}
          strokeWidth="0.5"
          filter={glowFilter(p.id)}
        />
      ))}

      {DETAIL_LINES_BACK.map((d, i) => (
        <path key={`bd${i}`} d={d} fill="none" stroke="#0d1c2c" strokeWidth="0.6" strokeLinecap="round" />
      ))}

      <text x="210" y="452" textAnchor="middle" fontSize="7.5" fill="#334e68" letterSpacing="1.2" fontFamily="sans-serif">POST</text>

      {/* Divider */}
      <line x1="140" y1="20" x2="140" y2="440" stroke="#111e2c" strokeWidth="0.8" />
    </svg>
  )
}

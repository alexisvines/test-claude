import type { MuscleGroup } from '@/domain/value-objects/MuscleGroup'

interface MuscleDiagramProps {
  primary: MuscleGroup[]
  secondary: MuscleGroup[]
  size?: 'sm' | 'md' | 'lg'
}

const PRIMARY_COLOR = '#39FF14'
const SECONDARY_COLOR = '#22c55e'
const INACTIVE_COLOR = '#1e293b'
const BODY_BASE = '#0f172a'
const BODY_STROKE = '#334155'

const SIZE_MAP = { sm: 180, md: 240, lg: 300 }

function f(muscle: MuscleGroup, primary: MuscleGroup[], secondary: MuscleGroup[]) {
  if (primary.includes(muscle)) return PRIMARY_COLOR
  if (secondary.includes(muscle)) return SECONDARY_COLOR
  return INACTIVE_COLOR
}
function fo(muscle: MuscleGroup, primary: MuscleGroup[], secondary: MuscleGroup[]) {
  if (primary.includes(muscle)) return 0.9
  if (secondary.includes(muscle)) return 0.65
  return 0.3
}

export function MuscleDiagram({ primary, secondary, size = 'md' }: MuscleDiagramProps) {
  const w = SIZE_MAP[size]
  const h = Math.round(w * (340 / 290))
  const pf = (m: MuscleGroup) => f(m, primary, secondary)
  const pfo = (m: MuscleGroup) => fo(m, primary, secondary)

  return (
    <svg viewBox="0 0 290 340" width={w} height={h} style={{ display: 'block' }}>
      {/* ── FRONT VIEW (center x=65) ── */}
      {/* Body base */}
      <circle cx="65" cy="25" r="18" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1.2" />
      <rect x="60" y="41" width="10" height="14" rx="4" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1" />
      {/* Torso */}
      <ellipse cx="65" cy="100" rx="34" ry="50" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1.2" />
      {/* Upper arms */}
      <ellipse cx="20" cy="90" rx="10" ry="30" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1" />
      <ellipse cx="110" cy="90" rx="10" ry="30" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1" />
      {/* Forearms */}
      <ellipse cx="14" cy="135" rx="9" ry="28" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1" />
      <ellipse cx="116" cy="135" rx="9" ry="28" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1" />
      {/* Hips */}
      <ellipse cx="65" cy="152" rx="28" ry="12" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1" />
      {/* Thighs */}
      <ellipse cx="47" cy="200" rx="18" ry="34" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1.2" />
      <ellipse cx="83" cy="200" rx="18" ry="34" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1.2" />
      {/* Shins */}
      <ellipse cx="46" cy="275" rx="13" ry="32" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1" />
      <ellipse cx="84" cy="275" rx="13" ry="32" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1" />
      {/* Feet */}
      <ellipse cx="46" cy="316" rx="16" ry="7" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1" />
      <ellipse cx="84" cy="316" rx="16" ry="7" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1" />

      {/* ── Front muscle overlays ── */}
      {/* Shoulders */}
      <ellipse cx="33" cy="72" rx="13" ry="14" fill={pf('shoulders')} fillOpacity={pfo('shoulders')} />
      <ellipse cx="97" cy="72" rx="13" ry="14" fill={pf('shoulders')} fillOpacity={pfo('shoulders')} />
      {/* Chest */}
      <ellipse cx="65" cy="93" rx="26" ry="18" fill={pf('chest')} fillOpacity={pfo('chest')} />
      {/* Biceps */}
      <ellipse cx="20" cy="88" rx="9" ry="24" fill={pf('biceps')} fillOpacity={pfo('biceps')} />
      <ellipse cx="110" cy="88" rx="9" ry="24" fill={pf('biceps')} fillOpacity={pfo('biceps')} />
      {/* Forearms */}
      <ellipse cx="14" cy="135" rx="8" ry="24" fill={pf('forearms')} fillOpacity={pfo('forearms')} />
      <ellipse cx="116" cy="135" rx="8" ry="24" fill={pf('forearms')} fillOpacity={pfo('forearms')} />
      {/* Core/Abs */}
      <ellipse cx="65" cy="128" rx="20" ry="20" fill={pf('core')} fillOpacity={pfo('core')} />
      {/* Quadriceps */}
      <ellipse cx="47" cy="200" rx="15" ry="29" fill={pf('quadriceps')} fillOpacity={pfo('quadriceps')} />
      <ellipse cx="83" cy="200" rx="15" ry="29" fill={pf('quadriceps')} fillOpacity={pfo('quadriceps')} />
      {/* Calves */}
      <ellipse cx="46" cy="275" rx="11" ry="25" fill={pf('calves')} fillOpacity={pfo('calves')} />
      <ellipse cx="84" cy="275" rx="11" ry="25" fill={pf('calves')} fillOpacity={pfo('calves')} />

      {/* Label */}
      <text x="65" y="335" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="system-ui, sans-serif" letterSpacing="1">FRONTAL</text>

      {/* Divider */}
      <line x1="145" y1="15" x2="145" y2="330" stroke={BODY_STROKE} strokeWidth="0.5" strokeDasharray="3 3" />

      {/* ── BACK VIEW (center x=225) ── */}
      {/* Body base */}
      <circle cx="225" cy="25" r="18" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1.2" />
      <rect x="220" y="41" width="10" height="14" rx="4" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1" />
      {/* Torso */}
      <ellipse cx="225" cy="100" rx="34" ry="50" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1.2" />
      {/* Upper arms */}
      <ellipse cx="180" cy="90" rx="10" ry="30" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1" />
      <ellipse cx="270" cy="90" rx="10" ry="30" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1" />
      {/* Forearms */}
      <ellipse cx="174" cy="135" rx="9" ry="28" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1" />
      <ellipse cx="276" cy="135" rx="9" ry="28" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1" />
      {/* Glutes area */}
      <ellipse cx="225" cy="158" rx="28" ry="18" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1.2" />
      {/* Thighs */}
      <ellipse cx="207" cy="205" rx="18" ry="34" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1.2" />
      <ellipse cx="243" cy="205" rx="18" ry="34" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1.2" />
      {/* Shins */}
      <ellipse cx="206" cy="275" rx="13" ry="32" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1" />
      <ellipse cx="244" cy="275" rx="13" ry="32" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1" />
      {/* Feet */}
      <ellipse cx="206" cy="316" rx="16" ry="7" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1" />
      <ellipse cx="244" cy="316" rx="16" ry="7" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1" />

      {/* ── Back muscle overlays ── */}
      {/* Traps */}
      <ellipse cx="225" cy="63" rx="28" ry="14" fill={pf('traps')} fillOpacity={pfo('traps')} />
      {/* Shoulders */}
      <ellipse cx="193" cy="72" rx="13" ry="14" fill={pf('shoulders')} fillOpacity={pfo('shoulders')} />
      <ellipse cx="257" cy="72" rx="13" ry="14" fill={pf('shoulders')} fillOpacity={pfo('shoulders')} />
      {/* Upper back */}
      <ellipse cx="225" cy="98" rx="25" ry="22" fill={pf('back')} fillOpacity={pfo('back')} />
      {/* Lats */}
      <ellipse cx="200" cy="118" rx="12" ry="18" fill={pf('lats')} fillOpacity={pfo('lats')} />
      <ellipse cx="250" cy="118" rx="12" ry="18" fill={pf('lats')} fillOpacity={pfo('lats')} />
      {/* Triceps */}
      <ellipse cx="180" cy="88" rx="9" ry="24" fill={pf('triceps')} fillOpacity={pfo('triceps')} />
      <ellipse cx="270" cy="88" rx="9" ry="24" fill={pf('triceps')} fillOpacity={pfo('triceps')} />
      {/* Forearms back */}
      <ellipse cx="174" cy="135" rx="8" ry="24" fill={pf('forearms')} fillOpacity={pfo('forearms')} />
      <ellipse cx="276" cy="135" rx="8" ry="24" fill={pf('forearms')} fillOpacity={pfo('forearms')} />
      {/* Glutes */}
      <ellipse cx="210" cy="160" rx="17" ry="18" fill={pf('glutes')} fillOpacity={pfo('glutes')} />
      <ellipse cx="240" cy="160" rx="17" ry="18" fill={pf('glutes')} fillOpacity={pfo('glutes')} />
      {/* Hamstrings */}
      <ellipse cx="207" cy="205" rx="15" ry="29" fill={pf('hamstrings')} fillOpacity={pfo('hamstrings')} />
      <ellipse cx="243" cy="205" rx="15" ry="29" fill={pf('hamstrings')} fillOpacity={pfo('hamstrings')} />
      {/* Calves back */}
      <ellipse cx="206" cy="275" rx="11" ry="25" fill={pf('calves')} fillOpacity={pfo('calves')} />
      <ellipse cx="244" cy="275" rx="11" ry="25" fill={pf('calves')} fillOpacity={pfo('calves')} />

      {/* Label */}
      <text x="225" y="335" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="system-ui, sans-serif" letterSpacing="1">DORSAL</text>
    </svg>
  )
}

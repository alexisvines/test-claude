/**
 * Placeholder animado para ejercicios sin imagen disponible.
 * Muestra un SVG con animación SMIL que ilustra el patrón de movimiento
 * del ejercicio según su tipo de equipo — sin dependencias externas.
 */

type EquipmentType =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'kettlebell'
  | 'pull-up-bar'
  | 'ez-bar'

const MUSCLE_COLORS: Record<string, string> = {
  chest: '#ef4444', back: '#3b82f6', lats: '#2563eb',
  shoulders: '#8b5cf6', biceps: '#f59e0b', triceps: '#f59e0b',
  forearms: '#f97316', quadriceps: '#10b981', hamstrings: '#059669',
  glutes: '#ec4899', calves: '#14b8a6', core: '#6366f1', traps: '#7c3aed',
}

// ── Animaciones SVG por equipo ────────────────────────────────────────────────

function BarbellAnimation({ color, size }: { color: string; size: 'thumb' | 'full' }) {
  const s = size === 'thumb' ? 56 : 200
  return (
    <svg viewBox="0 0 200 200" width={s} height={s} xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(100,120)">
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 0 0; -18 0 0; 0 0 0"
          dur="1.8s"
          repeatCount="indefinite"
          additive="sum"
        />
        {/* Barra */}
        <rect x="-70" y="-4" width="140" height="8" rx="4" fill={color} opacity="0.9" />
        {/* Disco izquierdo */}
        <rect x="-85" y="-18" width="14" height="36" rx="3" fill={color} />
        <rect x="-95" y="-14" width="10" height="28" rx="2" fill={color} opacity="0.7" />
        {/* Disco derecho */}
        <rect x="71" y="-18" width="14" height="36" rx="3" fill={color} />
        <rect x="85" y="-14" width="10" height="28" rx="2" fill={color} opacity="0.7" />
      </g>
    </svg>
  )
}

function DumbbellAnimation({ color, size }: { color: string; size: 'thumb' | 'full' }) {
  const s = size === 'thumb' ? 56 : 200
  return (
    <svg viewBox="0 0 200 200" width={s} height={s} xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(100,100)">
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="20 0 0; -35 0 0; 20 0 0"
          dur="1.6s"
          repeatCount="indefinite"
          additive="sum"
        />
        {/* Mango */}
        <rect x="-30" y="-5" width="60" height="10" rx="5" fill={color} opacity="0.9" />
        {/* Disco izquierdo */}
        <ellipse cx="-38" cy="0" rx="14" ry="18" fill={color} />
        <ellipse cx="-38" cy="0" rx="9" ry="12" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2" />
        {/* Disco derecho */}
        <ellipse cx="38" cy="0" rx="14" ry="18" fill={color} />
        <ellipse cx="38" cy="0" rx="9" ry="12" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2" />
      </g>
    </svg>
  )
}

function CableAnimation({ color, size }: { color: string; size: 'thumb' | 'full' }) {
  const s = size === 'thumb' ? 56 : 200
  return (
    <svg viewBox="0 0 200 200" width={s} height={s} xmlns="http://www.w3.org/2000/svg">
      {/* Polea fija */}
      <circle cx="160" cy="30" r="12" fill={color} opacity="0.6" />
      <circle cx="160" cy="30" r="6" fill={color} />
      {/* Cable animado */}
      <path
        stroke={color}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.85"
        d="M 50,160 Q 110,80 160,42"
      >
        <animate
          attributeName="d"
          values="M 50,160 Q 110,80 160,42; M 70,120 Q 120,70 160,42; M 50,160 Q 110,80 160,42"
          dur="1.6s"
          repeatCount="indefinite"
        />
      </path>
      {/* Handle */}
      <rect x="38" y="152" width="24" height="8" rx="4" fill={color}>
        <animate
          attributeName="y"
          values="152; 112; 152"
          dur="1.6s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="x"
          values="38; 58; 38"
          dur="1.6s"
          repeatCount="indefinite"
        />
      </rect>
    </svg>
  )
}

function BodyweightAnimation({ color, size }: { color: string; size: 'thumb' | 'full' }) {
  const s = size === 'thumb' ? 56 : 200
  return (
    <svg viewBox="0 0 200 200" width={s} height={s} xmlns="http://www.w3.org/2000/svg">
      {/* Figura humana esquemática haciendo flexión */}
      <g>
        {/* Cabeza */}
        <circle cx="100" cy="60" r="14" fill={color} opacity="0.85">
          <animate attributeName="cy" values="60; 75; 60" dur="1.8s" repeatCount="indefinite" />
        </circle>
        {/* Torso */}
        <line x1="100" y1="74" x2="100" y2="120" stroke={color} strokeWidth="6" strokeLinecap="round">
          <animate attributeName="y1" values="74; 89; 74" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="y2" values="120; 130; 120" dur="1.8s" repeatCount="indefinite" />
        </line>
        {/* Brazos */}
        <line x1="100" y1="90" x2="60" y2="130" stroke={color} strokeWidth="5" strokeLinecap="round">
          <animate attributeName="y1" values="90; 100; 90" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="x2" values="60; 55; 60" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="y2" values="130; 140; 130" dur="1.8s" repeatCount="indefinite" />
        </line>
        <line x1="100" y1="90" x2="140" y2="130" stroke={color} strokeWidth="5" strokeLinecap="round">
          <animate attributeName="y1" values="90; 100; 90" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="x2" values="140; 145; 140" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="y2" values="130; 140; 130" dur="1.8s" repeatCount="indefinite" />
        </line>
        {/* Piernas */}
        <line x1="100" y1="120" x2="75" y2="165" stroke={color} strokeWidth="5" strokeLinecap="round">
          <animate attributeName="y1" values="120; 130; 120" dur="1.8s" repeatCount="indefinite" />
        </line>
        <line x1="100" y1="120" x2="125" y2="165" stroke={color} strokeWidth="5" strokeLinecap="round">
          <animate attributeName="y1" values="120; 130; 120" dur="1.8s" repeatCount="indefinite" />
        </line>
      </g>
    </svg>
  )
}

function KettlebellAnimation({ color, size }: { color: string; size: 'thumb' | 'full' }) {
  const s = size === 'thumb' ? 56 : 200
  return (
    <svg viewBox="0 0 200 200" width={s} height={s} xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(100,160)">
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 0 -60; -50 0 -60; 0 0 -60"
          dur="1.6s"
          repeatCount="indefinite"
          additive="sum"
        />
        {/* Asa */}
        <path d="M -20,-60 Q -28,-80 0,-85 Q 28,-80 20,-60" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
        {/* Cuerpo */}
        <ellipse cx="0" cy="-30" rx="28" ry="30" fill={color} opacity="0.9" />
        <ellipse cx="0" cy="-30" rx="18" ry="20" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="2" />
      </g>
    </svg>
  )
}

function PullUpBarAnimation({ color, size }: { color: string; size: 'thumb' | 'full' }) {
  const s = size === 'thumb' ? 56 : 200
  return (
    <svg viewBox="0 0 200 200" width={s} height={s} xmlns="http://www.w3.org/2000/svg">
      {/* Barra fija */}
      <rect x="20" y="30" width="160" height="10" rx="5" fill={color} opacity="0.8" />
      {/* Figura subiendo/bajando */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0; 0,-30; 0,0"
          dur="1.8s"
          repeatCount="indefinite"
        />
        {/* Manos agarrando barra */}
        <circle cx="70" cy="40" r="7" fill={color} />
        <circle cx="130" cy="40" r="7" fill={color} />
        {/* Brazos */}
        <line x1="70" y1="47" x2="100" y2="80" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <line x1="130" y1="47" x2="100" y2="80" stroke={color} strokeWidth="5" strokeLinecap="round" />
        {/* Cabeza */}
        <circle cx="100" cy="90" r="13" fill={color} opacity="0.85" />
        {/* Torso */}
        <line x1="100" y1="103" x2="100" y2="145" stroke={color} strokeWidth="6" strokeLinecap="round" />
        {/* Piernas */}
        <line x1="100" y1="145" x2="80" y2="185" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <line x1="100" y1="145" x2="120" y2="185" stroke={color} strokeWidth="5" strokeLinecap="round" />
      </g>
    </svg>
  )
}

function MachineAnimation({ color, size }: { color: string; size: 'thumb' | 'full' }) {
  const s = size === 'thumb' ? 56 : 200
  return (
    <svg viewBox="0 0 200 200" width={s} height={s} xmlns="http://www.w3.org/2000/svg">
      {/* Soporte de máquina */}
      <rect x="30" y="20" width="10" height="160" rx="5" fill={color} opacity="0.4" />
      <rect x="160" y="20" width="10" height="160" rx="5" fill={color} opacity="0.4" />
      {/* Palanca animada */}
      <g transform="translate(40,50)">
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 0 0; 35 0 0; 0 0 0"
          dur="1.8s"
          repeatCount="indefinite"
          additive="sum"
        />
        <rect x="0" y="-5" width="120" height="10" rx="5" fill={color} opacity="0.9" />
        {/* Peso al final */}
        <rect x="108" y="-18" width="22" height="36" rx="4" fill={color} />
      </g>
      {/* Pivote */}
      <circle cx="40" cy="50" r="8" fill={color} />
    </svg>
  )
}

function DefaultAnimation({ color, size }: { color: string; size: 'thumb' | 'full' }) {
  return <BarbellAnimation color={color} size={size} />
}

// ── Mapa equipo → componente ─────────────────────────────────────────────────

const EQUIPMENT_ANIMATIONS: Record<EquipmentType, typeof BarbellAnimation> = {
  barbell: BarbellAnimation,
  'ez-bar': BarbellAnimation,
  dumbbell: DumbbellAnimation,
  cable: CableAnimation,
  machine: MachineAnimation,
  bodyweight: BodyweightAnimation,
  kettlebell: KettlebellAnimation,
  'pull-up-bar': PullUpBarAnimation,
}

// ── Componente público ────────────────────────────────────────────────────────

export function AnimatedExercisePlaceholder({
  equipment,
  primaryMuscle,
  size = 'full',
  className,
}: {
  equipment?: string
  primaryMuscle?: string
  size?: 'thumb' | 'full'
  className?: string
}) {
  const color = MUSCLE_COLORS[primaryMuscle ?? ''] ?? '#64748b'
  const AnimComp = EQUIPMENT_ANIMATIONS[equipment as EquipmentType] ?? DefaultAnimation
  const containerSize = size === 'thumb' ? 56 : 200

  return (
    <div
      className={className}
      style={{
        width: containerSize,
        height: containerSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `radial-gradient(ellipse, ${color}18, ${color}08)`,
        border: `1px solid ${color}30`,
        borderRadius: size === 'thumb' ? 'var(--radius-md)' : '1rem',
        overflow: 'hidden',
      }}
    >
      <AnimComp color={color} size={size} />
    </div>
  )
}

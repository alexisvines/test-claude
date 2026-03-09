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
const BODY_STROKE = '#475569'

const SIZE_MAP = { sm: 180, md: 240, lg: 300 }

function mc(muscle: MuscleGroup, primary: MuscleGroup[], secondary: MuscleGroup[]) {
  if (primary.includes(muscle)) return PRIMARY_COLOR
  if (secondary.includes(muscle)) return SECONDARY_COLOR
  return INACTIVE_COLOR
}
function mo(muscle: MuscleGroup, primary: MuscleGroup[], secondary: MuscleGroup[]) {
  if (primary.includes(muscle)) return 0.92
  if (secondary.includes(muscle)) return 0.72
  return 0.35
}

export function MuscleDiagram({ primary, secondary, size = 'md' }: MuscleDiagramProps) {
  const w = SIZE_MAP[size]
  const h = Math.round(w * (340 / 290))
  const c = (m: MuscleGroup) => mc(m, primary, secondary)
  const o = (m: MuscleGroup) => mo(m, primary, secondary)

  return (
    <svg viewBox="0 0 290 340" width={w} height={h} style={{ display: 'block' }}>
      <defs>
        <radialGradient id="mgDepth" cx="38%" cy="28%" r="65%">
          <stop offset="0%" stopColor="white" stopOpacity="0.25" />
          <stop offset="100%" stopColor="black" stopOpacity="0.15" />
        </radialGradient>
        <filter id="mgGlow">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ════════════ FRONT VIEW (center x=65) ════════════ */}

      {/* Body silhouette */}
      <circle cx="65" cy="22" r="14" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1" />
      <path d="M 60,35 L 70,35 L 71,44 L 59,44 Z" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="0.8" />

      {/* Torso */}
      <path
        d="M 38,48 C 26,54 18,66 16,82 L 16,110 C 16,118 20,124 22,130 L 20,152 C 30,158 46,162 65,162 C 84,162 100,158 110,152 L 108,130 C 110,124 114,118 114,110 L 114,82 C 112,66 104,54 92,48 C 82,44 74,42 65,42 C 56,42 48,44 38,48 Z"
        fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1"
      />

      {/* Left upper arm */}
      <path
        d="M 18,80 C 10,84 7,100 8,116 C 9,128 14,134 20,132 C 25,130 27,122 27,114 L 27,92 C 26,84 22,78 18,80 Z"
        fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="0.8"
      />
      {/* Right upper arm */}
      <path
        d="M 112,80 C 120,84 123,100 122,116 C 121,128 116,134 110,132 C 105,130 103,122 103,114 L 103,92 C 104,84 108,78 112,80 Z"
        fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="0.8"
      />

      {/* Left forearm */}
      <path
        d="M 8,134 C 3,142 2,158 5,172 C 7,180 12,184 18,182 C 23,178 24,166 23,154 C 22,142 16,132 10,134 Z"
        fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="0.8"
      />
      {/* Right forearm */}
      <path
        d="M 122,134 C 127,142 128,158 125,172 C 123,180 118,184 112,182 C 107,178 106,166 107,154 C 108,142 114,132 120,134 Z"
        fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="0.8"
      />

      {/* Hip area */}
      <path
        d="M 35,162 C 26,164 20,170 20,178 L 20,184 L 110,184 L 110,178 C 110,170 104,164 95,162 Z"
        fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="0.8"
      />

      {/* Left thigh */}
      <path
        d="M 20,182 C 13,188 10,206 10,226 C 10,244 15,256 24,258 C 33,258 40,248 42,232 C 44,216 40,196 33,184 C 28,180 22,180 20,182 Z"
        fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1"
      />
      {/* Right thigh */}
      <path
        d="M 110,182 C 117,188 120,206 120,226 C 120,244 115,256 106,258 C 97,258 90,248 88,232 C 86,216 90,196 97,184 C 102,180 108,180 110,182 Z"
        fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1"
      />

      {/* Left shin */}
      <path
        d="M 20,260 C 14,268 12,284 14,300 C 16,312 22,316 29,314 C 36,312 40,302 40,288 C 40,274 35,262 26,260 Z"
        fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="0.8"
      />
      {/* Right shin */}
      <path
        d="M 110,260 C 116,268 118,284 116,300 C 114,312 108,316 101,314 C 94,312 90,302 90,288 C 90,274 95,262 104,260 Z"
        fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="0.8"
      />

      <ellipse cx="30" cy="320" rx="14" ry="6" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="0.8" />
      <ellipse cx="100" cy="320" rx="14" ry="6" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="0.8" />

      {/* ── Front muscle overlays ── */}

      {/* SHOULDERS — anterior deltoid */}
      <path
        d="M 16,74 C 10,66 8,76 10,90 C 12,98 18,100 26,94 C 30,84 28,72 20,68 Z"
        fill={c('shoulders')} fillOpacity={o('shoulders')}
      />
      <path
        d="M 114,74 C 120,66 122,76 120,90 C 118,98 112,100 104,94 C 100,84 102,72 110,68 Z"
        fill={c('shoulders')} fillOpacity={o('shoulders')}
      />

      {/* CHEST — left pectoralis */}
      <path
        d="M 40,52 C 30,58 27,72 31,88 C 35,100 46,104 60,98 C 63,88 61,72 53,62 C 48,56 43,52 40,52 Z"
        fill={c('chest')} fillOpacity={o('chest')}
      />
      {/* CHEST — right pectoralis */}
      <path
        d="M 90,52 C 100,58 103,72 99,88 C 95,100 84,104 70,98 C 67,88 69,72 77,62 C 82,56 87,52 90,52 Z"
        fill={c('chest')} fillOpacity={o('chest')}
      />
      {/* Sternal division */}
      <line x1="65" y1="48" x2="65" y2="100" stroke={BODY_STROKE} strokeWidth="0.6" strokeOpacity="0.5" />

      {/* BICEPS */}
      <path
        d="M 10,88 C 5,96 4,112 7,124 C 9,132 15,136 20,130 C 25,124 25,108 22,96 C 20,88 14,84 10,88 Z"
        fill={c('biceps')} fillOpacity={o('biceps')}
      />
      <path
        d="M 120,88 C 125,96 126,112 123,124 C 121,132 115,136 110,130 C 105,124 105,108 108,96 C 110,88 116,84 120,88 Z"
        fill={c('biceps')} fillOpacity={o('biceps')}
      />

      {/* FOREARMS */}
      <path
        d="M 6,136 C 2,144 1,160 4,174 C 6,182 12,184 17,182 C 22,178 23,162 20,150 C 17,138 10,132 6,136 Z"
        fill={c('forearms')} fillOpacity={o('forearms')}
      />
      <path
        d="M 124,136 C 128,144 129,160 126,174 C 124,182 118,184 113,182 C 108,178 107,162 110,150 C 113,138 120,132 124,136 Z"
        fill={c('forearms')} fillOpacity={o('forearms')}
      />

      {/* CORE — abs grid (6 sections) */}
      <rect x="50" y="102" width="13" height="13" rx="3" fill={c('core')} fillOpacity={o('core')} />
      <rect x="67" y="102" width="13" height="13" rx="3" fill={c('core')} fillOpacity={o('core')} />
      <rect x="50" y="119" width="13" height="13" rx="3" fill={c('core')} fillOpacity={o('core')} />
      <rect x="67" y="119" width="13" height="13" rx="3" fill={c('core')} fillOpacity={o('core')} />
      <rect x="50" y="136" width="13" height="12" rx="3" fill={c('core')} fillOpacity={o('core')} />
      <rect x="67" y="136" width="13" height="12" rx="3" fill={c('core')} fillOpacity={o('core')} />
      {/* Obliques */}
      <path
        d="M 36,100 C 30,110 29,126 33,140 C 37,146 43,144 46,138 L 46,104 C 44,98 39,96 36,100 Z"
        fill={c('core')} fillOpacity={o('core') * 0.65}
      />
      <path
        d="M 94,100 C 100,110 101,126 97,140 C 93,146 87,144 84,138 L 84,104 C 86,98 91,96 94,100 Z"
        fill={c('core')} fillOpacity={o('core') * 0.65}
      />

      {/* QUADRICEPS */}
      <path
        d="M 22,186 C 14,194 11,212 12,230 C 13,246 19,256 28,256 C 37,256 43,246 43,230 C 43,214 39,196 31,186 C 27,182 23,183 22,186 Z"
        fill={c('quadriceps')} fillOpacity={o('quadriceps')}
      />
      {/* Vastus medialis line */}
      <path d="M 26,228 C 28,240 30,250 32,256" stroke={BODY_BASE} strokeWidth="1" strokeOpacity="0.5" fill="none" />
      <path
        d="M 108,186 C 116,194 119,212 118,230 C 117,246 111,256 102,256 C 93,256 87,246 87,230 C 87,214 91,196 99,186 C 103,182 107,183 108,186 Z"
        fill={c('quadriceps')} fillOpacity={o('quadriceps')}
      />
      <path d="M 104,228 C 102,240 100,250 98,256" stroke={BODY_BASE} strokeWidth="1" strokeOpacity="0.5" fill="none" />

      {/* CALVES — front (tibialis anterior) */}
      <path
        d="M 17,262 C 11,272 10,288 12,302 C 14,312 20,318 27,316 C 34,314 38,304 38,290 C 38,276 33,264 24,262 Z"
        fill={c('calves')} fillOpacity={o('calves')}
      />
      <path
        d="M 113,262 C 119,272 120,288 118,302 C 116,312 110,318 103,316 C 96,314 92,304 92,290 C 92,276 97,264 106,262 Z"
        fill={c('calves')} fillOpacity={o('calves')}
      />

      {/* Front label */}
      <text x="65" y="336" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="system-ui,sans-serif" letterSpacing="1.5">FRONTAL</text>

      {/* ── Divider ── */}
      <line x1="145" y1="14" x2="145" y2="332" stroke={BODY_STROKE} strokeWidth="0.5" strokeDasharray="4 3" />

      {/* ════════════ BACK VIEW (center x=225, offset +160 from front) ════════════ */}

      {/* Body silhouette */}
      <circle cx="225" cy="22" r="14" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1" />
      <path d="M 220,35 L 230,35 L 231,44 L 219,44 Z" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="0.8" />

      {/* Torso back */}
      <path
        d="M 198,48 C 186,54 178,66 176,82 L 176,110 C 176,118 180,124 182,130 L 180,152 C 190,158 206,162 225,162 C 244,162 260,158 270,152 L 268,130 C 270,124 274,118 274,110 L 274,82 C 272,66 264,54 252,48 C 242,44 234,42 225,42 C 216,42 208,44 198,48 Z"
        fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1"
      />

      {/* Left upper arm (back) */}
      <path
        d="M 178,80 C 170,84 167,100 168,116 C 169,128 174,134 180,132 C 185,130 187,122 187,114 L 187,92 C 186,84 182,78 178,80 Z"
        fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="0.8"
      />
      {/* Right upper arm (back) */}
      <path
        d="M 272,80 C 280,84 283,100 282,116 C 281,128 276,134 270,132 C 265,130 263,122 263,114 L 263,92 C 264,84 268,78 272,80 Z"
        fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="0.8"
      />

      {/* Left forearm (back) */}
      <path
        d="M 168,134 C 163,142 162,158 165,172 C 167,180 172,184 178,182 C 183,178 184,166 183,154 C 182,142 176,132 170,134 Z"
        fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="0.8"
      />
      {/* Right forearm (back) */}
      <path
        d="M 282,134 C 287,142 288,158 285,172 C 283,180 278,184 272,182 C 267,178 266,166 267,154 C 268,142 274,132 280,134 Z"
        fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="0.8"
      />

      {/* Glute/hip area */}
      <path
        d="M 195,162 C 186,164 180,170 180,178 L 180,186 L 270,186 L 270,178 C 270,170 264,164 255,162 Z"
        fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="0.8"
      />

      {/* Left thigh (back) */}
      <path
        d="M 180,184 C 173,190 170,208 170,228 C 170,246 175,258 184,260 C 193,260 200,250 202,234 C 204,218 200,198 193,186 C 188,182 182,182 180,184 Z"
        fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1"
      />
      {/* Right thigh (back) */}
      <path
        d="M 270,184 C 277,190 280,208 280,228 C 280,246 275,258 266,260 C 257,260 250,250 248,234 C 246,218 250,198 257,186 C 262,182 268,182 270,184 Z"
        fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="1"
      />

      {/* Left shin (back) */}
      <path
        d="M 180,262 C 174,270 172,286 174,302 C 176,314 182,318 189,316 C 196,314 200,304 200,290 C 200,276 195,264 186,262 Z"
        fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="0.8"
      />
      {/* Right shin (back) */}
      <path
        d="M 270,262 C 276,270 278,286 276,302 C 274,314 268,318 261,316 C 254,314 250,304 250,290 C 250,276 255,264 264,262 Z"
        fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="0.8"
      />

      <ellipse cx="190" cy="320" rx="14" ry="6" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="0.8" />
      <ellipse cx="260" cy="320" rx="14" ry="6" fill={BODY_BASE} stroke={BODY_STROKE} strokeWidth="0.8" />

      {/* ── Back muscle overlays ── */}

      {/* TRAPS — upper trapezius (diamond covering neck to mid-back) */}
      <path
        d="M 225,46 C 212,50 198,58 194,70 C 200,76 212,80 225,80 C 238,80 250,76 256,70 C 252,58 238,50 225,46 Z"
        fill={c('traps')} fillOpacity={o('traps')}
      />
      {/* Lower trap */}
      <path
        d="M 198,72 C 194,84 196,96 202,104 L 225,96 L 248,104 C 254,96 256,84 252,72 C 244,78 233,82 225,82 C 217,82 206,78 198,72 Z"
        fill={c('traps')} fillOpacity={o('traps') * 0.75}
      />

      {/* SHOULDERS — posterior deltoid */}
      <path
        d="M 176,74 C 170,66 168,76 170,90 C 172,98 178,100 186,94 C 190,84 188,72 180,68 Z"
        fill={c('shoulders')} fillOpacity={o('shoulders')}
      />
      <path
        d="M 274,74 C 280,66 282,76 280,90 C 278,98 272,100 264,94 C 260,84 262,72 270,68 Z"
        fill={c('shoulders')} fillOpacity={o('shoulders')}
      />

      {/* BACK — rhomboids / middle back */}
      <path
        d="M 208,82 C 203,94 203,108 208,118 C 214,122 225,124 236,118 C 241,108 241,94 236,82 C 231,78 225,78 219,82 Z"
        fill={c('back')} fillOpacity={o('back')}
      />

      {/* LATS — latissimus dorsi */}
      <path
        d="M 180,86 C 174,96 173,114 177,128 C 181,138 190,140 198,132 C 204,122 206,102 202,88 C 198,80 186,78 180,86 Z"
        fill={c('lats')} fillOpacity={o('lats')}
      />
      <path
        d="M 270,86 C 276,96 277,114 273,128 C 269,138 260,140 252,132 C 246,122 244,102 248,88 C 252,80 264,78 270,86 Z"
        fill={c('lats')} fillOpacity={o('lats')}
      />

      {/* TRICEPS */}
      <path
        d="M 170,88 C 165,98 164,114 167,126 C 169,134 175,138 181,132 C 185,126 186,110 183,98 C 181,88 174,84 170,88 Z"
        fill={c('triceps')} fillOpacity={o('triceps')}
      />
      <path
        d="M 280,88 C 285,98 286,114 283,126 C 281,134 275,138 269,132 C 265,126 264,110 267,98 C 269,88 276,84 280,88 Z"
        fill={c('triceps')} fillOpacity={o('triceps')}
      />

      {/* FOREARMS (back) */}
      <path
        d="M 166,136 C 161,146 161,162 164,176 C 166,184 172,186 177,184 C 182,180 183,164 180,152 C 177,140 170,132 166,136 Z"
        fill={c('forearms')} fillOpacity={o('forearms')}
      />
      <path
        d="M 284,136 C 289,146 289,162 286,176 C 284,184 278,186 273,184 C 268,180 267,164 270,152 C 273,140 280,132 284,136 Z"
        fill={c('forearms')} fillOpacity={o('forearms')}
      />

      {/* GLUTES */}
      <path
        d="M 186,168 C 179,176 177,188 180,200 C 183,210 192,214 202,208 C 210,202 213,190 210,178 C 207,168 198,163 190,166 Z"
        fill={c('glutes')} fillOpacity={o('glutes')}
      />
      <path
        d="M 264,168 C 271,176 273,188 270,200 C 267,210 258,214 248,208 C 240,202 237,190 240,178 C 243,168 252,163 260,166 Z"
        fill={c('glutes')} fillOpacity={o('glutes')}
      />

      {/* HAMSTRINGS */}
      <path
        d="M 180,188 C 172,198 169,218 170,236 C 171,250 177,260 186,260 C 195,260 202,250 203,234 C 204,218 200,198 192,188 C 188,184 183,184 180,188 Z"
        fill={c('hamstrings')} fillOpacity={o('hamstrings')}
      />
      <path
        d="M 270,188 C 278,198 281,218 280,236 C 279,250 273,260 264,260 C 255,260 248,250 247,234 C 246,218 250,198 258,188 C 262,184 267,184 270,188 Z"
        fill={c('hamstrings')} fillOpacity={o('hamstrings')}
      />

      {/* CALVES — gastrocnemius (back, two visible heads) */}
      <path
        d="M 176,264 C 170,274 169,290 172,304 C 174,314 180,320 187,318 C 194,316 198,306 198,292 C 198,278 193,266 184,264 Z"
        fill={c('calves')} fillOpacity={o('calves')}
      />
      {/* Medial/lateral head division */}
      <path d="M 186,282 C 186,294 186,306 186,316" stroke={BODY_BASE} strokeWidth="0.8" strokeOpacity="0.5" fill="none" />
      <path
        d="M 274,264 C 280,274 281,290 278,304 C 276,314 270,320 263,318 C 256,316 252,306 252,292 C 252,278 257,266 266,264 Z"
        fill={c('calves')} fillOpacity={o('calves')}
      />
      <path d="M 264,282 C 264,294 264,306 264,316" stroke={BODY_BASE} strokeWidth="0.8" strokeOpacity="0.5" fill="none" />

      {/* Spine line */}
      <line x1="225" y1="50" x2="225" y2="160" stroke={BODY_STROKE} strokeWidth="0.8" strokeOpacity="0.4" />

      {/* Back label */}
      <text x="225" y="336" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="system-ui,sans-serif" letterSpacing="1.5">DORSAL</text>
    </svg>
  )
}

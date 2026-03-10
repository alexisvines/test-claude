# CLAUDE.md — Kova

Kova is an **offline-first PWA** for strength training. Users log workout sets, track personal records, manage routines, and get AI-powered coaching feedback — entirely in the browser via IndexedDB.

---

## Commands

```bash
npm run dev          # Start Vite dev server (localhost:5173)
npm run build        # Type-check + production build
npm run preview      # Preview production build locally
npm run type-check   # Run tsc --noEmit
npm run lint         # ESLint (0 warnings allowed)
npm run test         # Run unit tests (Vitest, single pass)
npm run test:watch   # Vitest in watch mode
```

> **CI gate**: `type-check` → `test` → `build` must all pass before merging.

---

## Architecture

The project follows **Clean Architecture** with four layers, strictly separated by import direction (inner layers never import outer ones):

```
src/
├── domain/            # Pure business logic — no framework dependencies
│   ├── entities/      # Aggregates (WorkoutSession, Exercise, Routine, Athlete, Achievement)
│   ├── value-objects/ # Immutable types (Weight, RIR, RPE, RepRange, MuscleGroup)
│   ├── services/      # Domain services (ProgressionEngine, AchievementEvaluator, …)
│   ├── repositories/  # Repository interfaces only (I*Repository)
│   └── events/        # Domain event type definitions
│
├── application/       # Orchestration — use cases, no UI knowledge
│   ├── commands/      # CQRS command handlers (StartWorkoutSession, RecordSet, CompleteWorkoutSession)
│   └── ports/         # Application-level interfaces (IEventBus, IAIEvaluationPort)
│
├── infrastructure/    # External system adapters
│   ├── persistence/
│   │   ├── dexie/     # Dexie (IndexedDB) repository implementations
│   │   └── seed/      # Seed data for exercises & routine templates
│   ├── ai/            # GeminiAIAdapter, OfflineAIAdapter, AIProviderFactory
│   └── container/     # DIContainer (singleton, wires everything together)
│
├── presentation/      # React UI layer
│   ├── design-system/ # Reusable components (Button) + CSS design tokens
│   ├── features/      # Feature-scoped components, hooks, and stores
│   │   ├── workout/   # Active workout (SetLogger, ExerciseCard, RestTimer, Zustand store)
│   │   ├── routines/  # Routine wizard & personalised wizard
│   │   ├── exercises/ # MuscleDiagram
│   │   ├── progress/  # WorkoutCalendar
│   │   └── ai-coach/  # AICoachPanel
│   ├── layout/        # RootLayout, BottomNav
│   └── pages/         # Route-level components (Dashboard, Routines, Exercises, …)
│
├── shared/
│   ├── hooks/         # useLocalStorage, useDebounce, useExerciseGif, useExerciseDbGif
│   └── utils/         # cn() (clsx + tailwind-merge), formatters
│
├── bootstrap.ts       # App initialisation: seed DB, create default athlete
├── router.tsx         # TanStack Router route tree (basepath /test-claude/)
└── main.tsx           # React root mount
```

---

## Key Patterns

### Domain Entities
All entities use **private constructors** with static factory methods:
- `Entity.create(params)` — produces a new entity with `crypto.randomUUID()`
- `Entity.reconstitute(props)` — rehydrates from persisted data (clears domain events)
- `entity.toJSON()` — serialises to a plain object for storage

```ts
// Example usage
const session = WorkoutSession.create({ athleteId, routineId })
const restored = WorkoutSession.reconstitute(storedProps)
```

### Value Objects
Value objects are **immutable** and validate in their factory:
```ts
Weight.fromKg(80)       // throws if negative or > 1000
RIR.create(2)           // throws if outside 0–5
RPE.create(8)           // throws if outside 1–10
```

### CQRS Commands
Commands live in `src/application/commands/<CommandName>/`. Each has:
- `<CommandName>Command.ts` — command interface + result type
- `<CommandName>Handler.ts` — handler class with `handle(command): Promise<Result>`

Handlers pull domain events after saving and publish them through `IEventBus`.

### Dependency Injection
`DIContainer` is a **singleton** created once at startup. Access it via:
```ts
import { getContainer } from '@/infrastructure/container/DIContainer'
const { workoutRepo, recordSetHandler } = getContainer()
```

Never instantiate repositories or handlers directly in components.

### State Management
| Concern | Tool |
|---|---|
| Active workout UI state | Zustand + Immer (`useActiveWorkoutStore`) |
| Atomic/derived UI state | Jotai atoms |
| Async server-like queries | TanStack Query |
| Persisted user preferences | `useLocalStorage` hook |

### AI Provider
`AIProviderFactory` selects the adapter at runtime:
1. If `localStorage.kova_gemini_key` is set **and** the circuit breaker is closed → `GeminiAIAdapter`
2. Otherwise → `OfflineAIAdapter` (rule-based fallback, always works)

Circuit breaker opens after 3 consecutive failures and resets after 5 minutes.

---

## Routing

TanStack Router with `basepath: '/test-claude/'`. All pages are **lazy-loaded**:

| Path | Page |
|---|---|
| `/dashboard` | Dashboard |
| `/workout` | ActiveWorkout |
| `/exercises` | Exercises |
| `/routines` | Routines |
| `/progress` | Progress |
| `/achievements` | Achievements |
| `/settings` | Settings |

`/` redirects to `/dashboard`.

---

## Design System & Styling

### CSS Custom Properties (tokens)
All design tokens are defined in `src/presentation/design-system/tokens/tokens.css` and consumed throughout. **Always use tokens, not hardcoded values.**

| Token group | Examples |
|---|---|
| Surfaces | `--color-base`, `--color-surface-01/02/03`, `--color-surface-elevated` |
| Accent | `--color-accent` (`#C8FF00` electric lime), `--color-accent-dim`, `--color-accent-glow` |
| Semantic | `--color-success`, `--color-warning`, `--color-danger`, `--color-info` |
| RIR colours | `--color-rir-0` (red) … `--color-rir-5` (purple) |
| Typography | `--font-display` (Barlow Condensed), `--font-body` (DM Sans), `--font-mono` (JetBrains Mono) |
| Motion | `--duration-fast/normal/slow`, `--ease-spring`, `--ease-out`, `--ease-in-out` |
| Tap targets | `--tap-min` (48px), `--tap-comfortable` (56px), `--tap-large` (64px) |

### Tailwind
Tailwind is configured with the same tokens as utility classes (e.g. `bg-accent`, `text-danger`, `font-display`). Use Tailwind utilities; fall back to inline `style={{ var(--...) }}` for dynamic values.

### Class merging
```ts
import { cn } from '@/shared/utils/cn'
<div className={cn('base-class', condition && 'conditional-class', props.className)} />
```

### Mobile-first
- Minimum tap targets: 48 px (`--tap-min`)
- Use `.safe-bottom` on fixed bottom elements for iOS safe-area
- `prefers-reduced-motion` is handled globally in tokens.css

---

## Database (Dexie / IndexedDB)

`KovaDatabase` (`src/infrastructure/persistence/dexie/KovaDatabase.ts`) is the Dexie instance. Tables:
- `workouts`, `exercises`, `routines`, `athletes`
- Accessed only through repository implementations in `infrastructure/persistence/dexie/`

Seed data runs once on first launch in `bootstrap.ts`:
- ~100 exercises (`exercises.seed.ts`)
- Routine templates (`routineTemplates.seed.ts`)
- Default `Athlete` entity + locked achievements

---

## Testing

Tests live in `tests/unit/`. Run with `npm test` (Vitest + jsdom).

```
tests/
├── setup.ts                          # @testing-library/jest-dom matchers
└── unit/
    └── domain/
        └── ProgressionEngine.test.ts # Domain logic tests (no React, no DB)
```

**Conventions:**
- Test domain logic (entities, value objects, services) in pure unit tests — no mocks needed
- For React components use `@testing-library/react` + `@testing-library/user-event`
- `DIContainer.reset()` is available to clear the singleton between tests

---

## Path Alias

`@` maps to `./src` in both Vite and Vitest configs:
```ts
import { cn } from '@/shared/utils/cn'
import { getContainer } from '@/infrastructure/container/DIContainer'
```

---

## Language

All **UI-facing strings, messages, and in-code comments** are written in **Spanish**. Keep this consistent when adding or modifying user-visible text.

---

## CI / CD

GitHub Actions workflows in `.github/workflows/`:

| Workflow | Trigger | Steps |
|---|---|---|
| `ci.yml` | PR to main branch | `type-check` → `test` → `build` |
| `deploy.yml` | Push to main branch | `generate-icons` → `type-check` → `test` → `build` → deploy to GitHub Pages |

Deployed at: `https://<org>.github.io/test-claude/`

---

## Adding New Features — Checklist

1. **Domain first**: define entities/value objects/domain events if needed
2. **Repository interface**: add methods to the relevant `I*Repository` in `domain/repositories/`
3. **Command handler**: create `application/commands/<Name>/` with command + handler
4. **Infrastructure**: implement new repo methods in the Dexie adapter
5. **Wire up**: expose via `DIContainer` if needed
6. **UI**: add feature components under `presentation/features/<feature>/`; create a new page under `presentation/pages/` and register a route in `router.tsx` if it's a new screen
7. **Tests**: add unit tests for domain logic in `tests/unit/domain/`

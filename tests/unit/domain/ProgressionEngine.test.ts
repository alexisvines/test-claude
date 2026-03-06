import { describe, it, expect } from 'vitest'
import { ProgressionEngine } from '../../../src/domain/services/ProgressionEngine'
import { WorkoutSet } from '../../../src/domain/entities/WorkoutSet'
import { Weight } from '../../../src/domain/value-objects/Weight'
import { RIR } from '../../../src/domain/value-objects/RIR'
import { RPE } from '../../../src/domain/value-objects/RPE'

function makeSet(reps: number, rir: number, weightKg = 80): WorkoutSet {
  return WorkoutSet.create({
    exerciseId: 'test',
    setNumber: 1,
    weight: Weight.fromKg(weightKg),
    reps,
    rir: RIR.create(rir),
    rpe: RPE.create(8),
  })
}

const testConfig = {
  targetRepRange: { min: 8, max: 12 },
  targetRIR: 2,
  primaryMuscle: 'chest' as const,
  currentWeight: Weight.fromKg(80),
}

describe('DoubleProgressionStrategy', () => {
  it('suggests weight increase when all sets at top rep with sufficient RIR', () => {
    const history = [makeSet(12, 3), makeSet(12, 2), makeSet(12, 2), makeSet(12, 3)]
    const engine = ProgressionEngine.doubleProgression()
    const suggestion = engine.suggest(history, testConfig)
    expect(suggestion.action).toBe('increase-weight')
    expect(suggestion.suggestedWeight?.toKg()).toBe(82.5)
  })

  it('suggests maintaining weight when reps are below target', () => {
    const history = [makeSet(9, 2), makeSet(10, 2), makeSet(8, 2)]
    const engine = ProgressionEngine.doubleProgression()
    const suggestion = engine.suggest(history, testConfig)
    expect(suggestion.action).toBe('maintain-weight')
  })

  it('suggests decreasing weight when average RIR is below 1', () => {
    const history = [makeSet(12, 0), makeSet(12, 0), makeSet(11, 0)]
    const engine = ProgressionEngine.doubleProgression()
    const suggestion = engine.suggest(history, testConfig)
    expect(suggestion.action).toBe('decrease-weight')
  })

  it('returns maintain when no history', () => {
    const engine = ProgressionEngine.doubleProgression()
    const suggestion = engine.suggest([], testConfig)
    expect(suggestion.action).toBe('maintain-weight')
  })
})

describe('LinearProgressionStrategy', () => {
  it('suggests increase after successful session', () => {
    const history = [makeSet(10, 2)]
    const engine = ProgressionEngine.linear()
    const suggestion = engine.suggest(history, testConfig)
    expect(suggestion.action).toBe('increase-weight')
  })

  it('suggests maintain when session failed', () => {
    const history = [makeSet(6, 0)]
    const engine = ProgressionEngine.linear()
    const suggestion = engine.suggest(history, testConfig)
    expect(suggestion.action).toBe('maintain-weight')
  })
})

describe('Weight value object', () => {
  it('converts kg to lb correctly', () => {
    const weight = Weight.fromKg(100)
    expect(weight.toLb()).toBeCloseTo(220.46, 0)
  })

  it('throws when weight is negative', () => {
    expect(() => Weight.fromKg(-1)).toThrow()
  })

  it('adds weights correctly', () => {
    const w1 = Weight.fromKg(80)
    const w2 = Weight.fromKg(2.5)
    expect(w1.add(w2).toKg()).toBe(82.5)
  })
})

describe('RIR value object', () => {
  it('validates range 0-5', () => {
    expect(() => RIR.create(-1)).toThrow()
    expect(() => RIR.create(6)).toThrow()
    expect(RIR.create(0).value).toBe(0)
    expect(RIR.create(5).value).toBe(5)
  })

  it('correctly identifies near failure', () => {
    expect(RIR.create(0).isNearFailure).toBe(true)
    expect(RIR.create(1).isNearFailure).toBe(true)
    expect(RIR.create(2).isNearFailure).toBe(false)
  })

  it('identifies optimal hypertrophy range', () => {
    expect(RIR.create(2).isOptimalHypertrophy).toBe(true)
    expect(RIR.create(1).isOptimalHypertrophy).toBe(false)
  })
})

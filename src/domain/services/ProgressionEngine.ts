import { Weight } from '../value-objects/Weight'
import { isLowerBody, type MuscleGroup } from '../value-objects/MuscleGroup'
import type { WorkoutSet } from '../entities/WorkoutSet'

export interface ProgressionSuggestion {
  action: 'increase-weight' | 'maintain-weight' | 'decrease-weight' | 'deload'
  suggestedWeight?: Weight
  message: string
  confidence: number
}

export interface ProgressionConfig {
  targetRepRange: { min: number; max: number }
  targetRIR: number
  primaryMuscle: MuscleGroup
  currentWeight: Weight
}

export interface ProgressionStrategy {
  readonly name: string
  calculate(
    history: ReadonlyArray<WorkoutSet>,
    config: ProgressionConfig
  ): ProgressionSuggestion
}

function getIncrement(muscle: MuscleGroup): number {
  return isLowerBody(muscle) ? 5 : 2.5
}

export class DoubleProgressionStrategy implements ProgressionStrategy {
  readonly name = 'double-progression'

  calculate(
    history: ReadonlyArray<WorkoutSet>,
    config: ProgressionConfig
  ): ProgressionSuggestion {
    if (history.length === 0) {
      return {
        action: 'maintain-weight',
        suggestedWeight: config.currentWeight,
        message: 'No hay historial suficiente. Mantén el peso actual.',
        confidence: 0.5,
      }
    }

    const recentSets = history.slice(-config.targetRepRange.max)
    const avgRIR = recentSets.reduce((sum, s) => sum + s.rir.value, 0) / recentSets.length
    const allAtTopRep = recentSets.every(s => s.reps >= config.targetRepRange.max)
    const allGoodRIR = recentSets.every(s => s.rir.value >= config.targetRIR)

    if (avgRIR < 1) {
      return {
        action: 'decrease-weight',
        suggestedWeight: config.currentWeight.subtract(
          Weight.fromKg(getIncrement(config.primaryMuscle))
        ),
        message: 'RIR promedio muy bajo. Reduce el peso para recuperarte.',
        confidence: 0.85,
      }
    }

    if (allAtTopRep && allGoodRIR) {
      const increment = getIncrement(config.primaryMuscle)
      return {
        action: 'increase-weight',
        suggestedWeight: Weight.fromKg(config.currentWeight.toKg() + increment),
        message: `¡Excelente! Aumenta ${increment}kg la próxima sesión.`,
        confidence: 0.9,
      }
    }

    return {
      action: 'maintain-weight',
      suggestedWeight: config.currentWeight,
      message: 'Mantén el peso y trabaja para alcanzar el rango superior de reps.',
      confidence: 0.8,
    }
  }
}

export class LinearProgressionStrategy implements ProgressionStrategy {
  readonly name = 'linear'

  calculate(
    history: ReadonlyArray<WorkoutSet>,
    config: ProgressionConfig
  ): ProgressionSuggestion {
    if (history.length === 0) {
      return {
        action: 'maintain-weight',
        suggestedWeight: config.currentWeight,
        message: 'Primera sesión. Registra el peso con buena técnica.',
        confidence: 0.5,
      }
    }

    const lastSet = history[history.length - 1]
    if (!lastSet) {
      return { action: 'maintain-weight', suggestedWeight: config.currentWeight, message: '', confidence: 0.5 }
    }
    const wasSuccessful = lastSet.reps >= config.targetRepRange.min && lastSet.rir.value >= 1

    if (wasSuccessful) {
      const increment = getIncrement(config.primaryMuscle)
      return {
        action: 'increase-weight',
        suggestedWeight: Weight.fromKg(config.currentWeight.toKg() + increment),
        message: `Sesión exitosa. Sube ${increment}kg en la próxima.`,
        confidence: 0.85,
      }
    }

    return {
      action: 'maintain-weight',
      suggestedWeight: config.currentWeight,
      message: 'Mantén el peso hasta completar todas las reps objetivo.',
      confidence: 0.8,
    }
  }
}

export class RPEBasedStrategy implements ProgressionStrategy {
  readonly name = 'rpe-based'

  calculate(
    history: ReadonlyArray<WorkoutSet>,
    config: ProgressionConfig
  ): ProgressionSuggestion {
    if (history.length < 3) {
      return {
        action: 'maintain-weight',
        suggestedWeight: config.currentWeight,
        message: 'Necesitas más sesiones para calibrar RPE. Mantén el peso.',
        confidence: 0.5,
      }
    }

    const recent = history.slice(-3)
    const avgRPE = recent.reduce((sum, s) => sum + s.rpe.value, 0) / recent.length
    const targetRPE = 8.5

    if (avgRPE < targetRPE - 0.5) {
      const increment = getIncrement(config.primaryMuscle)
      return {
        action: 'increase-weight',
        suggestedWeight: Weight.fromKg(config.currentWeight.toKg() + increment),
        message: `RPE promedio ${avgRPE.toFixed(1)} — puedes aumentar el peso.`,
        confidence: 0.75,
      }
    }

    if (avgRPE > targetRPE + 0.5) {
      return {
        action: 'decrease-weight',
        suggestedWeight: config.currentWeight.subtract(
          Weight.fromKg(getIncrement(config.primaryMuscle))
        ),
        message: `RPE promedio ${avgRPE.toFixed(1)} — muy alto. Reduce el peso.`,
        confidence: 0.75,
      }
    }

    return {
      action: 'maintain-weight',
      suggestedWeight: config.currentWeight,
      message: `RPE promedio ${avgRPE.toFixed(1)} — en zona óptima. Mantén el peso.`,
      confidence: 0.8,
    }
  }
}

export class WaveLoadingStrategy implements ProgressionStrategy {
  readonly name = 'wave-loading'

  calculate(
    history: ReadonlyArray<WorkoutSet>,
    config: ProgressionConfig
  ): ProgressionSuggestion {
    const sessionCount = Math.floor(history.length / 3)
    const phase = sessionCount % 4

    const baseWeight = config.currentWeight.toKg()
    const increment = getIncrement(config.primaryMuscle)

    const waveWeights = [
      baseWeight,
      baseWeight + increment,
      baseWeight - increment * 0.5,
      baseWeight + increment * 1.5,
    ]

    const nextWeight = waveWeights[phase % waveWeights.length] ?? baseWeight
    const labels = ['semana base', 'semana pesada', 'semana recuperación', 'semana máxima']

    return {
      action: phase === 0 ? 'maintain-weight' : 'increase-weight',
      suggestedWeight: Weight.fromKg(nextWeight),
      message: `Ola ${phase + 1}/4: ${labels[phase] ?? 'base'}. Peso sugerido: ${nextWeight}kg`,
      confidence: 0.7,
    }
  }
}

export class ProgressionEngine {
  private constructor(private readonly strategy: ProgressionStrategy) {}

  static withStrategy(strategy: ProgressionStrategy): ProgressionEngine {
    return new ProgressionEngine(strategy)
  }

  static doubleProgression(): ProgressionEngine {
    return new ProgressionEngine(new DoubleProgressionStrategy())
  }

  static linear(): ProgressionEngine {
    return new ProgressionEngine(new LinearProgressionStrategy())
  }

  static rpeBased(): ProgressionEngine {
    return new ProgressionEngine(new RPEBasedStrategy())
  }

  static waveLoading(): ProgressionEngine {
    return new ProgressionEngine(new WaveLoadingStrategy())
  }

  get strategyName(): string {
    return this.strategy.name
  }

  suggest(
    history: ReadonlyArray<WorkoutSet>,
    config: ProgressionConfig
  ): ProgressionSuggestion {
    return this.strategy.calculate(history, config)
  }

  changeStrategy(strategy: ProgressionStrategy): ProgressionEngine {
    return new ProgressionEngine(strategy)
  }
}

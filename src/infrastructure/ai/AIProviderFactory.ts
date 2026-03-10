import type { IAIEvaluationPort } from '../../application/ports/IAIEvaluationPort'
import { GeminiAIAdapter } from './GeminiAIAdapter'
import { OfflineAIAdapter } from './OfflineAIAdapter'

const FAILURE_THRESHOLD = 3
const CIRCUIT_RESET_MS = 5 * 60 * 1000 // 5 minutes

interface CircuitState {
  failures: number
  lastFailureAt: number
}

export class AIProviderFactory {
  private readonly circuits = new Map<string, CircuitState>()
  private readonly offlineAdapter = new OfflineAIAdapter()

  create(): IAIEvaluationPort {
    const geminiKey = this.getStoredKey('gemini')

    if (geminiKey && this.isCircuitClosed('gemini')) {
      return new GeminiAIAdapter(geminiKey)
    }

    return this.offlineAdapter
  }

  recordFailure(provider: string): void {
    const state = this.circuits.get(provider) ?? { failures: 0, lastFailureAt: 0 }
    this.circuits.set(provider, {
      failures: state.failures + 1,
      lastFailureAt: Date.now(),
    })
  }

  recordSuccess(provider: string): void {
    this.circuits.delete(provider)
  }

  private isCircuitClosed(provider: string): boolean {
    const state = this.circuits.get(provider)
    if (!state) return true
    if (state.failures < FAILURE_THRESHOLD) return true

    const timeSinceFailure = Date.now() - state.lastFailureAt
    if (timeSinceFailure > CIRCUIT_RESET_MS) {
      this.circuits.delete(provider)
      return true
    }

    return false
  }

  private getStoredKey(provider: string): string {
    try {
      return localStorage.getItem(`kova_${provider}_key`) ?? ''
    } catch {
      return ''
    }
  }
}

export const aiProviderFactory = new AIProviderFactory()

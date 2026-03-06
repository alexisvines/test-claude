/** Reps In Reserve — cuántas reps quedan antes del fallo */
export class RIR {
  private constructor(private readonly _value: number) {}

  static create(value: number): RIR {
    if (!Number.isInteger(value)) throw new Error('RIR must be an integer')
    if (value < 0 || value > 5) throw new Error('RIR must be between 0 and 5')
    return new RIR(value)
  }

  get value(): number {
    return this._value
  }

  get isNearFailure(): boolean {
    return this._value <= 1
  }

  get isOptimalHypertrophy(): boolean {
    return this._value === 2
  }

  get isConservative(): boolean {
    return this._value >= 3
  }

  get color(): string {
    const colors: Record<number, string> = {
      0: '#FF2D55',
      1: '#FF6B35',
      2: '#34C759',
      3: '#30D158',
      4: '#0A84FF',
      5: '#5856D6',
    }
    return colors[this._value] ?? '#8C8C8C'
  }

  get label(): string {
    const labels: Record<number, string> = {
      0: 'Fallo',
      1: 'Casi fallo',
      2: 'Óptimo',
      3: 'Conservador',
      4: 'Muy fácil',
      5: 'Calentamiento',
    }
    return labels[this._value] ?? ''
  }

  equals(other: RIR): boolean {
    return this._value === other._value
  }

  toString(): string {
    return `RIR ${this._value}`
  }

  toJSON(): number {
    return this._value
  }

  static fromJSON(value: number): RIR {
    return RIR.create(value)
  }
}

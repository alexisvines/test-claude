/** Rate of Perceived Exertion — escala 6-10 */
export class RPE {
  private constructor(private readonly _value: number) {}

  static create(value: number): RPE {
    if (value < 6 || value > 10) throw new Error('RPE must be between 6 and 10')
    return new RPE(value)
  }

  static none(): RPE {
    return new RPE(0)
  }

  get value(): number {
    return this._value
  }

  get isValid(): boolean {
    return this._value >= 6
  }

  get isMaxEffort(): boolean {
    return this._value >= 9.5
  }

  get label(): string {
    if (this._value === 0) return 'Sin registrar'
    if (this._value <= 6) return 'Muy ligero'
    if (this._value <= 7) return 'Moderado'
    if (this._value <= 8) return 'Duro'
    if (this._value <= 9) return 'Muy duro'
    return 'Máximo esfuerzo'
  }

  equals(other: RPE): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value === 0 ? '-' : `RPE ${this._value}`
  }

  toJSON(): number {
    return this._value
  }

  static fromJSON(value: number): RPE {
    if (value === 0) return RPE.none()
    return RPE.create(value)
  }
}

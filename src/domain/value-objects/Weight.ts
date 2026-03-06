export type WeightUnit = 'kg' | 'lb'

const KG_TO_LB = 2.20462

export class Weight {
  private constructor(
    private readonly _kg: number,
    private readonly _unit: WeightUnit
  ) {}

  static fromKg(kg: number, displayUnit: WeightUnit = 'kg'): Weight {
    if (kg < 0) throw new Error('Weight cannot be negative')
    if (kg > 1000) throw new Error('Weight exceeds maximum (1000kg)')
    return new Weight(kg, displayUnit)
  }

  static fromLb(lb: number): Weight {
    if (lb < 0) throw new Error('Weight cannot be negative')
    const kg = lb / KG_TO_LB
    return new Weight(kg, 'lb')
  }

  static zero(unit: WeightUnit = 'kg'): Weight {
    return new Weight(0, unit)
  }

  toKg(): number {
    return Math.round(this._kg * 100) / 100
  }

  toLb(): number {
    return Math.round(this._kg * KG_TO_LB * 100) / 100
  }

  get unit(): WeightUnit {
    return this._unit
  }

  get displayValue(): number {
    return this._unit === 'kg' ? this.toKg() : this.toLb()
  }

  add(other: Weight): Weight {
    return new Weight(this._kg + other._kg, this._unit)
  }

  subtract(other: Weight): Weight {
    const result = this._kg - other._kg
    return new Weight(Math.max(0, result), this._unit)
  }

  multiply(factor: number): Weight {
    return new Weight(this._kg * factor, this._unit)
  }

  isGreaterThan(other: Weight): boolean {
    return this._kg > other._kg
  }

  equals(other: Weight): boolean {
    return Math.abs(this._kg - other._kg) < 0.001
  }

  toString(): string {
    return `${this.displayValue}${this._unit}`
  }

  toJSON(): { kg: number; unit: WeightUnit } {
    return { kg: this._kg, unit: this._unit }
  }

  static fromJSON(data: { kg: number; unit: WeightUnit }): Weight {
    return new Weight(data.kg, data.unit)
  }

  withUnit(unit: WeightUnit): Weight {
    return new Weight(this._kg, unit)
  }
}

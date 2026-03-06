export class RepRange {
  private constructor(
    private readonly _min: number,
    private readonly _max: number
  ) {}

  static create(min: number, max: number): RepRange {
    if (min < 1) throw new Error('Min reps must be at least 1')
    if (max < min) throw new Error('Max reps must be >= min reps')
    if (max > 100) throw new Error('Max reps cannot exceed 100')
    return new RepRange(min, max)
  }

  get min(): number { return this._min }
  get max(): number { return this._max }
  get midpoint(): number { return Math.round((this._min + this._max) / 2) }

  contains(reps: number): boolean {
    return reps >= this._min && reps <= this._max
  }

  isAtTop(reps: number): boolean {
    return reps >= this._max
  }

  isBelow(reps: number): boolean {
    return reps < this._min
  }

  toString(): string {
    return `${this._min}-${this._max}`
  }

  toJSON(): { min: number; max: number } {
    return { min: this._min, max: this._max }
  }

  static fromJSON(data: { min: number; max: number }): RepRange {
    return RepRange.create(data.min, data.max)
  }
}

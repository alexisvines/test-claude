import type { IWorkoutRepository } from '../../../domain/repositories/IWorkoutRepository'
import { WorkoutSession } from '../../../domain/entities/WorkoutSession'
import { WorkoutSet } from '../../../domain/entities/WorkoutSet'
import { Weight } from '../../../domain/value-objects/Weight'
import { RIR } from '../../../domain/value-objects/RIR'
import { RPE } from '../../../domain/value-objects/RPE'
import type { GymOSDatabase, WorkoutSessionRecord } from './GymOSDatabase'

export class DexieWorkoutRepository implements IWorkoutRepository {
  constructor(private readonly db: GymOSDatabase) {}

  async save(session: WorkoutSession): Promise<void> {
    await this.db.workoutSessions.put({
      id: session.id,
      athleteId: session.athleteId,
      routineId: session.routineId,
      routineName: session.routineName,
      startedAt: session.startedAt.toISOString(),
      completedAt: session.completedAt?.toISOString(),
      status: session.status,
      notes: session.notes,
      sets: JSON.stringify(session.sets.map(s => s.toJSON())),
    })
  }

  async findById(id: string): Promise<WorkoutSession | null> {
    const record = await this.db.workoutSessions.get(id)
    if (!record) return null
    return this.reconstitute(record)
  }

  async findActive(athleteId: string): Promise<WorkoutSession | null> {
    const record = await this.db.workoutSessions
      .where('[athleteId+status]')
      .equals([athleteId, 'active'])
      .first()
      .catch(() =>
        this.db.workoutSessions
          .where('athleteId')
          .equals(athleteId)
          .filter(r => r.status === 'active')
          .first()
      )
    if (!record) return null
    return this.reconstitute(record)
  }

  async findByAthleteId(athleteId: string, limit = 50): Promise<WorkoutSession[]> {
    const records = await this.db.workoutSessions
      .where('athleteId')
      .equals(athleteId)
      .reverse()
      .limit(limit)
      .toArray()
    return records.map(r => this.reconstitute(r))
  }

  async findByDateRange(athleteId: string, from: Date, to: Date): Promise<WorkoutSession[]> {
    const records = await this.db.workoutSessions
      .where('athleteId')
      .equals(athleteId)
      .filter(r => {
        const date = new Date(r.startedAt)
        return date >= from && date <= to
      })
      .toArray()
    return records.map(r => this.reconstitute(r))
  }

  async delete(id: string): Promise<void> {
    await this.db.workoutSessions.delete(id)
  }

  async getPersonalBest(athleteId: string, exerciseId: string): Promise<number | null> {
    const sessions = await this.findByAthleteId(athleteId, 200)
    let best: number | null = null

    for (const session of sessions) {
      for (const set of session.sets) {
        if (set.exerciseId === exerciseId) {
          const kg = set.weight.toKg()
          if (best === null || kg > best) best = kg
        }
      }
    }

    return best
  }

  private reconstitute(record: WorkoutSessionRecord): WorkoutSession {
    const setsData = JSON.parse(record.sets) as Array<Record<string, unknown>>

    const sets = setsData.map(s =>
      WorkoutSet.reconstitute({
        id: s['id'] as string,
        exerciseId: s['exerciseId'] as string,
        setNumber: s['setNumber'] as number,
        weight: Weight.fromJSON(s['weight'] as { kg: number; unit: 'kg' | 'lb' }),
        reps: s['reps'] as number,
        rir: RIR.fromJSON(s['rir'] as number),
        rpe: RPE.fromJSON(s['rpe'] as number),
        notes: s['notes'] as string | undefined,
        completedAt: new Date(s['completedAt'] as string),
        isPersonalRecord: s['isPersonalRecord'] as boolean | undefined,
      })
    )

    return WorkoutSession.reconstitute({
      id: record.id,
      athleteId: record.athleteId,
      routineId: record.routineId,
      routineName: record.routineName,
      startedAt: new Date(record.startedAt),
      completedAt: record.completedAt ? new Date(record.completedAt) : undefined,
      sets,
      status: record.status as 'active' | 'completed' | 'cancelled',
      notes: record.notes,
      domainEvents: [],
    })
  }
}

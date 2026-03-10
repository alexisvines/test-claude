import type { IRoutineRepository } from '../../../domain/repositories/IRoutineRepository'
import { Routine } from '../../../domain/entities/Routine'
import type { KovaDatabase } from './KovaDatabase'

export class DexieRoutineRepository implements IRoutineRepository {
  constructor(private readonly db: KovaDatabase) {}

  async save(routine: Routine): Promise<void> {
    await this.db.routines.put({
      id: routine.id,
      name: routine.name,
      description: routine.description,
      days: JSON.stringify(routine.toJSON()),
      isTemplate: routine.isTemplate ? 1 : 0,
      createdAt: routine.createdAt.toISOString(),
      updatedAt: routine.updatedAt.toISOString(),
    })
  }

  async findById(id: string): Promise<Routine | null> {
    const record = await this.db.routines.get(id)
    if (!record) return null
    const data = JSON.parse(record.days) as Record<string, unknown>
    return Routine.fromJSON(data)
  }

  async findAll(): Promise<Routine[]> {
    const records = await this.db.routines.where('isTemplate').equals(0).toArray()
    return records.map(r => Routine.fromJSON(JSON.parse(r.days) as Record<string, unknown>))
  }

  async findTemplates(): Promise<Routine[]> {
    const records = await this.db.routines.where('isTemplate').equals(1).toArray()
    return records.map(r => Routine.fromJSON(JSON.parse(r.days) as Record<string, unknown>))
  }

  async delete(id: string): Promise<void> {
    await this.db.routines.delete(id)
  }
}

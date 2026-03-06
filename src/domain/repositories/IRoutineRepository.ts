import type { Routine } from '../entities/Routine'

export interface IRoutineRepository {
  save(routine: Routine): Promise<void>
  findById(id: string): Promise<Routine | null>
  findAll(): Promise<Routine[]>
  findTemplates(): Promise<Routine[]>
  delete(id: string): Promise<void>
}

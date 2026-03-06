import type { GymOSDomainEvent } from '../../domain/events'

export type EventHandler<T extends GymOSDomainEvent> = (event: T) => Promise<void>

export interface IEventBus {
  publish(event: GymOSDomainEvent): Promise<void>
  subscribe<T extends GymOSDomainEvent>(
    eventType: T['type'],
    handler: EventHandler<T>
  ): void
}

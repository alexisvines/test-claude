import type { KovaDomainEvent } from '../../domain/events'

export type EventHandler<T extends KovaDomainEvent> = (event: T) => Promise<void>

export interface IEventBus {
  publish(event: KovaDomainEvent): Promise<void>
  subscribe<T extends KovaDomainEvent>(
    eventType: T['type'],
    handler: EventHandler<T>
  ): void
}

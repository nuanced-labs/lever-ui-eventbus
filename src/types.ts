/**
 * A constructor type that can create instances of T.
 * @template T The type that this constructor creates
 */
export type Constructor<T = any> = new (...args: any[]) => T;

/**
 * Context information provided when a subscriber throws an exception.
 * @template T The event type
 */
export interface SubscriberExceptionContext<T = unknown> {
  /** The event that was being processed */
  event: T;
  /** The constructor/class of the event type */
  eventType: Constructor<any>;
  /** The handler function that threw the exception */
  handler: (e: T) => void;
  /** The EventBus instance that was processing the event */
  eventBus: any; // Forward reference to avoid circular dependency
}

/**
 * Handler function for exceptions thrown by event subscribers.
 * 
 * @param error The exception that was thrown
 * @param ctx Context information about the failed event delivery
 * 
 * @example
 * ```ts
 * const errorHandler: SubscriberExceptionHandler = (error, ctx) => {
 *   logger.error(`Event ${ctx.eventType.name} failed:`, error);
 * };
 * const bus = new EventBus(errorHandler);
 * ```
 */
export type SubscriberExceptionHandler = (
  error: unknown,
  ctx: SubscriberExceptionContext
) => void;

/**
 * Represents an active subscription that can be cancelled.
 */
export interface Subscription {
  /**
   * Unsubscribe this specific handler from the event bus.
   * After calling this, the handler will no longer receive events.
   */
  unsubscribe(): void;
}

/**
 * Internal handler record structure.
 * @internal
 */
export interface HandlerRec<T = unknown> { 
  fn: (e: T) => void;
}
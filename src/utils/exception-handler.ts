import type { SubscriberExceptionHandler } from '../types';

/**
 * Default exception handler that logs errors to console.
 * @internal
 */
export const defaultExceptionHandler: SubscriberExceptionHandler = (error, ctx) => {
  console.error(`[EventBus] Error delivering ${ctx.eventType.name}:`, error);
};
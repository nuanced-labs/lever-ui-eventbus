/**
 * Event emitted when no handler is found for a posted event.
 * This helps detect unhandled events and avoid silent failures.
 * 
 * @example
 * ```ts
 * bus.subscribe(DeadEvent, (e) => {
 *   console.warn('Unhandled event:', e.event);
 * });
 * ```
 */
export class DeadEvent {
  /**
   * @param source The EventBus that could not deliver the event
   * @param event The original event that was unhandled
   */
  constructor(public source: any, public event: unknown) {}
}
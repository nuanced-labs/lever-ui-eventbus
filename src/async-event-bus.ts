import type { Constructor, SubscriberExceptionHandler } from './types';
import { EventBus } from './event-bus';
import { defaultExceptionHandler } from './utils/exception-handler';

/**
 * An asynchronous event bus that delivers events via a pluggable executor.
 * 
 * All event delivery is deferred through the executor function, allowing for
 * custom scheduling strategies like setTimeout, process.nextTick, or custom queues.
 * 
 * @example
 * ```ts
 * // Using setTimeout for delivery
 * const asyncBus = new AsyncEventBus((task) => setTimeout(task, 0));
 * 
 * // Using custom executor
 * const customBus = new AsyncEventBus((task) => {
 *   myCustomScheduler.schedule(task);
 * });
 * 
 * asyncBus.subscribe(OrderCreated, (event) => {
 *   console.log('Async order:', event.id); // called asynchronously
 * });
 * 
 * asyncBus.post(new OrderCreated('123'));
 * console.log('Posted'); // this logs first
 * ```
 */
export class AsyncEventBus extends EventBus {
  /**
   * Create a new AsyncEventBus.
   * 
   * @param executor Function that schedules task execution. Defaults to queueMicrotask.
   * @param exceptionHandler Handler for exceptions thrown by subscribers.
   */
  constructor(
    private executor: (task: () => void) => void = (task) => queueMicrotask(task),
    exceptionHandler?: SubscriberExceptionHandler
  ) {
    super(exceptionHandler ?? defaultExceptionHandler);
  }

  /**
   * Deliver an event asynchronously using the configured executor.
   * @internal
   */
  protected override deliver(
    fn: (e: unknown) => void,
    type: Constructor,
    event: unknown
  ) {
    this.executor(() => super.deliver(fn, type, event));
  }
}
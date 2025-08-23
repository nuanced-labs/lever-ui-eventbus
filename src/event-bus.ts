import type { Constructor, SubscriberExceptionHandler, Subscription, HandlerRec } from './types';
import { DeadEvent } from './dead-event';
import { defaultExceptionHandler } from './utils/exception-handler';
import { TypeResolver } from './utils/type-resolver';

/**
 * A synchronous event bus that delivers events to registered handlers.
 * 
 * Features:
 * - Type-safe event subscription
 * - Polymorphic dispatch (handlers for base classes receive subclass events)
 * - Dead event handling for undelivered events
 * - Exception handling for subscriber errors
 * 
 * @example
 * ```ts
 * class OrderCreated { constructor(public id: string) {} }
 * 
 * const bus = new EventBus();
 * const subscription = bus.subscribe(OrderCreated, (event) => {
 *   console.log('Order:', event.id);
 * });
 * 
 * bus.post(new OrderCreated('123')); // logs: "Order: 123"
 * subscription.unsubscribe();
 * ```
 */
export class EventBus {
  protected registry = new Map<Constructor, Set<HandlerRec>>();
  protected typeResolver = new TypeResolver();

  /**
   * Create a new EventBus.
   * 
   * @param exceptionHandler Handler for exceptions thrown by subscribers.
   *                        Defaults to logging to console.error.
   */
  constructor(
    protected exceptionHandler: SubscriberExceptionHandler = defaultExceptionHandler
  ) {}

  /**
   * Subscribe to events of a specific type.
   * 
   * @template T The event type to subscribe to
   * @param type The constructor/class of events to listen for
   * @param handler Function to call when events of this type are posted
   * @returns Subscription object that can be used to unsubscribe
   * 
   * @example
   * ```ts
   * class UserLoggedIn { constructor(public userId: string) {} }
   * 
   * const sub = bus.subscribe(UserLoggedIn, (event) => {
   *   console.log('User logged in:', event.userId);
   * });
   * ```
   */
  subscribe<T>(type: Constructor<T>, handler: (e: T) => void): Subscription {
    const set = this.registry.get(type as Constructor) ?? new Set<HandlerRec>();
    const rec: HandlerRec<T> = { fn: handler };
    set.add(rec as HandlerRec);
    this.registry.set(type as Constructor, set);

    return {
      unsubscribe: () => {
        const current = this.registry.get(type as Constructor);
        if (!current) return;
        current.delete(rec as HandlerRec);
        if (current.size === 0) this.registry.delete(type as Constructor);
      },
    };
  }

  /**
   * Remove all handlers for a specific event type.
   * 
   * @param type The constructor/class to remove all handlers for
   * @returns The number of handlers that were removed
   * 
   * @example
   * ```ts
   * const removed = bus.unsubscribeAll(UserLoggedIn);
   * console.log(`Removed ${removed} handlers`);
   * ```
   */
  unsubscribeAll(type: Constructor): number {
    const set = this.registry.get(type);
    const count = set?.size ?? 0;
    this.registry.delete(type);
    return count;
  }

  /**
   * Get the number of active subscriptions for a specific event type.
   * 
   * @param type The constructor/class to count handlers for
   * @returns The number of active handlers for this type
   * 
   * @example
   * ```ts
   * const count = bus.getSubscriptionCount(UserLoggedIn);
   * console.log(`${count} handlers for UserLoggedIn`);
   * ```
   */
  getSubscriptionCount(type: Constructor): number {
    return this.registry.get(type)?.size ?? 0;
  }

  /**
   * Get all event types that have active subscriptions.
   * 
   * @returns Array of constructor functions that have handlers
   * 
   * @example
   * ```ts
   * const activeTypes = bus.getActiveEventTypes();
   * console.log('Subscribed types:', activeTypes.map(t => t.name));
   * ```
   */
  getActiveEventTypes(): Constructor[] {
    return Array.from(this.registry.keys()).filter(type => 
      this.registry.get(type)!.size > 0
    );
  }

  /**
   * Remove all subscriptions from the event bus.
   * 
   * @returns The total number of handlers that were removed
   * 
   * @example
   * ```ts
   * const totalRemoved = bus.clear();
   * console.log(`Cleared ${totalRemoved} handlers`);
   * ```
   */
  clear(): number {
    let total = 0;
    for (const set of this.registry.values()) {
      total += set.size;
    }
    this.registry.clear();
    this.typeResolver.clearCache();
    return total;
  }

  /**
   * Post an event to all registered handlers.
   * 
   * Handlers are called for the exact type and all parent types in the prototype chain.
   * If no handlers are found, a DeadEvent is posted instead.
   * 
   * @template T The type of event being posted
   * @param event The event instance to deliver
   * @returns The number of handlers that received the event
   * 
   * @example
   * ```ts
   * const delivered = bus.post(new UserLoggedIn('user123'));
   * console.log(`Event delivered to ${delivered} handlers`);
   * ```
   */
  post<T>(event: T): number {
    if (event == null) return 0;

    let delivered = 0;
    const types = this.typeResolver.getTypesFor(
      event, 
      this.registry.has(Object as Constructor)
    );
    
    // Pre-collect all handlers to avoid registry lookups during delivery
    const handlersToCall: Array<{ fn: (e: unknown) => void; type: Constructor }> = [];
    
    for (const type of types) {
      const set = this.registry.get(type);
      if (!set || set.size === 0) continue;
      for (const rec of set) {
        handlersToCall.push({ fn: rec.fn, type });
        delivered++;
      }
    }

    // Deliver all events
    for (const handler of handlersToCall) {
      this.deliver(handler.fn, handler.type, event);
    }

    if (delivered === 0 && !(event instanceof DeadEvent)) {
      this.post(new DeadEvent(this, event));
    }

    return delivered;
  }

  /**
   * Deliver an event to a specific handler with exception handling.
   * @internal
   */
  protected deliver(fn: (e: unknown) => void, type: Constructor, event: unknown) {
    try {
      fn(event);
    } catch (err) {
      this.exceptionHandler(err, {
        event,
        eventType: type,
        handler: fn,
        eventBus: this,
      });
    }
  }
}
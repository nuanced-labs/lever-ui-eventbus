import { useEffect, useRef, useState, useCallback, useMemo, DependencyList } from 'react';
import type { Constructor, Subscription } from '../../types';
import { useEventBus } from './context';

/**
 * Hook that subscribes to events of a specific type and automatically cleans up on unmount.
 * 
 * @template T The event type to subscribe to
 * @param type The constructor/class of events to listen for
 * @param handler Function to call when events are received
 * @param deps Optional dependency array - when changed, will resubscribe
 * 
 * @example
 * ```tsx
 * function UserComponent() {
 *   const [userId, setUserId] = useState<string | null>(null);
 *   
 *   useEventSubscription(UserLoggedIn, (event) => {
 *     setUserId(event.userId);
 *   });
 *   
 *   useEventSubscription(UserLoggedOut, () => {
 *     setUserId(null);
 *   });
 *   
 *   return <div>User: {userId || 'Not logged in'}</div>;
 * }
 * ```
 */
export function useEventSubscription<T>(
  type: Constructor<T>,
  handler: (event: T) => void,
  deps?: DependencyList
): void {
  const bus = useEventBus();
  const subscriptionRef = useRef<Subscription | null>(null);
  
  // Memoize handler if deps are provided
  const memoizedHandler = useMemo(() => handler, deps || [handler]);
  
  useEffect(() => {
    // Clean up previous subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }
    
    // Create new subscription
    subscriptionRef.current = bus.subscribe(type, memoizedHandler);
    
    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [bus, type, memoizedHandler]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);
}

/**
 * Hook that provides a stable function to post events to the event bus.
 * 
 * @returns Function to post events
 * 
 * @example
 * ```tsx
 * function LoginButton() {
 *   const postEvent = useEventPost();
 *   
 *   const handleLogin = async () => {
 *     const success = await login();
 *     if (success) {
 *       postEvent(new UserLoggedIn(userId));
 *     }
 *   };
 *   
 *   return <button onClick={handleLogin}>Login</button>;
 * }
 * ```
 */
export function useEventPost(): <T>(event: T) => number {
  const bus = useEventBus();
  
  return useCallback(<T>(event: T) => {
    return bus.post(event);
  }, [bus]);
}

/**
 * Hook that maintains reactive state based on events.
 * State is updated whenever the specified event type is received.
 * 
 * @template T The event type to listen for
 * @template S The state type
 * @param type The constructor/class of events to listen for
 * @param initialValue Initial state value
 * @param reducer Function that updates state based on received events
 * 
 * @example
 * ```tsx
 * function UserProfile() {
 *   const user = useEventState(
 *     UserUpdated,
 *     null,
 *     (currentUser, event) => event.user
 *   );
 *   
 *   return <div>{user ? user.name : 'Loading...'}</div>;
 * }
 * ```
 */
export function useEventState<T, S>(
  type: Constructor<T>,
  initialValue: S,
  reducer: (currentState: S, event: T) => S
): S {
  const [state, setState] = useState<S>(initialValue);
  
  useEventSubscription(type, (event) => {
    setState(currentState => reducer(currentState, event));
  }, [reducer]);
  
  return state;
}

/**
 * Hook that tracks the latest event of a specific type.
 * 
 * @template T The event type to track
 * @param type The constructor/class of events to track
 * @param initialValue Initial value (default: null)
 * 
 * @example
 * ```tsx
 * function NotificationDisplay() {
 *   const lastNotification = useLatestEvent(NotificationShown, null);
 *   
 *   if (!lastNotification) return null;
 *   
 *   return (
 *     <div className="notification">
 *       {lastNotification.message}
 *     </div>
 *   );
 * }
 * ```
 */
export function useLatestEvent<T>(
  type: Constructor<T>,
  initialValue: T | null = null
): T | null {
  const [latestEvent, setLatestEvent] = useState<T | null>(initialValue);
  
  useEventSubscription(type, setLatestEvent);
  
  return latestEvent;
}

/**
 * Hook that collects events into an array with optional size limit.
 * 
 * @template T The event type to collect
 * @param type The constructor/class of events to collect
 * @param maxSize Maximum number of events to keep (default: 100)
 * 
 * @example
 * ```tsx
 * function AuditLog() {
 *   const actions = useEventCollection(UserAction, 50);
 *   
 *   return (
 *     <ul>
 *       {actions.map((action, i) => (
 *         <li key={i}>{action.description}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useEventCollection<T>(
  type: Constructor<T>,
  maxSize: number = 100
): T[] {
  const [events, setEvents] = useState<T[]>([]);
  
  useEventSubscription(type, (event) => {
    setEvents(currentEvents => {
      const newEvents = [event, ...currentEvents];
      return newEvents.slice(0, maxSize);
    });
  }, [maxSize]);
  
  return events;
}

/**
 * Hook that provides event bus management utilities.
 * 
 * @returns Object with management functions and statistics
 * 
 * @example
 * ```tsx
 * function DebugPanel() {
 *   const { subscriptionCount, activeTypes, clear } = useEventBusManager();
 *   
 *   return (
 *     <div>
 *       <p>Active event types: {activeTypes.length}</p>
 *       <p>Total subscriptions: {subscriptionCount}</p>
 *       <button onClick={clear}>Clear All</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useEventBusManager() {
  const bus = useEventBus();
  const [, forceUpdate] = useState({});
  
  const refresh = useCallback(() => {
    forceUpdate({});
  }, []);
  
  const activeTypes = useMemo(() => bus.getActiveEventTypes(), [bus, forceUpdate]);
  
  const subscriptionCount = useMemo(() => {
    return activeTypes.reduce((total, type) => {
      return total + bus.getSubscriptionCount(type);
    }, 0);
  }, [bus, activeTypes]);
  
  const clear = useCallback(() => {
    bus.clear();
    refresh();
  }, [bus, refresh]);
  
  return {
    activeTypes,
    subscriptionCount,
    clear,
    refresh,
    getSubscriptionCount: (type: Constructor) => bus.getSubscriptionCount(type),
    unsubscribeAll: (type: Constructor) => {
      const count = bus.unsubscribeAll(type);
      refresh();
      return count;
    }
  };
}
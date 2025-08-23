import React, { createContext, useContext, ReactNode } from 'react';
import type { EventBus } from '../../event-bus';

/**
 * React context for sharing an EventBus instance across components.
 */
const EventBusContext = createContext<EventBus | null>(null);

/**
 * Props for the EventBusProvider component.
 */
export interface EventBusProviderProps {
  /** The EventBus instance to provide to child components */
  bus: EventBus;
  /** Child components that will have access to the event bus */
  children: ReactNode;
}

/**
 * Provider component that makes an EventBus available to all child components.
 * 
 * @example
 * ```tsx
 * const bus = new EventBus();
 * 
 * function App() {
 *   return (
 *     <EventBusProvider bus={bus}>
 *       <UserComponent />
 *       <OrderComponent />
 *     </EventBusProvider>
 *   );
 * }
 * ```
 */
export function EventBusProvider({ bus, children }: EventBusProviderProps) {
  return (
    <EventBusContext.Provider value={bus}>
      {children}
    </EventBusContext.Provider>
  );
}

/**
 * Hook to access the EventBus from the context.
 * Must be used within an EventBusProvider.
 * 
 * @returns The EventBus instance from the nearest provider
 * @throws Error if used outside of an EventBusProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const bus = useEventBus();
 *   
 *   const handleClick = () => {
 *     bus.post(new ButtonClicked('my-button'));
 *   };
 *   
 *   return <button onClick={handleClick}>Click me</button>;
 * }
 * ```
 */
export function useEventBus(): EventBus {
  const bus = useContext(EventBusContext);
  
  if (!bus) {
    throw new Error('useEventBus must be used within an EventBusProvider');
  }
  
  return bus;
}
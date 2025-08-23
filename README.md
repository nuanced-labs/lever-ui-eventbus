
# lever-ui-eventbus

[![npm version](https://img.shields.io/npm/v/lever-ui-eventbus.svg)](https://www.npmjs.com/package/lever-ui-eventbus)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/lever-ui-eventbus)](https://bundlephobia.com/package/lever-ui-eventbus)

**A minimal TypeScript event bus with zero dependencies** featuring type-safe subscriptions, async delivery, polymorphic dispatch, dead event handling, and React integration.

## Features

- **Type-Safe** - Full TypeScript support with generic event types  
- **Zero Dependencies** - Lightweight core with no external dependencies  
- **Polymorphic Dispatch** - Base classes receive derived event types  
- **Async Support** - Non-blocking event delivery with custom executors  
- **React Integration** - Hooks and context for seamless React usage  
- **Dead Events** - Handle undelivered events gracefully  
- **Error Resilience** - Robust error handling with custom error handlers  
- **Universal** - Works in Node.js, browsers, and React Native  
- **Tree Shakeable** - Import only what you need  

## Quick Start

### Installation

```bash
npm install lever-ui-eventbus
```

### Basic Usage

```typescript
import { EventBus } from 'lever-ui-eventbus';

// Define event classes
class UserLoggedIn {
  constructor(public userId: string, public email: string) {}
}

class OrderPlaced {
  constructor(public orderId: string, public total: number) {}
}

// Create event bus
const bus = new EventBus();

// Subscribe to events
bus.subscribe(UserLoggedIn, (event) => {
  console.log(`Welcome ${event.email}!`);
});

bus.subscribe(OrderPlaced, (event) => {
  console.log(`Order ${event.orderId}: $${event.total}`);
});

// Publish events
bus.post(new UserLoggedIn('123', 'alice@example.com'));
bus.post(new OrderPlaced('ORD-456', 99.99));
```

### React Integration

```typescript
import { EventBusProvider, useEventSubscription, useEventPost } from 'lever-ui-eventbus/react';

function App() {
  const bus = new EventBus();
  
  return (
    <EventBusProvider bus={bus}>
      <UserComponent />
      <OrderComponent />
    </EventBusProvider>
  );
}

function UserComponent() {
  const [user, setUser] = useState(null);
  const postEvent = useEventPost();

  useEventSubscription(UserLoggedIn, (event) => {
    setUser({ id: event.userId, email: event.email });
  });

  const handleLogin = () => {
    postEvent(new UserLoggedIn('123', 'alice@example.com'));
  };

  return (
    <div>
      {user ? `Welcome ${user.email}` : 'Not logged in'}
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
```

## Core Concepts

### Event Classes

Events are simple TypeScript classes. Use classes instead of plain objects for better type safety and polymorphic dispatch:

```typescript
class UserEvent {
  constructor(public userId: string, public timestamp = Date.now()) {}
}

class UserLoggedIn extends UserEvent {
  constructor(userId: string, public email: string) {
    super(userId);
  }
}

class UserLoggedOut extends UserEvent {
  constructor(userId: string, public reason: string) {
    super(userId);
  }
}
```

### Polymorphic Dispatch

Base classes automatically receive events from derived classes:

```typescript
// Base handler receives ALL user events
bus.subscribe(UserEvent, (event) => {
  console.log(`User ${event.userId} event at ${event.timestamp}`);
});

// Specific handlers for specialized behavior
bus.subscribe(UserLoggedIn, (event) => {
  console.log(`${event.email} logged in`);
});

// This triggers BOTH UserEvent and UserLoggedIn handlers
bus.post(new UserLoggedIn('123', 'alice@example.com'));
```

### Async Event Bus

For non-blocking event delivery:

```typescript
import { AsyncEventBus } from 'lever-ui-eventbus';

// Use default microtask executor
const asyncBus = new AsyncEventBus();

// Or provide custom executor
const customBus = new AsyncEventBus((task) => {
  setTimeout(task, 0); // Next tick delivery
});

asyncBus.subscribe(UserLoggedIn, (event) => {
  // This runs asynchronously
  performExpensiveOperation(event);
});

// Post and continue immediately
asyncBus.post(new UserLoggedIn('123', 'alice@example.com'));
console.log('This logs before the handler executes!');
```

### Error Handling

Handle subscriber errors gracefully:

```typescript
import { DeadEvent } from 'lever-ui-eventbus';

const errorHandler = (error, context) => {
  console.error(`Handler failed for ${context.eventType.name}:`, error.message);
  // Send to error reporting service
};

const robustBus = new EventBus(errorHandler);

// Handle undelivered events
bus.subscribe(DeadEvent, (deadEvent) => {
  console.warn('Unhandled event:', deadEvent.event);
});
```

## React Hooks

Import React hooks and components from the `/react` subpath:

```typescript
import { 
  EventBusProvider,
  useEventBus,
  useEventSubscription,
  useEventPost,
  useEventState,
  useLatestEvent,
  useEventCollection,
  useEventBusManager
} from 'lever-ui-eventbus/react';
```

### Available Hooks

| Hook | Description |
|------|-------------|
| `useEventSubscription` | Subscribe to events with automatic cleanup |
| `useEventPost` | Get a stable function to post events |
| `useEventState` | Maintain reactive state based on events |
| `useLatestEvent` | Track the most recent event of a type |
| `useEventCollection` | Collect events into an array with size limit |
| `useEventBusManager` | Access bus management utilities |

### Hook Examples

```typescript
// Reactive state based on events
function UserProfile() {
  const user = useEventState(
    UserUpdated,
    null,
    (currentUser, event) => event.user
  );
  
  return <div>{user?.name || 'Loading...'}</div>;
}

// Collect recent notifications
function NotificationList() {
  const notifications = useEventCollection(NotificationShown, 5);
  
  return (
    <ul>
      {notifications.map((notif, i) => (
        <li key={i}>{notif.message}</li>
      ))}
    </ul>
  );
}

// Debug panel
function DebugPanel() {
  const { subscriptionCount, activeTypes, clear } = useEventBusManager();
  
  return (
    <div>
      <p>Active types: {activeTypes.length}</p>
      <p>Subscriptions: {subscriptionCount}</p>
      <button onClick={clear}>Clear All</button>
    </div>
  );
}
```

## Interactive Demo

Try the **[Interactive Demo](./demo)** to see the event bus in action with:

- **Event Publishers** - Login, shopping cart, orders, errors
- **Live Subscribers** - Real-time UI updates  
- **Event Log** - Watch events flow through the system
- **Code Examples** - Learn different patterns and use cases

```bash
# Run the demo locally
npm run demo
npx http-server demo -p 8000
# Open http://localhost:8000
```

## API Reference

### EventBus

```typescript
class EventBus {
  constructor(errorHandler?: ErrorHandler)
  
  // Core methods
  subscribe<T>(eventType: Constructor<T>, handler: (event: T) => void): Subscription
  post<T>(event: T): number
  
  // Management methods
  unsubscribeAll(eventType: Constructor): number
  clear(): void
  getSubscriptionCount(eventType: Constructor): number
  getActiveEventTypes(): Constructor[]
}
```

### AsyncEventBus

```typescript
class AsyncEventBus extends EventBus {
  constructor(executor?: (task: () => void) => void, errorHandler?: ErrorHandler)
}
```

### Subscription

```typescript
interface Subscription {
  unsubscribe(): void
}
```

### DeadEvent

```typescript
class DeadEvent<T = any> {
  constructor(public event: T, public reason: string)
}
```

## Architecture

The event bus uses a **type-based subscription system** where:

1. **Events are classes** - Better type safety than string-based systems
2. **Polymorphic dispatch** - Base classes receive derived events automatically  
3. **Weak references** - Prevents memory leaks with automatic cleanup
4. **Error isolation** - Failed handlers don't break other subscribers
5. **Dead events** - Undelivered events are captured for debugging

## Use Cases

**Perfect for:**
- Component communication in React/Vue applications
- Decoupling modules in large applications  
- Event-driven architectures
- State management patterns
- Real-time UI updates
- Analytics and telemetry
- Notification systems

**Consider alternatives for:**
- High-frequency events (>1000/sec) - use specialized solutions
- Cross-process communication - use message queues
- Persistent event streams - use event sourcing libraries

## Bundle Size

| Package | Size (gzipped) |
|---------|----------------|
| Core EventBus | ~3 KB |
| React Integration | ~5 KB |
| **Total** | **~8 KB** |

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode  
npm run test:watch

# Build library
npm run build

# Run demo
npm run demo

# Lint code
npm run lint
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by EventBus patterns from Android development
- Built with modern TypeScript and React best practices
- Designed for performance and developer experience

---

**Pro Tip**: Use your browser's developer tools to explore the EventBus instance in the [demo](./demo) (`window.demoBus`) for hands-on learning!

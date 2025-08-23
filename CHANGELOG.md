# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2024-08-23

### Added
- **Core EventBus** - Type-safe event subscription and publishing
  - `EventBus.subscribe<T>(eventType, handler)` - Subscribe to events by class
  - `EventBus.post<T>(event)` - Publish events to subscribers
  - `EventBus.unsubscribeAll(eventType)` - Remove all handlers for a type
  - `EventBus.clear()` - Clear all subscriptions
  - `EventBus.getSubscriptionCount(eventType)` - Get handler count
  - `EventBus.getActiveEventTypes()` - List all active event types

- **AsyncEventBus** - Non-blocking event delivery
  - Custom executor support (default: `queueMicrotask`)
  - Asynchronous handler execution
  - All EventBus features with async delivery

- **Polymorphic Dispatch** - Base classes receive derived events
  - Automatic inheritance-based event routing
  - Type-safe polymorphic subscriptions
  - WeakMap-based type resolution with caching

- **Dead Event Handling** - Capture undelivered events
  - `DeadEvent<T>` class for unhandled events
  - Automatic dead event publishing
  - Prevents feedback loops

- **Error Handling** - Robust error management
  - Custom error handlers for failed subscribers
  - Error isolation - failed handlers don't break others
  - Detailed error context with event type information

- **React Integration** - Complete React hooks and context
  - `EventBusProvider` - Context provider component
  - `useEventBus()` - Access event bus from context
  - `useEventSubscription()` - Subscribe with automatic cleanup
  - `useEventPost()` - Get stable event posting function
  - `useEventState()` - Reactive state based on events
  - `useLatestEvent()` - Track most recent event
  - `useEventCollection()` - Collect events with size limit
  - `useEventBusManager()` - Bus management utilities

- **Build System** - Production-ready build pipeline
  - ESM and CJS dual exports
  - TypeScript declarations (.d.ts)
  - Subpath exports for React integration (`/react`)
  - Tree-shakeable modules
  - Zero dependencies core

- **Interactive Demo** - Comprehensive demonstration
  - Live event publishers and subscribers
  - Real-time event log with filtering
  - Interactive code examples
  - Modern glassmorphism UI design
  - Complete React integration showcase

- **Testing** - Comprehensive test suite
  - 57 tests with 100% core coverage
  - React integration tests with @testing-library/react
  - Integration tests for all features
  - Vitest with jsdom environment

- **Documentation** - Complete documentation suite
  - Comprehensive README with examples
  - Interactive demo with documentation
  - TypeScript type definitions
  - JSDoc comments throughout codebase

### Technical Details
- **Bundle Size**: ~8KB total (3KB core + 5KB React)
- **TypeScript**: Full type safety with generics
- **Dependencies**: Zero runtime dependencies
- **Compatibility**: Node.js, browsers, React Native
- **React Support**: React 16.8+ (hooks required)

### Internal
- WeakMap-based type caching for performance
- Subscription management with automatic cleanup
- Production build pipeline with type generation
- ESLint configuration for TypeScript and React
- Coverage thresholds with per-file requirements
- Automated React type definition generation

[Unreleased]: https://github.com/nuanced-labs/lever-ui-eventbus/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/nuanced-labs/lever-ui-eventbus/releases/tag/v0.1.0
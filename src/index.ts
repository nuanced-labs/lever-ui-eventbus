// Re-export everything for backward compatibility
export * from './types';
export * from './dead-event';
export * from './event-bus';
export * from './async-event-bus';

// Re-export utilities for advanced usage
export { defaultExceptionHandler } from './utils/exception-handler';
export { TypeResolver } from './utils/type-resolver';

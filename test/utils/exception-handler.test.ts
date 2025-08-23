import { describe, it, expect, vi } from 'vitest';
import { defaultExceptionHandler } from '../../src/utils/exception-handler';
import type { SubscriberExceptionContext } from '../../src/types';

describe('defaultExceptionHandler', () => {
  it('logs error to console with event type name', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    class TestEvent { constructor(public id: string) {} }
    const error = new Error('Test error');
    const context: SubscriberExceptionContext = {
      event: { id: 'test' },
      eventType: TestEvent,
      handler: vi.fn(),
      eventBus: {} as any,
    };
    
    defaultExceptionHandler(error, context);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      '[EventBus] Error delivering TestEvent:',
      error
    );
    
    consoleSpy.mockRestore();
  });

  it('handles error without message', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    class AnotherEvent {}
    const error = 'String error';
    const context: SubscriberExceptionContext = {
      event: {},
      eventType: AnotherEvent,
      handler: vi.fn(),
      eventBus: {} as any,
    };
    
    defaultExceptionHandler(error, context);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      '[EventBus] Error delivering AnotherEvent:',
      'String error'
    );
    
    consoleSpy.mockRestore();
  });

  it('works with null/undefined errors', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    class NullEvent {}
    const context: SubscriberExceptionContext = {
      event: {},
      eventType: NullEvent,
      handler: vi.fn(),
      eventBus: {} as any,
    };
    
    defaultExceptionHandler(null, context);
    defaultExceptionHandler(undefined, context);
    
    expect(consoleSpy).toHaveBeenCalledTimes(2);
    expect(consoleSpy).toHaveBeenNthCalledWith(1, '[EventBus] Error delivering NullEvent:', null);
    expect(consoleSpy).toHaveBeenNthCalledWith(2, '[EventBus] Error delivering NullEvent:', undefined);
    
    consoleSpy.mockRestore();
  });
});
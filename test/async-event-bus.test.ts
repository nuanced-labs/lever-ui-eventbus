import { describe, it, expect, vi } from 'vitest';
import { AsyncEventBus } from '../src';

class Base { constructor(public id: string) {} }

describe('AsyncEventBus', () => {
  it('delivers asynchronously via executor', async () => {
    const calls: string[] = [];
    const bus = new AsyncEventBus((t) => setTimeout(t, 0));
    bus.subscribe(Base, (e) => calls.push(e.id));
    bus.post(new Base('C'));
    expect(calls).toEqual([]); // not yet
    await new Promise((r) => setTimeout(r, 5));
    expect(calls).toEqual(['C']);
  });

  it('handles async exceptions with custom handler', async () => {
    const errorHandler = vi.fn();
    const asyncBus = new AsyncEventBus((t) => setTimeout(t, 0), errorHandler);
    
    asyncBus.subscribe(Base, () => {
      throw new Error('Async handler error');
    });
    
    asyncBus.post(new Base('async-error'));
    
    await new Promise((r) => setTimeout(r, 5));
    
    expect(errorHandler).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        event: expect.objectContaining({ id: 'async-error' })
      })
    );
  });

  it('uses queueMicrotask by default', async () => {
    const calls: string[] = [];
    const bus = new AsyncEventBus(); // default executor
    
    bus.subscribe(Base, (e) => calls.push(e.id));
    bus.post(new Base('microtask'));
    
    expect(calls).toEqual([]);
    await Promise.resolve(); // wait for microtask
    expect(calls).toEqual(['microtask']);
  });

  it('allows custom executor function', async () => {
    const customQueue: Array<() => void> = [];
    const customExecutor = (task: () => void) => {
      customQueue.push(task);
    };
    
    const bus = new AsyncEventBus(customExecutor);
    const handler = vi.fn();
    
    bus.subscribe(Base, handler);
    bus.post(new Base('custom'));
    
    // Handler shouldn't be called yet
    expect(handler).not.toHaveBeenCalled();
    expect(customQueue).toHaveLength(1);
    
    // Execute the queued task
    customQueue[0]();
    
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ id: 'custom' }));
  });

  it('maintains all EventBus functionality asynchronously', async () => {
    const bus = new AsyncEventBus((t) => setTimeout(t, 1));
    const baseHandler = vi.fn();
    const subHandler = vi.fn();
    
    class Sub extends Base {}
    
    bus.subscribe(Base, baseHandler);
    bus.subscribe(Sub, subHandler);
    
    // Test polymorphic dispatch
    bus.post(new Sub('poly'));
    
    await new Promise((r) => setTimeout(r, 5));
    
    expect(baseHandler).toHaveBeenCalledWith(expect.objectContaining({ id: 'poly' }));
    expect(subHandler).toHaveBeenCalledWith(expect.objectContaining({ id: 'poly' }));
  });

  it('inherits subscription management from EventBus', () => {
    const bus = new AsyncEventBus();
    
    // Should have all the same methods as EventBus
    expect(typeof bus.subscribe).toBe('function');
    expect(typeof bus.unsubscribeAll).toBe('function');
    expect(typeof bus.getSubscriptionCount).toBe('function');
    expect(typeof bus.getActiveEventTypes).toBe('function');
    expect(typeof bus.clear).toBe('function');
    expect(typeof bus.post).toBe('function');
    
    // Test that they work
    const sub = bus.subscribe(Base, vi.fn());
    expect(bus.getSubscriptionCount(Base)).toBe(1);
    
    sub.unsubscribe();
    expect(bus.getSubscriptionCount(Base)).toBe(0);
  });

  it('respects custom exception handler from constructor', async () => {
    const customHandler = vi.fn();
    const bus = new AsyncEventBus((t) => setTimeout(t, 0), customHandler);
    
    bus.subscribe(Base, () => {
      throw new Error('Custom handler test');
    });
    
    bus.post(new Base('test'));
    
    await new Promise((r) => setTimeout(r, 5));
    
    expect(customHandler).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        event: expect.objectContaining({ id: 'test' })
      })
    );
  });
});
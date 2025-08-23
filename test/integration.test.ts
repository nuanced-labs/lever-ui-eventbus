import { describe, it, expect, vi } from 'vitest';
import { EventBus, AsyncEventBus, DeadEvent } from '../src';

class OrderPlaced { constructor(public id: string) {} }
class SpecialOrderPlaced extends OrderPlaced { 
  constructor(id: string, public vip: boolean) { 
    super(id); 
  } 
}

describe('Integration Tests', () => {
  it('demonstrates complete event bus workflow', () => {
    const bus = new EventBus();
    const orderHandler = vi.fn();
    const specialHandler = vi.fn();
    const deadEventHandler = vi.fn();
    
    // Subscribe to different event types
    bus.subscribe(OrderPlaced, orderHandler);
    bus.subscribe(SpecialOrderPlaced, specialHandler);
    bus.subscribe(DeadEvent, deadEventHandler);
    
    // Regular order - should trigger orderHandler only
    bus.post(new OrderPlaced('A-123'));
    expect(orderHandler).toHaveBeenCalledTimes(1);
    expect(specialHandler).toHaveBeenCalledTimes(0);
    
    // Special order - should trigger both handlers (polymorphic)
    bus.post(new SpecialOrderPlaced('B-999', true));
    expect(orderHandler).toHaveBeenCalledTimes(2);
    expect(specialHandler).toHaveBeenCalledTimes(1);
    
    // Unhandled event - should trigger dead event
    bus.post({ unknown: 'event' } as any);
    expect(deadEventHandler).toHaveBeenCalledTimes(1);
  });

  it('demonstrates async vs sync behavior', async () => {
    const syncResults: string[] = [];
    const asyncResults: string[] = [];
    
    const syncBus = new EventBus();
    const asyncBus = new AsyncEventBus((t) => setTimeout(t, 0));
    
    syncBus.subscribe(OrderPlaced, (e) => {
      syncResults.push(`sync-${e.id}`);
    });
    
    asyncBus.subscribe(OrderPlaced, (e) => {
      asyncResults.push(`async-${e.id}`);
    });
    
    // Post to both buses
    syncBus.post(new OrderPlaced('sync-test'));
    asyncBus.post(new OrderPlaced('async-test'));
    
    // Sync should be immediate
    expect(syncResults).toEqual(['sync-sync-test']);
    expect(asyncResults).toEqual([]); // Not yet
    
    // Wait for async
    await new Promise((r) => setTimeout(r, 5));
    expect(asyncResults).toEqual(['async-async-test']);
  });

  it('handles complex subscription management', () => {
    const bus = new EventBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const handler3 = vi.fn();
    
    // Multiple subscriptions
    const sub1 = bus.subscribe(OrderPlaced, handler1);
    const sub2 = bus.subscribe(OrderPlaced, handler2);
    const sub3 = bus.subscribe(SpecialOrderPlaced, handler3);
    
    expect(bus.getSubscriptionCount(OrderPlaced)).toBe(2);
    expect(bus.getSubscriptionCount(SpecialOrderPlaced)).toBe(1);
    expect(bus.getActiveEventTypes()).toHaveLength(2);
    
    // Selective unsubscription
    sub1.unsubscribe();
    expect(bus.getSubscriptionCount(OrderPlaced)).toBe(1);
    
    // Test remaining handlers work
    bus.post(new SpecialOrderPlaced('test', true));
    expect(handler1).not.toHaveBeenCalled(); // unsubscribed
    expect(handler2).toHaveBeenCalledTimes(1); // polymorphic
    expect(handler3).toHaveBeenCalledTimes(1); // direct
    
    // Clear all
    const totalCleared = bus.clear();
    expect(totalCleared).toBe(2); // handler2 + handler3
    expect(bus.getActiveEventTypes()).toHaveLength(0);
  });

  it('demonstrates error handling and resilience', () => {
    const errorHandler = vi.fn();
    const bus = new EventBus(errorHandler);
    
    const workingHandler = vi.fn();
    const failingHandler = vi.fn().mockImplementation(() => {
      throw new Error('Handler failed');
    });
    
    bus.subscribe(OrderPlaced, workingHandler);
    bus.subscribe(OrderPlaced, failingHandler);
    
    const deliveredCount = bus.post(new OrderPlaced('error-test'));
    
    // Both handlers should be attempted
    expect(deliveredCount).toBe(2);
    expect(workingHandler).toHaveBeenCalled();
    expect(failingHandler).toHaveBeenCalled();
    expect(errorHandler).toHaveBeenCalledTimes(1);
    
    // Bus should continue working after error
    bus.post(new OrderPlaced('recovery-test'));
    expect(workingHandler).toHaveBeenCalledTimes(2);
  });

  it('handles edge cases gracefully', () => {
    const bus = new EventBus();
    const catchAllHandler = vi.fn();
    const deadEventHandler = vi.fn();
    
    bus.subscribe(Object as any, catchAllHandler);
    bus.subscribe(DeadEvent, deadEventHandler);
    
    // Various event types
    bus.post(new OrderPlaced('normal'));
    bus.post({ plain: 'object' });
    bus.post('string event' as any);
    bus.post(null as any);
    bus.post(undefined as any);
    
    // Object handler should catch the valid objects (OrderPlaced, plain object, and the DeadEvent for string)
    expect(catchAllHandler).toHaveBeenCalledTimes(3);
    
    // DeadEvent should be triggered once for the string event (which gets caught by the catch-all handler)
    expect(deadEventHandler).toHaveBeenCalledTimes(1);
    expect(deadEventHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'string event'
      })
    );
  });
});
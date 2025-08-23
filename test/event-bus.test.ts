import { describe, it, expect, vi } from 'vitest';
import { EventBus, DeadEvent } from '../src';

class Base { constructor(public id: string) {} }
class Sub extends Base { constructor(id: string) { super(id); } }
class UnhandledEvent { constructor(public data: string) {} }

describe('EventBus', () => {
  it('delivers to subscribed handlers', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.subscribe(Base, handler);
    bus.post(new Base('A'));
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ id: 'A' }));
  });

  it('supports polymorphic dispatch', () => {
    const bus = new EventBus();
    const baseHandler = vi.fn();
    const subHandler = vi.fn();
    
    bus.subscribe(Base, baseHandler);
    bus.subscribe(Sub, subHandler);
    
    bus.post(new Sub('poly'));
    
    // Both handlers should be called for Sub event
    expect(baseHandler).toHaveBeenCalledWith(expect.objectContaining({ id: 'poly' }));
    expect(subHandler).toHaveBeenCalledWith(expect.objectContaining({ id: 'poly' }));
    
    bus.post(new Base('base-only'));
    
    // Only base handler should be called for Base event
    expect(baseHandler).toHaveBeenCalledTimes(2);
    expect(subHandler).toHaveBeenCalledTimes(1);
  });

  it('emits DeadEvent when unhandled', () => {
    const bus = new EventBus();
    const spy = vi.fn();
    bus.subscribe(DeadEvent, spy);
    bus.post({ any: 'thing' } as any);
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        source: bus,
        event: { any: 'thing' }
      })
    );
  });

  it('removes all handlers with unsubscribeAll and returns count', () => {
    const bus = new EventBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    
    bus.subscribe(Base, handler1);
    bus.subscribe(Base, handler2);
    
    bus.post(new Base('before-unsub'));
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
    
    const removed = bus.unsubscribeAll(Base);
    expect(removed).toBe(2);
    
    bus.post(new Base('after-unsub'));
    expect(handler1).toHaveBeenCalledTimes(1); // no additional calls
    expect(handler2).toHaveBeenCalledTimes(1); // no additional calls
    
    // Unsubscribing from empty type returns 0
    expect(bus.unsubscribeAll(Base)).toBe(0);
  });

  it('handles multiple subscriptions to same handler', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    
    const sub1 = bus.subscribe(Base, handler);
    const sub2 = bus.subscribe(Base, handler);
    
    bus.post(new Base('multi-sub'));
    expect(handler).toHaveBeenCalledTimes(2); // called once per subscription
    
    sub1.unsubscribe();
    bus.post(new Base('after-one-unsub'));
    expect(handler).toHaveBeenCalledTimes(3); // called once more
    
    sub2.unsubscribe();
    bus.post(new Base('after-all-unsub'));
    expect(handler).toHaveBeenCalledTimes(3); // no additional calls
  });

  describe('Edge Cases', () => {
    it('handles null/undefined events gracefully', () => {
      const bus = new EventBus();
      const spy = vi.fn();
      bus.subscribe(DeadEvent, spy);
      
      const result1 = bus.post(null as any);
      const result2 = bus.post(undefined as any);
      
      expect(result1).toBe(0);
      expect(result2).toBe(0);
      expect(spy).not.toHaveBeenCalled();
    });

    it('handles subscriber exceptions with custom handler', () => {
      const errorHandler = vi.fn();
      const bus = new EventBus(errorHandler);
      
      bus.subscribe(Base, () => {
        throw new Error('Handler error');
      });
      
      bus.post(new Base('error-test'));
      
      expect(errorHandler).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          event: expect.objectContaining({ id: 'error-test' }),
          eventType: Base,
          handler: expect.any(Function),
          eventBus: bus
        })
      );
    });

    it('continues delivering to other handlers after one throws', () => {
      const errorHandler = vi.fn();
      const bus = new EventBus(errorHandler);
      const successfulHandler = vi.fn();
      
      bus.subscribe(Base, () => { throw new Error('fail'); });
      bus.subscribe(Base, successfulHandler);
      
      bus.post(new Base('test'));
      
      expect(errorHandler).toHaveBeenCalled();
      expect(successfulHandler).toHaveBeenCalledWith(expect.objectContaining({ id: 'test' }));
    });

    it('supports catch-all handlers via Object subscription', () => {
      const bus = new EventBus();
      const catchAll = vi.fn();
      
      bus.subscribe(Object as any, catchAll);
      
      bus.post(new Base('test1'));
      bus.post({ custom: 'event' });
      
      expect(catchAll).toHaveBeenCalledTimes(2);
    });

    it('properly cleans up empty handler sets', () => {
      const bus = new EventBus();
      const sub1 = bus.subscribe(Base, vi.fn());
      const sub2 = bus.subscribe(Base, vi.fn());
      
      sub1.unsubscribe();
      expect((bus as any).registry.has(Base)).toBe(true);
      
      sub2.unsubscribe();
      expect((bus as any).registry.has(Base)).toBe(false);
    });

    it('handles unsubscribing already unsubscribed handlers', () => {
      const bus = new EventBus();
      const sub = bus.subscribe(Base, vi.fn());
      
      sub.unsubscribe();
      expect(() => sub.unsubscribe()).not.toThrow();
    });

    it('does not emit DeadEvent for DeadEvent to avoid loops', () => {
      const bus = new EventBus();
      const deadEventHandler = vi.fn();
      
      bus.subscribe(DeadEvent, deadEventHandler);
      bus.post(new UnhandledEvent('test'));
      
      expect(deadEventHandler).toHaveBeenCalledOnce();
      const deadEvent = deadEventHandler.mock.calls[0][0];
      expect(deadEvent.event).toBeInstanceOf(UnhandledEvent);
    });
  });

  describe('Management Utilities', () => {
    it('tracks subscription counts accurately', () => {
      const bus = new EventBus();
      
      expect(bus.getSubscriptionCount(Base)).toBe(0);
      
      const sub1 = bus.subscribe(Base, vi.fn());
      expect(bus.getSubscriptionCount(Base)).toBe(1);
      
      const sub2 = bus.subscribe(Base, vi.fn());
      expect(bus.getSubscriptionCount(Base)).toBe(2);
      
      sub1.unsubscribe();
      expect(bus.getSubscriptionCount(Base)).toBe(1);
      
      sub2.unsubscribe();
      expect(bus.getSubscriptionCount(Base)).toBe(0);
    });

    it('lists active event types', () => {
      const bus = new EventBus();
      
      expect(bus.getActiveEventTypes()).toEqual([]);
      
      const sub1 = bus.subscribe(Base, vi.fn());
      expect(bus.getActiveEventTypes()).toEqual([Base]);
      
      const sub2 = bus.subscribe(Sub, vi.fn());
      expect(bus.getActiveEventTypes()).toContain(Base);
      expect(bus.getActiveEventTypes()).toContain(Sub);
      expect(bus.getActiveEventTypes()).toHaveLength(2);
      
      sub1.unsubscribe();
      sub2.unsubscribe();
      expect(bus.getActiveEventTypes()).toEqual([]);
    });

    it('clears all subscriptions', () => {
      const bus = new EventBus();
      
      bus.subscribe(Base, vi.fn());
      bus.subscribe(Base, vi.fn());
      bus.subscribe(Sub, vi.fn());
      
      const totalCleared = bus.clear();
      expect(totalCleared).toBe(3);
      
      expect(bus.getSubscriptionCount(Base)).toBe(0);
      expect(bus.getSubscriptionCount(Sub)).toBe(0);
      expect(bus.getActiveEventTypes()).toEqual([]);
      
      // Clearing empty bus returns 0
      expect(bus.clear()).toBe(0);
    });

    it('post returns delivery count', () => {
      const bus = new EventBus();
      const deadEventHandler = vi.fn();
      
      bus.subscribe(DeadEvent, deadEventHandler);
      
      // No handlers for Base - should return 0 and trigger DeadEvent
      const result1 = bus.post(new Base('unhandled'));
      expect(result1).toBe(0);
      expect(deadEventHandler).toHaveBeenCalledTimes(1);
      
      // Add handlers and test delivery count
      bus.subscribe(Base, vi.fn());
      bus.subscribe(Base, vi.fn());
      
      const result2 = bus.post(new Base('handled'));
      expect(result2).toBe(2);
      
      // Polymorphic dispatch should count all handlers
      bus.subscribe(Sub, vi.fn());
      const result3 = bus.post(new Sub('poly'));
      expect(result3).toBe(3); // 2 Base handlers + 1 Sub handler
    });
  });
});
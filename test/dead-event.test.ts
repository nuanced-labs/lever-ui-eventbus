import { describe, it, expect } from 'vitest';
import { DeadEvent } from '../src/dead-event';

describe('DeadEvent', () => {
  it('creates DeadEvent with source and event', () => {
    const mockBus = { name: 'test-bus' };
    const originalEvent = { type: 'test', data: 'example' };
    
    const deadEvent = new DeadEvent(mockBus, originalEvent);
    
    expect(deadEvent.source).toBe(mockBus);
    expect(deadEvent.event).toBe(originalEvent);
  });

  it('handles null event', () => {
    const mockBus = { name: 'test-bus' };
    
    const deadEvent = new DeadEvent(mockBus, null);
    
    expect(deadEvent.source).toBe(mockBus);
    expect(deadEvent.event).toBe(null);
  });

  it('handles undefined event', () => {
    const mockBus = { name: 'test-bus' };
    
    const deadEvent = new DeadEvent(mockBus, undefined);
    
    expect(deadEvent.source).toBe(mockBus);
    expect(deadEvent.event).toBe(undefined);
  });

  it('preserves event object references', () => {
    const mockBus = { name: 'test-bus' };
    const originalEvent = { nested: { data: 'test' } };
    
    const deadEvent = new DeadEvent(mockBus, originalEvent);
    
    expect(deadEvent.event).toBe(originalEvent);
    expect((deadEvent.event as any).nested).toBe(originalEvent.nested);
  });

  it('works with primitive values as events', () => {
    const mockBus = { name: 'test-bus' };
    
    const stringDead = new DeadEvent(mockBus, 'string event');
    const numberDead = new DeadEvent(mockBus, 42);
    const booleanDead = new DeadEvent(mockBus, true);
    
    expect(stringDead.event).toBe('string event');
    expect(numberDead.event).toBe(42);
    expect(booleanDead.event).toBe(true);
  });
});
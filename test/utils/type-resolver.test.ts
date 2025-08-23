import { describe, it, expect, beforeEach } from 'vitest';
import { TypeResolver } from '../../src/utils/type-resolver';

class BaseClass {
  constructor(public id: string) {}
}

class ChildClass extends BaseClass {
  constructor(id: string, public extra: string) {
    super(id);
  }
}

class GrandChildClass extends ChildClass {
  constructor(id: string, extra: string, public more: number) {
    super(id, extra);
  }
}

describe('TypeResolver', () => {
  let resolver: TypeResolver;

  beforeEach(() => {
    resolver = new TypeResolver();
  });

  it('resolves single class type', () => {
    const event = new BaseClass('test');
    const types = resolver.getTypesFor(event, false);
    
    expect(types).toEqual([BaseClass]);
  });

  it('resolves inheritance chain', () => {
    const event = new GrandChildClass('test', 'extra', 42);
    const types = resolver.getTypesFor(event, false);
    
    expect(types).toEqual([GrandChildClass, ChildClass, BaseClass]);
  });

  it('includes Object when hasObjectHandler is true', () => {
    const event = new BaseClass('test');
    const types = resolver.getTypesFor(event, true);
    
    expect(types).toEqual([BaseClass, Object]);
  });

  it('excludes Object when hasObjectHandler is false', () => {
    const event = new BaseClass('test');
    const types = resolver.getTypesFor(event, false);
    
    expect(types).toEqual([BaseClass]);
  });

  it('caches results for performance', () => {
    const event = new ChildClass('test', 'extra');
    
    const types1 = resolver.getTypesFor(event, false);
    const types2 = resolver.getTypesFor(event, false);
    
    expect(types1).toBe(types2); // Same reference due to caching
    expect(types1).toEqual([ChildClass, BaseClass]);
  });

  it('handles cache with different hasObjectHandler values', () => {
    const event = new BaseClass('test');
    
    const typesWithoutObject = resolver.getTypesFor(event, false);
    const typesWithObject = resolver.getTypesFor(event, true);
    
    expect(typesWithoutObject).toEqual([BaseClass]);
    expect(typesWithObject).toEqual([BaseClass, Object]);
  });

  it('returns empty array for null/undefined events', () => {
    expect(resolver.getTypesFor(null, false)).toEqual([]);
    expect(resolver.getTypesFor(undefined, false)).toEqual([]);
  });

  it('returns empty array for non-object events', () => {
    expect(resolver.getTypesFor('string', false)).toEqual([]);
    expect(resolver.getTypesFor(42, false)).toEqual([]);
    expect(resolver.getTypesFor(true, false)).toEqual([]);
  });

  it('handles plain objects', () => {
    const plainObject = { data: 'test' };
    const types = resolver.getTypesFor(plainObject, false);
    
    expect(types).toEqual([]);
  });

  it('clears cache correctly', () => {
    const event = new BaseClass('test');
    
    // Populate cache
    resolver.getTypesFor(event, false);
    
    // Clear cache
    resolver.clearCache();
    
    // Should work normally after clear
    const types = resolver.getTypesFor(event, true);
    expect(types).toEqual([BaseClass, Object]);
  });

  it('handles events without constructor', () => {
    const objectWithoutConstructor = Object.create(null);
    const types = resolver.getTypesFor(objectWithoutConstructor, false);
    
    expect(types).toEqual([]);
  });
});
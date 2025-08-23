import type { Constructor } from '../types';

/**
 * Resolves the prototype chain for an event to determine all applicable types.
 * Uses WeakMap caching for performance optimization.
 * @internal
 */
export class TypeResolver {
  private typeCache = new WeakMap<object, Constructor[]>();

  /**
   * Get all constructor types in the prototype chain for an event.
   * Results are cached for performance.
   */
  getTypesFor(event: unknown, hasObjectHandler: boolean): Constructor[] {
    if (!event || typeof event !== 'object') return [];
    
    // Check cache first
    const cached = this.typeCache.get(event);
    if (cached) {
      return hasObjectHandler && !cached.includes(Object as Constructor)
        ? [...cached, Object as Constructor]
        : cached;
    }
    
    const out: Constructor[] = [];
    let ctor: Constructor | null = (event as { constructor?: Constructor })?.constructor ?? null;
    while (ctor && ctor !== Object) {
      out.push(ctor);
      const proto = Object.getPrototypeOf(ctor.prototype);
      ctor = proto?.constructor ?? null;
    }
    
    if (hasObjectHandler) {
      out.push(Object as Constructor);
    }
    
    // Cache the result
    this.typeCache.set(event, out);
    return out;
  }

  /**
   * Clear the type cache (useful when clearing the event bus).
   */
  clearCache(): void {
    this.typeCache = new WeakMap();
  }
}
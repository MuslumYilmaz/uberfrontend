export const HARDENED_PROTOTYPE_CTORS: readonly unknown[] = [
  Object,
  Map,
  Set,
  Date,
  RegExp,
  Error,
  Math,
  JSON,
  Promise,
  URL,
  URLSearchParams,
];

/**
 * Freezes the prototypes of the given constructors so user code cannot change built-ins the tests rely on.
 * A frozen prototype also makes every property it holds read-only on the objects that inherit it, so ordinary
 * code such as `err.name = 'AbortError'`, `this.name = 'TimeoutError'` in an Error subclass or
 * `obj.toString = fn` would throw. Each writable data property therefore becomes an accessor first: it reads the
 * original value, and an assignment through any other object defines the property on that object, as it would
 * without the freeze. Assigning on the prototype itself still throws.
 */
export function freezeHardenedPrototypes(
  constructors: readonly unknown[] = HARDENED_PROTOTYPE_CTORS,
): void {
  constructors.forEach((ctor) => {
    try {
      const prototype = (ctor as { prototype?: object } | null | undefined)?.prototype;
      if (!prototype) return;
      try {
        allowOverridesOnInheritors(prototype);
      } finally {
        Object.freeze(prototype);
      }
    } catch { }
  });
}

function allowOverridesOnInheritors(prototype: object): void {
  for (const key of Reflect.ownKeys(prototype)) {
    const descriptor = Object.getOwnPropertyDescriptor(prototype, key);
    if (!descriptor || !('value' in descriptor) || !descriptor.writable || !descriptor.configurable) continue;
    const value: unknown = descriptor.value;
    Object.defineProperty(prototype, key, {
      get() {
        return value;
      },
      set(this: object, next: unknown) {
        if (this === prototype) {
          throw new TypeError(`Cannot assign to read only property '${String(key)}' of a built-in prototype`);
        }
        Object.defineProperty(this, key, { value: next, writable: true, enumerable: true, configurable: true });
      },
      enumerable: descriptor.enumerable,
      configurable: true,
    });
  }
}

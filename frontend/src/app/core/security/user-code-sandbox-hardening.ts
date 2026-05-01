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

export function freezeHardenedPrototypes(
  constructors: readonly unknown[] = HARDENED_PROTOTYPE_CTORS,
): void {
  constructors.forEach((ctor) => {
    try {
      const prototype = (ctor as { prototype?: object } | null | undefined)?.prototype;
      if (prototype) Object.freeze(prototype);
    } catch { }
  });
}

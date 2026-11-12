// Wrong: first-draft recursion. Object.is for primitives, no Date/RegExp branch, no length or key-count checks.
// Fails: treats different types as unequal
// Fails: requires the same set of keys
export default function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  for (const key of Object.keys(a)) {
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

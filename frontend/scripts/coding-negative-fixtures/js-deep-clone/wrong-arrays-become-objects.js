// Wrong: forgets Array.isArray, so every array is cloned into a plain object with "0", "1" keys.
// Fails: clones arrays correctly
export default function deepClone(value) {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return new Date(value.getTime());
  if (value instanceof RegExp) return new RegExp(value.source, value.flags);
  const out = {};
  for (const key of Object.keys(value)) out[key] = deepClone(value[key]);
  return out;
}

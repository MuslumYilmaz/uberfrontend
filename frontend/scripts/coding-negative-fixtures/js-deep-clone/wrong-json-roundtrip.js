// Wrong: JSON round-trip (Dates become strings, RegExps become {}).
// Fails: clones Date and RegExp instances
export default function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

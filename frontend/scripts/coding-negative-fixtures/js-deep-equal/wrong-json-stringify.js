// Wrong: the JSON.stringify one-liner (NaN equals null, every RegExp equals every other RegExp).
// Fails: requires the same set of keys
// Fails: compares NaN, -0 and RegExp details
export default function deepEqual(a, b) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

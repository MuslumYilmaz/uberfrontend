// Wrong: concatenates and sorts, which the task rules out; the result is right but the merge is O((n + m) log(n + m)).
// Fails: merges without sorting the combined array
export default function mergeSortedArrays(a, b) {
  return [...a, ...b].sort((x, y) => x - y);
}

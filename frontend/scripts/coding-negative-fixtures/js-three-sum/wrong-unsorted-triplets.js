// Wrong: finds the right triplets with a set of seen values, but returns them in discovery order, not sorted.
// Fails: returns each triplet in non-decreasing order
export default function threeSum(nums) {
  const found = new Map();
  for (let i = 0; i < nums.length; i++) {
    const seen = new Set();
    for (let j = i + 1; j < nums.length; j++) {
      const need = 0 - nums[i] - nums[j];
      if (seen.has(need)) {
        const key = [nums[i], nums[j], need].sort((a, b) => a - b).join(',');
        if (!found.has(key)) found.set(key, [nums[i], nums[j], need]);
      }
      seen.add(nums[j]);
    }
  }
  return [...found.values()];
}

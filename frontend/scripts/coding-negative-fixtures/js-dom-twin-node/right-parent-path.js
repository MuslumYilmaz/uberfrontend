// Right: walks up from the target with parentNode, records the child index at each level, then replays the path from rootB.
export default function findTwin(rootA, rootB, targetA) {
  const path = [];
  let node = targetA;
  while (node && node !== rootA) {
    const parent = node.parentNode;
    if (!parent) return null;
    path.unshift(Array.prototype.indexOf.call(parent.children, node));
    node = parent;
  }
  if (node !== rootA) return null;
  let twin = rootB;
  for (const index of path) {
    twin = twin?.children[index];
    if (!twin) return null;
  }
  return twin;
}

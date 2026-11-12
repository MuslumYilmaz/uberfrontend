/** The footer count inside a list a task was opened from: "Day 1 · 2 / 4" when the list is one part of a plan. */
export function practiceProgressText(session: { items: readonly unknown[]; index: number; label?: string | null }): string {
  const count = `${session.index + 1} / ${session.items.length}`;
  return session.label ? `${session.label} · ${count}` : count;
}

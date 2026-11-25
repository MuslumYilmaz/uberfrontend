/** A failed check of a boolean: the value alone ("Expected true to be false") says nothing about what was checked. */
const BOOLEAN_FAILURE = /^(?:\w*Error: )?Expected (?:(?:true|false) to be (?:true|false)|.{1,80} to be (?:truthy|falsy))$/;
const MAX_LINE_CHARS = 160;

/**
 * The test line a failed boolean check ran, read from the module sources by the error's stack frames
 * (`blob:…:line:column`), added on a line of its own: "Expected true to be false" then "expect(0 in copy).toBe(false);".
 * Any other message, or a stack that reaches no `expect(` line, comes back as it was. The first line stays the
 * message itself, which failure signatures and the failure hints read.
 */
export function withAssertionLine(message: string, stack: unknown, sources: ReadonlyMap<string, string>): string {
  if (!BOOLEAN_FAILURE.test(message)) return message;
  for (const frame of String(stack ?? '').matchAll(/(blob:[^\s)]+?):(\d+):\d+/g)) {
    const line = sources.get(frame[1])?.split('\n')[Number(frame[2]) - 1]?.trim();
    if (line && line.includes('expect(')) {
      return `${message}\n${line.length > MAX_LINE_CHARS ? `${line.slice(0, MAX_LINE_CHARS)}…` : line}`;
    }
  }
  return message;
}

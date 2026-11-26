// Right: keeps whole snapshots of the text and the cursor, before and after each edit, instead of the edits.
export default class TextEditor {
  constructor(text = '') {
    if (typeof text !== 'string') throw new TypeError('text must be a string');
    this.state = { text, cursor: text.length };
    this.past = [];
    this.future = [];
  }

  getText() {
    return this.state.text;
  }

  getCursor() {
    return this.state.cursor;
  }

  commit(next) {
    if (next.text === this.state.text) return;
    this.past.push({ before: this.state, after: next });
    this.future = [];
    this.state = next;
  }

  insert(text) {
    if (typeof text !== 'string') throw new TypeError('text must be a string');
    const { text: current, cursor } = this.state;
    this.commit({ text: current.slice(0, cursor) + text + current.slice(cursor), cursor: cursor + text.length });
  }

  delete(count) {
    if (!Number.isInteger(count) || count < 0) throw new RangeError('count');
    const { text, cursor } = this.state;
    const from = Math.max(0, cursor - count);
    this.commit({ text: text.slice(0, from) + text.slice(cursor), cursor: from });
  }

  moveCursor(position) {
    if (!Number.isInteger(position)) throw new RangeError('position');
    this.state = { text: this.state.text, cursor: Math.max(0, Math.min(position, this.state.text.length)) };
  }

  undo() {
    const step = this.past.pop();
    if (!step) return false;
    this.future.push(step);
    this.state = step.before;
    return true;
  }

  redo() {
    const step = this.future.pop();
    if (!step) return false;
    this.past.push(step);
    this.state = step.after;
    return true;
  }

  canUndo() {
    return this.past.length > 0;
  }

  canRedo() {
    return this.future.length > 0;
  }
}

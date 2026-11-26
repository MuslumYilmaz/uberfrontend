// Wrong: an insert or delete right where the last one ended joins it, so undo takes back a whole run of edits at once.
// Fails: undo and redo walk the history one edit at a time, in order
// Fails: a new edit after an undo drops the edits that could be redone
// Fails: every insert and delete is its own undo step, even several in a row
export default class TextEditor {
  #text;
  #cursor;
  // Each edit: where it happened, what it removed and inserted, and the cursor on either side of it.
  #undoStack = [];
  #redoStack = [];

  constructor(text = '') {
    if (typeof text !== 'string') throw new TypeError('text must be a string');
    this.#text = text;
    this.#cursor = text.length;
  }

  getText() {
    return this.#text;
  }

  getCursor() {
    return this.#cursor;
  }

  insert(text) {
    if (typeof text !== 'string') throw new TypeError('text must be a string');
    if (text === '') return;
    const at = this.#cursor;
    this.#record({ at, removed: '', inserted: text, cursorBefore: at, cursorAfter: at + text.length });
  }

  delete(count) {
    if (!Number.isInteger(count) || count < 0) throw new RangeError('count must be a non-negative integer');
    const from = Math.max(0, this.#cursor - count);
    if (from === this.#cursor) return;
    this.#record({ at: from, removed: this.#text.slice(from, this.#cursor), inserted: '', cursorBefore: this.#cursor, cursorAfter: from });
  }

  moveCursor(position) {
    if (!Number.isInteger(position)) throw new RangeError('position must be an integer');
    this.#cursor = Math.min(Math.max(position, 0), this.#text.length);
  }

  undo() {
    const edit = this.#undoStack.pop();
    if (!edit) return false;
    this.#replace(edit.at, edit.inserted.length, edit.removed);
    this.#cursor = edit.cursorBefore;
    this.#redoStack.push(edit);
    return true;
  }

  redo() {
    const edit = this.#redoStack.pop();
    if (!edit) return false;
    this.#replace(edit.at, edit.removed.length, edit.inserted);
    this.#cursor = edit.cursorAfter;
    this.#undoStack.push(edit);
    return true;
  }

  canUndo() {
    return this.#undoStack.length > 0;
  }

  canRedo() {
    return this.#redoStack.length > 0;
  }

  // Applies a new edit and remembers it. The undone edits followed the old text, so a new edit drops them.
  #record(edit) {
    const previous = this.#undoStack[this.#undoStack.length - 1];
    if (previous && this.#redoStack.length === 0 && edit.inserted && !edit.removed && !previous.removed && previous.at + previous.inserted.length === edit.at) {
      this.#replace(edit.at, 0, edit.inserted);
      previous.inserted += edit.inserted;
      previous.cursorAfter = edit.cursorAfter;
      this.#cursor = edit.cursorAfter;
      return;
    }
    if (previous && this.#redoStack.length === 0 && edit.removed && !edit.inserted && !previous.inserted && edit.at + edit.removed.length === previous.at) {
      this.#replace(edit.at, edit.removed.length, '');
      previous.at = edit.at;
      previous.removed = edit.removed + previous.removed;
      previous.cursorAfter = edit.cursorAfter;
      this.#cursor = edit.cursorAfter;
      return;
    }
    this.#replace(edit.at, edit.removed.length, edit.inserted);
    this.#cursor = edit.cursorAfter;
    this.#undoStack.push(edit);
    this.#redoStack = [];
  }

  #replace(at, length, text) {
    this.#text = this.#text.slice(0, at) + text + this.#text.slice(at + length);
  }
}

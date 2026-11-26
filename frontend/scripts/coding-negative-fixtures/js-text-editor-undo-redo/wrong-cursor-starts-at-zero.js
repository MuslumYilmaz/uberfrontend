// Wrong: a new editor puts the cursor before its text instead of after it.
// Fails: starts with the given text and the cursor at its end, or empty
// Fails: delete removes characters before the cursor, and no further than the start
// Fails: every insert and delete is its own undo step, even several in a row
// Fails: an edit that changes nothing does not drop what could be redone
// Fails: undo and redo report whether they did anything
// Fails: throws a TypeError for text that is not a string, and records nothing
// Fails: throws a RangeError for a count or a position it cannot use, and records nothing
// Fails: each editor keeps its own text and history
export default class TextEditor {
  #text;
  #cursor;
  // Each edit: where it happened, what it removed and inserted, and the cursor on either side of it.
  #undoStack = [];
  #redoStack = [];

  constructor(text = '') {
    if (typeof text !== 'string') throw new TypeError('text must be a string');
    this.#text = text;
    this.#cursor = 0;
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
    this.#replace(edit.at, edit.removed.length, edit.inserted);
    this.#cursor = edit.cursorAfter;
    this.#undoStack.push(edit);
    this.#redoStack = [];
  }

  #replace(at, length, text) {
    this.#text = this.#text.slice(0, at) + text + this.#text.slice(at + length);
  }
}

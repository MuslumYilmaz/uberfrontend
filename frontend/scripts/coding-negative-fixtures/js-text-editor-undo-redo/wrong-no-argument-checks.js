// Wrong: nothing checks the arguments, so a number is typed in and a fraction is deleted.
// Fails: throws a TypeError for text that is not a string, and records nothing
// Fails: throws a RangeError for a count or a position it cannot use, and records nothing
export default class TextEditor {
  #text;
  #cursor;
  // Each edit: where it happened, what it removed and inserted, and the cursor on either side of it.
  #undoStack = [];
  #redoStack = [];

  constructor(text = '') {
    this.#text = String(text);
    this.#cursor = text.length;
  }

  getText() {
    return this.#text;
  }

  getCursor() {
    return this.#cursor;
  }

  insert(text) {
    if (text === '') return;
    const at = this.#cursor;
    this.#record({ at, removed: '', inserted: text, cursorBefore: at, cursorAfter: at + text.length });
  }

  delete(count) {
    const from = Math.max(0, this.#cursor - count);
    if (from === this.#cursor) return;
    this.#record({ at: from, removed: this.#text.slice(from, this.#cursor), inserted: '', cursorBefore: this.#cursor, cursorAfter: from });
  }

  moveCursor(position) {
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

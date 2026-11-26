// Right: each edit is an object that knows how to apply and revert itself.
const edit = (at, removed, inserted) => ({
  apply: (text) => text.slice(0, at) + inserted + text.slice(at + removed.length),
  revert: (text) => text.slice(0, at) + removed + text.slice(at + inserted.length),
  cursorBefore: inserted ? at : at + removed.length,
  cursorAfter: at + inserted.length,
});

export default class TextEditor {
  #text;
  #cursor;
  #done = [];
  #undone = [];

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

  #run(command) {
    this.#text = command.apply(this.#text);
    this.#cursor = command.cursorAfter;
    this.#done.push(command);
    this.#undone.length = 0;
  }

  insert(text) {
    if (typeof text !== 'string') throw new TypeError('text must be a string');
    if (text.length > 0) this.#run(edit(this.#cursor, '', text));
  }

  delete(count) {
    if (!Number.isInteger(count) || count < 0) throw new RangeError('count must be a non-negative integer');
    const from = Math.max(0, this.#cursor - count);
    if (from < this.#cursor) this.#run(edit(from, this.#text.slice(from, this.#cursor), ''));
  }

  moveCursor(position) {
    if (!Number.isInteger(position)) throw new RangeError('position must be an integer');
    this.#cursor = Math.max(0, Math.min(this.#text.length, position));
  }

  undo() {
    const command = this.#done.pop();
    if (command === undefined) return false;
    this.#text = command.revert(this.#text);
    this.#cursor = command.cursorBefore;
    this.#undone.push(command);
    return true;
  }

  redo() {
    const command = this.#undone.pop();
    if (command === undefined) return false;
    this.#text = command.apply(this.#text);
    this.#cursor = command.cursorAfter;
    this.#done.push(command);
    return true;
  }

  canUndo() {
    return this.#done.length > 0;
  }

  canRedo() {
    return this.#undone.length > 0;
  }
}

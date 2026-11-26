// Wrong (Shift and Tab): from two levels down, the item goes to the end of its grandparent's list instead of right after its parent.
import React, { useEffect, useRef, useState } from 'react';
import './App.css';

export interface Item {
  id: string;
  text: string;
  done: boolean;
  children: Item[];
}

/** The outline the page opens with. */
export const INITIAL: Item[] = [
  {
    id: 'plan',
    text: 'Plan the launch',
    done: false,
    children: [
      { id: 'draft', text: 'Draft the post', done: false, children: [] },
      { id: 'date', text: 'Pick a date', done: false, children: [] },
    ],
  },
  { id: 'venue', text: 'Book the venue', done: false, children: [] },
  { id: 'invites', text: 'Send invites', done: false, children: [] },
];

let created = 0;
/** A fresh id for a new item. */
export function newId(): string {
  created += 1;
  return `item-${created}`;
}

// The tree operations are pure: each returns a new tree and leaves its input as it was.

/** Where an item sits: the indices of its parents from the top, and its own index among its siblings. */
function locate(items: Item[], id: string, parents: number[] = []): { parents: number[]; index: number } | null {
  for (let index = 0; index < items.length; index += 1) {
    if (items[index].id === id) return { parents, index };
    const inside = locate(items[index].children, id, [...parents, index]);
    if (inside) return inside;
  }
  return null;
}

/** Replaces the sibling list that `parents` leads to. */
function withSiblings(items: Item[], parents: number[], change: (siblings: Item[]) => Item[]): Item[] {
  if (parents.length === 0) return change(items);
  const [first, ...rest] = parents;
  return items.map((item, index) => (index === first ? { ...item, children: withSiblings(item.children, rest, change) } : item));
}

function insertAfter(items: Item[], id: string, fresh: Item): Item[] {
  const at = locate(items, id);
  if (!at) return items;
  return withSiblings(items, at.parents, (siblings) => [...siblings.slice(0, at.index + 1), fresh, ...siblings.slice(at.index + 1)]);
}

/** The item becomes the last child of its previous sibling; a first child stays where it is. */
function indent(items: Item[], id: string): Item[] {
  const at = locate(items, id);
  if (!at || at.index === 0) return items;
  return withSiblings(items, at.parents, (siblings) => {
    const item = siblings[at.index];
    const previous = siblings[at.index - 1];
    return siblings
      .filter((sibling) => sibling.id !== id)
      .map((sibling) => (sibling.id === previous.id ? { ...previous, children: [...previous.children, item] } : sibling));
  });
}

/** The item becomes the next sibling of its parent; its later siblings stay with the parent. A top-level item stays. */
function outdent(items: Item[], id: string): Item[] {
  const at = locate(items, id);
  if (!at || at.parents.length === 0) return items;
  const parentIndex = at.parents[at.parents.length - 1];
  return withSiblings(items, at.parents.slice(0, -1), (siblings) => {
    const parent = siblings[parentIndex];
    const item = parent.children[at.index];
    const rest = { ...parent, children: parent.children.filter((child) => child.id !== id) };
    if (at.parents.length > 1) return [...siblings.slice(0, parentIndex), rest, ...siblings.slice(parentIndex + 1), item];
    return [...siblings.slice(0, parentIndex), rest, item, ...siblings.slice(parentIndex + 1)];
  });
}

function remove(items: Item[], id: string): Item[] {
  const at = locate(items, id);
  if (!at) return items;
  return withSiblings(items, at.parents, (siblings) => siblings.filter((sibling) => sibling.id !== id));
}

function update(items: Item[], id: string, change: Partial<Item>): Item[] {
  const at = locate(items, id);
  if (!at) return items;
  return withSiblings(items, at.parents, (siblings) => siblings.map((sibling) => (sibling.id === id ? { ...sibling, ...change } : sibling)));
}

/** Every item in reading order. */
function flatten(items: Item[]): Item[] {
  return items.flatMap((item) => [item, ...flatten(item.children)]);
}

export default function App() {
  const [items, setItems] = useState<Item[]>(INITIAL);
  const [focusId, setFocusId] = useState<string | null>(null);
  const inputs = useRef(new Map<string, HTMLInputElement>());
  const addButton = useRef<HTMLButtonElement | null>(null);

  // An item that moves is a new element: focus follows its id once, after the change that asked for it.
  useEffect(() => {
    if (!focusId) return;
    inputs.current.get(focusId)?.focus();
    setFocusId(null);
  }, [focusId]);

  const all = flatten(items);
  const done = all.filter((item) => item.done).length;

  const onKeyDown = (item: Item, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const fresh: Item = { id: newId(), text: '', done: false, children: [] };
      setItems((current) => insertAfter(current, item.id, fresh));
      setFocusId(fresh.id);
    } else if (event.key === 'Tab') {
      event.preventDefault();
      const out = event.shiftKey;
      setItems((current) => (out ? outdent(current, item.id) : indent(current, item.id)));
      setFocusId(item.id);
    } else if (event.key === 'Backspace' && item.text === '' && item.children.length === 0) {
      event.preventDefault();
      const previous = all[all.findIndex((entry) => entry.id === item.id) - 1];
      setItems((current) => remove(current, item.id));
      setFocusId(previous ? previous.id : null);
    } else if (event.key === 'Escape') {
      // The way out of the outline for a keyboard: Tab indents inside it.
      event.preventDefault();
      setFocusId(null);
      addButton.current?.focus();
    }
  };

  const addItem = () => {
    const fresh: Item = { id: newId(), text: '', done: false, children: [] };
    setItems((current) => [...current, fresh]);
    setFocusId(fresh.id);
  };

  const renderList = (list: Item[], className: string) => (
    <ul className={className}>
      {list.map((item) => (
        <li key={item.id} className={item.done ? 'outline-item is-done' : 'outline-item'} data-id={item.id}>
          <input
            type="checkbox"
            className="item-done"
            checked={item.done}
            aria-label={`Done: ${item.text || 'empty item'}`}
            onChange={() => setItems((current) => update(current, item.id, { done: !item.done }))}
          />
          <input
            className="item-text"
            value={item.text}
            aria-label="Item"
            ref={(node) => {
              if (node) inputs.current.set(item.id, node);
              else inputs.current.delete(item.id);
            }}
            onChange={(event) => setItems((current) => update(current, item.id, { text: event.target.value }))}
            onKeyDown={(event) => onKeyDown(item, event)}
          />
          {item.children.length > 0 && renderList(item.children, 'outline-children')}
        </li>
      ))}
    </ul>
  );

  return (
    <main className="outline-page">
      <p className="outline-count" role="status">{done} of {all.length} done</p>
      {renderList(items, 'outline')}
      <button type="button" className="add-item" ref={addButton} onClick={addItem}>New item</button>
    </main>
  );
}

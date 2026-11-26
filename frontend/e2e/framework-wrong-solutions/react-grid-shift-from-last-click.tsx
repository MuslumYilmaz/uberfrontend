// Wrong (Shift): extends from the cell clicked last instead of where the selection started.
import React, { useEffect, useRef, useState } from 'react';
import './App.css';

/** The sheet's columns, A to N, and its ten rows. */
export const COLUMNS = 'ABCDEFGHIJKLMN'.split('');
export const ROW_COUNT = 10;

/** A cell by its 0-based column and row. */
export interface Cell {
  col: number;
  row: number;
}

/** "B2": the name a cell shows and carries in `data-cell`. */
export function cellName(cell: Cell): string {
  return `${COLUMNS[cell.col]}${cell.row + 1}`;
}

type Selection = { anchor: Cell; focus: Cell };

const clamp = (value: number, max: number) => Math.max(0, Math.min(value, max));

/** The selected rectangle's corners, top left first, whichever way it was drawn. */
function bounds({ anchor, focus }: Selection) {
  return {
    top: Math.min(anchor.row, focus.row),
    bottom: Math.max(anchor.row, focus.row),
    left: Math.min(anchor.col, focus.col),
    right: Math.max(anchor.col, focus.col),
  };
}

function summary(selection: Selection | null): string {
  if (!selection) return 'No cells selected';
  const { top, bottom, left, right } = bounds(selection);
  const count = (bottom - top + 1) * (right - left + 1);
  const first = cellName({ col: left, row: top });
  if (count === 1) return `${first} · 1 cell`;
  return `${first}:${cellName({ col: right, row: bottom })} · ${count} cells`;
}

const MOVES: Record<string, Cell> = {
  ArrowUp: { col: 0, row: -1 },
  ArrowDown: { col: 0, row: 1 },
  ArrowLeft: { col: -1, row: 0 },
  ArrowRight: { col: 1, row: 0 },
};

export default function App() {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [active, setActive] = useState<Cell>({ col: 0, row: 0 });
  const dragging = useRef(false);
  const cells = useRef(new Map<string, HTMLDivElement>());

  // A drag ends wherever the button comes up, inside the sheet or not.
  useEffect(() => {
    const stop = () => {
      dragging.current = false;
    };
    window.addEventListener('mouseup', stop);
    return () => window.removeEventListener('mouseup', stop);
  }, []);

  const select = (anchor: Cell, focus: Cell) => {
    setSelection({ anchor, focus });
    setActive(focus);
  };

  const onMouseDown = (cell: Cell, event: React.MouseEvent) => {
    event.preventDefault();
    // Shift keeps where the selection started; a plain press starts a new one there.
    if (event.shiftKey && selection) select(selection.focus, cell);
    else select(cell, cell);
    dragging.current = true;
  };

  const onMouseEnter = (cell: Cell) => {
    if (!dragging.current) return;
    setSelection((current) => (current ? { anchor: current.anchor, focus: cell } : current));
    setActive(cell);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setSelection(null);
      return;
    }
    const move = MOVES[event.key];
    if (!move) return;
    event.preventDefault();
    const next = { col: clamp(active.col + move.col, COLUMNS.length - 1), row: clamp(active.row + move.row, ROW_COUNT - 1) };
    if (event.shiftKey) select(selection?.anchor ?? active, next);
    else select(next, next);
    cells.current.get(cellName(next))?.focus();
  };

  const box = selection ? bounds(selection) : null;
  const isSelected = (cell: Cell) =>
    !!box && cell.row >= box.top && cell.row <= box.bottom && cell.col >= box.left && cell.col <= box.right;

  return (
    <main className="sheet-page">
      <p className="selection-summary" role="status">{summary(selection)}</p>
      <div className="sheet" role="grid" aria-label="Seats" aria-multiselectable="true" onKeyDown={onKeyDown}>
        {Array.from({ length: ROW_COUNT }, (_, row) => (
          <div className="sheet-row" role="row" key={row}>
            {COLUMNS.map((_, col) => {
              const cell = { col, row };
              const name = cellName(cell);
              return (
                <div
                  key={name}
                  ref={(node) => {
                    if (node) cells.current.set(name, node);
                    else cells.current.delete(name);
                  }}
                  className="cell"
                  role="gridcell"
                  data-cell={name}
                  aria-selected={isSelected(cell)}
                  tabIndex={col === active.col && row === active.row ? 0 : -1}
                  onMouseDown={(event) => onMouseDown(cell, event)}
                  onMouseEnter={() => onMouseEnter(cell)}
                >
                  {name}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </main>
  );
}

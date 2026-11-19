// Wrong (task 3 setting state without moving the list): the range says 4,821 while the list still shows the
// old position, and the next scroll event snaps the range back.
import React, { useEffect, useRef, useState } from 'react';
import './App.css';

export interface Payment {
  id: number;
  amountCents: number;
}

export const ITEM_COUNT = 10000;
export const ROW_HEIGHT = 36;
export const VIEWPORT_HEIGHT = 360;
export const VISIBLE_ROWS = VIEWPORT_HEIGHT / ROW_HEIGHT;
export const OVERSCAN = 5;
export const POOL_SIZE = VISIBLE_ROWS + 2 * OVERSCAN;

/** Ten thousand payments, the same on every run. */
export const PAYMENTS: Payment[] = Array.from({ length: ITEM_COUNT }, (_, index) => ({
  id: index + 1,
  amountCents: ((index + 1) * 2654435761) % 100000,
}));

const numberFormat = new Intl.NumberFormat('en-US');
const moneyFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const formatNumber = (value: number) => numberFormat.format(value);
export const formatMoney = (cents: number) => moneyFormat.format(cents / 100);

/**
 * Given: counts the row nodes ever created inside the list, so the recycling check can read it. Keep
 * `ref={listRef}` on `.viewport` and `ref={meterRef}` on `.row-meter`.
 */
function useRowNodeMeter() {
  const listRef = useRef<HTMLDivElement>(null);
  const meterRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const list = listRef.current;
    const meter = meterRef.current;
    if (!list || !meter) return;
    const seen = new WeakSet<Element>();
    let created = 0;
    const note = (node: Node) => {
      if (!(node instanceof Element)) return;
      const rows = node.matches('.row') ? [node] : Array.from(node.querySelectorAll('.row'));
      for (const row of rows) {
        if (seen.has(row)) continue;
        seen.add(row);
        created += 1;
      }
    };
    const show = () => {
      meter.textContent = `${formatNumber(created)} row nodes created`;
    };
    note(list);
    show();
    const observer = new MutationObserver((records) => {
      for (const record of records) record.addedNodes.forEach(note);
      show();
    });
    observer.observe(list, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return { listRef, meterRef };
}

const LAST_FIRST_ROW = ITEM_COUNT - VISIBLE_ROWS;

/**
 * The row at the top edge of the viewport, partly scrolled out or not. A row with less than half a pixel left on
 * screen counts as scrolled out: a zoomed browser can report 173519.4px for a jump to 173520px.
 */
function rowAt(scrollTop: number) {
  return Math.min(Math.max(Math.floor((scrollTop + 0.5) / ROW_HEIGHT), 0), LAST_FIRST_ROW);
}

export default function App() {
  const { listRef, meterRef } = useRowNodeMeter();
  // Only the first visible row is state: a scroll that stays inside one row sets the same number, and React bails
  // out without committing anything.
  const [firstVisible, setFirstVisible] = useState(0);
  const [jumpText, setJumpText] = useState('');
  const [jumpStatus, setJumpStatus] = useState('');

  const start = Math.min(Math.max(firstVisible - OVERSCAN, 0), ITEM_COUNT - POOL_SIZE);
  const indexes = Array.from({ length: POOL_SIZE }, (_, offset) => start + offset);

  // A jump moves the list and sets the window in the same handler, from the position the browser applied.
  const handleJump = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const list = listRef.current;
    const target = Number(jumpText.trim());
    if (!/^\d+$/.test(jumpText.trim()) || target < 1 || !list) {
      setJumpStatus(`Enter a whole payment number from 1 to ${formatNumber(ITEM_COUNT)}.`);
      return;
    }
    const row = Math.min(target - 1, LAST_FIRST_ROW);
    setFirstVisible(row);
    setJumpStatus(`Jumped to payment ${formatNumber(row + 1)}.`);
  };

  return (
    <main className="main">
      <section className="card">
        <header className="header">
          <h1 className="title">Payments (Solution)</h1>
          <p className="subtitle">Ten thousand rows. Draw the twenty that matter.</p>
        </header>

        <form className="jump-form" onSubmit={handleJump}>
          <label className="label" htmlFor="jump">Jump to payment</label>
          <input
            id="jump"
            className="jump"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={jumpText}
            onChange={(event) => setJumpText(event.target.value)}
          />
          <button type="submit" className="go">Go</button>
          <p className="jump-status" role="status">{jumpStatus}</p>
        </form>

        <div className="list-status">
          <p className="range">
            Showing {formatNumber(firstVisible + 1)}–{formatNumber(firstVisible + VISIBLE_ROWS)} of {formatNumber(ITEM_COUNT)}
          </p>
          <span className="row-meter" ref={meterRef} />
        </div>

        <div
          className="viewport"
          ref={listRef}
          role="list"
          aria-label="Payments"
          tabIndex={0}
          style={{ height: VIEWPORT_HEIGHT }}
          onScroll={(event) => setFirstVisible(rowAt(event.currentTarget.scrollTop))}
        >
          <div className="spacer" style={{ height: ITEM_COUNT * ROW_HEIGHT }}>
            {indexes.map((index, offset) => {
              const payment = PAYMENTS[index];
              // Keyed by position in the pool: element 0 always shows the pool's first payment, so scrolling
              // rewrites the twenty elements in place and never creates, removes or reorders one.
              return (
                <div
                  key={offset}
                  className="row"
                  role="listitem"
                  aria-posinset={payment.id}
                  aria-setsize={ITEM_COUNT}
                  data-id={payment.id}
                  style={{ transform: `translateY(${index * ROW_HEIGHT}px)` }}
                >
                  <span className="payment">Payment {formatNumber(payment.id)}</span>
                  <span className="amount">{formatMoney(payment.amountCents)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

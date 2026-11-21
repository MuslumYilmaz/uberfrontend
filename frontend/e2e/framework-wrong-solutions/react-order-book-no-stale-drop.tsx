// Wrong (task 2 without dropping what the snapshot includes): the gap check sees seq 997 after a snapshot at
// 999 and resyncs forever.
import React, { useEffect, useRef, useState } from 'react';
import './App.css';

export type Side = 'bid' | 'ask';
export type Scenario = 'steady' | 'late-snapshot' | 'gap' | 'burst';

export interface Level {
  price: number;
  size: number;
}

export interface Snapshot {
  /** The seq of the newest message the snapshot includes. */
  lastSeq: number;
  /** Price levels in no particular order. */
  bids: Level[];
  asks: Level[];
}

/** One price level changed: `size` is the new total at that price, and 0 removes the level. */
export interface Delta {
  seq: number;
  side: Side;
  price: number;
  size: number;
}

export interface FeedConnection {
  /** Answers after 325 ms. The first snapshot of a connection may be older than messages already sent. */
  fetchSnapshot(): Promise<Snapshot>;
  /** Stops the socket and any snapshot still on its way. */
  close(): void;
}

export const DEPTH = 10;
export const UPDATE_BUDGET = 20;

// ---------------------------------------------------------------------------------------------------------------
// Mock exchange: treat everything from here to the commit meter as given.
// ---------------------------------------------------------------------------------------------------------------

function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = seeded(46);
const priceSteps = (from: number, to: number) =>
  Array.from({ length: Math.round((to - from) / 0.5) + 1 }, (_, index) => from + index * 0.5);
const BID_PRICES = priceSteps(90, 99.5);
const ASK_PRICES = priceSteps(100.5, 110);
const randomSize = () => 1 + Math.floor(random() * 40);

/** The book before the first message below (seq 996). */
const BASE = {
  bids: new Map(BID_PRICES.map((price): [number, number] => [price, randomSize()])),
  asks: new Map(ASK_PRICES.map((price): [number, number] => [price, randomSize()])),
};

/** A few messages are fixed so the checks can see them; the rest are random but the same on every run. */
const FIXED: Record<number, Omit<Delta, 'seq'>> = {
  1000: { side: 'bid', price: 95, size: 0 },
  1001: { side: 'ask', price: 100.5, size: 0 },
  1012: { side: 'bid', price: 100, size: 18 },
};

/** Every message the exchange sends, seq 997 to 1720. */
export const MESSAGES: Delta[] = (() => {
  const live = { bids: new Map(BASE.bids), asks: new Map(BASE.asks) };
  const messages: Delta[] = [];
  for (let seq = 997; seq <= 1720; seq += 1) {
    let change = FIXED[seq];
    if (!change) {
      const side: Side = random() < 0.5 ? 'bid' : 'ask';
      const prices = (side === 'bid' ? BID_PRICES : ASK_PRICES).filter((price) => price !== 95 && price !== 100.5);
      const price = prices[Math.floor(random() * prices.length)];
      const levels = side === 'bid' ? live.bids : live.asks;
      const remove = random() < 0.15 && levels.size > 12 && levels.has(price);
      change = { side, price, size: remove ? 0 : randomSize() };
    }
    const levels = change.side === 'bid' ? live.bids : live.asks;
    if (change.size === 0) levels.delete(change.price);
    else levels.set(change.price, change.size);
    messages.push({ seq, ...change });
  }
  return messages;
})();

function bookAt(seq: number): Snapshot {
  const bids = new Map(BASE.bids);
  const asks = new Map(BASE.asks);
  for (const message of MESSAGES) {
    if (message.seq > seq) break;
    const levels = message.side === 'bid' ? bids : asks;
    if (message.size === 0) levels.delete(message.price);
    else levels.set(message.price, message.size);
  }
  const list = (levels: Map<number, number>) => Array.from(levels, ([price, size]) => ({ price, size }));
  return { lastSeq: seq, bids: list(bids), asks: list(asks) };
}

const SNAPSHOT_DELAY = 325;

/** When each scenario sends what. `drop` is a message the exchange sends but the socket loses. */
const PLANS: Record<
  Scenario,
  { firstSeq: number; lastSeq: number; firstAt: number; every: number; perTick: number; firstSnapshot: number; drop?: number }
> = {
  steady: { firstSeq: 1001, lastSeq: 1030, firstAt: 600, every: 50, perTick: 1, firstSnapshot: 1000 },
  'late-snapshot': { firstSeq: 997, lastSeq: 1030, firstAt: 50, every: 50, perTick: 1, firstSnapshot: 999 },
  gap: { firstSeq: 1001, lastSeq: 1030, firstAt: 600, every: 50, perTick: 1, firstSnapshot: 1000, drop: 1012 },
  burst: { firstSeq: 1001, lastSeq: 1720, firstAt: 600, every: 5, perTick: 3, firstSnapshot: 1000 },
};

/**
 * Opens the socket for a scenario. Messages arrive through `onMessage` in seq order, except that one can be lost.
 * The first snapshot describes the book at a fixed seq (1000, or 999 when the snapshot is late); a later one
 * describes it at the newest seq the exchange has sent, lost messages included.
 */
export function connectFeed(scenario: Scenario, onMessage: (delta: Delta) => void): FeedConnection {
  const plan = PLANS[scenario];
  let sentSeq = plan.firstSeq - 1;
  let snapshots = 0;
  let interval = 0;
  const timeouts = new Set<number>();

  const tick = () => {
    for (let sent = 0; sent < plan.perTick && sentSeq < plan.lastSeq; sent += 1) {
      sentSeq += 1;
      if (sentSeq !== plan.drop) onMessage({ ...MESSAGES[sentSeq - 997] });
    }
    if (sentSeq >= plan.lastSeq) window.clearInterval(interval);
  };
  const start = window.setTimeout(() => {
    timeouts.delete(start);
    tick();
    if (sentSeq < plan.lastSeq) interval = window.setInterval(tick, plan.every);
  }, plan.firstAt);
  timeouts.add(start);

  return {
    fetchSnapshot() {
      const seq = snapshots === 0 ? plan.firstSnapshot : sentSeq;
      snapshots += 1;
      return new Promise((resolve) => {
        const id = window.setTimeout(() => {
          timeouts.delete(id);
          resolve(bookAt(seq));
        }, SNAPSHOT_DELAY);
        timeouts.add(id);
      });
    },
    close() {
      timeouts.forEach((id) => window.clearTimeout(id));
      timeouts.clear();
      window.clearInterval(interval);
    },
  };
}

/**
 * Given: an update meter for the burst check. It counts the DOM updates inside the book (one per commit or direct
 * write that changes it) in a sliding one-second window and shows the peak since the scenario changed.
 * Keep `ref={bookRef}` on `.book`, render the rows inside it, and keep `ref={meterRef}` on `.update-meter`.
 */
function useUpdateMeter(resetKey: string) {
  const bookRef = useRef<HTMLDivElement>(null);
  const meterRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const book = bookRef.current;
    const meter = meterRef.current;
    if (!book || !meter) return;
    let stamps: number[] = [];
    let peak = 0;
    const observer = new MutationObserver(() => {
      const now = performance.now();
      stamps = stamps.filter((stamp) => now - stamp < 1000);
      stamps.push(now);
      peak = Math.max(peak, stamps.length);
      meter.textContent = `${peak > UPDATE_BUDGET ? 'Over budget' : 'Within budget'}: peak ${peak} book updates per second`;
    });
    observer.observe(book, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [resetKey]);
  return { bookRef, meterRef };
}

// ---------------------------------------------------------------------------------------------------------------

type Status = 'loading' | 'live' | 'resyncing';

interface Book {
  bids: Map<number, number>;
  asks: Map<number, number>;
}

interface View {
  bids: Level[];
  asks: Level[];
  lastSeq: number | null;
}

const STATUS_TEXT: Record<Status, string> = { loading: 'Loading snapshot…', live: 'Live', resyncing: 'Resyncing…' };
const EMPTY_VIEW: View = { bids: [], asks: [], lastSeq: null };
const DRAW_EVERY = 100;

function bestLevels(levels: Map<number, number>, side: Side): Level[] {
  return Array.from(levels, ([price, size]) => ({ price, size }))
    .sort((a, b) => (side === 'bid' ? b.price - a.price : a.price - b.price))
    .slice(0, DEPTH);
}

function toLevels(levels: Level[]): Map<number, number> {
  return new Map(levels.map((level): [number, number] => [level.price, level.size]));
}

export default function App() {
  const [scenario, setScenario] = useState<Scenario>('steady');
  const [view, setView] = useState<View>(EMPTY_VIEW);
  const [status, setStatus] = useState<Status>('loading');
  const [resyncs, setResyncs] = useState(0);
  const { bookRef, meterRef } = useUpdateMeter(scenario);

  useEffect(() => {
    // The book lives outside React state: messages change it at socket speed, and the screen follows on a timer.
    const book: Book = { bids: new Map(), asks: new Map() };
    let lastSeq: number | null = null;
    const pending: Delta[] = [];
    let syncing = true;
    let changed = false;
    let closed = false;
    let retry = 0;

    const apply = (delta: Delta) => {
      const levels = delta.side === 'bid' ? book.bids : book.asks;
      if (delta.size === 0) levels.delete(delta.price);
      else levels.set(delta.price, delta.size);
      lastSeq = delta.seq;
      changed = true;
    };

    // Applies pending messages in arrival order: one the snapshot already includes is skipped, and a jump past
    // the next seq is a gap that starts a resync and stays queued.
    const drain = () => {
      let index = 0;
      while (!syncing && lastSeq !== null && index < pending.length) {
        const next = pending[index];
        if (next.seq > lastSeq + 1) {
          resync();
          break;
        }
        if (next.seq === lastSeq + 1) apply(next);
        else if (next.seq <= lastSeq) {
          resync();
          break;
        }
        index += 1;
      }
      pending.splice(0, index);
    };

    const draw = () => {
      if (!changed || closed) return;
      changed = false;
      setView({ bids: bestLevels(book.bids, 'bid'), asks: bestLevels(book.asks, 'ask'), lastSeq });
    };

    // The first load and every resync ask the same connection for a snapshot. Only a failed request retries;
    // an error thrown while applying the snapshot is not swallowed.
    const load = () => {
      connection.fetchSnapshot().then(
        (snapshot) => {
          if (closed) return;
          book.bids = toLevels(snapshot.bids);
          book.asks = toLevels(snapshot.asks);
          lastSeq = snapshot.lastSeq;
          changed = true;
          syncing = false;
          drain();
          if (!syncing) {
            setStatus('live');
            draw();
          }
        },
        () => {
          if (!closed) retry = window.setTimeout(load, 1000);
        }
      );
    };

    // The last book stays on screen while a new snapshot loads; messages keep queueing behind it.
    const resync = () => {
      syncing = true;
      setStatus('resyncing');
      setResyncs((count) => count + 1);
      load();
    };

    const connection = connectFeed(scenario, (delta) => {
      if (closed) return;
      pending.push(delta);
      drain();
    });
    load();
    const timer = window.setInterval(draw, DRAW_EVERY);

    return () => {
      closed = true;
      connection.close();
      window.clearInterval(timer);
      window.clearTimeout(retry);
    };
  }, [scenario]);

  // Clearing here rather than in the effect keeps the old book out of the first commit of the new scenario.
  const changeScenario = (next: Scenario) => {
    setScenario(next);
    setView(EMPTY_VIEW);
    setStatus('loading');
    setResyncs(0);
  };

  const bestBid = view.bids[0];
  const bestAsk = view.asks[0];
  const spread = bestBid && bestAsk ? `Spread ${(bestAsk.price - bestBid.price).toFixed(2)}` : 'Spread —';

  return (
    <main className="main">
      <section className="card">
        <header className="header">
          <h1 className="title">Order Book (Solution)</h1>
          <p className="subtitle">A snapshot, then deltas over a socket. Keep the book right and the screen calm.</p>
        </header>

        <div className="toolbar">
          <label className="label" htmlFor="scenario">Feed scenario</label>
          <select
            id="scenario"
            className="scenario"
            value={scenario}
            onChange={(event) => changeScenario(event.target.value as Scenario)}
          >
            <option value="steady">Steady feed</option>
            <option value="late-snapshot">Snapshot after the first messages</option>
            <option value="gap">Lost message</option>
            <option value="burst">Burst</option>
          </select>
        </div>

        <div className="status-line">
          <span className="status-live" aria-live="polite">
            <span className="sync-status">{STATUS_TEXT[status]}</span>
            <span className="resync-count">
              {resyncs} {resyncs === 1 ? 'resync' : 'resyncs'}
            </span>
          </span>
          <span className="last-seq">Last update {view.lastSeq === null ? '—' : `#${view.lastSeq}`}</span>
        </div>
        <span className="update-meter" ref={meterRef} />

        <p className="spread">{spread}</p>
        <div className={`book${status === 'resyncing' ? ' book--stale' : ''}`} ref={bookRef}>
          <section className="side" aria-label="Bids">
            <h2 className="side-title">Bids</h2>
            <ol className="bids">
              {view.bids.map((level) => (
                <li key={level.price} className="level bid">
                  <span className="price">{level.price.toFixed(2)}</span>
                  <span className="size">{level.size}</span>
                </li>
              ))}
            </ol>
          </section>
          <section className="side" aria-label="Asks">
            <h2 className="side-title">Asks</h2>
            <ol className="asks">
              {view.asks.map((level) => (
                <li key={level.price} className="level ask">
                  <span className="price">{level.price.toFixed(2)}</span>
                  <span className="size">{level.size}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </section>
    </main>
  );
}

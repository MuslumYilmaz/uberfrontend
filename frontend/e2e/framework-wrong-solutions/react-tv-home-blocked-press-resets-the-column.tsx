import React, { useEffect, useRef, useState } from 'react';
import './App.css';

/** Time the fake API takes to answer, in ms. */
export const HOME_DELAY_MS = 300;
export const SET_DELAY_MS = 600;

export interface Title {
  id: string;
  name: string;
  year: number;
  description: string;
  image: string;
}

/** A curated row comes with its titles; a set row names a set of titles to load with fetchSet. */
export type HomeRow =
  | { id: string; title: string; kind: 'curated'; items: Title[] }
  | { id: string; title: string; kind: 'set'; setId: string };

export interface HomeDocument {
  rows: HomeRow[];
}

const art = (from: string, to: string) =>
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90"><defs><linearGradient id="g" x2="1" y2="1">' +
      `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>` +
      '<rect width="160" height="90" fill="url(#g)"/></svg>',
  );
/** An image the TV cannot decode, as when an artwork link is broken. */
const BROKEN = 'data:image/png;base64,broken';
const title = (id: string, name: string, year: number, description: string, image: string): Title => ({
  id,
  name,
  year,
  description,
  image,
});

const SETS: Record<string, Title[]> = {
  trending: [
    title('northbound', 'Northbound', 2023, 'Two sisters drive a borrowed bus to the Arctic Circle.',
      art('#0f766e', '#22d3ee')),
    title('paper-lanterns', 'Paper Lanterns', 2022, 'A night market owner hides a talking lantern.',
      art('#b45309', '#fde047')),
    title('quiet-engine', 'The Quiet Engine', 2021, 'An inventor builds a train that makes no sound.',
      art('#334155', '#94a3b8')),
    title('glass-harbor', 'Glass Harbor', 2024, 'Divers find a city under the ice.', art('#1e3a8a', '#38bdf8')),
    title('fieldwork', 'Fieldwork', 2020, 'A biology class gets lost on a school trip.', art('#365314', '#a3e635')),
    title('moth-season', 'Moth Season', 2023, 'A detective who only works at night.', art('#4c1d95', '#c084fc')),
    title('second-shift', 'Second Shift', 2022, 'Nurses on the late shift of a small hospital.',
      art('#7f1d1d', '#f87171')),
    title('tidal-lines', 'Tidal Lines', 2024, 'Surfers race a storm along the coast.', art('#155e75', '#67e8f9')),
  ],
  docs: [
    title('deep-archive', 'Deep Archive', 2021, 'Inside the vault that keeps every seed on Earth.', BROKEN),
    title('city-bees', 'Bees of the City', 2023, 'Beekeepers on the rooftops of a capital.',
      art('#a16207', '#facc15')),
  ],
  family: [
    title('puddle-jumpers', 'Puddle Jumpers', 2019, 'Three ducklings try to fly before winter.',
      art('#0369a1', '#7dd3fc')),
    title('captain-waffle', 'Captain Waffle', 2021, 'A breakfast superhero saves the school fair.',
      art('#c2410c', '#fdba74')),
    title('lost-kite', 'The Lost Kite', 2020, 'A kite crosses the ocean to find its owner.',
      art('#be185d', '#f9a8d4')),
    title('snowball-summer', 'Snowball Summer', 2022, 'A snowman wakes up in July.', art('#0e7490', '#e0f2fe')),
    title('mapmakers', 'Mapmakers', 2023, 'Cousins draw a map of a town that keeps moving.',
      art('#3f6212', '#d9f99d')),
    title('robot-garden', 'Robot Garden', 2024, 'A robot learns to grow tomatoes.', art('#065f46', '#6ee7b7')),
    title('big-sky-ranch', 'Big Sky Ranch', 2018, 'A family runs a ranch for retired racehorses.',
      art('#78350f', '#fcd34d')),
  ],
  classics: [
    title('midnight-line', 'Midnight Express Line', 1958, 'A conductor solves a theft between two stations.',
      art('#1c1917', '#a8a29e')),
    title('hat-in-rome', 'A Hat in Rome', 1961, 'A tourist chases her hat across the city.',
      art('#7c2d12', '#fed7aa')),
    title('dust-thunder', 'Dust and Thunder', 1966, 'Two rival stagecoach drivers share one road.',
      art('#57534e', '#d6d3d1')),
    title('velvet-room', 'The Velvet Room', 1972, 'A jazz club keeps one table free every night.',
      art('#581c87', '#f0abfc')),
    title('harbor-lights', 'Harbor Lights', 1954, 'A lighthouse keeper writes to a stranger.',
      art('#1e40af', '#bfdbfe')),
  ],
};

const HOME: HomeDocument = {
  rows: [
    {
      id: 'continue',
      title: 'Continue watching',
      kind: 'curated',
      items: [
        title('lighthouse', 'The Lighthouse Keeper', 2021, 'One winter on an island with no ferry.',
          art('#0c4a6e', '#f8fafc')),
        title('orbit', 'Orbit of Ash', 2019, 'A cargo pilot finds a passenger she never loaded.',
          art('#18181b', '#f97316')),
        title('salt-silver', 'Salt and Silver', 2022, 'Two chefs share one kitchen and one secret.',
          art('#0f172a', '#cbd5e1')),
      ],
    },
    { id: 'trending', title: 'Trending now', kind: 'set', setId: 'trending' },
    {
      id: 'new',
      title: 'New this week',
      kind: 'curated',
      items: [
        title('copper-sky', 'Copper Sky', 2024, 'A town wakes up under an orange sky.', art('#9a3412', '#fb923c')),
        title('night-market', 'Night Market', 2024, 'Food stalls, one night, twelve stories.', BROKEN),
        title('little-volcano', 'Little Volcano', 2024, 'A volcano that only erupts when it is sad.',
          art('#991b1b', '#fca5a5')),
        title('long-table', 'The Long Table', 2024, 'A wedding dinner where nobody agrees.',
          art('#713f12', '#fef08a')),
        title('static-bloom', 'Static Bloom', 2024, 'A radio host hears flowers on the air.',
          art('#86198f', '#f5d0fe')),
        title('hollow-pines', 'Hollow Pines', 2024, 'Campers find a cabin that was not there yesterday.',
          art('#14532d', '#86efac')),
      ],
    },
    { id: 'docs', title: 'Documentaries', kind: 'set', setId: 'docs' },
    { id: 'family', title: 'Family nights', kind: 'set', setId: 'family' },
    { id: 'classics', title: 'Classics', kind: 'set', setId: 'classics' },
  ],
};

/** Given: the TV's browser is old and has no IntersectionObserver. */
Reflect.deleteProperty(window, 'IntersectionObserver');

const setRequests = new Map<string, number>(Object.keys(SETS).map((setId) => [setId, 0]));
const showSetRequests = () =>
  setRequests.forEach((count, setId) => document.body.setAttribute(`data-set-${setId}`, String(count)));
showSetRequests();

/** Given: the home document, after HOME_DELAY_MS. */
export function fetchHome(): Promise<HomeDocument> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(HOME), HOME_DELAY_MS);
  });
}

/**
 * Given: the titles of one set, after SET_DELAY_MS. It counts the requests for each set on
 * body[data-set-<setId>], such as data-set-docs, so the checks can tell which sets were asked for.
 */
export function fetchSet(setId: string): Promise<Title[]> {
  setRequests.set(setId, (setRequests.get(setId) ?? 0) + 1);
  showSetRequests();
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(SETS[setId] ?? []), SET_DELAY_MS);
  });
}

/** The focused row, and the column the user last chose with Left or Right. */
interface Focus {
  row: number;
  column: number;
}

/** Each arrow as [rows down, tiles across]. */
const ARROWS = new Map<string, [number, number]>([
  ['ArrowUp', [-1, 0]],
  ['ArrowDown', [1, 0]],
  ['ArrowLeft', [0, -1]],
  ['ArrowRight', [0, 1]],
]);
const isBack = (key: string) => key === 'Escape' || key === 'Backspace';
/** Rows from the focused one to this many below it are on screen. */
const ROWS_AHEAD = 2;

function Tile(props: { item: Title; tileRef: (element: HTMLElement | null) => void; onOpen: () => void }) {
  const { item, tileRef, onOpen } = props;
  const [broken, setBroken] = useState(false);
  return (
    <button ref={tileRef} type="button" className="tile" onClick={onOpen}>
      {broken ? (
        <span className="tile-fallback">{item.name}</span>
      ) : (
        <img className="tile-image" src={item.image} alt={item.name} onError={() => setBroken(true)} />
      )}
    </button>
  );
}

export default function App() {
  const [home, setHome] = useState<HomeDocument | null>(null);
  const [sets, setSets] = useState<Record<string, Title[]>>({});
  const [focus, setFocus] = useState<Focus>({ row: 0, column: 0 });
  const [details, setDetails] = useState<Title | null>(null);
  const [detailsButton, setDetailsButton] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const requested = useRef(new Set<string>());
  const elements = useRef(new Map<string, HTMLElement>());
  const refCallbacks = useRef(new Map<string, (element: HTMLElement | null) => void>());

  useEffect(() => {
    fetchHome().then(setHome);
  }, []);

  /** A row's titles, or undefined while it loads; a set that came back empty has nothing to focus either. */
  const itemsOf = (row: HomeRow) => {
    const items = row.kind === 'curated' ? row.items : sets[row.setId];
    return items && items.length > 0 ? items : undefined;
  };

  // Without IntersectionObserver, focus decides what counts as in view: the focused row and the two below it, the
  // rows the remote reaches next.
  useEffect(() => {
    if (!home) return;
    home.rows.slice(focus.row, focus.row + ROWS_AHEAD + 1).forEach((row) => {
      if (row.kind !== 'set' || requested.current.has(row.setId)) return;
      requested.current.add(row.setId);
      fetchSet(row.setId).then((items) => setSets((current) => ({ ...current, [row.setId]: items })));
    });
  }, [home, focus.row]);

  const focusedRow = home ? home.rows[focus.row] : undefined;
  const focusedItems = focusedRow ? itemsOf(focusedRow) : undefined;
  // A shorter row clamps the column for display only; the column itself is kept for the rows after it.
  const focusedIndex = focusedItems ? Math.min(focus.column, focusedItems.length - 1) : -1;
  const focusKey = !home
    ? ''
    : details
      ? `details:${detailsButton}`
      : focusedItems
        ? `${focus.row}:${focusedIndex}`
        : `${focus.row}:placeholder`;

  // Moves DOM focus whenever its target changes, including when a loading row's titles arrive.
  useEffect(() => {
    elements.current.get(focusKey)?.focus();
  }, [focusKey]);

  // One stable callback ref per key, so a render does not detach and reattach every tile.
  const register = (key: string) => {
    let callback = refCallbacks.current.get(key);
    if (!callback) {
      callback = (element: HTMLElement | null) => {
        if (element) elements.current.set(key, element);
        else elements.current.delete(key);
      };
      refCallbacks.current.set(key, callback);
    }
    return callback;
  };

  const openDetails = (row: number, column: number, item: Title) => {
    // Enter opens the focused tile, so the kept column stays; a click elsewhere in the preview moves focus there.
    if (row !== focus.row || column !== focusedIndex) setFocus({ row, column });
    setDetails(item);
    setDetailsButton(0);
    setPlaying(false);
  };

  useEffect(() => {
    if (!home) return;
    const onKeyDown = (event: KeyboardEvent) => {
      // A held key repeats; a repeated Enter would press the button that the first one just focused.
      if (event.key === 'Enter' && event.repeat) {
        event.preventDefault();
        return;
      }
      // A click on empty space drops DOM focus; any key brings it back to the element the state names.
      const target = elements.current.get(focusKey);
      if (target && document.activeElement !== target) target.focus();
      if (details) {
        // The details trap the remote: arrows move between their buttons, and Back closes them.
        const arrow = ARROWS.get(event.key);
        if (isBack(event.key)) {
          event.preventDefault();
          setDetails(null);
        } else if (arrow) {
          event.preventDefault();
          if (arrow[1] !== 0) setDetailsButton(arrow[1] < 0 ? 0 : 1);
        }
        return;
      }
      // An old TV browser goes back a page on Backspace.
      if (event.key === 'Backspace') event.preventDefault();
      const arrow = ARROWS.get(event.key);
      if (!arrow) return;
      event.preventDefault();
      const [down, across] = arrow;
      if (down !== 0) {
        const row = Math.max(0, Math.min(home.rows.length - 1, focus.row + down));
        setFocus({ row, column: focus.column });
      } else if (focusedItems) {
        const column = Math.max(0, Math.min(focusedItems.length - 1, focusedIndex + across));
        // A press against the end of a row moves nothing, so it chooses no column either.
        setFocus({ row: focus.row, column });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [home, details, focus, focusedItems, focusedIndex, focusKey]);

  if (!home) {
    return (
      <main className="home">
        <p className="home-loading" role="status">
          Loading…
        </p>
      </main>
    );
  }

  const onList = details ? watchlist.includes(details.id) : false;
  const toggleWatchlist = (id: string) =>
    setWatchlist((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

  return (
    <main className="home">
      <div className="rows">
        {home.rows.map((row, rowIndex) => {
          const items = itemsOf(row);
          return (
            <section key={row.id} className="row" data-row={row.id}>
              <h2 className="row-title">{row.title}</h2>
              <div className="row-tiles">
                {items ? (
                  items.map((item, column) => (
                    <Tile
                      key={item.id}
                      item={item}
                      tileRef={register(`${rowIndex}:${column}`)}
                      onOpen={() => openDetails(rowIndex, column, item)}
                    />
                  ))
                ) : (
                  <div ref={register(`${rowIndex}:placeholder`)} className="row-placeholder" tabIndex={-1}>
                    {row.kind === 'curated' || sets[row.setId] ? 'No titles' : 'Loading…'}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {details && (
        <div className="details-backdrop" onClick={() => setDetails(null)}>
          <div
            className="details"
            role="dialog"
            aria-modal="true"
            aria-labelledby="details-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="details-title" className="details-title">
              {details.name}
            </h2>
            <p className="details-year">{details.year}</p>
            <p className="details-description">{details.description}</p>
            <div className="details-actions">
              <button
                ref={register('details:0')}
                type="button"
                className="play"
                onClick={() => {
                  setDetailsButton(0);
                  setPlaying(true);
                }}
              >
                Play
              </button>
              <button
                ref={register('details:1')}
                type="button"
                className="watchlist"
                aria-pressed={onList}
                onClick={() => {
                  setDetailsButton(1);
                  toggleWatchlist(details.id);
                }}
              >
                My list
              </button>
            </div>
            <p className="details-status" role="status">
              {playing ? `Playing ${details.name}` : ''}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

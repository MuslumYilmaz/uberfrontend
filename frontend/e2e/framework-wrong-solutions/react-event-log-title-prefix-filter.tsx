// Wrong (filter): keeps the titles that start with the text, so `open` finds neither door event.
import React, { useState } from 'react';
import './App.css';

export interface BuildingEvent {
  id: string;
  title: string;
  subtitle: string;
  place: string;
  detail: string;
  /** When it happened, in Unix seconds. */
  at: number;
  /** A picture from the camera nearest to the event. */
  image: string;
}

/** The building's time zone: every time on screen is local to it. */
export const TIME_ZONE = 'America/New_York';

function eventImage(title: string, fill: string): string {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">'
    + `<rect width="320" height="180" fill="${fill}"/>`
    + `<text x="160" y="98" fill="#ffffff" font-family="sans-serif" font-size="22" text-anchor="middle">${title}</text>`
    + '</svg>';
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Four events from the building's access log, in the order the log lists them. */
export const EVENTS: BuildingEvent[] = [
  {
    id: 'e1',
    title: 'Door held open',
    subtitle: 'North lobby door',
    place: 'Building A, floor 1',
    detail: 'Held open for 2 min 10 s',
    at: Date.UTC(2026, 2, 14, 13, 5) / 1000,
    image: eventImage('North lobby door', '#1d4ed8'),
  },
  {
    id: 'e2',
    title: 'Badge denied',
    subtitle: 'Server room',
    place: 'Building A, floor 3',
    detail: 'Expired badge, third try',
    at: Date.UTC(2026, 2, 14, 0, 40) / 1000,
    image: eventImage('Server room', '#b91c1c'),
  },
  {
    id: 'e3',
    title: 'Motion after hours',
    subtitle: 'Loading dock',
    place: 'Building B, ground floor',
    detail: 'Two people, no badge scan',
    at: Date.UTC(2026, 0, 14, 5, 12) / 1000,
    image: eventImage('Loading dock', '#047857'),
  },
  {
    id: 'e4',
    title: 'Door forced open',
    subtitle: 'East stairwell',
    place: 'Building B, floor 2',
    detail: 'Alarm cleared by security',
    at: Date.UTC(2026, 2, 14, 16, 58) / 1000,
    image: eventImage('East stairwell', '#7c3aed'),
  },
];

const timeFormat = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, hour: 'numeric', minute: '2-digit', hour12: true });

/** "9:05 am": an event's time of day in the building's time zone. */
function localTime(at: number): string {
  return timeFormat.format(new Date(at * 1000)).replace(/\s+/g, ' ').toLowerCase();
}

export default function App() {
  const [selectedId, setSelectedId] = useState(EVENTS[0].id);
  const [query, setQuery] = useState('');

  const needle = query.trim().toLowerCase();
  const visible = EVENTS.filter((event) => event.title.toLowerCase().startsWith(needle));
  const selected = EVENTS.find((event) => event.id === selectedId) ?? EVENTS[0];

  return (
    <main className="events-screen">
      <section className="preview" aria-label="Selected event">
        <img className="preview-image" src={selected.image} alt={selected.title} />
        <h1 className="preview-title">{selected.title}</h1>
      </section>

      <section className="event-panel" aria-label="Events">
        <label className="filter-field">
          Filter by title
          <input className="filter" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>

        {visible.length === 0 ? (
          <p className="no-events">No events match</p>
        ) : (
          <div className="event-list">
            {visible.map((event) => (
              <button
                key={event.id}
                type="button"
                className="event-row"
                aria-pressed={event.id === selected.id}
                onClick={() => setSelectedId(event.id)}
              >
                <img className="event-thumb" src={event.image} alt="" />
                <span className="event-text">
                  <span className="event-title">{event.title}</span>
                  <span className="event-subtitle">{event.subtitle}</span>
                  <span className="event-meta">{event.place} · {event.detail}</span>
                  <span className="event-time">{localTime(event.at)}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

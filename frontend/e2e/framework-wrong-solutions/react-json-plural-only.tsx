// Wrong (task 3): the summary always says keys or items, even for one.
import React, { useState } from 'react';
import './App.css';

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

/** Three samples to load into the input: an object of primitives, a nested playlist and a deep library. */
export const SAMPLES: Record<string, string> = {
  track: JSON.stringify({ title: 'Night Drive', seconds: 214, explicit: false, album: null }, null, 2),
  playlist: JSON.stringify({
    name: 'Focus',
    owner: { id: 7, name: 'Ada' },
    tracks: [
      { title: 'Night Drive', seconds: 214 },
      { title: 'Low Tide', seconds: 187 },
      { title: 'Signal', seconds: 241 },
    ],
    tags: [],
    meta: {},
  }, null, 2),
  library: JSON.stringify({
    shelves: [{ label: 'Jazz', albums: [{ title: 'Blue', tracks: [{ n: 1, title: 'So What', credits: { bass: 'Paul' } }] }] }],
    count: 1,
  }, null, 2),
};

type Parsed = { ok: true; value: Json } | { ok: false; message: string };

function parse(text: string): Parsed {
  try {
    return { ok: true, value: JSON.parse(text) as Json };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

type Container = Json[] | { [key: string]: Json };

function isContainer(value: Json): value is Container {
  return typeof value === 'object' && value !== null;
}

/** How a primitive reads: strings in quotes, the rest as JSON writes them. */
function show(value: string | number | boolean | null): string {
  return JSON.stringify(value);
}

function summary(value: Container): string {
  if (Array.isArray(value)) return `[…] ${value.length} items`;
  const keys = Object.keys(value).length;
  return `{…} ${keys} keys`;
}

interface NodeProps {
  name?: string;
  value: Json;
  path: string;
  collapsed: ReadonlySet<string>;
  onToggle: (path: string) => void;
}

/** One key or index with its value; a container renders its entries by calling itself. */
function JsonNode({ name, value, path, collapsed, onToggle }: NodeProps) {
  const key = name === undefined ? null : <span className="json-key">{name}</span>;
  if (!isContainer(value)) {
    return (
      <li className="json-entry" data-path={path}>
        {key}
        <span className="json-value">{show(value)}</span>
      </li>
    );
  }
  const entries: [string, Json, string][] = Array.isArray(value)
    ? value.map((item, index) => [String(index), item, `${path}[${index}]`])
    : Object.entries(value).map(([child, item]) => [child, item, `${path}.${child}`]);
  if (entries.length === 0) {
    return (
      <li className="json-entry" data-path={path}>
        {key}
        <span className="json-value">{Array.isArray(value) ? '[]' : '{}'}</span>
      </li>
    );
  }
  const open = !collapsed.has(path);
  return (
    <li className="json-entry" data-path={path}>
      <button type="button" className="json-toggle" aria-expanded={open} aria-label={name ?? 'root'} onClick={() => onToggle(path)}>
        {open ? '▾' : '▸'}
      </button>
      {key}
      {open ? (
        <ul className="json-children">
          {entries.map(([child, item, childPath]) => (
            <JsonNode key={child} name={child} value={item} path={childPath} collapsed={collapsed} onToggle={onToggle} />
          ))}
        </ul>
      ) : (
        <span className="json-summary">{summary(value)}</span>
      )}
    </li>
  );
}

export default function App() {
  const [text, setText] = useState(SAMPLES.track);
  // Collapsed nodes by path, so a node keeps its state while the JSON around it changes.
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());

  const toggle = (path: string) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const parsed = parse(text);

  return (
    <main className="json-page">
      <label className="field">
        Sample
        <select className="sample" defaultValue="track" onChange={(event) => setText(SAMPLES[event.target.value])}>
          <option value="track">Track</option>
          <option value="playlist">Playlist</option>
          <option value="library">Library</option>
        </select>
      </label>
      <label className="field">
        JSON
        <textarea className="json-input" rows={10} value={text} onChange={(event) => setText(event.target.value)} />
      </label>
      {'message' in parsed ? (
        <p className="json-error" role="alert">Invalid JSON: {parsed.message}</p>
      ) : (
        <ul className="json-viewer" aria-label="JSON tree">
          <JsonNode value={parsed.value} path="$" collapsed={collapsed} onToggle={toggle} />
        </ul>
      )}
    </main>
  );
}

// Wrong (task 4 left as the brief describes it): the refresh handler reloads the live export whatever the select
// says, so a refresh on the legacy export loses the skipped line and the legacy rows.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

export type DeliveryStatus = 'delivered' | 'failed' | 'pending';

export interface Delivery {
  id: string;
  endpoint: string;
  status: DeliveryStatus;
  attempts: number;
  lastAttempt: string;
}

export type Source = 'live' | 'legacy' | 'empty' | 'error';
export type StatusFilter = 'all' | DeliveryStatus;

/** Six deliveries from the live export. */
export const LIVE: Delivery[] = [
  { id: 'd1', endpoint: 'https://shop.example/hooks/orders', status: 'delivered', attempts: 1, lastAttempt: '2026-11-18T09:12:00Z' },
  { id: 'd2', endpoint: 'https://crm.example/webhooks/contacts', status: 'failed', attempts: 3, lastAttempt: '2026-11-18T09:10:30Z' },
  { id: 'd3', endpoint: 'https://billing.example/events', status: 'pending', attempts: 1, lastAttempt: '2026-11-18T09:14:05Z' },
  { id: 'd4', endpoint: 'https://ops.example/alerts', status: 'delivered', attempts: 1, lastAttempt: '2026-11-18T09:01:44Z' },
  { id: 'd5', endpoint: 'https://shop.example/hooks/refunds', status: 'failed', attempts: 2, lastAttempt: '2026-11-18T08:58:12Z' },
  { id: 'd6', endpoint: 'https://analytics.example/ingest', status: 'delivered', attempts: 1, lastAttempt: '2026-11-18T08:40:00Z' }
];

/** The legacy export: the same shape in most records, two of them malformed. */
export const LEGACY_RAW: unknown[] = [
  { id: 'd2', endpoint: 'https://crm.example/webhooks/contacts', status: 'failed', attempts: 3, lastAttempt: '2026-11-17T18:10:30Z' },
  { id: 'd7', endpoint: 'https://legacy.example/hooks/orders', status: 'ok', attempts: 1, lastAttempt: '2026-11-17T18:09:00Z' },
  { id: 'd3', endpoint: 'https://billing.example/events', status: 'pending', attempts: 1, lastAttempt: '2026-11-17T18:04:05Z' },
  { id: 'd4', endpoint: 'https://ops.example/alerts', status: 'delivered', attempts: 1, lastAttempt: '2026-11-17T17:51:44Z' },
  { id: 'd8', endpoint: 'https://legacy.example/hooks/invoices', status: 'failed', attempts: '2', lastAttempt: '2026-11-17T17:49:00Z' },
  { id: 'd5', endpoint: 'https://shop.example/hooks/refunds', status: 'failed', attempts: 2, lastAttempt: '2026-11-17T17:38:12Z' },
  { id: 'd6', endpoint: 'https://analytics.example/ingest', status: 'delivered', attempts: 1, lastAttempt: '2026-11-17T17:20:00Z' },
  { id: 'd9', endpoint: 'https://legacy.example/hooks/receipts', status: 'delivered', attempts: 1, lastAttempt: '2026-11-17T17:02:00Z' }
];

let failNextRequest = false;

/** Mock API, treat it as given: it answers after 400 ms. "Fail next request" makes the next request reject once. */
export function armFailure(): void {
  failNextRequest = true;
}

export function fetchDeliveries(source: Source): Promise<unknown> {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (failNextRequest) {
        failNextRequest = false;
        reject(new Error('Gateway timeout'));
        return;
      }
      if (source === 'error') {
        reject(new Error('Gateway timeout'));
        return;
      }
      if (source === 'empty') {
        resolve([]);
        return;
      }
      if (source === 'legacy') {
        resolve(LEGACY_RAW.map((record) => (typeof record === 'object' && record !== null ? { ...record } : record)));
        return;
      }
      resolve(LIVE.map((delivery) => ({ ...delivery })));
    }, 400);
  });
}

/** Mock API: a retry answers after 200 ms and the endpoint accepts the delivery. */
export function retryDelivery(delivery: Delivery): Promise<Delivery> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      resolve({ ...delivery, status: 'delivered', attempts: delivery.attempts + 1, lastAttempt: new Date().toISOString() });
    }, 200);
  });
}

const STATUSES: readonly DeliveryStatus[] = ['delivered', 'failed', 'pending'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isDeliveryStatus(value: unknown): value is DeliveryStatus {
  return typeof value === 'string' && (STATUSES as readonly string[]).includes(value);
}

/** Narrow the raw payload: keep every well-formed record, count the rest. */
export function parseDeliveries(raw: unknown): { deliveries: Delivery[]; skipped: number } {
  if (!Array.isArray(raw)) {
    return { deliveries: [], skipped: 0 };
  }
  const deliveries: Delivery[] = [];
  let skipped = 0;
  for (const record of raw) {
    if (
      isRecord(record) &&
      typeof record.id === 'string' &&
      typeof record.endpoint === 'string' &&
      isDeliveryStatus(record.status) &&
      typeof record.attempts === 'number' &&
      typeof record.lastAttempt === 'string'
    ) {
      deliveries.push({
        id: record.id,
        endpoint: record.endpoint,
        status: record.status,
        attempts: record.attempts,
        lastAttempt: record.lastAttempt
      });
    } else {
      skipped += 1;
    }
  }
  return { deliveries, skipped };
}

type RequestState =
  | { kind: 'loading'; keepRows: boolean }
  | { kind: 'ready' }
  | { kind: 'empty' }
  | { kind: 'error'; message: string; keepRows: boolean };

export default function App() {
  const [source, setSource] = useState<Source>('live');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [request, setRequest] = useState<RequestState>({ kind: 'loading', keepRows: false });
  const latestRequest = useRef(0);
  const rowCount = useRef(0);
  rowCount.current = deliveries.length;

  // One request at a time counts: the newest. A refresh keeps the rows on screen; a source change does not.
  function runRequest(nextSource: Source, kind: 'initial' | 'refresh') {
    const requestId = latestRequest.current + 1;
    latestRequest.current = requestId;
    const keepRows = kind === 'refresh' && rowCount.current > 0;
    setRequest({ kind: 'loading', keepRows });
    if (!keepRows) {
      setDeliveries([]);
      setSkipped(0);
    }
    fetchDeliveries(nextSource)
      .then((raw) => {
        if (requestId !== latestRequest.current) return;
        const parsed = parseDeliveries(raw);
        setDeliveries(parsed.deliveries);
        setSkipped(parsed.skipped);
        setRequest(parsed.deliveries.length > 0 ? { kind: 'ready' } : { kind: 'empty' });
      })
      .catch((error: unknown) => {
        if (requestId !== latestRequest.current) return;
        const message = error instanceof Error ? error.message : 'Unknown error';
        setRequest({ kind: 'error', message, keepRows });
      });
  }

  useEffect(() => {
    runRequest(source, 'initial');
    return () => {
      latestRequest.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  // The refresh handler reads source from the current render, so it never reloads a stale source.
  function handleRefresh() {
    runRequest('live', 'refresh');
  }

  function handleRetryRequest() {
    runRequest(source, request.kind === 'error' && request.keepRows ? 'refresh' : 'initial');
  }

  function handleRetryDelivery(delivery: Delivery) {
    setDeliveries((current) => current.map((item) => (item.id === delivery.id ? { ...item, status: 'pending' } : item)));
    retryDelivery(delivery).then((updated) => {
      setDeliveries((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    });
  }

  const visible = useMemo(
    () => (filter === 'all' ? deliveries : deliveries.filter((delivery) => delivery.status === filter)),
    [deliveries, filter]
  );

  const loading = request.kind === 'loading';
  const countLine = filter === 'all' ? `${deliveries.length} deliveries` : `${visible.length} of ${deliveries.length} deliveries`;

  return (
    <main className="main">
      <section className="card">
        <header className="header">
          <h1 className="title">Webhook Deliveries</h1>
          <p className="subtitle">Load the deliveries, type the payload, filter and retry, then fix the refresh.</p>
        </header>

        <div className="toolbar">
          <label className="label" htmlFor="source">Data source</label>
          <select id="source" className="source" value={source} onChange={(event) => setSource(event.target.value as Source)}>
            <option value="live">Live export</option>
            <option value="legacy">Legacy export</option>
            <option value="empty">Empty export</option>
            <option value="error">Failing export</option>
          </select>
          <label className="label" htmlFor="status-filter">Status</label>
          <select
            id="status-filter"
            className="status-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value as StatusFilter)}
          >
            <option value="all">All</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
          <button type="button" className="refresh" onClick={handleRefresh} disabled={loading}>
            Refresh
          </button>
          <button type="button" className="fail-next" onClick={armFailure}>
            Fail next request
          </button>
        </div>

        <div className="status-line" aria-live="polite">
          {request.kind === 'loading' && (
            <span className="status--loading">{request.keepRows ? 'Refreshing deliveries…' : 'Loading deliveries…'}</span>
          )}
          {request.kind === 'error' && (
            <span className="status--error" role="alert">
              {request.keepRows ? 'Could not refresh the deliveries:' : 'Could not load the deliveries:'} {request.message}{' '}
              <button type="button" className="retry" onClick={handleRetryRequest}>
                Retry
              </button>
            </span>
          )}
          {request.kind === 'empty' && <span className="empty">No deliveries</span>}
          {deliveries.length > 0 && <span className="count">{countLine}</span>}
          {skipped > 0 && <span className="skipped">{skipped} records skipped</span>}
        </div>

        {visible.length > 0 && (
          <div className="table-scroll">
            <table className="deliveries">
              <thead>
                <tr>
                  <th scope="col">Endpoint</th>
                  <th scope="col">Status</th>
                  <th scope="col">Attempts</th>
                  <th scope="col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((delivery) => (
                  <tr key={delivery.id} className={`row row--${delivery.status}`}>
                    <td className="endpoint">{delivery.endpoint}</td>
                    <td className={`status status--${delivery.status}`}>{delivery.status}</td>
                    <td className="attempts">{delivery.attempts}</td>
                    <td className="actions">
                      {delivery.status === 'failed' && (
                        <button type="button" className="retry-delivery" onClick={() => handleRetryDelivery(delivery)}>
                          Retry delivery
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

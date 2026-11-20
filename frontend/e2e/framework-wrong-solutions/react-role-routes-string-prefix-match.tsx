import React, { createContext, useContext, useEffect, useState } from 'react';
import './App.css';

export type Role = 'viewer' | 'support' | 'lead' | 'admin';
export type Permission =
  | 'tickets:read'
  | 'refunds:read'
  | 'refunds:write'
  | 'users:read'
  | 'users:write'
  | 'settings:write'
  | 'audit:read';

/** Given: what each role may do. */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  viewer: ['tickets:read'],
  support: ['tickets:read', 'refunds:read', 'users:read'],
  lead: ['tickets:read', 'refunds:read', 'refunds:write', 'users:read'],
  admin: [
    'tickets:read',
    'refunds:read',
    'refunds:write',
    'users:read',
    'users:write',
    'settings:write',
    'audit:read',
  ],
};

export interface RouteDef {
  /** A path pattern. A segment that starts with ":" matches any one segment, such as the 42 of /tickets/42. */
  path: string;
  title: string;
  /** The page's name: its key in PAGES and in the load counters. */
  page: string;
  /** What a user needs to open the page; null means any signed-in user. */
  permission: Permission | null;
  /** The page has a sidebar link. */
  nav?: boolean;
  /** For a page below a sidebar link, that link's path. */
  section?: string;
}

/** Given: every page of the console. /sign-in is not in it: anyone may open it. */
export const ROUTES: readonly RouteDef[] = [
  { path: '/', title: 'Dashboard', page: 'dashboard', permission: null, nav: true },
  { path: '/tickets', title: 'Tickets', page: 'tickets', permission: 'tickets:read', nav: true },
  { path: '/tickets/:id', title: 'Ticket', page: 'ticket', permission: 'tickets:read', section: '/tickets' },
  { path: '/refunds', title: 'Refunds', page: 'refunds', permission: 'refunds:read', nav: true },
  { path: '/refunds/new', title: 'New refund', page: 'new-refund', permission: 'refunds:write', section: '/refunds' },
  { path: '/users', title: 'Users', page: 'users', permission: 'users:read', nav: true },
  { path: '/users/:id/edit', title: 'Edit user', page: 'edit-user', permission: 'users:write', section: '/users' },
  { path: '/settings', title: 'Settings', page: 'settings', permission: 'settings:write', nav: true },
  { path: '/audit-log', title: 'Audit log', page: 'audit-log', permission: 'audit:read', nav: true },
];

export interface Session {
  userId: number;
  name: string;
  role: Role;
}

/** Time each call to the fake server takes, in ms. */
export const SERVER_DELAY_MS = 500;

const SESSION_KEY = 'console-session';
const accounts: Session[] = [
  { userId: 1, name: 'Ana', role: 'admin' },
  { userId: 2, name: 'Sam', role: 'support' },
  { userId: 3, name: 'Vic', role: 'viewer' },
  { userId: 4, name: 'Lee', role: 'lead' },
];
const readStoredUser = () => {
  try {
    return Number(localStorage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
};
const storeUser = (userId: number | null) => {
  try {
    if (userId === null) localStorage.removeItem(SESSION_KEY);
    else localStorage.setItem(SESSION_KEY, String(userId));
  } catch {
    // The preview may have no storage; the session then lasts until it reloads.
  }
};
const roleOf = (userId: number | null) => accounts.find((candidate) => candidate.userId === userId)?.role ?? null;
let signedInUser = readStoredUser();
/** The role the session carries; a saved change reaches it 2 × SERVER_DELAY_MS after the save. */
let sessionRole = roleOf(signedInUser);
const sessionListeners = new Set<(session: Session | null) => void>();
const currentSession = (): Session | null => {
  const account = accounts.find((candidate) => candidate.userId === signedInUser);
  return account && sessionRole ? { userId: account.userId, name: account.name, role: sessionRole } : null;
};
const tellSessionListeners = () => {
  const session = currentSession();
  sessionListeners.forEach((listener) => listener(session));
};
const later = <T,>(work: () => T) =>
  new Promise<T>((resolve) => {
    window.setTimeout(() => resolve(work()), SERVER_DELAY_MS);
  });

/** Given: the session the server remembers for this browser, or null when nobody is signed in. */
export function fetchSession(): Promise<Session | null> {
  return later(currentSession);
}

/** Given: signs in as a demo account, tells every onSessionChange listener, then resolves with the session. */
export function signIn(userId: number): Promise<Session | null> {
  return later(() => {
    signedInUser = userId;
    sessionRole = roleOf(userId);
    storeUser(userId);
    tellSessionListeners();
    return currentSession();
  });
}

/** Given: signs out, then tells every onSessionChange listener. */
export function signOut(): Promise<void> {
  return later(() => {
    signedInUser = null;
    sessionRole = null;
    storeUser(null);
    tellSessionListeners();
  });
}

/**
 * Given: saves a user's role. When that user is the one signed in, the session picks the new role up
 * 2 × SERVER_DELAY_MS after the save resolves, as when a token is refreshed, and then tells every onSessionChange
 * listener; until then fetchSession still reports the old role.
 */
export function updateUserRole(userId: number, role: Role): Promise<void> {
  return later(() => {
    const account = accounts.find((candidate) => candidate.userId === userId);
    if (!account) return;
    account.role = role;
    if (userId !== signedInUser) return;
    window.setTimeout(() => {
      if (userId !== signedInUser) return;
      sessionRole = role;
      tellSessionListeners();
    }, 2 * SERVER_DELAY_MS);
  });
}

/** Given: the demo accounts with their current roles. */
export function getAccounts(): Session[] {
  return accounts.map((account) => ({ ...account }));
}

/**
 * Given: calls the listener with the new session (null when signed out) whenever the signed-in user or their role
 * changes, and returns a function that stops it. body[data-session-listeners] shows how many listeners are active.
 */
export function onSessionChange(listener: (session: Session | null) => void): () => void {
  sessionListeners.add(listener);
  document.body.dataset.sessionListeners = String(sessionListeners.size);
  return () => {
    sessionListeners.delete(listener);
    document.body.dataset.sessionListeners = String(sessionListeners.size);
  };
}

export type LocationState = Record<string, string> | null;

export interface Location {
  path: string;
  state: LocationState;
  /** A new key for every entry, even when the path repeats. */
  key: number;
}

/**
 * Given: an in-memory history that stands in for the browser's, because the preview has no address bar. push adds
 * an entry after the current one, replace swaps the current entry, back returns to the previous one. It starts at /.
 * body[data-history-listeners] shows how many listeners are active.
 */
const entries: Location[] = [{ path: '/', state: null, key: 0 }];
let currentEntry = 0;
let nextKey = 1;
const historyListeners = new Set<() => void>();
const tellHistoryListeners = () => historyListeners.forEach((listener) => listener());
export const history = {
  getLocation: (): Location => entries[currentEntry],
  canGoBack: () => currentEntry > 0,
  push: (path: string, state: LocationState = null) => {
    entries.splice(currentEntry + 1, entries.length, { path, state, key: nextKey++ });
    currentEntry = entries.length - 1;
    tellHistoryListeners();
  },
  replace: (path: string, state: LocationState = null) => {
    entries[currentEntry] = { path, state, key: nextKey++ };
    tellHistoryListeners();
  },
  back: () => {
    if (currentEntry === 0) return;
    currentEntry -= 1;
    tellHistoryListeners();
  },
  listen: (listener: () => void) => {
    historyListeners.add(listener);
    document.body.dataset.historyListeners = String(historyListeners.size);
    return () => {
      historyListeners.delete(listener);
      document.body.dataset.historyListeners = String(historyListeners.size);
    };
  },
};

/** Given: the current history entry; the component renders again when it changes. */
export function useLocation(): Location {
  const [location, setLocation] = useState(history.getLocation);
  useEffect(() => {
    // Catches an entry added between the first render and this subscription.
    setLocation(history.getLocation());
    return history.listen(() => setLocation(history.getLocation()));
  }, []);
  return location;
}

export interface LinkProps {
  to: string;
  className?: string;
  children?: React.ReactNode;
  'aria-current'?: 'page';
  'aria-label'?: string;
}

/** Given: a link that opens its page through history.push instead of loading a new document. */
export function Link({ to, children, ...rest }: LinkProps) {
  return (
    <a
      {...rest}
      href={to}
      onClick={(event) => {
        event.preventDefault();
        history.push(to);
      }}
    >
      {children}
    </a>
  );
}

/** Given: the preview's address bar. Type a path and press Enter or Go to open it; ← goes back. */
export function AddressBar() {
  const location = useLocation();
  const [draft, setDraft] = useState(location.path);
  // Shows each new entry's path; set during render, so nothing resets what was typed before the first effects run.
  const [shownKey, setShownKey] = useState(location.key);
  if (shownKey !== location.key) {
    setShownKey(location.key);
    setDraft(location.path);
  }
  const open = () => {
    const path = draft.trim();
    if (path.startsWith('/')) history.push(path);
  };
  return (
    <div className="address-bar">
      <button
        type="button"
        className="back"
        aria-label="Back"
        disabled={!history.canGoBack()}
        onClick={history.back}
      >
        ←
      </button>
      <input
        className="address"
        aria-label="Address"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') open();
        }}
      />
      <button type="button" className="go" onClick={open}>
        Go
      </button>
    </div>
  );
}

/**
 * Given: stands in for loading a page's data. Each page calls it once, first thing; it counts the page's loads on
 * body[data-loads-<page>], such as data-loads-settings, so the checks can tell which pages rendered.
 */
const pageLoads = new Map<string, number>(ROUTES.map((route) => [route.page, 0]));
const showPageLoads = () =>
  pageLoads.forEach((count, page) => document.body.setAttribute(`data-loads-${page}`, String(count)));
showPageLoads();
document.body.dataset.sessionListeners = '0';
document.body.dataset.historyListeners = '0';
export function usePageLoad(page: string) {
  useEffect(() => {
    pageLoads.set(page, (pageLoads.get(page) ?? 0) + 1);
    showPageLoads();
  }, [page]);
}

interface PageProps {
  params: Record<string, string>;
}

type SessionState = { status: 'loading' } | { status: 'ready'; session: Session | null };

/** One rule for the sidebar, the pages' own links and the guard; with nobody signed in, nothing is allowed. */
const can = (session: Session | null, permission: Permission | null) =>
  session !== null && (permission === null || ROLE_PERMISSIONS[session.role].includes(permission));

const SessionContext = createContext<SessionState>({ status: 'loading' });
const NoticeContext = createContext<(title: string) => void>(() => undefined);
const useCan = () => {
  const state = useContext(SessionContext);
  return (permission: Permission) => can(state.status === 'ready' ? state.session : null, permission);
};

/** Compares whole segments as they are: /refunds/new is not /refunds, and /users-export or /tickets/ is no page. */
function matchRoute(path: string): { route: RouteDef; params: Record<string, string> } | null {
  const segments = path.split('/').slice(1);
  for (const route of ROUTES) {
    if (!route.path.includes(':') && route.path !== '/' && path.startsWith(route.path)) return { route, params: {} };
    const pattern = route.path.split('/').slice(1);
    if (pattern.length !== segments.length) continue;
    const params: Record<string, string> = {};
    const matches = pattern.every((part, index) => {
      if (!part.startsWith(':')) return part === segments[index];
      params[part.slice(1)] = segments[index];
      return segments[index] !== '';
    });
    if (matches) return { route, params };
  }
  return null;
}

/** Replaces the current entry after the commit and before the browser paints, so Back skips the page it refused. */
function Redirect({ to, from, denied }: { to: string; from?: string; denied?: string }) {
  const showNotice = useContext(NoticeContext);
  React.useLayoutEffect(() => {
    history.replace(to, from === undefined ? null : { from });
    // After the replace, whose history listener has just cleared any older notice.
    if (denied !== undefined) showNotice(denied);
  }, [to, from, denied, showNotice]);
  return null;
}

function SessionLoading() {
  return (
    <p className="page-loading" role="status">
      Loading your session…
    </p>
  );
}

/** Every page goes through here. It waits for the session, and a refused page never renders or loads its data. */
function RequireAccess(props: { route: RouteDef | null; path: string; children: React.ReactNode }) {
  const { route, path, children } = props;
  const state = useContext(SessionContext);
  if (state.status === 'loading') return <SessionLoading />;
  if (state.session === null) return <Redirect to="/sign-in" from={path} />;
  if (route && !can(state.session, route.permission)) return <Redirect to="/" denied={route.title} />;
  return <>{children}</>;
}

/** /sign-in waits for the session too; a signed-in user goes where this entry points, or to the Dashboard. */
function SignInRoute({ from }: { from?: string }) {
  const state = useContext(SessionContext);
  if (state.status !== 'ready') return <SessionLoading />;
  if (state.session) return <Redirect to={from ?? '/'} />;
  return <SignInPage />;
}

export default function App() {
  const location = useLocation();
  const [state, setState] = useState<SessionState>({ status: 'loading' });
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const stop = onSessionChange((session) => setState({ status: 'ready', session }));
    fetchSession().then((session) => {
      if (active) setState({ status: 'ready', session });
    });
    return () => {
      active = false;
      stop();
    };
  }, []);

  // Any navigation, Back included, ends the notice; a refusing redirect sets it again right after its replace.
  useEffect(() => history.listen(() => setNotice(null)), []);

  const session = state.status === 'ready' ? state.session : null;
  const match = matchRoute(location.path);
  const current = match ? (match.route.section ?? match.route.path) : null;

  const Page = match ? PAGES[match.route.page] : NotFoundPage;
  const content =
    location.path === '/sign-in' ? (
      <SignInRoute from={location.state?.from} />
    ) : (
      <RequireAccess route={match ? match.route : null} path={location.path}>
        {notice && (
          <p className="access-notice" role="status">
            You don't have access to the {notice} page.
          </p>
        )}
        <Page key={location.path} params={match ? match.params : {}} />
      </RequireAccess>
    );

  return (
    <SessionContext.Provider value={state}>
      <NoticeContext.Provider value={setNotice}>
        <div className="console">
          <AddressBar />
          <header className="topbar">
            <span className="brand">Support console</span>
            {session && (
              <>
                <span className="account">
                  {session.name} · {session.role}
                </span>
                <button type="button" className="sign-out" onClick={() => signOut()}>
                  Sign out
                </button>
              </>
            )}
          </header>
          <div className="frame">
            <nav className="sidebar" aria-label="Sections">
              {ROUTES.filter((route) => route.nav && can(session, route.permission)).map((route) => (
                <Link
                  key={route.path}
                  className="nav-link"
                  to={route.path}
                  aria-current={route.path === current ? 'page' : undefined}
                >
                  {route.title}
                </Link>
              ))}
            </nav>
            <main className="content">{content}</main>
          </div>
        </div>
      </NoticeContext.Provider>
    </SessionContext.Provider>
  );
}

const TICKETS = [
  { id: '41', subject: 'Card declined twice' },
  { id: '42', subject: 'Refund not received' },
  { id: '43', subject: 'Cannot change email' },
];

function DashboardPage() {
  usePageLoad('dashboard');
  return (
    <section className="page">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-text">12 open tickets · 3 refunds waiting</p>
    </section>
  );
}

function TicketsPage() {
  usePageLoad('tickets');
  return (
    <section className="page">
      <h1 className="page-title">Tickets</h1>
      <ul className="list">
        {TICKETS.map((ticket) => (
          <li key={ticket.id}>
            <Link className="ticket-link" to={`/tickets/${ticket.id}`}>
              #{ticket.id} {ticket.subject}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TicketPage({ params }: PageProps) {
  usePageLoad('ticket');
  const ticket = TICKETS.find((candidate) => candidate.id === params.id);
  return (
    <section className="page">
      <h1 className="page-title">Ticket {params.id}</h1>
      <p className="page-text">{ticket ? ticket.subject : 'No ticket has this number.'}</p>
    </section>
  );
}

function RefundsPage() {
  usePageLoad('refunds');
  const allowed = useCan();
  return (
    <section className="page">
      <h1 className="page-title">Refunds</h1>
      {allowed('refunds:write') && (
        <Link className="new-refund" to="/refunds/new">
          New refund
        </Link>
      )}
      <ul className="list">
        <li>R-1007 · 24.00 · waiting</li>
        <li>R-1006 · 310.50 · approved</li>
      </ul>
    </section>
  );
}

function NewRefundPage() {
  usePageLoad('new-refund');
  return (
    <section className="page">
      <h1 className="page-title">New refund</h1>
      <p className="page-text">Pick a ticket and an amount.</p>
    </section>
  );
}

function UsersPage() {
  usePageLoad('users');
  const allowed = useCan();
  return (
    <section className="page">
      <h1 className="page-title">Users</h1>
      <ul className="list">
        {getAccounts().map((account) => (
          <li key={account.userId}>
            {account.name} · {account.role}{' '}
            {allowed('users:write') && (
              <Link className="edit-user" to={`/users/${account.userId}/edit`} aria-label={`Edit ${account.name}`}>
                Edit
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function EditUserPage({ params }: PageProps) {
  usePageLoad('edit-user');
  const account = getAccounts().find((candidate) => String(candidate.userId) === params.id);
  const [role, setRole] = useState<Role>(account ? account.role : 'viewer');
  const [saved, setSaved] = useState(false);
  if (!account) {
    return (
      <section className="page">
        <h1 className="page-title">No user {params.id}</h1>
      </section>
    );
  }
  return (
    <section className="page">
      <h1 className="page-title">Edit {account.name}</h1>
      <label className="field">
        Role
        <select className="role-select" value={role} onChange={(event) => setRole(event.target.value as Role)}>
          <option value="viewer">viewer</option>
          <option value="support">support</option>
          <option value="lead">lead</option>
          <option value="admin">admin</option>
        </select>
      </label>
      <button
        type="button"
        className="save-role"
        onClick={() => updateUserRole(account.userId, role).then(() => setSaved(true))}
      >
        Save
      </button>
      {saved && (
        <p className="page-text" role="status">
          Saved.
        </p>
      )}
    </section>
  );
}

function SettingsPage() {
  usePageLoad('settings');
  return (
    <section className="page">
      <h1 className="page-title">Settings</h1>
      <p className="page-text">Refund limit per agent: 500.00</p>
    </section>
  );
}

function AuditLogPage() {
  usePageLoad('audit-log');
  return (
    <section className="page">
      <h1 className="page-title">Audit log</h1>
      <ul className="list">
        <li>Ana changed the refund limit</li>
        <li>Sam replied to ticket 42</li>
      </ul>
    </section>
  );
}

function NotFoundPage(_props: PageProps) {
  return (
    <section className="page not-found">
      <h1 className="page-title">Page not found</h1>
    </section>
  );
}

function SignInPage() {
  return (
    <section className="page">
      <h1 className="page-title">Sign in</h1>
      <p className="page-text">Pick a demo account.</p>
      <div className="accounts">
        {getAccounts().map((account) => (
          <button
            key={account.userId}
            type="button"
            className="sign-in-as"
            onClick={() => signIn(account.userId)}
          >
            Sign in as {account.name} ({account.role})
          </button>
        ))}
      </div>
    </section>
  );
}

const PAGES: Record<string, React.FC<PageProps>> = {
  dashboard: DashboardPage,
  tickets: TicketsPage,
  ticket: TicketPage,
  refunds: RefundsPage,
  'new-refund': NewRefundPage,
  users: UsersPage,
  'edit-user': EditUserPage,
  settings: SettingsPage,
  'audit-log': AuditLogPage,
};

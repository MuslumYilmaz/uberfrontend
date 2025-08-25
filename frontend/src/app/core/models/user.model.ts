// --- existing server shape (unchanged) ---
export interface User {
    _id: string;
    username: string;
    email: string;
    bio?: string;
    avatarUrl?: string;
    role: 'user' | 'admin';
    createdAt: string;
    updatedAt: string;
}

// --- app-level enums & helpers ---
export type Tech = 'javascript' | 'angular';
export type DailyItemKind = 'trivia' | 'quiz' | 'coding' | 'debug';
export type RouteLink = any[]; // Angular routerLink tuple

// --- preferences (client + server persisted) ---
export interface UserPrefs {
    timezone?: string;             // e.g. "Europe/Berlin"
    defaultTech?: Tech;            // used to seed daily set
    techs: Tech[];                 // interested stacks (order matters)
    notifications?: { email?: boolean; push?: boolean };
}

// --- streak / xp (lightweight V0) ---
export interface Streak {
    current: number;               // current consecutive days
    longest: number;               // best streak ever
    lastActive?: string;           // ISO date when user last earned streak credit
    lastCompleted?: string;        // ISO date when all daily tiles done
}

export interface XP {
    total: number;                 // lifetime XP
    today?: number;                // XP earned today (resets daily)
}

// --- mastery / spaced repetition (optional in V0, ready for later) ---
export interface MasteryStat {
    score: number;                 // 0..100
    correct?: number;
    wrong?: number;
    lastAnswered?: string;         // ISO
}
export type Mastery = Record<string, MasteryStat>;  // key = topicId | questionId

export interface SRSEntry {
    dueAt: string;                 // ISO next review time
    lastResult?: 'pass' | 'fail';
    repetitions?: number;          // SM-2-ish fields (optional)
    interval?: number;             // days
    easiness?: number;             // 1.3..2.5
}
export type SRSMap = Record<string, SRSEntry>;      // key = itemId

// --- Daily Set (the core of V0) ---
export interface DailyItemState {
    startedAt?: string;            // ISO
    completedAt?: string;          // ISO
    correct?: boolean;             // for auto-graded
    startHash?: string;            // editor snapshot hash (coding/debug)
    endHash?: string;
}

export interface DailyItem {
    id: string;                    // stable id for the picked item
    kind: DailyItemKind;
    to: RouteLink;                 // e.g. ['/', 'javascript', 'trivia', id]
    label: string;                 // short UI text
    auto: boolean;                 // auto-graded? (trivia/quiz = true)
    durationMin: number;           // UI hint
    state?: DailyItemState;        // per-day progress
}

export interface DailySet {
    date: string;                  // YYYY-MM-DD (local day)
    generatedAt: string;           // ISO timestamp
    items: DailyItem[];
    completed?: boolean;           // all items done today?
}

// --- combined client model we’ll use in components/services ---
export interface UserClient {
    server: User | null;           // null for guests
    prefs: UserPrefs;
    streak: Streak;
    xp: XP;
    mastery?: Mastery;
    srs?: SRSMap;
    daily?: DailySet;              // today’s set only (history optional later)
}

// --- auth state wrapper for the header / guards ---
export interface AuthState {
    status: 'anonymous' | 'authenticated';
    user: UserClient;
}

// --- sensible starters ---
export const defaultPrefs = (tz = Intl.DateTimeFormat().resolvedOptions().timeZone): UserPrefs => ({
    timezone: tz,
    defaultTech: 'javascript',
    techs: ['javascript', 'angular'],
});

export const emptyClientUser = (server: User | null = null): UserClient => ({
    server,
    prefs: defaultPrefs(),
    streak: { current: 0, longest: 0 },
    xp: { total: 0, today: 0 },
    mastery: {},
    srs: {},
    daily: undefined,
});

// --- localStorage keys (guest & cache) ---
export const LS_USER_CLIENT = 'uf:user:client';
export const LS_DAILY_PREFIX = 'uf:daily:'; // e.g. uf:daily:2025-08-24

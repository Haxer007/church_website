// ─── Firebase Realtime Database (REST API — no SDK needed) ────────────────────
// Database: https://my-sunday-school-project-default-rtdb.firebaseio.com/

const DB_BASE = 'https://my-sunday-school-project-default-rtdb.firebaseio.com';
const DB_ROOT = '/church'; // all church data lives under /church

export type FirebaseStatus = 'ok' | 'error' | 'offline';

let _status: FirebaseStatus = 'ok';
export function getFirebaseStatus() { return _status; }

function url(path: string) {
  return `${DB_BASE}${DB_ROOT}/${path}.json`;
}

// ─── Read ─────────────────────────────────────────────────────────────────────
export async function fbGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url(path), { cache: 'no-store' });
    if (!res.ok) { _status = 'error'; return fallback; }
    const data = await res.json();
    _status = 'ok';
    return data === null ? fallback : (data as T);
  } catch {
    _status = 'offline';
    return fallback;
  }
}

// ─── Write ────────────────────────────────────────────────────────────────────
export async function fbSet(path: string, value: unknown): Promise<boolean> {
  try {
    const res = await fetch(url(path), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
    });
    if (!res.ok) { _status = 'error'; return false; }
    _status = 'ok';
    return true;
  } catch {
    _status = 'offline';
    return false;
  }
}

// ─── Real-time listener (Server-Sent Events) ──────────────────────────────────
// Firebase REST SSE streams changes at DB_ROOT level
let _eventSource: EventSource | null = null;

export function subscribeToFirebase(onData: (data: Record<string, unknown>) => void): () => void {
  // Close any existing connection
  if (_eventSource) { _eventSource.close(); _eventSource = null; }

  const streamUrl = `${DB_BASE}${DB_ROOT}.json`;

  try {
    const es = new EventSource(streamUrl);
    _eventSource = es;

    es.addEventListener('put', (e: MessageEvent) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg && msg.data) {
          onData(msg.data as Record<string, unknown>);
        }
      } catch { /* ignore parse errors */ }
    });

    es.addEventListener('patch', (e: MessageEvent) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg && msg.data) {
          onData(msg.data as Record<string, unknown>);
        }
      } catch { /* ignore parse errors */ }
    });

    es.onerror = () => {
      _status = 'offline';
      es.close();
      _eventSource = null;
      // Retry after 30s
      setTimeout(() => subscribeToFirebase(onData), 30_000);
    };
  } catch {
    _status = 'offline';
  }

  return () => {
    if (_eventSource) { _eventSource.close(); _eventSource = null; }
  };
}

// ─── Fetch all church data at once ────────────────────────────────────────────
export interface ChurchData {
  announcements: unknown[] | null;
  notifications: unknown[] | null;
  mannaVerses: unknown[] | null;
  verseDays: unknown[] | null;
  translationOverrides: Record<string, unknown> | null;
  announcementMode?: string | null;
  announcementAspectRatio?: string | null;
  heroBackgroundImage?: string | null;
  sectionVisibility?: Record<string, unknown> | null;
}

export async function fetchAllChurchData(): Promise<ChurchData | null> {
  try {
    const res = await fetch(`${DB_BASE}${DB_ROOT}.json`, { cache: 'no-store' });
    if (!res.ok) { _status = 'error'; return null; }
    const data = await res.json();
    _status = 'ok';
    return data as ChurchData;
  } catch {
    _status = 'offline';
    return null;
  }
}

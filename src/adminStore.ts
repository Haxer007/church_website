// ─── Types ────────────────────────────────────────────────────────────────────

export type Language = 'en' | 'ta' | 'kn' | 'te' | 'hi';

export interface Announcement {
  id: string;
  label: string;
  src: string | null; // base64 or URL
  alt: string;
  active: boolean;
  createdAt: number;
}

export interface NotificationBanner {
  id: string;
  type: 'static' | 'fading';
  message: string;
  image?: string | null;  // optional base64/URL image
  active: boolean;
  createdAt: number;
}

export interface MannaVerse {
  verse: string;       // English text (default)
  reference: string;
  reflection: string;
  langs?: Partial<Record<Language, string>>; // per-language verse texts
  verseMode?: 'multilang' | 'english-only'; // display control
}

export interface VerseOfDay {
  verse: string;
  reference: string;
  reflection: string;
  // per-language verse images keyed by date string YYYY-MM-DD
  images: Record<string, Record<Language, string | null>>; // date -> lang -> base64
}

export interface TranslationOverrides {
  [lang: string]: Record<string, string>;
}

export interface SectionVisibility {
  about: boolean;
  announcements: boolean;
  ministries: boolean;
  promisePrayers: boolean;
  dailyManna: boolean;
  manna: boolean; // Mood Manna
  contact: boolean;
}


// ─── Storage Keys ─────────────────────────────────────────────────────────────
const KEYS = {
  ANNOUNCEMENTS: 'admin_announcements',
  NOTIFICATIONS: 'admin_notifications',
  MANNA_VERSES: 'admin_manna_verses',
  VERSE_OF_DAY: 'admin_verse_of_day',
  TRANSLATION_OVERRIDES: 'admin_translation_overrides',
  SEEN_NOTIFICATIONS: 'seen_notification_ids',
  ANNOUNCEMENT_MODE: 'admin_announcement_mode',
  SECTION_VISIBILITY: 'admin_section_visibility',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
import { fbSet } from './firebaseDb';

// Map from localStorage key to Firebase path
const FB_PATH: Record<string, string> = {
  [KEYS.ANNOUNCEMENTS]: 'announcements',
  [KEYS.NOTIFICATIONS]: 'notifications',
  [KEYS.MANNA_VERSES]: 'mannaVerses',
  [KEYS.VERSE_OF_DAY]: 'verseDays',
  [KEYS.TRANSLATION_OVERRIDES]: 'translationOverrides',
  [KEYS.ANNOUNCEMENT_MODE]: 'announcementMode',
  [KEYS.SECTION_VISIBILITY]: 'sectionVisibility',
};

export const LAST_UPDATED_LOCAL_KEY = 'admin_last_updated';

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  const ts = Date.now();
  // 1. Write to localStorage immediately (instant UI update)
  localStorage.setItem(key, JSON.stringify(value));
  localStorage.setItem(LAST_UPDATED_LOCAL_KEY, String(ts));
  // 2. Notify same-tab listeners
  window.dispatchEvent(new CustomEvent('adminDataChanged', { detail: { key } }));
  // 3. Write to Firebase in background (remote viewers see it live)
  const fbPath = FB_PATH[key];
  if (fbPath) {
    fbSet(fbPath, value).then(() => {
      // Also update the timestamp on Firebase so remote clients detect stale cache
      fbSet('lastUpdated', ts);
    }).catch(() => {
      console.warn('[Firebase] Write failed for', fbPath, '— data saved locally only');
    });
  }
}

export function ensureArray<T>(val: unknown): T[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') {
    return Object.values(val) as T[];
  }
  return [];
}

// ─── Announcements ────────────────────────────────────────────────────────────
export function getAnnouncements(): Announcement[] {
  return ensureArray<Announcement>(load(KEYS.ANNOUNCEMENTS, []));
}
export function saveAnnouncements(list: Announcement[]) {
  save(KEYS.ANNOUNCEMENTS, list);
}

// ─── Notifications ────────────────────────────────────────────────────────────
export function getNotifications(): NotificationBanner[] {
  return ensureArray<NotificationBanner>(load(KEYS.NOTIFICATIONS, []));
}
export function saveNotifications(list: NotificationBanner[]) {
  save(KEYS.NOTIFICATIONS, list);
}
export function getSeenNotificationIds(): string[] {
  return ensureArray<string>(load(KEYS.SEEN_NOTIFICATIONS, []));
}
export function markNotificationSeen(id: string) {
  const seen = getSeenNotificationIds();
  if (!seen.includes(id)) {
    save(KEYS.SEEN_NOTIFICATIONS, [...seen, id]);
  }
}

// ─── Daily Manna Verses ───────────────────────────────────────────────────────
export function getMannaVerses(): MannaVerse[] {
  return ensureArray<MannaVerse>(load(KEYS.MANNA_VERSES, []));
}
export function saveMannaVerses(list: MannaVerse[]) {
  save(KEYS.MANNA_VERSES, list);
}

// ─── Verse of Day ─────────────────────────────────────────────────────────────
// Stored as array, keyed by date
export type VerseDayEntry = {
  date: string; // YYYY-MM-DD
  verses: Partial<Record<Language, MannaVerse>>;
  images: Partial<Record<Language, string | null>>;
};
export function getVerseDays(): VerseDayEntry[] {
  return ensureArray<VerseDayEntry>(load(KEYS.VERSE_OF_DAY, []));
}
export function saveVerseDays(list: VerseDayEntry[]) {
  save(KEYS.VERSE_OF_DAY, list);
}
export function getVerseDayForDate(date: string): VerseDayEntry | null {
  return getVerseDays().find(v => v.date === date) ?? null;
}


// ─── Translation Overrides ────────────────────────────────────────────────────
export function getTranslationOverrides(): TranslationOverrides {
  return load<TranslationOverrides>(KEYS.TRANSLATION_OVERRIDES, {});
}
export function saveTranslationOverrides(overrides: TranslationOverrides) {
  save(KEYS.TRANSLATION_OVERRIDES, overrides);
}

export const ADMIN_PASSWORD_HASH =
  '5e04a5d6b9e1b7e1e1f1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1'; // placeholder, computed at runtime

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(input: string): Promise<boolean> {
  const inputHash = await hashPassword(input);
  const correctHash = '40f1891d149df1cdb4000a98dacc69fd9b184fa633e812a20f3874a1397f5243';
  return inputHash === correctHash;
}

// ─── Announcement Display Mode ───────────────────────────────────────────────────────────────
// 'merge' = show new announcements alongside existing default ones (default)
// 'replace' = new announcements replace existing default ones
export type AnnouncementMode = 'merge' | 'replace';
export function getAnnouncementMode(): AnnouncementMode {
  return load<AnnouncementMode>(KEYS.ANNOUNCEMENT_MODE, 'merge');
}
export function saveAnnouncementMode(mode: AnnouncementMode) {
  save(KEYS.ANNOUNCEMENT_MODE, mode);
}

// ─── Section Visibility ────────────────────────────────────────────────────────
const DEFAULT_VISIBILITY: SectionVisibility = {
  about: true,
  announcements: true,
  ministries: true,
  promisePrayers: true,
  dailyManna: true,
  manna: true,
  contact: true,
};

export function getSectionVisibility(): SectionVisibility {
  return { ...DEFAULT_VISIBILITY, ...load<Partial<SectionVisibility>>(KEYS.SECTION_VISIBILITY, {}) };
}

export function saveSectionVisibility(visibility: SectionVisibility) {
  save(KEYS.SECTION_VISIBILITY, visibility);
}


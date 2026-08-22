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
  frequency: 'once' | 'every-visit'; // 'once' = never show again after dismiss; 'every-visit' = show on each page load
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

export interface MapLinks {
  sundayVenue: string;
  mainChurch: string;
  hosaRoadBranch: string;
}

export interface EventItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string;
  venue: string;
  description: string;
  image?: string | null;
  category?: string;
  active: boolean;
  createdAt: number;
}

export interface SectionVisibility {
  about: boolean;
  announcements: boolean;
  ministries: boolean;
  promisePrayers: boolean;
  dailyManna: boolean;
  manna: boolean; // Mood Manna
  contact: boolean;
  showEmojis?: boolean;
  showThemeToggle?: boolean;
  showFontSizeToggle?: boolean;
  showStayConnectedBanner?: boolean;
  showMannaCaption?: boolean;
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
  MAP_LINKS: 'admin_map_links',
  ANNOUNCEMENT_ASPECT_RATIO: 'admin_announcement_aspect_ratio',
  HERO_BACKGROUND_IMAGE: 'admin_hero_background_image',
  HIDE_ANNOUNCEMENT_TEXT: 'admin_hide_announcement_text',
  EVENTS: 'admin_events',
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
  [KEYS.MAP_LINKS]: 'mapLinks',
  [KEYS.ANNOUNCEMENT_ASPECT_RATIO]: 'announcementAspectRatio',
  [KEYS.HERO_BACKGROUND_IMAGE]: 'heroBackgroundImage',
  [KEYS.HIDE_ANNOUNCEMENT_TEXT]: 'hideAnnouncementText',
  [KEYS.EVENTS]: 'events',
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

/** IDs dismissed this session only (for 'every-visit' notifications) */
const SESSION_DISMISSED_KEY = 'session_dismissed_notifications';
export function getSessionDismissedIds(): string[] {
  try {
    const raw = sessionStorage.getItem(SESSION_DISMISSED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
export function markSessionDismissed(id: string) {
  const ids = getSessionDismissedIds();
  if (!ids.includes(id)) {
    sessionStorage.setItem(SESSION_DISMISSED_KEY, JSON.stringify([...ids, id]));
  }
}

export function markNotificationSeen(id: string, frequency: 'once' | 'every-visit' = 'once') {
  if (frequency === 'every-visit') {
    markSessionDismissed(id);
  } else {
    const seen = getSeenNotificationIds();
    if (!seen.includes(id)) {
      save(KEYS.SEEN_NOTIFICATIONS, [...seen, id]);
    }
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

// ─── Section Visibility & Display Settings ────────────────────────────────────
const DEFAULT_VISIBILITY: SectionVisibility = {
  about: true,
  announcements: true,
  ministries: true,
  promisePrayers: true,
  dailyManna: true,
  manna: false, // Default hidden per user request, toggleable in admin panel
  contact: true,
  showEmojis: false,            // Default clean typography (no emojis)
  showThemeToggle: false,       // Default single theme
  showFontSizeToggle: false,    // Default clean header
  showStayConnectedBanner: false,// Default hidden stay connected banner
  showMannaCaption: false,       // Default hidden extra manna caption
};

export function getSectionVisibility(): SectionVisibility {
  return { ...DEFAULT_VISIBILITY, ...load<Partial<SectionVisibility>>(KEYS.SECTION_VISIBILITY, {}) };
}

export function saveSectionVisibility(visibility: SectionVisibility) {
  save(KEYS.SECTION_VISIBILITY, visibility);
}

// ─── Map Links ────────────────────────────────────────────────────────────────
export const DEFAULT_MAP_LINKS: MapLinks = {
  sundayVenue: "https://maps.app.goo.gl/QuRYUhwUz341j8hTA",
  mainChurch: "https://www.google.com/maps/search/?api=1&query=22%20Maruthi%20Nagar%20Main%20Rd%20beside%20Amravati%20Hotel%20Zuzuvadi%20BTM%20Layout%20Bengaluru%20560068",
  hosaRoadBranch: "https://maps.app.goo.gl/VG5doU4NchkBvb3Q6",
};

export function getMapLinks(): MapLinks {
  return { ...DEFAULT_MAP_LINKS, ...load<Partial<MapLinks>>(KEYS.MAP_LINKS, {}) };
}

export function saveMapLinks(links: MapLinks) {
  save(KEYS.MAP_LINKS, links);
}

// ─── Announcement Aspect Ratio ──────────────────────────────────────────────────
export type AspectRatio = '16:9' | '4:3' | '9:16';

export function getAnnouncementAspectRatio(): AspectRatio {
  return load<AspectRatio>(KEYS.ANNOUNCEMENT_ASPECT_RATIO, '16:9');
}
export function saveAnnouncementAspectRatio(ratio: AspectRatio) {
  save(KEYS.ANNOUNCEMENT_ASPECT_RATIO, ratio);
}

// ─── Hero Background Image ──────────────────────────────────────────────────────
export function getHeroBackgroundImage(): string | null {
  return load<string | null>(KEYS.HERO_BACKGROUND_IMAGE, null);
}
export function saveHeroBackgroundImage(image: string | null) {
  save(KEYS.HERO_BACKGROUND_IMAGE, image);
}

// ─── Hide Announcement Text ──────────────────────────────────────────────────────
export function getHideAnnouncementText(): boolean {
  return load<boolean>(KEYS.HIDE_ANNOUNCEMENT_TEXT, false);
}
export function saveHideAnnouncementText(hide: boolean) {
  save(KEYS.HIDE_ANNOUNCEMENT_TEXT, hide);
}

// ─── Events & Calendar ────────────────────────────────────────────────────────
export const DEFAULT_EVENTS: EventItem[] = [];

export function getEvents(): EventItem[] {
  const loaded = load<EventItem[]>(KEYS.EVENTS, []);
  // Filter out any legacy hardcoded default items that had incorrect date mappings
  const legacyIds = new Set(['default-promise-prayer', 'default-fasting-prayer', 'default-youth-meeting', 'default-healing-service']);
  return ensureArray<EventItem>(loaded).filter(e => !legacyIds.has(e.id));
}

export function saveEvents(list: EventItem[]) {
  save(KEYS.EVENTS, list);
}

// ─── Recurring Event Generator ────────────────────────────────────────────────
// Auto-generates events for any month matching the exact Ministry schedule.
export function getRecurringEventInstances(year: number, month: number): EventItem[] {
  const daysInMon = new Date(year, month + 1, 0).getDate();
  const results: EventItem[] = [];

  for (let day = 1; day <= daysInMon; day++) {
    const dateObj = new Date(year, month, day);
    const weekday = dateObj.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // 1st Day of Month -> Promise Prayer Service
    if (day === 1) {
      results.push({
        id: `rec-promise-prayer-${dateStr}`,
        title: 'Promise Prayer Service',
        date: dateStr,
        time: '5:00 AM – 6:30 AM',
        venue: 'Zion AG Church Main Sanctuary, Madiwala',
        description: 'Begin each month in God’s presence. The promise word of the month is shared through the man of God.',
        image: './images/church-hero.webp',
        category: 'Promise Prayer',
        active: true,
        createdAt: 0,
      });
    }

    // Every Sunday (weekday 0) -> Sunday Worship & Healing Service
    if (weekday === 0) {
      results.push({
        id: `rec-sunday-worship-${dateStr}`,
        title: 'Sunday Worship & Healing Service',
        date: dateStr,
        time: '8:00 AM & 9:30 AM (Healing Service 7:30 PM)',
        venue: 'Dharmaram Auditorium / Main Sanctuary',
        description: 'Our Lord is a miracle-working God. Join us for Sunday worship and dedicated healing service.',
        image: './images/church-hero.webp',
        category: 'Worship',
        active: true,
        createdAt: 0,
      });
    }

    // Every Wednesday (weekday 3) -> Bible Study
    if (weekday === 3) {
      results.push({
        id: `rec-bible-study-${dateStr}`,
        title: 'Bible Study (Online)',
        date: dateStr,
        time: '7:00 PM (Online)',
        venue: 'Google Meet',
        description: 'Well-trained and certified scholars teach the truth on Google Meet. We help people think, question, and grow.',
        image: './images/church-hero.webp',
        category: 'Prayer',
        active: true,
        createdAt: 0,
      });
    }

    // Every Saturday (weekday 6) -> Fasting Prayer & Youth Fellowship
    if (weekday === 6) {
      results.push({
        id: `rec-fasting-prayer-${dateStr}`,
        title: 'Fasting & Prayer Service',
        date: dateStr,
        time: '10:00 AM – 12:00 PM',
        venue: 'Zion AG Church Main Sanctuary, Madiwala',
        description: 'Fasting prayer to help people overcome barriers. As Esther’s story shows — prayer can break any barrier.',
        image: './announcement_images/fasting_prayer.jpeg',
        category: 'Prayer',
        active: true,
        createdAt: 0,
      });

      results.push({
        id: `rec-youth-meeting-${dateStr}`,
        title: 'Youth Fellowship Gathering',
        date: dateStr,
        time: '7:00 PM – 8:30 PM',
        venue: 'Zion AG Youth Hall, Madiwala',
        description: 'Fun-filled activities, mentorship, and Bible teaching to help youth overcome everyday life barriers.',
        image: './announcement_images/yout_meeting.jpeg',
        category: 'Youth',
        active: true,
        createdAt: 0,
      });
    }
  }

  return results;
}

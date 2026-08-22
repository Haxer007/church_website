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
export const DEFAULT_EVENTS: EventItem[] = [
  {
    id: 'default-promise-prayer',
    title: 'Promise Prayer Service',
    date: '2026-08-01',
    time: '5:00 AM - 6:30 AM',
    venue: 'Zion AG Church Main Sanctuary, Madiwala',
    description: 'Start every month in the presence of God. The promise word of the month is shared through the man of God.',
    image: './images/church-hero.webp',
    category: 'Promise Prayer',
    active: true,
    createdAt: Date.now(),
  },
  {
    id: 'default-fasting-prayer',
    title: 'Fasting & Prayer Service',
    date: '2026-08-14',
    time: '10:00 AM - 1:00 PM',
    venue: 'Zion AG Church Main Sanctuary, Madiwala',
    description: 'Join us for a powerful time of seeking God in fasting, prayer, and intercessory worship.',
    image: './announcement_images/fasting_prayer.jpeg',
    category: 'Prayer',
    active: true,
    createdAt: Date.now(),
  },
  {
    id: 'default-youth-meeting',
    title: 'Youth Fellowship Gathering',
    date: '2026-08-22',
    time: '5:30 PM - 7:30 PM',
    venue: 'Zion AG Youth Hall, Madiwala',
    description: 'An energetic gathering of young believers for worship, spiritual growth, fellowship, and discussion.',
    image: './announcement_images/yout_meeting.jpeg',
    category: 'Youth',
    active: true,
    createdAt: Date.now(),
  },
  {
    id: 'default-healing-service',
    title: 'Sunday Worship & Healing Service',
    date: '2026-08-10',
    time: '8:00 AM & 9:30 AM',
    venue: 'Dharmaram Auditorium, Christ University College',
    description: 'Experience God’s presence, miracle power, healing, and worship together as a church family.',
    image: './images/church-hero.webp',
    category: 'Worship',
    active: true,
    createdAt: Date.now(),
  },
];

export function getEvents(): EventItem[] {
  const loaded = load<EventItem[]>(KEYS.EVENTS, []);
  if (loaded.length === 0) return DEFAULT_EVENTS;
  const DEFAULT_IDS = new Set(DEFAULT_EVENTS.map(e => e.id));
  // If all stored events are only default IDs (user hasn't added custom events yet),
  // return the fresh DEFAULT_EVENTS so updated dates always show.
  const isOnlyDefaults = loaded.every(e => DEFAULT_IDS.has(e.id));
  if (isOnlyDefaults) return DEFAULT_EVENTS;
  return ensureArray<EventItem>(loaded);
}

export function saveEvents(list: EventItem[]) {
  save(KEYS.EVENTS, list);
}

// ─── Recurring Event Templates ────────────────────────────────────────────────
// These auto-generate for any month viewed on the calendar.
// dayOfMonth: fixed day (1 = 1st of month)
// weekday: 0=Sun, 1=Mon, … 6=Sat
// weekOfMonth: 1=first occurrence, 2=second, 3=third, 4=fourth

interface RecurringTemplate {
  id: string;
  title: string;
  dayOfMonth?: number;
  weekday?: number;
  weekOfMonth?: number;
  time: string;
  venue: string;
  description: string;
  image: string;
  category: string;
}

const RECURRING_TEMPLATES: RecurringTemplate[] = [
  {
    id: 'rec-promise-prayer',
    title: 'Promise Prayer Service',
    dayOfMonth: 1,
    time: '5:00 AM – 6:30 AM',
    venue: 'Zion AG Church Main Sanctuary, Madiwala',
    description: 'Start every month in the presence of God. The promise word of the month is shared through the man of God.',
    image: './images/church-hero.webp',
    category: 'Promise Prayer',
  },
  {
    id: 'rec-fasting-prayer',
    title: 'Fasting & Prayer Service',
    weekday: 4, // Thursday
    weekOfMonth: 2,
    time: '10:00 AM – 1:00 PM',
    venue: 'Zion AG Church Main Sanctuary, Madiwala',
    description: 'Join us for a powerful time of seeking God in fasting, prayer, and intercessory worship.',
    image: './announcement_images/fasting_prayer.jpeg',
    category: 'Prayer',
  },
  {
    id: 'rec-youth-meeting',
    title: 'Youth Fellowship Gathering',
    weekday: 6, // Saturday
    weekOfMonth: 4,
    time: '5:30 PM – 7:30 PM',
    venue: 'Zion AG Youth Hall, Madiwala',
    description: 'An energetic gathering of young believers for worship, spiritual growth, fellowship, and discussion.',
    image: './announcement_images/yout_meeting.jpeg',
    category: 'Youth',
  },
  {
    id: 'rec-sunday-worship',
    title: 'Sunday Worship & Healing Service',
    weekday: 0, // Sunday
    weekOfMonth: 2,
    time: '8:00 AM & 9:30 AM',
    venue: 'Dharmaram Auditorium, Christ University College',
    description: "Experience God's presence, miracle power, healing, and worship together as a church family.",
    image: './images/church-hero.webp',
    category: 'Worship',
  },
];

/** Returns the calendar-day (1-based) of the nth occurrence of weekday in the given month, or -1 if it doesn't exist. */
function getNthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): number {
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMon = new Date(year, month + 1, 0).getDate();
  const day = 1 + ((weekday - firstDayOfMonth + 7) % 7) + (n - 1) * 7;
  return day <= daysInMon ? day : -1;
}

/**
 * Generates recurring event instances for a given year/month.
 * These are merged with stored events in the calendar view.
 */
export function getRecurringEventInstances(year: number, month: number): EventItem[] {
  const daysInMon = new Date(year, month + 1, 0).getDate();
  const results: EventItem[] = [];

  for (const tmpl of RECURRING_TEMPLATES) {
    let day = -1;

    if (tmpl.dayOfMonth !== undefined) {
      day = tmpl.dayOfMonth <= daysInMon ? tmpl.dayOfMonth : -1;
    } else if (tmpl.weekday !== undefined && tmpl.weekOfMonth !== undefined) {
      day = getNthWeekdayOfMonth(year, month, tmpl.weekday, tmpl.weekOfMonth);
    }

    if (day < 1) continue;

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    results.push({
      id: `${tmpl.id}-${dateStr}`,
      title: tmpl.title,
      date: dateStr,
      time: tmpl.time,
      venue: tmpl.venue,
      description: tmpl.description,
      image: tmpl.image,
      category: tmpl.category,
      active: true,
      createdAt: 0,
    });
  }

  return results;
}

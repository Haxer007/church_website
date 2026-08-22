import { useState, useEffect, useRef } from "react";
import { translations, Language } from "./translations";
import { AddToCalendarButton } from 'add-to-calendar-button-react';
import NotificationsContainer from "./NotificationsContainer";
import {
  getAnnouncements, getNotifications, getMannaVerses, getVerseDays, getTranslationOverrides,
  getAnnouncementMode, getSectionVisibility,
  getAnnouncementAspectRatio, getHeroBackgroundImage, ensureArray, getMapLinks,
  getHideAnnouncementText, getEvents, getRecurringEventInstances,
  Announcement, NotificationBanner, MannaVerse, VerseDayEntry, TranslationOverrides, AnnouncementMode, SectionVisibility, MapLinks, AspectRatio, EventItem,
  LAST_UPDATED_LOCAL_KEY,
} from "./adminStore";
import { fetchAllChurchData, subscribeToFirebase } from "./firebaseDb";
import { MOOD_MANNA_DATA, MoodVerse } from "./moodManna";

interface MoodCategory {
  key: string;
  label: string;
  emoji: string;
  group: 'comfort' | 'wisdom';
}

const MOOD_CATEGORIES: MoodCategory[] = [
  // Comfort / Hard Times group
  { key: 'anxiety', label: 'Anxiety & Worry', emoji: '😰', group: 'comfort' },
  { key: 'depressed', label: 'Depression / Downcast', emoji: '😢', group: 'comfort' },
  { key: 'pain_sickness', label: 'Sickness & Pain', emoji: '🤒', group: 'comfort' },
  { key: 'fear', label: 'Fear & Courage', emoji: '😨', group: 'comfort' },
  { key: 'stress', label: 'Stress & Pressure', emoji: '🤯', group: 'comfort' },
  { key: 'failure', label: 'Experiencing Failure', emoji: '❌', group: 'comfort' },
  { key: 'temptation', label: 'Temptation & Desires', emoji: '🔥', group: 'comfort' },
  { key: 'peer_pressure', label: 'Peer Pressure', emoji: '👥', group: 'comfort' },
  { key: 'addiction', label: 'Overcoming Addiction', emoji: '⛓️', group: 'comfort' },
  { key: 'adultery', label: 'Purity & Commitment', emoji: '💔', group: 'comfort' },
  { key: 'friends_fail', label: 'When Friends Fail', emoji: '🥀', group: 'comfort' },
  { key: 'away_from_god', label: 'Feeling Away from God', emoji: '☁️', group: 'comfort' },
  { key: 'abortion', label: 'Comfort & Healing', emoji: '❤️', group: 'comfort' },

  // Hope / Wisdom group
  { key: 'peace', label: 'Peace & Comfort', emoji: '🕊️', group: 'wisdom' },
  { key: 'future', label: 'Future & Guidance', emoji: '🌅', group: 'wisdom' },
  { key: 'relationships', label: 'Godly Relationships', emoji: '🤝', group: 'wisdom' },
  { key: 'forgiveness', label: 'Forgiveness & Grace', emoji: '✨', group: 'wisdom' },
];


const mapsLink = "https://maps.app.goo.gl/QuRYUhwUz341j8hTA";
const youtubeLiveLink = "https://www.youtube.com/@ZionAGChurchMadiwala/streams";
const whatsappNumber = "917760404798";
const emailAddress = "info@zionagchurch.co.in";

const getNavigation = (t: any) => [
  { label: t.navHome, href: "#home" },
  { label: t.navAnnouncements, href: "#announcements" },
  { label: t.navMinistries, href: "#ministries" },
  { label: t.navDailyManna, href: "#daily-manna" },
  { label: t.navAbout, href: "#about" },
  { label: t.connectWithUs || t.navConnectWithUs || "Connect With Us", href: "#contact" },
];

const getMinistries = (t: any) => [
  {
    name: t.minHealingName,
    emoji: "🙌",
    description: t.minHealingDesc,
    time: t.minHealingTime,
  },
  {
    name: t.minFastingName,
    emoji: "🕊️",
    description: t.minFastingDesc,
    time: t.minFastingTime,
  },
  {
    name: t.minBibleName,
    emoji: "📖",
    description: t.minBibleDesc,
    time: t.minBibleTime,
  },
  {
    name: t.minKidsName,
    emoji: "👧",
    description: t.minKidsDesc,
    time: t.minKidsTime,
  },
  {
    name: t.minTeensName,
    emoji: "🧑‍🤝‍🧑",
    description: t.minTeensDesc,
    time: t.minTeensTime,
  },
  {
    name: t.minYouthName,
    emoji: "⚡",
    description: t.minYouthDesc,
    time: t.minYouthTime,
  },
  {
    name: t.minWomenName,
    emoji: "🌸",
    description: t.minWomenDesc,
    time: t.minWomenTime,
  },
  {
    name: t.minPromiseName,
    emoji: "🌅",
    description: t.minPromiseDesc,
    time: t.minPromiseTime,
  },
];

const getContactLocations = (t: any, mapLinks: MapLinks) => [
  {
    name: t.mainChurch,
    address: ["22, Maruthi Nagar Main Rd", "beside Amravati Hotel, Zuzuvadi", "BTM Layout, Bengaluru - 560068"],
    link: mapLinks.mainChurch,
    action: t.openMaps,
  },
  {
    name: t.sundayVenue,
    address: ["Christ University College", "Dharmaram Auditorium", "Hosur Road - 560029"],
    link: mapLinks.sundayVenue,
    action: t.getDirections,
  },
  {
    name: t.hosaRoadBranch,
    address: ["324, Hosa Rd, Akshaya Layout", "Sai Sree Layout, Rayasandra", "Bengaluru - 560100"],
    link: mapLinks.hosaRoadBranch,
    action: t.openMaps,
  },
];

function ExternalLink({ href, children, variant = "light" }: { href: string; children: React.ReactNode; variant?: "light" | "dark" }) {
  const styles =
    variant === "dark"
      ? "bg-[#223328] dark:bg-[#2a3f32] text-white hover:bg-[#31483a] focus:ring-[#223328]/20"
      : "bg-[#f6d49b] text-[#24342b] hover:bg-[#ffe2ad] focus:ring-white";

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 ${styles}`}
    >
      {children}
    </a>
  );
}

const defaultDailyMannaVerses = [
  {
    verse: '"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."',
    reference: "Jeremiah 29:11",
    reflection: "No matter how uncertain today feels, God's blueprint for your life is filled with hope, peace, and ultimate prosperity. Trust His timing.",
  },
  {
    verse: '"The Lord is my strength and my shield; my heart trusts in him, and he helps me."',
    reference: "Psalm 28:7",
    reflection: "Begin today with trust. The same God who hears your prayer gives strength for every step ahead. You do not walk alone.",
  },
  {
    verse: '"But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint."',
    reference: "Isaiah 40:31",
    reflection: "When you feel drained, waiting on God is not a passive pause—it is a spiritual recharge. Let Him lift your burdens today.",
  },
  {
    verse: '"I can do all this through him who gives me strength."',
    reference: "Philippians 4:13",
    reflection: "Your abilities may have limits, but Christ’s power within you is infinite. Lean on His strength for whatever challenges you face today.",
  },
  {
    verse: '"Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid."',
    reference: "John 14:27",
    reflection: "The peace God offers isn’t just the absence of conflict—it’s a deep, unshakeable assurance that He is in control. Breathe in His peace.",
  }
];
const defaultAnnouncementPosters = [
  { src: './announcement_images/carecells.jpeg', alt: 'Care Cells', label: 'Care Cells' },
  { src: './announcement_images/fasting_prayer.jpeg', alt: 'Fasting & Prayer', label: 'Fasting & Prayer' },
  { src: './announcement_images/girls_fellowship.jpeg', alt: 'Girls Fellowship', label: 'Girls Fellowship' },
  { src: './announcement_images/half_night_prayer.jpeg', alt: 'Half Night Prayer', label: 'Half Night Prayer' },
  { src: './announcement_images/kids_bible_club.jpeg', alt: 'Kids Bible Club', label: 'Kids Bible Club' },
  { src: './announcement_images/yout_meeting.jpeg', alt: 'Youth Meeting', label: 'Youth Meeting' },
];


const getUpcomingFirstOfMonthData = () => {
  const now = new Date();
  let year = now.getFullYear();
  let targetMonth = now.getMonth() + 1;
  if (now.getDate() > 1 || (now.getDate() === 1 && now.getHours() >= 6)) {
    targetMonth += 1;
  }
  if (targetMonth > 12) {
    targetMonth = 1;
    year += 1;
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthName = monthNames[targetMonth - 1];

  const yStr = year.toString();
  const mStr = targetMonth.toString().padStart(2, '0');

  return {
    dates: `${yStr}${mStr}01T050000/${yStr}${mStr}01T060000`,
    startDate: `${yStr}-${mStr}-01`,
    endDate: `${yStr}-${mStr}-01`,
    startTime: "05:00",
    endTime: "06:00",
    title: `Promise Prayer for Month of ${monthName} - Zion AG Church`,
    location: "22, Maruthi Nagar Main Rd, beside Amravati Hotel, Zuzuvadi, BTM Layout, Bengaluru - 560068"
  };
};


const DarkFluidBackground = () => (
  <div className="pointer-events-none absolute inset-0 hidden dark:block overflow-hidden mix-blend-screen opacity-70">
    <div className="absolute top-[10%] left-[10%] h-[50vw] w-[50vw] max-h-[400px] max-w-[400px] rounded-full bg-[#d8b14c]/10 blur-[100px] animate-fluid-1" />
    <div className="absolute bottom-[10%] right-[10%] h-[60vw] w-[60vw] max-h-[500px] max-w-[500px] rounded-full bg-[#9a6b31]/10 blur-[120px] animate-fluid-2" />
    <div className="absolute top-[40%] left-[40%] h-[40vw] w-[40vw] max-h-[300px] max-w-[300px] rounded-full bg-[#f6d49b]/5 blur-[80px] animate-fluid-3" />
    <div className="absolute top-[20%] left-[30%] h-2 w-2 rounded-full bg-[#d8b14c]/40 blur-[1px] animate-particle-1" />
    <div className="absolute top-[60%] left-[70%] h-3 w-3 rounded-full bg-[#d8b14c]/30 blur-[2px] animate-particle-2" />
    <div className="absolute top-[80%] left-[20%] h-2 w-2 rounded-full bg-[#9a6b31]/50 blur-[1px] animate-particle-3" />
    <div className="absolute top-[30%] left-[80%] h-4 w-4 rounded-full bg-[#f6d49b]/20 blur-[2px] animate-particle-4" />
  </div>
);

const getUpcomingMonthFirstDay = () => {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const yyyy = nextMonth.getFullYear();
  const mm = String(nextMonth.getMonth() + 1).padStart(2, '0');
  const dd = '01';
  return `${yyyy}-${mm}-${dd}`;
};

export default function App() {
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('churchLang') as Language) || 'en');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => localStorage.getItem('churchTheme') === 'dark');
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem("churchFontSize");
    return saved ? Number(saved) : 100;
  });

  // ─── Reactive admin data (Firebase-first, localStorage fallback) ──────────────
  function readLocalAdminData() {
    return {
      announcements: getAnnouncements().filter(a => a.active) as Announcement[],
      notifications: getNotifications() as NotificationBanner[],
      mannaVerses: getMannaVerses() as MannaVerse[],
      translationOverrides: getTranslationOverrides() as TranslationOverrides,
      verseDays: getVerseDays() as VerseDayEntry[],
      announcementMode: getAnnouncementMode() as AnnouncementMode,
      sectionVisibility: getSectionVisibility() as SectionVisibility,
      mapLinks: getMapLinks() as MapLinks,
      announcementAspectRatio: getAnnouncementAspectRatio() as AspectRatio,
      heroBackgroundImage: getHeroBackgroundImage() as string | null,
      hideAnnouncementText: getHideAnnouncementText() as boolean,
      events: getEvents().filter(e => e.active) as EventItem[],
    };
  }

  const [adminData, setAdminData] = useState(readLocalAdminData);
  const [firebaseLoaded, setFirebaseLoaded] = useState(false);

  // Merge incoming Firebase data snapshot into state
  function applyFirebaseSnapshot(raw: Record<string, unknown> | null) {
    if (!raw) return;
    setAdminData(prev => ({
      announcements: raw.announcements !== undefined ? ensureArray<Announcement>(raw.announcements).filter(a => a.active) : prev.announcements,
      notifications: raw.notifications !== undefined ? ensureArray<NotificationBanner>(raw.notifications) : prev.notifications,
      mannaVerses: raw.mannaVerses !== undefined ? ensureArray<MannaVerse>(raw.mannaVerses) : prev.mannaVerses,
      translationOverrides: raw.translationOverrides !== undefined && typeof raw.translationOverrides === 'object' ? raw.translationOverrides as TranslationOverrides : prev.translationOverrides,
      verseDays: raw.verseDays !== undefined ? ensureArray<VerseDayEntry>(raw.verseDays) : prev.verseDays,
      sectionVisibility: raw.sectionVisibility !== undefined && typeof raw.sectionVisibility === 'object' ? raw.sectionVisibility as SectionVisibility : prev.sectionVisibility,
      announcementMode: raw.announcementMode !== undefined ? raw.announcementMode as AnnouncementMode : prev.announcementMode,
      mapLinks: raw.mapLinks !== undefined && typeof raw.mapLinks === 'object' ? raw.mapLinks as MapLinks : prev.mapLinks,
      announcementAspectRatio: raw.announcementAspectRatio !== undefined ? raw.announcementAspectRatio as AspectRatio : prev.announcementAspectRatio,
      heroBackgroundImage: raw.heroBackgroundImage !== undefined ? raw.heroBackgroundImage as string | null : prev.heroBackgroundImage,
      hideAnnouncementText: raw.hideAnnouncementText !== undefined ? Boolean(raw.hideAnnouncementText) : prev.hideAnnouncementText,
      events: raw.events !== undefined ? ensureArray<EventItem>(raw.events).filter(e => e.active) : prev.events,
    }));
    // Also update localStorage cache so admin panel shows latest data
    if (raw.announcements) localStorage.setItem('admin_announcements', JSON.stringify(raw.announcements));
    if (raw.notifications) localStorage.setItem('admin_notifications', JSON.stringify(raw.notifications));
    if (raw.mannaVerses) localStorage.setItem('admin_manna_verses', JSON.stringify(raw.mannaVerses));
    if (raw.translationOverrides) localStorage.setItem('admin_translation_overrides', JSON.stringify(raw.translationOverrides));
    if (raw.verseDays) localStorage.setItem('admin_verse_of_day', JSON.stringify(raw.verseDays));
    if (raw.sectionVisibility) localStorage.setItem('admin_section_visibility', JSON.stringify(raw.sectionVisibility));
    if (raw.mapLinks) localStorage.setItem('admin_map_links', JSON.stringify(raw.mapLinks));
    if (raw.announcementMode) localStorage.setItem('admin_announcement_mode', JSON.stringify(raw.announcementMode));
    if (raw.announcementAspectRatio) localStorage.setItem('admin_announcement_aspect_ratio', JSON.stringify(raw.announcementAspectRatio));
    if (raw.heroBackgroundImage !== undefined) localStorage.setItem('admin_hero_background_image', JSON.stringify(raw.heroBackgroundImage));
    if (raw.hideAnnouncementText !== undefined) localStorage.setItem('admin_hide_announcement_text', JSON.stringify(raw.hideAnnouncementText));
    if (raw.events) localStorage.setItem('admin_events', JSON.stringify(raw.events));

    // Dispatch event so same-tab listeners like NotificationsContainer refresh immediately
    window.dispatchEvent(new CustomEvent('adminDataChanged'));
  }

  const ADMIN_LS_KEYS = [
    'admin_announcements', 'admin_notifications', 'admin_manna_verses',
    'admin_verse_of_day', 'admin_translation_overrides', 'admin_section_visibility',
    'admin_map_links', 'admin_announcement_mode', 'admin_announcement_aspect_ratio', 'admin_hero_background_image',
    'admin_hide_announcement_text', 'admin_events',
  ];


  useEffect(() => {
    // 1. Initial fetch from Firebase with lastUpdated cache-bust check
    fetchAllChurchData().then(data => {
      if (data) {
        const fbLastUpdated = (data as any).lastUpdated as number | undefined;
        const localLastUpdated = Number(localStorage.getItem(LAST_UPDATED_LOCAL_KEY) || 0);

        if (fbLastUpdated && fbLastUpdated !== localLastUpdated) {
          // 🔄 Timestamps differ — flush stale localStorage and re-sync from Firebase
          console.log('[Sync] Firebase is newer — flushing localStorage cache and syncing');
          ADMIN_LS_KEYS.forEach(k => localStorage.removeItem(k));
          localStorage.setItem(LAST_UPDATED_LOCAL_KEY, String(fbLastUpdated));
        }
        applyFirebaseSnapshot(data as unknown as Record<string, unknown>);
      }
      setFirebaseLoaded(true);
    });

    // 2. Subscribe to Firebase SSE for real-time updates (works across all devices)
    const unsubFirebase = subscribeToFirebase(applyFirebaseSnapshot);

    // 3. Also listen to same-tab admin events and cross-tab localStorage events
    function refreshLocal() { setAdminData(readLocalAdminData()); }
    window.addEventListener('adminDataChanged', refreshLocal);
    window.addEventListener('storage', refreshLocal);

    return () => {
      unsubFirebase();
      window.removeEventListener('adminDataChanged', refreshLocal);
      window.removeEventListener('storage', refreshLocal);
    };
  }, []);

  // Derive display data from reactive adminData
  // Always merge: default posters first, then admin-added announcements on top
  const adminPosters = adminData.announcements.map(a => ({ src: a.src ?? '', alt: a.alt, label: a.label }));
  // 'replace' mode: only show admin announcements (when any exist); 'merge': show defaults + admin together
  console.log(adminData.announcementMode, adminPosters.length)
  const announcementPosters = (adminData.announcementMode === 'replace' && adminPosters.length > 0)
    ? adminPosters
    : [...defaultAnnouncementPosters, ...adminPosters];
  const extendedPosters = [...announcementPosters, ...announcementPosters, ...announcementPosters];


  // Daily Manna: resolve per-language text if available
  const dailyMannaVerses = (adminData.mannaVerses.length > 0 ? adminData.mannaVerses : defaultDailyMannaVerses)
    .map(v => {
      const item = v as any;
      if (item.verseMode === 'english-only' || !item.langs) return v;
      const langText = (item.langs as Record<string, string>)[lang];
      return langText ? { ...v, verse: `"${langText}"` } : v;
    });


  // Merge translation overrides (reactive to lang changes AND admin edits)
  const baseT = translations[lang];
  const langOverrides = adminData.translationOverrides[lang];
  const tRaw = langOverrides ? { ...baseT, ...langOverrides } : baseT;

  // Verse of day for today
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayVerseDay = adminData.verseDays.find(d => d.date === todayStr) ?? null;
  const todayVerse = todayVerseDay?.verses?.[lang] ?? null;
  const todayVerseImage = todayVerseDay?.images?.[lang] ?? null;


  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('churchTheme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('churchTheme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}%`;
  }, [fontSize]);

  const [cachedUrls, setCachedUrls] = useState<Record<string, string>>({});

  // Preload and cache announcement and hero background images in memory as Blob URLs
  useEffect(() => {
    const urls = [
      ...(adminData.heroBackgroundImage ? [adminData.heroBackgroundImage] : []),
      ...announcementPosters.map(p => p.src).filter(Boolean)
    ];

    urls.forEach(src => {
      if (!src) return;
      if (src.startsWith('blob:') || src.startsWith('data:')) return;
      if (cachedUrls[src]) return; // Already cached

      fetch(src)
        .then(res => {
          if (!res.ok) throw new Error('Fetch failed');
          return res.blob();
        })
        .then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          setCachedUrls(prev => ({ ...prev, [src]: blobUrl }));
        })
        .catch(err => {
          console.warn('Failed to cache image in-memory:', src, err);
        });
    });
  }, [announcementPosters, adminData.heroBackgroundImage]);

  const handleFontSizeChange = (newSize: number) => {
    const clamped = Math.max(80, Math.min(130, newSize));
    setFontSize(clamped);
    localStorage.setItem("churchFontSize", String(clamped));
  };

  const [showLangModal, setShowLangModal] = useState<boolean>(() => !localStorage.getItem('churchLang'));
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [lastSelectedService, setLastSelectedService] = useState<'kn' | 'ta' | 'te' | null>(null);
  const serviceDetailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedService) {
      setLastSelectedService(selectedService as 'kn' | 'ta' | 'te');
      const timer = setTimeout(() => {
        serviceDetailsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 520);
      return () => clearTimeout(timer);
    }
  }, [selectedService]);

  const t = tRaw;
  const navItems = [
    { label: t.navHome, href: "#home" },
    ...(adminData.sectionVisibility?.announcements !== false ? [{ label: t.navAnnouncements, href: "#announcements" }] : []),
    ...(adminData.sectionVisibility?.ministries !== false ? [{ label: t.navMinistries, href: "#ministries" }] : []),
    ...(adminData.sectionVisibility?.dailyManna !== false ? [{ label: t.navDailyManna, href: "#daily-manna" }] : []),
    ...(adminData.sectionVisibility?.manna !== false ? [{ label: t.navManna || "Manna", href: "#manna" }] : []),
    { label: t.navPrayerRequest || "Prayer Request", href: "#pray" },
    ...(adminData.sectionVisibility?.contact !== false ? [{ label: t.navContact, href: "#contact" }] : []),
    ...(adminData.sectionVisibility?.about !== false ? [{ label: t.navAbout, href: "#about" }] : []),
  ];
  const upcomingDate = getUpcomingMonthFirstDay();


  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('churchLang', newLang);
    setShowLangModal(false);
    const overridesNow = getTranslationOverrides();
    const baseNow = translations[newLang];
    const merged = overridesNow[newLang] ? { ...baseNow, ...overridesNow[newLang] } : baseNow;
    setToastMessage(merged.changeLangToast);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOfferingOpen, setIsOfferingOpen] = useState(false);
  const [prayerRequest, setPrayerRequest] = useState("");
  const [mannaIndex, setMannaIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const verseRef = useRef<HTMLDivElement>(null);
  const mannaRef = useRef<HTMLElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuToggleButtonRef = useRef<HTMLButtonElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragScrollLeftStart = useRef(0);
  const dragDistance = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    dragStartX.current = e.pageX - carouselRef.current.offsetLeft;
    dragScrollLeftStart.current = carouselRef.current.scrollLeft;
    dragDistance.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - dragStartX.current) * 1.5;
    dragDistance.current = Math.abs(x - dragStartX.current);
    carouselRef.current.scrollLeft = dragScrollLeftStart.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleScroll = () => {
    if (!carouselRef.current) return;
    const scrollLeft = carouselRef.current.scrollLeft;
    const centerPosition = scrollLeft + carouselRef.current.clientWidth / 2;

    let closestIndex = 0;
    let minDistance = Infinity;

    Array.from(carouselRef.current.children).forEach((child, index) => {
      const childCenter = (child as HTMLElement).offsetLeft + child.clientWidth / 2;
      const distance = Math.abs(childCenter - centerPosition);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex((prev) => (prev !== closestIndex ? closestIndex : prev));
  };

  useEffect(() => {
    if (isDragging || selectedImage) return; // Pause carousel when dragging or image is zoomed
    const interval = setInterval(() => {
      if (carouselRef.current && carouselRef.current.children.length > announcementPosters.length) {
        const { scrollLeft } = carouselRef.current;
        const child0 = carouselRef.current.children[0] as HTMLElement;
        const childN = carouselRef.current.children[announcementPosters.length] as HTMLElement;
        const singleSetWidth = childN.offsetLeft - child0.offsetLeft;

        if (scrollLeft >= singleSetWidth * 1.5) {
          carouselRef.current.scrollTo({ left: scrollLeft - singleSetWidth, behavior: "instant" });

          setTimeout(() => {
            if (carouselRef.current) {
              const card = carouselRef.current.children[0] as HTMLElement;
              const shift = card ? card.clientWidth + 24 : 320;
              carouselRef.current.scrollBy({ left: shift, behavior: "smooth" });
            }
          }, 50);
        } else {
          const card = carouselRef.current.children[0] as HTMLElement;
          const shift = card ? card.clientWidth + 24 : 320;
          carouselRef.current.scrollBy({ left: shift, behavior: "smooth" });
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isDragging, selectedImage]);

  const getNewVerse = () => {
    let newIndex = Math.floor(Math.random() * dailyMannaVerses.length);
    if (newIndex === mannaIndex) newIndex = (newIndex + 1) % dailyMannaVerses.length;
    setMannaIndex(newIndex);
  };

  const [selectedMood, setSelectedMood] = useState<string>('');
  const [activeMoodGroup, setActiveMoodGroup] = useState<'comfort' | 'wisdom' | null>(null);
  const [moodVerse, setMoodVerse] = useState<MoodVerse | null>(null);

  const handleMoodChange = (moodKey: string) => {
    setSelectedMood(moodKey);
    if (!moodKey) {
      setMoodVerse(null);
      return;
    }
    const list = MOOD_MANNA_DATA[moodKey];
    if (list && list.length > 0) {
      const randomItem = list[Math.floor(Math.random() * list.length)];
      setMoodVerse(randomItem);
    } else {
      setMoodVerse(null);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        activeMoodGroup &&
        mannaRef.current &&
        !mannaRef.current.contains(event.target as Node) &&
        (!verseRef.current || !verseRef.current.contains(event.target as Node))
      ) {
        setActiveMoodGroup(null);
        setSelectedMood('');
        setMoodVerse(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeMoodGroup]);

  const refreshMoodVerse = () => {
    if (!selectedMood) return;
    const list = MOOD_MANNA_DATA[selectedMood];
    if (list && list.length > 0) {
      let index = Math.floor(Math.random() * list.length);
      if (list.length > 1 && moodVerse) {
        while (list[index].reference === moodVerse.reference) {
          index = Math.floor(Math.random() * list.length);
        }
      }
      setMoodVerse(list[index]);
    }
  };

  useEffect(() => {
    if (moodVerse && verseRef.current) {
      setTimeout(() => {
        verseRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [moodVerse]);


  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (menuToggleButtonRef.current?.contains(target)) {
        return;
      }

      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setIsMenuOpen(false);
        return;
      }

      if (mobileMenuRef.current && mobileMenuRef.current.contains(target)) {
        let current: HTMLElement | null = target;
        let clickedInteractive = false;
        while (current && current !== mobileMenuRef.current) {
          const tagName = current.tagName.toLowerCase();
          if (tagName === 'a' || tagName === 'button' || tagName === 'select' || tagName === 'option') {
            clickedInteractive = true;
            break;
          }
          current = current.parentElement;
        }

        if (!clickedInteractive) {
          setIsMenuOpen(false);
        }
      }
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [isMenuOpen]);
  const prayerMessage = prayerRequest.trim()
    ? `Prayer request: ${prayerRequest.trim()}`
    : "Hello Zion AG Church, I would like to share a prayer request.";
  const prayerWhatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(prayerMessage)}`;

  const [selectedEventModal, setSelectedEventModal] = useState<EventItem | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  return (
    <div className={`min-h-screen bg-[#f7f2e8] dark:bg-[#121212] text-[#24342b] dark:text-[#e4e4e7] ${lang === "te" ? "telugu-font" : ""} ${lang !== "en" ? "indic-lang" : ""}`}>
      <header className="animate-header fixed inset-x-0 top-0 z-50 border-b border-white/25 bg-[#f7f2e8]/60 dark:bg-[#121212]/60 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8" aria-label="Main navigation">
          <a href="#home" onClick={closeMenu} className="flex items-center gap-3 font-serif text-lg tracking-tight text-[#223328] dark:text-white sm:text-xl shrink-0 whitespace-nowrap">
            <img src="./images/church_logo.webp" alt="Zion AG Logo" className="h-8 w-auto drop-shadow-sm" />
            ZION AG CHURCH
          </a>

          <button
            ref={menuToggleButtonRef}
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d7cbb5] dark:border-[#333333] text-[#24342b] dark:text-[#e4e4e7] transition hover:bg-white/70 dark:hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-[#b48a52] xl:hidden"
          >
            <span className="sr-only">Menu</span>
            <span className="relative h-4 w-5">
              <span className={`absolute left-0 top-0 h-0.5 w-5 bg-current transition ${isMenuOpen ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`absolute left-0 top-2 h-0.5 w-5 bg-current transition ${isMenuOpen ? "opacity-0" : ""}`} />
              <span className={`absolute left-0 top-4 h-0.5 w-5 bg-current transition ${isMenuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
            </span>
          </button>

          <div className="hidden items-center gap-3 xl:gap-4 2xl:gap-7 text-xs 2xl:text-sm font-medium text-[#3f4d43] dark:text-[#a1a1aa] xl:flex">
            {/* Optional Font size control */}
            {adminData.sectionVisibility?.showFontSizeToggle && (
              <div className="flex items-center gap-1 border border-[#dfd2bd] dark:border-[#333333] rounded-full px-2 py-0.5 bg-white/40 dark:bg-black/20 select-none">
                <button
                  onClick={() => handleFontSizeChange(fontSize - 10)}
                  className="text-xs font-bold text-[#8a5f2b] dark:text-[#d8b14c] hover:opacity-80 px-1.5 focus:outline-none"
                  title="Decrease Text Size"
                >
                  A-
                </button>
                <span className="text-[11px] font-bold text-[#3f4d43] dark:text-[#a1a1aa] min-w-[32px] text-center">{fontSize}%</span>
                <button
                  onClick={() => handleFontSizeChange(fontSize + 10)}
                  className="text-xs font-bold text-[#8a5f2b] dark:text-[#d8b14c] hover:opacity-80 px-1.5 focus:outline-none"
                  title="Increase Text Size"
                >
                  A+
                </button>
              </div>
            )}

            {/* Optional Theme switcher */}
            {adminData.sectionVisibility?.showThemeToggle && (
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="text-[#8a5f2b] dark:text-[#d8b14c] transition-all duration-300 hover:scale-110 hover:text-[#b48a52] focus:outline-none flex items-center justify-center"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M4.93 4.93l1.59 1.59m10.96 10.96l1.59 1.59M3 12h2.25m13.5 0H21M4.93 19.07l1.59-1.59m10.96-10.96l1.59-1.59M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                )}
              </button>
            )}

            <select
              value={lang}
              onChange={(e) => handleLangChange(e.target.value as Language)}
              className="bg-transparent font-semibold uppercase tracking-[0.14em] text-[#8a5f2b] dark:text-[#d8b14c] outline-none cursor-pointer"
            >
              <option value="en">ENG</option>
              <option value="ta">TAM</option>
              <option value="kn">KAN</option>
              <option value="te">TEL</option>
              <option value="hi">HIN</option>
            </select>
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="transition hover:text-[#8a5f2b] dark:text-[#d8b14c]">
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        {isMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={closeMenu} aria-hidden="true" />
            <div ref={mobileMenuRef} className="mobile-menu relative z-50 border-t border-[#dfd2bd] dark:border-[#333333] bg-[#f7f2e8]/60 dark:bg-[#121212]/60 backdrop-blur-xl px-5 py-5 shadow-2xl shadow-[#3f2c18]/10 xl:hidden">
              <div className="mb-4 space-y-4 border-b border-[#dfd2bd] dark:border-[#333333] pb-4">
                {/* Language Row */}
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#8a5f2b] dark:text-[#d8b14c]">Language</span>
                  <select
                    value={lang}
                    onChange={(e) => handleLangChange(e.target.value as Language)}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[#fffdf9] dark:bg-[#1e1e1e] px-3 py-1 rounded-lg font-semibold text-[#223328] dark:text-white outline-none border border-[#dfd2bd] dark:border-[#333333]"
                  >
                    <option value="en">English</option>
                    <option value="ta">தமிழ்</option>
                    <option value="kn">ಕನ್ನಡ</option>
                    <option value="te">తెలుగు</option>
                    <option value="hi">हिंदी</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-1">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className="rounded-xl px-3 py-3 text-base font-medium text-[#24342b] dark:text-[#e4e4e7] transition hover:bg-white/70 dark:hover:bg-black/40 dark:bg-black/30 dark:border-white/10"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </header>

      {/* ─── Offering Modal ────────────────────────────────────────────── */}
      {isOfferingOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-6"
          onClick={() => setIsOfferingOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Modal card */}
          <div
            className="relative z-10 w-full max-w-sm md:max-w-2xl rounded-3xl border border-white/10 bg-[#fffdf9] dark:bg-[#1a2a1e] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#223328] to-[#2e4d37] px-6 pt-7 pb-5 text-center relative">
              <button
                onClick={() => setIsOfferingOpen(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition text-xl"
                aria-label="Close"
              >
                ✕
              </button>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-white">Give an Offering</h2>
              <p className="text-white/60 text-sm md:text-base mt-1">Every seed sown is a step of faith</p>
            </div>

            {/* Body */}
            <div className="md:flex md:divide-x md:divide-[#dfd2bd] dark:md:divide-white/10">

              <div className="flex flex-col items-center justify-center gap-4 px-6 py-6 md:w-1/2">
                <a
                  href="upi://pay?pa=12295643032922@cnrb&pn=Zion%20AG%20Church&cu=INR"
                  className="rounded-2xl border-4 border-[#d8b14c] p-2 bg-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer block"
                  title="Open in UPI App"
                >
                  <img
                    src="./images/upi_qr.png"
                    alt="UPI QR Code – scan or click to give your offering"
                    className="w-44 h-44 md:w-56 md:h-56 object-contain"
                  />
                </a>
                <p className="text-[#223328] dark:text-white/80 text-sm font-semibold text-center">
                  Scan with any UPI app to give
                </p>
                <p className="text-[#8a5f2b] dark:text-[#d8b14c] text-xs font-mono bg-[#f6d49b]/30 dark:bg-[#d8b14c]/10 px-3 py-1.5 rounded-lg border border-[#d8b14c]/30">
                  12295643032922@cnrb
                </p>
              </div>

              <div className="flex flex-col justify-center gap-5 px-6 pb-6 pt-2 md:pt-6 md:w-1/2">
                <div className="rounded-2xl bg-gradient-to-br from-[#f6d49b]/40 to-[#d8b14c]/10 dark:from-[#d8b14c]/10 dark:to-[#223328]/40 border border-[#d8b14c]/30 px-4 py-4 text-center space-y-2">
                  <p className="text-[#3f2c18] dark:text-[#f6d49b] text-sm md:text-base leading-relaxed italic font-medium">
                    "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion,{" "}
                    <span className="font-bold not-italic">for God loves a cheerful giver.</span>"
                  </p>
                  <p className="text-[#8a5f2b] dark:text-[#d8b14c] text-xs md:text-sm font-bold tracking-wide">— 2 Corinthians 9:7</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[#dfd2bd] dark:bg-white/10" />
                  <span className="text-xs text-[#8a5f2b]/60 dark:text-white/30 font-semibold uppercase tracking-widest">or tap</span>
                  <div className="flex-1 h-px bg-[#dfd2bd] dark:bg-white/10" />
                </div>

                <a
                  href="upi://pay?pa=12295643032922@cnrb&pn=Zion%20AG%20Church&cu=INR"
                  className="flex items-center justify-center gap-2.5 w-full rounded-2xl bg-gradient-to-r from-[#223328] to-[#2e4d37] text-white font-bold py-4 text-base md:text-lg shadow-lg hover:from-[#2e4d37] hover:to-[#3a5e45] transition-all active:scale-[0.98]"
                >
                  Seed / Give via UPI App
                </a>

                <p className="text-center text-xs text-[#8a5f2b]/50 dark:text-white/30">
                  Opens PhonePe, Google Pay, Paytm &amp; other UPI apps
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <main>
        {/* ─── Hero / Home Section (Center Aligned Vertically & Horizontally) ─── */}
        <section id="home" className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 pb-16 pt-28 sm:px-8 lg:pb-24">
          <div
            aria-hidden="true"
            className="hero-photo-motion absolute inset-0 bg-cover bg-top origin-top"
            style={{ backgroundImage: `url(${adminData.heroBackgroundImage || './images/church-hero.webp'})` }}
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#17251d]/92 via-[#17251d]/45 to-[#17251d]/10" />

          <div className="animate-hero-copy relative z-10 mx-auto w-full max-w-7xl flex justify-center">
            <div className="max-w-4xl w-full rounded-[2rem] border border-white/10 bg-black/30 p-6 shadow-2xl backdrop-blur-md sm:p-10 lg:p-12 text-center flex flex-col items-center justify-center">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.34em] text-[#f6d49b]">Madiwala, Bengaluru</p>
              <h1 className="font-serif text-5xl leading-[0.95] tracking-tight text-white sm:text-7xl lg:text-8xl">
                Zion AG Church
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/82 sm:text-lg mx-auto">
                {t.christCentered}
              </p>

              {/* ── Service Selector ── */}
              <div className="mt-8 flex flex-col items-center">
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#f6d49b]/80">
                  {t.pickServiceLabel || 'Choose your Sunday service'}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {([
                    { key: 'kn', emoji: '🕊️', label: t.serviceKn || 'ಕನ್ನಡ', sublabel: t.serviceKnSub || 'Kannada' },
                    { key: 'ta', emoji: '⛪', label: t.serviceTa || 'தமிழ் + English', sublabel: t.serviceTaSub || 'Tamil & English' },
                    { key: 'te', emoji: '✝️', label: t.serviceTe || 'తెలుగు + English', sublabel: t.serviceTeSub || 'Telugu & English' },
                  ] as const).map(svc => (
                    <button
                      key={svc.key}
                      onClick={() => setSelectedService(prev => prev === svc.key ? null : svc.key)}
                      className={`group relative rounded-2xl border px-4 py-3 text-left transition-all duration-300 ${selectedService === svc.key
                        ? 'border-[#d8b14c] bg-[#d8b14c]/15 shadow-lg shadow-[#d8b14c]/10 scale-[1.02]'
                        : 'border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10'
                        }`}
                    >

                      <span className="text-lg">{svc.emoji}</span>
                      <span className={`ml-2 text-sm font-bold ${selectedService === svc.key ? 'text-[#f6d49b]' : 'text-white/90'}`}>
                        {svc.label}
                      </span>
                      <span className="ml-1.5 text-xs text-white/50 hidden sm:inline">{svc.sublabel}</span>
                    </button>
                  ))}
                </div>

                {/* ── Selected Service Details ── */}
                <div
                  ref={serviceDetailsRef}
                  className={`grid transition-[grid-template-rows,opacity,margin] duration-500 ease-in-out w-full max-w-xl ${selectedService ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'
                    }`}
                >
                  <div className="overflow-hidden">
                    {(() => {
                      const services: Record<string, { time: string; venue: string; address: string; mapLink: string }> = {
                        kn: {
                          time: '8:00 AM',
                          venue: t.venueMaruthi || 'Zion AG Church, Maruthi Nagar',
                          address: t.addressMaruthi || '22, Maruthi Nagar Main Rd, beside Amravati Hotel, BTM Layout, Bengaluru - 560068',
                          mapLink: adminData.mapLinks.mainChurch,
                        },
                        ta: {
                          time: '8:00 AM',
                          venue: t.venueDharmaram || 'Dharmaram Auditorium, Christ University College',
                          address: t.addressDharmaram || 'Dharmaram College Post, Hosur Road, Bengaluru - 560029',
                          mapLink: adminData.mapLinks.sundayVenue,
                        },
                        te: {
                          time: '9:30 AM',
                          venue: t.venueDharmaram || 'Dharmaram Auditorium, Christ University College',
                          address: t.addressDharmaram || 'Dharmaram College Post, Hosur Road, Bengaluru - 560029',
                          mapLink: adminData.mapLinks.sundayVenue,
                        },
                      };
                      const activeService = selectedService || lastSelectedService;
                      if (!activeService) return null;
                      const s = services[activeService];
                      const langLabels: Record<string, { label: string; sublabel: string; emoji: string }> = {
                        kn: { label: t.serviceKn || 'ಕನ್ನಡ', sublabel: t.serviceKnSub || 'Kannada', emoji: '🕊️' },
                        ta: { label: t.serviceTa || 'தமிழ் + English', sublabel: t.serviceTaSub || 'Tamil & English', emoji: '⛪' },
                        te: { label: t.serviceTe || 'తెలుగు + English', sublabel: t.serviceTeSub || 'Telugu & English', emoji: '✝️' },
                      };
                      const langInfo = langLabels[activeService];

                      return (
                        <div className="rounded-2xl border border-[#d8b14c]/30 bg-gradient-to-br from-[#1a2a1e]/80 to-[#0f1a13]/80 p-5 backdrop-blur-sm shadow-xl text-left">
                          <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#d8b14c]/15 text-2xl font-bold text-[#f6d49b]">
                              TIME
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-2xl font-bold text-[#f6d49b]">{s.time}</p>
                                {langInfo && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#d8b14c]/20 px-2.5 py-0.5 text-xs font-semibold text-[#f6d49b] border border-[#d8b14c]/30 shadow-sm backdrop-blur-sm">
                                    <span>{langInfo.label}</span>
                                    <span className="text-[10px] opacity-75">({langInfo.sublabel})</span>
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-xs font-medium text-white/60">{t.everySunday || 'Every Sunday'}</p>
                              <p className="mt-2 text-base font-semibold text-white">{s.venue}</p>
                              <p className="mt-0.5 text-sm text-white/60 leading-relaxed">{s.address}</p>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                            <a
                              href={s.mapLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f6d49b] px-6 py-3 text-sm font-semibold text-[#24342b] transition hover:-translate-y-0.5 hover:bg-[#ffe2ad] focus:outline-none focus:ring-4 focus:ring-white"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                              {t.getDirections}
                            </a>
                            <ExternalLink href={youtubeLiveLink} variant="dark">
                              {t.watchLive}
                            </ExternalLink>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Show Watch Live when no service selected */}
                <div
                  className={`grid transition-[grid-template-rows,opacity,margin] duration-500 ease-in-out ${!selectedService ? 'grid-rows-[1fr] opacity-100 mt-6' : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'
                    }`}
                >
                  <div className="overflow-hidden">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <ExternalLink href={youtubeLiveLink} variant="dark">
                        {t.watchLive}
                      </ExternalLink>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Story & Pastor Section ─── */}
        {adminData.sectionVisibility?.about !== false && (
          <section id="about" className="relative scroll-mt-24 overflow-hidden bg-[#f7f2e8] dark:bg-[#121212] px-5 py-16 sm:px-8 lg:py-24">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.8)_0%,transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(216,177,76,0.1)_0%,transparent_70%)]" />
            <DarkFluidBackground />

            <div className="relative z-10 mx-auto max-w-4xl text-center">
              <p className="text-[13px] font-semibold uppercase tracking-[0.25em] text-[#9a6b31] dark:text-[#d8b14c]">OUR STORY</p>
              <h2 className="mt-4 font-serif text-[42px] leading-[1.2] text-[#223328] dark:text-white drop-shadow-[0_2px_10px_rgba(154,107,49,0.1)] sm:text-[64px]">
                {t.aboutTitle}
              </h2>

              <div className="mt-12 rounded-[32px] border border-white/60 bg-white/50 dark:bg-black/30 dark:border-white/10 p-6 text-left shadow-[0_12px_40px_rgba(61,42,23,0.06)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_16px_50px_rgba(154,107,49,0.1)] sm:p-12 sm:text-center">
                <p className="mb-6 text-[16px] leading-[1.8] text-[#4f5c53] dark:text-gray-200 sm:text-[18px]">
                  {t.aboutP1}
                </p>

                <p className="mb-8 text-[16px] leading-[1.8] text-[#4f5c53] dark:text-gray-200 sm:text-[18px]">
                  {t.aboutP2}
                </p>

                {adminData.sectionVisibility?.showStayConnectedBanner && (
                  <div className="mx-auto mb-8 max-w-2xl rounded-2xl border border-[#d8ccb8] dark:border-[#333333]/50 bg-[#fbf8f1] dark:bg-[#1e1e1e]/80 p-5 text-[15px] font-medium text-[#3f4d43] dark:text-[#a1a1aa] shadow-sm sm:text-[16px]">
                    {t.aboutBanner}
                  </div>
                )}

                <div className="mx-auto mb-10 flex max-w-2xl items-center justify-center gap-4 text-left sm:text-center">
                  <div className="hidden h-10 w-1 bg-[#d8b14c] sm:block"></div>
                  <p className="border-l-4 border-[#d8b14c] pl-5 font-serif text-[20px] italic leading-relaxed text-[#9a6b31] dark:text-[#d8b14c] sm:border-l-0 sm:pl-0 sm:text-[24px]">
                    {t.aboutQuote}
                  </p>
                </div>

                {/* Pastor Information Section (Uniform Consistent Text Color) */}
                <div className="mx-auto mt-10 max-w-2xl border-t border-[#d8ccb8] dark:border-[#333333]/50 pt-10 text-center">
                  <div className="mx-auto mb-6 flex h-40 w-40 sm:h-52 sm:w-52 items-center justify-center overflow-hidden rounded-full border-4 border-white shadow-xl ring-2 ring-[#e1d4be]">
                    <img
                      src="./images/pastor.webp"
                      alt={t.pastorName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <h3 className="font-serif text-[26px] font-semibold text-[#223328] dark:text-white sm:text-[30px]">{t.pastorName}</h3>
                  <p className="mt-2 text-[13px] font-bold uppercase tracking-widest text-[#223328]/80 dark:text-white/80 sm:text-[14px]">
                    {t.pastorTitle}
                  </p>
                  <p className="mt-5 text-[15px] leading-[1.8] text-[#223328] dark:text-white sm:text-[16px]">
                    {t.pastorDesc}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ─── Announcements Carousel Section ─── */}
        {adminData.sectionVisibility?.announcements !== false && (
          <section id="announcements" className="section-reveal scroll-mt-24 px-5 py-16 sm:px-8 lg:py-24 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(216,177,76,0.08)_0%,transparent_50%)]" />
            <DarkFluidBackground />

            <div className="mx-auto max-w-6xl text-center relative z-10">
              <p className="text-[13px] font-semibold uppercase tracking-[0.25em] text-[#9a6b31] dark:text-[#d8b14c]">STAY UPDATED</p>
              <h2 className="mt-4 font-serif text-[42px] leading-[1.2] text-[#223328] dark:text-white sm:text-[56px] drop-shadow-[0_2px_10px_rgba(154,107,49,0.1)]">
                {t.announcementsTitle}
              </h2>
            </div>
            <div className="mt-12 mx-auto max-w-7xl relative z-10">
              <div
                ref={carouselRef}
                onScroll={handleScroll}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                className={`flex gap-6 overflow-x-auto pb-12 pt-8 px-5 sm:px-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${isDragging ? "cursor-grabbing select-none" : "cursor-grab"
                  } ${isDragging ? "" : "snap-x snap-mandatory scroll-smooth"}`}
              >
                {extendedPosters.map((poster, index) => {
                  let ratioClass = 'w-[320px] sm:w-[480px] aspect-[16/9]';
                  if (adminData.announcementAspectRatio === '4:3') {
                    ratioClass = 'w-[290px] sm:w-[400px] aspect-[4/3]';
                  } else if (adminData.announcementAspectRatio === '9:16') {
                    ratioClass = 'w-[200px] sm:w-[280px] aspect-[9/16]';
                  }
                  return (
                    <div
                      key={index}
                      className={`snap-center shrink-0 ${ratioClass} rounded-[24px] overflow-hidden border border-white/40 cursor-pointer transition-all duration-500 group relative ${activeIndex === index
                        ? "scale-[1.15] shadow-[0_30px_60px_rgba(154,107,49,0.3)] z-10 border-white/80"
                        : "scale-[0.92] opacity-60 shadow-[0_12px_40px_rgba(61,42,23,0.08)] hover:opacity-100 z-0"
                        }`}
                      onClick={(e) => {
                        if (dragDistance.current > 10) {
                          e.preventDefault();
                          return;
                        }
                        setSelectedImage(poster.src);
                      }}
                    >
                      <img
                        src={cachedUrls[poster.src] || poster.src}
                        alt={poster.alt}
                        loading="eager"
                        onDragStart={(e) => e.preventDefault()}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 pt-16 text-left">
                        {!adminData.hideAnnouncementText && (
                          <span className="text-white font-medium text-lg drop-shadow-md">
                            {poster.label}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-center gap-2 mt-8 hidden sm:flex">
                {announcementPosters.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all duration-500 ${i === activeIndex % announcementPosters.length
                      ? "w-8 bg-[#d8b14c]"
                      : "w-2 bg-[#d8b14c]/40"
                      }`}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── Events & Calendar Section ─── */}
        {adminData.sectionVisibility?.ministries !== false && (
          <section id="ministries" className="relative scroll-mt-24 overflow-hidden bg-[#f7f2e8] dark:bg-[#121212] px-3 py-16 sm:px-8 lg:py-24">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.8)_0%,transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(216,177,76,0.1)_0%,transparent_70%)]" />

            <div className="relative z-10 mx-auto max-w-6xl text-center">
              <p className="text-[11px] sm:text-[13px] font-semibold uppercase tracking-[0.25em] text-[#9a6b31] dark:text-[#d8b14c]">GROW WITH US</p>
              <h2 className="mt-3 font-serif text-[32px] sm:text-[42px] leading-[1.2] text-[#223328] dark:text-white drop-shadow-[0_2px_10px_rgba(154,107,49,0.1)] lg:text-[64px]">
                {t.ministriesTitle}
              </h2>

              {/* Clickable Event / Ministry Cards */}
              <div className="mt-8 sm:mt-12 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
                {getMinistries(t).map((ministry) => (
                  <article
                    key={ministry.name}
                    onClick={() => setSelectedEventModal({
                      id: ministry.name,
                      title: ministry.name,
                      date: 'Weekly / Monthly Schedule',
                      time: ministry.time,
                      venue: 'Zion AG Church Main Sanctuary / Christ University',
                      description: ministry.description,
                      image: './images/church-hero.webp',
                      category: 'Ministry Event',
                      active: true,
                      createdAt: Date.now(),
                    })}
                    className="group relative flex h-full flex-col overflow-hidden rounded-[20px] sm:rounded-[28px] border border-white/60 bg-white/50 dark:bg-black/30 dark:border-white/10 p-4 sm:p-6 text-center shadow-[0_12px_30px_rgba(61,42,23,0.08)] -translate-y-1 cursor-pointer backdrop-blur-[12px] transition-all duration-300 ease-out hover:-translate-y-2 hover:border-[#d8b14c]/50 dark:border-[#d8b14c]/30 hover:shadow-[0_20px_40px_rgba(154,107,49,0.15)] active:scale-105"
                  >
                    {adminData.sectionVisibility?.showEmojis && (
                      <div className="relative z-10 mb-3 sm:mb-4 text-[24px] sm:text-[32px] transition-transform duration-300 group-hover:scale-110">
                        {ministry.emoji}
                      </div>
                    )}
                    <h3 className="relative z-10 mb-2 sm:mb-3 font-serif text-[16px] sm:text-[22px] font-semibold text-[#223328] dark:text-white leading-tight">
                      {ministry.name}
                    </h3>
                    <p className="relative z-10 mb-[16px] flex-grow text-[12px] sm:text-[14px] leading-[1.5] sm:leading-[1.6] text-[#5c675f] dark:text-[#a1a1aa] line-clamp-4 sm:line-clamp-none">
                      {ministry.description}
                    </p>
                    <div className="relative z-10 mt-auto border-t border-[#d8ccb8] dark:border-[#333333]/50 pt-[12px] sm:pt-[16px] text-[10px] sm:text-[12px] font-medium text-[#8a5f2b] dark:text-[#d8b14c]">
                      {ministry.time}
                    </div>
                  </article>
                ))}
              </div>

              {/* ─── Promise Prayer & Events Calendar ─── */}
              {(() => {
                const CATS: Record<string, { pill: string; dot: string; badge: string; badgeText: string }> = {
                  'Promise Prayer': { pill: 'bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200', dot: 'bg-violet-500', badge: 'bg-violet-600', badgeText: 'text-white' },
                  'Prayer': { pill: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200', dot: 'bg-blue-500', badge: 'bg-blue-600', badgeText: 'text-white' },
                  'Worship': { pill: 'bg-[#f6d49b]/60 text-[#8a5f2b] dark:bg-[#d8b14c]/20 dark:text-[#f6d49b]', dot: 'bg-[#d8b14c]', badge: 'bg-[#d8b14c]', badgeText: 'text-[#1a2a1e]' },
                  'Youth': { pill: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200', dot: 'bg-emerald-500', badge: 'bg-emerald-600', badgeText: 'text-white' },
                  'default': { pill: 'bg-[#223328]/10 text-[#223328] dark:bg-white/10 dark:text-white', dot: 'bg-[#223328] dark:bg-white', badge: 'bg-[#223328]', badgeText: 'text-white' },
                };
                const getCat = (cat?: string) => CATS[cat || ''] || CATS['default'];

                const year = calendarMonth.getFullYear();
                const month = calendarMonth.getMonth();
                const daysInMonth = getDaysInMonth(year, month);
                const startDay = getFirstDayOfMonth(year, month);
                const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                const DAY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                const DAY_LONG = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

                // Merge stored events with auto-generated recurring instances
                const recurringInstances = getRecurringEventInstances(year, month);
                const allCalendarEvents: EventItem[] = [
                  ...adminData.events,
                  // Add recurring instances only if no stored event already has the same rec-id
                  ...recurringInstances.filter(ri =>
                    !adminData.events.some(se => se.id === ri.id)
                  ),
                ];

                const upcomingEvents = allCalendarEvents
                  .filter(e => { const d = new Date(e.date); return d.getFullYear() === year && d.getMonth() === month; })
                  .sort((a, b) => a.date.localeCompare(b.date));

                return (
                  <div className="mt-10 sm:mt-16 rounded-[24px] sm:rounded-[32px] border border-[#d8b14c]/25 bg-white/70 dark:bg-black/40 shadow-[0_16px_48px_rgba(61,42,23,0.10)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.35)] backdrop-blur-xl overflow-hidden">

                    {/* ── Card Header ── */}
                    <div className="relative px-4 pt-5 pb-4 sm:px-8 sm:pt-7 sm:pb-5 border-b border-[#d8ccb8]/50 dark:border-white/8 bg-gradient-to-r from-[#223328]/5 to-transparent dark:from-[#d8b14c]/5 dark:to-transparent">
                      {/* decorative orb */}
                      <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-[#d8b14c]/10 blur-2xl" />
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#9a6b31] dark:text-[#d8b14c]">Church Calendar</p>
                          <h3 className="mt-0.5 font-serif text-xl sm:text-2xl font-bold text-[#223328] dark:text-white leading-tight">
                            Promise Prayer &amp; Events
                          </h3>
                        </div>
                        {/* Month navigator */}
                        <div className="flex items-center gap-0.5 rounded-xl border border-[#d8ccb8] dark:border-white/10 bg-white/60 dark:bg-white/5 overflow-hidden">
                          <button
                            onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
                            className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center text-lg font-bold text-[#8a5f2b] dark:text-[#d8b14c] hover:bg-[#f6d49b]/40 dark:hover:bg-white/10 transition-colors"
                            aria-label="Previous Month"
                          >‹</button>
                          <span className="px-2 sm:px-3 font-serif font-bold text-sm sm:text-base text-[#223328] dark:text-white min-w-[120px] sm:min-w-[140px] text-center select-none">
                            {MONTH_NAMES[month]} {year}
                          </span>
                          <button
                            onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
                            className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center text-lg font-bold text-[#8a5f2b] dark:text-[#d8b14c] hover:bg-[#f6d49b]/40 dark:hover:bg-white/10 transition-colors"
                            aria-label="Next Month"
                          >›</button>
                        </div>
                      </div>

                      {/* Category legend – scrollable horizontally on mobile */}
                      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                        {Object.entries(CATS).filter(([k]) => k !== 'default').map(([cat, s]) => (
                          <span key={cat} className={`shrink-0 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${s.pill}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* ── Calendar + Events ── */}
                    <div className="flex flex-col lg:flex-row">

                      {/* Grid */}
                      <div className="flex-1 px-3 pt-4 pb-3 sm:px-6 sm:pt-5 sm:pb-4">
                        {/* Weekday row */}
                        <div className="grid grid-cols-7 mb-1.5">
                          {DAY_SHORT.map((d, i) => (
                            <div key={i} className="text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#9a6b31]/60 dark:text-[#d8b14c]/50 py-1">
                              <span className="sm:hidden">{d}</span>
                              <span className="hidden sm:inline">{DAY_LONG[i]}</span>
                            </div>
                          ))}
                        </div>

                        {/* Day cells */}
                        <div className="grid grid-cols-7 gap-[3px] sm:gap-1">
                          {Array.from({ length: startDay }).map((_, i) => (
                            <div key={`blank-${i}`} className="aspect-square sm:min-h-[64px] sm:aspect-auto" />
                          ))}
                          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                            const dayEvents = allCalendarEvents.filter(e => e.date === dateStr);
                            const isToday = new Date().toISOString().slice(0, 10) === dateStr;
                            const hasEvents = dayEvents.length > 0;

                            return (
                              <div
                                key={d}
                                onClick={() => hasEvents ? setSelectedEventModal(dayEvents[0]) : undefined}
                                className={`aspect-square sm:aspect-auto sm:min-h-[64px] rounded-lg sm:rounded-xl p-1 sm:p-2 flex flex-col transition-all duration-150 border ${isToday
                                    ? 'border-[#d8b14c] bg-[#f6d49b]/30 dark:bg-[#d8b14c]/15 shadow-sm'
                                    : hasEvents
                                      ? 'border-[#d8ccb8] dark:border-white/15 bg-[#f7f2e8]/80 dark:bg-white/6 hover:border-[#d8b14c]/60 cursor-pointer'
                                      : 'border-[#ece6d8]/60 dark:border-white/5 bg-transparent hover:bg-[#f6d49b]/10 dark:hover:bg-white/4'
                                  }`}
                              >
                                {/* Date number */}
                                <span className={`text-[11px] sm:text-sm font-bold leading-none self-start ${isToday
                                    ? 'inline-flex h-[18px] w-[18px] sm:h-6 sm:w-6 items-center justify-center rounded-full bg-[#d8b14c] text-[#1a2a1e] text-[10px] sm:text-xs'
                                    : hasEvents
                                      ? 'text-[#223328] dark:text-white'
                                      : 'text-[#9a8c7a] dark:text-white/30'
                                  }`}>
                                  {d}
                                </span>

                                {/* Event indicators */}
                                <div className="mt-auto pt-0.5">
                                  {/* Mobile: coloured dots */}
                                  {dayEvents.length > 0 && (
                                    <div className="flex sm:hidden gap-[3px] flex-wrap justify-center">
                                      {dayEvents.slice(0, 3).map(evt => (
                                        <button
                                          key={evt.id}
                                          onClick={() => setSelectedEventModal(evt)}
                                          className={`h-[5px] w-[5px] rounded-full ${getCat(evt.category).dot} active:scale-150 transition-transform`}
                                          title={evt.title}
                                        />
                                      ))}
                                    </div>
                                  )}
                                  {/* Desktop: text pills */}
                                  <div className="hidden sm:flex flex-col gap-[3px]">
                                    {dayEvents.slice(0, 2).map(evt => (
                                      <button
                                        key={evt.id}
                                        onClick={() => setSelectedEventModal(evt)}
                                        className={`w-full text-left truncate rounded-md px-1.5 py-[2px] text-[10px] font-semibold transition-opacity hover:opacity-75 ${getCat(evt.category).pill}`}
                                        title={evt.title}
                                      >
                                        {evt.title}
                                      </button>
                                    ))}
                                    {dayEvents.length > 2 && (
                                      <p className="text-[9px] text-[#9a6b31]/60 dark:text-[#d8b14c]/50 pl-1">+{dayEvents.length - 2} more</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* ── Events List ── stacks below on mobile, sidebar on lg+ */}
                      <div className="lg:w-64 xl:w-72 border-t lg:border-t-0 lg:border-l border-[#d8ccb8]/60 dark:border-white/8 px-4 pt-4 pb-5 sm:px-6 sm:pt-5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9a6b31] dark:text-[#d8b14c] mb-3">
                          {MONTH_NAMES[month]} — {upcomingEvents.length} {upcomingEvents.length === 1 ? 'Event' : 'Events'}
                        </p>
                        <div className="space-y-2 max-h-[340px] lg:max-h-[460px] overflow-y-auto pr-0.5">
                          {upcomingEvents.length === 0 ? (
                            <div className="rounded-2xl border border-[#d8ccb8]/50 dark:border-white/8 bg-[#f6d49b]/10 dark:bg-white/3 p-4 text-center">
                              <p className="text-[#8a5f2b]/60 dark:text-white/30 text-sm">No events this month</p>
                              <p className="text-[#8a5f2b]/40 dark:text-white/20 text-xs mt-0.5">Add events via Admin Panel</p>
                            </div>
                          ) : upcomingEvents.map(evt => {
                            const c = getCat(evt.category);
                            const day = new Date(evt.date).getUTCDate();
                            const dn = DAY_LONG[new Date(evt.date).getUTCDay()];
                            return (
                              <button
                                key={evt.id}
                                onClick={() => setSelectedEventModal(evt)}
                                className="w-full text-left group flex gap-2.5 rounded-xl border border-[#d8ccb8]/50 dark:border-white/8 bg-white/60 dark:bg-white/4 hover:border-[#d8b14c]/50 dark:hover:border-white/20 hover:bg-[#f6d49b]/20 dark:hover:bg-white/8 p-2.5 transition-all duration-150 shadow-sm hover:shadow-md"
                              >
                                <div className={`shrink-0 flex flex-col items-center justify-center h-10 w-10 rounded-xl ${c.badge} ${c.badgeText} shadow-sm`}>
                                  <span className="text-[9px] font-bold opacity-80 leading-none">{dn}</span>
                                  <span className="text-[15px] font-extrabold leading-tight">{day}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs sm:text-sm font-bold text-[#223328] dark:text-white truncate group-hover:text-[#8a5f2b] dark:group-hover:text-[#d8b14c] transition-colors leading-snug">{evt.title}</p>
                                  <p className="text-[10px] text-[#8a5f2b]/70 dark:text-[#d8b14c]/60 mt-0.5 truncate">{evt.time}</p>
                                  <p className="text-[9px] text-[#5c675f]/60 dark:text-white/30 truncate">{evt.venue}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>
        )}

        {/* ─── Promise Prayer Banner ─── */}
        {adminData.sectionVisibility?.promisePrayers !== false && (
          <section id="promise-prayers" className="relative px-5 py-16 sm:px-8 lg:py-24 bg-white/40 dark:bg-[#121212]/80">
            <DarkFluidBackground />
            <div className="mx-auto max-w-4xl rounded-[32px] border border-[#d8b14c]/30 bg-white/70 dark:bg-black/30 dark:border-white/10 p-8 shadow-[0_12px_40px_rgba(154,107,49,0.08)] backdrop-blur-xl sm:p-12 text-center">
              <h2 className="font-serif text-3xl sm:text-4xl text-[#223328] dark:text-white font-bold mb-4">{t.promisePrayers}</h2>
              <p className="text-lg leading-relaxed text-[#4f5c53] dark:text-gray-200 mb-8">
                {t.promiseDesc}
              </p>
              <div className="flex justify-center">
                <AddToCalendarButton
                  name={t.promisePrayers}
                  description={t.promiseDesc}
                  options={['Apple', 'Google']}
                  location="Zion AG Church, Madiwala, Bengaluru"
                  startDate={upcomingDate}
                  endDate={upcomingDate}
                  startTime="05:00"
                  endTime="06:30"
                  timeZone="Asia/Kolkata"
                  recurrence="RRULE:FREQ=MONTHLY;BYMONTHDAY=1"
                  hideBackground={true}
                  hideCheckmark={true}
                />
              </div>
            </div>
          </section>
        )}

        {/* ─── Daily Manna Section ─── */}
        {adminData.sectionVisibility?.dailyManna !== false && (
          <section id="daily-manna" className="relative scroll-mt-24 overflow-hidden px-5 py-16 sm:px-8 lg:py-24">
            <div className="pointer-events-none absolute inset-0 bg-[#f7f2e8] dark:bg-[#121212]">
              <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(216,177,76,0.06)_0%,transparent_70%)]" />
            </div>

            <div className="relative z-10 mx-auto max-w-4xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#9a6b31] dark:text-[#d8b14c]">{t.navDailyManna}</p>
              <h2 className="mt-3 font-serif text-4xl tracking-tight text-[#223328] dark:text-white sm:text-5xl">{t.dailyMannaTitle}</h2>

              <div className="relative mx-auto mt-12 max-w-3xl rounded-[32px] border border-white/60 bg-white/50 dark:bg-black/30 dark:border-white/10 p-8 shadow-[0_12px_40px_rgba(61,42,23,0.06)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_16px_50px_rgba(154,107,49,0.1)] sm:p-12">
                <blockquote className="relative z-10 mx-auto max-w-2xl font-serif text-2xl leading-[1.3] text-[#24342b] dark:text-[#e4e4e7] sm:text-3xl lg:text-4xl">
                  {dailyMannaVerses[mannaIndex].verse}
                </blockquote>

                <p className="relative z-10 mt-6 text-lg font-bold tracking-wide text-[#9a6b31] dark:text-[#d8b14c] sm:text-xl">
                  {dailyMannaVerses[mannaIndex].reference}
                </p>

                {dailyMannaVerses[mannaIndex].reflection?.trim() && (
                  <div className="relative z-10 mx-auto mt-8 max-w-xl border-t border-[#d8ccb8] dark:border-[#333333]/60 pt-6">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#5c675f] dark:text-[#a1a1aa] sm:text-base">{t.reflection}</p>
                    <p className="text-[15px] leading-relaxed text-[#4f5c53] dark:text-gray-200 sm:text-[17px]">
                      {dailyMannaVerses[mannaIndex].reflection}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={getNewVerse}
                className="group relative mt-10 inline-flex items-center justify-center rounded-full bg-[#1c2920] px-8 py-4 text-sm font-bold uppercase tracking-widest text-white outline-none transition-all duration-300 hover:scale-105 hover:bg-[#2a3c2f] focus:ring-4 focus:ring-[#d8b14c]/40 active:scale-95"
              >
                <span className="absolute inset-0 rounded-full bg-[#d8b14c] opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-40"></span>
                <span className="relative flex items-center gap-2">
                  {t.newVerse.split("↻")[0]}<span className="text-lg transition-transform duration-500 group-hover:rotate-180">↻</span>
                </span>
              </button>

              {todayVerseImage && (
                <div className="mt-10 mx-auto max-w-3xl">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#9a6b31] dark:text-[#d8b14c] mb-4">Today's Verse Image</p>
                  <div className="rounded-[24px] overflow-hidden border border-white/60 dark:border-white/10 shadow-[0_12px_40px_rgba(61,42,23,0.1)]">
                    <img
                      src={todayVerseImage}
                      alt="Verse of the day"
                      className="w-full object-contain max-h-[500px]"
                    />
                  </div>
                </div>
              )}

              {todayVerse && (
                <div className="mt-8 mx-auto max-w-3xl rounded-[24px] border border-[#d8b14c]/30 bg-[#d8b14c]/5 dark:bg-[#d8b14c]/10 p-6 text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#9a6b31] dark:text-[#d8b14c] mb-3">Pastor's Verse for Today</p>
                  <blockquote className="font-serif text-xl text-[#24342b] dark:text-[#e4e4e7] italic leading-relaxed">{todayVerse.verse}</blockquote>
                  <p className="mt-3 font-bold text-[#9a6b31] dark:text-[#d8b14c]">{todayVerse.reference}</p>
                  {todayVerse.reflection && <p className="mt-3 text-sm text-[#5c675f] dark:text-gray-300">{todayVerse.reflection}</p>}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ─── Mood Manna Section (Default Hidden, Toggleable in Admin) ─── */}
        {adminData.sectionVisibility?.manna === true && (
          <section id="manna" className="relative scroll-mt-24 overflow-hidden px-5 py-16 sm:px-8 lg:py-24 bg-[#f7f2e8] dark:bg-[#121212]">
            <DarkFluidBackground />
            <div className="relative z-10 mx-auto max-w-4xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#9a6b31] dark:text-[#d8b14c]">MANNA FOR YOUR SOUL</p>
              <h2 className="mt-3 font-serif text-4xl tracking-tight text-[#223328] dark:text-white sm:text-5xl">How are you feeling today?</h2>
              {adminData.sectionVisibility?.showMannaCaption && (
                <p className="mt-2 text-sm text-[#5c675f] dark:text-[#a1a1aa] max-w-md mx-auto">Select a category below to receive a customized scripture promise from God's Word</p>
              )}

              <div ref={mannaRef}>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => {
                      if (activeMoodGroup === 'comfort') {
                        setActiveMoodGroup(null);
                      } else {
                        setActiveMoodGroup('comfort');
                      }
                      setSelectedMood('');
                      setMoodVerse(null);
                    }}
                    className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold border transition duration-300 shadow-md ${activeMoodGroup === 'comfort'
                      ? 'bg-[#1c2920] border-[#d8b14c] text-[#d8b14c] dark:bg-[#d8b14c] dark:text-[#1a2a1e] dark:border-[#d8b14c]'
                      : 'bg-white/40 border-black/10 text-black/60 hover:bg-white/60 dark:bg-white/5 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/10'
                      }`}
                  >
                    Downcast / Seeking Comfort
                  </button>
                  <button
                    onClick={() => {
                      if (activeMoodGroup === 'wisdom') {
                        setActiveMoodGroup(null);
                      } else {
                        setActiveMoodGroup('wisdom');
                      }
                      setSelectedMood('');
                      setMoodVerse(null);
                    }}
                    className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold border transition duration-300 shadow-md ${activeMoodGroup === 'wisdom'
                      ? 'bg-[#1c2920] border-[#d8b14c] text-[#d8b14c] dark:bg-[#d8b14c] dark:text-[#1a2a1e] dark:border-[#d8b14c]'
                      : 'bg-white/40 border-black/10 text-black/60 hover:bg-white/60 dark:bg-white/5 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/10'
                      }`}
                  >
                    Hope / Seeking Guidance
                  </button>
                </div>

                {activeMoodGroup && (
                  <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-3xl mx-auto animate-fade-in">
                    {MOOD_CATEGORIES.filter(c => c.group === activeMoodGroup).map(c => {
                      const isSelected = selectedMood === c.key;
                      return (
                        <button
                          key={c.key}
                          onClick={() => handleMoodChange(c.key)}
                          className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-xs sm:text-sm font-semibold transition border shadow-sm backdrop-blur-md ${isSelected
                            ? 'bg-[#d8b14c] border-[#d8b14c] text-[#1a2a1e] font-bold ring-2 ring-[#d8b14c]/30'
                            : 'bg-white/50 border-black/5 text-[#223328] hover:border-black/20 dark:bg-white/5 dark:border-white/5 dark:text-white/80 dark:hover:bg-white/10 dark:hover:border-white/20'
                            }`}
                        >
                          {adminData.sectionVisibility?.showEmojis && <span>{c.emoji}</span>}
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {moodVerse ? (
                <div ref={verseRef} className="relative mx-auto mt-8 max-w-3xl rounded-[24px] border border-[#d8b14c]/30 bg-white/60 dark:bg-black/35 dark:border-white/10 p-6 shadow-[0_12px_40px_rgba(61,42,23,0.06)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_16px_50px_rgba(154,107,49,0.1)] sm:p-10 animate-fade-in">
                  <blockquote className="relative z-10 mx-auto max-w-2xl font-serif text-lg leading-relaxed text-[#24342b] dark:text-[#e4e4e7] sm:text-2xl italic">
                    "{moodVerse.verse}"
                  </blockquote>

                  <p className="relative z-10 mt-4 text-base font-bold tracking-wide text-[#9a6b31] dark:text-[#d8b14c] sm:text-lg">
                    — {moodVerse.reference}
                  </p>

                  <div className="relative z-10 mx-auto mt-6 max-w-xl border-t border-[#d8ccb8] dark:border-[#333333]/60 pt-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#5c675f] dark:text-[#a1a1aa] sm:text-sm">Reflection</p>
                    <p className="text-xs leading-relaxed text-[#4f5c53] dark:text-gray-300 sm:text-sm">
                      {moodVerse.reflection}
                    </p>
                  </div>

                  <button
                    onClick={refreshMoodVerse}
                    className="group relative mt-8 inline-flex items-center justify-center rounded-full bg-[#1c2920] px-6 py-3 text-xs font-bold uppercase tracking-widest text-white outline-none transition-all duration-300 hover:scale-105 hover:bg-[#2a3c2f] dark:bg-[#d8b14c] dark:text-[#1a2a1e] dark:hover:bg-[#f0ca60] focus:ring-4 focus:ring-[#d8b14c]/40 active:scale-95 shadow-lg animate-fade-in"
                  >
                    <span className="relative flex items-center gap-2">
                      Give me another verse <span className="text-sm transition-transform duration-500 group-hover:rotate-180">↻</span>
                    </span>
                  </button>
                </div>
              ) : (
                <div className="mt-10 py-12 text-center text-[#5c675f]/60 dark:text-white/35 italic flex flex-col items-center justify-center gap-2">
                  <p className="text-sm">Choose an emotion above to receive a scripture promise...</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ─── Contact & Connect Section ─── */}
        {adminData.sectionVisibility?.contact !== false && (
          <section id="contact" className="scroll-mt-24 px-5 py-16 sm:px-8 lg:py-24">
            <div className="mx-auto max-w-6xl">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#9a6b31] dark:text-[#d8b14c]">{t.connectWithUs}</p>
                <h2 className="mt-3 font-serif text-4xl tracking-tight text-[#223328] dark:text-white sm:text-5xl">{t.contactTitle}</h2>
                <p className="mt-4 text-lg leading-8 text-[#5c675f] dark:text-[#a1a1aa]">
                  {t.contactDesc}
                </p>
              </div>

              <div className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-8">
                  <div className="divide-y divide-[#d8ccb8] border-y border-[#d8ccb8] dark:border-[#333333]">
                    {getContactLocations(t, adminData.mapLinks).map((location) => (
                      <article key={location.name} className="py-6">
                        <h3 className="text-2xl font-semibold tracking-tight text-[#223328] dark:text-white">{location.name}</h3>
                        <div className="mt-3 space-y-1 leading-7 text-[#5c675f] dark:text-[#a1a1aa]">
                          {location.address.map((line) => (
                            <p key={line}>{line}</p>
                          ))}
                        </div>
                        <a
                          href={location.link}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex text-sm font-semibold uppercase tracking-[0.14em] text-[#9a6b31] dark:text-[#d8b14c] transition hover:text-[#6f471d]"
                        >
                          {location.action}
                        </a>
                      </article>
                    ))}
                  </div>

                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight text-[#223328] dark:text-white">{t.callWhatsapp}</h3>
                    <p className="mt-3 text-lg text-[#5c675f] dark:text-[#a1a1aa]">+91 77604 04798</p>
                    <p className="mt-1 text-lg text-[#5c675f] dark:text-[#a1a1aa]">{emailAddress}</p>
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <ExternalLink href="tel:+917760404798" variant="dark">
                        Call
                      </ExternalLink>
                      <ExternalLink href={`https://wa.me/${whatsappNumber}`}>WhatsApp</ExternalLink>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight text-[#223328] dark:text-white">{t.followUs}</h3>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <a className="rounded-full border border-[#d8ccb8] dark:border-[#333333] px-5 py-2 text-sm font-semibold text-[#4d5a51] dark:text-[#a1a1aa] transition hover:bg-white/60 dark:hover:bg-black/40" href={youtubeLiveLink} target="_blank" rel="noreferrer">
                        YouTube
                      </a>
                      <a className="rounded-full border border-[#d8ccb8] dark:border-[#333333] px-5 py-2 text-sm font-semibold text-[#4d5a51] dark:text-[#a1a1aa] transition hover:bg-white/60 dark:hover:bg-black/40" href="https://www.facebook.com/ZionAGMadiwala" target="_blank" rel="noreferrer">
                        Facebook
                      </a>
                      <a className="rounded-full border border-[#d8ccb8] dark:border-[#333333] px-5 py-2 text-sm font-semibold text-[#4d5a51] dark:text-[#a1a1aa] transition hover:bg-white/60 dark:hover:bg-black/40" href="https://www.instagram.com/ZionAGMadiwala" target="_blank" rel="noreferrer">
                        Instagram
                      </a>
                      <a className="rounded-full border border-[#d8ccb8] dark:border-[#333333] px-5 py-2 text-sm font-semibold text-[#4d5a51] dark:text-[#a1a1aa] transition hover:bg-white/60 dark:hover:bg-black/40" href={`mailto:${emailAddress}`}>
                        Email
                      </a>
                    </div>
                  </div>
                </div>

                <form id="pray" className="rounded-[2rem] bg-white/75 dark:bg-black/30 dark:border-white/10 p-5 shadow-xl shadow-[#3d2a17]/8 ring-1 ring-[#e1d4be] sm:p-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a6b31] dark:text-[#d8b14c]">{t.sendPrayerRequest}</p>
                  <h3 className="mt-3 text-3xl font-semibold tracking-tight text-[#223328] dark:text-white">{t.prayForRequest}</h3>
                  <label className="mt-6 grid gap-2 text-sm font-semibold text-[#33443a] dark:text-gray-200">
                    Prayer request
                    <textarea
                      value={prayerRequest}
                      onChange={(event) => setPrayerRequest(event.target.value)}
                      rows={7}
                      className="resize-none rounded-2xl border border-[#d9cbb6] dark:border-[#333333] bg-[#fbf8f1] dark:bg-[#1e1e1e] px-4 py-3 font-normal outline-none transition focus:border-[#9a6b31] focus:ring-4 focus:ring-[#d9b16d]/20"
                      placeholder={t.prayerPlaceholder}
                    />
                  </label>
                  <a
                    href={prayerWhatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#223328] dark:bg-[#2a3f32] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#31483a] focus:outline-none focus:ring-4 focus:ring-[#223328]/20"
                  >
                    {t.sendWhatsapp}
                  </a>
                </form>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ─── Clean Footer: Only Church Address + Offering Link ─── */}
      <footer className="bg-[#17251d] px-5 py-10 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-bold text-white">Zion AG Church Main Sanctuary</h3>
            <p className="max-w-md text-sm text-white/80 leading-relaxed">
              22, Maruthi Nagar Main Rd, beside Amravati Hotel, Zuzuvadi, BTM Layout, Bengaluru - 560068
            </p>
          </div>
          <button
            onClick={() => setIsOfferingOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#d8b14c] px-6 py-3 text-sm font-bold text-[#1a2a1e] transition hover:bg-[#f0ca60] focus:outline-none focus:ring-4 focus:ring-[#d8b14c]/30 shadow-lg shrink-0"
          >
            Give an Offering
          </button>
        </div>
      </footer>

      {/* ─── Event Details Modal ─── */}
      {selectedEventModal && (() => {
        const evtDate = selectedEventModal.date
          ? new Date(selectedEventModal.date + 'T00:00:00')
          : null;
        const formattedDate = evtDate
          ? evtDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
          : '';
        return (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedEventModal(null)}>
            <div
              className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-[#faf7f2] dark:bg-[#17231b] border-t border-[#d8b14c]/30 sm:border shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Image / close */}
              {selectedEventModal.image ? (
                <div className="relative h-44 sm:h-52 w-full shrink-0 overflow-hidden">
                  <img src={selectedEventModal.image} alt={selectedEventModal.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <button
                    onClick={() => setSelectedEventModal(null)}
                    className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center text-white bg-black/50 hover:bg-black/70 rounded-full text-base transition"
                    aria-label="Close"
                  >✕</button>
                </div>
              ) : (
                <div className="flex justify-end px-4 pt-4 shrink-0">
                  <button onClick={() => setSelectedEventModal(null)} className="h-8 w-8 flex items-center justify-center rounded-full text-[#8a5f2b] dark:text-[#d8b14c] hover:bg-[#d8b14c]/15 text-base transition">✕</button>
                </div>
              )}

              {/* Scrollable body */}
              <div className="overflow-y-auto px-5 pt-4 pb-6 sm:px-6">
                {/* Category badge */}
                {selectedEventModal.category && (
                  <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#8a5f2b] dark:text-[#d8b14c] bg-[#d8b14c]/15 rounded-full mb-2">
                    {selectedEventModal.category}
                  </span>
                )}

                {/* Title */}
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#223328] dark:text-white leading-snug mb-4">
                  {selectedEventModal.title}
                </h3>

                {/* Info rows */}
                <div className="space-y-2.5 mb-4">
                  {formattedDate && (
                    <div className="flex items-start gap-3 text-sm">
                      <span className="shrink-0 mt-0.5 text-[#d8b14c] text-base">📅</span>
                      <div>
                        <p className="font-semibold text-[#223328] dark:text-white text-xs uppercase tracking-wider mb-0.5">Date</p>
                        <p className="text-[#4f5c53] dark:text-gray-300">{formattedDate}</p>
                      </div>
                    </div>
                  )}
                  {selectedEventModal.time && (
                    <div className="flex items-start gap-3 text-sm">
                      <span className="shrink-0 mt-0.5 text-[#d8b14c] text-base">🕐</span>
                      <div>
                        <p className="font-semibold text-[#223328] dark:text-white text-xs uppercase tracking-wider mb-0.5">Time</p>
                        <p className="text-[#4f5c53] dark:text-gray-300">{selectedEventModal.time}</p>
                      </div>
                    </div>
                  )}
                  {selectedEventModal.venue && (
                    <div className="flex items-start gap-3 text-sm">
                      <span className="shrink-0 mt-0.5 text-[#d8b14c] text-base">📍</span>
                      <div>
                        <p className="font-semibold text-[#223328] dark:text-white text-xs uppercase tracking-wider mb-0.5">Venue</p>
                        <p className="text-[#4f5c53] dark:text-gray-300">{selectedEventModal.venue}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {selectedEventModal.description && (
                  <p className="text-sm leading-relaxed text-[#4f5c53] dark:text-gray-200 border-t border-[#dfd2bd] dark:border-white/10 pt-4">
                    {selectedEventModal.description}
                  </p>
                )}

                {/* Close button */}
                <div className="mt-5 flex justify-end">
                  <button
                    onClick={() => setSelectedEventModal(null)}
                    className="px-6 py-2.5 rounded-full bg-[#223328] dark:bg-[#d8b14c] text-white dark:text-[#1c2920] font-semibold text-sm hover:opacity-90 active:scale-95 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Lightbox for Announcements */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-8 overflow-hidden"
          onClick={() => { setSelectedImage(null); setIsZoomed(false); }}
        >
          <button
            className="absolute top-6 right-6 text-white hover:text-[#f6d49b] transition p-2 bg-black/40 hover:bg-black/60 rounded-full z-[110]"
            onClick={() => { setSelectedImage(null); setIsZoomed(false); }}
            aria-label="Close fullscreen image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <div className={`transition-transform duration-500 flex items-center justify-center w-full h-full ${isZoomed ? 'scale-[1.6]' : 'scale-100'}`}>
            <img
              src={cachedUrls[selectedImage] || selectedImage}
              alt="Announcement Fullscreen"
              className={`max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed(!isZoomed);
              }}
            />
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 z-[300] -translate-x-1/2 rounded-full bg-[#17251d] px-6 py-3 text-sm text-white shadow-2xl backdrop-blur-md transition-all">
          {toastMessage}
        </div>
      )}

      {/* Language Selection Modal */}
      {showLangModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xl">
          <div className="w-full max-w-sm rounded-[32px] bg-[#f7f2e8] dark:bg-[#121212] p-8 text-center shadow-2xl">
            <img src="./images/church_logo.webp" alt="Zion AG Logo" className="mx-auto mb-4 h-24 w-auto drop-shadow-md" />
            <h2 className="mb-6 font-serif text-2xl font-bold text-[#223328] dark:text-white">{t.welcomesYou || "Welcomes You"}</h2>
            <div className="flex flex-col gap-3">
              <button onClick={() => handleLangChange('en')} className="rounded-full bg-white dark:bg-[#1e1e1e] px-5 py-3 font-semibold text-[#24342b] dark:text-[#e4e4e7] shadow hover:bg-[#d8b14c] hover:text-white transition">English</button>
              <button onClick={() => handleLangChange('ta')} className="rounded-full bg-white dark:bg-[#1e1e1e] px-5 py-3 font-semibold text-[#24342b] dark:text-[#e4e4e7] shadow hover:bg-[#d8b14c] hover:text-white transition">தமிழ் (Tamil)</button>
              <button onClick={() => handleLangChange('kn')} className="rounded-full bg-white dark:bg-[#1e1e1e] px-5 py-3 font-semibold text-[#24342b] dark:text-[#e4e4e7] shadow hover:bg-[#d8b14c] hover:text-white transition">ಕನ್ನಡ (Kannada)</button>
              <button onClick={() => handleLangChange('te')} className="rounded-full bg-white dark:bg-[#1e1e1e] px-5 py-3 font-semibold text-[#24342b] dark:text-[#e4e4e7] shadow hover:bg-[#d8b14c] hover:text-white transition">తెలుగు (Telugu)</button>
              <button onClick={() => handleLangChange('hi')} className="rounded-full bg-white dark:bg-[#1e1e1e] px-5 py-3 font-semibold text-[#24342b] dark:text-[#e4e4e7] shadow hover:bg-[#d8b14c] hover:text-white transition">हिंदी (Hindi)</button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Banners */}
      <NotificationsContainer />
    </div>
  );
}
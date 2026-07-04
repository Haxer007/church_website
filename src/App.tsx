import { useState, useEffect, useRef } from "react";
import { translations, Language } from "./translations";
import { AddToCalendarButton } from 'add-to-calendar-button-react';
import NotificationsContainer from "./NotificationsContainer";
import {
  getAnnouncements, getNotifications, getMannaVerses, getVerseDays, getTranslationOverrides,
  getAnnouncementMode, getSectionVisibility, ensureArray,
  Announcement, NotificationBanner, MannaVerse, VerseDayEntry, TranslationOverrides, AnnouncementMode, SectionVisibility,
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
  { label: t.navContact, href: "#contact" },
  { label: t.navAbout, href: "#about" },
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

const getContactLocations = (t: any) => [
  {
    name: t.mainChurch,
    address: ["22, Maruthi Nagar Main Rd", "beside Amravati Hotel, Zuzuvadi", "BTM Layout, Bengaluru - 560068"],
    link: "https://www.google.com/maps/search/?api=1&query=22%20Maruthi%20Nagar%20Main%20Rd%20beside%20Amravati%20Hotel%20Zuzuvadi%20BTM%20Layout%20Bengaluru%20560068",
    action: t.openMaps,
  },
  {
    name: t.sundayVenue,
    address: ["Christ University College", "Dharmaram Auditorium", "Hosur Road - 560029"],
    link: mapsLink,
    action: t.getDirections,
  },
  {
    name: t.hosaRoadBranch,
    address: ["324, Hosa Rd, Akshaya Layout", "Sai Sree Layout, Rayasandra", "Bengaluru - 560100"],
    link: "https://maps.app.goo.gl/VG5doU4NchkBvb3Q6",
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
  { src: './images/poster_prayer.png', alt: 'Prayer Night', label: '🙏 Prayer Night' },
  { src: './images/poster_youth.png', alt: 'Youth Meeting', label: '⚡ Youth Alive' },
  { src: './images/poster_women.png', alt: 'Women Fellowship', label: '🌸 Women of Faith' },
  { src: './images/poster_revival.png', alt: 'Revival Meeting', label: '🔥 Revival Fire' },
  { src: './images/poster_christmas.png', alt: 'Christmas Celebration', label: '🎄 Christmas' },
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
    }));
    // Also update localStorage cache so admin panel shows latest data
    if (raw.announcements) localStorage.setItem('admin_announcements', JSON.stringify(raw.announcements));
    if (raw.notifications) localStorage.setItem('admin_notifications', JSON.stringify(raw.notifications));
    if (raw.mannaVerses) localStorage.setItem('admin_manna_verses', JSON.stringify(raw.mannaVerses));
    if (raw.translationOverrides) localStorage.setItem('admin_translation_overrides', JSON.stringify(raw.translationOverrides));
    if (raw.verseDays) localStorage.setItem('admin_verse_of_day', JSON.stringify(raw.verseDays));
    if (raw.sectionVisibility) localStorage.setItem('admin_section_visibility', JSON.stringify(raw.sectionVisibility));

    // Dispatch event so same-tab listeners like NotificationsContainer refresh immediately
    window.dispatchEvent(new CustomEvent('adminDataChanged'));
  }

  const ADMIN_LS_KEYS = [
    'admin_announcements', 'admin_notifications', 'admin_manna_verses',
    'admin_verse_of_day', 'admin_translation_overrides', 'admin_section_visibility',
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
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [selectedService]);

  const t = tRaw;
  const navItems = [
    { label: t.navHome, href: "#home" },
    ...(adminData.sectionVisibility?.announcements !== false ? [{ label: t.navAnnouncements, href: "#announcements" }] : []),
    ...(adminData.sectionVisibility?.ministries !== false ? [{ label: t.navMinistries, href: "#ministries" }] : []),
    ...(adminData.sectionVisibility?.dailyManna !== false ? [{ label: t.navDailyManna, href: "#daily-manna" }] : []),
    ...(adminData.sectionVisibility?.manna !== false ? [{ label: "Manna", href: "#manna" }] : []),
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
  const [prayerRequest, setPrayerRequest] = useState("");
  const [mannaIndex, setMannaIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const verseRef = useRef<HTMLDivElement>(null);
  const mannaRef = useRef<HTMLElement>(null);
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
  const prayerMessage = prayerRequest.trim()
    ? `Prayer request: ${prayerRequest.trim()}`
    : "Hello Zion AG Church, I would like to share a prayer request.";
  const prayerWhatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(prayerMessage)}`;

  return (
    <div className={`min-h-screen bg-[#f7f2e8] dark:bg-[#121212] text-[#24342b] dark:text-[#e4e4e7] ${lang === "te" ? "telugu-font" : ""} ${lang !== "en" ? "indic-lang" : ""}`}>
      <header className="animate-header fixed inset-x-0 top-0 z-50 border-b border-white/25 bg-[#f7f2e8]/60 dark:bg-[#121212]/60 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8" aria-label="Main navigation">
          <a href="#home" onClick={closeMenu} className="flex items-center gap-3 font-serif text-lg tracking-tight text-[#223328] dark:text-white sm:text-xl">
            <img src="./images/church_logo.png" alt="Zion AG Logo" className="h-8 w-auto drop-shadow-sm" />
            ZION AG CHURCH
          </a>

          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d7cbb5] dark:border-[#333333] text-[#24342b] dark:text-[#e4e4e7] transition hover:bg-white/70 dark:hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-[#b48a52] md:hidden"
          >
            <span className="sr-only">Menu</span>
            <span className="relative h-4 w-5">
              <span className={`absolute left-0 top-0 h-0.5 w-5 bg-current transition ${isMenuOpen ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`absolute left-0 top-2 h-0.5 w-5 bg-current transition ${isMenuOpen ? "opacity-0" : ""}`} />
              <span className={`absolute left-0 top-4 h-0.5 w-5 bg-current transition ${isMenuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
            </span>
          </button>

          <div className="hidden items-center gap-7 text-sm font-medium text-[#3f4d43] dark:text-[#a1a1aa] md:flex">
            {/* Font size control */}
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
            <div className="mobile-menu relative z-50 border-t border-[#dfd2bd] dark:border-[#333333] bg-[#f7f2e8]/60 dark:bg-[#121212]/60 backdrop-blur-xl px-5 py-5 shadow-2xl shadow-[#3f2c18]/10 md:hidden">
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

                {/* Theme & Font Size Row */}
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#8a5f2b] dark:text-[#d8b14c] flex items-center gap-4">
                    Theme
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDarkMode(!isDarkMode);
                      }}
                      className="text-[#8a5f2b] dark:text-[#d8b14c] transition-all duration-300 hover:scale-110 focus:outline-none flex items-center justify-center"
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
                  </span>

                  {/* Font Size controls */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 border border-[#dfd2bd] dark:border-[#333333] rounded-full px-2 py-0.5 bg-white/40 dark:bg-black/20 select-none"
                  >
                    <button
                      onClick={() => handleFontSizeChange(fontSize - 10)}
                      className="text-xs font-bold text-[#8a5f2b] dark:text-[#d8b14c] hover:opacity-80 px-1.5 focus:outline-none"
                      title="Decrease Text Size"
                    >
                      A-
                    </button>
                    <span className="text-[11px] font-bold text-[#3f4d43] dark:text-[#a1a1aa] min-w-[30px] text-center">{fontSize}%</span>
                    <button
                      onClick={() => handleFontSizeChange(fontSize + 10)}
                      className="text-xs font-bold text-[#8a5f2b] dark:text-[#d8b14c] hover:opacity-80 px-1.5 focus:outline-none"
                      title="Increase Text Size"
                    >
                      A+
                    </button>
                  </div>
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

      <main>
        <section id="home" className="relative flex min-h-screen items-end overflow-hidden px-5 pb-16 pt-28 sm:px-8 lg:pb-24">
          <div
            aria-hidden="true"
            className="hero-photo-motion absolute inset-0 bg-cover bg-top origin-top"
            style={{ backgroundImage: "url('./images/church-hero.jpg')" }}
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#17251d]/92 via-[#17251d]/45 to-[#17251d]/10" />

          <div className="animate-hero-copy relative z-10 mx-auto w-full max-w-7xl">
            <div className="max-w-4xl rounded-[2rem] border border-white/10 bg-black/30 p-6 shadow-2xl backdrop-blur-md sm:p-10 lg:p-12">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.34em] text-[#f6d49b]">Madiwala, Bengaluru</p>
              <h1 className="font-serif text-5xl leading-[0.95] tracking-tight text-white sm:text-7xl lg:text-8xl">
                Zion AG Church, Madiwala
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/82 sm:text-lg">
                {t.christCentered}
              </p>

              {/* ── Service Selector ── */}
              <div className="mt-8">
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#f6d49b]/80">
                  {t.pickServiceLabel || 'Choose your Sunday service'}
                </p>
                <div className="flex flex-wrap gap-2">
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

                {/* ── Selected Service Details (Smooth Transition Wrapper) ── */}
                <div
                  ref={serviceDetailsRef}
                  className={`grid transition-[grid-template-rows,opacity,margin] duration-500 ease-in-out ${selectedService ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'
                    }`}
                >
                  <div className="overflow-hidden">
                    {(() => {
                      const services: Record<string, { time: string; venue: string; address: string; mapLink: string }> = {
                        kn: {
                          time: '8:00 AM',
                          venue: t.venueMaruthi || 'Zion AG Church, Maruthi Nagar',
                          address: t.addressMaruthi || '22, Maruthi Nagar Main Rd, beside Amravati Hotel, BTM Layout, Bengaluru - 560068',
                          mapLink: 'https://www.google.com/maps/search/?api=1&query=22%20Maruthi%20Nagar%20Main%20Rd%20beside%20Amravati%20Hotel%20Zuzuvadi%20BTM%20Layout%20Bengaluru%20560068',
                        },
                        ta: {
                          time: '8:00 AM',
                          venue: t.venueDharmaram || 'Dharmaram Auditorium, Christ University College',
                          address: t.addressDharmaram || 'Dharmaram College Post, Hosur Road, Bengaluru - 560029',
                          mapLink: mapsLink,
                        },
                        te: {
                          time: '9:30 AM',
                          venue: t.venueDharmaram || 'Dharmaram Auditorium, Christ University College',
                          address: t.addressDharmaram || 'Dharmaram College Post, Hosur Road, Bengaluru - 560029',
                          mapLink: mapsLink,
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
                        <div className="rounded-2xl border border-[#d8b14c]/30 bg-gradient-to-br from-[#1a2a1e]/80 to-[#0f1a13]/80 p-5 backdrop-blur-sm shadow-xl">
                          <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#d8b14c]/15 text-2xl">
                              ⏰
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-2xl font-bold text-[#f6d49b]">{s.time}</p>
                                {langInfo && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#d8b14c]/20 px-2.5 py-0.5 text-xs font-semibold text-[#f6d49b] border border-[#d8b14c]/30 shadow-sm backdrop-blur-sm">
                                    <span>{langInfo.emoji}</span>
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

                {/* Show Watch Live when no service selected (Smooth Transition Wrapper) */}
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

        {adminData.sectionVisibility?.about !== false && (
          <section id="about" className="relative scroll-mt-24 overflow-hidden bg-[#f7f2e8] dark:bg-[#121212] px-5 py-16 sm:px-8 lg:py-24">

            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.8)_0%,transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(216,177,76,0.1)_0%,transparent_70%)]" />          <DarkFluidBackground />

            <div className="relative z-10 mx-auto max-w-4xl text-center">
              <p className="text-[13px] font-semibold uppercase tracking-[0.25em] text-[#9a6b31] dark:text-[#d8b14c]">✦ OUR STORY ✦</p>
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

                <div className="mx-auto mb-8 max-w-2xl rounded-2xl border border-[#d8ccb8] dark:border-[#333333]/50 bg-[#fbf8f1] dark:bg-[#1e1e1e]/80 p-5 text-[15px] font-medium text-[#3f4d43] dark:text-[#a1a1aa] shadow-sm sm:text-[16px]">
                  {t.aboutBanner}
                </div>

                <div className="mx-auto mb-10 flex max-w-2xl items-center justify-center gap-4 text-left sm:text-center">
                  <div className="hidden h-10 w-1 bg-[#d8b14c] sm:block"></div>
                  <p className="border-l-4 border-[#d8b14c] pl-5 font-serif text-[20px] italic leading-relaxed text-[#9a6b31] dark:text-[#d8b14c] sm:border-l-0 sm:pl-0 sm:text-[24px]">
                    {t.aboutQuote}
                  </p>
                </div>

                <div className="mx-auto mt-10 max-w-2xl border-t border-[#d8ccb8] dark:border-[#333333]/50 pt-10 text-center">
                  <div className="mx-auto mb-6 flex h-40 w-40 sm:h-52 sm:w-52 items-center justify-center overflow-hidden rounded-full border-4 border-white shadow-xl ring-2 ring-[#e1d4be]">
                    <img
                      src="./images/pastor.png"
                      alt="{t.pastorName}"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <h3 className="font-serif text-[26px] font-semibold text-[#8a5f2b] dark:text-[#d8b14c] sm:text-[30px]">{t.pastorName}</h3>
                  <p className="mt-2 text-[13px] font-bold uppercase tracking-widest text-[#5c675f] dark:text-[#a1a1aa] sm:text-[14px]">
                    {t.pastorTitle}
                  </p>
                  <p className="mt-5 text-[15px] leading-[1.8] text-[#4f5c53] dark:text-gray-200 sm:text-[16px]">
                    {t.pastorDesc.split("Pastor Sheeba")[0]}<span className="font-semibold text-[#8a5f2b] dark:text-[#d8b14c]">{t.pastorDesc.split("Pastor Sheeba")[1]}</span>{t.pastorDesc.split("Pastor Sheeba")[2]}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}


        {adminData.sectionVisibility?.announcements !== false && (
          <section id="announcements" className="section-reveal scroll-mt-24 px-5 py-16 sm:px-8 lg:py-24 relative overflow-hidden">

            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(216,177,76,0.08)_0%,transparent_50%)]" />          <DarkFluidBackground />

            <div className="mx-auto max-w-6xl text-center relative z-10">
              <p className="text-[13px] font-semibold uppercase tracking-[0.25em] text-[#9a6b31] dark:text-[#d8b14c]">{t.stayUpdated}</p>
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
                {extendedPosters.map((poster, index) => (
                  <div
                    key={index}
                    className={`snap-center shrink-0 w-[280px] sm:w-[320px] aspect-[4/5] rounded-[24px] overflow-hidden border border-white/40 cursor-pointer transition-all duration-500 group relative ${activeIndex === index
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
                      src={poster.src}
                      alt={poster.alt}
                      loading="lazy"
                      onDragStart={(e) => e.preventDefault()}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 pt-16 text-left">
                      <span className="text-white font-medium text-lg drop-shadow-md">
                        {poster.label}
                      </span>
                    </div>
                  </div>
                ))}
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


        {adminData.sectionVisibility?.ministries !== false && (
          <section id="ministries" className="relative scroll-mt-24 overflow-hidden bg-[#f7f2e8] dark:bg-[#121212] px-3 py-16 sm:px-8 lg:py-24">

            {/* Radial Glow Background */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.8)_0%,transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(216,177,76,0.1)_0%,transparent_70%)]" />

            <div className="relative z-10 mx-auto max-w-6xl text-center">
              <p className="text-[11px] sm:text-[13px] font-semibold uppercase tracking-[0.25em] text-[#9a6b31] dark:text-[#d8b14c]">{t.growWithUs}</p>
              <h2 className="mt-3 font-serif text-[32px] sm:text-[42px] leading-[1.2] text-[#223328] dark:text-white drop-shadow-[0_2px_10px_rgba(154,107,49,0.1)] lg:text-[64px]">
                {t.ministriesTitle}
              </h2>

              <div className="mt-8 sm:mt-12 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
                {getMinistries(t).map((ministry) => (
                  <article
                    key={ministry.name}
                    className="group relative flex h-full flex-col overflow-hidden rounded-[20px] sm:rounded-[28px] border border-white/60 bg-white/50 dark:bg-black/30 dark:border-white/10 p-4 sm:p-6 text-center shadow-[0_12px_30px_rgba(61,42,23,0.08)] -translate-y-1 cursor-pointer backdrop-blur-[12px] transition-all duration-300 ease-out hover:-translate-y-2 hover:border-[#d8b14c]/50 dark:border-[#d8b14c]/30 hover:shadow-[0_20px_40px_rgba(154,107,49,0.15)] active:scale-105 active:shadow-[0_24px_50px_rgba(154,107,49,0.25)] before:absolute before:-left-[150%] before:top-0 before:z-0 before:h-full before:w-[50%] before:-skew-x-[25deg] before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent before:transition-all before:duration-700 hover:before:left-[200%]"
                  >
                    <div className="relative z-10 mb-3 sm:mb-4 text-[24px] sm:text-[32px] transition-transform duration-300 group-hover:scale-110">
                      {ministry.emoji}
                    </div>
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
            </div>
          </section>
        )}


        {adminData.sectionVisibility?.promisePrayers !== false && (
          <section id="promise-prayers" className="relative px-5 py-16 sm:px-8 lg:py-24 bg-white/40 dark:bg-[#121212]/80">          <DarkFluidBackground />

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


        {adminData.sectionVisibility?.dailyManna !== false && (
          <section id="daily-manna" className="relative scroll-mt-24 overflow-hidden px-5 py-16 sm:px-8 lg:py-24">

            {/* Subtle background decoration */}
            <div className="pointer-events-none absolute inset-0 bg-[#f7f2e8] dark:bg-[#121212]">
              <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(216,177,76,0.06)_0%,transparent_70%)]" />
            </div>

            <div className="relative z-10 mx-auto max-w-4xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#9a6b31] dark:text-[#d8b14c]">{t.navDailyManna}</p>
              <h2 className="mt-3 font-serif text-4xl tracking-tight text-[#223328] dark:text-white sm:text-5xl">{t.dailyMannaTitle}</h2>

              {/* Glassmorphism Card */}
              <div className="relative mx-auto mt-12 max-w-3xl rounded-[32px] border border-white/60 bg-white/50 dark:bg-black/30 dark:border-white/10 p-8 shadow-[0_12px_40px_rgba(61,42,23,0.06)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_16px_50px_rgba(154,107,49,0.1)] sm:p-12">
                {/* Decorative quotation marks */}
                {/* <div className="absolute left-8 top-6 select-none font-serif text-[60px] leading-none text-[#d8b14c]/30 sm:left-10 sm:top-8">"</div> */}

                <blockquote className="relative z-10 mx-auto max-w-2xl font-serif text-2xl leading-[1.3] text-[#24342b] dark:text-[#e4e4e7] sm:text-3xl lg:text-4xl">
                  {dailyMannaVerses[mannaIndex].verse}
                </blockquote>

                <p className="relative z-10 mt-6 text-lg font-bold tracking-wide text-[#9a6b31] dark:text-[#d8b14c] sm:text-xl">
                  {dailyMannaVerses[mannaIndex].reference}
                </p>

                <div className="relative z-10 mx-auto mt-8 max-w-xl border-t border-[#d8ccb8] dark:border-[#333333]/60 pt-6">
                  <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#5c675f] dark:text-[#a1a1aa] sm:text-base">{t.reflection}</p>
                  <p className="text-[15px] leading-relaxed text-[#4f5c53] dark:text-gray-200 sm:text-[17px]">
                    {dailyMannaVerses[mannaIndex].reflection}
                  </p>
                </div>
              </div>

              {/* Neon Glowing Button */}
              <button
                onClick={getNewVerse}
                className="group relative mt-10 inline-flex items-center justify-center rounded-full bg-[#1c2920] px-8 py-4 text-sm font-bold uppercase tracking-widest text-white outline-none transition-all duration-300 hover:scale-105 hover:bg-[#2a3c2f] focus:ring-4 focus:ring-[#d8b14c]/40 active:scale-95"
              >
                <span className="absolute inset-0 rounded-full bg-[#d8b14c] opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-40"></span>
                <span className="relative flex items-center gap-2">
                  {t.newVerse.split("↻")[0]}<span className="text-lg transition-transform duration-500 group-hover:rotate-180">↻</span>
                </span>
              </button>

              {/* Verse of Day Image */}
              {todayVerseImage && (
                <div className="mt-10 mx-auto max-w-3xl">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#9a6b31] dark:text-[#d8b14c] mb-4">✦ Today's Verse Image ✦</p>
                  <div className="rounded-[24px] overflow-hidden border border-white/60 dark:border-white/10 shadow-[0_12px_40px_rgba(61,42,23,0.1)]">
                    <img
                      src={todayVerseImage}
                      alt="Verse of the day"
                      className="w-full object-contain max-h-[500px]"
                    />
                  </div>
                </div>
              )}

              {/* Verse of Day text if set by admin */}
              {todayVerse && (
                <div className="mt-8 mx-auto max-w-3xl rounded-[24px] border border-[#d8b14c]/30 bg-[#d8b14c]/5 dark:bg-[#d8b14c]/10 p-6 text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#9a6b31] dark:text-[#d8b14c] mb-3">✦ Pastor's Verse for Today ✦</p>
                  <blockquote className="font-serif text-xl text-[#24342b] dark:text-[#e4e4e7] italic leading-relaxed">{todayVerse.verse}</blockquote>
                  <p className="mt-3 font-bold text-[#9a6b31] dark:text-[#d8b14c]">{todayVerse.reference}</p>
                  {todayVerse.reflection && <p className="mt-3 text-sm text-[#5c675f] dark:text-gray-300">{todayVerse.reflection}</p>}
                </div>
              )}
            </div>
          </section>
        )}

        {adminData.sectionVisibility?.manna !== false && (
          <section id="manna" className="relative scroll-mt-24 overflow-hidden px-5 py-16 sm:px-8 lg:py-24 bg-[#f7f2e8] dark:bg-[#121212]">
            <DarkFluidBackground />
            <div className="relative z-10 mx-auto max-w-4xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#9a6b31] dark:text-[#d8b14c]">✦ MANNA FOR YOUR SOUL ✦</p>
              <h2 className="mt-3 font-serif text-4xl tracking-tight text-[#223328] dark:text-white sm:text-5xl">How are you feeling today?</h2>
              <p className="mt-2 text-sm text-[#5c675f] dark:text-[#a1a1aa] max-w-md mx-auto">Select a category below to receive a customized scripture promise from God's Word</p>

              {/* Group Toggle Selector & Grid of Emotions */}
              <div ref={mannaRef}>
                {/* Group Toggle Selector */}
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
                    <span className="text-base">😔</span> Downcast / Seeking Comfort
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
                    <span className="text-base">😊</span> Hope / Seeking Guidance
                  </button>
                </div>

                {/* Grid of Emotions */}
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
                          <span>{c.emoji}</span> {c.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Conditional Display of Verse */}
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
                  <span className="text-4xl animate-bounce">📖</span>
                  <p className="text-sm">Choose an emotion above to receive a scripture promise...</p>
                </div>
              )}
            </div>
          </section>
        )}


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
                    {getContactLocations(t).map((location) => (
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

                <form className="rounded-[2rem] bg-white/75 dark:bg-black/30 dark:border-white/10 p-5 shadow-xl shadow-[#3d2a17]/8 ring-1 ring-[#e1d4be] sm:p-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a6b31] dark:text-[#d8b14c]">{t.sendPrayerRequest}</p>
                  <h3 className="mt-3 text-3xl font-semibold tracking-tight text-[#223328] dark:text-white">{t.prayForRequest}</h3>
                  <label className="mt-6 grid gap-2 text-sm font-semibold text-[#33443a] dark:text-gray-200 dark:text-[#a1a1aa]">
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

      <footer className="bg-[#17251d] px-5 py-8 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-serif text-lg text-white">{t.footerName}</p>
          <p>{t.footerServices}</p>
        </div>
      </footer>

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
              src={selectedImage}
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
            <img src="./images/church_logo.png" alt="Zion AG Logo" className="mx-auto mb-4 h-24 w-auto drop-shadow-md" />
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
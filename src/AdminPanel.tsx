import { useState, useEffect, useRef } from "react";
import {
  verifyPassword, getAnnouncements, saveAnnouncements,
  getNotifications, saveNotifications,
  getMannaVerses, saveMannaVerses,
  getVerseDays, saveVerseDays,
  getTranslationOverrides, saveTranslationOverrides,
  getAnnouncementMode, saveAnnouncementMode,
  getSectionVisibility, saveSectionVisibility,
  Announcement, NotificationBanner, MannaVerse, VerseDayEntry, AnnouncementMode, SectionVisibility,
} from "./adminStore";

import { translations, Language } from "./translations";
import { fetchVerse, fetchVerseMultiLang, BIBLE_TRANSLATIONS } from "./bibleApi";
import { generateVerseImage, GRADIENT_PRESETS } from "./canvasVerseImage";


const LANGS: Language[] = ['en', 'ta', 'kn', 'te', 'hi'];
const LANG_LABELS: Record<Language, string> = { en: 'English', ta: 'Tamil', kn: 'Kannada', te: 'Telugu', hi: 'Hindi' };

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// ─── Tab types ────────────────────────────────────────────────────────────────
type Tab = 'announcements' | 'notifications' | 'verses' | 'verseofday' | 'translations' | 'sections';


// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const ok = await verifyPassword(pw);
    setLoading(false);
    if (ok) { onLogin(); }
    else { setErr('Incorrect password. Please try again.'); setPw(''); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0e1a12] px-4">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔐</div>
          <h1 className="font-serif text-2xl text-white font-bold">Admin Access</h1>
          <p className="text-white/50 text-sm mt-1">Zion AG Church Dashboard</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={pw}
            onChange={e => { setPw(e.target.value); setErr(''); }}
            placeholder="Enter admin password"
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[#d8b14c] focus:ring-2 focus:ring-[#d8b14c]/20"
            autoFocus
          />
          {err && <p className="text-red-400 text-sm">{err}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#d8b14c] py-3 font-bold text-[#1a2a1e] transition hover:bg-[#f0ca60] disabled:opacity-50"
          >
            {loading ? 'Verifying…' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-white/30 text-xs mt-6">
          <a href="/" className="hover:text-white/60 transition">← Back to website</a>
        </p>
      </div>
    </div>
  );
}

// ─── Announcements Tab ────────────────────────────────────────────────────────
function AnnouncementsTab() {
  const [items, setItems] = useState<Announcement[]>(() => getAnnouncements());
  const [mode, setMode] = useState<AnnouncementMode>(() => getAnnouncementMode());
  const [label, setLabel] = useState('');
  const [alt, setAlt] = useState('');
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            toBase64(file).then(base64 => {
              setImgSrc(base64);
            });
            e.preventDefault();
            break;
          }
        }
      }
    }
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);


  function persist(next: Announcement[]) { setItems(next); saveAnnouncements(next); }
  function changeMode(m: AnnouncementMode) { setMode(m); saveAnnouncementMode(m); }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setImgSrc(await toBase64(f));
  }

  function addItem() {
    if (!label.trim()) return;
    persist([{ id: uid(), label, alt: alt || label, src: imgSrc, active: true, createdAt: Date.now() }, ...items]);
    setLabel(''); setAlt(''); setImgSrc(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  function toggle(id: string) {
    persist(items.map(a => a.id === id ? { ...a, active: !a.active } : a));
  }
  function remove(id: string) {
    if (confirmId === id) {
      persist(items.filter(a => a.id !== id));
      setConfirmId(null);
    } else {
      setConfirmId(id);
      setTimeout(() => setConfirmId(prev => prev === id ? null : prev), 3000);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">📢 Announcements</h2>

      {/* Display mode toggle */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <h3 className="text-[#d8b14c] font-semibold text-sm">📦 Display Mode</h3>
        <div className="flex gap-3">
          {(['merge', 'replace'] as AnnouncementMode[]).map(m => (
            <button key={m} onClick={() => changeMode(m)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold border transition ${
                mode === m ? 'bg-[#d8b14c] text-[#1a2a1e] border-[#d8b14c]' : 'bg-white/5 text-white/60 border-white/10 hover:border-white/30'
              }`}>
              {m === 'merge' ? '➕ Add Alongside Existing' : '🔄 Replace Existing'}
            </button>
          ))}
        </div>
        <p className="text-white/40 text-xs">
          {mode === 'merge'
            ? 'New announcements appear alongside default posters in the carousel.'
            : 'New announcements replace all default posters — only yours show.'}
        </p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <h3 className="text-[#d8b14c] font-semibold">Add New Announcement</h3>
        <input className={inp} placeholder="Label (e.g. 🙏 Prayer Night)" value={label} onChange={e => setLabel(e.target.value)} />
        <input className={inp} placeholder="Alt text" value={alt} onChange={e => setAlt(e.target.value)} />
        <div>
          <label className="text-white/60 text-sm block mb-1">Poster Image (optional) - Ctrl+V to paste from clipboard</label>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="text-white/70 text-sm" />
        </div>
        {imgSrc && <img src={imgSrc} className="h-28 rounded-xl object-cover" alt="preview" />}
        <button onClick={addItem} className={btn}>Add Announcement</button>
      </div>

      <div className="space-y-3">
        {items.length === 0 && <p className="text-white/40 text-sm">No announcements yet.</p>}
        {items.map(a => (
          <div key={a.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
            {a.src && <img src={a.src} className="h-12 w-12 rounded-lg object-cover shrink-0" alt={a.alt} />}
            {!a.src && <div className="h-12 w-12 rounded-lg bg-white/10 flex items-center justify-center text-xl shrink-0">📋</div>}
            <span className="flex-1 text-white text-sm">{a.label}</span>
            <button onClick={() => toggle(a.id)} className={`text-xs px-3 py-1 rounded-full font-semibold transition ${a.active ? 'bg-green-600/30 text-green-400 hover:bg-green-600/50' : 'bg-white/10 text-white/40 hover:bg-white/20'}`}>
              {a.active ? 'Active' : 'Hidden'}
            </button>
            <button onClick={() => remove(a.id)} className="text-red-400 hover:text-red-300 transition text-sm px-2 font-bold min-w-[70px] text-right">
              {confirmId === a.id ? 'Confirm?' : 'Remove'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────
function NotificationsTab() {
  const [items, setItems] = useState<NotificationBanner[]>(() => getNotifications());
  const [msg,  setMsg]  = useState('');
  const [type, setType] = useState<'static' | 'fading'>('fading');
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            toBase64(file).then(base64 => {
              setImgSrc(base64);
            });
            e.preventDefault();
            break;
          }
        }
      }
    }
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);


  function persist(next: NotificationBanner[]) { setItems(next); saveNotifications(next); }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setImgSrc(await toBase64(f));
  }

  function add() {
    if (!msg.trim()) return;
    persist([{ id: uid(), type, message: msg, image: imgSrc, active: true, createdAt: Date.now() }, ...items]);
    setMsg(''); setImgSrc(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  function toggle(id: string) { persist(items.map(n => n.id === id ? { ...n, active: !n.active } : n)); }
  function remove(id: string) {
    if (confirmId === id) {
      persist(items.filter(n => n.id !== id));
      setConfirmId(null);
    } else {
      setConfirmId(id);
      setTimeout(() => setConfirmId(prev => prev === id ? null : prev), 3000);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">🔔 Notification Banners</h2>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <h3 className="text-[#d8b14c] font-semibold">Add Notification</h3>
        <textarea className={inp} rows={3} placeholder="Notification message…" value={msg} onChange={e => setMsg(e.target.value)} />
        <div className="flex gap-3">
          {(['fading', 'static'] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold border transition ${type === t ? 'bg-[#d8b14c] text-[#1a2a1e] border-[#d8b14c]' : 'bg-white/5 text-white/60 border-white/10 hover:border-white/30'}`}>
              {t === 'fading' ? '⏱ Fading (3s)' : '📌 Static Banner'}
            </button>
          ))}
        </div>
        <p className="text-white/40 text-xs">
          {type === 'fading' ? 'Shows for 3s then fades. Click to pin; click outside or × to close.' : 'Stays until user clicks anywhere.'}
        </p>
        <div>
          <label className="text-white/60 text-sm block mb-1">Banner Image (optional) - Ctrl+V to paste from clipboard</label>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="text-white/70 text-sm" />
        </div>
        {imgSrc && (
          <div className="relative inline-block">
            <img src={imgSrc} className="h-24 rounded-xl object-cover" alt="preview" />
            <button onClick={() => setImgSrc(null)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button>
          </div>
        )}
        <button onClick={add} className={btn}>Add Notification</button>
      </div>
      <div className="space-y-3">
        {items.length === 0 && <p className="text-white/40 text-sm">No notifications yet.</p>}
        {items.map(n => (
          <div key={n.id} className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-xs bg-white/10 text-white/60 rounded-full px-2 py-0.5 shrink-0">{n.type}</span>
              <p className="text-white text-sm flex-1">{n.message}</p>
              {n.image && <img src={n.image} className="h-10 w-14 rounded-lg object-cover shrink-0" alt="" />}
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggle(n.id)} className={`text-xs px-3 py-1 rounded-full font-semibold transition ${n.active ? 'bg-green-600/30 text-green-400 hover:bg-green-600/50' : 'bg-white/10 text-white/40 hover:bg-white/20'}`}>
                {n.active ? 'Active' : 'Hidden'}
              </button>
              <button onClick={() => remove(n.id)} className="text-red-400 hover:text-red-300 transition text-sm px-2 font-bold min-w-[70px] text-left">
                {confirmId === n.id ? 'Confirm?' : 'Remove'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ─── Daily Manna Verses Tab ───────────────────────────────────────────────────

const LANG_LABELS_FULL: Record<Language, string> = { en: 'English', ta: 'Tamil', kn: 'Kannada', te: 'Telugu', hi: 'Hindi' };

function VersesTab() {
  const [items, setItems] = useState<MannaVerse[]>(() => getMannaVerses());
  const [verse, setVerse] = useState('');
  const [ref_,  setRef]   = useState('');
  const [refl,  setRefl]  = useState('');
  const [fetching,  setFetching]  = useState(false);
  const [fetchErr,  setFetchErr]  = useState('');
  const [fetchedLangs, setFetchedLangs] = useState<Record<string, string>>({});
  const [verseMode, setVerseMode] = useState<'multilang'|'english-only'>('multilang');
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null);

  function persist(next: MannaVerse[]) { setItems(next); saveMannaVerses(next); }

  async function autoFetchAll() {
    if (!ref_.trim()) { setFetchErr('Enter a reference first (e.g. John 3:16)'); return; }
    setFetching(true); setFetchErr(''); setFetchedLangs({});
    const result = await fetchVerseMultiLang(ref_.trim());
    setFetching(false);
    if ('error' in result) { setFetchErr(result.error); return; }
    setVerse(`"${result.en ?? ''}"`); 
    setRef(result.reference);
    const langs: Record<string, string> = {};
    for (const l of ['en','hi','te','ta','kn'] as const) {
      if ((result as any)[l]) langs[l] = (result as any)[l];
    }
    setFetchedLangs(langs);
  }

  function add() {
    if (!verse.trim() || !ref_.trim()) return;
    const newVerse: MannaVerse = {
      verse, reference: ref_, reflection: refl,
      langs: Object.keys(fetchedLangs).length > 0 ? fetchedLangs as any : undefined,
      verseMode,
    };
    persist([...items, newVerse]);
    setVerse(''); setRef(''); setRefl(''); setFetchedLangs({});
  }
  function remove(i: number) {
    if (confirmIndex === i) {
      persist(items.filter((_, j) => j !== i));
      setConfirmIndex(null);
    } else {
      setConfirmIndex(i);
      setTimeout(() => setConfirmIndex(prev => prev === i ? null : prev), 3000);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">📖 Daily Manna Verses</h2>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <h3 className="text-[#d8b14c] font-semibold">Add Verse</h3>

        {/* Reference + Fetch All Languages */}
        <div className="flex gap-2 items-stretch">
          <input
            className="flex-1 min-w-0 rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-white placeholder-white/30 outline-none focus:border-[#d8b14c]"
            placeholder="Reference (e.g. John 3:16)"
            value={ref_}
            onChange={e => { setRef(e.target.value); setFetchErr(''); setFetchedLangs({}); }}
            onKeyDown={e => e.key === 'Enter' && autoFetchAll()}
          />
          <button
            onClick={autoFetchAll} disabled={fetching}
            className="shrink-0 rounded-xl bg-[#1e4a2a] border border-[#d8b14c]/40 text-[#d8b14c] px-4 py-2.5 text-sm font-bold hover:bg-[#2a5c34] transition disabled:opacity-50"
          >
            {fetching ? '⏳' : '🌐 Fetch All'}
          </button>
        </div>
        {fetchErr && <p className="text-red-400 text-xs">{fetchErr}</p>}

        {/* Fetched language chips */}
        {Object.keys(fetchedLangs).length > 0 && (
          <div className="space-y-1">
            <p className="text-green-400 text-xs font-semibold">✅ Fetched languages:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(fetchedLangs).map(([l, text]) => (
                <span key={l} title={text} className="text-xs bg-green-900/40 border border-green-700/40 text-green-300 rounded-full px-3 py-1">
                  {LANG_LABELS_FULL[l as Language] ?? l}
                </span>
              ))}
              {Object.keys(fetchedLangs).length < 5 && (
                <span className="text-xs text-white/30 italic">Some languages unavailable — English used as fallback</span>
              )}
            </div>
          </div>
        )}

        {/* Verse Mode toggle */}
        <div>
          <p className="text-white/60 text-xs mb-2">Display mode for visitors:</p>
          <div className="flex gap-2">
            {(['multilang', 'english-only'] as const).map(m => (
              <button key={m} onClick={() => setVerseMode(m)}
                className={`flex-1 rounded-xl py-2 text-xs font-semibold border transition ${verseMode === m ? 'bg-[#d8b14c] text-[#1a2a1e] border-[#d8b14c]' : 'bg-white/5 text-white/60 border-white/10'}`}>
                {m === 'multilang' ? '🌐 Show in visitor\'s language' : '🇬🇧 English for all'}
              </button>
            ))}
          </div>
        </div>

        <textarea className={inp} rows={3} placeholder="English verse text (auto-filled by Fetch All)…" value={verse} onChange={e => setVerse(e.target.value)} />
        <textarea className={inp} rows={2} placeholder="Reflection / commentary…" value={refl} onChange={e => setRefl(e.target.value)} />
        <button onClick={add} className={btn}>Add Verse</button>
      </div>

      <div className="space-y-3">
        {items.length === 0 && <p className="text-white/40 text-sm">No custom verses added. Default verses are used.</p>}
        {items.map((v, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-1">
            <p className="text-white text-sm italic">"{v.verse}"</p>
            <p className="text-[#d8b14c] text-xs font-bold">{v.reference}</p>
            {v.reflection && <p className="text-white/50 text-xs">{v.reflection}</p>}
            <div className="flex gap-2 flex-wrap">
              {v.langs && Object.keys(v.langs).map(l => (
                <span key={l} className="text-xs bg-white/10 text-white/50 rounded-full px-2 py-0.5">{LANG_LABELS_FULL[l as Language] ?? l}</span>
              ))}
              {v.verseMode === 'english-only' && <span className="text-xs bg-yellow-900/30 text-yellow-400 rounded-full px-2 py-0.5">English only</span>}
            </div>
            <button onClick={() => remove(i)} className="text-red-400 text-xs hover:text-red-300 transition font-bold min-w-[70px] text-left">
              {confirmIndex === i ? 'Confirm?' : 'Remove'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}


// ─── Verse of Day Tab ─────────────────────────────────────────────────────────
function VerseOfDayTab() {
  const [days, setDays] = useState<VerseDayEntry[]>(() => getVerseDays());
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [lang, setLang] = useState<Language>('en');
  const [verse, setVerse] = useState('');
  const [ref_, setRef] = useState('');
  const [refl, setRefl] = useState('');
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [confirmDate, setConfirmDate] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            toBase64(file).then(base64 => {
              setImgSrc(base64);
            });
            e.preventDefault();
            break;
          }
        }
      }
    }
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Inline Bible fetch state
  const [bRef, setBRef] = useState('');
  const [bFetching, setBFetching] = useState(false);
  const [bErr, setBErr] = useState('');
  // Canvas image state
  const [gradientFrom, setGradientFrom] = useState('#1a2e1c');
  const [gradientTo,   setGradientTo]   = useState('#0d4a1e');
  const [canvasPreview, setCanvasPreview] = useState<string | null>(null);

  const entry = days.find(d => d.date === date);

  useEffect(() => {
    if (entry) {
      const v = entry.verses?.[lang];
      setVerse(v?.verse ?? '');
      setRef(v?.reference ?? '');
      setRefl(v?.reflection ?? '');
      setImgSrc(entry.images?.[lang] ?? null);
    } else {
      setVerse(''); setRef(''); setRefl(''); setImgSrc(null);
    }
  }, [date, lang, days]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setImgSrc(await toBase64(f));
  }

  async function doFetch() {
    if (!bRef.trim()) { setBErr('Enter a reference (e.g. John 3:16)'); return; }
    setBFetching(true); setBErr('');
    // Fetch in selected language if not English
    const trId = lang === 'en' ? 'BSB' : lang === 'hi' ? 'HINIRV' : lang === 'te' ? 'tel_irv' : lang === 'ta' ? 'tam_irv' : 'kan_irv';
    const result = await fetchVerse(bRef.trim(), trId);
    setBFetching(false);
    if ('error' in result) { setBErr(result.error); return; }
    setVerse(`"${result.text}"`);
    setRef(result.reference);
    setBRef('');
  }

  function generateCanvas() {
    if (!verse.trim() || !ref_.trim()) { alert('Enter verse text and reference first'); return; }
    const img = generateVerseImage({ verse: verse.replace(/^"|"$/g, ''), reference: ref_, gradientFrom, gradientTo });
    setCanvasPreview(img);
  }

  function useCanvasAsImage() {
    if (canvasPreview) setImgSrc(canvasPreview);
  }

  function save_() {
    const next = days.filter(d => d.date !== date);
    const existing = days.find(d => d.date === date);
    const newEntry: VerseDayEntry = {
      date,
      verses: { ...(existing?.verses ?? {}), [lang]: { verse, reference: ref_, reflection: refl } },
      images: { ...(existing?.images ?? {}), [lang]: imgSrc },
    };
    const updated = [...next, newEntry].sort((a, b) => a.date.localeCompare(b.date));
    setDays(updated); saveVerseDays(updated);
    alert(`Saved verse of day for ${date} [${LANG_LABELS[lang]}]`);
  }

  function removeDay(d: string) {
    if (confirmDate === d) {
      const updated = days.filter(x => x.date !== d);
      setDays(updated); saveVerseDays(updated);
      setConfirmDate(null);
    } else {
      setConfirmDate(d);
      setTimeout(() => setConfirmDate(prev => prev === d ? null : prev), 3000);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">🌅 Verse of the Day</h2>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-white/60 text-xs block mb-1">Date</label>
            <input type="date" className={inp} value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="text-white/60 text-xs block mb-1">Language</label>
            <select className={inp} value={lang} onChange={e => setLang(e.target.value as Language)}>
              {LANGS.map(l => <option key={l} value={l}>{LANG_LABELS[l]}</option>)}
            </select>
          </div>
        </div>

        {/* Inline Bible Fetch */}
        <div className="rounded-xl border border-[#d8b14c]/30 bg-[#d8b14c]/5 p-3 space-y-2">
          <p className="text-[#d8b14c] text-xs font-semibold">📖 Auto-fill from Bible API ({LANG_LABELS[lang]})</p>
          <div className="flex gap-2">
            <input
              className="flex-1 min-w-0 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-white text-sm placeholder-white/30 outline-none focus:border-[#d8b14c]"
              placeholder="e.g. John 3:16"
              value={bRef}
              onChange={e => { setBRef(e.target.value); setBErr(''); }}
              onKeyDown={e => e.key === 'Enter' && doFetch()}
            />
            <button onClick={doFetch} disabled={bFetching}
              className="shrink-0 rounded-xl bg-[#1e4a2a] border border-[#d8b14c]/40 text-[#d8b14c] px-4 py-2 text-sm font-bold hover:bg-[#2a5c34] transition disabled:opacity-50">
              {bFetching ? '⏳' : 'Fetch'}
            </button>
          </div>
          {bErr && <p className="text-red-400 text-xs">{bErr}</p>}
        </div>

        <textarea className={inp} rows={3} placeholder="Verse text…" value={verse} onChange={e => setVerse(e.target.value)} />
        <input className={inp} placeholder="Reference" value={ref_} onChange={e => setRef(e.target.value)} />
        <textarea className={inp} rows={2} placeholder="Reflection…" value={refl} onChange={e => setRefl(e.target.value)} />

        {/* Verse Image */}
        <div className="space-y-2">
          <label className="text-white/60 text-xs block">Upload Verse Image for {LANG_LABELS[lang]} - Ctrl+V to paste from clipboard</label>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="text-white/70 text-sm" />
        </div>

        {/* Canvas Image Generator */}
        <div className="rounded-xl border border-purple-500/30 bg-purple-900/10 p-4 space-y-3">
          <p className="text-purple-300 text-xs font-semibold">🎨 Auto-generate Verse Image</p>
          <div className="grid grid-cols-2 gap-2">
            {GRADIENT_PRESETS.map(p => (
              <button key={p.label} onClick={() => { setGradientFrom(p.from); setGradientTo(p.to); }}
                style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
                className={`rounded-lg py-2 px-3 text-xs text-white font-semibold border-2 transition ${gradientFrom === p.from ? 'border-[#d8b14c]' : 'border-transparent hover:border-white/30'}`}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={generateCanvas}
              className="flex-1 rounded-xl bg-purple-700 hover:bg-purple-600 text-white py-2 text-sm font-bold transition">
              🖼 Generate Preview
            </button>
            {canvasPreview && (
              <button onClick={useCanvasAsImage}
                className="flex-1 rounded-xl bg-[#d8b14c] hover:bg-[#f0ca60] text-[#1a2a1e] py-2 text-sm font-bold transition">
                ✅ Use This Image
              </button>
            )}
          </div>
          {canvasPreview && (
            <img src={canvasPreview} className="w-full rounded-xl object-cover" alt="canvas preview" />
          )}
        </div>

        {imgSrc && (
          <div className="relative inline-block">
            <img src={imgSrc} className="h-32 rounded-xl object-cover" alt="verse img" />
            <button onClick={() => setImgSrc(null)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button>
          </div>
        )}
        <button onClick={save_} className={btn}>Save for {date} [{LANG_LABELS[lang]}]</button>
      </div>


      <div className="space-y-3">
        <h3 className="text-white/70 font-semibold text-sm">Saved Days ({days.length})</h3>
        {days.length === 0 && <p className="text-white/40 text-sm">No verse-of-day entries yet.</p>}
        {[...days].reverse().map(d => (
          <div key={d.date} className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center gap-3">
            <span className="text-[#d8b14c] font-mono text-sm">{d.date}</span>
            <div className="flex gap-1 flex-wrap flex-1">
              {LANGS.filter(l => d.verses?.[l]).map(l => (
                <span key={l} className="text-xs bg-white/10 text-white/60 rounded-full px-2 py-0.5">{l}</span>
              ))}
              {LANGS.filter(l => d.images?.[l]).map(l => (
                <span key={l + '_img'} className="text-xs bg-[#d8b14c]/20 text-[#d8b14c] rounded-full px-2 py-0.5">🖼 {l}</span>
              ))}

            </div>
            <button onClick={() => removeDay(d.date)} className="text-red-400 hover:text-red-300 text-sm transition font-bold min-w-[70px] text-right">
              {confirmDate === d.date ? 'Confirm?' : 'Remove'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Translations Tab ─────────────────────────────────────────────────────────
function TranslationsTab() {
  const [overrides, setOverrides] = useState(() => getTranslationOverrides());
  const [lang, setLang] = useState<Language>('en');
  const [search, setSearch] = useState('');

  const base = translations[lang];
  const keys = Object.keys(base).filter(k =>
    !search || k.toLowerCase().includes(search.toLowerCase()) || base[k].toLowerCase().includes(search.toLowerCase())
  );

  function update(key: string, val: string) {
    const next = { ...overrides, [lang]: { ...(overrides[lang] ?? {}), [key]: val } };
    setOverrides(next); saveTranslationOverrides(next);
  }
  function reset(key: string) {
    const langOver = { ...(overrides[lang] ?? {}) };
    delete langOver[key];
    const next = { ...overrides, [lang]: langOver };
    setOverrides(next); saveTranslationOverrides(next);
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-white">🌐 Translations</h2>
      <div className="flex gap-3 flex-wrap">
        {LANGS.map(l => (
          <button key={l} onClick={() => setLang(l)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold border transition ${lang === l ? 'bg-[#d8b14c] text-[#1a2a1e] border-[#d8b14c]' : 'bg-white/5 text-white/60 border-white/10 hover:border-white/30'}`}>
            {LANG_LABELS[l]}
          </button>
        ))}
      </div>
      <input className={inp} placeholder="Search keys…" value={search} onChange={e => setSearch(e.target.value)} />
      <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
        {keys.map(k => {
          const cur = overrides[lang]?.[k];
          const isOverridden = cur !== undefined;
          return (
            <div key={k} className={`rounded-xl border p-3 space-y-1 transition ${isOverridden ? 'border-[#d8b14c]/40 bg-[#d8b14c]/5' : 'border-white/10 bg-white/5'}`}>
              <div className="flex items-center gap-2">
                <code className="text-xs text-[#d8b14c]/80 font-mono">{k}</code>
                {isOverridden && (
                  <button onClick={() => reset(k)} className="ml-auto text-xs text-red-400 hover:text-red-300 transition">Reset</button>
                )}
              </div>
              <p className="text-white/40 text-xs italic">Default: {base[k]}</p>
              <textarea
                className={inp + ' text-sm'}
                rows={2}
                value={cur ?? base[k]}
                onChange={e => update(k, e.target.value)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sections Tab ─────────────────────────────────────────────────────────────
function SectionsTab() {
  const [visibility, setVisibility] = useState<SectionVisibility>(() => getSectionVisibility());

  function toggle(key: keyof SectionVisibility) {
    const next = { ...visibility, [key]: !visibility[key] };
    setVisibility(next);
    saveSectionVisibility(next);
  }

  const sectionsList: { key: keyof SectionVisibility; label: string; desc: string }[] = [
    { key: 'about', label: '📖 Our Story / About Pastor', desc: 'Displays the pastor biography, photo, and church story' },
    { key: 'announcements', label: '📢 Announcements Carousel', desc: 'Displays the interactive sliding announcement posters' },
    { key: 'ministries', label: '⛪ Ministries Grid', desc: 'Displays the services, groups, and ministry times' },
    { key: 'promisePrayers', label: '🔥 Promise Prayers Section', desc: 'Displays the monthly Promise Prayer details with Calendar Sync' },
    { key: 'dailyManna', label: '📖 Daily Manna Scripture Card', desc: 'Displays the dynamic scripture cards and reflections' },
    { key: 'manna', label: '❤️ Mood Manna ("How are you feeling today?")', desc: 'Interactive dropdown that offers scriptures based on emotions' },
    { key: 'contact', label: '📞 Contact / Map & Prayer Requests', desc: 'Displays the address details, social links, and prayer request form' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">⚙️ Section Visibility Settings</h2>
      <p className="text-white/60 text-xs">
        Control which sections are displayed to visitors on the main website homepage. Toggles are saved and updated in real-time.
      </p>

      <div className="space-y-3">
        {sectionsList.map(({ key, label, desc }) => {
          const isVisible = visibility[key] !== false;
          return (
            <div key={key} className={`rounded-xl border p-4 flex items-center justify-between gap-4 transition ${isVisible ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 bg-white/5'}`}>
              <div className="space-y-1">
                <p className="font-semibold text-white text-sm">{label}</p>
                <p className="text-white/40 text-xs">{desc}</p>
              </div>
              <button
                onClick={() => toggle(key)}
                className={`shrink-0 rounded-full px-5 py-2 text-xs font-bold transition border ${
                  isVisible
                    ? 'bg-green-600 border-green-500 text-white hover:bg-green-500'
                    : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                }`}
              >
                {isVisible ? 'Visible' : 'Hidden'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ─── Shared styles ────────────────────────────────────────────────────────────
const inp = "w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-white placeholder-white/30 outline-none focus:border-[#d8b14c] focus:ring-2 focus:ring-[#d8b14c]/20 resize-none";
const btn = "w-full rounded-xl bg-[#d8b14c] py-2.5 font-bold text-[#1a2a1e] transition hover:bg-[#f0ca60]";

// ─── Main AdminPanel ──────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>('announcements');

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'announcements', label: '📢 Announcements' },
    { key: 'notifications', label: '🔔 Notifications' },
    { key: 'verses', label: '📖 Manna Verses' },
    { key: 'verseofday', label: '🌅 Verse of Day' },
    { key: 'translations', label: '🌐 Translations' },
    { key: 'sections', label: '⚙️ Sections' },
  ];


  return (
    <div className="min-h-screen bg-[#0e1a12] text-white">
      <header className="border-b border-white/10 bg-[#0a1610] px-5 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-lg font-bold text-[#d8b14c]">Zion AG Admin</h1>
          <p className="text-white/40 text-xs">Content Management</p>
        </div>
        <a href="/" className="text-sm text-white/40 hover:text-white/70 transition border border-white/10 rounded-full px-4 py-1.5">← Website</a>
      </header>

      <div className="flex flex-wrap gap-2 px-5 py-4 border-b border-white/10 bg-[#0c1914]">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${tab === t.key ? 'bg-[#d8b14c] text-[#1a2a1e]' : 'text-white/50 hover:text-white/80'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <main className="max-w-3xl mx-auto px-5 py-8">
        {tab === 'announcements' && <AnnouncementsTab />}
        {tab === 'notifications' && <NotificationsTab />}
        {tab === 'verses' && <VersesTab />}
        {tab === 'verseofday' && <VerseOfDayTab />}
        {tab === 'translations' && <TranslationsTab />}
        {tab === 'sections' && <SectionsTab />}

      </main>
    </div>
  );
}

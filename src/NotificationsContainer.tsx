import { useState, useEffect, useRef } from "react";
import { getNotifications, markNotificationSeen, getSeenNotificationIds, NotificationBanner } from "./adminStore";

// ─── Load active unseen notifications ─────────────────────────────────────────
function loadQueue(): NotificationBanner[] {
  const active = getNotifications().filter(n => n.active);
  const seen   = getSeenNotificationIds();
  return active.filter(n => !seen.includes(n.id));
}

// ─── Single Fading Banner ─────────────────────────────────────────────────────
function FadingBanner({ banner, onDismiss }: { banner: NotificationBanner; onDismiss: () => void }) {
  const [pinned,  setPinned]  = useState(false);
  const [visible, setVisible] = useState(true);
  const [fading,  setFading]  = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => { if (!pinned) startFade(); }, 3000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [pinned]);

  function startFade() {
    setFading(true);
    setTimeout(() => { setVisible(false); onDismiss(); }, 500);
  }

  function handleBannerClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!pinned) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setPinned(true);
      setFading(false);
    }
  }

  function close(e: React.MouseEvent) { e.stopPropagation(); startFade(); }

  useEffect(() => {
    if (!pinned) return;
    function handleClickOutside() { startFade(); }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [pinned]);

  if (!visible) return null;

  return (
    <div
      onClick={handleBannerClick}
      className={`relative rounded-2xl border border-[#d8b14c]/30 bg-[#1a2a1e]/95 backdrop-blur-xl shadow-2xl shadow-black/40 cursor-pointer transition-all duration-500 overflow-hidden ${fading ? 'opacity-0 translate-y-2 scale-95' : 'opacity-100'}`}
    >
      {/* Optional image */}
      {banner.image && (
        <img src={banner.image} alt="" className="w-full max-h-48 object-cover" />
      )}
      <div className="flex items-start gap-3 px-5 py-4">
        <span className="text-2xl shrink-0">🔔</span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm leading-relaxed">{banner.message}</p>
          {pinned  && <p className="text-white/40 text-xs mt-1">Click outside or × to close</p>}
          {!pinned && <p className="text-white/40 text-xs mt-1">Click to keep open</p>}
        </div>
        <button onClick={close} aria-label="Close notification"
          className="shrink-0 text-white/40 hover:text-white/80 transition text-xl leading-none mt-0.5">×</button>
      </div>
      {/* Progress bar */}
      {!pinned && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl overflow-hidden">
          <div className="h-full bg-[#d8b14c] animate-[shrink_3s_linear_forwards]" />
        </div>
      )}
    </div>
  );
}

// ─── Single Static Banner ─────────────────────────────────────────────────────
function StaticBanner({ banner, onDismiss }: { banner: NotificationBanner; onDismiss: () => void }) {
  const [visible, setVisible] = useState(true);
  const [fading,  setFading]  = useState(false);

  function dismiss() {
    setFading(true);
    setTimeout(() => { setVisible(false); onDismiss(); }, 400);
  }

  useEffect(() => {
    function handle() { dismiss(); }
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, []);

  if (!visible) return null;

  return (
    <div className={`relative rounded-2xl border border-[#d8b14c]/40 bg-gradient-to-r from-[#1c2e22] to-[#1a2520] backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden transition-all duration-400 ${fading ? 'opacity-0 -translate-y-2 scale-95' : 'opacity-100'}`}>
      {banner.image && (
        <img src={banner.image} alt="" className="w-full max-h-48 object-cover" />
      )}
      <div className="flex items-start gap-3 px-5 py-4">
        <span className="text-2xl shrink-0">📌</span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm leading-relaxed">{banner.message}</p>
          <p className="text-white/40 text-xs mt-1">Click anywhere to dismiss</p>
        </div>
        <button onClick={e => { e.stopPropagation(); dismiss(); }} aria-label="Close"
          className="shrink-0 text-white/40 hover:text-white/80 transition text-xl leading-none mt-0.5">×</button>
      </div>
    </div>
  );
}

// ─── Notifications Container ───────────────────────────────────────────────────
export default function NotificationsContainer() {
  const [queue, setQueue] = useState<NotificationBanner[]>(() => loadQueue());

  // Re-check whenever admin saves new notifications (same-tab or cross-tab)
  useEffect(() => {
    function refresh() { setQueue(loadQueue()); }
    window.addEventListener('adminDataChanged', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('adminDataChanged', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  function dismiss(id: string) {
    markNotificationSeen(id);
    setQueue(q => q.filter(n => n.id !== id));
  }

  if (queue.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[400] w-full max-w-md px-4 space-y-3 pointer-events-none">
      {queue.map(n => (
        <div key={n.id} className="pointer-events-auto">
          {n.type === 'fading'
            ? <FadingBanner  banner={n} onDismiss={() => dismiss(n.id)} />
            : <StaticBanner  banner={n} onDismiss={() => dismiss(n.id)} />
          }
        </div>
      ))}
    </div>
  );
}

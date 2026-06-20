import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Text color fixes in dark mode for "#4f5c53" and "#33443a"
// Many places have `text-[#4f5c53]` without a dark variant.
content = content.split('text-[#4f5c53]').join('text-[#4f5c53] dark:text-gray-200');
content = content.split('text-[#33443a]').join('text-[#33443a] dark:text-gray-200');
// Also ensure hero light mode 'Watch Live' button is visible
// Modify variant="dark" in ExternalLink
content = content.replace(
  'variant === "dark"\\n      ? "bg-[#223328] dark:bg-[#2a3f32] text-white hover:bg-[#31483a] focus:ring-[#223328]/20"',
  'variant === "dark"\\n      ? "bg-white/20 text-white backdrop-blur-md border border-white/50 hover:bg-white/30 focus:ring-white/50"'
);

// 2. Make cards transparent like the first card
// The current dark mode background is `dark:bg-[#1a1a1a]/80`
// Change them to `dark:bg-black/30 dark:border-white/10`
content = content.split('dark:bg-[#1a1a1a]/80').join('dark:bg-black/30 dark:border-white/10');
// Also change the contact form background which might be `dark:bg-[#1a1a1a]/80` (already covered by split)

// 3. Announcements carousel zoom stop
// Inside useEffect for carousel
const carouselEffectOrig = `    const interval = setInterval(() => {
      if (carouselRef.current && carouselRef.current.children.length > announcementPosters.length) {`;

const carouselEffectNew = `    const interval = setInterval(() => {
      if (selectedImage) return; // Pause carousel when image is zoomed
      if (carouselRef.current && carouselRef.current.children.length > announcementPosters.length) {`;

content = content.replace(carouselEffectOrig, carouselEffectNew);

// 4. Menu collapse behavior
// Currently it is: <div onClick={closeMenu} className="mobile-menu...
// This allows clicking anywhere inside to close.
// To ensure clicking OUTSIDE (the overlay) closes it, we check if the overlay exists.
// The overlay is `<div className="fixed inset-0 z-[-1]" onClick={closeMenu} aria-hidden="true" />`
// Let's change z-[-1] to z-40 so it works. The header is z-50.
content = content.replace(
  '<div className="fixed inset-0 z-[-1]" onClick={closeMenu} aria-hidden="true" />',
  '<div className="fixed inset-0 z-40" onClick={closeMenu} aria-hidden="true" />'
);
// Make the mobile menu z-50 to stay above the overlay
content = content.replace(
  'className="mobile-menu border-t',
  'className="mobile-menu relative z-50 border-t'
);

// 5. Header transparency and logo
// "add Zion AG logo @[public/images/church_logo.png] left to ZION AG Church in header and make header and menu transparent with slight opacity."
// Header is currently: `bg-[#f7f2e8]/90 dark:bg-[#121212]/90 backdrop-blur-xl`
// Let's change to `bg-[#f7f2e8]/60 dark:bg-[#121212]/60`
content = content.replace(
  'bg-[#f7f2e8]/90 dark:bg-[#121212]/90',
  'bg-[#f7f2e8]/60 dark:bg-[#121212]/60'
);
// Logo is already there because of my previous script, let's verify.
// Wait, my previous script had:
// `<img src="./images/church_logo.png" alt="Zion AG Logo" className="h-8 w-auto" />`
// I'll make sure it's there.
if (!content.includes('src="./images/church_logo.png"')) {
  content = content.replace(
    'ZION AG CHURCH\\n          </a>',
    '<img src="./images/church_logo.png" alt="Zion AG Logo" className="h-8 w-auto" />\\n            ZION AG CHURCH\\n          </a>'
  );
}

fs.writeFileSync('src/App.tsx', content);
console.log('Refinements applied!');

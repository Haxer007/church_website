// ─── Canvas Verse Image Generator ─────────────────────────────────────────────
// Generates a beautiful gradient verse card as a base64 PNG

export interface VerseImageOptions {
  verse: string;
  reference: string;
  gradientFrom?: string;
  gradientTo?: string;
  width?: number;
  height?: number;
  church?: string;
}

const PRESETS = [
  { label: '🌿 Forest Green',  from: '#1a2e1c', to: '#0d4a1e' },
  { label: '🌅 Golden Dusk',   from: '#2d1810', to: '#7c3d08' },
  { label: '🌊 Deep Ocean',    from: '#0d1b2a', to: '#1b3a5c' },
  { label: '🌸 Royal Purple',  from: '#1a0a2e', to: '#4a1060' },
  { label: '🔥 Crimson Faith', from: '#2a0808', to: '#6b1515' },
  { label: '🌙 Midnight Blue', from: '#0a0a1a', to: '#1a1a40' },
];

export { PRESETS as GRADIENT_PRESETS };

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) { ctx.fillText(line, x, currentY); currentY += lineHeight; }
  return currentY;
}

export function generateVerseImage(opts: VerseImageOptions): string {
  const W = opts.width  ?? 1080;
  const H = opts.height ?? 1080;
  const from = opts.gradientFrom ?? '#1a2e1c';
  const to   = opts.gradientTo   ?? '#0d4a1e';

  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, from);
  grad.addColorStop(1, to);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Subtle diagonal overlay
  const overlay = ctx.createLinearGradient(W, 0, 0, H);
  overlay.addColorStop(0, 'rgba(255,255,255,0.04)');
  overlay.addColorStop(1, 'rgba(0,0,0,0.15)');
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, W, H);

  // Decorative gold border
  ctx.strokeStyle = 'rgba(216,177,76,0.4)';
  ctx.lineWidth = 8;
  ctx.roundRect(40, 40, W - 80, H - 80, 24);
  ctx.stroke();

  // Inner subtle border
  ctx.strokeStyle = 'rgba(216,177,76,0.15)';
  ctx.lineWidth = 2;
  ctx.roundRect(56, 56, W - 112, H - 112, 16);
  ctx.stroke();

  // Top cross / icon
  ctx.font = `bold ${Math.round(W * 0.07)}px serif`;
  ctx.fillStyle = 'rgba(216,177,76,0.8)';
  ctx.textAlign = 'center';
  ctx.fillText('✝', W / 2, H * 0.14);

  // Gold separator line
  const lineW = W * 0.3;
  const lineY = H * 0.18;
  const lineGrad = ctx.createLinearGradient(W / 2 - lineW / 2, 0, W / 2 + lineW / 2, 0);
  lineGrad.addColorStop(0, 'transparent');
  lineGrad.addColorStop(0.5, 'rgba(216,177,76,0.7)');
  lineGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - lineW / 2, lineY);
  ctx.lineTo(W / 2 + lineW / 2, lineY);
  ctx.stroke();

  // Verse text
  const verseFontSize = Math.round(W * 0.042);
  ctx.font = `italic ${verseFontSize}px Georgia, serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 8;
  const padding = W * 0.12;
  const maxW = W - padding * 2;
  const verseLineH = verseFontSize * 1.55;
  const verseY = H * 0.25;
  const afterVerseY = wrapText(ctx, opts.verse, W / 2, verseY, maxW, verseLineH);

  ctx.shadowBlur = 0;

  // Reference
  const refFontSize = Math.round(W * 0.035);
  ctx.font = `bold ${refFontSize}px Georgia, serif`;
  ctx.fillStyle = '#d8b14c';
  ctx.textAlign = 'center';
  ctx.fillText(`— ${opts.reference}`, W / 2, Math.max(afterVerseY + H * 0.04, H * 0.7));

  // Bottom separator
  const sep2Y = H * 0.84;
  const sep2Grad = ctx.createLinearGradient(W / 2 - lineW / 2, 0, W / 2 + lineW / 2, 0);
  sep2Grad.addColorStop(0, 'transparent');
  sep2Grad.addColorStop(0.5, 'rgba(216,177,76,0.5)');
  sep2Grad.addColorStop(1, 'transparent');
  ctx.strokeStyle = sep2Grad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - lineW / 2, sep2Y);
  ctx.lineTo(W / 2 + lineW / 2, sep2Y);
  ctx.stroke();

  // Church name
  const church = opts.church ?? 'Zion AG Church, Madiwala';
  ctx.font = `${Math.round(W * 0.025)}px 'Arial', sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.textAlign = 'center';
  ctx.fillText(church, W / 2, H * 0.91);

  return canvas.toDataURL('image/png');
}

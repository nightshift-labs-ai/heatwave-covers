// Key-art lettering and poster dressing, all drawn by the engine (no image files, all our own wording):
// the tilted title over the art (hot gradient from the grade, heavy outline, deep extrude, sparkle glints) with the
// neon script under it, a 5-star rating with a short press quote, a HEAT level pill, a round seal, small tilted
// panel tags, a palm-silhouette band with a striped-sun mark and the tagline, and a billing line with a drawn barcode.

import { gradeColorAt } from './grades.js';
import { drawStickerBadge, fitTitleToBlock } from './lettering.js';
import { mulberry32 } from './ink.js';

const OUTLINE = '#1a0b2e';
const CREAM = '#f6efe0';

export const DRESSING_DEFAULTS = {
  quote: '"HOTTER THAN THE ASPHALT" — THE PALM GAZETTE',
  tags: ['THE CLOSER', 'CORAL CAUSEWAY · 7:15 PM', 'THE FIXER'],
  seal: ['HOT', 'SUMMER ’26'],
  billing: 'A NIGHTSHIFT PICTURE · STARRING YOUR CREW · SHOT ON YOUR OWN CAMERA · INKED BY HAND IN THE STUDIO · TITLES BY HEATWAVE · CAT. HW-0626',
};

const rgb = (gradeId, t, k = 1) => `rgb(${gradeColorAt(gradeId, t).slice(0, 3).map((v) => Math.round(Math.min(255, v * k))).join(',')})`;
const neonOf = (gradeId) => (gradeId === 'neonNight' || gradeId === 'miamiTeal' ? '#19e3d0' : '#ff2e88');

// Title over the art. t = { cx, cy, w, tilt }; returns the title's box in the rotated frame (for tests and dressing).
export function drawKeyArtTitle(ctx, t, caption, { W, H, gradeId, stars = true }) {
  const title = (caption.title || '').toUpperCase().trim() || ' ';
  const subtitle = (caption.subtitle || '').trim();
  const fit = fitTitleToBlock(ctx, title, t.w, H * 0.26);
  const { size, capH, width } = fit;
  ctx.save();
  ctx.translate(t.cx, t.cy);
  ctx.rotate(t.tilt);
  ctx.font = `400 ${size.toFixed(1)}px Anton`;
  ctx.letterSpacing = `${(size * 0.01).toFixed(2)}px`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  const yb = capH / 2;
  // Deep extrude: stacked copies down and to the right, dark plum, with a soft drop shadow under the stack.
  const depth = capH * 0.15, steps = Math.max(6, Math.round(depth / 1.5));
  ctx.save();
  ctx.shadowColor = 'rgba(8,2,16,0.75)'; ctx.shadowBlur = capH * 0.18; ctx.shadowOffsetY = capH * 0.05;
  ctx.fillStyle = OUTLINE; ctx.strokeStyle = OUTLINE; ctx.lineWidth = capH * 0.13;
  ctx.strokeText(title, depth * 0.55, yb + depth);
  ctx.restore();
  for (let k = steps; k >= 1; k--) {
    const f = k / steps;
    ctx.fillStyle = k === steps ? OUTLINE : `rgb(${Math.round(70 - 40 * f)},${Math.round(16 - 8 * f)},${Math.round(60 - 30 * f)})`;
    ctx.strokeStyle = OUTLINE; ctx.lineWidth = capH * 0.13;
    if (k === steps) ctx.strokeText(title, depth * 0.55 * f, yb + depth * f);
    ctx.fillText(title, depth * 0.55 * f, yb + depth * f);
  }
  // Heavy outline, then the hot gradient taken from the grade (cream top, hot middle, deep hot bottom).
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = capH * 0.13;
  ctx.strokeText(title, 0, yb);
  const g = ctx.createLinearGradient(0, yb - capH, 0, yb);
  g.addColorStop(0, '#fffbea');
  g.addColorStop(0.3, rgb(gradeId, 0.95));
  g.addColorStop(0.62, rgb(gradeId, 0.74));
  g.addColorStop(1, rgb(gradeId, 0.52));
  ctx.fillStyle = g;
  ctx.fillText(title, 0, yb);
  // Inner highlight: a thin light rim inside the top of the letters.
  ctx.save();
  ctx.beginPath(); ctx.rect(-width, yb - capH * 1.02, width * 2, capH * 0.1); ctx.clip();
  ctx.globalAlpha = 0.55; ctx.fillStyle = '#ffffff';
  ctx.fillText(title, 0, yb);
  ctx.restore();
  // Sparkle glints on three letter tops.
  for (const [u, s] of [[-0.43, 0.2], [0.12, 0.13], [0.47, 0.17]]) sparkle(ctx, u * width, yb - capH * 0.97, capH * s);
  // Stars and the press quote just above the title, aligned to its left edge.
  if (stars) drawStarsQuote(ctx, -width / 2 + capH * 0.05, -yb - capH * 0.16, capH * 0.15, caption.quote ?? DRESSING_DEFAULTS.quote);
  // Neon script below and to the right; its top may only touch the bottom ~15 % of the caps.
  if (subtitle) {
    let sub = capH * 0.5;
    ctx.font = `400 ${sub}px "Kaushan Script"`;
    ctx.letterSpacing = '0px';
    let w = ctx.measureText(subtitle).width;
    if (w > width * 0.8) { sub = (sub * width * 0.8) / w; ctx.font = `400 ${sub}px "Kaushan Script"`; w = ctx.measureText(subtitle).width; }
    const right = width / 2 + capH * 0.3;
    const base = yb - capH * 0.13 + sub * 0.74 + depth * 0.4;
    ctx.save();
    ctx.translate(right - w / 2, base);
    ctx.rotate(-0.05);
    ctx.textAlign = 'center';
    ctx.strokeStyle = OUTLINE; ctx.lineWidth = sub * 0.16;
    ctx.strokeText(subtitle, 0, 0);
    ctx.shadowColor = neonOf(gradeId); ctx.shadowBlur = sub * 0.45;
    ctx.fillStyle = neonOf(gradeId);
    ctx.fillText(subtitle, 0, 0);
    ctx.shadowBlur = sub * 0.12;
    ctx.fillStyle = '#fff4fb';
    ctx.fillText(subtitle, 0, 0);
    ctx.restore();
  }
  ctx.restore();
  return { capH, width, size };
}

function sparkle(ctx, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = '#fff6c8'; ctx.shadowBlur = r * 0.8;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 - Math.PI / 2, rr = k % 2 ? r * 0.16 : r * (k % 4 ? 0.62 : 1);
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function starPath(ctx, x, y, r) {
  ctx.beginPath();
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2 - Math.PI / 2, rr = k % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}

// Five gold stars and a short press quote (Teko, cream on a dark outline), left-aligned at (x, y) = baseline.
export function drawStarsQuote(ctx, x, y, size, quote) {
  ctx.save();
  ctx.textAlign = 'left';
  const r = size * 0.5;
  for (let k = 0; k < 5; k++) {
    starPath(ctx, x + r + k * r * 2.2, y - r * 0.9, r);
    ctx.lineWidth = size * 0.14; ctx.strokeStyle = OUTLINE; ctx.stroke();
    ctx.fillStyle = '#ffd23f'; ctx.fill();
  }
  if (quote) {
    ctx.font = `600 ${(size * 1.15).toFixed(1)}px Teko`;
    ctx.letterSpacing = `${(size * 0.06).toFixed(1)}px`;
    const qx = x + r * 11.4;
    ctx.lineWidth = size * 0.28; ctx.strokeStyle = OUTLINE; ctx.lineJoin = 'round';
    ctx.strokeText(quote, qx, y);
    ctx.fillStyle = CREAM;
    ctx.fillText(quote, qx, y);
  }
  ctx.restore();
}

// HEAT level pill: dark rounded pill, cream border, the word HEAT and five stars (four lit).
export function drawHeatPill(ctx, x, y, h, align = 'right', lit = 4) {
  ctx.save();
  ctx.font = `400 ${(h * 0.62).toFixed(1)}px Anton`;
  ctx.letterSpacing = `${(h * 0.04).toFixed(1)}px`;
  const word = 'HEAT', tw = ctx.measureText(word).width, r = h * 0.27;
  const w = h * 0.45 + tw + h * 0.3 + 5 * r * 2.25 + h * 0.3;
  const x0 = align === 'right' ? x - w : x;
  ctx.beginPath();
  ctx.roundRect(x0, y, w, h, h / 2);
  ctx.fillStyle = 'rgba(14,6,24,0.9)'; ctx.fill();
  ctx.lineWidth = Math.max(2, h * 0.07); ctx.strokeStyle = CREAM; ctx.stroke();
  ctx.fillStyle = CREAM; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillText(word, x0 + h * 0.45, y + h * 0.53);
  for (let k = 0; k < 5; k++) {
    starPath(ctx, x0 + h * 0.45 + tw + h * 0.3 + r + k * r * 2.25, y + h / 2, r);
    if (k < lit) { ctx.fillStyle = '#ffd23f'; ctx.fill(); } else { ctx.lineWidth = Math.max(1.5, h * 0.05); ctx.strokeStyle = '#ffd23f'; ctx.stroke(); }
  }
  ctx.restore();
}

// Small tilted white tag with black condensed text, a thin dark edge and a soft shadow.
export function drawPanelTag(ctx, x, y, rot, text, h) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.font = `600 ${(h * 0.82).toFixed(1)}px Teko`;
  ctx.letterSpacing = `${(h * 0.05).toFixed(1)}px`;
  const w = ctx.measureText(text).width + h * 0.7;
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = h * 0.3; ctx.shadowOffsetY = h * 0.08;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = Math.max(1, h * 0.05); ctx.strokeStyle = '#111';
  ctx.strokeRect(0, 0, w, h);
  ctx.fillStyle = '#111'; ctx.textBaseline = 'middle';
  ctx.fillText(text, h * 0.35, h * 0.56);
  ctx.restore();
}

export function drawSeal(ctx, x, y, r, words = DRESSING_DEFAULTS.seal) {
  drawStickerBadge(ctx, x, y, r, words[0], words[1]);
}

// Bottom band: a dusk gradient from the grade, palm silhouettes at both ends, a striped-sun mark and the tagline,
// letter-spaced, in the middle.
export function drawPalmBand(ctx, b, tagline, gradeId) {
  ctx.save();
  ctx.beginPath(); ctx.rect(b.x, b.y, b.w, b.h); ctx.clip();
  const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
  g.addColorStop(0, rgb(gradeId, 0.12, 0.9));
  g.addColorStop(0.55, rgb(gradeId, 0.4));
  g.addColorStop(1, rgb(gradeId, 0.62));
  ctx.fillStyle = g;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  const base = b.y + b.h;
  const palms = [[0.02, 1.0, 0.25], [0.055, 0.78, -0.2], [0.09, 0.62, 0.15], [0.91, 0.62, -0.15], [0.945, 0.8, 0.2], [0.98, 1.02, -0.25], [0.2, 0.5, 0.1], [0.8, 0.5, -0.1]];
  for (const [u, s, lean] of palms) drawPalm(ctx, b.x + u * b.w, base, b.h * s, lean);
  const text = (tagline || '').toUpperCase().trim();
  const size = b.h * 0.5;
  ctx.font = `600 ${size.toFixed(1)}px Teko`;
  ctx.letterSpacing = `${(size * 0.42).toFixed(1)}px`;
  let tw = ctx.measureText(text).width;
  const maxW = b.w * 0.56;
  let fs = size;
  if (tw > maxW) { fs = (size * maxW) / tw; ctx.font = `600 ${fs.toFixed(1)}px Teko`; ctx.letterSpacing = `${(fs * 0.42).toFixed(1)}px`; tw = ctx.measureText(text).width; }
  const sunR = b.h * 0.34, cx = b.x + b.w / 2;
  stripedSun(ctx, cx - tw / 2 - sunR * 1.8, b.y + b.h * 0.56, sunR);
  ctx.fillStyle = CREAM; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(10,2,20,0.8)'; ctx.shadowBlur = fs * 0.2;
  ctx.fillText(text, cx + fs * 0.2, b.y + b.h * 0.57);
  ctx.restore();
}

function drawPalm(ctx, x, base, h, lean) {
  ctx.save();
  ctx.fillStyle = '#0d0612'; ctx.strokeStyle = '#0d0612';
  const topX = x + lean * h, topY = base - h;
  ctx.lineWidth = Math.max(2, h * 0.05); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + lean * h * 0.2, base - h * 0.5, topX, topY); ctx.stroke();
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI / 2 + (k - 3) * 0.48 + lean * 0.3, len = h * (0.42 - Math.abs(k - 3) * 0.03);
    const ex = topX + Math.cos(a) * len * 1.2, ey = topY + Math.sin(a) * len * 0.55 + len * 0.42;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + Math.cos(a) * len * 0.7, topY + Math.sin(a) * len * 0.8 - len * 0.12, ex, ey);
    ctx.quadraticCurveTo(topX + Math.cos(a) * len * 0.5, topY + Math.sin(a) * len * 0.5 + len * 0.06, topX, topY);
    ctx.fill();
  }
  ctx.restore();
}

function stripedSun(ctx, cx, cy, r) {
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, '#ffe066'); g.addColorStop(0.55, '#ff8a3d'); g.addColorStop(1, '#ff2e88');
  ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
  ctx.fillStyle = 'rgba(20,6,30,0.95)';
  for (let k = 0; k < 4; k++) ctx.fillRect(cx - r, cy + r * (0.1 + k * 0.24), 2 * r, r * (0.05 + k * 0.03));
  ctx.restore();
}

// Billing line: tiny condensed credits across the bottom, a small HW mark on the left and a drawn barcode on the right.
export function drawBilling(ctx, b, text = DRESSING_DEFAULTS.billing) {
  ctx.save();
  ctx.fillStyle = '#0b0710';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  const fs = b.h * 0.62;
  ctx.font = `500 ${fs.toFixed(1)}px Teko`;
  ctx.letterSpacing = `${(fs * 0.12).toFixed(1)}px`;
  ctx.fillStyle = 'rgba(246,239,224,0.78)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, b.x + b.w / 2, b.y + b.h * 0.56, b.w * 0.76);
  ctx.font = `400 ${(b.h * 0.6).toFixed(1)}px Anton`;
  ctx.letterSpacing = '0px'; ctx.textAlign = 'left'; ctx.fillStyle = '#ff8a3d';
  ctx.fillText('HW', b.x + b.h * 0.5, b.y + b.h * 0.56);
  const bw = b.h * 3.2, bx = b.x + b.w - bw - b.h * 0.5, by = b.y + b.h * 0.15, bh = b.h * 0.7;
  ctx.fillStyle = CREAM; ctx.fillRect(bx - 3, by - 1, bw + 6, bh + 2);
  ctx.fillStyle = '#111';
  const rand = mulberry32(626);
  for (let x = bx; x < bx + bw;) { const w = 1 + Math.floor(rand() * 3); if (rand() > 0.4) ctx.fillRect(x, by + 1, w * Math.max(1, b.h / 40), bh - 2); x += (w + 1) * Math.max(1, b.h / 40); }
  ctx.restore();
}

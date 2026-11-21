// The one renderer: renderCover draws the live preview (at preview size) and the export (at the exact post size),
// so what you see is what you export. Each panel: crop -> (Poster Ink smoothing) -> grade -> Poster Ink -> grain.

import { layoutFor } from './layouts.js';
import { applyGradeToPanel, gradeColorAt, autoLevelsBeforeGrade } from './grades.js';
import { posterInk, smoothForInk, grainAndVignette, liftKeepShadows, skinMaskBeforeGrade } from './ink.js';
import { skyMaskBeforeGrade, paintSkyGlow, hasSkyPalette } from './sky-glow.js';
import { drawTitleBlock, drawHalftoneSun, drawStickerBadge } from './lettering.js';
import { drawKeyArtTitle, drawHeatPill, drawPanelTag, drawSeal, drawPalmBand, drawBilling, DRESSING_DEFAULTS } from './dressing.js';

// Draw the whole cover for `state` into ctx at W x H. opts.fastPanel: index of a panel being dragged (drawn with
// grade only, no ink, until the drag ends).
export function renderCover(state, W, H, ctx, opts = {}) {
  const geo = layoutFor(state.layoutId, W, H);
  if (geo.kind === 'keyart') { renderKeyArt(state, geo, W, H, ctx, opts); return geo; }
  ctx.save();
  ctx.fillStyle = '#0b0b12';
  ctx.fillRect(0, 0, W, H);
  if (geo.kind === 'snapshots') drawSnapshotSky(ctx, W, H, state.gradeId);
  if (geo.framed) drawFramedBackdrop(ctx, geo.framed, state.gradeId);
  geo.panels.forEach((p, i) => {
    const slot = state.panels[i] ?? { photo: -1, zoom: 1, fx: 0.5, fy: 0.38 };
    const photo = state.photos[slot.photo];
    if (p.snap) drawSnapshot(ctx, p, photo, slot, state, W, i, opts);
    else drawPanelImage(ctx, p, photo, slot, state, W, i, opts);
  });
  drawTitleBlock(ctx, geo.title, state.caption, {
    W, H, gradeId: state.gradeId, background: geo.kind === 'snapshots' ? 'none' : geo.overlay ? 'overlay' : 'band',
  });
  if (state.badge !== false && geo.kind === 'grid' && !geo.overlay && geo.panels[0]) {
    const p = geo.panels[0], r = Math.round(Math.min(W, H) * 0.085);
    drawStickerBadge(ctx, p.x + r * 1.15, p.y + r * 1.15, r, 'NEW', 'SUMMER 2026');
  }
  ctx.restore();
  return geo;
}

// Key Art Slash: cream paper and outer border, slanted panels clipped to their polygons with cream frame lines,
// then the band, billing line, tags, seal, title (with stars and quote) and the HEAT pill on top.
function renderKeyArt(state, geo, W, H, ctx, opts) {
  const unit = Math.min(W, H), cap = state.caption ?? {};
  const show = { stars: true, heat: true, seal: true, tags: true, billing: true, ...(state.dressing ?? {}) };
  ctx.save();
  ctx.fillStyle = '#f6efe0';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#0b0b12';
  ctx.fillRect(geo.art.x, geo.art.y, geo.art.w, geo.art.h);
  geo.panels.forEach((p, i) => {
    const slot = state.panels[i] ?? { photo: -1, zoom: 1, fx: 0.5, fy: 0.38 };
    ctx.save();
    ctx.beginPath();
    p.poly.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.clip();
    drawPanelImage(ctx, p, state.photos[slot.photo], slot, state, W, i, opts);
    ctx.restore();
  });
  ctx.strokeStyle = '#f6efe0'; ctx.lineWidth = geo.frame; ctx.lineJoin = 'miter';
  for (const p of geo.panels) {
    ctx.beginPath();
    p.poly.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.stroke();
  }
  drawPalmBand(ctx, geo.band, cap.tagline, state.gradeId);
  if (show.billing) drawBilling(ctx, geo.billing, cap.billing || undefined);
  else { ctx.fillStyle = '#0b0710'; ctx.fillRect(geo.billing.x, geo.billing.y, geo.billing.w, geo.billing.h); }
  if (show.tags) {
    const tags = cap.tags ?? DRESSING_DEFAULTS.tags;
    geo.tags.forEach((t, k) => { if (tags[k]) drawPanelTag(ctx, t.at[0], t.at[1], t.rot, String(tags[k]).toUpperCase(), unit * 0.042); });
  }
  if (show.seal) drawSeal(ctx, geo.seal[0], geo.seal[1], unit * 0.072);
  drawKeyArtTitle(ctx, geo.title, cap, { W, H, gradeId: state.gradeId, stars: show.stars });
  if (show.heat) drawHeatPill(ctx, geo.pill.x, geo.pill.y, unit * 0.05, geo.pill.align);
  ctx.restore();
}

// Render at the exact size, encode PNG, download heatwave-<w>x<h>.png. Resolves with { blob, ms, name }.
export async function exportCoverPng(state, W, H) {
  await ensureCoverAssets(state);
  const t0 = performance.now();
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  renderCover(state, W, H, canvas.getContext('2d'));
  const ms = Math.round(performance.now() - t0);
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
  const name = `heatwave-${W}x${H}.png`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return { blob, ms, name };
}

// Fonts and photos must be ready before the first render and before any export.
export async function ensureCoverAssets(state) {
  await Promise.all([
    document.fonts.load('400 120px Anton'),
    document.fonts.load('400 80px "Kaushan Script"'),
    document.fonts.load('600 40px Teko'),
  ]);
  await Promise.all(state.photos.map((p) => (p.img.decode ? p.img.decode().catch(() => {}) : null)));
}

function drawPanelImage(ctx, p, photo, slot, state, W, i, opts) {
  const pw = Math.max(1, Math.round(p.w)), ph = Math.max(1, Math.round(p.h));
  if (!photo) { drawEmptyPanel(ctx, p.x, p.y, pw, ph, i); return; }
  const art = panelArt(photo, slot, pw, ph, state, W, i, opts.fastPanel === i);
  ctx.drawImage(art, p.x, p.y);
}

function drawSnapshot(ctx, p, photo, slot, state, W, i, opts) {
  const b = p.border;
  // Snapshots get a polaroid's deep bottom edge; Hero + Four frames are thin and even with a softer, wider shadow.
  const iw = Math.max(1, Math.round(p.w - 2 * b)), ih = Math.max(1, Math.round(p.h - (p.frame ? 2 * b : b * 3.2)));
  ctx.save();
  ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
  ctx.rotate(p.rot);
  ctx.shadowColor = p.frame ? 'rgba(5,0,15,0.55)' : 'rgba(10,0,20,0.6)';
  ctx.shadowBlur = b * (p.frame ? 4 : 2.4); ctx.shadowOffsetX = b * 0.6; ctx.shadowOffsetY = b * (p.frame ? 1.6 : 1);
  ctx.fillStyle = '#f6efe0';
  ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
  ctx.shadowColor = 'transparent';
  if (photo) ctx.drawImage(panelArt(photo, slot, iw, ih, state, W, i, opts.fastPanel === i), -p.w / 2 + b, -p.h / 2 + b);
  else drawEmptyPanel(ctx, -p.w / 2 + b, -p.h / 2 + b, iw, ih, i);
  ctx.restore();
}

// Processed panel canvas, cached per (photo, crop, size, grade, ink) key.
const artCache = new Map();
function panelArt(photo, slot, pw, ph, state, W, i, fast) {
  const ink = state.ink.on && !fast;
  const glow = state.skyGlow !== false && hasSkyPalette(state.gradeId);
  const warm = slot.warm ?? 0; // per-panel warm push (M10), 0 for every panel that does not set it
  const key = `${photo.id}|${slot.zoom.toFixed(3)}|${slot.fx.toFixed(3)}|${slot.fy.toFixed(3)}|${pw}x${ph}|${state.gradeId}|${ink ? state.ink.strength : 0}|${W}|${glow ? 'g' : ''}|${warm}`;
  const hit = artCache.get(key);
  if (hit) { artCache.delete(key); artCache.set(key, hit); return hit; }
  const c = document.createElement('canvas');
  c.width = pw; c.height = ph;
  const cctx = c.getContext('2d', { willReadFrequently: true });
  drawCrop(cctx, photo, slot, pw, ph);
  const data = cctx.getImageData(0, 0, pw, ph);
  const skin = ink || glow ? skinMaskBeforeGrade(data) : null;
  const sky = glow ? skyMaskBeforeGrade(data, skin) : null;
  const lumHalf = ink ? smoothForInk(data, W) : null;
  autoLevelsBeforeGrade(data);
  applyGradeToPanel(data, state.gradeId, { keepHighlights: ink ? 0.7 : 0, warm });
  if (sky) paintSkyGlow(data, sky, state.gradeId);
  if (ink) posterInk(data, lumHalf, { coverW: W, strength: state.ink.strength, paper: gradeColorAt(state.gradeId, 0.5), seed: 17 + i * 101, skin });
  else liftKeepShadows(data, 0.44 * (1 - Math.min(1, warm * 2)));
  grainAndVignette(data, 911 + i * 37);
  cctx.putImageData(data, 0, 0);
  if (!fast) {
    artCache.set(key, c);
    while (artCache.size > 48) artCache.delete(artCache.keys().next().value);
  }
  return c;
}

// Cover-fit the photo into the panel, then zoom around the focus point (fx, fy in 0..1 of the photo).
export function cropRect(photo, slot, pw, ph) {
  const iw = photo.w, ih = photo.h;
  const scale = Math.max(pw / iw, ph / ih) * Math.max(1, slot.zoom);
  const sw = pw / scale, sh = ph / scale;
  const sx = Math.min(iw - sw, Math.max(0, slot.fx * iw - sw / 2));
  const sy = Math.min(ih - sh, Math.max(0, slot.fy * ih - sh / 2));
  return { sx, sy, sw, sh, scale };
}

function drawCrop(cctx, photo, slot, pw, ph) {
  const { sx, sy, sw, sh } = cropRect(photo, slot, pw, ph);
  cctx.imageSmoothingEnabled = true;
  cctx.imageSmoothingQuality = 'high';
  cctx.drawImage(photo.img, sx, sy, sw, sh, 0, 0, pw, ph);
}

function drawEmptyPanel(ctx, x, y, w, h, i) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, '#24123f'); g.addColorStop(1, '#5a1a4f');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = `600 ${Math.max(10, Math.round(Math.min(w, h) * 0.22))}px Teko`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`+ ${String(i + 1).padStart(2, '0')}`, x + w / 2, y + h / 2);
  ctx.textBaseline = 'alphabetic';
}

// Backdrop behind the four framed photos of Hero + Four: a dusk gradient tinted by the grade, with faint diagonal rays.
function drawFramedBackdrop(ctx, a, gradeId) {
  const css = (t, k) => `rgb(${gradeColorAt(gradeId, t).slice(0, 3).map((v) => Math.round(v * k)).join(',')})`;
  const g = ctx.createLinearGradient(a.x, a.y, a.x + a.w, a.y + a.h);
  g.addColorStop(0, css(0.15, 0.7));
  g.addColorStop(1, css(0.45, 0.75));
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(a.x, a.y, a.w, a.h);
  ctx.beginPath();
  ctx.rect(a.x, a.y, a.w, a.h);
  ctx.clip();
  ctx.fillStyle = 'rgba(255,220,180,0.06)';
  const step = Math.max(a.w, a.h) / 9;
  for (let k = -9; k < 18; k += 2) {
    ctx.beginPath();
    ctx.moveTo(a.x + k * step, a.y);
    ctx.lineTo(a.x + (k + 1) * step, a.y);
    ctx.lineTo(a.x + (k + 1) * step - a.h, a.y + a.h);
    ctx.lineTo(a.x + k * step - a.h, a.y + a.h);
    ctx.fill();
  }
  ctx.restore();
}

// Sky behind tilted snapshots: night-to-sunset gradient, a striped halftone sun and a dark sea with light streaks.
function drawSnapshotSky(ctx, W, H, gradeId) {
  const neon = gradeId === 'neonNight' || gradeId === 'miamiTeal';
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, neon ? '#090a2e' : '#1a0833');
  g.addColorStop(0.45, neon ? '#4a1a9a' : '#8a1a5c');
  g.addColorStop(0.62, neon ? '#e0309a' : '#ff7a3d');
  g.addColorStop(0.63, '#1a0b2e');
  g.addColorStop(1, '#0b0716');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  drawHalftoneSun(ctx, W / 2, H * 0.5, Math.min(W, H) * 0.3);
  ctx.fillStyle = '#1a0b2e';
  ctx.fillRect(0, H * 0.63, W, H * 0.37);
  ctx.fillStyle = neon ? 'rgba(63,224,240,0.55)' : 'rgba(255,138,61,0.55)';
  for (let k = 0; k < 9; k++) {
    const y = H * (0.65 + k * 0.035), w = W * (0.36 - k * 0.03);
    ctx.fillRect(W / 2 - w / 2, y, w, Math.max(2, H * 0.006));
  }
}

// Title block lettering: huge Anton caps with a gold -> orange -> hot pink gradient, a thick dark outline and an
// offset hard shadow; a neon Kaushan Script subtitle; a Teko tagline on a ribbon. Plus the block backgrounds
// (sunset band with a halftone sun disc, or a dark band when the title sits over the panels).

const OUTLINE = '#1a0b2e';

// Draw the whole title block into rect {x, y, w, h} of a W x H cover.
export function drawTitleBlock(ctx, rect, caption, { W, H, gradeId, background = 'band' }) {
  if (background === 'band') drawSunsetBand(ctx, rect, gradeId);
  else if (background === 'overlay') drawDarkBand(ctx, rect);
  const title = (caption.title || '').toUpperCase().trim();
  const subtitle = (caption.subtitle || '').trim();
  const tagline = (caption.tagline || '').toUpperCase().trim();
  const pad = Math.round(Math.min(rect.w, rect.h) * 0.035);
  const tagSize = tagline ? Math.max(Math.round(H * 0.046), 14) : 0;
  // The script subtitle overlaps the lower part of the caps, so the caps can take most of the block height.
  const maxCap = (rect.h - pad * 2 - tagSize * 1.2) / (subtitle ? 1.3 : 1.08);
  const fit = fitTitleToBlock(ctx, title || ' ', rect.w * 0.95, maxCap);
  const subSize = Math.round(fit.capH * 0.6);
  const subDrop = subtitle ? subSize * 0.48 : 0;
  const blockH = fit.capH * 1.06 + subDrop + (tagline ? tagSize * 1.2 : 0);
  const top = rect.y + (rect.h - blockH) / 2;
  const cx = rect.x + rect.w / 2;
  const baseline = top + fit.capH * 1.02;
  drawTitleText(ctx, title, cx, baseline, fit);
  if (subtitle) drawNeonSubtitle(ctx, subtitle, cx + fit.width / 2 - fit.capH * 0.04, baseline + subSize * 0.18, subSize, gradeId, fit.width);
  if (tagline) drawTaglineRibbon(ctx, tagline, cx, baseline + subDrop + tagSize * 1.08, tagSize, rect.w * 0.9);
  return { capH: fit.capH, titleWidth: fit.width, subSize, tagSize };
}

// Largest Anton size whose width fits maxW and whose cap height fits maxCapH.
export function fitTitleToBlock(ctx, text, maxW, maxCapH) {
  ctx.save();
  ctx.font = '400 100px Anton';
  ctx.letterSpacing = '1px';
  const m = ctx.measureText(text);
  const capRatio = (ctx.measureText('H').actualBoundingBoxAscent || 73) / 100;
  ctx.restore();
  const widthAt100 = Math.max(1, m.width);
  const size = Math.max(8, Math.min((maxW / widthAt100) * 100, maxCapH / capRatio));
  return { size, capH: size * capRatio, width: (widthAt100 * size) / 100 };
}

function drawTitleText(ctx, text, cx, baseline, fit) {
  const { size, capH } = fit;
  ctx.save();
  ctx.font = `400 ${size.toFixed(1)}px Anton`;
  ctx.letterSpacing = `${(size * 0.01).toFixed(2)}px`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  const off = capH * 0.08, lw = capH * 0.12;
  // offset hard shadow
  ctx.fillStyle = OUTLINE; ctx.strokeStyle = OUTLINE; ctx.lineWidth = lw;
  ctx.strokeText(text, cx + off, baseline + off);
  ctx.fillText(text, cx + off, baseline + off);
  // outline
  ctx.strokeText(text, cx, baseline);
  // sunset gradient fill
  const g = ctx.createLinearGradient(0, baseline - capH, 0, baseline);
  g.addColorStop(0, '#ffd23f'); g.addColorStop(0.5, '#ff8a3d'); g.addColorStop(1, '#ff2e88');
  ctx.fillStyle = g;
  ctx.fillText(text, cx, baseline);
  // thin light line across the upper third, like a printed foil
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#fff6d0';
  ctx.beginPath();
  ctx.rect(cx - fit.width, baseline - capH * 0.78, fit.width * 2, capH * 0.05);
  ctx.clip();
  ctx.fillText(text, cx, baseline);
  ctx.restore();
}

function drawNeonSubtitle(ctx, text, rightX, baseline, size, gradeId, titleW) {
  const glow = gradeId === 'neonNight' || gradeId === 'miamiTeal' ? '#19e3d0' : '#ff2e88';
  ctx.save();
  ctx.font = `400 ${size}px "Kaushan Script"`;
  let w = ctx.measureText(text).width;
  if (w > titleW * 0.95) { size = Math.floor((size * titleW * 0.95) / w); ctx.font = `400 ${size}px "Kaushan Script"`; w = ctx.measureText(text).width; }
  ctx.translate(rightX - w / 2, baseline);
  ctx.rotate(-0.07);
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = size * 0.14;
  ctx.strokeText(text, 0, 0);
  ctx.shadowColor = glow; ctx.shadowBlur = size * 0.45;
  ctx.fillStyle = glow;
  ctx.fillText(text, 0, 0);
  ctx.shadowBlur = size * 0.15;
  ctx.fillStyle = '#fff4fb';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function drawTaglineRibbon(ctx, text, cx, baseline, size, maxW) {
  ctx.save();
  ctx.font = `600 ${size}px Teko`;
  ctx.letterSpacing = `${(size * 0.14).toFixed(1)}px`;
  let w = ctx.measureText(text).width;
  if (w > maxW) { size = Math.floor((size * maxW) / w); ctx.font = `600 ${size}px Teko`; ctx.letterSpacing = `${(size * 0.14).toFixed(1)}px`; w = ctx.measureText(text).width; }
  const padX = size * 0.6, top = baseline - size * 0.78, hgt = size * 1.0;
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(cx - w / 2 - padX, top, w + padX * 2, hgt);
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(cx - w / 2 - padX, top, w + padX * 2, Math.max(2, size * 0.07));
  ctx.fillRect(cx - w / 2 - padX, top + hgt - Math.max(2, size * 0.07), w + padX * 2, Math.max(2, size * 0.07));
  ctx.fillStyle = '#ffd23f';
  ctx.textAlign = 'center';
  ctx.fillText(text, cx + size * 0.07, baseline - size * 0.02);
  ctx.restore();
}

// Round starburst sticker: gold burst, dark outline, a big word and a small line under it, tilted like a price tag.
export function drawStickerBadge(ctx, cx, cy, r, big, small) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.21);
  ctx.beginPath();
  for (let k = 0; k < 40; k++) {
    const a = (k / 40) * Math.PI * 2, rr = k % 2 ? r * 0.88 : r;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = OUTLINE;
  ctx.translate(r * 0.07, r * 0.07);
  ctx.fill();
  ctx.translate(-r * 0.07, -r * 0.07);
  ctx.fillStyle = '#ffd23f';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = r * 0.07;
  ctx.lineJoin = 'round';
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
  ctx.strokeStyle = '#ff2e88';
  ctx.lineWidth = r * 0.05;
  ctx.stroke();
  ctx.fillStyle = OUTLINE;
  ctx.textAlign = 'center';
  ctx.font = `400 ${Math.round(r * 0.62)}px Anton`;
  ctx.fillText(big, 0, r * 0.12);
  ctx.font = `600 ${Math.round(r * 0.26)}px Teko`;
  ctx.fillStyle = '#c2185b';
  ctx.fillText(small, 0, r * 0.42);
  ctx.restore();
}

// Sunset band: deep purple sky to a hot horizon, a striped halftone sun disc behind the lettering.
export function drawSunsetBand(ctx, r, gradeId) {
  ctx.save();
  ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  const sky = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
  const neon = gradeId === 'neonNight' || gradeId === 'miamiTeal';
  sky.addColorStop(0, neon ? '#0a0b33' : '#1c0833');
  sky.addColorStop(0.55, neon ? '#3a1580' : '#6a1050');
  sky.addColorStop(1, neon ? '#c3248f' : '#e0365f');
  ctx.fillStyle = sky;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  drawHalftoneSun(ctx, r.x + r.w * 0.5, r.y + r.h * 0.62, Math.min(r.w * 0.36, r.h * 0.62));
  ctx.restore();
}

// Halftone sun disc: dot screen (gold top -> pink bottom) cut by horizontal stripes in its lower half.
export function drawHalftoneSun(ctx, cx, cy, R) {
  const cell = Math.max(4, R / 16);
  const sun = ctx.createLinearGradient(0, cy - R, 0, cy + R);
  sun.addColorStop(0, '#ffe066'); sun.addColorStop(0.5, '#ff8a3d'); sun.addColorStop(1, '#ff2e88');
  ctx.save();
  ctx.fillStyle = sun;
  ctx.beginPath();
  for (let y = cy - R; y <= cy + R; y += cell) {
    const t = (y - (cy - R)) / (2 * R);
    if (t > 0.55 && Math.floor((t - 0.55) * 24) % 2 === 1) continue;
    for (let x = cx - R; x <= cx + R; x += cell) {
      const dx = x - cx, dy = y - cy, dist = Math.sqrt(dx * dx + dy * dy) / R;
      if (dist > 1) continue;
      const rad = cell * 0.5 * Math.min(1, 1.15 - dist * 0.55);
      ctx.moveTo(x + rad, y);
      ctx.arc(x, y, rad, 0, Math.PI * 2);
    }
  }
  ctx.fill();
  ctx.restore();
}

function drawDarkBand(ctx, r) {
  ctx.save();
  const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
  g.addColorStop(0, 'rgba(16,6,30,0)');
  g.addColorStop(0.18, 'rgba(16,6,30,0.82)');
  g.addColorStop(0.82, 'rgba(16,6,30,0.82)');
  g.addColorStop(1, 'rgba(16,6,30,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, r.y, ctx.canvas.width, r.h);
  ctx.restore();
}

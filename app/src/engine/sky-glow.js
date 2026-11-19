// Sky glow: finds the sky in a photo panel and paints it with the grade's sunset gradient, so a pale, washed sky
// glows like key art (hot orange low near the horizon, through pink, to deep magenta-violet at the top).
// skyMaskBeforeGrade() runs on the crop before the grade (same point as the skin mask); paintSkyGlow() runs after
// the grade and before Poster Ink, so Kuwahara paints the sky into strokes and the ink lines stay on top of it.

// Sky palettes per grade, from the top of the sky (t = 0) to the horizon (t = 1), plus the sun's glow colour.
// Grades without a palette (Miami Teal, Noir Heat) keep their own sky.
export const SKY_PALETTES = {
  sunsetStrip: { stops: [[0, [122, 34, 144]], [0.42, [226, 64, 128]], [0.74, [255, 118, 58]], [1, [255, 170, 80]]], glow: [255, 196, 100] },
  goldenHour: { stops: [[0, [138, 42, 120]], [0.4, [236, 86, 104]], [0.72, [255, 136, 58]], [1, [255, 190, 96]]], glow: [255, 226, 140] },
  neonNight: { stops: [[0, [58, 42, 154]], [0.5, [138, 38, 168]], [1, [224, 42, 156]]], glow: [255, 120, 200] },
};

export function hasSkyPalette(gradeId) {
  return Boolean(SKY_PALETTES[gradeId]);
}

// Soft sky mask (0..1 per pixel) from the crop before the grade:
// - candidates are bright (luminance > 0.5), low-saturation pixels (pale cream, haze, white cloud) or pale blue sky;
// - only candidates connected to the panel's top edge count (4-connected flood fill that stops at luminance steps,
//   so it does not leak through an edge into a wall or a shirt);
// - the mask fades out in the lower third, is feathered with a two-pass box blur, and is zero on skin and fades
//   near it, so faces, palms, hair and buildings keep their own colour and their ink outlines.
// Returns null when no sky is found (e.g. an all-dark night photo).
export function skyMaskBeforeGrade(imageData, skin = null) {
  const { width: w, height: h, data: d } = imageData;
  const n = w * h;
  const L = new Float32Array(n);
  const cand = new Uint8Array(n);
  // The RGB skin rule also fires on warm pale haze (e.g. 234,220,193); real skin is never that bright and washed,
  // so the guard keeps every skin pixel except those (L > 0.84 and saturation < 0.42).
  const guard = skin ? new Uint8Array(n) : null;
  for (let p = 0, i = 0; p < n; p++, i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const l = (r * 54 + g * 183 + b * 19) / 65280;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const sat = mx ? (mx - mn) / mx : 0;
    L[p] = l;
    if (guard) guard[p] = skin[p] && !(l > 0.84 && sat < 0.42) ? 1 : 0;
    const pale = (l > 0.5 && sat < 0.34) || (l > 0.8 && sat < 0.42) || (b >= r && sat < 0.55 && l > 0.55);
    cand[p] = pale && !(guard && guard[p]) ? 1 : 0;
  }
  // Flood fill from the top row through candidates, never across a luminance step bigger than 0.09.
  const sky = new Uint8Array(n);
  const stack = new Int32Array(n);
  let sp = 0;
  for (let x = 0; x < w; x++) if (cand[x]) { sky[x] = 1; stack[sp++] = x; }
  while (sp) {
    const p = stack[--sp], x = p % w, l = L[p];
    for (let k = 0; k < 4; k++) {
      const q = k === 0 ? (x > 0 ? p - 1 : -1) : k === 1 ? (x < w - 1 ? p + 1 : -1) : k === 2 ? p - w : p + w;
      if (q < 0 || q >= n || sky[q] || !cand[q] || Math.abs(L[q] - l) >= 0.09) continue;
      sky[q] = 1; stack[sp++] = q;
    }
  }
  let count = 0;
  for (let p = 0; p < n; p++) count += sky[p];
  if (count < n * 0.01) return null;
  // Feather, fade the lower third, then guard skin (hard zero on skin, soft fade beside it).
  const r = Math.max(2, Math.round(Math.min(w, h) / 90));
  const m = new Float32Array(n);
  for (let p = 0; p < n; p++) m[p] = sky[p];
  boxBlur(m, w, h, r); boxBlur(m, w, h, r);
  let skinNear = null;
  if (guard) {
    skinNear = new Float32Array(n);
    for (let p = 0; p < n; p++) skinNear[p] = guard[p];
    boxBlur(skinNear, w, h, r * 2); boxBlur(skinNear, w, h, r * 2);
  }
  for (let y = 0; y < h; y++) {
    const fy = y / h, fade = fy < 0.62 ? 1 : fy > 0.9 ? 0 : 1 - smooth((fy - 0.62) / 0.28);
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      let v = Math.min(1, m[p] * 1.15) * fade;
      if (guard) v = guard[p] ? 0 : v * Math.max(0, 1 - skinNear[p] * 2.5);
      m[p] = v;
    }
  }
  return { mask: m, lum: L };
}

// Paint the masked sky with the grade's sunset gradient after the grade. The gradient runs from the top of the panel
// to the sky's low edge; a soft glow sits at the sky's brightest point (the sun's side); the photo's own luminance
// texture modulates the colour so clouds still read.
export function paintSkyGlow(imageData, sky, gradeId, amount = 0.9) {
  const pal = SKY_PALETTES[gradeId];
  if (!pal || !sky) return imageData;
  const { width: w, height: h, data: d } = imageData;
  const { mask: m, lum: L } = sky;
  // Sky extent, mean luminance and the sun (centroid of the brightest masked pixels).
  let maxL = 0, sumL = 0, sumW = 0, lowY = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = y * w + x, v = m[p];
    if (v < 0.5) continue;
    sumL += L[p] * v; sumW += v; if (L[p] > maxL) maxL = L[p];
    if (y > lowY) lowY = y;
  }
  if (!sumW) return imageData;
  const meanL = sumL / sumW;
  let sx = 0, sy = 0, sn = 0;
  for (let p = 0; p < m.length; p++) if (m[p] >= 0.5 && L[p] >= maxL - 0.03) { sx += p % w; sy += (p / w) | 0; sn++; }
  sx /= sn; sy /= sn;
  const skyH = Math.max(h * 0.25, lowY + 1);
  const R = Math.hypot(w, h) * 0.42;
  for (let y = 0; y < h; y++) {
    const c = sampleStops(pal.stops, Math.min(1, y / skyH));
    for (let x = 0; x < w; x++) {
      const p = y * w + x, v = m[p];
      if (v <= 0.003) continue;
      const i = p * 4;
      const dd = Math.hypot(x - sx, y - sy) / R, g = Math.exp(-dd * dd * 2.2);
      // Texture factor kept <= 1.14 and the glow at 60 % so the sun's side stays hot orange instead of tipping
      // into Poster Ink's cream highlight clip.
      const f = Math.max(0.64, Math.min(1.14, 0.92 + 0.9 * (L[p] - meanL)));
      const r = (c[0] + (pal.glow[0] - c[0]) * g * 0.6) * f;
      const gg = (c[1] + (pal.glow[1] - c[1]) * g * 0.6) * f;
      const b = (c[2] + (pal.glow[2] - c[2]) * g * 0.6) * f;
      const a = v * amount;
      d[i] = d[i] + (r - d[i]) * a;
      d[i + 1] = d[i + 1] + (gg - d[i + 1]) * a;
      d[i + 2] = d[i + 2] + (b - d[i + 2]) * a;
    }
  }
  return imageData;
}

// Fraction of the panel the mask covers (weighted); used by the selftest and the shot notes.
export function skyCoverage(sky) {
  if (!sky) return 0;
  let s = 0;
  for (let p = 0; p < sky.mask.length; p++) s += sky.mask[p];
  return s / sky.mask.length;
}

function smooth(t) { return t * t * (3 - 2 * t); }

function sampleStops(stops, t) {
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [s0, c0] = stops[i - 1], [s1, c1] = stops[i];
      const f = (t - s0) / (s1 - s0 || 1);
      return [c0[0] + (c1[0] - c0[0]) * f, c0[1] + (c1[1] - c0[1]) * f, c0[2] + (c1[2] - c0[2]) * f];
    }
  }
  return stops[stops.length - 1][1];
}

// In-place separable box blur (radius r) on a w x h float field, with running sums.
function boxBlur(a, w, h, r) {
  const tmp = new Float32Array(Math.max(w, h));
  for (let y = 0; y < h; y++) {
    const o = y * w;
    let s = 0;
    for (let x = -r; x <= r; x++) s += a[o + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      tmp[x] = s / (2 * r + 1);
      s += a[o + Math.min(w - 1, x + r + 1)] - a[o + Math.max(0, x - r)];
    }
    for (let x = 0; x < w; x++) a[o + x] = tmp[x];
  }
  for (let x = 0; x < w; x++) {
    let s = 0;
    for (let y = -r; y <= r; y++) s += a[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      tmp[y] = s / (2 * r + 1);
      s += a[Math.min(h - 1, y + r + 1) * w + x] - a[Math.max(0, y - r) * w + x];
    }
    for (let y = 0; y < h; y++) a[y * w + x] = tmp[y];
  }
}

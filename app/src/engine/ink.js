// Poster Ink: turns a graded photo panel into illustrated poster art. Flat posterized colour, dark ink lines from a
// Sobel edge pass, halftone dots in the shadows, then a little grain and a vignette. Every size is relative to the
// cover width W, so the 960 px preview and the 1920 px export look the same.

const INK = [18, 10, 28]; // #120a1c

// Full Poster Ink pass on one graded panel. lumHalf comes from smoothForInk(), taken before the grade; skin comes from
// skinMaskBeforeGrade() (1 = skin-coloured pixel), so faces get lighter lines and no dots.
// Ink weight follows the panel: a 200 px strip gets 1 px lines and fewer of them, a hero panel the full W/640 weight.
// M3 painterly pass: no posterize bands and no lift to a mean luminance. An edge-preserving Kuwahara filter paints
// flat strokes but keeps faces continuous-tone, an S-curve keeps deep blacks and lets hot highlights clip to warm
// cream, halftone dots only in deep non-skin shadows, and ink lines are heavy on silhouettes, light on detail.
export function posterInk(imageData, lumHalf, { coverW, strength = 0.8, paper = [200, 80, 120], seed = 1, skin = null }) {
  const s = Math.max(0, Math.min(1, strength));
  if (s <= 0) return imageData;
  const short = Math.min(imageData.width, imageData.height);
  const sizeK = Math.max(0, Math.min(1, (short - 160) / 440)); // 0 for a small strip, 1 for a hero panel
  kuwahara(imageData, Math.max(2, Math.round((coverW / 420) * (0.6 + 0.4 * sizeK) * s)));
  posterCurve(imageData, s);
  halftoneShadows(imageData, { cell: Math.max(4, Math.round(coverW / 170)), paper, strength: s, skin, cutoffL: 0.14, paperA: 0.06 });
  sobelInkLines(imageData, lumHalf, {
    lineWidth: Math.max(1, Math.round((coverW / 640) * (0.5 + 0.5 * sizeK))),
    alpha: 0.9 * s, keep: 0.07 + 0.04 * sizeK, skin, graded: true,
  });
  return imageData;
}

// Kuwahara filter on summed-area tables: each pixel takes the mean colour of the least-varied of its four
// (r+1)x(r+1) quadrants. Flat areas become painted strokes; edges stay sharp; skin stays smooth (no bands).
export function kuwahara(imageData, r) {
  const { width: w, height: h, data: d } = imageData;
  const W1 = w + 1;
  const sR = new Float64Array(W1 * (h + 1)), sG = new Float64Array(W1 * (h + 1)), sB = new Float64Array(W1 * (h + 1));
  const sL = new Float64Array(W1 * (h + 1)), sQ = new Float64Array(W1 * (h + 1));
  for (let y = 0; y < h; y++) {
    let aR = 0, aG = 0, aB = 0, aL = 0, aQ = 0;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, l = lum(d, i);
      aR += d[i]; aG += d[i + 1]; aB += d[i + 2]; aL += l; aQ += l * l;
      const o = (y + 1) * W1 + x + 1, u = y * W1 + x + 1;
      sR[o] = sR[u] + aR; sG[o] = sG[u] + aG; sB[o] = sB[u] + aB; sL[o] = sL[u] + aL; sQ[o] = sQ[u] + aQ;
    }
  }
  const box = (S, x0, y0, x1, y1) => S[y1 * W1 + x1] - S[y0 * W1 + x1] - S[y1 * W1 + x0] + S[y0 * W1 + x0];
  const out = new Uint8ClampedArray(d.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let best = Infinity, bx0 = 0, by0 = 0, bx1 = 1, by1 = 1;
      for (let q = 0; q < 4; q++) {
        const x0 = Math.max(0, q & 1 ? x : x - r), x1 = Math.min(w, (q & 1 ? x + r : x) + 1);
        const y0 = Math.max(0, q & 2 ? y : y - r), y1 = Math.min(h, (q & 2 ? y + r : y) + 1);
        const n = (x1 - x0) * (y1 - y0), m = box(sL, x0, y0, x1, y1) / n;
        const v = box(sQ, x0, y0, x1, y1) / n - m * m;
        if (v < best) { best = v; bx0 = x0; by0 = y0; bx1 = x1; by1 = y1; }
      }
      const n = (bx1 - bx0) * (by1 - by0), i = (y * w + x) * 4;
      out[i] = box(sR, bx0, by0, bx1, by1) / n; out[i + 1] = box(sG, bx0, by0, bx1, by1) / n; out[i + 2] = box(sB, bx0, by0, bx1, by1) / n;
      out[i + 3] = d[i + 3];
    }
  }
  d.set(out);
  return imageData;
}

// Poster contrast: an S-curve on luminance (hue kept), deep blacks stay black, and the hottest highlights clip
// towards warm cream so a sunset sky glows instead of turning mauve.
function posterCurve(imageData, s) {
  const d = imageData.data;
  const gain = new Float32Array(256);
  const k = 1 + 0.5 * s;
  for (let v = 1; v < 256; v++) {
    const x = v / 255;
    const y = x < 0.46 ? 0.46 * Math.pow(x / 0.46, k) : 1 - 0.54 * Math.pow((1 - x) / 0.54, k * 0.85);
    gain[v] = (y * 255) / v;
  }
  for (let i = 0; i < d.length; i += 4) {
    const l = lum(d, i) | 0, g = gain[Math.min(255, l)] || 1;
    let r = d[i] * g, gg = d[i + 1] * g, b = d[i + 2] * g;
    const t = (l * g - 205) / 50;
    if (t > 0) { const a = Math.min(1, t) * 0.7; r += (255 - r) * a; gg += (242 - gg) * a; b += (214 - b) * a; }
    d[i] = r; d[i + 1] = gg; d[i + 2] = b;
  }
}

// Skin mask from the crop before the grade (a classic RGB skin-tone rule, per pixel). The grade recolours
// everything, so this is the only point where skin can still be told apart.
export function skinMaskBeforeGrade(imageData) {
  const { width: w, height: h, data: d } = imageData;
  const m = new Uint8Array(w * h);
  for (let p = 0, i = 0; p < m.length; p++, i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    m[p] = r > 90 && g > 40 && b > 20 && r > g && r > b && mx - mn > 18 && r - g > 12 && r - g < 110 && g > b * 0.9 ? 1 : 0;
  }
  return m;
}

// Halftone dots only in the deep shadows (darker than 0.22, never on skin): shadows become dot screens on a lightly
// lifted "paper" tone, mid-tones stay flat colour.
export function halftoneShadows(imageData, { cell, paper, strength, skin = null, cutoffL = 0.22, paperA = 0.22 }) {
  const { width: w, height: h, data: d } = imageData;
  const cutoff = cutoffL * 255;
  for (let cy = 0; cy < h; cy += cell) {
    for (let cx = 0; cx < w; cx += cell) {
      const x1 = Math.min(w, cx + cell), y1 = Math.min(h, cy + cell);
      let sum = 0, n = 0;
      for (let y = cy; y < y1; y++) for (let x = cx; x < x1; x++) { const i = (y * w + x) * 4; sum += lum(d, i); n++; }
      const avg = sum / n;
      if (avg >= cutoff) continue;
      const dark = (cutoff - avg) / cutoff;
      const rad = cell * 0.5 * Math.pow(dark, 0.7);
      const mx = cx + cell / 2, my = cy + cell / 2, r2 = rad * rad;
      for (let y = cy; y < y1; y++) {
        for (let x = cx; x < x1; x++) {
          const i = (y * w + x) * 4;
          if (lum(d, i) > cutoff || (skin && skin[y * w + x])) continue;
          const dx = x + 0.5 - mx, dy = y + 0.5 - my;
          const inDot = dx * dx + dy * dy <= r2;
          const target = inDot ? INK : paper;
          const a = (inDot ? 0.75 : paperA) * strength;
          d[i] += (target[0] - d[i]) * a; d[i + 1] += (target[1] - d[i + 1]) * a; d[i + 2] += (target[2] - d[i + 2]) * a;
        }
      }
    }
  }
  return imageData;
}

// Ink lines: Sobel magnitude on a half-size luminance copy, keep the strongest 8-12 % (fewer in small panels),
// dilate, draw in #120a1c; on skin the line is drawn at 40 % so faces read as faces, not as cracks.
export function sobelInkLines(imageData, lumHalf, { lineWidth, alpha, keep = 0.12, skin = null, graded = false }) {
  const { width: w, height: h, data: d } = imageData;
  const { w: hw, h: hh } = lumHalf;
  const L = smooth3(lumHalf.lum, hw, hh);
  const mag = new Float32Array(hw * hh);
  const hist = new Uint32Array(1024);
  let count = 0;
  for (let y = 1; y < hh - 1; y++) {
    for (let x = 1; x < hw - 1; x++) {
      const i = y * hw + x;
      const gx = -L[i - hw - 1] - 2 * L[i - 1] - L[i + hw - 1] + L[i - hw + 1] + 2 * L[i + 1] + L[i + hw + 1];
      const gy = -L[i - hw - 1] - 2 * L[i - hw] - L[i - hw + 1] + L[i + hw - 1] + 2 * L[i + hw] + L[i + hw + 1];
      const m = Math.sqrt(gx * gx + gy * gy);
      mag[i] = m;
      hist[Math.min(1023, m | 0)]++;
      count++;
    }
  }
  let thr = 0, acc = 0;
  const want = count * (1 - keep);
  for (let b = 0; b < 1024; b++) { acc += hist[b]; if (acc >= want) { thr = b; break; } }
  thr = Math.max(thr, 72);
  // Edge mask at full size (nearest upsample of the half-size mask), then a square dilation.
  let mask = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const sy = Math.min(hh - 1, y >> 1);
    for (let x = 0; x < w; x++) mask[y * w + x] = mag[sy * hw + Math.min(hw - 1, x >> 1)] > thr ? 1 : 0;
  }
  const r = Math.max(0, Math.floor((lineWidth - 1) / 2));
  if (r > 0) mask = dilate(mask, w, h, r);
  for (let y = 0, p = 0, i = 0; y < h; y++) {
    const sy = Math.min(hh - 1, y >> 1);
    for (let x = 0; x < w; x++, p++, i += 4) {
    if (!mask[p]) continue;
    // graded: silhouettes and big shapes (strong edges) get full ink, interior detail (weaker kept edges) lighter.
    const m = graded ? mag[sy * hw + Math.min(hw - 1, x >> 1)] : 0;
    const wgt = graded ? (m > thr ? Math.min(1, 0.4 + (0.6 * (m - thr)) / (thr * 1.2)) : 0.6) : 1;
    const a = (skin && skin[p] ? alpha * (graded ? 0.3 : 0.4) : alpha) * wgt;
    d[i] += (INK[0] - d[i]) * a; d[i + 1] += (INK[1] - d[i + 1]) * a; d[i + 2] += (INK[2] - d[i + 2]) * a;
    }
  }
  return imageData;
}

// Before the grade: soften the crop (2-pass box blur, radius W/960) and keep a half-size luminance copy for Sobel.
export function smoothForInk(imageData, coverW) {
  const r = Math.max(1, Math.round(coverW / 960));
  boxBlurRGBA(imageData, r);
  boxBlurRGBA(imageData, r);
  const { width: w, height: h, data: d } = imageData;
  const hw = Math.max(3, w >> 1), hh = Math.max(3, h >> 1);
  const L = new Float32Array(hw * hh);
  for (let y = 0; y < hh; y++) {
    for (let x = 0; x < hw; x++) {
      const x0 = Math.min(w - 1, x * 2), y0 = Math.min(h - 1, y * 2);
      const x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1);
      L[y * hw + x] = (lum(d, (y0 * w + x0) * 4) + lum(d, (y0 * w + x1) * 4) + lum(d, (y1 * w + x0) * 4) + lum(d, (y1 * w + x1) * 4)) / 4;
    }
  }
  return { lum: L, w: hw, h: hh };
}

// Last touch on every panel: film grain (at most 4/255) and a soft vignette (at most 22 % darker in the corners).
export function grainAndVignette(imageData, seed, vignette = 0.22) {
  const { width: w, height: h, data: d } = imageData;
  const rand = mulberry32(seed);
  const cx = w / 2, cy = h / 2, inv = 1 / (cx * cx + cy * cy);
  for (let y = 0, i = 0; y < h; y++) {
    const dy = y - cy;
    for (let x = 0; x < w; x++, i += 4) {
      const dx = x - cx;
      const f = 1 - vignette * (dx * dx + dy * dy) * inv;
      const n = (rand() - 0.5) * 8;
      d[i] = d[i] * f + n; d[i + 1] = d[i + 1] * f + n; d[i + 2] = d[i + 2] * f + n;
    }
  }
  return imageData;
}

// Brighten a panel with a gamma curve when its mean luminance is under the target (dark panels turn to mud).
export function liftToMeanLuminance(imageData, target) {
  const d = imageData.data;
  const mean = meanLuminance(imageData);
  if (mean >= target || mean <= 0.01) return mean;
  const gamma = Math.log(target) / Math.log(mean);
  const lut = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) lut[v] = 255 * Math.pow(v / 255, gamma);
  for (let i = 0; i < d.length; i += 4) { d[i] = lut[d[i]]; d[i + 1] = lut[d[i + 1]]; d[i + 2] = lut[d[i + 2]]; }
  return target;
}

// The no-ink lift: mid-tones and highlights get the gamma lift toward the target mean, but the lift fades out below
// about 0.25 and the toe is pushed down, so shadows stay deep (plum to near-black) instead of turning milky.
export function liftKeepShadows(imageData, target) {
  const d = imageData.data;
  const mean = meanLuminance(imageData);
  const gamma = mean < target && mean > 0.01 ? Math.log(target) / Math.log(mean) : 1;
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const lut = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) {
    const x = v / 255;
    let y = x + (Math.pow(x, gamma) - x) * smooth(0.1, 0.4, x);
    y *= 0.72 + 0.28 * smooth(0, 0.32, y);
    lut[v] = Math.round(255 * y);
  }
  for (let i = 0; i < d.length; i += 4) { d[i] = lut[d[i]]; d[i + 1] = lut[d[i + 1]]; d[i + 2] = lut[d[i + 2]]; }
}

export function meanLuminance(imageData) {
  const d = imageData.data;
  let sum = 0;
  for (let i = 0; i < d.length; i += 16) sum += lum(d, i);
  return sum / (d.length / 16) / 255;
}

// Posterize the luminance into flat bands and scale RGB to match, so hues stay true (no olive skin or green hair).
function posterize(imageData, levels, s) {
  const d = imageData.data;
  const step = 255 / (levels - 1);
  const gain = new Float32Array(256);
  for (let v = 1; v < 256; v++) {
    const q = Math.max(step * 0.35, Math.round(v / step) * step);
    gain[v] = 1 + (q / v - 1) * s;
  }
  gain[0] = 1;
  for (let i = 0; i < d.length; i += 4) {
    const g = gain[Math.min(255, lum(d, i) | 0)];
    d[i] *= g; d[i + 1] *= g; d[i + 2] *= g;
  }
}

function lum(d, i) {
  return 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
}

function boxBlurRGBA(imageData, r) {
  const { width: w, height: h, data: d } = imageData;
  const tmp = new Float32Array(Math.max(w, h) * 4);
  const span = 2 * r + 1;
  for (let y = 0; y < h; y++) blurLine(d, y * w * 4, 4, w, r, span, tmp);
  for (let x = 0; x < w; x++) blurLine(d, x * 4, w * 4, h, r, span, tmp);
}

function blurLine(d, start, stride, n, r, span, tmp) {
  for (let c = 0; c < 3; c++) {
    let acc = 0;
    for (let k = -r; k <= r; k++) acc += d[start + Math.min(n - 1, Math.max(0, k)) * stride + c];
    for (let p = 0; p < n; p++) {
      tmp[p * 4 + c] = acc / span;
      const out = Math.max(0, p - r), inn = Math.min(n - 1, p + r + 1);
      acc += d[start + inn * stride + c] - d[start + out * stride + c];
    }
    for (let p = 0; p < n; p++) d[start + p * stride + c] = tmp[p * 4 + c];
  }
}

function smooth3(src, w, h) {
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0, n = 0;
      for (let yy = Math.max(0, y - 1); yy <= Math.min(h - 1, y + 1); yy++) {
        for (let xx = Math.max(0, x - 1); xx <= Math.min(w - 1, x + 1); xx++) { s += src[yy * w + xx]; n++; }
      }
      out[y * w + x] = s / n;
    }
  }
  return out;
}

function dilate(mask, w, h, r) {
  const a = new Uint8Array(w * h), b = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let on = 0;
      for (let k = -r; k <= r && !on; k++) { const xx = x + k; if (xx >= 0 && xx < w && mask[y * w + xx]) on = 1; }
      a[y * w + x] = on;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let on = 0;
      for (let k = -r; k <= r && !on; k++) { const yy = y + k; if (yy >= 0 && yy < h && a[yy * w + x]) on = 1; }
      b[y * w + x] = on;
    }
  }
  return b;
}

export function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

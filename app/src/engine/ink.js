// Poster Ink: turns a graded photo panel into illustrated poster art. Flat posterized colour, dark ink lines from a
// Sobel edge pass, halftone dots in the shadows, then a little grain and a vignette. Every size is relative to the
// cover width W, so the 960 px preview and the 1920 px export look the same.

const INK = [18, 10, 28]; // #120a1c

// Full Poster Ink pass on one graded panel. lumHalf comes from smoothForInk(), taken before the grade.
export function posterInk(imageData, lumHalf, { coverW, strength = 0.8, paper = [200, 80, 120], seed = 1 }) {
  const s = Math.max(0, Math.min(1, strength));
  if (s <= 0) return imageData;
  posterize(imageData, 5, s);
  liftToMeanLuminance(imageData, 0.47);
  halftoneShadows(imageData, { cell: Math.max(4, Math.round(coverW / 150)), paper, strength: s });
  sobelInkLines(imageData, lumHalf, { lineWidth: Math.max(2, Math.round(coverW / 640)), alpha: 0.85 * s });
  return imageData;
}

// Halftone dots where the panel is darker than 0.28: shadows become dot screens on a lifted "paper" tone.
export function halftoneShadows(imageData, { cell, paper, strength }) {
  const { width: w, height: h, data: d } = imageData;
  const cutoff = 0.28 * 255;
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
          if (lum(d, i) > cutoff) continue;
          const dx = x + 0.5 - mx, dy = y + 0.5 - my;
          const inDot = dx * dx + dy * dy <= r2;
          const target = inDot ? INK : paper;
          const a = (inDot ? 0.8 : 0.32) * strength;
          d[i] += (target[0] - d[i]) * a; d[i + 1] += (target[1] - d[i + 1]) * a; d[i + 2] += (target[2] - d[i + 2]) * a;
        }
      }
    }
  }
  return imageData;
}

// Ink lines: Sobel magnitude on a half-size luminance copy, keep the strongest 12 %, dilate, draw in #120a1c.
export function sobelInkLines(imageData, lumHalf, { lineWidth, alpha }) {
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
  const want = count * 0.88;
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
  for (let p = 0, i = 0; p < mask.length; p++, i += 4) {
    if (!mask[p]) continue;
    d[i] += (INK[0] - d[i]) * alpha; d[i + 1] += (INK[1] - d[i + 1]) * alpha; d[i + 2] += (INK[2] - d[i + 2]) * alpha;
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

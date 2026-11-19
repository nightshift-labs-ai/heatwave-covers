// Colour grades: luminance -> contrast curve -> 4-5 stop gradient map, blended with the photo's own colour.
// Applied per panel on getImageData pixels, after the crop and before Poster Ink.

export const GRADES = {
  sunsetStrip: {
    label: 'Sunset Strip',
    stops: [[0, '#2a0b3d'], [0.26, '#8c1a6e'], [0.48, '#f0407a'], [0.7, '#ff9a3c'], [1, '#ffeaa8']],
    mix: 0.6, contrast: 1.2, lift: 0.02,
  },
  neonNight: {
    label: 'Neon Night',
    stops: [[0, '#0b0a3a'], [0.32, '#3b1aa8'], [0.58, '#e02a9c'], [0.82, '#3fe0f0'], [1, '#e8fbff']],
    mix: 0.7, contrast: 1.2, lift: 0.05,
  },
  goldenHour: {
    label: 'Golden Hour',
    stops: [[0, '#3a1d12'], [0.35, '#a8562a'], [0.65, '#f0a04a'], [1, '#fff0c4']],
    mix: 0.72, contrast: 1.12, lift: 0.06,
  },
  miamiTeal: {
    label: 'Miami Teal',
    stops: [[0, '#06303a'], [0.35, '#11847f'], [0.65, '#f2a07e'], [1, '#ffe6d2']],
    mix: 0.62, contrast: 1.15, lift: 0.06,
  },
  // Noir Heat: black shadows, blood-red mids, cream highlights; a hard-boiled night with the heat still on.
  noirHeat: {
    label: 'Noir Heat',
    stops: [[0, '#0c0608'], [0.3, '#42101a'], [0.55, '#c0182e'], [0.8, '#f2d6b0'], [1, '#fff7e8']],
    mix: 0.74, contrast: 1.24, lift: 0.04,
  },
};

export const GRADE_ORDER = ['sunsetStrip', 'neonNight', 'goldenHour', 'miamiTeal', 'noirHeat'];

// Grade the pixels of one panel in place.
export function applyGradeToPanel(imageData, gradeId) {
  const grade = GRADES[gradeId] ?? GRADES.sunsetStrip;
  const lut = gradeLut(gradeId, grade);
  const d = imageData.data;
  const m = grade.mix, k = 1 - m;
  for (let i = 0; i < d.length; i += 4) {
    const y = (d[i] * 54 + d[i + 1] * 183 + d[i + 2] * 19) >> 8;
    const j = y * 3;
    d[i] = d[i] * k + lut[j] * m;
    d[i + 1] = d[i + 1] * k + lut[j + 1] * m;
    d[i + 2] = d[i + 2] * k + lut[j + 2] * m;
  }
  return imageData;
}

// Stretch the panel's luminance range (1st..99th percentile) to full before the grade, so night photos use the
// whole gradient map instead of collapsing into one tone. Gain is capped at 2.4.
export function autoLevelsBeforeGrade(imageData) {
  const d = imageData.data;
  const hist = new Uint32Array(256);
  let n = 0;
  for (let i = 0; i < d.length; i += 8) { hist[(d[i] * 54 + d[i + 1] * 183 + d[i + 2] * 19) >> 8]++; n++; }
  let lo = 0, hi = 255, acc = 0;
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= n * 0.01) { lo = v; break; } }
  acc = 0;
  for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc >= n * 0.01) { hi = v; break; } }
  const gain = Math.min(2.4, 255 / Math.max(1, hi - lo));
  if (gain < 1.05) return imageData;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = (d[i] - lo) * gain; d[i + 1] = (d[i + 1] - lo) * gain; d[i + 2] = (d[i + 2] - lo) * gain;
  }
  return imageData;
}

// Sample a grade's gradient at t (0..1) as [r, g, b]; used for swatches, halftone paper and title bands.
export function gradeColorAt(gradeId, t) {
  const grade = GRADES[gradeId] ?? GRADES.sunsetStrip;
  return sampleStops(grade.stops.map(([s, hex]) => [s, hexToRgb(hex)]), t);
}

const lutCache = new Map();
function gradeLut(id, grade) {
  if (lutCache.has(id)) return lutCache.get(id);
  const stops = grade.stops.map(([s, hex]) => [s, hexToRgb(hex)]);
  const lut = new Uint8ClampedArray(256 * 3);
  for (let v = 0; v < 256; v++) {
    let t = v / 255;
    t = (t - 0.5) * grade.contrast + 0.5 + grade.lift;
    t = Math.min(1, Math.max(0, t));
    const [r, g, b] = sampleStops(stops, t);
    lut[v * 3] = r; lut[v * 3 + 1] = g; lut[v * 3 + 2] = b;
  }
  lutCache.set(id, lut);
  return lut;
}

function sampleStops(stops, t) {
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [s0, c0] = stops[i - 1], [s1, c1] = stops[i];
      const f = (t - s0) / (s1 - s0 || 1);
      return [c0[0] + (c1[0] - c0[0]) * f, c0[1] + (c1[1] - c0[1]) * f, c0[2] + (c1[2] - c0[2]) * f];
    }
  }
  return stops[stops.length - 1][1].slice();
}

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Cover layouts. Each layout gives, per aspect class (land 16:9, square 1:1, tall 4:5), a list of panels in 0..1 units
// [x0, y0, x1, y1] (grid layouts) or snapshots [cx, cy, w, h, rotDeg], plus a title-block rect. layoutFor() turns
// them into pixels for an exact cover size with scaled black gutters, so a layout re-flows and never stretches.

export const LAYOUTS = {
  // Key Art Slash: the poster layout. A full-height hero, five panels cut on slants beside it (or under it in 1:1 and
  // 4:5), thin cream frame lines and a cream outer border, the title over the art, a palm band and a billing line.
  // Polygons are in 0..1 of the art area (the cover minus border, band and billing line). No panel is narrower than
  // about 1/6 of the cover.
  keyArtSlash: {
    label: 'Key Art Slash',
    kind: 'keyart',
    land: {
      polys: [
        [[0, 0], [0.6, 0], [0.555, 1], [0, 1]],
        [[0.6, 0], [1, 0], [1, 0.47], [0.581, 0.42]],
        [[0.581, 0.42], [0.79, 0.445], [0.775, 0.712], [0.568, 0.72]],
        [[0.79, 0.445], [1, 0.47], [1, 0.7], [0.775, 0.712]],
        [[0.568, 0.72], [0.765, 0.712], [0.79, 1], [0.555, 1]],
        [[0.765, 0.712], [1, 0.7], [1, 1], [0.79, 1]],
      ],
      title: { cx: 0.38, cy: 0.755, w: 0.66, tilt: -3 },
      seal: [0.581, 0.42], pill: [0.985, 0.035, 'right'],
      tags: [[0, 0.04, 0.16, -3], [1, 0.62, 0.07, 2.5], [5, 0.84, 0.75, -2]],
    },
    square: {
      polys: [
        [[0, 0], [1, 0], [1, 0.52], [0, 0.58]],
        [[0, 0.58], [0.26, 0.565], [0.24, 1], [0, 1]],
        [[0.26, 0.565], [0.51, 0.551], [0.49, 1], [0.24, 1]],
        [[0.51, 0.551], [0.76, 0.534], [0.75, 1], [0.49, 1]],
        [[0.76, 0.534], [1, 0.52], [1, 1], [0.75, 1]],
      ],
      title: { cx: 0.5, cy: 0.5, w: 0.8, tilt: -3 },
      seal: [0.8, 0.27], pill: [0.975, 0.03, 'right'],
      tags: [[0, 0.04, 0.05, -3], [3, 0.52, 0.9, 2.5]],
    },
    tall: {
      polys: [
        [[0, 0], [1, 0], [1, 0.5], [0, 0.55]],
        [[0, 0.55], [0.58, 0.521], [0.55, 0.77], [0, 0.785]],
        [[0.58, 0.521], [1, 0.5], [1, 0.76], [0.55, 0.77]],
        [[0, 0.785], [0.36, 0.776], [0.34, 1], [0, 1]],
        [[0.36, 0.776], [0.69, 0.768], [0.67, 1], [0.34, 1]],
        [[0.69, 0.768], [1, 0.76], [1, 1], [0.67, 1]],
      ],
      title: { cx: 0.5, cy: 0.47, w: 0.86, tilt: -3 },
      seal: [0.35, 0.89], pill: [0.97, 0.025, 'right'],
      tags: [[0, 0.04, 0.04, -3], [2, 0.6, 0.705, 2.5], [5, 0.675, 0.815, -2]],
    },
  },
  keyArtNine: {
    label: 'Key Art Nine',
    kind: 'grid',
    land: {
      panels: [
        [0, 0, 0.42, 0.6],
        [0.42, 0, 0.6, 0.2], [0.42, 0.2, 0.6, 0.4], [0.42, 0.4, 0.6, 0.6],
        [0, 0.6, 0.11, 1], [0.11, 0.6, 0.22, 1], [0.22, 0.6, 0.33, 1], [0.33, 0.6, 0.44, 1],
        [0.6, 0, 1, 0.6],
      ],
      title: [0.44, 0.6, 1, 1],
    },
    square: {
      panels: [
        [0, 0, 0.5, 0.5],
        [0.5, 0, 0.72, 0.1667], [0.5, 0.1667, 0.72, 0.3333], [0.5, 0.3333, 0.72, 0.5],
        [0, 0.5, 0.25, 0.72], [0.25, 0.5, 0.5, 0.72], [0.5, 0.5, 0.75, 0.72], [0.75, 0.5, 1, 0.72],
        [0.72, 0, 1, 0.5],
      ],
      title: [0, 0.72, 1, 1],
    },
    tall: {
      panels: [
        [0, 0, 0.6, 0.45],
        [0.6, 0, 1, 0.15], [0.6, 0.15, 1, 0.3], [0.6, 0.3, 1, 0.45],
        [0, 0.45, 0.25, 0.66], [0.25, 0.45, 0.5, 0.66], [0.5, 0.45, 0.75, 0.66], [0.75, 0.45, 1, 0.66],
        [0, 0.66, 0.36, 1],
      ],
      title: [0.36, 0.66, 1, 1],
    },
  },
  heroAndSix: {
    label: 'Hero + Six',
    kind: 'grid',
    land: {
      panels: [[0, 0, 0.36, 0.74], ...gridCells(0.36, 0, 1, 0.74, 3, 2)],
      title: [0, 0.74, 1, 1],
    },
    square: {
      panels: [[0, 0, 0.44, 0.72], ...gridCells(0.44, 0, 1, 0.72, 2, 3)],
      title: [0, 0.72, 1, 1],
    },
    tall: {
      panels: [[0, 0, 0.5, 0.76], ...gridCells(0.5, 0, 1, 0.76, 2, 3)],
      title: [0, 0.76, 1, 1],
    },
  },
  tiltedSnapshots: {
    label: 'Snapshots',
    kind: 'snapshots',
    land: {
      snaps: [
        [0.17, 0.26, 0.25, 0.42, -6], [0.5, 0.22, 0.27, 0.38, 3], [0.83, 0.27, 0.25, 0.42, 6],
        [0.3, 0.8, 0.27, 0.36, 4], [0.7, 0.8, 0.27, 0.36, -5],
      ],
      title: [0.08, 0.42, 0.92, 0.66],
    },
    square: {
      snaps: [
        [0.18, 0.21, 0.3, 0.3, -6], [0.5, 0.19, 0.3, 0.3, 3], [0.82, 0.22, 0.3, 0.3, 7],
        [0.3, 0.8, 0.38, 0.3, 4], [0.72, 0.8, 0.38, 0.3, -5],
      ],
      title: [0.05, 0.38, 0.95, 0.63],
    },
    tall: {
      snaps: [
        [0.28, 0.18, 0.44, 0.3, -5], [0.73, 0.2, 0.42, 0.3, 6],
        [0.2, 0.8, 0.32, 0.28, 4], [0.5, 0.82, 0.32, 0.28, -3], [0.8, 0.8, 0.32, 0.28, 7],
      ],
      title: [0.04, 0.37, 0.96, 0.62],
    },
  },
  // Hero + Four: one big hero panel (about 58 % wide) and four framed photos in a 2x2 beside it (thin cream frames,
  // soft shadow, a small tilt on two of them), title band below. In 4:5 the hero sits on top and the four below it.
  heroFour: {
    label: 'Hero + Four',
    kind: 'heroFour',
    land: { hero: [0, 0, 0.58, 0.75], frames: [0.58, 0, 1, 0.75], tilts: [-1.6, 0, 0, 1.4], title: [0, 0.75, 1, 1] },
    square: { hero: [0, 0, 0.58, 0.72], frames: [0.58, 0, 1, 0.72], tilts: [-1.5, 0, 0, 1.6], title: [0, 0.72, 1, 1] },
    tall: { hero: [0, 0, 1, 0.47], frames: [0, 0.47, 1, 0.79], tilts: [-1.4, 0, 0, 1.2], title: [0, 0.79, 1, 1] },
  },
  // Grid Four: 2x2 with the title as a badge across the centre.
  gridFour: {
    label: 'Grid Four',
    kind: 'grid',
    land: { panels: gridCells(0, 0, 1, 1, 2, 2), title: [0.2, 0.33, 0.8, 0.67], overlay: true },
    square: { panels: gridCells(0, 0, 1, 1, 2, 2), title: [0.08, 0.35, 0.92, 0.65], overlay: true },
    tall: { panels: gridCells(0, 0, 1, 1, 2, 2), title: [0.05, 0.38, 0.95, 0.62], overlay: true },
  },
  // Full Bleed + Inset: one photo fills the cover, two framed insets on the right, big title bottom-left.
  fullBleedInset: {
    label: 'Full Bleed',
    kind: 'inset',
    land: { hero: [0, 0, 1, 1], insets: [[0.68, 0.06, 0.96, 0.42, 2], [0.68, 0.46, 0.96, 0.82, -1.6]], title: [0.02, 0.58, 0.64, 0.98] },
    square: { hero: [0, 0, 1, 1], insets: [[0.6, 0.05, 0.95, 0.31, 2], [0.6, 0.34, 0.95, 0.6, -1.6]], title: [0.03, 0.64, 0.97, 0.98] },
    tall: { hero: [0, 0, 1, 1], insets: [[0.55, 0.04, 0.95, 0.24, 2], [0.55, 0.27, 0.95, 0.47, -1.6]], title: [0.03, 0.68, 0.97, 0.98] },
  },
  stripFive: {
    label: 'Strip Five',
    kind: 'grid',
    land: { panels: gridCells(0, 0, 1, 1, 5, 1), title: [0.03, 0.34, 0.97, 0.68], overlay: true },
    square: { panels: gridCells(0, 0, 1, 1, 5, 1), title: [0.03, 0.33, 0.97, 0.67], overlay: true },
    tall: { panels: gridCells(0, 0, 1, 1, 5, 1), title: [0.03, 0.36, 0.97, 0.64], overlay: true },
  },
};

// Key Art Slash Plus (shot 1 only; not in the picker): Key Art Slash with a seventh slanted panel cut from the hero's
// empty sky at top-middle, between the hero and the big top-right panel, clear of the title, quote, seal and pill.
// The hero keeps the same bounding box (same crop), so the hero stays the biggest image; panels 1-5 are unchanged.
LAYOUTS.keyArtSlashPlus = {
  ...LAYOUTS.keyArtSlash,
  label: 'Key Art Slash Plus',
  land: {
    ...LAYOUTS.keyArtSlash.land,
    polys: [
      [[0, 0], [0.47, 0], [0.452, 0.405], [0.581, 0.42], [0.555, 1], [0, 1]],
      ...LAYOUTS.keyArtSlash.land.polys.slice(1),
      [[0.47, 0], [0.6, 0], [0.581, 0.42], [0.452, 0.405]],
    ],
  },
};

// Key Art Cast (shot 1 only; not in the picker, M8): a people-first cast cover. The hero (still the biggest image)
// on the left, a 3 + 3 grid of portrait panels on the right, a cool night accent under the title and one more
// person bottom-right; each person panel carries a short role tag at its lower-left, clear of the faces.
LAYOUTS.keyArtCast = {
  ...LAYOUTS.keyArtSlash,
  label: 'Key Art Cast',
  land: {
    ...LAYOUTS.keyArtSlash.land,
    polys: [
      [[0, 0], [0.47, 0], [0.452, 1], [0, 1]],
      [[0.47, 0], [0.648, 0], [0.645, 0.3], [0.465, 0.29]],
      [[0.648, 0], [0.824, 0], [0.822, 0.305], [0.645, 0.3]],
      [[0.824, 0], [1, 0], [1, 0.31], [0.822, 0.305]],
      [[0.465, 0.29], [0.645, 0.3], [0.642, 0.57], [0.46, 0.56]],
      [[0.645, 0.3], [0.822, 0.305], [0.82, 0.575], [0.642, 0.57]],
      [[0.822, 0.305], [1, 0.31], [1, 0.58], [0.82, 0.575]],
      [[0.46, 0.56], [0.775, 0.577], [0.79, 1], [0.452, 1]],
      [[0.775, 0.577], [1, 0.58], [1, 1], [0.79, 1]],
    ],
    // M9: seal on the rider panel's open sunset sky (clear of tags, faces and title); NIGHT OWL tag lifted out of
    // the quote's row so the quote line has clear space around it.
    seal: [0.865, 0.665],
    tags: [
      [0, 0.04, 0.16, -3], [1, 0.48, 0.235, 2], [2, 0.66, 0.245, -2], [3, 0.835, 0.25, 2],
      [4, 0.47, 0.33, -2], [5, 0.655, 0.4, 2], [6, 0.835, 0.52, -2], [8, 0.81, 0.93, 2],
    ],
  },
};

export const LAYOUT_ORDER =['keyArtSlash', 'keyArtNine','heroAndSix', 'heroFour', 'tiltedSnapshots', 'stripFive', 'gridFour', 'fullBleedInset'];

export const COVER_SIZES = [
  { w: 1080, h: 1080, label: '1080 × 1080', sub: 'square' },
  { w: 1080, h: 1350, label: '1080 × 1350', sub: 'portrait' },
  { w: 1920, h: 1080, label: '1920 × 1080', sub: 'wide' },
];

// Pixel geometry of a layout at an exact cover size: { panels: [{x, y, w, h, rot, snap}], title: {x, y, w, h},
// gutter, kind, overlay }.
export function layoutFor(layoutId, W, H) {
  const layout = LAYOUTS[layoutId] ?? LAYOUTS.keyArtNine;
  const spec = layout[aspectClass(W, H)];
  const g = gutterFor(W, H);
  if (layout.kind === 'keyart') return keyArtGeometry(spec, W, H);
  const title = rectToPixels(spec.title, W, H, 0, 0);
  if (layout.kind === 'snapshots') {
    const unit = Math.min(W, H);
    const panels = spec.snaps.map(([cx, cy, w, h, rot]) => {
      const pw = w * W, ph = h * H;
      return { x: cx * W - pw / 2, y: cy * H - ph / 2, w: pw, h: ph, rot: (rot * Math.PI) / 180, snap: true, border: Math.round(unit * 0.014) };
    });
    return { kind: 'snapshots', panels, title, gutter: g, overlay: true };
  }
  if (layout.kind === 'heroFour') {
    const hero = { ...rectToPixels(spec.hero, W, H, g, g / 2), rot: 0, snap: false };
    const area = rectToPixels(spec.frames, W, H, g, g / 2);
    const pad = Math.round(Math.min(W, H) * 0.016), border = Math.max(3, Math.round(Math.min(W, H) * 0.008));
    const cw = (area.w - pad) / 2, ch = (area.h - pad) / 2;
    const frames = spec.tilts.map((deg, k) => {
      const col = k % 2, row = Math.floor(k / 2);
      const x = area.x + pad / 2 + col * cw, y = area.y + pad / 2 + row * ch;
      return { x: Math.round(x + pad / 2), y: Math.round(y + pad / 2), w: Math.round(cw - pad), h: Math.round(ch - pad), rot: (deg * Math.PI) / 180, snap: true, frame: true, border };
    });
    return { kind: 'grid', framed: area, panels: [hero, ...frames], title: rectToPixels(spec.title, W, H, g, g / 2), gutter: g, overlay: false };
  }
  if (layout.kind === 'inset') {
    const hero = { ...rectToPixels(spec.hero, W, H, g, 0), rot: 0, snap: false };
    const border = Math.max(3, Math.round(Math.min(W, H) * 0.009));
    const insets = spec.insets.map(([x0, y0, x1, y1, deg]) => ({ ...rectToPixels([x0, y0, x1, y1], W, H, 0, 0), rot: (deg * Math.PI) / 180, snap: true, frame: true, border }));
    return { kind: 'grid', panels: [hero, ...insets], title: rectToPixels(spec.title, W, H, 0, 0), gutter: g, overlay: true };
  }
  const panels = spec.panels.map((r) => ({ ...rectToPixels(r, W, H, g, g / 2), rot: 0, snap: false }));
  return { kind: 'grid', panels, title: rectToPixels(spec.title, W, H, g, g / 2), gutter: g, overlay: !!spec.overlay };
}

// Key art geometry in pixels: border, art area, slanted panel polygons (with their bounding boxes for the panel
// art and the hit test), the title anchor, the bottom band, the billing line and the dressing anchors.
function keyArtGeometry(spec, W, H) {
  const unit = Math.min(W, H);
  const border = Math.max(4, Math.round(unit * 0.012));
  const frame = Math.max(3, Math.round(unit * 0.0075));
  const billH = Math.round(H * 0.032), bandH = Math.round(H * 0.085);
  const art = { x: border, y: border, w: W - 2 * border, h: H - 2 * border - bandH - billH };
  const px = ([u, v]) => [art.x + u * art.w, art.y + v * art.h];
  const panels = spec.polys.map((poly) => {
    const pts = poly.map(px);
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const x = Math.floor(Math.min(...xs)), y = Math.floor(Math.min(...ys));
    return { x, y, w: Math.ceil(Math.max(...xs)) - x, h: Math.ceil(Math.max(...ys)) - y, rot: 0, snap: false, poly: pts };
  });
  const t = spec.title;
  return {
    kind: 'keyart', panels, gutter: frame, overlay: true, border, frame, art,
    title: { cx: art.x + t.cx * art.w, cy: art.y + t.cy * art.h, w: t.w * W, tilt: (t.tilt * Math.PI) / 180, x: art.x + (t.cx - t.w / 2) * art.w, y: art.y + (t.cy - 0.1) * art.h, h: art.h * 0.2 },
    band: { x: 0, y: art.y + art.h + frame, w: W, h: bandH - frame },
    billing: { x: border, y: H - border - billH, w: W - 2 * border, h: billH },
    seal: px(spec.seal), pill: { x: spec.pill[0] * W, y: art.y + spec.pill[1] * art.h, align: spec.pill[2] },
    tags: spec.tags.map(([i, u, v, deg]) => ({ panel: i, at: px([u, v]), rot: (deg * Math.PI) / 180 })),
  };
}

// Point in polygon (even-odd), for hit tests on slanted panels.
export function insidePoly(poly, x, y) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// Gutter: 12 px per 1080 of the long side, near-black #0b0b12.
export function gutterFor(W, H) {
  return Math.max(6, Math.round((12 * Math.max(W, H)) / 1080 * 0.85));
}

export function aspectClass(W, H) {
  const a = W / H;
  if (a > 1.25) return 'land';
  if (a < 0.9) return 'tall';
  return 'square';
}

// Unit rect -> pixel rect inside an outer frame; each panel is inset by half a gutter so neighbours sit one gutter apart.
function rectToPixels([x0, y0, x1, y1], W, H, frame, inset) {
  const ax = frame / 2, ay = frame / 2, aw = W - frame, ah = H - frame;
  const px0 = Math.round(ax + x0 * aw + inset), py0 = Math.round(ay + y0 * ah + inset);
  const px1 = Math.round(ax + x1 * aw - inset), py1 = Math.round(ay + y1 * ah - inset);
  return { x: px0, y: py0, w: px1 - px0, h: py1 - py0 };
}

function gridCells(x0, y0, x1, y1, cols, rows) {
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push([x0 + ((x1 - x0) * c) / cols, y0 + ((y1 - y0) * r) / rows, x0 + ((x1 - x0) * (c + 1)) / cols, y0 + ((y1 - y0) * (r + 1)) / rows]);
    }
  }
  return cells;
}

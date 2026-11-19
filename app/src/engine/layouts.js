// Cover layouts. Each layout gives, per aspect class (land 16:9, square 1:1, tall 4:5), a list of panels in 0..1 units
// [x0, y0, x1, y1] (grid layouts) or snapshots [cx, cy, w, h, rotDeg], plus a title-block rect. layoutFor() turns
// them into pixels for an exact cover size with scaled black gutters, so a layout re-flows and never stretches.

export const LAYOUTS = {
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
  stripFive: {
    label: 'Strip Five',
    kind: 'grid',
    land: { panels: gridCells(0, 0, 1, 1, 5, 1), title: [0.03, 0.34, 0.97, 0.68], overlay: true },
    square: { panels: gridCells(0, 0, 1, 1, 5, 1), title: [0.03, 0.33, 0.97, 0.67], overlay: true },
    tall: { panels: gridCells(0, 0, 1, 1, 5, 1), title: [0.03, 0.36, 0.97, 0.64], overlay: true },
  },
};

export const LAYOUT_ORDER = ['keyArtNine', 'heroAndSix', 'tiltedSnapshots', 'stripFive'];

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
  const title = rectToPixels(spec.title, W, H, 0, 0);
  if (layout.kind === 'snapshots') {
    const unit = Math.min(W, H);
    const panels = spec.snaps.map(([cx, cy, w, h, rot]) => {
      const pw = w * W, ph = h * H;
      return { x: cx * W - pw / 2, y: cy * H - ph / 2, w: pw, h: ph, rot: (rot * Math.PI) / 180, snap: true, border: Math.round(unit * 0.014) };
    });
    return { kind: 'snapshots', panels, title, gutter: g, overlay: true };
  }
  const panels = spec.panels.map((r) => ({ ...rectToPixels(r, W, H, g, g / 2), rot: 0, snap: false }));
  return { kind: 'grid', panels, title: rectToPixels(spec.title, W, H, g, g / 2), gutter: g, overlay: !!spec.overlay };
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

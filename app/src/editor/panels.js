// Per-panel editing on the live preview: click to select, drag to pan the crop, wheel / slider / +- to zoom,
// double-click to swap in the next photo. While dragging, only grade is applied to the active panel (fast path);
// Poster Ink comes back on pointerup or after 150 ms idle.

import { layoutFor, insidePoly } from '../engine/layouts.js';
import { cropRect } from '../engine/render.js';

export function selectPanel(state, index) {
  state.selected = index;
}

// Move the crop of panel i by (dx, dy) preview pixels; the photo follows the pointer.
export function panPanel(state, i, dx, dy, panelW, panelH) {
  const slot = state.panels[i];
  const photo = slot && state.photos[slot.photo];
  if (!photo) return;
  const { sw, sh } = cropRect(photo, slot, panelW, panelH);
  const minX = sw / 2 / photo.w, minY = sh / 2 / photo.h;
  const fx = clamp(slot.fx, minX, 1 - minX), fy = clamp(slot.fy, minY, 1 - minY);
  slot.fx = clamp(fx - (dx * (sw / panelW)) / photo.w, minX, 1 - minX);
  slot.fy = clamp(fy - (dy * (sh / panelH)) / photo.h, minY, 1 - minY);
}

export function zoomPanel(state, i, zoom) {
  const slot = state.panels[i];
  if (slot) slot.zoom = clamp(zoom, 1, 3);
}

// Which panel is under preview point (x, y)? Snapshots are tested in their own rotated frame.
export function hitTestPanel(state, x, y, W, H) {
  const geo = layoutFor(state.layoutId, W, H);
  for (let i = geo.panels.length - 1; i >= 0; i--) {
    const p = geo.panels[i];
    if (p.poly) { if (insidePoly(p.poly, x, y)) return { index: i, panel: p }; continue; }
    const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
    const c = Math.cos(-p.rot), s = Math.sin(-p.rot);
    const lx = (x - cx) * c - (y - cy) * s, ly = (x - cx) * s + (y - cy) * c;
    if (Math.abs(lx) <= p.w / 2 && Math.abs(ly) <= p.h / 2) return { index: i, panel: p };
  }
  return { index: -1, panel: null };
}

// Pink 4 px outline and 14 px corner crop handles around the selected panel (preview only, never exported).
export function drawSelectionOverlay(ctx, state, W, H) {
  if (state.selected < 0) return null;
  const p = layoutFor(state.layoutId, W, H).panels[state.selected];
  if (!p) return null;
  ctx.save();
  ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
  ctx.rotate(p.rot);
  ctx.strokeStyle = '#ff2e88';
  ctx.lineWidth = 4;
  ctx.strokeRect(-p.w / 2 + 2, -p.h / 2 + 2, p.w - 4, p.h - 4);
  ctx.fillStyle = '#ffffff';
  const hs = 14;
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const hx = (sx * p.w) / 2 - (sx > 0 ? hs : 0), hy = (sy * p.h) / 2 - (sy > 0 ? hs : 0);
    ctx.fillRect(hx, hy, hs, hs);
    ctx.strokeRect(hx, hy, hs, hs);
  }
  ctx.restore();
  return p;
}

// Wire pointer, wheel and double-click on the preview canvas. hooks: { refresh(fast), commit(), changed() }.
export function bindPreviewPointer(canvas, state, hooks) {
  let drag = null, idle = 0;
  const toCanvas = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * canvas.width) / r.width, y: ((e.clientY - r.top) * canvas.height) / r.height };
  };
  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return; // right-click belongs to the panel menu
    const pt = toCanvas(e);
    const { index, panel } = hitTestPanel(state, pt.x, pt.y, canvas.width, canvas.height);
    selectPanel(state, index);
    hooks.changed();
    if (index < 0) { hooks.refresh(false); return; }
    hooks.commit();
    drag = { index, panel, last: pt };
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('dragging');
    hooks.refresh(false);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const pt = toCanvas(e);
    panPanel(state, drag.index, pt.x - drag.last.x, pt.y - drag.last.y, drag.panel.w, drag.panel.h);
    drag.last = pt;
    hooks.refresh(true);
  });
  const end = () => { if (!drag) return; drag = null; canvas.classList.remove('dragging'); hooks.refresh(false); hooks.changed(); };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('wheel', (e) => {
    if (state.selected < 0) return;
    e.preventDefault();
    const slot = state.panels[state.selected];
    if (!slot) return;
    zoomPanel(state, state.selected, slot.zoom * Math.exp(-e.deltaY * 0.0015));
    hooks.refresh(true);
    hooks.changed();
    clearTimeout(idle);
    idle = setTimeout(() => hooks.refresh(false), 150);
  }, { passive: false });
  canvas.addEventListener('dblclick', (e) => {
    const pt = toCanvas(e);
    const { index } = hitTestPanel(state, pt.x, pt.y, canvas.width, canvas.height);
    const slot = state.panels[index];
    if (!slot || state.photos.length < 2) return;
    hooks.commit();
    slot.photo = (slot.photo + 1) % state.photos.length;
    hooks.refresh(false);
  });
}

function clamp(v, a, b) {
  return a > b ? (a + b) / 2 : Math.min(b, Math.max(a, v));
}

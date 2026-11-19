// Right-rail and tray controls: layout tiles (mini drawings), grade swatches (colour chips), Poster Ink toggle and
// strength, caption fields, size buttons, photo tray. Each builder calls onChange(kind) after changing the state.

import { LAYOUTS, LAYOUT_ORDER, COVER_SIZES, layoutFor } from '../engine/layouts.js';
import { GRADES, GRADE_ORDER } from '../engine/grades.js';

export function buildLayoutTiles(root, state, onChange) {
  root.textContent = '';
  for (const id of LAYOUT_ORDER) {
    const b = document.createElement('button');
    b.type = 'button';
    b.title = LAYOUTS[id].label;
    b.dataset.layout = id;
    const c = document.createElement('canvas');
    drawLayoutThumb(c, id, state.size.w, state.size.h);
    b.appendChild(c);
    b.addEventListener('click', () => { state.layoutId = id; onChange('layout'); });
    root.appendChild(b);
  }
  syncLayoutTiles(root, state);
}

export function syncLayoutTiles(root, state) {
  root.querySelectorAll('button').forEach((b) => {
    b.classList.toggle('on', b.dataset.layout === state.layoutId);
    drawLayoutThumb(b.querySelector('canvas'), b.dataset.layout, state.size.w, state.size.h);
  });
}

export function buildGradeSwatches(root, state, onChange) {
  root.textContent = '';
  for (const id of GRADE_ORDER) {
    const g = GRADES[id];
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.grade = id;
    b.title = g.label;
    b.textContent = g.label.split(' ')[0];
    b.style.background = `linear-gradient(90deg, ${g.stops.map(([s, c]) => `${c} ${Math.round(s * 100)}%`).join(', ')})`;
    b.addEventListener('click', () => { state.gradeId = id; onChange('grade'); });
    root.appendChild(b);
  }
  syncGradeSwatches(root, state);
}

export function syncGradeSwatches(root, state) {
  root.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.grade === state.gradeId));
}

export function bindInkControls(toggle, slider, state, onChange) {
  toggle.addEventListener('change', () => { state.ink.on = toggle.checked; onChange('ink'); });
  slider.addEventListener('change', () => { state.ink.strength = +slider.value; onChange('ink'); });
}

export function bindCaptionFields(fields, state, onChange) {
  for (const [key, input] of Object.entries(fields)) {
    input.addEventListener('input', () => { state.caption[key] = input.value; onChange('caption'); });
  }
}

// Poster extras (key-art layout): five toggles (data-extra) and the quote / panel-tag fields (data-quote, data-tag).
// A toggle is one undo step; typing goes through 'caption', so a burst of keystrokes is one step too.
export function bindPosterExtras(root, state, onChange) {
  root.querySelectorAll('input[data-extra]').forEach((box) => {
    box.addEventListener('change', () => { state.dressing = { ...state.dressing, [box.dataset.extra]: box.checked }; onChange('extras'); });
  });
  const quote = root.querySelector('input[data-quote]');
  quote.addEventListener('input', () => { state.caption.quote = quote.value; onChange('caption'); });
  root.querySelectorAll('input[data-tag]').forEach((f) => {
    f.addEventListener('input', () => {
      const tags = [...(state.caption.tags ?? ['', '', ''])];
      tags[+f.dataset.tag] = f.value;
      state.caption.tags = tags;
      onChange('caption');
    });
  });
}

export function syncPosterExtras(root, state) {
  root.querySelectorAll('input[data-extra]').forEach((box) => { box.checked = state.dressing?.[box.dataset.extra] !== false; });
  root.querySelector('input[data-quote]').value = state.caption.quote ?? '';
  root.querySelectorAll('input[data-tag]').forEach((f) => { f.value = state.caption.tags?.[+f.dataset.tag] ?? ''; });
}

export function buildSizeButtons(root, state, onChange) {
  root.textContent = '';
  for (const s of COVER_SIZES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.size = `${s.w}x${s.h}`;
    b.innerHTML = `${s.label}<br><small>${s.sub}</small>`;
    b.addEventListener('click', () => { state.size = { w: s.w, h: s.h }; onChange('size'); });
    root.appendChild(b);
  }
  syncSizeButtons(root, state);
}

export function syncSizeButtons(root, state) {
  root.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.size === `${state.size.w}x${state.size.h}`));
}

// Photo tray: one thumbnail per photo; click puts it into the selected panel. Used photos get a teal ring.
export function renderPhotoTray(root, state, onPick) {
  root.textContent = '';
  const used = new Set(state.panels.map((p) => p && p.photo));
  state.photos.forEach((photo, i) => {
    const img = document.createElement('img');
    img.src = photo.url;
    img.alt = photo.name;
    img.title = `${photo.name}: click to put it in the selected panel`;
    if (used.has(i)) img.classList.add('used');
    img.addEventListener('click', () => onPick(i));
    root.appendChild(img);
  });
}

// Mini drawing of a layout: sunset-toned panels on near-black, the title block in pink.
function drawLayoutThumb(c, id, W, H) {
  const tw = 52, th = Math.round((52 * H) / W);
  c.width = tw; c.height = th;
  const ctx = c.getContext('2d');
  const geo = layoutFor(id, W, H);
  const k = tw / W;
  ctx.fillStyle = geo.kind === 'snapshots' ? '#5a1a6a' : '#0b0b12';
  ctx.fillRect(0, 0, tw, th);
  const tones = ['#ff8a3d', '#ff5a7a', '#ffd23f', '#c23a8a', '#19e3d0', '#ff9a5a', '#e0407a', '#ffb347', '#9a3aa0'];
  geo.panels.forEach((p, i) => {
    ctx.save();
    ctx.translate((p.x + p.w / 2) * k, (p.y + p.h / 2) * k);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.snap ? '#f6efe0' : tones[i % tones.length];
    ctx.fillRect((-p.w / 2) * k, (-p.h / 2) * k, Math.max(1, p.w * k - 1), Math.max(1, p.h * k - 1));
    if (p.snap) { ctx.fillStyle = tones[i % tones.length]; ctx.fillRect((-p.w / 2) * k + 1.5, (-p.h / 2) * k + 1.5, p.w * k - 3, p.h * k - 5); }
    ctx.restore();
  });
  const t = geo.title;
  ctx.fillStyle = geo.overlay ? 'rgba(26,11,46,0.85)' : '#3a0f4a';
  ctx.fillRect(t.x * k, t.y * k + t.h * k * 0.25, t.w * k, t.h * k * 0.5);
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(t.x * k + t.w * k * 0.2, t.y * k + t.h * k * 0.38, t.w * k * 0.6, Math.max(2, t.h * k * 0.22));
}

// Studio state: photos, layout, grade, Poster Ink, caption, export size, per-panel crops, selected panel.
// pushHistory/undo/redo keep snapshots of everything except the photo pixels.

export function createStudioState() {
  return {
    photos: [],
    layoutId: 'keyArtSlash',
    gradeId: 'sunsetStrip',
    ink: { on: true, strength: 0.8 },
    caption: {
      title: 'HEATWAVE', subtitle: 'Coastline Nights', tagline: 'IN STORES SOMEWHERE SOON',
      quote: '"HOTTER THAN THE ASPHALT" — THE PALM GAZETTE',
      tags: ['THE CLOSER', 'CORAL CAUSEWAY · 7:15 PM', 'THE FIXER'],
    },
    // Poster extras on the key-art layout; each one is a toggle in the Caption section.
    dressing: { stars: true, heat: true, seal: true, tags: true, billing: true },
    size: { w: 1920, h: 1080 },
    panels: [],
    selected: -1,
    step: 1,
    history: [],
    future: [],
  };
}

// Call BEFORE a change: remembers the state as it is now.
export function pushHistory(state) {
  pushSnapshot(state, snapshot(state));
}

// Call AFTER a change with the snapshot taken before it (the editor keeps the last settled one); equal neighbours
// are skipped so a no-op click does not cost an undo step.
export function pushSnapshot(state, json) {
  if (state.history[state.history.length - 1] === json) return;
  state.history.push(json);
  if (state.history.length > 60) state.history.shift();
  state.future.length = 0;
}

export function snapshotState(state) {
  return snapshot(state);
}

export function undo(state) {
  if (!state.history.length) return false;
  state.future.push(snapshot(state));
  restore(state, state.history.pop());
  return true;
}

export function redo(state) {
  if (!state.future.length) return false;
  state.history.push(snapshot(state));
  restore(state, state.future.pop());
  return true;
}

// Settings kept in localStorage between visits: layout, grade, Poster Ink, caption and size. Photos stay on the
// person's device and are never stored (they can be large; the status line says so).
const SETTINGS_KEY = 'heatwave-cover-studio/settings-v1';

export function saveStudioSettings(state) {
  const { layoutId, gradeId, ink, caption, dressing, size } = state;
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ layoutId, gradeId, ink, caption, dressing, size })); return true; } catch { return false; }
}

// Restores what is valid (known layout and grade ids, one of the export sizes) and ignores the rest.
export function loadStudioSettings(state, { layouts, grades, sizes }) {
  let saved;
  try { saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null'); } catch { saved = null; }
  if (!saved || typeof saved !== 'object') return false;
  if (layouts[saved.layoutId]) state.layoutId = saved.layoutId;
  if (grades[saved.gradeId]) state.gradeId = saved.gradeId;
  if (saved.ink && typeof saved.ink.on === 'boolean') state.ink = { on: saved.ink.on, strength: Math.max(0, Math.min(1, +saved.ink.strength || 0.8)) };
  if (saved.caption) for (const k of ['title', 'subtitle', 'tagline']) if (typeof saved.caption[k] === 'string') state.caption[k] = saved.caption[k].slice(0, 40);
  if (saved.caption && typeof saved.caption.quote === 'string') state.caption.quote = saved.caption.quote.slice(0, 60);
  if (saved.caption && Array.isArray(saved.caption.tags)) state.caption.tags = [0, 1, 2].map((i) => (typeof saved.caption.tags[i] === 'string' ? saved.caption.tags[i].slice(0, 28) : state.caption.tags[i]));
  if (saved.dressing && typeof saved.dressing === 'object') for (const k of Object.keys(state.dressing)) if (typeof saved.dressing[k] === 'boolean') state.dressing[k] = saved.dressing[k];
  if (saved.size && sizes.some((s) => s.w === saved.size.w && s.h === saved.size.h)) state.size = { w: saved.size.w, h: saved.size.h };
  return true;
}

function snapshot(s) {
  return JSON.stringify({ layoutId: s.layoutId, gradeId: s.gradeId, ink: s.ink, caption: s.caption, dressing: s.dressing, size: s.size, panels: s.panels });
}

function restore(s, json) {
  Object.assign(s, JSON.parse(json));
}

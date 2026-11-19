// Studio state: photos, layout, grade, Poster Ink, caption, export size, per-panel crops, selected panel.
// pushHistory/undo/redo keep snapshots of everything except the photo pixels.

export function createStudioState() {
  return {
    photos: [],
    layoutId: 'keyArtNine',
    gradeId: 'sunsetStrip',
    ink: { on: true, strength: 0.8 },
    caption: { title: 'HEATWAVE', subtitle: 'Coastline Nights', tagline: 'IN STORES SOMEWHERE SOON' },
    size: { w: 1920, h: 1080 },
    panels: [],
    selected: -1,
    step: 1,
    history: [],
    future: [],
  };
}

export function pushHistory(state) {
  state.history.push(snapshot(state));
  if (state.history.length > 60) state.history.shift();
  state.future.length = 0;
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

function snapshot(s) {
  return JSON.stringify({ layoutId: s.layoutId, gradeId: s.gradeId, ink: s.ink, caption: s.caption, size: s.size, panels: s.panels });
}

function restore(s, json) {
  Object.assign(s, JSON.parse(json));
}
